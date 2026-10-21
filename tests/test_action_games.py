"""Gameplay regressions for the maze, Geometry Run and local Snake Arena."""
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import os
import time
import unittest
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
class ActionGames(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
        Thread(target=cls.server.serve_forever,daemon=True).start()
        cls.base='http://127.0.0.1:'+str(cls.server.server_port)
        cls.p=sync_playwright().start()
        cls.browser=cls.p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()
    @contextmanager
    def page(self,path,width=1100,manual_frames=False,touch=False):
        ctx=self.browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce',has_touch=touch,is_mobile=touch)
        ctx.add_init_script('localStorage.setItem("spinner:consent:v1",JSON.stringify({version:1,preferences:false,savedAt:Date.now()}));')
        if manual_frames:ctx.add_init_script('window.requestAnimationFrame=()=>0;')
        page=ctx.new_page();page.set_default_timeout(7000)
        errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(self.base+path)
        try:
            yield page
            self.assertEqual(errors,[])
        finally:ctx.close()
    def route(self,cells,size,start,end):
        queue=[start];parents={start:None};offsets=[-size,1,size,-1];names=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft']
        for cell in queue:
            if cell==end:break
            for direction in range(4):
                if cells[cell]&(1<<direction):continue
                nxt=cell+offsets[direction]
                if nxt not in parents:parents[nxt]=(cell,names[direction]);queue.append(nxt)
        self.assertIn(end,parents)
        result=[]
        while parents[end] is not None:
            end,key=parents[end];result.append(key)
        return result[::-1]
    def test_every_maze_is_connected_and_keys_are_reachable(self):
        with self.page('/games/neonmaze.html') as page:
            for mode in ['amator','easy','medium','hard']:
                page.evaluate('(mode)=>maze.start({mode,seed:314159})',mode)
                data=page.evaluate('({cells:maze.cells,size:maze.size,keys:maze.keys})')
                cells,n=data['cells'],data['size']
                for end in range(n*n):self.route(cells,n,0,end)
                self.assertEqual(len({key['cell'] for key in data['keys']}),3)
                self.assertTrue(all(0<key['cell']<n*n-1 for key in data['keys']))
                for y in range(n):
                    for x in range(n):
                        wall=cells[y*n+x]
                        if y==0:self.assertTrue(wall&1)
                        if x==n-1:self.assertTrue(wall&2)
                        if y==n-1:self.assertTrue(wall&4)
                        if x==0:self.assertTrue(wall&8)
                        if x<n-1:self.assertEqual(bool(wall&2),bool(cells[y*n+x+1]&8))
    def test_maze_can_be_completed_by_real_keys_and_restarted_on_same_route(self):
        with self.page('/games/neonmaze.html',390) as page:
            page.locator('#difficulty').select_option('amator');page.locator('#start-btn').click()
            data=page.evaluate('({cells:maze.cells,size:maze.size,keys:maze.keys,seed:maze.seed})')
            previous=0
            for target in [*[key['cell'] for key in data['keys']],data['size']**2-1]:
                for key in self.route(data['cells'],data['size'],previous,target):page.keyboard.press(key)
                previous=target
            self.assertTrue(page.evaluate('maze.won'))
            expect(page.locator('#maze-summary')).to_be_visible()
            expect(page.locator('#coins-txt')).to_have_text('3 / 3')
            self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
            page.locator('#maze-restart').click()
            self.assertEqual(page.evaluate('maze.seed'),data['seed'])
            self.assertEqual(page.evaluate('maze.cells'),data['cells'])
            self.assertEqual(page.evaluate('maze.steps'),0)
            self.assertEqual(page.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])
            # A finished maze can advance to a larger, still connected stage.
            page.evaluate('maze.finish()');page.locator('#maze-next').click()
            self.assertEqual(page.evaluate('level'),2)
            self.assertEqual(page.evaluate('maze.size'),11)
    def test_maze_pointerdown_moves_before_pointerup_and_pause_stops_timer(self):
        with self.page('/games/neonmaze.html',390) as page:
            page.locator('#start-btn').click()
            direction=page.evaluate('Object.keys(directions).find((_,i)=>!(maze.cells[0]&(1<<i)))')
            box=page.locator('#btn-'+direction).bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down()
            self.assertEqual(page.evaluate('maze.steps'),1)
            page.mouse.up();page.locator('#maze-pause').click();before=page.evaluate('maze.elapsed');page.wait_for_timeout(150)
            self.assertEqual(page.evaluate('maze.elapsed'),before)
            page.locator('#maze-resume').click();page.wait_for_timeout(80);self.assertGreater(page.evaluate('maze.elapsed'),before)
    def test_geometry_retry_is_same_route_and_jump_and_pause_work(self):
        with self.page('/games/geometry-game.html') as page:
            page.locator('#run-start').click();route=page.evaluate('JSON.stringify(engine.obstacles)')
            page.keyboard.down('Space');page.wait_for_timeout(40);page.keyboard.up('Space')
            self.assertLess(page.evaluate('engine.vy'),0)
            page.locator('#run-pause').click();state=page.evaluate('[engine.distance,engine.y]');page.wait_for_timeout(140)
            self.assertEqual(page.evaluate('[engine.distance,engine.y]'),state)
            page.locator('#run-resume').click();page.wait_for_function('engine.state==="dead"',timeout=6500)
            expect(page.locator('#deathScreen')).to_be_visible();page.locator('#run-retry').click()
            self.assertEqual(page.evaluate('JSON.stringify(engine.obstacles)'),route)
            self.assertLess(page.evaluate('engine.distance'),35)
            self.assertEqual(page.evaluate('engine.state'),'running')
    def test_geometry_restart_from_menu_honors_training_choice(self):
        with self.page('/games/geometry-game.html',manual_frames=True) as page:
            page.locator('#run-practice').uncheck();page.locator('#run-restart').click()
            self.assertFalse(page.evaluate('engine.practice'))
            page.evaluate('closeOverlayAndReset()');page.locator('#run-practice').check();page.locator('#gameCanvas').focus();page.keyboard.press('r')
            self.assertTrue(page.evaluate('engine.practice'))
    def test_geometry_and_arena_simulation_agree_at_30_and_120_render_fps(self):
        for path,setup,read in [('/games/geometry-game.html','engine.start();lastTime=0;accumulator=0;','engine.distance'),('/games/snake.html','game.start();game.foods=[];lastTime=0;accumulator=0;','game.player.x')]:
            positions=[]
            with self.page(path,manual_frames=True) as page:
                for fps in [30,120]:
                    positions.append(page.evaluate('({fps,setup,read})=>{eval(setup);for(let i=1;i<=fps;i++)frame(i*1000/fps);return eval(read);}',{'fps':fps,'setup':setup,'read':read}))
            self.assertAlmostEqual(positions[0],positions[1],delta=2.1,msg=path)
            self.assertGreater(positions[0],220 if 'geometry' in path else 1300)
    def test_geometry_resize_preserves_physics_and_checkpoint_retry_cannot_farm_tokens(self):
        with self.page('/games/geometry-game.html',manual_frames=True) as page:
            page.locator('#run-start').click();page.keyboard.press('Space');page.evaluate('engine.update(1/120)')
            before=page.evaluate('[engine.distance,engine.y,engine.vy]');page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(40)
            self.assertEqual(page.evaluate('[engine.distance,engine.y,engine.vy]'),before)
            self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
            page.evaluate('engine.checkpoint=2400;engine.tokens.forEach(t=>t.taken=true);engine.coins=99;engine.reset(true)')
            self.assertEqual(page.evaluate('engine.coins'),page.evaluate('engine.tokens.filter(t=>t.x<2400).length'))
            page.evaluate('engine.pause("dialog")');before=page.evaluate('[engine.distance,engine.y]');page.evaluate('engine.update(1)')
            self.assertEqual(page.evaluate('[engine.distance,engine.y]'),before)
    def test_geometry_routes_are_physically_finishable_at_every_speed(self):
        with self.page('/games/geometry-game.html',manual_frames=True) as page:
            for seed in [0,42,4294967295]:
                for speed in [1,1.18,1.38]:
                    result=page.evaluate('''({seed,speed})=>{
                      engine.seed=seed;setDifficulty(speed);document.querySelector('#run-practice').checked=false;engine.start();
                      for(let step=0;step<8000&&engine.state==='running';step++){
                        if(engine.mode==='ship')input.held=engine.y+13+engine.vy*.2>180;
                        else{
                          input.held=false;
                          const next=engine.obstacles.find(o=>o.type==='spike'&&o.x+o.w>engine.distance);
                          if(next&&next.x-engine.distance<96&&engine.onGround)input.buffer=.12;
                        }
                        engine.update(1/120);
                      }
                      return engine.state;
                    }''',{'seed':seed,'speed':speed})
                    self.assertEqual(result,'won',(seed,speed))
    def test_arena_aim_keyboard_pause_real_leaderboard_and_restart(self):
        with self.page('/games/snake.html') as page:
            page.locator('#nickInput').fill('<b>Ty</b>');page.locator('#start-btn').click()
            rect=page.locator('#gameCanvas').bounding_box();page.mouse.move(rect['x']+rect['width']/2+90,rect['y']+rect['height']/2)
            self.assertAlmostEqual(page.evaluate('game.player.targetAngle'),0,places=2)
            page.keyboard.down('ArrowDown');self.assertAlmostEqual(page.evaluate('game.player.targetAngle'),1.570796,places=4);page.keyboard.up('ArrowDown')
            page.evaluate('game.player.mass=99;game.updateHud()');expect(page.locator('#leaderboard li.me span')).to_have_text('<b>Ty</b>')
            expect(page.locator('#leaderboard li.me b')).to_have_text('99');self.assertEqual(page.locator('#leaderboard b b').count(),0)
            page.locator('#arena-pause').click();before=page.evaluate('[game.player.x,game.player.y,game.elapsed]');page.wait_for_timeout(120)
            self.assertEqual(page.evaluate('[game.player.x,game.player.y,game.elapsed]'),before)
            page.locator('#arena-resume').click();page.evaluate('game.player.shield=0;game.player.x=1;game.player.y=1200;game.player.angle=Math.PI;game.player.targetAngle=Math.PI;game.update(1/120)')
            expect(page.locator('#death-overlay')).to_be_visible();page.locator('#restart-btn').click()
            self.assertEqual(page.evaluate('game.snakes.length'),11);self.assertTrue(page.evaluate('game.isRunning'))
            page.set_viewport_size({'width':390,'height':844});page.wait_for_function('game.canvas.width===document.querySelector("#game-container").clientWidth')
            self.assertLess(page.evaluate('game.canvas.width'),390)
            self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
    def test_themes_do_not_reset_each_game_and_dialog_pause_is_idempotent(self):
        for path,start,obj in [('/games/neonmaze.html','#start-btn','maze'),('/games/geometry-game.html','#run-start','engine'),('/games/snake.html','#start-btn','game')]:
            with self.page(path,390) as page:
                page.locator(start).click();page.evaluate("SpinnerGame.pause('dialog');SpinnerGame.pause('dialog')")
                expected=page.evaluate('({obj})=>obj==="maze"?maze.steps:obj==="engine"?engine.distance:game.player.x',{'obj':obj})
                for mode in ['dark','light']:
                    page.evaluate('(mode)=>SpinnerTheme.set(mode)',mode)
                    self.assertEqual(page.evaluate('({obj})=>obj==="maze"?maze.steps:obj==="engine"?engine.distance:game.player.x',{'obj':obj}),expected)
                    expect(page.locator('html')).to_have_attribute('data-theme',mode)
                    self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
    def test_arena_real_touch_joystick_and_boost_release(self):
        with self.page('/games/snake.html',390,touch=True) as page:
            page.locator('#start-btn').tap()
            joystick=page.locator('#joystick-container').bounding_box()
            page.touchscreen.tap(joystick['x']+joystick['width']/2,joystick['y']+joystick['height']/2+25)
            self.assertAlmostEqual(page.evaluate('game.player.targetAngle'),1.570796,places=4)
            page.locator('#boost-btn').scroll_into_view_if_needed();box=page.locator('#boost-btn').bounding_box()
            cdp=page.context.new_cdp_session(page)
            cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':box['x']+box['width']/2,'y':box['y']+box['height']/2}]})
            self.assertTrue(page.evaluate('game.player.isBoosting'))
            cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
            self.assertFalse(page.evaluate('game.player.isBoosting'))
            page.evaluate('game.snakes=[game.player,game.snakes[1]];for(const s of game.snakes){s.x=1200;s.y=1200;s.shield=0;}game.update(1/120)')
            self.assertFalse(page.evaluate('game.isRunning'))
            expect(page.locator('#death-overlay')).to_be_visible()
if __name__=='__main__':unittest.main(verbosity=2)
