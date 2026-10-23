"""Real service-worker downloads, cold offline launches, recovery and safe updates."""
from contextlib import contextmanager
from functools import partial
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer
import json
import subprocess
import time
import unittest
from playwright.sync_api import expect
from test_new_games import QuietHandler, ROOT
from test_more_games import MoreGames

PACK = json.loads((ROOT / 'assets/offline-pack.js').read_text().split(' = ', 1)[1].rstrip(';\n'))


class Handler(QuietHandler):
    def do_GET(self):
        original = self.path.split('?', 1)[0]
        path = original.removeprefix('/salon') if original.startswith('/salon/') else original
        override = self.server.overrides.get(path)
        if override:
            status, mime, body, delay = override
            if delay:
                time.sleep(delay)
            self.send_response(status)
            self.send_header('Content-Type', mime)
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            try:
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass
            return
        if original.startswith('/salon/'):
            self.path = self.path.removeprefix('/salon')
        super().do_GET()


class Server(ThreadingHTTPServer):
    request_queue_size = 64
    daemon_threads = True


class PWAChecks(MoreGames):
    @classmethod
    def setUpClass(cls):
        # Use the common browser setup, replacing only the HTTP server for failure/update fixtures.
        super().setUpClass()
        cls.server.shutdown()
        cls.server.server_close()
        cls.server = Server(('127.0.0.1', 0), partial(Handler, directory=str(ROOT)))
        cls.server.overrides = {}
        Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.base = 'http://127.0.0.1:' + str(cls.server.server_port)

    @contextmanager
    def app(self, prefix='', width=390):
        self.server.overrides.clear()
        context = self.browser.new_context(viewport={'width': width, 'height': 844}, has_touch=True, reduced_motion='reduce')
        context.add_init_script('if(self===top)localStorage.setItem("spinner:consent:v1",JSON.stringify({version:1,preferences:false,savedAt:Date.now()}))')
        p = context.new_page()
        p.set_default_timeout(10000)
        errors = []
        p.on('pageerror', lambda e: errors.append(str(e)))
        try:
            p.goto(self.base + prefix + '/aplikacja.html')
            expect(p.locator('#offline-download')).to_be_enabled(timeout=30000)
            p.wait_for_function('Boolean(navigator.serviceWorker.controller)')
            yield p
            self.assertEqual(errors, [])
        finally:
            context.close()
            self.server.overrides.clear()

    def status(self, p, type='STATUS'):
        return p.evaluate('''async type => {
          const r=await navigator.serviceWorker.getRegistration();
          return new Promise(resolve=>{const c=new MessageChannel();c.port1.onmessage=e=>resolve(e.data);r.active.postMessage({type},[c.port2]);});
        }''', type)

    def download(self, p):
        p.locator('#offline-download').click()
        expect(p.locator('#offline-title')).to_have_text('Gotowe. Możesz odłączyć internet.', timeout=60000)
        state = self.status(p)
        self.assertTrue(state['ready'])
        self.assertEqual(state['completed'], state['total'])

    def test_manifest_icons_allowlist_and_reproducible_pack(self):
        subprocess.run(['python3', 'scripts/build_offline_pack.py', '--check'], cwd=ROOT, check=True, capture_output=True)
        manifest = json.loads((ROOT / 'manifest.webmanifest').read_text())
        self.assertEqual(manifest['display'], 'standalone')
        self.assertEqual(manifest['scope'], './')
        self.assertEqual(manifest['start_url'], './index.html')
        self.assertEqual(PACK['games'], 100)
        self.assertTrue(set(PACK['core']) <= set(PACK['files']))
        self.assertFalse(any('others/' in p or 'firebase' in p.lower() for p in PACK['files']))
        with self.app() as p:
            for icon in manifest['icons'] + [{'src': 'assets/icons/apple-touch-icon.png', 'sizes': '180x180'}]:
                dimensions = p.evaluate('''async src=>{const i=new Image();i.src=src;await i.decode();return i.naturalWidth+'x'+i.naturalHeight;}''', icon['src'])
                self.assertEqual(dimensions, icon['sizes'])
            for width, height in [(320, 568), (390, 844), (844, 390), (1440, 900)]:
                p.set_viewport_size({'width': width, 'height': height})
                for mode in ['dark', 'light']:
                    p.evaluate('(m)=>SpinnerTheme.set(m)', mode)
                    self.assertEqual(p.locator('meta[name=theme-color]').get_attribute('content'), '#11140f' if mode=='dark' else '#f4f1e8')
                    self.assertFalse(p.evaluate('document.documentElement.scrollWidth>innerWidth'))
                    expect(p.get_by_role('navigation', name='Menu główne').get_by_role('link', name='Gry', exact=False)).to_be_visible()
            expect(p.get_by_text('Wkrótce na Androida.', exact=True)).to_be_visible()

    def test_full_pack_all_one_hundred_real_games_cold_offline_and_no_personal_cache(self):
        with self.app() as p:
            self.download(p)
            context = p.context
            context.set_offline(True)
            cold = context.new_page()
            p.close()
            errors = []
            cold.on('pageerror', lambda e: errors.append(str(e)))
            response = cold.goto(self.base + '/index.html')
            self.assertTrue(response.from_service_worker)
            expect(cold.locator('.game-card')).to_have_count(100)
            games = cold.evaluate('SpinnerGames')
            for game in games:
                with self.subTest(game=game['id']):
                    response = cold.goto(self.base + '/gra.html?gra=' + game['id'])
                    self.assertTrue(response.from_service_worker)
                    expect(cold.locator('#game-placeholder')).to_have_count(0)
                    frame = cold.frames[1]
                    frame.wait_for_function('document.body.dataset.viewportReady === "true"')
                    expect(frame.locator('#gameCanvas' if game['id']=='arena' else '.gv-cabinet')).to_be_visible()
                    self.assertFalse(frame.evaluate('document.documentElement.scrollWidth>innerWidth'))
            cold.goto(self.base + '/index.html')
            cold.evaluate("SpinnerSalon.openGame('snake')")
            expect(cold.locator('.salon-player-loading')).to_have_count(0)
            frame = cold.frames[1]
            frame.locator('#snake-start').click()
            expect(frame.locator('.snake-controls button').first).to_be_in_viewport(ratio=1)
            cold.locator('#salon-player-close').click()
            cold.locator('[data-account]').click()
            expect(cold.locator('#account-message')).to_contain_text('Jesteś offline')
            keys = cold.evaluate('''async()=>{const result=[];for(const n of await caches.keys())for(const r of await (await caches.open(n)).keys())result.push(new URL(r.url).pathname);return result;}''')
            self.assertFalse(any('/others/' in k or 'firebase' in k.lower() for k in keys))
            self.assertEqual(cold.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'), [])
            self.assertEqual(errors, [])

    def test_visited_game_offline_query_normalization_and_uncached_game_fallback(self):
        with self.app(prefix='/salon') as p:
            p.goto(self.base + '/salon/gra.html?gra=memory')
            expect(p.locator('#game-placeholder')).to_have_count(0)
            p.context.set_offline(True)
            p.goto(self.base + '/salon/gra.html?gra=memory&retry=123')
            expect(p.locator('#game-placeholder')).to_have_count(0)
            response = p.evaluate("fetch('assets/game-memory.js?v=future').then(r=>r.status)")
            self.assertEqual(response, 200)
            p.goto(self.base + '/salon/index.html')
            expect(p.locator('.game-card')).to_have_count(100)
            p.evaluate("[...document.images].forEach(i=>i.loading='eager')")
            p.wait_for_function('[...document.images].filter(i=>i.getAttribute("src")).every(i=>i.complete && i.naturalWidth>0)')
            p.goto(self.base + '/salon/games/chess.html')
            expect(p.locator('[data-offline-page]')).to_be_visible()
            link = p.get_by_role('link', name='Pobierz gry offline ↓', exact=True)
            self.assertEqual(link.evaluate('(a)=>a.href'), self.base + '/salon/aplikacja.html')
            link.click()
            expect(p.locator('#offline-download')).to_be_disabled()
            expect(p.locator('#offline-title')).to_contain_text('Połącz się')

    def test_failure_is_incomplete_and_retry_keeps_previously_downloaded_files(self):
        with self.app() as p:
            self.server.overrides['/assets/game-chess.js'] = (200, 'text/html', b'<p>Hosting error</p>', 0)
            p.locator('#offline-download').click()
            expect(p.locator('#offline-detail')).to_contain_text('Nie udało się pobrać wszystkich plików', timeout=60000)
            partial = self.status(p)
            self.assertFalse(partial['ready'])
            self.assertGreater(partial['completed'], len(PACK['core']))
            self.server.overrides.clear()
            self.download(p)
            self.assertGreater(self.status(p)['completed'], partial['completed'])

    def test_cancel_and_resume_and_clearing_only_public_files(self):
        with self.app() as p:
            self.server.overrides['/assets/game-chess.js'] = (200, 'text/javascript', (ROOT / 'assets/game-chess.js').read_bytes(), 1)
            p.locator('#offline-download').click()
            expect(p.locator('#offline-cancel')).to_be_visible()
            p.locator('#offline-cancel').click()
            expect(p.locator('#offline-cancel')).to_be_hidden()
            self.assertFalse(self.status(p)['ready'])
            self.server.overrides.clear()
            self.download(p)
            p.evaluate('''async()=>{
              SpinnerStorage.choose(true);SpinnerStorage.preferences.set('pwa-test',42);
              sessionStorage.setItem('spinner:auth-active','fixture');
              const other=await caches.open('unrelated-cache');await other.put('/unrelated',new Response('retain'));
            }''')
            p.locator('#offline-clear').click()
            expect(p.locator('#offline-remove-dialog')).to_be_visible()
            p.get_by_role('button', name='Zostaw gry', exact=True).click()
            self.assertTrue(self.status(p)['ready'])
            p.locator('#offline-clear').click()
            p.locator('#offline-remove-confirm').click()
            expect(p.locator('#offline-detail')).to_contain_text('Pobrane pliki aplikacji usunięte')
            self.assertEqual(self.status(p)['completed'], 0)
            self.assertEqual(p.evaluate("SpinnerStorage.preferences.get('pwa-test')"), 42)
            self.assertEqual(p.evaluate("sessionStorage.getItem('spinner:auth-active')"), 'fixture')
            self.assertTrue(p.evaluate("caches.has('unrelated-cache')"))

    def test_update_waits_for_click_and_preserves_complete_pack_and_other_tab(self):
        with self.app() as p:
            self.download(p)
            second = p.context.new_page()
            second.goto(self.base + '/index.html')
            second.evaluate('window.roundNotReloaded=42')
            old = self.status(p)['version']
            newer = dict(PACK, version='pwa-update-fixture-v2')
            self.server.overrides['/assets/offline-pack.js'] = (200, 'text/javascript', ('self.SpinnerOfflinePack=' + json.dumps(newer) + ';').encode(), 0)
            self.server.overrides['/service-worker.js'] = (200, 'text/javascript', (ROOT / 'service-worker.js').read_bytes() + b'\n// Update fixture\n', 0)
            p.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.update())')
            p.wait_for_function('navigator.serviceWorker.getRegistration().then(r=>Boolean(r.waiting))', timeout=60000)
            expect(p.locator('#app-update')).to_be_visible()
            self.assertEqual(self.status(p)['version'], old)
            with p.expect_navigation(wait_until='domcontentloaded'):
                p.locator('#app-update-button').click()
            p.wait_for_function('navigator.serviceWorker.getRegistration().then(r=>r.active && !r.waiting)')
            expect(p.locator('#offline-title')).to_have_text('Gotowe. Możesz odłączyć internet.', timeout=30000)
            self.assertEqual(self.status(p)['version'], newer['version'])
            self.assertEqual(second.evaluate('roundNotReloaded'), 42)
            names=p.evaluate('caches.keys()')
            self.assertEqual(len(names), 1)
            self.assertTrue(names[0].endswith(newer['version']))
            p.context.set_offline(True)
            p.goto(self.base + '/gra.html?gra=chess')
            expect(p.locator('#game-placeholder')).to_have_count(0)

    def test_private_archive_keeps_its_own_scope_and_never_enters_public_cache(self):
        with self.app() as p:
            p.evaluate('''async()=>{
              const r=await navigator.serviceWorker.register('others/service-worker.js',{scope:'others/'});
              if(!r.active)await new Promise(resolve=>{r.installing.addEventListener('statechange',()=>{if(r.active)resolve()})});
            }''')
            p.goto(self.base + '/others/index.html')
            p.wait_for_function("navigator.serviceWorker.controller?.scriptURL.endsWith('/others/service-worker.js')")
            p.goto(self.base + '/aplikacja.html')
            p.wait_for_function("navigator.serviceWorker.controller?.scriptURL.endsWith('/service-worker.js') && !navigator.serviceWorker.controller.scriptURL.includes('/others/')")
            self.assertTrue(p.evaluate("navigator.serviceWorker.getRegistration('others/').then(r=>Boolean(r?.active))"))
            keys = p.evaluate('''async()=>{const r=[];for(const n of await caches.keys())if(n.startsWith('spinner-public-'))for(const q of await(await caches.open(n)).keys())r.push(q.url);return r;}''')
            self.assertFalse(any('/others/' in k for k in keys))

    def test_first_preparation_failure_has_a_working_retry(self):
        self.server.overrides['/assets/salon.css'] = (200, 'text/html', b'<p>Temporarily unavailable</p>', 0)
        context = self.browser.new_context()
        p = context.new_page()
        try:
            p.goto(self.base + '/aplikacja.html')
            expect(p.locator('#offline-detail')).to_contain_text('Nie udało się przygotować aplikacji', timeout=15000)
            expect(p.locator('#offline-retry')).to_be_visible()
            self.server.overrides.clear()
            with p.expect_navigation():
                p.locator('#offline-retry').click()
            # The cookie panel is separate from the requested functional download.
            p.get_by_role('button', name='Tylko niezbędne', exact=True).click()
            expect(p.locator('#offline-download')).to_be_enabled(timeout=30000)
            self.download(p)
        finally:
            context.close()
            self.server.overrides.clear()

    def test_failed_update_retains_the_existing_complete_offline_pack(self):
        with self.app() as p:
            self.download(p)
            previous = self.status(p)['version']
            newer = dict(PACK, version='failed-update-fixture')
            self.server.overrides['/assets/offline-pack.js'] = (200, 'text/javascript', ('self.SpinnerOfflinePack=' + json.dumps(newer) + ';').encode(), 0)
            self.server.overrides['/service-worker.js'] = (200, 'text/javascript', (ROOT / 'service-worker.js').read_bytes() + b'\n// Failed update fixture\n', 0)
            self.server.overrides['/assets/game-chess.js'] = (200, 'text/html', b'<p>Hosting error</p>', 0)
            p.evaluate('''async()=>{
              const r=await navigator.serviceWorker.getRegistration();
              await new Promise(async resolve=>{
                r.addEventListener('updatefound',()=>{const w=r.installing;w.addEventListener('statechange',()=>{if(w.state==='redundant')resolve()})},{once:true});
                await r.update();
              });
            }''')
            self.assertEqual(self.status(p)['version'], previous)
            self.assertTrue(self.status(p)['ready'])
            p.context.set_offline(True)
            p.goto(self.base + '/gra.html?gra=chess')
            expect(p.locator('#game-placeholder')).to_have_count(0)

    def test_two_scopes_on_the_same_origin_keep_separate_downloads(self):
        with self.app() as p:
            other = p.context.new_page()
            other.goto(self.base + '/salon/aplikacja.html')
            expect(other.locator('#offline-download')).to_be_enabled(timeout=30000)
            other.wait_for_function('Boolean(navigator.serviceWorker.controller)')
            self.download(other)
            self.status(p, 'CLEAR')
            self.assertEqual(self.status(p)['completed'], 0)
            self.assertTrue(self.status(other)['ready'])
            p.context.set_offline(True)
            other.goto(self.base + '/salon/gra.html?gra=chess')
            expect(other.locator('#game-placeholder')).to_have_count(0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
