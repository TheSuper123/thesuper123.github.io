"""Gameplay regressions for the orchard Snake and original Mały lot.

The controlled rAF clock drives real input handlers and physics at different frame
rates; no production accounts, external services or artificial engine hooks.
"""
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

ROOT = Path(__file__).resolve().parents[1]
CONTROLLED_FRAMES = """(() => {
 let id=0;window.frameTime=1000;window.frameCallbacks=new Map();
 Object.defineProperty(performance,'now',{value:()=>window.frameTime});
 window.requestAnimationFrame=callback=>{window.frameCallbacks.set(++id,callback);return id;};
 window.cancelAnimationFrame=handle=>window.frameCallbacks.delete(handle);
 window.advanceFrame=ms=>{window.frameTime+=ms;const callbacks=[...window.frameCallbacks.values()];window.frameCallbacks.clear();callbacks.forEach(cb=>cb(window.frameTime));};
})();"""

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_): pass

class SnakeFlightChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
        Thread(target=cls.server.serve_forever,daemon=True).start()
        cls.base='http://127.0.0.1:'+str(cls.server.server_port)
        cls.playwright=sync_playwright().start()
        cls.browser=cls.playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.playwright.stop();cls.server.shutdown();cls.server.server_close()

    @contextmanager
    def page(self, path, controlled=False, consent=False, width=390):
        context=self.browser.new_context(viewport={'width':width,'height':844},reduced_motion='no-preference')
        receipt=json.dumps({'version':1,'preferences':consent,'savedAt':int(time.time()*1000)})
        context.add_init_script('localStorage.setItem("spinner:consent:v1",'+json.dumps(receipt)+')')
        if controlled:context.add_init_script(CONTROLLED_FRAMES)
        page=context.new_page();page.set_default_timeout(7000)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(self.base+path)
        try:
            yield page
            self.assertEqual(errors,[])
        finally:context.close()

    def test_snake_pointerdown_accepts_two_quick_turns_before_release(self):
        with self.page('/games/neonsnake1.html',controlled=True) as page:
            at_start=page.evaluate("startGame();({...snake[0]})")
            up=page.locator('[data-direction=UP]').bounding_box()
            page.mouse.move(up['x']+up['width']/2,up['y']+up['height']/2)
            page.mouse.down()
            # The direction must be accepted while the physical mouse remains down.
            self.assertEqual(page.evaluate('[...inputQueue]'),['UP'])
            page.mouse.up()
            left=page.locator('[data-direction=LEFT]').bounding_box()
            page.mouse.move(left['x']+left['width']/2,left['y']+left['height']/2)
            page.mouse.down()
            self.assertEqual(page.evaluate('[...inputQueue]'),['UP','LEFT'])
            page.mouse.up()
            result=page.evaluate("""() => {
              const queued=[...inputQueue];stepSnake();const first={...snake[0]};stepSnake();
              return {queued,first,second:{...snake[0]},phase};
            }""")
            result['atStart']=at_start
            self.assertEqual(result['queued'],['UP','LEFT'])
            self.assertEqual(result['first'],{'x':result['atStart']['x'],'y':result['atStart']['y']-1})
            self.assertEqual(result['second'],{'x':result['atStart']['x']-1,'y':result['atStart']['y']-1})
            self.assertEqual(result['phase'],'running')

    def test_snake_reversal_tail_growth_wrap_and_full_board(self):
        with self.page('/games/neonsnake1.html',controlled=True) as page:
            result=page.evaluate("""() => {
              startGame();const reverse=changeDir('LEFT');
              snake=[{x:2,y:2},{x:2,y:3},{x:1,y:3},{x:1,y:2}];d='UP';inputQueue=['LEFT'];food={x:8,y:8};stepSnake();
              const tailAllowed=phase==='running'&&snake[0].x===1&&snake.length===4;
              snake=[{x:4,y:4},{x:3,y:4},{x:2,y:4}];d='RIGHT';inputQueue=[];food={x:5,y:4};stepSnake();
              const grew=snake.length===4&&score===1;
              mode='wrap';snake=[{x:0,y:2},{x:1,y:2},{x:2,y:2}];d='LEFT';inputQueue=[];food={x:8,y:8};stepSnake();
              const wrapped=snake[0].x===gridSize-1&&phase==='running';
              gridSize=3;box=140;mode='classic';snake=[{x:1,y:0},{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:1,y:2},{x:2,y:2},{x:2,y:1},{x:1,y:1}];d='RIGHT';inputQueue=[];food={x:2,y:0};bonus=null;stepSnake();
              const won=phase==='over'&&snake.length===9,title=document.querySelector('#status').textContent;
              startGame();gridSize=3;box=140;snake=[{x:1,y:0},{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:1,y:2},{x:2,y:2},{x:1,y:1}];d='RIGHT';inputQueue=[];food={x:2,y:0};bonus={x:2,y:1,expires:6500};stepSnake();
              const bonusFreed=phase==='running'&&snake.length===8&&food.x===2&&food.y===1&&bonus===null;
              return {reverse,tailAllowed,grew,wrapped,won,title,bonusFreed};
            }""")
            self.assertFalse(result['reverse'])
            for key in ['tailAllowed','grew','wrapped','won','bonusFreed']:self.assertTrue(result[key],key)
            self.assertIn('Cały sad',result['title'])

    def test_snake_pause_restart_single_loop_and_no_frame_rate_speedup(self):
        with self.page('/games/neonsnake1.html',controlled=True) as page:
            result=page.evaluate("""() => {
              startGame();startGame();startGame();food={x:19,y:19};
              for(let i=0;i<12;i++)advanceFrame(1000/120);
              const before={...snake[0]};advanceFrame(10);const after={...snake[0]};
              SpinnerGame.pause('test');SpinnerGame.pause('test');const paused={...snake[0]};advanceFrame(2000);
              const didPause=phase==='paused'&&JSON.stringify(paused)===JSON.stringify(snake[0]);pauseSnake();advanceFrame(16);
              return {before,after,didPause,resumed:phase==='running',head:{...snake[0]},callbacks:frameCallbacks.size};
            }""")
            self.assertEqual(result['before']['x'],5)
            self.assertEqual(result['after']['x'],6)
            self.assertTrue(result['didPause']);self.assertTrue(result['resumed'])
            self.assertEqual(result['head']['x'],6)
            self.assertEqual(result['callbacks'],1)

    def test_snake_records_respect_consent_and_survive_reload_when_allowed(self):
        for consent in [False,True]:
            with self.subTest(consent=consent),self.page('/games/neonsnake1.html',controlled=True,consent=consent) as page:
                page.evaluate("startGame();food={x:6,y:10};stepSnake();")
                expect(page.locator('#snake-best')).to_have_text('1')
                keys=page.evaluate('Object.keys(localStorage).filter(key=>key.startsWith("spinner:prefs:snake:"))')
                self.assertEqual(bool(keys),consent)
                page.reload()
                expect(page.locator('#snake-best')).to_have_text('1' if consent else '0')

    def test_flight_physics_match_at_30_and_144_hz_and_pause_has_no_jump(self):
        outcomes=[]
        with self.page('/flappy.html',controlled=True) as page:
            for fps in [30,144]:
                outcomes.append(page.evaluate("""fps => {
                  document.querySelector('#bird-start').click();let remaining=600;
                  while(remaining>0.0001){const delta=Math.min(1000/fps,remaining);advanceFrame(delta);remaining-=delta;}
                  const state=SpinnerGame.state;SpinnerGame.pause('test');SpinnerGame.pause('test');advanceFrame(4000);const paused=SpinnerGame.state;
                  document.querySelector('#bird-resume').click();advanceFrame(1000/144);
                  return {state,paused,resumed:SpinnerGame.state};
                }""",fps))
            for outcome in outcomes:
                self.assertEqual(outcome['state']['phase'],'running')
                self.assertEqual(outcome['paused']['phase'],'paused')
                self.assertEqual(outcome['paused']['bird'],outcome['state']['bird'])
                self.assertEqual(outcome['resumed']['phase'],'running')
                self.assertLess(abs(outcome['resumed']['bird']['y']-outcome['paused']['bird']['y']),5)
            self.assertLess(abs(outcomes[0]['state']['bird']['y']-outcomes[1]['state']['bird']['y']),3)
            self.assertLess(abs(outcomes[0]['state']['bird']['vy']-outcomes[1]['state']['bird']['vy']),10)

    def test_flight_pointerdown_flaps_without_waiting_for_click_or_release(self):
        with self.page('/flappy.html',controlled=True) as page:
            result=page.evaluate("""() => {
              document.querySelector('#bird-start').click();for(let i=0;i<50;i++)advanceFrame(1000/120);
              const before=SpinnerGame.state.bird.vy;
              document.querySelector('#bird-flap').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7}));
              return {before,after:SpinnerGame.state.bird.vy};
            }""")
            self.assertGreater(result['before'],0);self.assertLess(result['after'],-300)

    def test_flight_every_difficulty_is_playable_and_gates_are_bounded(self):
        with self.page('/flappy.html',controlled=True) as page:
            for mode in ['calm','classic','quick']:
                with self.subTest(mode=mode):
                    result=page.evaluate("""mode => {
                      document.querySelector('#bird-difficulty').value=mode;document.querySelector('#bird-start').click();
                      let valid=true,steps=0;
                      while(SpinnerGame.state.phase==='running'&&steps++<1250){
                        const state=SpinnerGame.state,pipe=state.pipes.find(p=>p.x+55>state.bird.x-9);
                        const target=pipe?pipe.top+pipe.gap/2:235;
                        if(state.bird.y>target+18&&state.bird.vy>0)document.querySelector('#game').dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true}));
                        valid=valid&&state.pipes.every(p=>p.top>=63&&p.top+p.gap<=425);
                        advanceFrame(1000/120);
                      }
                      return {state:SpinnerGame.state,valid,steps};
                    }""",mode)
                    self.assertTrue(result['valid'])
                    self.assertEqual(result['state']['phase'],'running',str(result))
                    self.assertGreaterEqual(result['state']['score'],3)

    def test_both_themes_and_mobile_controls_fit_without_overflow(self):
        for path in ['/games/neonsnake1.html','/flappy.html']:
            with self.subTest(path=path),self.page(path,width=320) as page:
                for theme in ['light','dark']:
                    page.evaluate('(mode)=>SpinnerTheme.set(mode)',theme)
                    self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
                    expect(page.locator('canvas')).to_be_visible()
                    expect(page.locator('button[id$="start"]')).to_be_visible()

if __name__=='__main__':unittest.main(verbosity=2)
