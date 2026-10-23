"""No scrolling between the board and controls, in real player and standalone pages."""
import unittest
import time
from playwright.sync_api import expect
from test_more_games import MoreGames

class ViewportChecks(MoreGames):
    def test_slow_game_engine_initialization_still_puts_settings_in_options(self):
        with self.page(width=390) as p:
            def delayed(route):
                time.sleep(.2)
                route.continue_()
            p.route('**/assets/game-backgammon.js',delayed)
            p.goto(self.base+'/games/backgammon.html');self.settled(p)
            expect(p.locator('.gv-actions select')).to_have_count(0)
            expect(p.locator('.gv-settings select')).to_have_count(1)
            p.locator('.gv-options').click();p.get_by_label('RYWAL',exact=True).select_option('local')
            p.get_by_role('button',name='Zamknij opcje',exact=True).click()
            self.assertEqual(p.evaluate('MoreGame.snapshot().mode'),'local')
            before=p.evaluate('MoreGame.snapshot().board')
            for width,height,columns in [(320,568,6),(844,390,12),(390,844,6)]:
                p.set_viewport_size({'width':width,'height':height});self.settled(p)
                expect(p.locator('#board')).to_have_attribute('data-columns',str(columns))
                self.assert_screen(p,'responsive backgammon')
                self.assertEqual(p.evaluate('MoreGame.snapshot().board'),before)

    def settled(self,frame):
        frame.wait_for_function('document.body.dataset.viewportReady')
        frame.evaluate('document.fonts.ready')
        frame.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')

    def assert_screen(self,frame,game):
        data=frame.evaluate('''()=>{
          const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,label:e.id||e.getAttribute('aria-label')||e.textContent.slice(0,25)}};
          const b=document.querySelector('.gv-board')||document.querySelector('main');
          const buttons=[...document.querySelectorAll('.gv-input button,.gv-actions button')].filter(e=>e.getBoundingClientRect().height&&!e.closest('[hidden]'));
          const surfaces=[...b.querySelectorAll('canvas:not(#next-canvas):not(#hold-canvas),.sudoku-board,.tiles-board,.memory-board')].filter(e=>e.getBoundingClientRect().height);
          return{w:innerWidth,h:innerHeight,scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],board:rect(b),controls:buttons.map(rect),surfaces:surfaces.map(rect)};
        }''')
        self.assertLessEqual(data['scroll'][0],data['w']+1,(game,data))
        self.assertLessEqual(data['scroll'][1],data['h']+1,(game,data))
        self.assertGreaterEqual(data['board']['w'],120,(game,data))
        self.assertGreaterEqual(data['board']['h'],90,(game,data))
        for r in [data['board'],*data['controls'],*data['surfaces']]:
            self.assertGreaterEqual(r['x'],-1,(game,r,data))
            self.assertGreaterEqual(r['y'],-1,(game,r,data))
            self.assertLessEqual(r['x']+r['w'],data['w']+1,(game,r,data))
            self.assertLessEqual(r['y']+r['h'],data['h']+1,(game,r,data))

    def test_all_hundred_games_fit_board_and_controls_on_small_portrait_landscape_desktop(self):
        with self.page() as p:
            games=p.evaluate('SpinnerGames')
            self.assertEqual(len(games),100)
            for width,height in [(320,568),(390,844),(844,390),(1440,900)]:
                p.set_viewport_size({'width':width,'height':height})
                for game in games:
                    with self.subTest(game=game['id'],width=width,height=height):
                        p.goto(self.base+'/gra.html?gra='+game['id']);f=p.frames[1];self.settled(f)
                        expect(p.locator('#game-placeholder')).to_have_count(0)
                        self.assert_screen(f,game['id'])
                        self.assertEqual(p.evaluate('scrollY'),0)
                        self.assertLessEqual(p.evaluate('document.documentElement.scrollHeight'),height+1)

    def test_all_hundred_standalone_pages_fit_without_hidden_scrollbars_covering_controls(self):
        with self.page(width=390) as p:
            games=p.evaluate('SpinnerGames');p.set_viewport_size({'width':390,'height':650})
            for game in games:
                with self.subTest(game=game['id']):
                    p.goto(self.base+'/'+game['file']);self.settled(p);self.assert_screen(p,game['id'])

    def test_snake_actual_direction_controls_and_top_edge_visible_after_start_and_rotation(self):
        with self.page('neonsnake1',width=390) as p:
            p.set_viewport_size({'width':390,'height':650});self.settled(p)
            p.locator('#snake-start').click()
            buttons=p.locator('.snake-controls button')
            for i in range(buttons.count()):expect(buttons.nth(i)).to_be_in_viewport(ratio=1)
            expect(p.locator('#game')).to_be_in_viewport(ratio=1)
            before=p.evaluate('snake.map(v=>({...v}))')
            rect=buttons.first.bounding_box();p.mouse.move(rect['x']+rect['width']/2,rect['y']+rect['height']/2);p.mouse.down()
            p.mouse.up();self.assertEqual(p.evaluate('scrollY'),0)
            p.set_viewport_size({'width':844,'height':390});self.settled(p);self.assert_screen(p,'snake running')

    def test_options_are_accessible_and_escape_closes_without_resuming(self):
        with self.page('fifteen',width=390) as p:
            self.settled(p)
            p.locator('.gv-options').click();expect(p.locator('.gv-dialog')).to_be_visible()
            p.get_by_label('PLANSZA',exact=True).select_option('3')
            p.get_by_role('button',name='Zamknij opcje',exact=True).click()
            self.assertEqual(p.evaluate('MoreGame.snapshot().size'),3)
            p.evaluate('MoreGame.move(MoreGame.snapshot().certificate[0])')
            p.locator('.gv-options').click();self.assertEqual(p.evaluate('MoreGame.snapshot().phase'),'paused')
            p.keyboard.press('Escape');expect(p.locator('.gv-dialog')).not_to_be_visible()
            self.assertEqual(p.evaluate('MoreGame.snapshot().phase'),'paused')

    def test_parent_help_pauses_game_and_fullscreen_keeps_controls_in_view(self):
        with self.page(width=390) as p:
            p.set_viewport_size({'width':390,'height':650});p.goto(self.base+'/gra.html?gra=2048');f=p.frames[1];self.settled(f)
            f.evaluate('TilesGame.move("left")')
            p.locator('#player-help').click();expect(p.locator('#player-guide')).to_be_visible()
            self.assertEqual(f.evaluate('TilesGame.snapshot().phase'),'paused')
            p.get_by_role('button',name='Zamknij zasady',exact=True).click()
            self.assertEqual(f.evaluate('TilesGame.snapshot().phase'),'paused')
            p.locator('#fullscreen-game').click();p.wait_for_function('Boolean(document.fullscreenElement)');self.settled(f)
            self.assert_screen(f,'2048 fullscreen')
            p.evaluate('document.exitFullscreen()');self.settled(f);self.assert_screen(f,'2048 window')

    def test_dynamic_size_does_not_reset_game_and_large_options_remain_inside(self):
        with self.page('memory',width=390) as p:
            self.settled(p);p.locator('.gv-options').click();p.locator('#memory-level').select_option('12');p.get_by_role('button',name='Zamknij opcje',exact=True).click()
            p.locator('[data-index="0"]').click();cards=p.evaluate('MemoryGame.snapshot().cards')
            for w,h in [(320,568),(844,390),(1440,900),(390,844)]:
                p.set_viewport_size({'width':w,'height':h});self.settled(p);self.assert_screen(p,'memory 12 pairs');self.assertEqual(p.evaluate('MemoryGame.snapshot().cards'),cards)
                p.evaluate('SpinnerTheme.set(SpinnerTheme.mode==="dark"?"light":"dark")');self.settled(p);self.assertEqual(p.evaluate('MemoryGame.snapshot().cards'),cards)

if __name__=='__main__':unittest.main(verbosity=2)
