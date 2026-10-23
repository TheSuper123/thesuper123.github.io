"""Discovery, honest daily progress and real game overlays; no production services."""
from datetime import datetime, timezone
import unittest
from playwright.sync_api import expect
from test_more_games import MoreGames

class SalonChecks(MoreGames):
    def snapshot(self,p):return p.evaluate('SpinnerSalon.snapshot()')
    def open_game(self,p,game):
        p.evaluate('(id)=>SpinnerSalon.openGame(id)',game)
        expect(p.locator('.salon-player-loading')).to_have_count(0)
        return p.frames[1]
    def close_game(self,p):
        p.locator('#salon-player-close').click()
        expect(p.locator('#salon-game-frame')).to_have_count(0)

    def test_landing_is_lazy_local_and_keeps_catalog_at_one_hundred(self):
        with self.page(width=390) as p:
            expect(p.locator('.game-card')).to_have_count(100)
            expect(p.locator('#salon-picks a')).to_have_count(4)
            expect(p.locator('#salon-day-games a')).to_have_count(3)
            self.assertEqual(len(p.frames),1)
            self.assertEqual(p.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])
            expect(p.locator('#odkrywaj')).to_be_visible()

    def test_four_moods_have_different_valid_sets_and_switch_without_navigation(self):
        with self.page() as p:
            seen=[]
            for mood in ['slow','think','quick','together']:
                p.locator('[data-salon-mood="'+mood+'"]').click()
                first=self.snapshot(p)['picks'];self.assertEqual(len(set(first)),4)
                self.assertTrue(p.evaluate('(ids)=>ids.every(id=>SpinnerGames.some(g=>g.id===id))',first))
                p.locator('#salon-more-picks').click();second=self.snapshot(p)['picks']
                self.assertFalse(set(first)&set(second));seen.append(tuple(first))
                expect(p.locator('[data-salon-mood][aria-pressed=true]')).to_have_count(1)
                self.assertEqual(len(p.frames),1)
            self.assertEqual(len(set(seen)),4)
            p.locator('#salon-picks a').first.click()
            expect(p.locator('.salon-player-loading')).to_have_count(0)
            self.assertEqual(p.frames[1].evaluate('MoreGame.snapshot().mode'),'local')
            self.close_game(p)
            p.goto(self.base+'/gra.html?gra=connect-four&rywal=local')
            expect(p.locator('#game-placeholder')).to_have_count(0)
            self.assertEqual(p.frames[1].evaluate('MoreGame.snapshot().mode'),'local')

    def test_roulette_uses_search_and_never_navigates_until_confirmed(self):
        with self.page() as p:
            p.locator('#game-search').fill('memory')
            p.locator('[data-salon-random]').first.click()
            self.assertEqual(self.snapshot(p)['selection'],'memory')
            self.assertEqual(self.snapshot(p)['spinning'],False)
            expect(p.locator('#salon-slot-name')).to_have_text('Memory')
            self.assertEqual(len(p.frames),1)
            p.locator('#salon-roulette-play').click()
            expect(p.locator('.salon-player-loading')).to_have_count(0)
            self.assertEqual(p.frames[1].evaluate('document.body.dataset.game'),'memory')
            self.close_game(p)
            expect(p.locator('#game-search')).to_have_value('memory')
            expect(p.locator('.game-card')).to_have_count(1)

    def test_roulette_respects_category_favorites_and_empty_results(self):
        with self.page() as p:
            p.get_by_role('button',name='Zręcznościowe',exact=True).click()
            p.locator('[data-salon-random]').first.click()
            selected=self.snapshot(p)['selection']
            self.assertEqual(p.evaluate('(id)=>SpinnerGames.find(g=>g.id===id).category',selected),'arcade')
            p.locator('#salon-roulette-again').click();self.assertNotEqual(self.snapshot(p)['selection'],selected)
            p.get_by_role('button',name='Zamknij losowanie',exact=True).click()
            p.get_by_role('button',name='Ulubione',exact=False).first.click()
            for b in p.locator('[data-salon-random]').all():expect(b).to_be_disabled()
            p.get_by_role('button',name='Wszystkie 100',exact=True).click()
            p.get_by_role('button',name='Dodaj do ulubionych: Sudoku',exact=True).click()
            p.get_by_role('button',name='Ulubione',exact=False).first.click()
            p.locator('[data-salon-random]').first.click();self.assertEqual(self.snapshot(p)['selection'],'sudoku')

    def test_animation_cancels_on_close_and_reduced_motion_takes_effect_immediately(self):
        with self.page(clock=True) as p:
            p.emulate_media(reduced_motion='no-preference')
            trigger=p.locator('[data-salon-random]').first;trigger.click()
            self.assertTrue(self.snapshot(p)['spinning'])
            expect(p.locator('#salon-roulette-play')).to_be_disabled()
            p.get_by_role('button',name='Zamknij losowanie',exact=True).click()
            self.assertFalse(self.snapshot(p)['spinning']);p.clock.run_for(1500)
            self.assertEqual(len(p.frames),1);expect(trigger).to_be_focused()
            trigger.click();self.assertTrue(self.snapshot(p)['spinning'])
            p.emulate_media(reduced_motion='reduce')
            p.wait_for_function('!SpinnerSalon.snapshot().spinning')
            expect(p.locator('#salon-roulette-play')).to_be_enabled()
            p.evaluate('''()=>{document.getElementById('salon-roulette').close();document.querySelector('[data-salon-random]').click();}''')
            p.clock.run_for(50);expect(p.locator('#salon-roulette')).to_be_visible()
            expect(p.locator('#salon-roulette-play')).to_be_enabled()

    def test_all_one_hundred_games_start_in_overlay_and_close_releases_the_frame(self):
        with self.page(width=390) as p:
            games=p.evaluate('SpinnerGames')
            for width,height in [(320,568),(844,390),(1440,900)]:
                p.set_viewport_size({'width':width,'height':height})
                for game in games:
                    with self.subTest(game=game['id'],width=width,height=height):
                        frame=self.open_game(p,game['id'])
                        self.assertEqual(frame.evaluate('document.body.dataset.game'),game['id'])
                        self.assertTrue(frame.evaluate('document.body.dataset.viewportReady'))
                        phase=frame.evaluate('''()=>{for(const name of ['MoreGame','TilesGame','MemoryGame','BreakoutGame','SudokuGame','SokobanGame'])if(typeof window[name]?.snapshot==='function')return window[name].snapshot().phase;return null;}''')
                        self.assertNotEqual(phase,'paused',(game['id'],width,height))
                        frame.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                        self.assertFalse(frame.evaluate('document.documentElement.scrollHeight>innerHeight+1'))
                        rects=frame.evaluate('''()=>[...document.querySelectorAll('.gv-board,.gv-input button,.gv-actions button')].filter(e=>e.getBoundingClientRect().height&&!e.closest('[hidden]')).map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight,label:e.id||e.textContent.slice(0,25)};})''')
                        for r in rects:
                            self.assertGreaterEqual(r['x'],-1,r);self.assertGreaterEqual(r['y'],-1,r)
                            self.assertLessEqual(r['right'],r['w']+1,r);self.assertLessEqual(r['bottom'],r['h']+1,r)
                        self.close_game(p)
            self.assertEqual(p.url,self.base+'/')

    def test_daily_set_is_deterministic_and_uses_polish_midnight_independently_of_browser_zone(self):
        with self.page() as p:
            result=p.evaluate('''()=>{const D=SpinnerSalonDay,a=new Date('2026-10-23T21:59:59Z'),b=new Date('2026-10-23T22:00:00Z');return{before:D.dayKey(a),after:D.dayKey(b),a:D.route(a).games.map(g=>({id:g.id,category:g.category})),again:D.route(a).games.map(g=>g.id),b:D.route(b).games.map(g=>g.id)};}''')
            self.assertEqual(result['before'],'2026-10-23');self.assertEqual(result['after'],'2026-10-24')
            self.assertEqual([g['category'] for g in result['a']],['logic','arcade','quiz'])
            self.assertEqual([g['id'] for g in result['a']],result['again'])
            self.assertEqual(len(set(result['again'])),3);self.assertNotIn('political-compass',result['again'])
            self.assertNotEqual(result['again'],result['b'])

    def test_daily_progress_is_awarded_only_after_successful_real_load_and_retry(self):
        with self.page(width=390) as p:
            game=p.evaluate('SpinnerSalonDay.route().games[0]');pattern='**/'+game['file']
            p.route(pattern,lambda r:r.fulfill(content_type='text/html',body='<!doctype html><p>Unavailable game</p>'))
            p.evaluate('(id)=>SpinnerSalon.openGame(id)',game['id'])
            expect(p.locator('.salon-player-loading[data-error=true]')).to_be_visible()
            self.assertEqual(self.snapshot(p)['opened'],[])
            p.unroute(pattern);p.get_by_role('button',name='Spróbuj ponownie',exact=True).click()
            expect(p.locator('.salon-player-loading')).to_have_count(0)
            self.assertEqual(self.snapshot(p)['opened'],[game['id']]);self.close_game(p)
            expect(p.locator('#salon-day-progress')).to_have_text('1 / 3 uruchomionych')

    def test_daily_three_real_loads_count_once_and_memory_resets_without_storage_consent(self):
        with self.page(width=390) as p:
            ids=self.snapshot(p)['daily']
            for game in ids+[ids[0]]:
                self.open_game(p,game);self.close_game(p)
            self.assertEqual(set(self.snapshot(p)['opened']),set(ids))
            expect(p.locator('#salon-day-progress')).to_have_text('Komplet odkryty. Do jutra!')
            self.assertEqual(p.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])
            p.reload();self.assertEqual(self.snapshot(p)['opened'],[])

    def test_daily_optional_progress_survives_reload_and_standard_player_then_can_be_cleared(self):
        with self.page(consent=True) as p:
            game=self.snapshot(p)['daily'][0]
            p.goto(self.base+'/gra.html?gra='+game);expect(p.locator('#game-placeholder')).to_have_count(0)
            p.goto(self.base);self.assertEqual(self.snapshot(p)['opened'],[game])
            p.reload();self.assertEqual(self.snapshot(p)['opened'],[game])
            p.evaluate('SpinnerStorage.preferences.clear()')
            self.assertEqual(self.snapshot(p)['opened'],[])
            expect(p.locator('#salon-day-progress')).to_have_text('0 / 3 uruchomionych')
            self.open_game(p,game);self.close_game(p)
            p.get_by_role('button',name='Ustawienia cookies',exact=True).click()
            p.locator('#cookie-preferences').uncheck();p.locator('#save-cookies').click()
            self.assertEqual(p.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])
            p.reload();self.assertEqual(self.snapshot(p)['opened'],[])

    def test_daily_updates_other_tabs_and_rejects_expired_or_malformed_saved_entries(self):
        with self.page(consent=True) as p:
            other=p.context.new_page();other.goto(self.base)
            try:
                game=self.snapshot(p)['daily'][0];self.open_game(other,game);self.close_game(other)
                expect(p.locator('#salon-day-progress')).to_have_text('1 / 3 uruchomionych')
                p.evaluate('''()=>{SpinnerStorage.preferences.set('salon:day:v1',{day:SpinnerSalonDay.dayKey(),opened:['missing','political-compass',null,{},SpinnerSalonDay.route().games[0].id,SpinnerSalonDay.route().games[0].id]});}''')
                self.assertEqual(self.snapshot(p)['opened'],[game])
                p.evaluate("SpinnerStorage.preferences.set('salon:day:v1',{day:'2000-01-01',opened:['snake']})")
                self.assertEqual(self.snapshot(p)['opened'],[])
            finally:other.close()

    def test_midnight_replaces_the_ticket_without_reloading_the_catalog(self):
        with self.page(clock=True) as p:
            p.clock.set_fixed_time(datetime(2026,10,23,21,59,50,tzinfo=timezone.utc));p.reload()
            before=self.snapshot(p)['daily']
            p.clock.set_fixed_time(datetime(2026,10,23,22,0,1,tzinfo=timezone.utc));p.clock.run_for(60010)
            self.assertNotEqual(self.snapshot(p)['daily'],before)
            expect(p.locator('#salon-day-date')).to_have_attribute('datetime','2026-10-24')
            expect(p.locator('.game-card')).to_have_count(100)

    def test_help_pauses_actual_game_restart_and_escape_close_inner_options_before_overlay(self):
        with self.page(width=390) as p:
            frame=self.open_game(p,'fifteen');frame.evaluate('MoreGame.move(MoreGame.snapshot().certificate[0])')
            p.locator('#salon-player-help').click();expect(p.locator('#salon-game-guide')).to_be_visible()
            self.assertEqual(frame.evaluate('MoreGame.snapshot().phase'),'paused')
            p.get_by_role('button',name='Zamknij zasady szybkiej rundy',exact=True).click()
            self.assertEqual(frame.evaluate('MoreGame.snapshot().phase'),'paused')
            p.locator('#salon-player-restart').click();expect(p.locator('.salon-player-loading')).to_have_count(0)
            frame=p.frames[1];self.assertEqual(frame.evaluate('MoreGame.snapshot().phase'),'ready')
            frame.locator('.gv-options').click();frame.locator('.gv-dialog button').first.focus();p.keyboard.press('Escape')
            expect(p.locator('#salon-player')).to_be_visible();expect(frame.locator('.gv-dialog')).not_to_be_visible()
            frame.locator('#more-resume').focus();p.keyboard.press('Escape')
            expect(p.locator('#salon-player')).not_to_be_visible();expect(p.locator('#salon-game-frame')).to_have_count(0)

    def test_theme_and_small_screen_controls_stay_visible_with_a_real_running_snake(self):
        with self.page(width=390) as p:
            frame=self.open_game(p,'snake')
            frame.locator('#snake-start').click()
            for width,height in [(320,568),(390,844),(844,390),(1440,900)]:
                p.set_viewport_size({'width':width,'height':height});frame.evaluate('document.fonts.ready')
                frame.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                for target in [p.locator('#salon-player-close'),frame.locator('#game'),*frame.locator('.snake-controls button').all()]:expect(target).to_be_in_viewport(ratio=1)
                self.assertFalse(frame.evaluate('document.documentElement.scrollHeight>innerHeight+1'))
            p.locator('#salon-player-theme').click();expect(frame.locator('html')).to_have_attribute('data-theme',p.evaluate('SpinnerTheme.mode'))

    def test_catalog_quick_link_restores_focus_and_keeps_the_search(self):
        with self.page(width=390) as p:
            p.locator('#game-search').fill('2048')
            trigger=p.get_by_role('link',name='Zagraj tutaj: 2048',exact=True);trigger.click()
            expect(p.locator('.salon-player-loading')).to_have_count(0)
            self.assertEqual(self.snapshot(p)['player'],'2048')
            for key in ['ArrowLeft','ArrowUp','ArrowRight','ArrowDown']:p.keyboard.press(key)
            self.assertEqual(p.frames[1].evaluate('TilesGame.snapshot().phase'),'playing')
            self.close_game(p);expect(trigger).to_be_focused();expect(p.locator('#game-search')).to_have_value('2048')
            self.assertEqual(self.snapshot(p)['player'],None)
            expect(p.locator('.recent-strip')).to_contain_text('2048')
            self.open_game(p,'2048')
            p.evaluate('''()=>{document.getElementById('salon-player').close();SpinnerSalon.openGame('memory');}''')
            expect(p.locator('.salon-player-loading')).to_have_count(0)
            self.assertEqual(self.snapshot(p)['player'],'memory')
            self.assertEqual(p.frames[1].evaluate('document.body.dataset.game'),'memory')
            self.close_game(p)

    def test_discovery_and_roulette_fit_phone_tablet_and_both_themes(self):
        with self.page(width=390) as p:
            for width,height in [(320,568),(390,844),(768,900),(1440,1000),(844,390)]:
                p.set_viewport_size({'width':width,'height':height})
                for theme in ['dark','light']:
                    p.evaluate('(m)=>SpinnerTheme.set(m)',theme);p.evaluate('document.fonts.ready')
                    self.assertFalse(p.evaluate('document.documentElement.scrollWidth>innerWidth'),(width,theme))
                    p.locator('[data-salon-random]').first.click()
                    for b in p.locator('.salon-roulette-actions button').all():expect(b).to_be_in_viewport(ratio=1)
                    self.assertFalse(p.locator('#salon-roulette').evaluate('(e)=>e.scrollWidth>e.clientWidth+1'),(width,theme))
                    p.get_by_role('button',name='Zamknij losowanie',exact=True).click()

    def test_compass_overlay_keeps_answers_out_of_history_daily_ticket_and_storage(self):
        with self.page(consent=True) as p:
            before=p.evaluate('({...localStorage})')
            self.assertNotIn('political-compass',self.snapshot(p)['daily'])
            p.locator('#game-search').fill('kompas');p.locator('[data-salon-random]').first.click()
            self.assertEqual(self.snapshot(p)['selection'],'political-compass')
            p.locator('#salon-roulette-play').click();expect(p.locator('.salon-player-loading')).to_have_count(0)
            frame=p.frames[1]
            frame.evaluate('''()=>{for(let i=0;i<30;i++)MoreGame.answer(2);}''')
            self.assertEqual(frame.evaluate('MoreGame.snapshot().screen'),'results')
            self.assertEqual(p.evaluate('({...localStorage})'),before)
            self.assertEqual(self.snapshot(p)['opened'],[])
            self.close_game(p);expect(p.locator('.recent-strip')).to_have_count(0)
            frame=self.open_game(p,'political-compass')
            self.assertTrue(all(not a['seen'] for a in frame.evaluate('MoreGame.snapshot().answers')))

if __name__=='__main__':unittest.main(verbosity=2)
