"""Publication boundary, real static content and optional-storage consent behaviour."""
from contextlib import contextmanager
from functools import partial
from pathlib import Path
from http.server import ThreadingHTTPServer
from tempfile import TemporaryDirectory
from threading import Thread
import json
import sys
import unittest
from playwright.sync_api import expect
from test_more_games import MoreGames
from test_new_games import QuietHandler, ROOT

sys.path.insert(0,str(ROOT/'scripts'))
from build_public_site import build, public_files, validate
from build_public_content import catalog


class PreviewHandler(QuietHandler):
    def send_error(self, code, message=None, explain=None):
        if code!=404:
            return super().send_error(code,message,explain)
        data=(Path(self.directory)/'404.html').read_bytes()
        self.send_response(404)
        self.send_header('Content-Type','text/html; charset=utf-8')
        self.send_header('Content-Length',str(len(data)))
        self.end_headers()
        if self.command!='HEAD':
            self.wfile.write(data)


class PublicSiteChecks(MoreGames):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.preview=TemporaryDirectory(prefix='spinner-public-')
        cls.info=build(cls.preview.name)
        cls.web=ThreadingHTTPServer(('127.0.0.1',0),partial(PreviewHandler,directory=cls.preview.name))
        Thread(target=cls.web.serve_forever,daemon=True).start()
        cls.public='http://127.0.0.1:'+str(cls.web.server_port)
    @classmethod
    def tearDownClass(cls):
        cls.web.shutdown();cls.web.server_close();cls.preview.cleanup()
        super().tearDownClass()

    @contextmanager
    def published(self,javascript=True,width=390):
        c=self.browser.new_context(java_script_enabled=javascript,viewport={'width':width,'height':844},reduced_motion='reduce')
        p=c.new_page();p.set_default_timeout(10000)
        errors=[];external=[]
        p.on('pageerror',lambda e:errors.append(str(e)))
        p.on('request',lambda r:external.append(r.url) if not r.url.startswith(self.public) else None)
        try:
            yield p
            self.assertEqual(errors,[])
            self.assertEqual(external,[])
        finally:c.close()

    def test_preview_uses_real_publication_exclusions_and_all_local_links_resolve(self):
        self.assertEqual(self.info['games'],101)
        self.assertEqual(self.info['archive'],'excluded')
        self.assertEqual(self.info['advertising'],'disabled')
        files=public_files();self.assertEqual(validate(files),self.info)
        self.assertFalse(any(p.startswith(('others/','docs/','tests/','scripts/','templates/')) for p in files))
        self.assertTrue((ROOT/'others/manifest.json').is_file())
        with self.published() as p:
            for path in ['/others/','/others/manifest.json','/others/service-worker.js','/docs/PRAWA-DO-MATERIALOW.md','/tests/smoke.py','/scripts/build_public_site.py','/games/soon.html','/games/quiz.html','/games/polls.html','/games/neonincremental1.html']:
                with self.subTest(path=path):
                    response=p.request.get(self.public+path)
                    self.assertEqual(response.status,404)
            for path in ['/assets/fonts/sans-LICENSE.txt','/assets/vendor/FIREBASE-LICENSE.txt','/assets/vendor/firebase-auth-compat.js','/assets/offline-pack.js','/manifest.webmanifest']:
                self.assertEqual(p.request.get(self.public+path).status,200)

    def test_no_javascript_has_all_real_games_rules_and_functional_contact(self):
        with self.published(javascript=False) as p:
            p.goto(self.public)
            expect(p.locator('.game-card')).to_have_count(101)
            self.assertEqual(p.locator('.game-card').evaluate_all('(cards)=>cards.map(c=>c.dataset.game)'),[g['id'] for g in catalog()])
            expect(p.locator('[data-account]')).not_to_be_visible()
            expect(p.locator('.catalog-toolbar')).not_to_be_visible()
            p.get_by_role('link',name='Zasady gry: Snake',exact=True).click()
            expect(p.locator('.rules-game')).to_have_count(101)
            p.locator('#snake summary').click()
            expect(p.locator('#snake .rules-content')).to_be_visible()
            expect(p.locator('#snake')).to_contain_text('złoty owoc')
            p.goto(self.public+'/kontakt.html')
            expect(p.locator('.contact-address')).to_have_attribute('href','mailto:kontakt@spinnerrealyt.pl')
            expect(p.locator('main')).to_contain_text('Marcel Jaroszewski')
            p.goto(self.public+'/zasady-serwisu.html')
            expect(p.locator('main')).to_contain_text('Nie przyjmujemy zakładów')

    def test_javascript_catalog_matches_static_version_and_opens_precise_rules(self):
        with self.published() as p:
            p.goto(self.public)
            expect(p.locator('.game-card')).to_have_count(101)
            expect(p.locator('.favorite')).to_have_count(101)
            expect(p.locator('[data-account]')).to_be_visible()
            p.locator('#game-search').fill('Ostatnia warta')
            expect(p.locator('.game-card')).to_have_count(1)
            p.get_by_role('link',name='Zasady gry: Ostatnia warta',exact=True).click()
            expect(p.locator('#last-watch')).to_have_attribute('open','')
            expect(p.locator('#last-watch .rules-content')).to_contain_text('dwunastoma sekwencjami')
            expect(p.locator('#last-watch summary')).to_be_in_viewport()

    def test_withdrawn_game_does_not_redirect_to_unpublished_archive(self):
        with self.published() as p:
            p.goto(self.public+'/gra.html?gra=doom')
            expect(p.locator('#game-placeholder')).to_contain_text('wycofany z publicznej wersji')
            self.assertTrue(p.url.endswith('?gra=doom'))
            self.assertEqual(len(p.frames),1)
            p.get_by_role('link',name='Wybierz grę z aktualnego katalogu',exact=True).click()
            expect(p.locator('.game-card')).to_have_count(101)

    def test_missing_route_has_a_real_404_status_and_working_home_link(self):
        with self.published(javascript=False) as p:
            response=p.goto(self.public+'/games/missing/nested-path')
            self.assertEqual(response.status,404)
            expect(p.get_by_role('heading',level=1)).to_contain_text('Zły skręt')
            p.get_by_role('link',name='Katalog gier ↗',exact=True).click()
            expect(p.locator('.game-card')).to_have_count(101)

    def test_information_pages_fit_small_screens_and_both_themes(self):
        with self.published() as p:
            for path in ['index.html','gry.html#last-watch','kontakt.html','zasady-serwisu.html','prywatnosc.html','o-serwisie.html']:
                p.goto(self.public+'/'+path)
                for width,height in [(320,568),(390,844),(844,390),(1440,900)]:
                    p.set_viewport_size({'width':width,'height':height})
                    for theme in ['light','dark']:
                        p.evaluate('(m)=>SpinnerTheme.set(m)',theme)
                        self.assertLessEqual(p.evaluate('document.documentElement.scrollWidth'),width)

    def test_future_receipt_is_rejected_before_theme_or_preference_use(self):
        init='''if(self===top){localStorage.setItem('spinner:consent:v1',JSON.stringify({version:1,preferences:true,savedAt:Date.now()+86400000}));localStorage.setItem('spinner:prefs:theme','"dark"');localStorage.setItem('spinner:prefs:fixture','42');}'''
        with self.page(init=init) as p:
            self.assertIsNone(p.evaluate('SpinnerStorage.consent'))
            self.assertEqual(p.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])
            self.assertIsNone(p.evaluate('localStorage.getItem("spinner:consent:v1")'))
            self.assertEqual(p.evaluate('SpinnerTheme.mode'),p.evaluate('matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"'))
            expect(p.locator('.cookie-panel')).to_be_visible()

    def test_expiry_in_an_open_tab_removes_retained_preferences_and_stops_writes(self):
        with self.page(clock=True) as p:
            p.evaluate('''()=>{
              SpinnerStorage.choose(true);
              localStorage.setItem('spinner:consent:v1',JSON.stringify({version:1,preferences:true,savedAt:Date.now()-180*86400000+5000}));
              dispatchEvent(new StorageEvent('storage',{key:'spinner:consent:v1'}));
              SpinnerStorage.preferences.set('fixture',42);
            }''')
            self.assertIsNotNone(p.evaluate('localStorage.getItem("spinner:prefs:fixture")'))
            p.clock.run_for(5100)
            self.assertIsNone(p.evaluate('SpinnerStorage.consent'))
            self.assertEqual(p.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])
            p.evaluate('SpinnerStorage.preferences.set("after-expiry",7)')
            self.assertIsNone(p.evaluate('localStorage.getItem("spinner:prefs:after-expiry")'))
            expect(p.locator('.cookie-panel')).to_be_visible()

    def test_other_tab_storage_clear_revokes_choice_and_prevents_silent_recreation(self):
        with self.published() as p:
            p.goto(self.public)
            p.evaluate('SpinnerStorage.choose(true);SpinnerStorage.preferences.set("fixture",42)')
            other=p.context.new_page();other.goto(self.public)
            other.evaluate('localStorage.clear()')
            p.wait_for_function('SpinnerStorage.consent===null')
            self.assertIsNone(p.evaluate('SpinnerStorage.preferences.get("fixture")'))
            p.evaluate('SpinnerStorage.preferences.set("after-clear",7)')
            self.assertIsNone(p.evaluate('localStorage.getItem("spinner:prefs:after-clear")'))
            expect(p.locator('.cookie-panel')).to_be_visible()


def screenshots():
    out=ROOT/'docs/screenshots/public-site';out.mkdir(exist_ok=True)
    PublicSiteChecks.setUpClass();t=PublicSiteChecks()
    try:
        with t.published(javascript=False,width=1440) as p:
            p.goto(t.public);p.screenshot(path=str(out/'catalog-without-javascript.png'))
        with t.published(width=390) as p:
            p.goto(t.public+'/gry.html#last-watch')
            p.get_by_role('button',name='Tylko niezbędne',exact=True).click()
            p.screenshot(path=str(out/'game-rules-mobile.png'))
            p.goto(t.public+'/kontakt.html');p.screenshot(path=str(out/'contact-mobile.png'),full_page=True)
            p.goto(t.public+'/zasady-serwisu.html');p.evaluate("SpinnerTheme.set('dark')")
            p.screenshot(path=str(out/'terms-dark-mobile.png'),full_page=True)
    finally:PublicSiteChecks.tearDownClass()


if __name__=='__main__':
    if '--screenshots' in sys.argv:screenshots()
    else:unittest.main(verbosity=2)
