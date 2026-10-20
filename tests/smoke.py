"""Browser regression checks. Firebase HTTP responses are simulated; no production accounts are touched."""
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import base64
import json
import os
import time
import unittest
from urllib.parse import urlsplit, unquote
from html.parser import HTMLParser
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_): pass

class SiteChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
        Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.base = 'http://127.0.0.1:' + str(cls.server.server_port)
        cls.playwright = sync_playwright().start()
        executable = os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium')
        cls.browser = cls.playwright.chromium.launch(headless=True, executable_path=executable,
            args=['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close(); cls.playwright.stop(); cls.server.shutdown(); cls.server.server_close()

    @contextmanager
    def page(self, width=1440, consent=None):
        context = self.browser.new_context(viewport={'width':width, 'height':900}, reduced_motion='reduce')
        if consent is not None:
            context.add_init_script('localStorage.setItem("spinner:consent:v1",' + json.dumps(json.dumps(
                {'version':1, 'preferences':consent, 'savedAt':int(time.time()*1000)})) + ');')
        page = context.new_page(); page.set_default_timeout(7000)
        try: yield page
        finally: context.close()

    def test_catalog_search_categories_and_no_external_requests(self):
        with self.page() as page:
            external = []; errors = []
            page.on('request', lambda r: external.append(r.url) if not r.url.startswith(self.base) else None)
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(self.base)
            expect(page.locator('.game-card')).to_have_count(8)
            self.assertEqual(page.evaluate('Object.keys(localStorage)'), [])
            page.locator('#game-search').fill('kolko')
            expect(page.locator('.game-card')).to_have_count(1)
            expect(page.locator('.card-info h3')).to_have_text('Kółko i krzyżyk')
            page.locator('#game-search').fill('<img src=x onerror=alert(1)>')
            expect(page.locator('#empty-state')).to_be_visible()
            page.locator('#game-search').fill('')
            page.get_by_role('button', name='Na główkowanie', exact=True).click()
            expect(page.locator('.game-card')).to_have_count(4)
            self.assertEqual(external, []); self.assertEqual(errors, [])

    def test_consent_favorites_persistence_revocation_and_unrelated_storage(self):
        with self.page() as page:
            page.goto(self.base)
            page.get_by_role('button', name='Tylko niezbędne', exact=True).click()
            page.locator('.favorite').first.click()
            self.assertEqual(page.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'), [])
            page.reload(); expect(page.locator('.favorite[aria-pressed=true]')).to_have_count(0)
            page.get_by_role('button', name='Ustawienia cookies', exact=True).click()
            page.locator('#cookie-preferences').check(); page.locator('#save-cookies').click()
            page.locator('.favorite').first.click(); page.reload()
            expect(page.locator('.favorite[aria-pressed=true]')).to_have_count(1)
            page.get_by_role('button', name='Ulubione', exact=False).first.click()
            expect(page.locator('.game-card')).to_have_count(1)
            page.evaluate('localStorage.setItem("unrelated-setting","keep")')
            page.get_by_role('button', name='Ustawienia cookies', exact=True).click()
            page.locator('#cookie-preferences').uncheck(); page.locator('#save-cookies').click()
            self.assertEqual(page.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'), [])
            self.assertEqual(page.evaluate('localStorage.getItem("unrelated-setting")'), 'keep')
            page.reload(); expect(page.locator('.favorite[aria-pressed=true]')).to_have_count(0)

    def test_all_catalog_games_mobile_load_without_errors(self):
        with self.page(390, consent=False) as page:
            page.goto(self.base)
            games = page.evaluate('SpinnerGames')
            errors=[]; failures=[]; external=[]
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('response', lambda r: failures.append(r.url) if r.status >= 400 else None)
            page.on('request', lambda r: external.append(r.url) if not r.url.startswith(self.base) else None)
            for game in games:
                with self.subTest(game=game['id']):
                    errors.clear(); failures.clear(); external.clear()
                    page.goto(self.base + '/gra.html?gra=' + game['id'])
                    expect(page.locator('#game-placeholder')).to_have_count(0)
                    self.assertFalse(page.evaluate('document.documentElement.scrollWidth > innerWidth'))
                    self.assertEqual(errors, []); self.assertEqual(failures, []); self.assertEqual(external, [])
                    self.assertEqual(page.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'), [])

    def test_responsive_pages(self):
        with self.page(consent=False) as page:
            for width in [320, 390, 768, 1440]:
                page.set_viewport_size({'width':width, 'height':900})
                for path in ['/', '/o-serwisie.html', '/prywatnosc.html']:
                    with self.subTest(width=width,path=path):
                        page.goto(self.base+path); page.evaluate('document.fonts.ready')
                        self.assertFalse(page.evaluate('document.documentElement.scrollWidth > innerWidth'))
                        expect(page.locator('h1')).to_be_visible()

    def test_theme_follows_system_and_persists_only_as_requested(self):
        context=self.browser.new_context(color_scheme='dark',reduced_motion='reduce')
        page=context.new_page()
        try:
            page.goto(self.base)
            expect(page.locator('html')).to_have_attribute('data-theme','dark')
            expect(page.locator('body')).to_have_css('background-color','rgb(17, 20, 15)')
            page.get_by_role('button',name='Tylko niezbędne',exact=True).click()
            page.get_by_role('button',name='Włącz jasny motyw',exact=True).click()
            page.goto(self.base+'/prywatnosc.html')
            expect(page.locator('html')).to_have_attribute('data-theme','light')
            self.assertEqual(page.evaluate('sessionStorage.getItem("spinner:theme:session")'),'light')
            self.assertEqual(page.evaluate('localStorage.getItem("spinner:prefs:theme")'),None)
            page.get_by_role('button',name='Zmień ustawienia cookies',exact=False).click()
            page.locator('#cookie-preferences').check();page.locator('#save-cookies').click()
            self.assertEqual(page.evaluate('JSON.parse(localStorage.getItem("spinner:prefs:theme"))'),'light')
            new_tab=context.new_page();new_tab.goto(self.base)
            expect(new_tab.locator('html')).to_have_attribute('data-theme','light')
            new_tab.close()
            page.get_by_role('button',name='Zmień ustawienia cookies',exact=False).click()
            page.locator('#cookie-preferences').uncheck();page.locator('#save-cookies').click()
            self.assertEqual(page.evaluate('localStorage.getItem("spinner:prefs:theme")'),None)
            self.assertEqual(page.evaluate('sessionStorage.getItem("spinner:theme:session")'),'light')
            page.locator('[data-clear-preferences]').click()
            self.assertEqual(page.evaluate('sessionStorage.getItem("spinner:theme:session")'),None)
            expect(page.locator('html')).to_have_attribute('data-theme','dark')
        finally:context.close()

    def test_every_game_in_both_themes_without_inner_overflow(self):
        with self.page(390,consent=False) as page:
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(self.base);games=page.evaluate('SpinnerGames')
            for game in games:
                with self.subTest(game=game['id']):
                    page.goto(self.base+'/gra.html?gra='+game['id'])
                    frame=page.frame_locator('#game-stage iframe')
                    expect(frame.locator('body')).to_have_attribute('data-game',game['id'])
                    for mode in ['dark','light']:
                        page.evaluate('(mode)=>SpinnerTheme.set(mode)',mode)
                        expect(frame.locator('html')).to_have_attribute('data-theme',mode)
                        self.assertFalse(page.frames[1].evaluate('document.documentElement.scrollWidth>innerWidth'),game['id'])
                    self.assertEqual(errors,[])
            page.goto(self.base+'/gra.html?gra=tictactoe')
            cells=page.frame_locator('#game-stage iframe').locator('#board button')
            cells.nth(4).click();expect(cells.nth(4)).to_have_text('X')
            page.get_by_role('button',name='Włącz ciemny motyw',exact=True).click()
            expect(cells.nth(4)).to_have_text('X')
            page.goto(self.base+'/gra.html?gra=saper')
            frame=page.frame_locator('#game-stage iframe')
            frame.locator('#game .cell').nth(40).click()
            opened=frame.locator('#game .cell.open').count()
            self.assertGreater(opened,0)
            page.get_by_role('button',name='Włącz jasny motyw',exact=True).click()
            self.assertEqual(frame.locator('#game .cell.open').count(),opened)

    def test_tictactoe_win_ai_lock_and_restart_cancels_pending_move(self):
        with self.page(consent=False) as page:
            page.goto(self.base+'/games/tictactoe.html')
            cells=page.locator('#board .cell')
            for i in [0,3,1,4,2]: cells.nth(i).click()
            expect(page.locator('#status')).to_contain_text('wygrywa')
            self.assertEqual(page.locator('#board button:disabled').count(),9)
            page.locator('#difficulty').select_option('amator')
            cells.nth(0).click(); cells.nth(1).click()
            self.assertEqual(cells.filter(has_text='X').count(),1)
            page.locator('#restart').click(); page.wait_for_timeout(650)
            self.assertEqual(page.locator('#board button').all_text_contents(), ['']*9)
            # Native button semantics let keyboard users play.
            cells.nth(4).focus(); page.keyboard.press('Enter')
            expect(cells.nth(4)).to_have_text('X')

    def test_saper_first_move_and_local_save_choice(self):
        with self.page(consent=False) as page:
            page.goto(self.base+'/games/saper.html')
            expect(page.locator('#game .cell')).to_have_count(81)
            page.locator('#game .cell').nth(40).click()
            self.assertGreater(page.locator('#game .cell.open').count(),0)
            expect(page.locator('#game .cell.mine')).to_have_count(0)
            page.evaluate('ArcadeProgress.database().ref("users/local/points").set(27)')
            self.assertEqual(page.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'), [])
        with self.page(consent=True) as page:
            page.goto(self.base+'/games/saper.html')
            page.evaluate('ArcadeProgress.database().ref("users/local/points").set(27)')
            page.reload(); expect(page.locator('#points-info')).to_contain_text('27')



    def test_classic_bird_has_start_restart_and_no_alert_loop(self):
        with self.page(consent=False) as page:
            page.goto(self.base+'/flappy.html')
            expect(page.locator('#bird-overlay')).to_be_visible()
            page.locator('#bird-start').click(); expect(page.locator('#bird-overlay')).to_be_hidden()
            expect(page.locator('#bird-overlay')).to_be_visible(timeout=5000)
            expect(page.locator('#bird-start')).to_have_text('Jeszcze raz ↻')
            page.locator('#bird-start').click(); expect(page.locator('#bird-score')).to_have_text('0')

    def test_arena_aim_uses_the_canvas_position_and_resizes_with_its_cabinet(self):
        with self.page(consent=False) as page:
            page.goto(self.base+'/games/snake.html')
            page.locator('#start-btn').click()
            self.assertTrue(page.evaluate('game.isRunning'))
            page.wait_for_function('game.canvas.width===document.querySelector("#game-container").clientWidth')
            rect=page.locator('#gameCanvas').bounding_box()
            page.mouse.move(rect['x']+rect['width']/2+80,rect['y']+rect['height']/2)
            self.assertAlmostEqual(page.evaluate('game.player.targetAngle'),0,places=2)
            page.set_viewport_size({'width':390,'height':844})
            page.wait_for_function('game.canvas.width===document.querySelector("#game-container").clientWidth')
            self.assertLess(page.evaluate('game.canvas.width'),390)

    def test_real_firebase_sdk_initializes_only_on_request(self):
        with self.page(consent=False) as page:
            page.goto(self.base)
            self.assertFalse(page.evaluate('Boolean(window.firebase)'))
            page.get_by_role('button',name='Twoje konto').click()
            expect(page.locator('#auth-submit')).to_be_enabled()
            self.assertEqual(page.evaluate('firebase.SDK_VERSION'),'13.0.0')
            expect(page.locator('#nickname-field')).to_be_hidden()
            page.keyboard.press('Escape'); expect(page.locator('#account-dialog')).not_to_be_visible()

    def test_password_login_profile_reset_and_safe_rendering_with_simulated_firebase_http(self):
        def encoded(obj):return base64.urlsafe_b64encode(json.dumps(obj).encode()).decode().rstrip('=')
        now=int(time.time())
        token=encoded({'alg':'RS256','typ':'JWT'})+'.'+encoded({'sub':'fixture-uid','user_id':'fixture-uid','iat':now,'exp':now+3600,'auth_time':now,'firebase':{'sign_in_provider':'password'}})+'.fixture'
        calls=[]
        with self.page(consent=False) as page:
            def service(route):
                request=route.request
                payload=json.loads(request.post_data or '{}'); calls.append((request.url.split('?')[0],payload))
                response={}
                if 'accounts:signInWithPassword' in request.url:
                    if payload['password']!='  secure password  ':
                        route.fulfill(status=400,json={'error':{'message':'INVALID_LOGIN_CREDENTIALS'}});return
                    response={'localId':'fixture-uid','email':'player@example.test','displayName':'<img src=x onerror=alert(1)>','idToken':token,'refreshToken':'fixture-refresh','expiresIn':'3600'}
                elif 'accounts:lookup' in request.url:
                    response={'users':[{'localId':'fixture-uid','email':'player@example.test','displayName':'<img src=x onerror=alert(1)>','emailVerified':True,'providerUserInfo':[{'providerId':'password','email':'player@example.test','rawId':'player@example.test'}]}]}
                elif 'accounts:sendOobCode' in request.url:response={'email':'player@example.test'}
                elif 'accounts:delete' in request.url:response={}
                elif 'recaptchaConfig' in request.url:response={'recaptchaEnforcementState':[]}
                route.fulfill(status=200,json=response)
            page.route('https://identitytoolkit.googleapis.com/**',service)
            page.route('https://securetoken.googleapis.com/**',service)
            page.goto(self.base)
            # A forged old nickname must not authenticate anyone.
            page.evaluate('localStorage.setItem("sp_logged","forged-admin")');page.reload()
            expect(page.locator('[data-account-label]')).to_have_text('Twoje konto')
            page.get_by_role('button',name='Twoje konto').click()
            expect(page.locator('#auth-submit')).to_be_enabled()
            page.locator('#auth-form [name=email]').fill('player@example.test')
            page.locator('#auth-form [name=password]').fill('wrong password')
            page.locator('#auth-submit').click();expect(page.locator('#account-message')).to_contain_text('nieprawidłowe')
            page.locator('#auth-form [name=password]').fill('  secure password  ')
            page.locator('#auth-submit').click()
            expect(page.locator('#profile-section')).to_be_visible()
            expect(page.locator('#profile-name')).to_have_text('<img src=x onerror=alert(1)>')
            expect(page.locator('#profile-name img')).to_have_count(0)
            self.assertFalse(page.evaluate('Boolean(localStorage.getItem("sp_pass"))'))
            page.locator('#profile-reset').click();expect(page.locator('#account-message')).to_contain_text('link zmiany hasła')
            page.locator('#email-form [name=newEmail]').fill('updated@example.test')
            page.locator('#email-form [name=currentPassword]').fill('  secure password  ')
            page.get_by_role('button',name='Zmień e-mail',exact=False).click()
            expect(page.locator('#account-message')).to_contain_text('Potwierdź nowy adres')
            self.assertTrue(any(data.get('requestType')=='VERIFY_AND_CHANGE_EMAIL' for _,data in calls))
            page.locator('#logout').click()
            expect(page.locator('#auth-section')).to_be_visible()
            self.assertIsNotNone(page.evaluate('localStorage.getItem("spinner:consent:v1")'))
            page.locator('#auth-form [name=email]').fill('player@example.test')
            page.locator('#auth-form [name=password]').fill('  secure password  ')
            page.locator('#auth-submit').click();expect(page.locator('#profile-section')).to_be_visible()
            page.locator('summary').click()
            page.locator('#delete-form [name=confirmation]').fill('USUŃ')
            page.locator('#delete-form [name=currentPassword]').fill('  secure password  ')
            page.get_by_role('button',name='Trwale usuń konto',exact=True).click()
            expect(page.locator('#account-message')).to_contain_text('Konto logowania zostało usunięte')
            paths=[url for url,_ in calls]
            self.assertTrue(any('accounts:delete' in url for url in paths))
            self.assertEqual([data['password'] for url,data in calls if 'signInWithPassword' in url][-1],'  secure password  ')
            page.locator('#password-reset').click()
            expect(page.locator('#password-field')).to_be_hidden()
            page.locator('#auth-form [name=email]').fill('unknown@example.test')
            page.locator('#auth-submit').click()
            expect(page.locator('#account-message')).to_contain_text('Jeżeli konto istnieje')

if __name__=='__main__': unittest.main(verbosity=2)
