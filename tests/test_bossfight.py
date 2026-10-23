"""Original bossfight: actual controls, complete endings, hazards and phone layouts."""
import json
from pathlib import Path
import sys
import unittest
from playwright.sync_api import expect
from test_more_games import MoreGames


class BossfightChecks(MoreGames):
    def state(self,p): return p.evaluate('BossFight.snapshot()')

    def start(self,p):
        p.locator('#bf-start').click()
        p.clock.run_for(1400)
        self.assertEqual(self.state(p)['stage'],'defense')

    def survive(self,p):
        # Shield is a controlled encounter fixture; collision/damage has its own tests.
        p.evaluate('BossFight.getState().invulnerable=1000;BossFight.advance(14)')
        self.assertEqual(self.state(p)['stage'],'menu')

    def practice(self,p,index=0):
        p.locator('.gv-options').click()
        p.get_by_label('TRYB',exact=True).select_option('practice')
        p.get_by_label('TRENING SEKWENCJI',exact=True).select_option(str(index))
        p.get_by_role('button',name='Zamknij opcje',exact=True).click()

    def test_catalog_101_has_own_metadata_and_both_real_players(self):
        with self.page(clock=True,width=390) as p:
            expect(p.locator('.game-card')).to_have_count(101)
            p.locator('#game-search').fill('Ostatnia warta')
            expect(p.locator('.game-card')).to_have_count(1)
            p.get_by_role('link',name='Zagraj tutaj: Ostatnia warta',exact=True).click()
            p.clock.run_for(200)
            expect(p.locator('.salon-player-loading')).to_have_count(0)
            f=p.frames[1];expect(f.locator('#bf-start')).to_be_visible()
            self.assertEqual(f.evaluate('BossFight.snapshot().phase'),'ready')
            f.locator('#bf-start').click();p.clock.run_for(1500)
            self.assertEqual(f.evaluate('BossFight.snapshot().stage'),'defense')
            p.locator('#salon-player-help').click()
            self.assertEqual(f.evaluate('BossFight.snapshot().phase'),'paused')
            p.locator('#salon-game-guide [data-close]').click()
            self.assertEqual(f.evaluate('BossFight.snapshot().phase'),'paused')
            p.locator('#salon-player-close').click()
            p.goto(self.base+'/gra.html?gra=last-watch');p.clock.run_for(200)
            expect(p.locator('#game-placeholder')).to_have_count(0)
            expect(p.frames[1].locator('#bf-start')).to_be_visible()

    def test_physics_normalized_movement_four_gravities_and_variable_jumps(self):
        with self.page('last-watch',clock=True) as p:
            result=p.evaluate('''()=>{
              const r=BossFight.rules,fresh=()=>({x:320,y:200,r:8,vx:0,vy:0,grounded:false,jumpHeld:false,jumpTime:0});
              const a=fresh(),b=fresh();r.move(a,new Set(['right']),'free',.1);r.move(b,new Set(['right','down']),'free',.1);
              const jumps=['down','up','left','right'].map(mode=>{const q=fresh(),g=r.gravity[mode];q.x=g[0]<0?8:g[0]>0?632:320;q.y=g[1]<0?8:g[1]>0?392:200;q.grounded=true;const before={...q};r.move(q,new Set(['jump']),mode,1/120);return(q.x-before.x)*g[0]+(q.y-before.y)*g[1];});
              const trajectory=hold=>{const q=fresh();q.y=392;q.grounded=true;let top=392;for(let i=0;i<120;i++){r.move(q,new Set(i<(hold?40:1)?['jump']:[]),'down',1/120);top=Math.min(top,q.y);}return top;};
              return{single:Math.hypot(a.x-320,a.y-200),diagonal:Math.hypot(b.x-320,b.y-200),jumps,short:trajectory(false),long:trajectory(true)};
            }''')
            self.assertAlmostEqual(result['single'],result['diagonal'])
            self.assertTrue(all(v<0 for v in result['jumps']))
            self.assertLess(result['long'],result['short']-20)

    def test_audio_is_opt_in_synthesized_locally_and_suspends_with_pause(self):
        init='''(()=>{const Native=window.AudioContext;window.testAudio=[];window.AudioContext=class extends Native{constructor(...args){super(...args);window.testAudio.push(this);}};})()'''
        with self.page('last-watch',clock=True,init=init) as p:
            self.assertEqual(p.evaluate('testAudio.length'),0)
            p.locator('#bf-sound').click()
            expect(p.locator('#bf-sound')).to_have_attribute('aria-pressed','true')
            self.start(p)
            p.wait_for_function('testAudio[0].state==="running"')
            p.keyboard.press('p');p.wait_for_function('testAudio[0].state==="suspended"')
            p.locator('#more-resume').click();p.wait_for_function('testAudio[0].state==="running"')
            p.locator('#bf-sound').click();p.wait_for_function('testAudio[0].state==="suspended"')
            expect(p.locator('#bf-sound')).to_have_attribute('aria-pressed','false')

    def test_collision_telegraphs_tangency_beams_and_motion_rules(self):
        with self.page('last-watch',clock=True) as p:
            result=p.evaluate('''()=>{
              const r=BossFight.rules,p={x:50,y:50,r:8},rect={type:'rect',x:40,y:40,w:20,h:20,born:0,warn:1,life:1};
              const beam={type:'beam',a:{x:0,y:0},b:{x:100,y:100},width:4,born:0,warn:0,life:2};
              return{warning:r.collides(rect,p,false,.5),live:r.collides(rect,p,false,1.2),expired:r.collides(rect,p,false,2.1),tangent:r.circleRect({x:32,y:50,r:8},rect),diagonal:r.collides(beam,p,false,1),away:r.collides(beam,{x:20,y:90,r:8},false,1),stillSafe:r.collides({...rect,rule:'still'},p,false,1.2),stillHit:r.collides({...rect,rule:'still'},p,true,1.2),moveSafe:r.collides({...rect,rule:'move'},p,true,1.2),moveHit:r.collides({...rect,rule:'move'},p,false,1.2),strike:r.strike(0),miss:r.strike(Math.PI)};
            }''')
            self.assertEqual(result,dict(warning=False,live=True,expired=False,tangent=False,diagonal=True,away=False,stillSafe=False,stillHit=True,moveSafe=False,moveHit=True,strike=14,miss=6))

    def test_all_twelve_practice_sequences_spawn_distinct_real_encounters(self):
        with self.page('last-watch',clock=True,width=390) as p:
            names=[]
            for index in range(12):
                with self.subTest(sequence=index+1):
                    self.practice(p,index);self.start(p)
                    p.evaluate('BossFight.getState().invulnerable=1000;BossFight.advance(6)')
                    s=self.state(p);names.append(p.locator('#bf-wave-name').inner_text())
                    self.assertEqual(s['difficulty'],'practice')
                    self.assertTrue(s['shots'] or s['platforms'] or s['shrink'] or s['mode']!='free')
                    self.survive(p)
                    self.assertEqual(p.evaluate('SpinnerStorage.preferences.get("bossfight:best:v1",null)'),None)
            self.assertEqual(len(set(names)),12)

    def test_keyboard_is_immediate_stops_on_release_and_precision_has_effect(self):
        with self.page('last-watch',clock=True,width=390) as p:
            self.start(p);x=self.state(p)['player']['x']
            p.keyboard.down('ArrowRight');p.clock.run_for(17)
            fast=self.state(p)['player']['x']-x;self.assertGreater(fast,1)
            p.keyboard.up('ArrowRight');x=self.state(p)['player']['x'];p.clock.run_for(80)
            self.assertAlmostEqual(self.state(p)['player']['x'],x)
            p.keyboard.down('Shift');p.keyboard.down('ArrowRight');p.clock.run_for(17)
            slow=self.state(p)['player']['x']-x
            self.assertGreater(slow,0);self.assertLess(slow,fast)
            p.keyboard.up('ArrowRight');p.keyboard.up('Shift')

    def test_real_multitouch_can_move_and_jump_together_and_cancel_releases_all(self):
        with self.page('last-watch',clock=True,width=390) as p:
            self.practice(p,2);self.start(p)
            left=p.locator('[data-bf-input=left]').bounding_box();jump=p.locator('[data-bf-input=jump]').bounding_box()
            cdp=p.context.new_cdp_session(p)
            cdp.send('Input.dispatchTouchEvent',dict(type='touchStart',touchPoints=[dict(id=1,x=left['x']+left['width']/2,y=left['y']+left['height']/2),dict(id=2,x=jump['x']+jump['width']/2,y=jump['y']+jump['height']/2)]))
            p.clock.run_for(80);s=self.state(p)
            self.assertIn('left',s['input']);self.assertIn('jump',s['input'])
            self.assertLess(s['player']['x'],310);self.assertLess(s['player']['y'],380)
            cdp.send('Input.dispatchTouchEvent',dict(type='touchCancel',touchPoints=[]));p.clock.run_for(20)
            self.assertEqual(self.state(p)['input'],[])

    def test_damage_has_short_protection_heat_and_pause_freezes_everything(self):
        with self.page('last-watch',clock=True) as p:
            self.start(p)
            p.evaluate('''()=>{const s=BossFight.getState();s.invulnerable=0;s.shots=[{type:'rect',x:0,y:0,w:640,h:400,born:s.time,warn:0,life:10}];BossFight.advance(.01);}''')
            s=self.state(p);self.assertEqual(s['hits'],1);self.assertLess(s['hp'],61);self.assertGreater(s['heat'],0)
            p.evaluate('BossFight.advance(.1)');self.assertEqual(self.state(p)['hits'],1)
            p.keyboard.press('p');before=self.state(p)
            p.clock.run_for(2000);p.evaluate('BossFight.advance(10)')
            self.assertEqual(self.state(p),before)
            p.locator('#more-resume').click();p.evaluate('BossFight.advance(.4)')
            self.assertGreater(self.state(p)['hits'],1)

    def test_repairs_are_finite_clamped_and_cannot_be_wasted_at_full_health(self):
        with self.page('last-watch',clock=True) as p:
            self.start(p);self.survive(p)
            self.assertFalse(p.evaluate("BossFight.choose('heal')"))
            for remaining in [2,1,0]:
                p.evaluate('BossFight.getState().hp=50')
                self.assertTrue(p.evaluate("BossFight.choose('heal')"))
                self.assertEqual(self.state(p)['hp'],64);self.assertEqual(self.state(p)['repairs'],remaining)
                self.survive(p)
            p.evaluate('BossFight.getState().hp=40')
            self.assertFalse(p.evaluate("BossFight.choose('heal')"))

    def test_complete_twelve_sequence_overload_win_and_optional_record(self):
        with self.page('last-watch',clock=True,consent=True) as p:
            self.start(p);seen=[]
            for i in range(12):
                self.survive(p);seen.append(self.state(p)['turn'])
                p.locator('[data-bf-action=strike]').click()
                # Set the precise timing fixture and dispatch the actual button in
                # one task; concurrent browser suites must not move the needle
                # between two automation round trips.
                p.evaluate('BossFight.getState().strikeAge=Math.PI/3.1;document.getElementById("bf-confirm").click()')
                if i<11:self.assertNotEqual(self.state(p)['phase'],'won')
            self.assertEqual(seen,list(range(12)))
            self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(self.state(p)['core'],0)
            expect(p.locator('#more-result')).to_be_visible()
            self.assertIn('spinner:prefs:bossfight:best:v1',p.evaluate('Object.keys(localStorage)'))
            p.locator('#more-again').click();self.assertEqual(self.state(p)['stage'],'intro')

    def test_three_scans_unlock_alternate_ending_only_after_sequence_twelve(self):
        with self.page('last-watch',clock=True) as p:
            self.start(p)
            for i in range(12):
                self.survive(p)
                if i<3:self.assertTrue(p.evaluate("BossFight.choose('scan')"))
                elif i<11:
                    self.assertFalse(p.evaluate("BossFight.choose('release')"))
                    p.evaluate("BossFight.choose('strike');BossFight.confirmStrike()")
                else:
                    expect(p.locator('[data-bf-action=release]')).to_be_visible()
                    p.locator('[data-bf-action=release]').click()
            self.assertEqual(self.state(p)['phase'],'won');self.assertGreater(self.state(p)['core'],0)
            expect(p.locator('#more-result-text')).to_contain_text('Protokół wyłączony')
            self.assertEqual(p.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])

    def test_strike_timeout_and_death_both_have_real_restart_paths(self):
        with self.page('last-watch',clock=True) as p:
            self.start(p);self.survive(p);p.evaluate("BossFight.choose('strike');BossFight.advance(4)")
            self.assertEqual(self.state(p)['core'],144);self.assertEqual(self.state(p)['turn'],1)
            p.evaluate('''()=>{const s=BossFight.getState();s.hp=.001;s.heat=1;BossFight.advance(2);}''')
            self.assertEqual(self.state(p)['phase'],'lost');self.assertEqual(self.state(p)['hp'],0)
            p.locator('#more-again').click();self.assertEqual(self.state(p)['hp'],64);self.assertEqual(self.state(p)['stage'],'intro')

    def test_all_controls_and_overlays_fit_portrait_landscape_and_both_themes(self):
        with self.page('last-watch',width=390,clock=True) as p:
            for width,height in [(320,568),(390,844),(844,390),(1440,900)]:
                p.set_viewport_size(dict(width=width,height=height));p.clock.run_for(120)
                for theme in ['light','dark']:
                    p.evaluate('(m)=>SpinnerTheme.set(m)',theme)
                    p.evaluate('BossFight.newGame()');p.clock.run_for(60)
                    for target in [p.locator('#bf-start'),*p.locator('[data-bf-input]').all()]:expect(target).to_be_in_viewport(ratio=1)
                    self.start(p);self.survive(p)
                    for target in p.locator('#bf-choices button:visible').all():expect(target).to_be_in_viewport(ratio=1)
                    p.locator('[data-bf-action=strike]').click();expect(p.locator('#bf-confirm')).to_be_in_viewport(ratio=1)
                    self.assertLessEqual(p.evaluate('document.documentElement.scrollHeight'),height+1)
                    self.assertLessEqual(p.evaluate('document.documentElement.scrollWidth'),width)


