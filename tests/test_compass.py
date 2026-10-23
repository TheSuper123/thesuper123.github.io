from pathlib import Path
"""Political answers stay local; independent scoring, coverage, review and export checks."""
import json
import math
import unittest
from playwright.sync_api import expect
from test_more_games import MoreGames

class CompassChecks(MoreGames):
    def state(self,p):return p.evaluate('MoreGame.snapshot()')

    def complete(self,p,value='neutral'):
        p.evaluate('''mode=>{const qs=MoreGame.data.questions;for(const q of qs)MoreGame.answer(mode==='neutral'?0:mode==='positive'?q.direction*2:mode==='negative'?-q.direction*2:null);}''',value)

    def test_thirty_balanced_questions_five_axes_and_no_default_answers(self):
        with self.page('political-compass') as p:
            questions=p.evaluate('MoreGame.data.questions');self.assertEqual(len(questions),30)
            self.assertEqual(len({q['id'] for q in questions}),30)
            for axis in range(5):self.assertEqual(sorted(q['direction'] for q in questions if q['axis']==axis),[-1,-1,-1,1,1,1])
            self.assertTrue(all(not a['seen'] for a in self.state(p)['answers']))
            expect(p.locator('.co-choices [aria-pressed=true]')).to_have_count(0)

    def test_neutral_extremes_reversed_items_and_boundaries(self):
        for mode,expected in [('neutral',0),('positive',10),('negative',-10)]:
            with self.subTest(mode=mode),self.page('political-compass') as p:
                self.complete(p,mode);s=self.state(p)
                self.assertEqual(s['screen'],'results');self.assertEqual(s['result']['axes'],[expected]*5)
                self.assertEqual(s['result']['counts'],[6]*5)
                self.assertTrue(all(0<=r['similarity']<=100 for r in s['result']['parties']))

    def test_skip_is_not_neutral_and_coverage_is_required_per_axis(self):
        with self.page('political-compass') as p:
            self.complete(p,'skip');s=self.state(p)
            self.assertEqual(s['screen'],'coverage');self.assertEqual(s['result']['axes'],[None]*5)
            self.assertEqual(s['result']['parties'],[])
            data=p.evaluate('''()=>{const q=MoreGame.data.questions,answers=q.map(x=>({seen:true,value:null}));for(let axis=0;axis<5;axis++){const list=q.flatMap((x,i)=>x.axis===axis?[i]:[]);for(const i of list.slice(0,3))answers[i].value=q[i].direction*2;}const enough=MoreGame.calculate(answers);answers[q.findIndex(x=>x.axis===4)].value=null;return{enough,missing:MoreGame.calculate(answers)};}''')
            self.assertTrue(data['enough']['eligible']);self.assertEqual(data['enough']['axes'],[10]*5)
            self.assertFalse(data['missing']['eligible']);self.assertEqual(data['missing']['parties'],[])

    def test_party_similarity_matches_independent_five_dimensional_formula(self):
        with self.page('political-compass') as p:
            p.evaluate('''()=>{for(let i=0;i<30;i++)MoreGame.answer([-2,-1,0,1,2][i%5]);}''')
            s=self.state(p);questions=p.evaluate('MoreGame.data.questions')
            axes=[sum(a['value']*q['direction'] for a,q in zip(s['answers'],questions) if q['axis']==axis)/12*10 for axis in range(5)]
            for got,expected in zip(s['result']['axes'],axes):self.assertAlmostEqual(got,expected)
            for party in s['result']['parties']:
                distance=math.sqrt(sum((a-b)**2 for a,b in zip(axes,party['values']))/5)
                self.assertAlmostEqual(party['distance'],distance)
                self.assertAlmostEqual(party['similarity'],100*(1-distance/20))
            self.assertEqual([p['distance'] for p in s['result']['parties']],sorted(p['distance'] for p in s['result']['parties']))

    def test_real_question_buttons_back_review_changes_result(self):
        with self.page('political-compass') as p:
            p.locator('.co-choices [data-value="2"]').click();self.assertEqual(self.state(p)['index'],1)
            p.get_by_role('button',name='Wstecz',exact=True).click();expect(p.locator('.co-choices [data-value="2"]')).to_have_attribute('aria-pressed','true')
            p.locator('.co-choices [data-value="-2"]').click();self.assertEqual(self.state(p)['answers'][0]['value'],-2)
            p.evaluate('MoreGame.newGame()');self.complete(p)
            p.get_by_role('button',name='Odpowiedzi',exact=True).click()
            p.get_by_role('button',name='Zmień',exact=True).first.click()
            p.locator('.co-choices [data-value="2"]').click()
            p.get_by_role('button',name='Wynik',exact=True).click()
            self.assertLess(self.state(p)['result']['axes'][0],0)

    def test_axes_svg_ideologies_party_context_and_disclosed_profiles(self):
        with self.page('political-compass') as p:
            self.complete(p)
            expect(p.locator('.co-plot-wrap svg')).to_have_attribute('role','img')
            expect(p.locator('.co-scale-row')).to_have_count(5)
            p.get_by_role('button',name='Ideologie',exact=True).click();expect(p.locator('.co-result-content h3')).to_have_text('Profil centrowy lub mieszany')
            p.get_by_role('button',name='Partie',exact=True).click();expect(p.locator('.co-profile')).to_have_count(8)
            expect(p.locator('.co-result-content')).to_contain_text('2023')
            expect(p.locator('.co-profile a')).to_have_count(8)
            self.assertTrue(p.locator('.co-profile a').evaluate_all('(links)=>links.every(a=>a.rel.includes("noreferrer")&&a.target==="_blank")'))
            p.get_by_role('button',name='Metoda',exact=True).click();expect(p.locator('.co-table tr')).to_have_count(8)
            expect(p.locator('.co-method-dialog')).to_contain_text('pierwiastek')

    def test_answers_not_persisted_even_with_optional_storage_and_account_unused(self):
        with self.page(consent=True) as p:
            before=p.evaluate('({...localStorage})')
            p.goto(self.base+'/gra.html?gra=political-compass');f=p.frames[1];f.wait_for_function('window.MoreGame')
            self.complete(f,'positive');self.assertEqual(f.evaluate('MoreGame.snapshot().screen'),'results')
            after=p.evaluate('({...localStorage})');self.assertEqual(set(after),set(before));self.assertEqual({k:v for k,v in after.items() if k!='spinner:consent:v1'},{k:v for k,v in before.items() if k!='spinner:consent:v1'})
            self.assertEqual(f.evaluate('({...sessionStorage})'),{})
            p.reload();p.frames[1].wait_for_function('window.MoreGame')
            self.assertTrue(all(not a['seen'] for a in self.state(p.frames[1])['answers']))

    def test_explicit_download_and_clear_use_local_result(self):
        with self.page('political-compass') as p:
            self.complete(p,'positive')
            with p.expect_download() as event:p.get_by_role('button',name='Pobierz wynik',exact=True).click()
            download=event.value;self.assertEqual(download.suggested_filename,'moj-kompas-polityczny.json')
            data=json.loads(Path(download.path()).read_text());self.assertEqual([a['score'] for a in data['axes']],[10]*5)
            self.assertEqual(len(data['answers']),30)
            p.get_by_role('button',name='Wyczyść wynik',exact=True).click()
            self.assertEqual(self.state(p)['screen'],'questions');self.assertEqual(self.state(p)['index'],0)
            self.assertTrue(all(not a['seen'] for a in self.state(p)['answers']))

    def test_question_and_result_controls_fit_portrait_and_landscape_without_scroll(self):
        with self.page('political-compass',width=390) as p:
            for w,h in [(320,520),(390,796),(844,342),(1440,852)]:
                p.set_viewport_size({'width':w,'height':h});p.evaluate('MoreGame.newGame()')
                p.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
                for index in range(30):
                    p.evaluate('(i)=>MoreGame.edit(i)',index)
                    for selector in ['.co-card h3','.co-choices button']:
                        for node in p.locator(selector).all():expect(node).to_be_in_viewport(ratio=1)
                    self.assertFalse(p.evaluate('document.documentElement.scrollHeight>innerHeight'))
                    self.assertEqual(p.locator('.co-card').evaluate('(e)=>e.scrollHeight<=e.clientHeight+1'),True,(w,h,index))
                p.evaluate('MoreGame.newGame()')
                self.complete(p)
                for node in p.locator('.co-tabs button,.co-result-actions button').all():expect(node).to_be_in_viewport(ratio=1)

if __name__=='__main__':unittest.main(verbosity=2)
