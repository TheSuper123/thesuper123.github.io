"""Functional checks for privately restored games; no archive bytes/password are embedded.

Run with SPINNER_ARCHIVE_SOURCE pointing to a complete restore outside the checkout.
The temporary web root merges just these three pages with public shared assets.
"""
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import os
import shutil
import tempfile
import unittest
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
SOURCE = os.environ.get('SPINNER_ARCHIVE_SOURCE')

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_): pass

@unittest.skipUnless(SOURCE, 'Set SPINNER_ARCHIVE_SOURCE to a restore outside the published checkout')
class ArchivePuzzleChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        source = Path(SOURCE).resolve()
        if source.is_relative_to(ROOT):
            raise ValueError('Private sources must stay outside the published checkout')
        cls.temp = tempfile.TemporaryDirectory(prefix='spinner-private-puzzle-tests-')
        root = Path(cls.temp.name)
        (root/'games').mkdir()
        for name in ['tetris.html','flappybird.html','blockblast.html']:
            shutil.copy2(source/'games'/name, root/'games'/name)
        shutil.copytree(ROOT/'assets', root/'assets')
        cls.server = ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(root)))
        Thread(target=cls.server.serve_forever,daemon=True).start()
        cls.base = 'http://127.0.0.1:'+str(cls.server.server_port)
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.playwright.stop();cls.server.shutdown();cls.server.server_close();cls.temp.cleanup()

    @contextmanager
    def page(self, name, width=1100, consent=False, touch=False):
        context=self.browser.new_context(viewport={'width':width,'height':1000},has_touch=touch,reduced_motion='reduce')
        context.add_init_script('localStorage.setItem("spinner:consent:v1",JSON.stringify({version:1,preferences:'+str(consent).lower()+',savedAt:Date.now()}))')
        page=context.new_page();page.set_default_timeout(7000)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        try:
            page.goto(self.base+'/games/'+name)
            yield page
            self.assertEqual(errors,[])
        finally:context.close()

    def test_all_three_mobile_themes_and_no_external_calls(self):
        for name in ['tetris.html','flappybird.html','blockblast.html']:
            with self.subTest(game=name),self.page(name,390,touch=True) as page:
                external=[];page.on('request',lambda r:external.append(r.url) if not r.url.startswith(self.base) else None)
                for mode in ['dark','light']:
                    page.evaluate('(mode)=>SpinnerTheme.set(mode)',mode)
                    expect(page.locator('html')).to_have_attribute('data-theme',mode)
                    self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
                self.assertEqual(external,[])
                self.assertEqual(page.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])

    def test_tetris_immediate_key_and_pointer_input_hold_and_pause(self):
        with self.page('tetris.html') as page:
            page.locator('#start-btn').click()
            initial=page.evaluate('tetris.active.x')
            page.keyboard.down('ArrowLeft')
            self.assertEqual(page.evaluate('tetris.active.x'),initial-1)
            page.keyboard.up('ArrowLeft')
            left=page.locator('#move-left').bounding_box()
            page.mouse.move(left['x']+left['width']/2,left['y']+left['height']/2);page.mouse.down()
            self.assertEqual(page.evaluate('tetris.active.x'),initial-2)
            page.mouse.up()
            page.keyboard.press('KeyC')
            self.assertTrue(page.evaluate('tetris.holdUsed'))
            held=page.evaluate('tetris.held');active=page.evaluate('tetris.active.name')
            page.keyboard.press('KeyC')
            self.assertEqual(page.evaluate('tetris.held'),held)
            self.assertEqual(page.evaluate('tetris.active.name'),active)
            page.locator('#pause-btn').click()
            expect(page.locator('#start-btn')).to_have_text('WZNÓW')
            before=page.evaluate('JSON.stringify(tetris.active)')
            page.wait_for_timeout(900)
            self.assertEqual(page.evaluate('JSON.stringify(tetris.active)'),before)
            page.locator('#start-btn').click()
            self.assertEqual(page.evaluate('tetris.state'),'playing')
            page.keyboard.press('Space')
            self.assertFalse(page.evaluate('tetris.holdUsed'))

    def test_tetris_line_clear_rotation_and_clean_restart(self):
        with self.page('tetris.html') as page:
            page.locator('#start-btn').click()
            # A real almost-complete row; hard drop must lock and clear it once.
            page.evaluate("""()=>{cancelAnimationFrame(tetris.frame);tetris.board=Array.from({length:20},()=>Array(10).fill(null));tetris.board[19]=Array.from({length:10},(_,c)=>c>=3&&c<=6?null:'Z');tetris.active=newPiece('I');tetris.active.x=3;tetris.active.y=0;drawTetris();}""")
            page.keyboard.press('Space')
            self.assertEqual(page.evaluate('tetris.lines'),1)
            self.assertGreaterEqual(page.evaluate('tetris.score'),100)
            self.assertTrue(page.evaluate('tetris.board[19].every(v=>v===null)'))
            page.evaluate("tetris.active={name:'I',matrix:[[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],x:7,y:4}")
            self.assertTrue(page.evaluate('fits(tetris.active)'))
            page.keyboard.press('ArrowUp')
            self.assertTrue(page.evaluate('fits(tetris.active)'))
            self.assertLessEqual(page.evaluate('tetris.active.x'),6)
            page.locator('#restart-btn').click()
            expect(page.locator('#score')).to_have_text('Punkty: 0')
            self.assertEqual(page.evaluate('tetris.lines'),0)
            self.assertTrue(page.evaluate('tetris.board.flat().every(v=>v===null)'))
            self.assertEqual(page.evaluate('(()=>{tetris.bag=[];return new Set(Array.from({length:7},nextName)).size})()'),7)

    def test_bird_waits_for_input_and_pauses_without_losing_progress(self):
        with self.page('flappybird.html',390,touch=True) as page:
            page.locator('[data-mode=amator]').click()
            self.assertEqual(page.evaluate('birdGame.state'),'ready')
            page.wait_for_timeout(400)
            self.assertEqual(page.evaluate('birdGame.time'),0)
            canvas=page.locator('#game').bounding_box()
            page.mouse.move(canvas['x']+80,canvas['y']+220);page.mouse.down()
            self.assertEqual(page.evaluate('birdGame.state'),'playing')
            self.assertLess(page.evaluate('birdGame.bird.vy'),0)
            page.mouse.up()
            page.locator('#bird-pause').click()
            self.assertEqual(page.evaluate('birdGame.state'),'paused')
            snapshot=page.evaluate('JSON.stringify([birdGame.bird,birdGame.pipes,birdGame.time])')
            page.wait_for_timeout(450)
            self.assertEqual(page.evaluate('JSON.stringify([birdGame.bird,birdGame.pipes,birdGame.time])'),snapshot)
            page.locator('#same-route').click()
            self.assertEqual(page.evaluate('birdGame.state'),'playing')

    def test_bird_fixed_step_fair_seeded_route_and_local_record(self):
        with self.page('flappybird.html',consent=True) as page:
            def simulate(fps):
                return page.evaluate("""fps=>{initGame('amator',12345);flapBird();cancelAnimationFrame(birdGame.frame);birdGame.last=0;for(let i=1;i<=fps*.4;i++){birdLoop(i*1000/fps);cancelAnimationFrame(birdGame.frame);}return {y:birdGame.bird.y,vy:birdGame.bird.vy,time:birdGame.time,pipes:birdGame.pipes.map(p=>[p.y,p.gap])};}""",fps)
            slow,fast=simulate(30),simulate(120)
            self.assertAlmostEqual(slow['y'],fast['y'],places=6)
            self.assertAlmostEqual(slow['time'],fast['time'],places=6)
            self.assertEqual(slow['pipes'],fast['pipes'])
            self.assertTrue(all(top>=60 and top+gap<=390 for top,gap in fast['pipes']))
            page.evaluate('birdGame.score=7;finishBird()')
            expect(page.locator('#best-score')).to_have_text('7')
            page.reload();page.locator('[data-mode=amator]').click()
            expect(page.locator('#bird-record')).to_have_text('REKORD 7')

    def test_blocks_tap_keyboard_rotation_undo_and_clear(self):
        with self.page('blockblast.html',390,touch=True) as page:
            expect(page.locator('#board .cell')).to_have_count(81)
            page.locator('#next-blocks .block').first.click()
            first=page.evaluate('blockGame.pieces[0].shape.flat().filter(Boolean).length')
            page.locator('#cell-0-0').click()
            self.assertEqual(page.evaluate('blockGame.score'),first)
            self.assertEqual(page.evaluate('blockGame.pieces.length'),2)
            page.locator('#blocks-undo').click()
            self.assertEqual(page.evaluate('blockGame.score'),0)
            self.assertEqual(page.evaluate('blockGame.pieces.length'),3)
            expect(page.locator('#blocks-undo')).to_be_disabled()
            page.keyboard.press('Digit1');page.keyboard.press('KeyR')
            page.locator('#cell-4-4').focus();page.keyboard.press('ArrowLeft');page.keyboard.press('Enter')
            self.assertGreater(page.evaluate('blockGame.score'),0)
            # Filling the intersection clears a row and a column together.
            page.evaluate("""()=>{blockGame.board=Array.from({length:9},()=>Array(9).fill(null));for(let i=1;i<9;i++){blockGame.board[0][i]='green';blockGame.board[i][0]='green';}blockGame.pieces=[{id:'fixture',shape:[[1]],color:'accent'}];blockGame.selected='fixture';blockGame.score=0;blockGame.lines=0;blockGame.combo=0;renderBlockPieces();renderBlocks();}""")
            page.locator('#cell-0-0').click()
            self.assertEqual(page.evaluate('blockGame.lines'),2)
            self.assertEqual(page.evaluate('blockGame.score'),21)
            self.assertTrue(page.evaluate('blockGame.board.flat().every(v=>v===null)'))
            page.locator('#blocks-restart').click()
            self.assertEqual(page.evaluate('blockGame.score'),0)

    def test_blocks_pointer_drag_cancel_and_fair_new_hand(self):
        with self.page('blockblast.html') as page:
            # One cell makes the pointer destination unambiguous, including at nonzero page offsets.
            page.evaluate("blockGame.pieces=[{id:'drag-fixture',shape:[[1]],color:'gold'}];renderBlockPieces()")
            piece=page.locator('#next-blocks .block');piece.scroll_into_view_if_needed()
            box=piece.bounding_box();target=page.locator('#cell-2-3').bounding_box()
            page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down()
            page.mouse.move(target['x']+target['width']/2,target['y']+target['height']/2,steps=8);page.mouse.up()
            self.assertEqual(page.evaluate('blockGame.board[2][3]'),'gold')
            self.assertGreater(page.evaluate('blockGame.score'),0)
            page.evaluate("blockGame.board=Array.from({length:9},()=>Array(9).fill('blue'));blockGame.board[4][4]=null;generateBlockHand()")
            self.assertTrue(page.evaluate('blockGame.pieces.some(p=>hasBlockMove(p.shape))'))
            page.evaluate("blockGame.board[4][4]='blue';checkBlockEnd();renderBlocks()")
            expect(page.locator('#blocks-over')).to_be_visible()
            page.locator('#blocks-again').click()
            expect(page.locator('#blocks-over')).to_be_hidden()
            self.assertTrue(page.evaluate('blockGame.board.flat().every(v=>v===null)'))

if __name__=='__main__':unittest.main(verbosity=2)
