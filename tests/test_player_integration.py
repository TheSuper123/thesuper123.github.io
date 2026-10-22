"""Exercise the real shared player with a small controlled game, without depending on game rules."""
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import os
import unittest
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
GAME='''<!doctype html><html lang="pl"><head><meta charset="utf-8">
<script src="../assets/theme.js"></script><link rel="stylesheet" href="../assets/site.css">
<link rel="stylesheet" href="../assets/game.css"><link rel="stylesheet" href="../assets/theme.css">
<script src="../assets/storage.js"></script><script src="../assets/site.js" defer></script>
<script src="../assets/game-ui.js" defer></script></head><body class="game-page"><main>
<canvas id="game" width="300" height="200"></canvas></main><script>
window.proof={pauses:[],renders:0,score:7};window.SpinnerGame={render(){proof.renders++},pause(reason){proof.pauses.push(reason)}};
window.addEventListener('spinner:preferences-cleared',()=>{proof.cleared=true});
</script></body></html>'''

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*_):pass

class PlayerChecks(unittest.TestCase):
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
    def page(self):
        context=self.browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
        context.add_init_script('localStorage.setItem("spinner:consent:v1",JSON.stringify({version:1,preferences:true,savedAt:Date.now()}))')
        page=context.new_page();page.set_default_timeout(7000)
        try:yield page
        finally:context.close()
    def open(self,page):
        page.goto(self.base+'/gra.html?gra=snake')
        expect(page.locator('#game-placeholder')).to_have_count(0)
        return page.frames[1]
    def test_parent_dialog_pauses_game_and_closing_does_not_resume_or_reset(self):
        with self.page() as page:
            page.route('**/games/neonsnake1.html',lambda route:route.fulfill(content_type='text/html',body=GAME))
            frame=self.open(page)
            frame.locator('#game').click()
            self.assertTrue(frame.evaluate('document.activeElement.id==="game"'))
            page.get_by_role('button',name='Ustawienia cookies',exact=True).click()
            frame.wait_for_function('proof.pauses.includes("dialog")')
            count=frame.evaluate('proof.pauses.length')
            page.locator('#cookie-dialog [data-close]').click()
            self.assertEqual(frame.evaluate('proof.pauses.length'),count)
            self.assertEqual(frame.evaluate('proof.score'),7)
            before=frame.evaluate('proof.renders')
            page.evaluate('SpinnerTheme.set(SpinnerTheme.mode==="light"?"dark":"light")')
            frame.wait_for_function('(before)=>proof.renders>before',arg=before)
            self.assertEqual(frame.evaluate('proof.score'),7)
    def test_failed_game_has_working_retry(self):
        with self.page() as page:
            attempts=[]
            def respond(route):
                attempts.append(route.request.url)
                route.fulfill(status=404 if len(attempts)==1 else 200,content_type='text/html',body='<p>Missing fixture</p>' if len(attempts)==1 else GAME)
            page.route('**/games/neonsnake1.html',respond)
            page.goto(self.base+'/gra.html?gra=snake')
            expect(page.locator('#game-placeholder')).to_contain_text('Nie udało się uruchomić gry')
            page.get_by_role('button',name='Spróbuj ponownie',exact=True).click()
            expect(page.locator('#game-placeholder')).to_have_count(0)
            self.assertEqual(len(attempts),2)
    def test_clearing_saved_progress_reaches_an_already_open_game(self):
        with self.page() as page:
            page.route('**/games/neonsnake1.html',lambda route:route.fulfill(content_type='text/html',body=GAME))
            frame=self.open(page)
            frame.evaluate('SpinnerStorage.preferences.set("fixture-score",42)')
            self.assertEqual(frame.evaluate('SpinnerStorage.preferences.get("fixture-score")'),42)
            page.evaluate('SpinnerStorage.preferences.clear()')
            frame.wait_for_function('proof.cleared===true')
            self.assertIsNone(frame.evaluate('SpinnerStorage.preferences.get("fixture-score")'))
            self.assertIsNone(page.evaluate('localStorage.getItem("spinner:prefs:fixture-score")'))

    def test_player_ignores_content_height_and_fullscreen_uses_available_screen(self):
        with self.page() as page:
            page.route('**/games/neonsnake1.html',lambda route:route.fulfill(content_type='text/html',body=GAME))
            frame=self.open(page)
            frame.evaluate('document.querySelector("main").style.minHeight="1176px"')
            self.assertAlmostEqual(page.locator('#game-stage iframe').bounding_box()['height'],page.evaluate('innerHeight')-48,delta=2)
            page.locator('#fullscreen-game').click()
            page.wait_for_function('Boolean(document.fullscreenElement)')
            rect=page.locator('#game-stage iframe').bounding_box()
            self.assertAlmostEqual(rect['height'],page.evaluate('innerHeight'),delta=2)
            page.evaluate('document.exitFullscreen()')
            page.wait_for_function('!document.fullscreenElement')
            self.assertAlmostEqual(page.locator('#game-stage iframe').bounding_box()['height'],page.evaluate('innerHeight')-48,delta=2)

if __name__=='__main__':unittest.main(verbosity=2)
