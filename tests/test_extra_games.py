"""Functional checks for the relay, opinion questionnaire and archived utility pages."""
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import os
from datetime import datetime, timezone
import unittest
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*_):pass

class ExtraGames(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
        Thread(target=cls.server.serve_forever,daemon=True).start()
        cls.base='http://127.0.0.1:'+str(cls.server.server_port)
        cls.p=sync_playwright().start()
        cls.browser=cls.p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.p.stop();cls.server.shutdown();cls.server.server_close()

    @contextmanager
    def page(self,width=1280,consent=False,clock=False,retained=None):
        context=self.browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce')
        context.add_init_script('localStorage.setItem("spinner:consent:v1",JSON.stringify({version:1,preferences:'+json.dumps(consent)+',savedAt:Date.now()}));')
        if retained is not None:
            context.add_init_script('localStorage.setItem("spinner:prefs:relay:v2",'+json.dumps(json.dumps(retained))+');')
        page=context.new_page();page.set_default_timeout(7000)
        if clock:
            page.clock.install(time=datetime(2026,10,21,0,0,0,tzinfo=timezone.utc))
            page.clock.pause_at(datetime(2026,10,21,0,0,1,tzinfo=timezone.utc))
        try:yield page
        finally:context.close()

    def relay(self,page):
        page.goto(self.base+'/games/neonincremental1.html')
        page.wait_for_function('Boolean(window.RelayGame)')

    def test_relay_income_pause_and_theme_do_not_depend_on_draws(self):
        with self.page(clock=True) as page:
            self.relay(page)
            page.clock.run_for(3000)
            points=page.evaluate('RelayGame.state.points')
            self.assertAlmostEqual(points,3,delta=.15)
            for mode in ['dark','light']*5:page.evaluate('(m)=>SpinnerTheme.set(m)',mode)
            self.assertEqual(page.evaluate('RelayGame.state.points'),points)
            page.locator('#relay-pause').click()
            paused=page.evaluate('RelayGame.state.points')
            page.clock.run_for(5000)
            self.assertEqual(page.evaluate('RelayGame.state.points'),paused)
            page.locator('#relay-resume').click();page.clock.run_for(2000)
            self.assertAlmostEqual(page.evaluate('RelayGame.state.points')-paused,2,delta=.15)
            # Common privacy/account overlays must pause idempotently.
            page.evaluate("SpinnerGame.pause('dialog');SpinnerGame.pause('dialog')")
            self.assertTrue(page.evaluate('RelayGame.paused'))

    def test_relay_slow_render_rate_keeps_real_time_income(self):
        # Simulate a weak device: four render callbacks per second instead of 60.
        with self.page(clock=True) as page:
            page.add_init_script('window.requestAnimationFrame=callback=>setTimeout(()=>callback(performance.now()),250)')
            self.relay(page);page.clock.run_for(3000)
            self.assertAlmostEqual(page.evaluate('RelayGame.state.points'),3,delta=.01)
            page.keyboard.down('ArrowRight');page.clock.run_for(1000);page.keyboard.up('ArrowRight')
            self.assertAlmostEqual(page.evaluate('RelayGame.state.pX'),645,delta=.01)

    def test_relay_movement_manual_purchase_and_no_accidental_spending(self):
        with self.page(clock=True) as page:
            self.relay(page)
            for _ in range(10):
                page.locator('#relay-pulse').click();page.clock.run_for(1100)
            self.assertGreater(page.evaluate('RelayGame.state.points'),35)
            page.locator('#relay-travel').click();page.clock.run_for(2000)
            self.assertAlmostEqual(page.evaluate('RelayGame.state.pY'),400,delta=2)
            self.assertEqual(page.evaluate('RelayGame.state.levels.up2'),0)
            page.locator('#relay-buy').click()
            self.assertEqual(page.evaluate('RelayGame.state.levels.up2'),1)
            self.assertEqual(page.evaluate('RelayGame.rate'),3.5)
            page.clock.run_for(3000)
            self.assertEqual(page.evaluate('RelayGame.state.levels.up2'),1)
            page.keyboard.down('ArrowRight');page.clock.run_for(500);page.keyboard.up('ArrowRight')
            self.assertGreater(page.evaluate('RelayGame.state.pX'),550)
            page.locator('#relay-reset').click()
            self.assertEqual(page.evaluate('RelayGame.state.levels.up2'),1)
            page.locator('#relay-reset').click()
            self.assertEqual(page.evaluate('RelayGame.state.levels.up2'),0)
            self.assertEqual(page.evaluate('RelayGame.state.points'),0)

    def test_relay_storage_consent_sanitization_and_clear(self):
        with self.page(clock=True) as page:
            self.relay(page);page.locator('#relay-pulse').click();page.locator('#relay-pause').click()
            self.assertEqual(page.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])
            page.reload();self.assertEqual(page.evaluate('RelayGame.state.points'),0)
        malformed={'version':2,'points':-99,'pX':999999,'pY':-999,'levels':{'up1':9999,'up2':-3,'up8':'bad'}}
        with self.page(consent=True,clock=True,retained=malformed) as page:
            self.relay(page)
            self.assertEqual(page.evaluate('RelayGame.state.points'),0)
            self.assertEqual(page.evaluate('RelayGame.state.levels.up1'),12)
            self.assertEqual(page.evaluate('RelayGame.state.levels.up2'),0)
            self.assertLessEqual(page.evaluate('RelayGame.state.pX'),975)
            page.locator('#relay-pulse').click();page.locator('#relay-pause').click()
            self.assertIsNotNone(page.evaluate('localStorage.getItem("spinner:prefs:relay:v2")'))
            page.evaluate('SpinnerStorage.preferences.clear()')
            page.clock.run_for(15000)
            self.assertEqual(page.evaluate('localStorage.getItem("spinner:prefs:relay:v2")'),None)
            self.assertEqual(page.evaluate('RelayGame.state.levels.up1'),1)
            page.reload();self.assertEqual(page.evaluate('RelayGame.state.points'),0)

    def test_quiz_single_answer_back_edit_results_and_restart(self):
        with self.page() as page:
            page.goto(self.base+'/games/quiz.html');page.locator('#quiz-start').click()
            expect(page.locator('#next-btn')).to_be_disabled()
            page.locator('[data-answer="0"]').dblclick()
            self.assertEqual(page.evaluate('QuizRound.index'),0)
            self.assertEqual(page.evaluate('QuizRound.answers.filter(a=>a!==null).length'),1)
            page.locator('#next-btn').click();page.locator('[data-answer="1"]').click()
            page.locator('#quiz-back').click()
            expect(page.locator('[data-answer="0"]')).to_have_attribute('aria-pressed','true')
            page.locator('[data-answer="2"]').click();page.locator('#next-btn').click()
            expect(page.locator('[data-answer="1"]')).to_have_attribute('aria-pressed','true')
            total=page.evaluate('QuizRound.total')
            for _ in range(total-1):
                page.locator('[data-answer="2"]').click();page.locator('#next-btn').click()
            expect(page.locator('#quiz-results')).to_be_visible()
            expect(page.locator('#quiz-neutral')).to_have_text(str(total))
            expect(page.locator('#quiz-yes')).to_have_text('0')
            self.assertEqual(page.locator('#quiz-review li').count(),total)
            self.assertEqual(page.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])
            page.locator('#quiz-restart').click();page.locator('#quiz-start').click()
            self.assertEqual(page.evaluate('QuizRound.answers.filter(a=>a!==null).length'),0)

    def test_quiz_full_round_has_one_answer_per_question(self):
        with self.page() as page:
            page.goto(self.base+'/games/quiz.html')
            page.locator('#quiz-length').select_option('all');page.locator('#quiz-start').click()
            total=page.evaluate('QuizRound.total')
            self.assertGreater(total,100)
            page.evaluate("""()=>{const total=QuizRound.total;for(let i=0;i<total;i++){document.querySelector('[data-answer="1"]').click();document.querySelector('#next-btn').click();}}""")
            expect(page.locator('#quiz-results')).to_be_visible()
            expect(page.locator('#quiz-no')).to_have_text(str(total))
            self.assertEqual(page.locator('#quiz-review li').count(),total)

    def test_quiz_unicode_export_and_pdf_fallback(self):
        with self.page() as page:
            page.goto(self.base+'/games/quiz.html');page.locator('#quiz-start').click()
            total=page.evaluate('QuizRound.total')
            for _ in range(total):
                page.locator('[data-answer="2"]').click();page.locator('#next-btn').click()
            with page.expect_download() as info:page.locator('#download-btn').click()
            data=Path(info.value.path()).read_text(encoding='utf-8-sig')
            self.assertIn('Odpowiedź: Nie mam zdania',data)
            self.assertIn('zwiększenie wydatków',data)
            page.evaluate('()=>{window.print=()=>{throw new Error("unsupported")}}')
            page.locator('#quiz-print').click()
            expect(page.locator('#quiz-error')).to_contain_text('Drukowanie jest niedostępne')

    def test_all_extra_pages_are_local_responsive_and_themed(self):
        with self.page(width=320) as page:
            errors=[];external=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('request',lambda r:external.append(r.url) if not r.url.startswith(self.base) else None)
            for width in [320,390,1280]:
                page.set_viewport_size({'width':width,'height':900})
                for file in ['neonincremental1.html','quiz.html','polls.html','soon.html']:
                    with self.subTest(width=width,file=file):
                        page.goto(self.base+'/games/'+file)
                        for mode in ['dark','light']:
                            page.evaluate('(m)=>SpinnerTheme.set(m)',mode)
                            expect(page.locator('html')).to_have_attribute('data-theme',mode)
                            self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
            self.assertEqual(external,[]);self.assertEqual(errors,[])
            page.goto(self.base+'/games/polls.html')
            expect(page.locator('iframe')).to_have_count(0)
            expect(page.get_by_role('heading',name='Tu nie ma aktualnego sondażu.')).to_be_visible()

if __name__=='__main__':unittest.main(verbosity=2)