def screenshots():
    out=Path('docs/screenshots/bossfight');out.mkdir(exist_ok=True)
    BossfightChecks.setUpClass();t=BossfightChecks()
    try:
        with t.page('last-watch',width=1440,clock=True) as p:
            p.set_viewport_size(dict(width=1440,height=900));p.clock.run_for(200)
            p.screenshot(path=str(out/'intro-desktop.png'))
            t.practice(p,8);t.start(p);p.evaluate('BossFight.getState().invulnerable=1000;BossFight.advance(2.4)');p.clock.run_for(16)
            p.screenshot(path=str(out/'arena-desktop.png'))
            p.set_viewport_size(dict(width=390,height=844));p.evaluate("SpinnerTheme.set('dark')");p.clock.run_for(100)
            p.screenshot(path=str(out/'arena-mobile-dark.png'))
            t.survive(p);p.clock.run_for(20);p.screenshot(path=str(out/'choices-mobile.png'))
            p.set_viewport_size(dict(width=844,height=390));p.locator('[data-bf-action=strike]').click();p.evaluate('BossFight.advance(.8)');p.clock.run_for(50)
            p.screenshot(path=str(out/'timing-landscape.png'))
    finally:BossfightChecks.tearDownClass()


if __name__=='__main__':
    if '--screenshots' in sys.argv:screenshots()
    else:unittest.main(verbosity=2)
