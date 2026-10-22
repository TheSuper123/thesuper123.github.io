"""Viewport regression tests for an explicit private restore, never published here."""
import os
import unittest
from test_archive_navigation import ArchiveNavigationChecks as Fixture

@unittest.skipUnless(os.environ.get('SPINNER_ARCHIVE_SOURCE'),'Provide an archive restore outside the checkout')
class PrivateViewportChecks(unittest.TestCase):
    setUpClass=classmethod(Fixture.setUpClass.__func__)
    tearDownClass=classmethod(Fixture.tearDownClass.__func__)
    page=Fixture.page

    def fit(self,p):
        p.wait_for_function('document.body.dataset.viewportReady')
        p.evaluate('document.fonts.ready')
        p.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')

    def test_five_archive_games_fit_both_portrait_and_landscape(self):
        with self.page(mobile=True) as p:
            for w,h in [(320,568),(844,390)]:
                p.set_viewport_size({'width':w,'height':h})
                for name in ['tetris','flappybird','blockblast','doom','geometrydashlite986']:
                    with self.subTest(game=name,w=w,h=h):
                        p.goto(self.base+'/games/'+name+'.html');self.fit(p)
                        data=p.evaluate('''()=>({w:innerWidth,h:innerHeight,scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],buttons:[...document.querySelectorAll('.gv-input button,.gv-actions button')].filter(b=>b.getBoundingClientRect().height&&!b.closest('[hidden]')).map(b=>{const r=b.getBoundingClientRect();return[b.id,r.x,r.y,r.right,r.bottom]})})''')
                        self.assertLessEqual(data['scroll'][0],w+1);self.assertLessEqual(data['scroll'][1],h+1)
                        for id,x,y,right,bottom in data['buttons']:
                            self.assertGreaterEqual(x,-1,(name,id,data));self.assertGreaterEqual(y,-1,(name,id,data))
                            self.assertLessEqual(right,w+1,(name,id,data));self.assertLessEqual(bottom,h+1,(name,id,data))

    def test_doom_scene_arrows_and_picture_remain_on_same_screen(self):
        with self.page(mobile=True) as p:
            p.set_viewport_size({'width':320,'height':568});p.goto(self.base+'/games/doom.html');self.fit(p)
            child=p.frames[1];child.get_by_role('link',name='Rozpocznij',exact=True).click()
            child.wait_for_function('document.documentElement.classList.contains("gv-doom-scene")')
            child.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
            data=child.evaluate('''()=>({h:innerHeight,scroll:document.documentElement.scrollHeight,scene:document.querySelector('.scene').getBoundingClientRect().bottom,buttons:[...document.querySelectorAll('nav a')].map(b=>({top:b.getBoundingClientRect().top,bottom:b.getBoundingClientRect().bottom}))})''')
            self.assertLessEqual(data['scroll'],data['h']+1)
            for b in data['buttons']:self.assertGreaterEqual(b['top'],data['scene']-1);self.assertLessEqual(b['bottom'],data['h']+1)

del Fixture
if __name__=='__main__':unittest.main(verbosity=2)
