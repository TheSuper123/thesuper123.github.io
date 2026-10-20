"""Archive crypto and browser access checks use a disposable fixture, never the real password."""
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import importlib.util
import json
import os
import shutil
import tempfile
import unittest
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('others_archive',ROOT/'scripts/others_archive.py')
archive=importlib.util.module_from_spec(spec);spec.loader.exec_module(archive)
# Deliberately public test-only value. It is unrelated to the deployed archive password.
FIXTURE_PASSWORD='Fixture-only-zażółć-42!'

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*_):pass

class ArchiveChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory(prefix='spinner-archive-tests-')
        cls.root=Path(cls.temp.name)
        shutil.copytree(ROOT/'others',cls.root/'others',ignore=shutil.ignore_patterns('data','manifest.json','README.md'))
        for path in ['assets/site.css','assets/mark.svg','assets/fonts/sans.ttf','assets/fonts/serif.ttf','assets/fonts/mono.ttf']:
            target=cls.root/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/path,target)
        (cls.root/'others/probe.html').write_text('<!doctype html><p>Fixture probe</p>')
        cls.contents={
            'index.html':b'<!doctype html><html lang="en"><meta charset="utf-8"><link rel="stylesheet" href="secret.css"><script src="secret.js" defer></script><h1>Private fixture</h1><p id="proof"></p><img src="secret.svg" alt="Fixture"><a href="next.html">Next</a></html>',
            'next.html':b'<!doctype html><p>second encrypted page</p>',
            'secret.css':b'h1{color:rgb(12,34,56)}',
            'secret.js':b'document.querySelector("#proof").textContent="decrypted script";',
            'secret.svg':b'<svg xmlns="http://www.w3.org/2000/svg" width="5" height="5"><rect width="5" height="5" fill="red"/></svg>'
        }
        cls.manifest=archive.encrypt_collection(cls.contents,FIXTURE_PASSWORD,cls.root/'others')
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(cls.root)))
        Thread(target=cls.server.serve_forever,daemon=True).start()
        cls.base='http://127.0.0.1:'+str(cls.server.server_port)
        cls.playwright=sync_playwright().start()
        cls.browser=cls.playwright.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.playwright.stop();cls.server.shutdown();cls.server.server_close();cls.temp.cleanup()

    @contextmanager
    def page(self,suppress_pagehide=False):
        context=self.browser.new_context(viewport={'width':390,'height':844})
        if suppress_pagehide:
            context.add_init_script("const originalAdd=window.addEventListener.bind(window);window.addEventListener=(type,...args)=>{if(type!=='pagehide')originalAdd(type,...args)};")
        page=context.new_page();page.set_default_timeout(8000)
        try:
            page.goto(self.base+'/others/')
            expect(page.locator('#unlock-button')).to_be_enabled()
            yield page
        finally:context.close()

    def unlock(self,page,password=FIXTURE_PASSWORD):
        page.locator('#vault-password').fill(password);page.locator('#unlock-button').click()

    def test_roundtrip_salt_nonce_and_wrong_password(self):
        _,content=archive.decrypt_collection(self.root/'others',FIXTURE_PASSWORD)
        self.assertEqual(content,self.contents)
        with self.assertRaises(ValueError):archive.decrypt_collection(self.root/'others','incorrect')
        ivs=[(self.root/'others'/item['file']).read_bytes()[:12] for item in self.manifest['files'].values()]
        self.assertEqual(len(ivs),len(set(ivs)))
        with tempfile.TemporaryDirectory() as directory:
            other=archive.encrypt_collection(self.contents,FIXTURE_PASSWORD,Path(directory)/'other')
            self.assertNotEqual(other['kdf']['salt'],self.manifest['kdf']['salt'])
            self.assertNotEqual(other['verifier'],self.manifest['verifier'])

    def test_no_plaintext_and_direct_access_is_locked(self):
        with self.page() as page:
            self.assertEqual(page.evaluate('(async()=> (await fetch("content/index.html")).status)()'),401)
            self.assertFalse(page.evaluate('document.documentElement.scrollWidth>innerWidth'))
            for path,item in self.manifest['files'].items():
                self.assertFalse((self.root/'others/content'/path).exists())
                self.assertNotIn(FIXTURE_PASSWORD.encode(),(self.root/'others'/item['file']).read_bytes())
            self.unlock(page,'incorrect')
            expect(page.locator('#vault-message')).to_have_text('Nieprawidłowe hasło.')
            expect(page.locator('#unlocked-view')).to_be_hidden()

    def test_unlock_all_resources_navigation_lock_and_reload(self):
        with self.page() as page:
            errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            self.unlock(page)
            frame=page.frame_locator('#archive-frame')
            expect(frame.locator('#proof')).to_have_text('decrypted script')
            expect(frame.locator('h1')).to_have_css('color','rgb(12, 34, 56)')
            self.assertEqual(page.frames[1].evaluate('document.querySelector("img").naturalWidth'),5)
            self.assertEqual(page.locator('#vault-password').input_value(),'')
            self.assertEqual(page.evaluate('Object.keys(localStorage)'),[])
            self.assertEqual(page.evaluate('Object.keys(sessionStorage)'),[])
            self.assertEqual(page.evaluate('(async()=> (await fetch("content/index.html")).headers.get("Cache-Control"))()'),'no-store, private, max-age=0')
            frame.get_by_role('link',name='Next').click()
            expect(frame.locator('p')).to_have_text('second encrypted page')
            page.locator('#lock-button').click()
            expect(page.locator('#archive-frame')).to_have_count(0)
            self.assertEqual(page.evaluate('(async()=> (await fetch("content/index.html")).status)()'),401)
            self.unlock(page);expect(page.locator('#unlocked-view')).to_be_visible()
            page.reload();expect(page.locator('#unlock-button')).to_be_enabled()
            self.assertEqual(page.evaluate('(async()=> (await fetch("content/index.html")).status)()'),401)
            self.assertEqual(errors,[])

    def test_forged_worker_message_cannot_bypass_encryption(self):
        with self.page() as page:
            result=page.evaluate('''async()=>{
              const reg=await navigator.serviceWorker.ready;
              const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['decrypt']);
              return await new Promise(resolve=>{const c=new MessageChannel();c.port1.onmessage=e=>resolve(e.data.ok);reg.active.postMessage({type:'UNLOCK',key},[c.port2]);});
            }''')
            self.assertFalse(result)
            self.assertEqual(page.evaluate('(async()=> (await fetch("content/index.html")).status)()'),401)

    def test_tampered_ciphertext_cannot_be_opened(self):
        file=self.root/'others'/self.manifest['files']['index.html']['file']
        original=file.read_bytes();tampered=bytearray(original);tampered[-1]^=1
        try:
            file.write_bytes(tampered)
            with self.page() as page:
                self.unlock(page)
                expect(page.locator('#vault-message')).to_contain_text('Nie udało się otworzyć archiwum')
                expect(page.locator('#unlocked-view')).to_be_hidden()
                self.assertEqual(page.evaluate('(async()=> (await fetch("content/index.html")).status)()'),401)
        finally:file.write_bytes(original)

    def test_closed_gate_invalidates_access_even_without_pagehide_handler(self):
        with self.page(suppress_pagehide=True) as page:
            self.unlock(page);expect(page.locator('#unlocked-view')).to_be_visible()
            probe=page.context.new_page();probe.goto(self.base+'/others/probe.html')
            self.assertEqual(probe.evaluate('(async()=> (await fetch("content/index.html")).status)()'),200)
            page.close()
            self.assertEqual(probe.evaluate('(async()=> (await fetch("content/index.html")).status)()'),401)

    def test_actual_archive_has_no_plaintext_sources_in_checkout(self):
        info=json.loads((ROOT/'others/manifest.json').read_text())
        self.assertGreater(len(info['originals']),100)
        for path in info['originals']:
            self.assertFalse((ROOT/path).exists(),path)
            self.assertTrue((ROOT/'others'/info['files'][path]['file']).is_file(),path)

if __name__=='__main__':unittest.main(verbosity=2)
