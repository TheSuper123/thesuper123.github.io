"""Gameplay regression checks for both minefields and Tic Tac Toe; no external accounts."""
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

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*_):pass

class LogicGames(unittest.TestCase):
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
    def page(self,width=390,consent=False):
        context=self.browser.new_context(viewport={'width':width,'height':844},reduced_motion='reduce')
        # Seed only randomness, not game state, so actual placement is repeatable.
        context.add_init_script('''let seed=9173;Math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};''')
        context.add_init_script('localStorage.setItem("spinner:consent:v1",'+json.dumps(json.dumps({'version':1,'preferences':consent,'savedAt':int(time.time()*1000)}))+');')
        page=context.new_page();page.set_default_timeout(7000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        try:
            yield page
            self.assertEqual(errors,[])
        finally:context.close()

    def test_both_minefields_flags_first_move_keyboard_and_theme_preservation(self):
        for path in ['/games/saper.html','/saper.html']:
            with self.subTest(path=path),self.page() as page:
                page.goto(self.base+path)
                cells=page.locator('#game .cell')
                expect(cells).to_have_count(81)
                # Flag limit, key handling and counters all work before mines are placed.
                for i in range(11):cells.nth(i).click(button='right')
                expect(page.locator('#game .flagged')).to_have_count(10)
                expect(page.locator('#remaining-mines')).to_have_text('0')
                cells.nth(0).focus();page.keyboard.press('f')
                expect(page.locator('#remaining-mines')).to_have_text('1')
                page.locator('#start-btn').click()
                cells.nth(40).focus();page.keyboard.press('Enter')
                self.assertGreaterEqual(page.locator('#game .open').count(),9)
                expect(page.locator('#game .mine')).to_have_count(0)
                opened=page.locator('#game .open').count()
                page.evaluate("SpinnerTheme.set('dark')")
                self.assertEqual(page.locator('#game .open').count(),opened)
                self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
                self.assertEqual(page.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])

    def test_mobile_long_press_does_not_flag_twice_on_native_contextmenu(self):
        for path in ['/games/saper.html','/saper.html']:
            with self.subTest(path=path),self.page() as page:
                page.goto(self.base+path);cell=page.locator('#game .cell').nth(0)
                cell.dispatch_event('pointerdown',{'pointerType':'touch','pointerId':1})
                page.wait_for_timeout(460)
                cell.dispatch_event('contextmenu')
                cell.dispatch_event('pointerup',{'pointerType':'touch','pointerId':1})
                cell.dispatch_event('click')
                expect(cell).to_have_class('cell flagged')
                expect(page.locator('#remaining-mines')).to_have_text('9')

    def test_minefield_chord_with_flags_opens_neighboring_fields(self):
        for path in ['/games/saper.html','/saper.html']:
            with self.subTest(path=path),self.page() as page:
                page.goto(self.base+path);page.locator('#game .cell').nth(40).click()
                # Recreate the seeded partial shuffle to know actual mine positions.
                mines=page.evaluate('''()=>{
                  let seed=9173;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
                  const neighbors=i=>{const r=Math.floor(i/9),c=i%9,out=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){let nr=r+dr,nc=c+dc;if((dr||dc)&&nr>=0&&nr<9&&nc>=0&&nc<9)out.push(nr*9+nc);}return out;};
                  const safe=new Set([40,...neighbors(40)]),choices=[];for(let i=0;i<81;i++)if(!safe.has(i))choices.push(i);
                  for(let i=0;i<10;i++){let j=i+Math.floor(random()*(choices.length-i));[choices[i],choices[j]]=[choices[j],choices[i]];}
                  return choices.slice(0,10);
                }''')
                cells=page.locator('#game .cell')
                # Find an already open number with at least one still-covered safe neighbor.
                candidate=page.evaluate('''mines=>{
                  const minesSet=new Set(mines),cells=[...document.querySelectorAll('#game .cell')];
                  for(let i=0;i<81;i++)if(cells[i].classList.contains('open')&&cells[i].textContent){
                    let r=Math.floor(i/9),c=i%9,n=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){let nr=r+dr,nc=c+dc;if((dr||dc)&&nr>=0&&nr<9&&nc>=0&&nc<9)n.push(nr*9+nc);}
                    const safe=n.filter(j=>!minesSet.has(j)&&!cells[j].classList.contains('open'));
                    if(safe.length)return {index:i,mines:n.filter(j=>minesSet.has(j))};
                  }return null;
                }''',mines)
                self.assertIsNotNone(candidate)
                for index in candidate['mines']:cells.nth(index).click(button='right')
                before=page.locator('#game .open').count();cells.nth(candidate['index']).click()
                self.assertGreater(page.locator('#game .open').count(),before)
                expect(page.locator('#game .mine')).to_have_count(0)

    def test_classic_rejects_impossible_mine_counts_and_handles_large_empty_regions(self):
        with self.page() as page:
            page.goto(self.base+'/saper.html')
            page.locator('#grid-size').fill('5');page.locator('#bomb-count').fill('99999');page.locator('#start-btn').click()
            expect(page.locator('#game .cell')).to_have_count(25)
            self.assertEqual(page.locator('#bomb-count').input_value(),'16')
            page.locator('#game .cell').nth(12).click()
            expect(page.locator('#mine-status')).to_have_attribute('data-result','win')
            page.locator('#grid-size').fill('100');page.locator('#bomb-count').fill('1');page.locator('#start-btn').click()
            expect(page.locator('#game .cell')).to_have_count(10000)
            page.locator('#game .cell').first.click()
            self.assertGreater(page.locator('#game .open').count(),9500)
            expect(page.locator('#mine-status')).to_have_attribute('data-result','win')
            self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))

    def test_minefield_timer_pause_reset_and_no_spending_after_game_over(self):
        with self.page() as page:
            page.goto(self.base+'/saper.html');page.locator('#game .cell').nth(40).click()
            page.wait_for_timeout(1100);expect(page.locator('#timer')).not_to_have_text('Czas: 0s')
            page.locator('[data-cookie-settings]').last.click();expect(page.locator('#pause-screen')).to_be_visible();page.keyboard.press('Escape');time_before=page.locator('#timer').inner_text();opened=page.locator('#game .open').count()
            page.wait_for_timeout(1100);self.assertEqual(page.locator('#timer').inner_text(),time_before)
            page.locator('#resume-btn').click();page.locator('#start-btn').click()
            expect(page.locator('#timer')).to_have_text('Czas: 0s');expect(page.locator('#game .open')).to_have_count(0)
            page.locator('#grid-size').fill('5');page.locator('#bomb-count').fill('16');page.locator('#start-btn').click();page.locator('#game .cell').nth(12).click()
            before=page.locator('#points-info').inner_text();page.locator('#hint-btn').click()
            self.assertEqual(page.locator('#points-info').inner_text(),before)
            self.assertGreater(opened,0)

    def test_minefield_stats_obey_consent_and_preserve_legacy_points(self):
        for consent in [False,True]:
            with self.subTest(consent=consent),self.page(consent=consent) as page:
                page.goto(self.base+'/saper.html');page.locator('#grid-size').fill('5');page.locator('#bomb-count').fill('16');page.locator('#start-btn').click();page.locator('#game .cell').nth(12).click()
                expect(page.locator('#games-won')).to_have_text('1')
                page.reload();expect(page.locator('#games-won')).to_have_text('1' if consent else '0')
        with self.page(consent=True) as page:
            page.goto(self.base+'/games/saper.html')
            page.evaluate('ArcadeProgress.database().ref("users/local/points").set(27)')
            page.reload();expect(page.locator('#points-info')).to_contain_text('27')

    def test_tictactoe_match_score_winning_line_hint_and_replay(self):
        with self.page() as page:
            page.goto(self.base+'/games/tictactoe.html');cells=page.locator('#board button')
            page.locator('#hint-move').click();expect(page.locator('#board [data-hint=true]')).to_have_count(1)
            for i in [0,3,1,4,2]:cells.nth(i).click()
            expect(page.locator('#status')).to_contain_text('wygrywa')
            expect(page.locator('#board .winning')).to_have_count(3)
            self.assertFalse(page.locator('#winning-stroke').evaluate('e=>e.hasAttribute("hidden")'))
            expect(page.locator('#score-x')).to_have_text('1')
            page.locator('#restart').click();expect(page.locator('#score-x')).to_have_text('1')
            expect(cells.filter(has_text='X')).to_have_count(0)
            page.locator('#reset-match').click();expect(page.locator('#score-x')).to_have_text('0')

    def test_tictactoe_ai_turn_guard_choose_o_and_pending_restart(self):
        with self.page() as page:
            page.goto(self.base+'/games/tictactoe.html');page.locator('#difficulty').select_option('hard')
            cells=page.locator('#board button');cells.nth(0).click();cells.nth(1).click()
            expect(cells.filter(has_text='X')).to_have_count(1)
            page.locator('#restart').click();page.wait_for_timeout(300)
            self.assertEqual(cells.all_text_contents(),['']*9)
            page.locator('#play-as').select_option('O')
            expect(cells.filter(has_text='X')).to_have_count(1)
            self.assertFalse(page.locator('#status').inner_text().startswith('Komputer'))
            page.locator('#play-as').select_option('X');cells.nth(4).click()
            page.locator('#difficulty').select_option('pvp');page.wait_for_timeout(300)
            self.assertEqual(cells.all_text_contents(),['']*9)

    def test_return_from_page_cache_resumes_pending_ai_once_and_keeps_minefield_paused(self):
        with self.page() as page:
            page.goto(self.base+'/games/tictactoe.html');page.locator('#difficulty').select_option('hard')
            page.locator('#board button').nth(0).click()
            page.evaluate('window.dispatchEvent(new PageTransitionEvent("pagehide",{persisted:true}))')
            page.wait_for_timeout(280);expect(page.locator('#board .o-color')).to_have_count(0)
            page.evaluate('window.dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))')
            expect(page.locator('#board .o-color')).to_have_count(1)
            page.wait_for_timeout(280);expect(page.locator('#board .o-color')).to_have_count(1)
            page.goto(self.base+'/games/saper.html');page.locator('#game .cell').nth(40).click()
            page.evaluate('window.dispatchEvent(new PageTransitionEvent("pagehide",{persisted:true}));window.dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))')
            expect(page.locator('#pause-screen')).to_be_visible()
            before=page.locator('#timer').inner_text();page.wait_for_timeout(1050)
            self.assertEqual(page.locator('#timer').inner_text(),before)
            page.locator('#resume-btn').click()
            expect(page.locator('#timer')).not_to_have_text(before,timeout=2500)

    def test_tictactoe_hard_ai_never_loses_any_legal_human_continuation(self):
        with self.page(width=1000) as page:
            page.goto(self.base+'/games/tictactoe.html');page.locator('#difficulty').select_option('hard')
            # Exhaust actual solver against every legal opposing continuation, for either mark.
            result=page.evaluate('''()=>{
              const failures=[];let states=0;
              for(const human of ['X','O']){
                markSelect.value=human;
                const visit=(position,turn)=>{
                  states++;board=[...position];
                  if(checkStatic(board,human)){failures.push(position.join(''));return;}
                  if(checkStatic(board,computerMark())||board.every(Boolean))return;
                  if(turn===computerMark()){
                    const index=getAIMove();if(!Number.isInteger(index)||board[index]){failures.push('illegal');return;}
                    const next=[...board];next[index]=turn;visit(next,turn==='X'?'O':'X');
                  }else{
                    for(let i=0;i<9;i++)if(!position[i]){const next=[...position];next[i]=turn;visit(next,turn==='X'?'O':'X');}
                  }
                };
                visit(Array(9).fill(null),'X');
              }
              return {states,failures};
            }''')
            self.assertGreater(result['states'],500)
            self.assertEqual(result['failures'],[])

if __name__=='__main__':unittest.main(verbosity=2)
