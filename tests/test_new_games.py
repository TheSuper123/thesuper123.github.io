from game_controls import choose_option
"""Functional gameplay checks for all five new, self-contained games."""
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import os
import unittest
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
GAMES=['2048','memory','breakout','sudoku','sokoban']

def solve_sudoku(board):
    result=list(board)
    def candidates(index):
        row,col=divmod(index,9)
        used=set(result[row*9:row*9+9])|set(result[col::9])|{result[r*9+c] for r in range(row//3*3,row//3*3+3) for c in range(col//3*3,col//3*3+3)}
        return set(range(1,10))-used
    def visit():
        empty=[i for i,value in enumerate(result) if not value]
        if not empty:return True
        index=min(empty,key=lambda i:len(candidates(i)))
        for digit in candidates(index):
            result[index]=digit
            if visit():return True
        result[index]=0
        return False
    if not visit():raise AssertionError('Generated puzzle has no solution')
    return result

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
    def copyfile(self,source,output):
        try:super().copyfile(source,output)
        except (BrokenPipeError,ConnectionResetError):pass

class NewGames(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
        Thread(target=cls.server.serve_forever,daemon=True).start()
        cls.base='http://127.0.0.1:'+str(cls.server.server_port)
        cls.playwright=sync_playwright().start()
        cls.browser=cls.playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--no-proxy-server','--disable-dev-shm-usage'])
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.playwright.stop();cls.server.shutdown();cls.server.server_close()
    @contextmanager
    def page(self,game=None,consent=False,width=1000,init=None,clock=False):
        context=self.browser.new_context(viewport={'width':width,'height':950},has_touch=width<600,reduced_motion='reduce')
        # Nested games read the parent's receipt; they must not simulate a fresh
        # consent decision (and revoke page memory) on every iframe load.
        context.add_init_script('if(window.self===window.top)localStorage.setItem("spinner:consent:v1",JSON.stringify({version:1,preferences:'+str(consent).lower()+',savedAt:Date.now()}))')
        if init:context.add_init_script(init)
        page=context.new_page();page.set_default_timeout(7000);errors=[];external=[];failures=[]
        if clock:page.clock.install()
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:external.append(r.url) if not (r.url.startswith(self.base) or r.url.startswith('blob:'+self.base)) else None)
        page.on('response',lambda r:failures.append(r.url) if r.status>=400 else None)
        try:
            page.goto(self.base+('/games/'+game+'.html' if game else '/'))
            yield page
            self.assertEqual(errors,[]);self.assertEqual(external,[]);self.assertEqual(failures,[])
        finally:context.close()

    def test_catalog_has_exactly_five_new_games_search_and_favorites(self):
        with self.page(consent=True) as page:
            expect(page.locator('.game-card')).to_have_count(100)
            games=page.evaluate('SpinnerGames')
            self.assertEqual(len({game['id'] for game in games}),100)
            self.assertEqual([game['id'] for game in games[8:13]],GAMES)
            page.get_by_role('button',name='Dodaj do ulubionych: Memory',exact=True).click();page.reload()
            expect(page.get_by_role('button',name='Usuń z ulubionych: Memory',exact=True)).to_have_attribute('aria-pressed','true')
            page.locator('#game-search').fill('sudoku');expect(page.locator('.game-card')).to_have_count(1)
            page.locator('#game-search').fill('');page.get_by_role('button',name='Na główkowanie',exact=True).click()
            expect(page.locator('.game-card')).to_have_count(64)

    def test_all_new_games_in_player_both_themes_and_mobile_widths(self):
        with self.page(width=390) as page:
            for width in [320,390,1280]:
                page.set_viewport_size({'width':width,'height':950})
                for game in GAMES:
                    with self.subTest(width=width,game=game):
                        page.goto(self.base+'/gra.html?gra='+game)
                        frame=page.frame_locator('#game-stage iframe')
                        expect(frame.locator('body')).to_have_attribute('data-game',game)
                        expect(page.locator('#game-placeholder')).to_have_count(0)
                        page.frames[1].evaluate('document.fonts.ready')
                        for mode in ['dark','light']:
                            page.evaluate('(mode)=>SpinnerTheme.set(mode)',mode)
                            expect(frame.locator('html')).to_have_attribute('data-theme',mode)
                            self.assertFalse(page.frames[1].evaluate('document.documentElement.scrollWidth>innerWidth'))
                        self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
                        self.assertEqual(page.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])

    def test_2048_merges_once_per_tile_and_detects_blocked_boards(self):
        with self.page('2048') as page:
            results=page.evaluate('''()=>{
              const a=TilesGame.transform([2,2,2,2,...Array(12).fill(0)],'left');
              const b=TilesGame.transform([2,2,4,0,...Array(12).fill(0)],'right');
              const c=TilesGame.transform([2,0,0,0,2,0,0,0,4,0,0,0,4,0,0,0],'down');
              return {a,b,c,blocked:TilesGame.hasMoves([2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2])};
            }''')
            self.assertEqual(results['a']['board'][:4],[4,4,0,0]);self.assertEqual(results['a']['points'],8)
            self.assertEqual(results['b']['board'][:4],[0,0,4,4]);self.assertEqual(results['b']['points'],4)
            self.assertEqual(results['c']['board'][::4],[0,0,4,8]);self.assertFalse(results['blocked'])

    def test_2048_pointerdown_undo_keyboard_and_consent(self):
        for consent in [False,True]:
            with self.subTest(consent=consent),self.page('2048',consent=consent,init='Math.random=()=>0') as page:
                before=page.evaluate('TilesGame.snapshot()')
                button=page.locator('[data-direction=left]');button.scroll_into_view_if_needed();rect=button.bounding_box()
                page.mouse.move(rect['x']+20,rect['y']+20);page.mouse.down()
                self.assertEqual(page.evaluate('TilesGame.snapshot().moves'),1)
                self.assertEqual(page.evaluate('TilesGame.snapshot().score'),4)
                page.mouse.up();self.assertEqual(page.evaluate('TilesGame.snapshot().moves'),1)
                page.locator('#tiles-undo').click();self.assertEqual(page.evaluate('TilesGame.snapshot().board'),before['board'])
                expect(page.locator('#tiles-undo')).to_be_disabled()
                page.keyboard.press('ArrowLeft');self.assertEqual(page.evaluate('TilesGame.snapshot().score'),4)
                saved=page.evaluate('localStorage.getItem("spinner:prefs:new:2048:best")')
                self.assertEqual(saved,'4' if consent else None)
                page.reload();expect(page.locator('#tiles-best')).to_have_text('4' if consent else '0')

    def test_2048_swipe_and_idempotent_pause_preserve_board(self):
        with self.page('2048',width=390,init='Math.random=()=>0') as page:
            rect=page.locator('#board').bounding_box();x=rect['x']+rect['width']*.8;y=rect['y']+rect['height']/2
            page.mouse.move(x,y);page.mouse.down();page.mouse.move(x-100,y);page.mouse.up()
            self.assertEqual(page.evaluate('TilesGame.snapshot().moves'),1)
            page.evaluate('SpinnerGame.pause("dialog");SpinnerGame.pause("dialog")');before=page.evaluate('TilesGame.snapshot()')
            page.keyboard.press('ArrowDown');self.assertEqual(page.evaluate('TilesGame.snapshot()'),before)
            page.locator('#tiles-continue').click();self.assertEqual(page.evaluate('TilesGame.snapshot().phase'),'playing')

    def test_memory_rejects_third_card_and_restart_cancels_old_pair(self):
        with self.page('memory') as page:
            cards=page.evaluate('MemoryGame.snapshot().cards');different=next(i for i in range(1,len(cards)) if cards[i]!=cards[0])
            page.locator('[data-index="0"]').click();page.locator(f'[data-index="{different}"]').click()
            third=next(i for i in range(len(cards)) if i not in [0,different]);page.locator(f'[data-index="{third}"]').click()
            self.assertEqual(page.evaluate('MemoryGame.snapshot().attempts'),1)
            self.assertEqual(len(page.evaluate('MemoryGame.snapshot().open')),2)
            page.locator('#memory-new').click();page.wait_for_timeout(750)
            state=page.evaluate('MemoryGame.snapshot()');self.assertEqual(state['open'],[]);self.assertEqual(state['attempts'],0);self.assertEqual(state['phase'],'ready')

    def test_swipes_started_before_pause_are_cancelled_on_resume(self):
        for game,api,resume in [('2048','TilesGame','tiles-continue'),('sokoban','SokobanGame','sokoban-resume')]:
            with self.subTest(game=game),self.page(game,width=390,init='Math.random=()=>0') as page:
                board=page.locator('#board' if game=='2048' else '#game');board.scroll_into_view_if_needed();rect=board.bounding_box()
                x=rect['x']+rect['width']*.8;y=rect['y']+rect['height']/2
                before=page.evaluate(api+'.snapshot()')
                page.mouse.move(x,y);page.mouse.down();page.mouse.move(x-70,y)
                page.evaluate('SpinnerGame.pause("dialog")')
                page.evaluate('(id)=>document.getElementById(id).click()',resume)
                page.mouse.up()
                after=page.evaluate(api+'.snapshot()')
                self.assertEqual(after,before)

    def test_memory_full_round_record_keyboard_and_frozen_pause(self):
        with self.page('memory',consent=True) as page:
            choose_option(page.locator('#memory-level'),'6');page.locator('[data-index="0"]').focus();page.keyboard.press('Enter')
            self.assertEqual(page.evaluate('MemoryGame.snapshot().open'),[0])
            page.keyboard.press('ArrowRight');self.assertEqual(page.evaluate('document.activeElement.dataset.index'),'1')
            page.evaluate('SpinnerGame.pause("dialog")');before=page.evaluate('MemoryGame.snapshot()');page.wait_for_timeout(300)
            self.assertEqual(page.evaluate('MemoryGame.snapshot()'),before)
            page.locator('#memory-resume').click()
            cards=page.evaluate('MemoryGame.snapshot().cards');partner=next(i for i in range(1,len(cards)) if cards[i]==cards[0])
            page.locator(f'[data-index="{partner}"]').click()
            for token in set(cards)-{cards[0]}:
                indexes=[i for i,value in enumerate(cards) if value==token]
                for index in indexes:page.locator(f'[data-index="{index}"]').click()
            self.assertEqual(page.evaluate('MemoryGame.snapshot().phase'),'won');expect(page.locator('#memory-pairs')).to_have_text('6 / 6')
            self.assertEqual(page.evaluate('MemoryGame.snapshot().attempts'),6)
            self.assertIsNotNone(page.evaluate('localStorage.getItem("spinner:prefs:new:memory:best:6")'))
            page.locator('#memory-again').click();self.assertEqual(page.evaluate('MemoryGame.snapshot().phase'),'ready')

    def test_sudoku_generation_has_unique_valid_solutions_at_every_level(self):
        with self.page('sudoku') as page:
            for level in ['easy','normal','hard']:
                for _ in range(2):
                    data=page.evaluate('(level)=>SudokuGame.generate(level)',level)
                    solution=solve_sudoku(data['puzzle']);self.assertEqual(solution,data['solution'])
                    self.assertEqual(page.evaluate('(p)=>SudokuGame.countSolutions(p)',data['puzzle']),1)
                    self.assertTrue(all(value==0 or value==solution[i] for i,value in enumerate(data['puzzle'])))
                    self.assertGreaterEqual(data['puzzle'].count(0),35)

    def test_sudoku_givens_notes_undo_hints_and_conflicts(self):
        with self.page('sudoku') as page:
            puzzle=page.evaluate('SudokuGame.snapshot().puzzle');fixed=next(i for i,v in enumerate(puzzle) if v);blank=next(i for i,v in enumerate(puzzle) if not v)
            page.locator(f'[data-index="{fixed}"]').click();page.keyboard.press(str(puzzle[fixed]%9+1));self.assertEqual(page.evaluate('SudokuGame.snapshot().values')[fixed],puzzle[fixed])
            page.locator(f'[data-index="{blank}"]').click();page.locator('#sudoku-note').click();page.keyboard.press('1')
            self.assertEqual(page.evaluate('SudokuGame.snapshot().notes')[blank],2)
            page.locator('#sudoku-undo').click();self.assertEqual(page.evaluate('SudokuGame.snapshot().notes')[blank],0)
            page.locator('#sudoku-note').click()
            duplicate=next(value for value in puzzle[blank//9*9:blank//9*9+9] if value)
            page.keyboard.press(str(duplicate));expect(page.locator(f'[data-index="{blank}"]')).to_have_attribute('aria-invalid','true')
            page.locator('#sudoku-erase').click();self.assertEqual(page.evaluate('SudokuGame.snapshot().values')[blank],0)
            page.locator('#sudoku-hint').click();self.assertEqual(page.evaluate('SudokuGame.snapshot().hints'),1)
            page.locator('#sudoku-undo').click();self.assertEqual(page.evaluate('SudokuGame.snapshot().hints'),1)

    def test_sudoku_can_be_completed_through_real_keys_and_records_without_hints(self):
        with self.page('sudoku',consent=True) as page:
            puzzle=page.evaluate('SudokuGame.snapshot().puzzle');solution=solve_sudoku(puzzle)
            for i,value in enumerate(puzzle):
                if not value:page.locator(f'[data-index="{i}"]').click();page.keyboard.press(str(solution[i]))
            self.assertEqual(page.evaluate('SudokuGame.snapshot().phase'),'won');expect(page.locator('#sudoku-filled')).to_have_text('81 / 81')
            self.assertIsNotNone(page.evaluate('localStorage.getItem("spinner:prefs:new:sudoku:best:normal")'))
            page.locator('#sudoku-resume').click();self.assertEqual(page.evaluate('SudokuGame.snapshot().phase'),'ready')

    def test_sudoku_assisted_round_does_not_set_record_and_pause_freezes_clock(self):
        with self.page('sudoku',consent=True) as page:
            page.locator('#sudoku-hint').click();page.evaluate('SpinnerGame.pause("dialog")');before=page.evaluate('SudokuGame.snapshot()');page.wait_for_timeout(350)
            self.assertEqual(page.evaluate('SudokuGame.snapshot()'),before)
            page.locator('#sudoku-resume').click();puzzle=page.evaluate('SudokuGame.snapshot().puzzle');solution=solve_sudoku(puzzle)
            page.evaluate('(sol)=>{for(let i=0;i<81;i++){SudokuGame.select(i);SudokuGame.enter(sol[i]);}}',solution)
            self.assertEqual(page.evaluate('SudokuGame.snapshot().phase'),'won')
            self.assertIsNone(page.evaluate('localStorage.getItem("spinner:prefs:new:sudoku:best:normal")'))

    def test_sokoban_all_eight_original_levels_have_valid_solution_certificates(self):
        with self.page('sokoban') as page:
            levels=page.evaluate('SokobanGame.levels');self.assertEqual(len(levels),8)
            for level in levels:
                boxes=set(level['boxes']);goals=set(level['goals']);walls=set(level['walls']);player=level['player'];width=level['width']
                self.assertNotEqual(boxes,goals);self.assertGreater(len(level['certificate']),0)
                offsets={'up':-width,'down':width,'left':-1,'right':1}
                for direction in level['certificate']:
                    offset=offsets[direction];next_cell=player+offset;self.assertNotIn(next_cell,walls)
                    if next_cell in boxes:
                        self.assertNotIn(next_cell+offset,walls);self.assertNotIn(next_cell+offset,boxes);boxes.remove(next_cell);boxes.add(next_cell+offset)
                    player=next_cell
                self.assertEqual(boxes,goals)

    def test_sokoban_pointerdown_undo_real_key_win_and_next_level(self):
        with self.page('sokoban') as page:
            level=page.evaluate('SokobanGame.levels[0]');before=page.evaluate('SokobanGame.snapshot()');first=level['certificate'][0]
            button=page.locator('[data-direction="'+first+'"]');button.scroll_into_view_if_needed();rect=button.bounding_box();page.mouse.move(rect['x']+20,rect['y']+20);page.mouse.down()
            self.assertEqual(page.evaluate('SokobanGame.snapshot().steps'),1);page.mouse.up();page.locator('#sokoban-undo').click()
            self.assertEqual(page.evaluate('SokobanGame.snapshot()'),before)
            key={'up':'ArrowUp','right':'ArrowRight','down':'ArrowDown','left':'ArrowLeft'}
            for direction in level['certificate']:page.keyboard.press(key[direction])
            self.assertEqual(page.evaluate('SokobanGame.snapshot().phase'),'won')
            page.locator('#sokoban-next').click();self.assertEqual(page.evaluate('SokobanGame.snapshot().level'),1)
            self.assertEqual(page.evaluate('SokobanGame.snapshot().steps'),0)

    def test_breakout_real_controls_pause_and_pointer_cancel(self):
        with self.page('breakout') as page:
            page.locator('#breakout-start').click();self.assertEqual(page.evaluate('BreakoutGame.state.phase'),'playing')
            x=page.evaluate('BreakoutGame.state.paddle.x');page.locator('#breakout-left').scroll_into_view_if_needed();rect=page.locator('#breakout-left').bounding_box();page.mouse.move(rect['x']+10,rect['y']+10);page.mouse.down()
            self.assertLess(page.evaluate('BreakoutGame.state.paddle.x'),x);page.locator('#breakout-left').dispatch_event('pointercancel');page.mouse.up()
            page.evaluate('SpinnerGame.pause("dialog");SpinnerGame.pause("dialog")');before=page.evaluate('BreakoutGame.snapshot()');page.wait_for_timeout(350)
            self.assertEqual(page.evaluate('BreakoutGame.snapshot()'),before)
            page.locator('#breakout-start').click();self.assertEqual(page.evaluate('BreakoutGame.state.phase'),'playing')

    def test_breakout_fixed_step_bricks_walls_paddle_and_lives(self):
        with self.page('breakout') as page:
            def simulate(fps):return page.evaluate('fps=>{BreakoutGame.newGame();BreakoutGame.launch();for(let i=0;i<fps/2;i++)BreakoutGame.advance(1/fps);return {...BreakoutGame.state.ball};}',fps)
            slow,fast=simulate(30),simulate(144)
            for key in ['x','y','vx','vy']:self.assertAlmostEqual(slow[key],fast[key],places=6)
            collision=page.evaluate('''()=>{BreakoutGame.newGame();BreakoutGame.launch();const s=BreakoutGame.state,b=s.bricks.at(-1);Object.assign(s.ball,{x:b.x+b.w/2,y:b.y+b.h+8,vx:0,vy:-420});BreakoutGame.advance(.02);const hit={hp:b.hp,score:s.score,vy:s.ball.vy};Object.assign(s.ball,{x:s.paddle.x+s.paddle.w/3,y:s.paddle.y-s.ball.r-1,vx:0,vy:400});BreakoutGame.advance(.02);const paddle={vx:s.ball.vx,vy:s.ball.vy};Object.assign(s.ball,{x:8,y:300,vx:-150,vy:0});BreakoutGame.advance(.02);return {hit,paddle,wall:s.ball.vx};}''')
            self.assertEqual(collision['hit']['hp'],0);self.assertGreater(collision['hit']['score'],0);self.assertGreater(collision['hit']['vy'],0)
            self.assertGreater(collision['paddle']['vx'],0);self.assertLess(collision['paddle']['vy'],0);self.assertGreater(collision['wall'],0)
            lives=page.evaluate('''()=>{BreakoutGame.newGame();for(let i=0;i<3;i++){BreakoutGame.launch();Object.assign(BreakoutGame.state.ball,{y:540,vy:100});BreakoutGame.advance(.01);}BreakoutGame.advance(.08);return [BreakoutGame.state.phase,BreakoutGame.state.lives];}''')
            self.assertEqual(lives,['over',0])

    def test_breakout_all_three_walls_are_finishable_with_normal_controller(self):
        with self.page('breakout') as page:
            result=page.evaluate('''()=>{BreakoutGame.newGame();for(let i=0;i<180000;i++){const s=BreakoutGame.state;if(s.phase==='won'||s.phase==='over')break;if(s.phase==='ready'||s.phase==='between')BreakoutGame.launch();BreakoutGame.aim(s.ball.x+Math.sin(i/211)*25);BreakoutGame.advance(1/120);}return {phase:BreakoutGame.state.phase,level:BreakoutGame.state.level,score:BreakoutGame.state.score};}''')
            self.assertEqual(result['phase'],'won');self.assertEqual(result['level'],3);self.assertGreater(result['score'],0)

if __name__=='__main__':unittest.main(verbosity=2)
