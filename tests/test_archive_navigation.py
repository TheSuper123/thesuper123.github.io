"""Functional checks against an explicitly restored private archive, without embedding its contents.

SPINNER_ARCHIVE_SOURCE=/outside/checkout/restored python3 tests/test_archive_navigation.py
The test server reads shared public assets and the restored directory without publishing either.
"""
from contextlib import contextmanager
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
from threading import Thread
import time
import unittest
from urllib.parse import unquote, urlsplit
from playwright.sync_api import sync_playwright, expect

REPO = Path(__file__).resolve().parents[1]


class ArchiveNavigationChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        source = os.environ.get('SPINNER_ARCHIVE_SOURCE')
        if not source:
            raise RuntimeError('Set SPINNER_ARCHIVE_SOURCE to a complete archive restored outside the published checkout.')
        cls.archive = Path(source).resolve()
        if cls.archive.is_relative_to(REPO) or not (cls.archive/'games/doom.html').is_file():
            raise RuntimeError('The restored archive must exist outside the published checkout.')

        class Handler(SimpleHTTPRequestHandler):
            def translate_path(self, path):
                path = unquote(urlsplit(path).path).lstrip('/')
                base = REPO if path.startswith('assets/') else cls.archive
                resolved = (base/path).resolve()
                return str(resolved if resolved.is_relative_to(base) else base/'__missing__')

            def log_message(self, *_):
                pass

            def copyfile(self, source, outputfile):
                try:
                    super().copyfile(source, outputfile)
                except (BrokenPipeError, ConnectionResetError):
                    pass

        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(
            executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server', '--enable-unsafe-swiftshader'],
        )

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()
        cls.server.shutdown()
        cls.server.server_close()

    @contextmanager
    def page(self, mobile=False, preferences=False):
        context = self.browser.new_context(
            viewport={'width':390 if mobile else 1440, 'height':844 if mobile else 1000},
            has_touch=mobile,
            reduced_motion='reduce',
        )
        context.add_init_script('localStorage.setItem("spinner:consent:v1",'+json.dumps(json.dumps({
            'version':1, 'preferences':preferences, 'savedAt':int(time.time()*1000),
        }))+');')
        page = context.new_page()
        page.set_default_timeout(12000)
        try:
            yield page
        finally:
            context.close()

    def test_all_doom_documents_have_valid_targets_images_and_runtime(self):
        directory = self.archive/'games/doomfiles/DOOM-HTML-main/Doom_HTML'

        class References(HTMLParser):
            def __init__(self):
                super().__init__()
                self.references = []

            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                attr = 'href' if tag in ['a','link'] else 'src' if tag in ['img','script'] else None
                if attr and attrs.get(attr):
                    self.references.append(attrs[attr])

        documents = sorted(directory.glob('*.html'))
        self.assertGreater(len(documents), 30)
        with self.page(mobile=True) as page:
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            for document in documents:
                with self.subTest(scene=document.name):
                    parser = References()
                    parser.feed(document.read_text())
                    for target in parser.references:
                        if target.startswith('#'):
                            continue
                        path = (document.parent/unquote(urlsplit(target).path)).resolve()
                        if not path.exists() and path.is_relative_to(self.archive/'assets'):
                            path = REPO/path.relative_to(self.archive)
                            # Common assets use the private worker's public fallback.
                        self.assertTrue(path.exists(), (document.name,target))
                    page.goto(self.base+'/'+document.relative_to(self.archive).as_posix())
                    self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
                    self.assertTrue(page.evaluate('[...document.images].every(img=>img.complete&&img.naturalWidth>0)'))
            self.assertEqual(errors, [])

    def test_doom_complete_mission_and_noop_directions_do_not_reload(self):
        with self.page(mobile=True) as page:
            errors=[]
            page.on('pageerror',lambda e: errors.append(str(e)))
            page.goto(self.base+'/games/doom.html')
            frame=page.frame_locator('#game-frame')
            frame.get_by_role('link',name='Rozpocznij',exact=True).click()

            def scene(name):
                expect(frame.locator('.scene-label')).to_contain_text('SCENA / '+name)

            def key(name, expected=None):
                frame.locator('body').press(name)
                if expected:
                    scene(expected)

            scene('1')
            before=page.frames[1].url
            expect(frame.get_by_role('link',name='W lewo',exact=True)).to_have_attribute('aria-disabled','true')
            key('ArrowLeft')
            self.assertEqual(page.frames[1].url,before)
            key('ArrowUp','2closed')
            expect(frame.get_by_role('link',name='Do przodu',exact=True)).to_have_attribute('aria-disabled','true')
            key('e','2opena')
            key('e')
            expect(frame.locator('#cleared-count')).to_have_text('1 / 4')
            key('ArrowUp','3a');key('e')
            key('ArrowRight','4a');key('e')
            key('ArrowLeft','3');key('ArrowUp','9a');key('e')
            key('ArrowUp','11')
            expect(frame.get_by_role('link',name='Do przodu',exact=True)).to_have_attribute('aria-disabled','true')
            key('ArrowLeft','12');key('ArrowLeft','13');key('e')
            expect(frame.locator('#key-state')).to_have_text('Zdobyty')
            key('ArrowRight','12');key('ArrowRight','11');key('ArrowUp','11open');key('ArrowUp','16');key('e')
            expect(frame.locator('#victory')).to_be_visible()
            expect(frame.locator('#cleared-count')).to_have_text('4 / 4')
            self.assertTrue(page.frames[1].evaluate('DoomGame.state.won'))
            page.evaluate('SpinnerTheme.set("dark")')
            expect(frame.locator('html')).to_have_attribute('data-theme','dark')
            self.assertTrue(page.frames[1].evaluate('DoomGame.state.won'))
            self.assertEqual(page.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])
            self.assertEqual(errors,[])

    def test_doom_pause_and_back_keep_current_mission_state(self):
        with self.page() as page:
            page.goto(self.base+'/games/doom.html')
            frame=page.frame_locator('#game-frame')
            frame.get_by_role('link',name='Rozpocznij',exact=True).click()
            page.evaluate('SpinnerGame.pause("dialog")')
            expect(frame.locator('#scene-pause')).to_be_visible()
            before=page.frames[1].url
            frame.locator('body').press('ArrowUp')
            self.assertEqual(page.frames[1].url,before)
            frame.locator('#resume-scene').click()
            frame.locator('body').press('ArrowUp')
            expect(frame.locator('.scene-label')).to_contain_text('2closed')
            page.locator('#doom-back').click()
            expect(frame.locator('.scene-label')).to_contain_text('SCENA / 1')
            self.assertEqual(page.frames[1].evaluate('DoomGame.state.moves'),2)

    def test_unity_real_webgl_load_pause_resume_input_and_fullscreen(self):
        with self.page() as page:
            errors=[];dialogs=[];external=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('dialog',lambda d:(dialogs.append(d.message),d.dismiss()))
            page.on('request',lambda r:external.append(r.url) if not r.url.startswith((self.base,'blob:'+self.base,'data:')) else None)
            page.goto(self.base+'/games/geometrydashlite986.html')
            expect(page.locator('#loader')).to_be_hidden(timeout=75000)
            expect(page.locator('body')).to_have_attribute('data-unity-state','ready')
            self.assertTrue(page.evaluate('Boolean(gameInstance.Module.canvas.width>0&&gameInstance.Module.pauseMainLoop&&gameInstance.Module.resumeMainLoop)'))
            page.evaluate('''() => {
              window.inputEvents=[];
              const canvas=gameInstance.Module.canvas;
              for(const type of ['keydown','keyup'])canvas.addEventListener(type,e=>inputEvents.push([e.type,e.code,e.keyCode,e.which]));
              window.pauseCalls=0;const pause=gameInstance.Module.pauseMainLoop;
              gameInstance.Module.pauseMainLoop=function(){pauseCalls++;return pause.apply(this,arguments);};
            }''')
            page.locator('#unity-jump').click()
            self.assertEqual(page.evaluate('inputEvents.slice(-2)'),[['keydown','Space',32,32],['keyup','Space',32,32]])
            page.locator('#unity-pause').click()
            expect(page.locator('#unity-paused')).to_be_visible()
            page.evaluate('SpinnerGame.pause("dialog")')
            self.assertEqual(page.evaluate('pauseCalls'),1)
            page.locator('#unity-resume').click()
            expect(page.locator('body')).to_have_attribute('data-unity-state','ready')
            page.locator('#unity-jump').scroll_into_view_if_needed()
            box=page.locator('#unity-jump').bounding_box()
            page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);page.mouse.down()
            page.evaluate('window.dispatchEvent(new Event("blur"))')
            page.mouse.up()
            expect(page.locator('#unity-paused')).to_be_visible()
            self.assertEqual(page.evaluate('inputEvents.at(-1)'),['keyup','Space',32,32])
            page.locator('#unity-resume').click()
            page.locator('#unity-fullscreen').click()
            page.wait_for_function('Boolean(document.fullscreenElement)')
            page.locator('#unity-exit-fullscreen').click()
            page.wait_for_function('!document.fullscreenElement')
            self.assertEqual(dialogs,[])
            self.assertEqual(external,[])
            self.assertEqual(errors,[])

    def test_unity_touch_jump_releases_and_mobile_layout_stays_usable(self):
        with self.page(mobile=True) as page:
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(self.base+'/games/geometrydashlite986.html')
            expect(page.locator('#loader')).to_be_hidden(timeout=75000)
            page.evaluate("window.touchKeys=[];for(const type of ['keydown','keyup'])gameInstance.Module.canvas.addEventListener(type,e=>touchKeys.push([e.type,e.code,e.keyCode,e.which]));")
            page.locator('#unity-jump').tap()
            self.assertEqual(page.evaluate('touchKeys'),[['keydown','Space',32,32],['keyup','Space',32,32]])
            expect(page.locator('#unity-jump')).to_have_attribute('data-pressed','false')
            page.evaluate('SpinnerTheme.set("dark")')
            expect(page.locator('body')).to_have_attribute('data-unity-state','ready')
            self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
            self.assertEqual(errors,[])

    def test_unity_loader_error_is_actionable_without_native_alert(self):
        with self.page(mobile=True) as page:
            dialogs=[]
            page.on('dialog',lambda d:(dialogs.append(d.message),d.dismiss()))
            page.route('**/Build/UnityLoader.js',lambda route:route.abort())
            page.goto(self.base+'/games/geometrydashlite986.html')
            expect(page.locator('body')).to_have_attribute('data-unity-state','error')
            expect(page.locator('#unity-retry')).to_be_visible()
            expect(page.locator('#unity-jump')).to_be_disabled()
            expect(page.locator('#load-message')).to_contain_text('Nie pobrano')
            self.assertEqual(dialogs,[])

    def test_unity_bad_build_configuration_fails_before_legacy_loader(self):
        for status,body in [(503,'temporarily unavailable'),(200,'not-json'),(200,'{}')]:
            with self.subTest(status=status,body=body),self.page() as page:
                errors=[];dialogs=[]
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('dialog',lambda d:(dialogs.append(d.message),d.dismiss()))
                page.route('**/Build/GeometryDashLite.json',lambda route:route.fulfill(status=status,body=body,content_type='application/json'))
                page.goto(self.base+'/games/geometrydashlite986.html')
                expect(page.locator('body')).to_have_attribute('data-unity-state','error')
                expect(page.locator('#load-message')).to_contain_text('pliku konfiguracji')
                expect(page.locator('#unity-retry')).to_be_visible()
                self.assertEqual(errors,[])
                self.assertEqual(dialogs,[])

    def test_guide_search_navigation_and_consent_aware_checklist(self):
        with self.page(mobile=True) as page:
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(self.base+'/skibidifish.html')
            expect(page.locator('#nick-modal')).to_have_count(0)
            expect(page.locator('#joystick-zone')).to_have_count(0)
            expect(page.locator('.guide-section')).to_have_count(4)
            page.locator('[data-pack=measure]').check()
            expect(page.locator('#packing-count')).to_have_text('1 / 7 gotowe')
            self.assertEqual(page.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])
            page.locator('#guide-search').fill('metrówka')
            expect(page.locator('#guide-result-count')).to_have_text('Pasujące sekcje: 1 / 4')
            page.locator('#guide-search').fill('<img src=x onerror=alert(1)>')
            expect(page.locator('#guide-empty')).to_be_visible()
            page.locator('.guide-nav a[href="#archive-notes"]').click()
            expect(page.locator('#archive-notes')).to_have_attribute('open','')
            expect(page.locator('#guide-empty')).to_be_hidden()
            page.reload()
            expect(page.locator('[data-pack=measure]')).not_to_be_checked()
            self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
            self.assertEqual(errors,[])
        with self.page(preferences=True) as page:
            page.goto(self.base+'/skibidifish.html')
            page.locator('[data-pack=measure]').check()
            page.reload()
            expect(page.locator('[data-pack=measure]')).to_be_checked()
            page.evaluate('SpinnerStorage.preferences.clear()')
            expect(page.locator('[data-pack=measure]')).not_to_be_checked()


if __name__ == '__main__':
    unittest.main(verbosity=2)
