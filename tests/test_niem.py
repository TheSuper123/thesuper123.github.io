"""Real learner input, German alternatives and direct-link-only publication."""
import unittest
from playwright.sync_api import expect
from test_public_site import PublicPreview


class NiemExercise(PublicPreview):
    def open_exercise(self, p):
        response = p.goto(self.public + '/niem.html')
        self.assertEqual(response.status, 200)
        expect(p.get_by_role('heading', level=1)).to_have_text('Niem.')
        expect(p.locator('#niem-exercise input')).to_have_count(20)

    def test_direct_link_only_noindex_no_discovery_or_offline_distribution(self):
        with self.published(javascript=False) as p:
            self.open_exercise(p)
            self.assertIn('noindex', p.locator('meta[name=robots]').get_attribute('content'))
            expect(p.locator('#niem-actions')).to_be_hidden()
            expect(p.locator('.niem-notice')).to_be_visible()
            expect(p.locator('.niem-notice')).to_contain_text('sprawdzanie odpowiedzi')
            p.locator('#niem-cheatsheet summary').click()
            expect(p.locator('#niem-cheatsheet')).to_contain_text('außerdem')
            for route in ['/', '/gry.html', '/sitemap.xml', '/robots.txt', '/assets/catalog.js', '/assets/offline-pack.js', '/manifest.webmanifest']:
                content = p.request.get(self.public + route).text()
                self.assertNotIn('niem.html', content, route)
            pack = p.request.get(self.public + '/assets/offline-pack.js').text()
            self.assertNotIn('assets/niem.', pack)
            p.goto(self.public)
            expect(p.locator('.game-card')).to_have_count(101)
            expect(p.locator('a[href*="niem.html"]')).to_have_count(0)

    def test_all_twenty_answers_real_submit_synonyms_and_no_persistent_answers(self):
        answers = ['weil', 'und', 'aber', 'dann', 'ob', 'sondern', 'deshalb', 'wann', 'sonst', 'dass', 'oder', 'trotzdem', 'warum', 'denn', 'außerdem', 'darum', 'weil', 'deswegen', 'dass', 'sondern']
        with self.published() as p:
            self.open_exercise(p)
            for index, answer in enumerate(answers, 1):
                p.locator(f'#answer-{index}').fill(answer)
            expect(p.locator('#niem-completed')).to_have_text('20 / 20')
            p.get_by_role('button', name='Sprawdź odpowiedzi').click()
            expect(p.locator('#niem-result')).to_contain_text('Wynik: 20 / 20')
            expect(p.locator('[data-state=correct]')).to_have_count(20)
            for synonym in ['darum', 'deswegen', 'deshalb']:
                for index in [7, 16, 18]:
                    p.locator(f'#answer-{index}').fill('  ' + synonym.upper() + '  ')
                p.locator('#answer-15').fill('AUSSERDEM')
                p.get_by_role('button', name='Sprawdź odpowiedzi').click()
                expect(p.locator('#niem-result')).to_contain_text('Wynik: 20 / 20')
            self.assertEqual(p.evaluate('Object.keys(localStorage)'), [])
            self.assertEqual(p.evaluate('Object.keys(sessionStorage)'), [])
            p.reload()
            expect(p.locator('#niem-completed')).to_have_text('0 / 20')
            self.assertEqual(p.locator('#niem-exercise input').evaluate_all('(items)=>items.map(i=>i.value)'), [''] * 20)

    def test_empty_wrong_answers_keyboard_correction_solutions_and_reset(self):
        with self.published() as p:
            self.open_exercise(p)
            p.locator('#answer-1').fill('denn')
            p.locator('#answer-2').fill('und')
            p.get_by_role('button', name='Sprawdź odpowiedzi').click()
            expect(p.locator('#niem-result')).to_contain_text('Wynik: 1 / 20. Błędne: 1. Puste: 18.')
            expect(p.locator('#answer-1')).to_be_focused()
            expect(p.locator('#answer-1')).to_have_attribute('aria-invalid', 'true')
            p.locator('#answer-1').fill(' WEIL ')
            expect(p.locator('#niem-result')).to_contain_text('Sprawdź ponownie')
            expect(p.locator('#feedback-1')).to_be_hidden()
            p.locator('#answer-1').press('Enter')
            expect(p.locator('#niem-result')).to_contain_text('Wynik: 2 / 20')
            expect(p.locator('#answer-3')).to_be_focused()
            p.locator('#niem-solutions summary').click()
            expect(p.locator('#niem-answer-key > li')).to_have_count(20)
            expect(p.locator('#niem-answer-key')).to_contain_text('deshalb / darum / deswegen')
            expect(p.locator('#answer-1')).to_have_value(' WEIL ')
            p.get_by_role('button', name='Wyczyść', exact=True).click()
            expect(p.locator('#niem-completed')).to_have_text('0 / 20')
            expect(p.locator('[data-state]')).to_have_count(0)
            expect(p.locator('#niem-solutions')).not_to_have_attribute('open')
            expect(p.locator('#answer-1')).to_be_focused()

    def test_every_field_and_controls_fit_small_screens_and_both_themes(self):
        with self.published() as p:
            self.open_exercise(p)
            for width, height in [(320, 568), (390, 844), (844, 390), (1440, 900)]:
                p.set_viewport_size({'width':width, 'height':height})
                for theme in ['light', 'dark']:
                    p.evaluate('(mode)=>SpinnerTheme.set(mode)', theme)
                    self.assertLessEqual(p.evaluate('document.documentElement.scrollWidth'), width)
                    for field in p.locator('#niem-exercise input').all():
                        box = field.bounding_box()
                        self.assertGreaterEqual(box['x'], 0)
                        self.assertLessEqual(box['x'] + box['width'], width)
                        self.assertGreaterEqual(box['height'], 44)
                    expect(p.locator('[data-theme-toggle]')).to_have_attribute('aria-pressed', str(theme=='dark').lower())
            p.set_viewport_size({'width':320, 'height':568})
            p.locator('#niem-cheatsheet').evaluate('(el)=>el.open=true')
            p.locator('#niem-solutions summary').click()
            expect(p.locator('#niem-answer-key > li')).to_have_count(20)
            self.assertLessEqual(p.evaluate('document.documentElement.scrollWidth'), 320)


if __name__ == '__main__':
    unittest.main(verbosity=2)
