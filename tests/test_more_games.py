from game_controls import choose_option
"""Rules, complete rounds, real inputs, privacy and layout for the next 17 games."""
import unittest
from playwright.sync_api import expect
from test_new_games import NewGames

GAMES = ['connect-four', 'reversi', 'dots-boxes', 'mancala', 'fifteen',
         'lights-out', 'nonogram', 'hanoi', 'peg-solitaire', 'codebreaker',
         'word-search', 'word-guess', 'echo', 'moles', 'pong', 'orbit', 'stack']

class MoreGames(unittest.TestCase):
    # Reuse only the browser/server fixture, not the previous batch's tests.
    setUpClass = classmethod(NewGames.setUpClass.__func__)
    tearDownClass = classmethod(NewGames.tearDownClass.__func__)
    page = NewGames.page
del NewGames

class SeventeenGames(MoreGames):
    def state(self, page):
        return page.evaluate('MoreGame.snapshot()')

    def local(self, page):
        choose_option(page.get_by_label('RYWAL', exact=True),'local')

    def test_catalog_exactly_seventeen_more_original_local_games(self):
        with self.page() as p:
            catalog=p.evaluate('SpinnerGames')
            self.assertEqual(len(catalog),60)
            self.assertEqual(len({g['id'] for g in catalog}),60)
            self.assertEqual([g['id'] for g in catalog[13:30]],GAMES)
            expect(p.locator('.game-card')).to_have_count(60)
            p.get_by_role('button',name='Na główkowanie',exact=True).click()
            expect(p.locator('.game-card')).to_have_count(40)
            p.locator('#game-search').fill('łamacz')
            expect(p.locator('.game-card')).to_have_count(1)

    def test_every_new_game_in_player_both_themes_at_three_widths(self):
        with self.page(width=390) as p:
            for width in [320,390,1440]:
                p.set_viewport_size({'width':width,'height':950})
                for game in GAMES:
                    with self.subTest(width=width,game=game):
                        p.goto(self.base+'/gra.html?gra='+game)
                        frame=p.frame_locator('#game-stage iframe')
                        expect(frame.locator('body')).to_have_attribute('data-game',game)
                        expect(p.locator('#game-placeholder')).to_have_count(0)
                        iframe=p.frames[1]
                        iframe.wait_for_function('window.MoreGame')
                        iframe.evaluate('document.fonts.ready')
                        for theme in ['dark','light']:
                            p.evaluate('(m)=>SpinnerTheme.set(m)',theme)
                            expect(frame.locator('html')).to_have_attribute('data-theme',theme)
                            self.assertFalse(iframe.evaluate('document.documentElement.scrollWidth>innerWidth'),(width,game,theme))
                        self.assertFalse(p.evaluate('document.documentElement.scrollWidth>innerWidth'))

    def test_each_game_pauses_idempotently_blocks_moves_and_restarts(self):
        for game in GAMES:
            with self.subTest(game=game), self.page(game,width=390) as p:
                p.evaluate('SpinnerGame.pause();SpinnerGame.pause()')
                before=self.state(p)
                self.assertEqual(before['phase'],'paused')
                p.keyboard.press('ArrowLeft');p.keyboard.press('1');p.keyboard.press('Space')
                p.wait_for_timeout(120)
                self.assertEqual(self.state(p),before)
                p.locator('#more-resume').click()
                self.assertEqual(self.state(p)['phase'],'ready')
                p.locator('#more-new').click()
                self.assertEqual(self.state(p)['phase'],'ready')
                self.assertEqual(p.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])

    def test_four_in_a_row_real_cpu_turn_undo_and_full_local_win(self):
        with self.page('connect-four') as p:
            p.locator('[data-index="38"]').click()
            p.wait_for_function('MoreGame.snapshot().history===2')
            p.get_by_role('button',name='Cofnij',exact=True).click()
            self.assertEqual(self.state(p)['board'],[0]*42)
            self.local(p)
            for col in [0,1,0,1,0,1,0]:
                self.assertTrue(p.evaluate('(c)=>MoreGame.move(c)',col))
            self.assertEqual(self.state(p)['phase'],'won')
            expect(p.locator('#more-result-text')).to_contain_text('gracz I')
            p.get_by_role('button',name='Cofnij',exact=True).click()
            self.assertEqual(self.state(p)['phase'],'playing')

    def test_four_in_a_row_ai_blocks_and_finds_wins(self):
        with self.page('connect-four') as p:
            result=p.evaluate('''()=>{
                const r=MoreGame.rules;
                const a={board:Array(42).fill(0),turn:2};a.board[35]=a.board[36]=a.board[37]=1;
                const b={board:Array(42).fill(0),turn:2};b.board[35]=b.board[36]=b.board[37]=2;
                let s=r.initial();for(let i=0;i<6;i++)s=r.apply(s,0);
                return {block:MoreGame.choose(a,4),win:MoreGame.choose(b,4),full:r.legal(s).includes(0)};
            }''')
            self.assertEqual(result,{'block':3,'win':3,'full':False})

    def test_each_computer_waits_through_pause_and_undo_restores_human_turn(self):
        for game in GAMES[:4]:
            with self.subTest(game=game),self.page(game,clock=True) as p:
                initial=self.state(p)['board']
                p.evaluate('MoreGame.move(MoreGame.rules.legal(MoreGame.snapshot())[0])')
                self.assertEqual(self.state(p)['turn'],2)
                p.evaluate('SpinnerGame.pause()');before=self.state(p)
                p.clock.run_for(1500);self.assertEqual(self.state(p),before)
                p.locator('#more-resume').click();p.clock.run_for(400)
                self.assertGreaterEqual(self.state(p)['history'],2)
                p.get_by_role('button',name='Cofnij',exact=True).click()
                self.assertEqual(self.state(p)['board'],initial)

    def test_active_canvas_games_freeze_and_release_held_controls(self):
        for game,begin,key in [('pong','serve','ArrowUp'),('orbit','shoot','w'),('stack','drop',None)]:
            with self.subTest(game=game),self.page(game,clock=True) as p:
                p.evaluate(f'MoreGame.{begin}()')
                if key:p.keyboard.down(key)
                p.clock.run_for(200);p.evaluate('SpinnerGame.pause()');before=self.state(p)
                p.clock.run_for(2500);self.assertEqual(self.state(p),before)
                if 'keys' in before:self.assertEqual(before['keys'],[])
                p.locator('#more-resume').click();p.clock.run_for(100)
                self.assertEqual(self.state(p)['phase'],'playing')
                if 'keys' in before:self.assertEqual(self.state(p)['keys'],[])
                if key:p.keyboard.up(key)

    def test_reversi_initial_flips_and_complete_game_with_automatic_pass(self):
        with self.page('reversi') as p:
            self.local(p)
            self.assertEqual(p.evaluate('MoreGame.rules.legal(MoreGame.snapshot()).length'),4)
            first=p.evaluate('MoreGame.rules.legal(MoreGame.snapshot())[0]')
            p.locator(f'[data-index="{first}"]').click()
            self.assertEqual(self.state(p)['board'].count(1),4)
            p.get_by_role('button',name='Cofnij',exact=True).click()
            states=p.evaluate('''()=>{const out=[];for(let i=0;i<65;i++){const s=MoreGame.snapshot();out.push(s);if(!['ready','playing'].includes(s.phase))break;const moves=MoreGame.rules.legal(s);if(!moves.length)throw Error('Pass did not advance');MoreGame.move(moves[0]);}return out;}''')
            self.assertIn(states[-1]['phase'],['won','lost'])
            for before,after in zip(states,states[1:]):
                delta=[i for i,(a,b) in enumerate(zip(before['board'],after['board'])) if a!=b]
                self.assertGreaterEqual(len(delta),2)
                self.assertEqual(sum(v!=0 for v in after['board']),sum(v!=0 for v in before['board'])+1)
            a=states[-1]['board'].count(1);b=states[-1]['board'].count(2)
            self.assertEqual(p.evaluate('MoreGame.rules.result(MoreGame.snapshot())'),0 if a==b else 1 if a>b else 2)

    def test_dots_boxes_extra_turn_and_all_nine_squares_counted_once(self):
        with self.page('dots-boxes') as p:
            self.local(p)
            for edge in [1,7,9,15]:self.assertTrue(p.evaluate('(i)=>MoreGame.move(i)',edge))
            s=self.state(p)
            self.assertEqual(s['board'][8],2)
            self.assertEqual(s['turn'],2)
            p.evaluate('''()=>{while(['ready','playing'].includes(MoreGame.snapshot().phase)){const s=MoreGame.snapshot();MoreGame.move(MoreGame.rules.legal(s)[0]);}}''')
            s=self.state(p);boxes=[r*7+c for r in [1,3,5] for c in [1,3,5]]
            self.assertTrue(all(s['board'][i] in [1,2] for i in boxes))
            self.assertEqual(sum(p.evaluate('MoreGame.rules.scores(MoreGame.snapshot())')),9)
            self.assertEqual(s['phase'],'won')

    def test_mancala_extra_turn_capture_seed_conservation_and_complete_game(self):
        with self.page('mancala') as p:
            rules=p.evaluate('''()=>{
              const r=MoreGame.rules,extra=r.apply(r.initial(),2);
              const board=Array(14).fill(0);board[0]=1;board[2]=1;board[11]=4;board[8]=2;
              return {extra,capture:r.apply({board,turn:1},0)};
            }''')
            self.assertEqual(rules['extra']['turn'],1)
            self.assertEqual(rules['extra']['board'][6],1)
            self.assertEqual(rules['capture']['board'][6],5)
            self.local(p)
            states=p.evaluate('''()=>{const out=[];for(let i=0;i<500;i++){const s=MoreGame.snapshot();out.push(s);if(!['ready','playing'].includes(s.phase))break;const moves=MoreGame.rules.legal(s);MoreGame.move(moves[0]);}return out;}''')
            self.assertEqual(states[-1]['phase'],'won')
            self.assertTrue(all(sum(s['board'])==48 and min(s['board'])>=0 for s in states))
            last=states[-1]['board'];self.assertEqual(last[6]+last[13],48)
            self.assertTrue(all(last[i]==0 for i in list(range(6))+list(range(7,13))))

    def test_sliding_tiles_keyboard_immediate_undo_and_solvable_both_sizes(self):
        with self.page('fifteen') as p:
            for n in [3,4]:
                choose_option(p.get_by_label('PLANSZA',exact=True),str(n));s=self.state(p)
                initial=s['board'];empty=initial.index(0)
                key='ArrowLeft' if empty%n else 'ArrowRight'
                p.locator('#board button').first.focus();p.keyboard.press(key)
                self.assertEqual(self.state(p)['moves'],1)
                p.get_by_role('button',name='Cofnij',exact=True).click()
                self.assertEqual(self.state(p)['board'],initial)
                result=p.evaluate('''()=>{for(const i of MoreGame.snapshot().certificate){if(MoreGame.snapshot().phase==='won')break;if(!MoreGame.move(i))throw Error('Unreachable puzzle');}return MoreGame.snapshot();}''')
                self.assertEqual(result['board'],list(range(1,n*n))+[0]);self.assertEqual(result['phase'],'won')

    def test_lights_out_exact_solver_on_many_boards_and_complete_game(self):
        with self.page('lights-out') as p:
            for n in [4,5]:
                choose_option(p.get_by_label('PLANSZA',exact=True),str(n))
                for _ in range(5):
                    s=self.state(p);solution=p.evaluate('MoreGame.solve(MoreGame.snapshot().board)')
                    self.assertIsNotNone(solution)
                    check=s['board'][:]
                    for index in solution:
                        r,c=divmod(index,n)
                        for y,x in [(r,c),(r-1,c),(r+1,c),(r,c-1),(r,c+1)]:
                            if 0<=y<n and 0<=x<n:check[y*n+x]^=1
                    self.assertEqual(check,[0]*(n*n))
                    p.evaluate('MoreGame.newGame()')
                p.get_by_role('button',name='Podpowiedź',exact=True).click()
                self.assertGreaterEqual(self.state(p)['hinted'],0)
                p.evaluate('''()=>{const solution=MoreGame.solve(MoreGame.snapshot().board);for(const i of solution)MoreGame.move(i);}''')
                self.assertEqual(self.state(p)['phase'],'won')
                p.get_by_role('button',name='Cofnij',exact=True).click()
                self.assertEqual(self.state(p)['phase'],'playing')

    def test_nonogram_all_eight_pictures_right_click_undo_and_win(self):
        with self.page('nonogram') as p:
            p.locator('[data-index="0"]').click(button='right')
            self.assertEqual(self.state(p)['board'][0],-1)
            p.get_by_role('button',name='Cofnij',exact=True).click()
            self.assertEqual(self.state(p)['board'][0],0)
            for i in range(8):
                choose_option(p.get_by_label('OBRAZEK',exact=True),str(i))
                p.evaluate('''()=>{for(const[i,v]of MoreGame.snapshot().solution.entries())if(v)MoreGame.move(i);}''')
                self.assertEqual(self.state(p)['phase'],'won')
                expect(p.locator('#more-result-text')).to_contain_text('Wszystkie liczby')

    def test_hanoi_legal_hint_from_current_position_and_optimal_complete_round(self):
        with self.page('hanoi') as p:
            self.assertTrue(p.evaluate('MoreGame.move(0,1)'))
            self.assertFalse(p.evaluate('MoreGame.move(0,1)'))
            p.get_by_role('button',name='Cofnij',exact=True).click()
            for n in [3,4,7]:
                choose_option(p.get_by_label('KRĄŻKI',exact=True),str(n))
                p.evaluate('''()=>{for(let i=0;i<130&&MoreGame.snapshot().phase!=='won';i++){const s=MoreGame.snapshot(),next=MoreGame.nextMove(s.towers);if(!next||!MoreGame.move(...next))throw Error('Invalid Hanoi hint');}}''')
                s=self.state(p);self.assertEqual(s['phase'],'won');self.assertEqual(s['moves'],2**n-1)
                self.assertEqual(s['towers'],[[],[],list(range(n,0,-1))])

    def test_peg_solitaire_certificates_are_legal_for_every_difficulty(self):
        with self.page('peg-solitaire') as p:
            for target in [8,12,20]:
                choose_option(p.get_by_label('WYZWANIE',exact=True),str(target))
                s=self.state(p);board=s['board'][:]
                self.assertEqual(board.count(1),target)
                for a,b,c in s['certificate']:
                    self.assertEqual([board[a],board[b],board[c]],[1,1,0])
                    ar,ac=divmod(a,7);br,bc=divmod(b,7);cr,cc=divmod(c,7)
                    self.assertEqual((br*2,bc*2),(ar+cr,ac+cc))
                    self.assertEqual(abs(ar-cr)+abs(ac-cc),2)
                    board[a]=board[b]=0;board[c]=1
                self.assertEqual(board.count(1),1)
                p.evaluate('''()=>{for(const[a,,c]of MoreGame.snapshot().certificate)if(!MoreGame.move(a,c))throw Error('Illegal certificate');}''')
                self.assertEqual(self.state(p)['phase'],'won')
                p.get_by_role('button',name='Cofnij',exact=True).click()
                self.assertEqual(self.state(p)['board'].count(1),2)

    def test_codebreaker_duplicate_scoring_keyboard_win_and_ten_try_loss(self):
        with self.page('codebreaker') as p:
            self.assertEqual(p.evaluate('MoreGame.score([1,1,2,3],[1,2,1,4])'),{'exact':1,'misplaced':2})
            self.assertEqual(p.evaluate('MoreGame.score([1,1,1,1],[1,2,2,2])'),{'exact':1,'misplaced':0})
            secret=self.state(p)['secret']
            for digit in secret:p.keyboard.press(str(digit))
            p.keyboard.press('Enter');self.assertEqual(self.state(p)['phase'],'won')
            p.locator('#more-new').click()
            result=p.evaluate('''()=>{const wrong=MoreGame.snapshot().secret.map(v=>v===6?1:v+1);for(let n=0;n<10;n++){for(const v of wrong)MoreGame.enter(v);MoreGame.submit();}return MoreGame.snapshot();}''')
            self.assertEqual(result['phase'],'lost');self.assertEqual(len(result['attempts']),10)

    def test_peg_generator_keeps_promised_size_even_with_constant_random(self):
        with self.page('peg-solitaire',init='Math.random=()=>0') as p:
            for target in [8,12,20]:
                choose_option(p.get_by_label('WYZWANIE',exact=True),str(target))
                self.assertEqual(self.state(p)['board'].count(1),target)
                p.evaluate('''()=>{for(const[a,,c]of MoreGame.snapshot().certificate)if(!MoreGame.move(a,c))throw Error('Invalid fallback');}''')
                self.assertEqual(self.state(p)['phase'],'won')

    def test_word_search_every_category_and_reverse_endpoint_selection(self):
        with self.page('word-search') as p:
            for cat in ['natura','dom','droga']:
                choose_option(p.get_by_label('SŁOWA',exact=True),cat)
                s=self.state(p)
                self.assertEqual(len(s['placements']),8)
                for placement in s['placements']:
                    self.assertEqual(''.join(s['board'][i] for i in placement['cells']),placement['word'])
                first=s['placements'][0]['cells']
                p.locator(f'[data-index="{first[-1]}"]').click();p.locator(f'[data-index="{first[0]}"]').click()
                p.evaluate('''()=>{for(const p of MoreGame.snapshot().placements){if(MoreGame.snapshot().found.includes(p.word))continue;MoreGame.choose(p.cells[0]);MoreGame.choose(p.cells.at(-1));}}''')
                self.assertEqual(self.state(p)['phase'],'won')
                self.assertEqual(len(self.state(p)['found']),8)

    def test_word_guess_polish_letters_no_repeat_penalty_and_both_endings(self):
        with self.page('word-guess') as p:
            p.keyboard.press('p')
            self.assertIn('P',self.state(p)['guessed'])
            self.assertIn(self.state(p)['phase'],['ready','playing'])
            p.evaluate('MoreGame.newGame()')
            word=self.state(p)['word']
            self.assertTrue(p.evaluate('(c)=>MoreGame.guess(c)',word[0]))
            self.assertFalse(p.evaluate('(c)=>MoreGame.guess(c)',word[0]))
            self.assertEqual(self.state(p)['mistakes'],0)
            p.evaluate('''()=>{for(const c of new Set(MoreGame.snapshot().word))MoreGame.guess(c);}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(self.state(p)['streak'],1)
            p.locator('#more-new').click();self.assertNotEqual(self.state(p)['word'],word)
            p.evaluate('''()=>{for(const c of 'AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ'){if(!MoreGame.snapshot().word.includes(c))MoreGame.guess(c);if(MoreGame.snapshot().phase==='lost')break;}}''')
            self.assertEqual(self.state(p)['phase'],'lost');self.assertEqual(self.state(p)['mistakes'],7)

    def test_echo_sequence_freezes_during_pause_and_rejects_wrong_input(self):
        with self.page('echo',clock=True) as p:
            p.evaluate('MoreGame.newGame();MoreGame.begin()')
            p.clock.run_for(400);p.evaluate('SpinnerGame.pause()');before=self.state(p)
            p.clock.run_for(5000);self.assertEqual(self.state(p),before)
            p.locator('#more-resume').click()
            for _ in range(3):
                p.clock.run_for(3000)
                self.assertEqual(self.state(p)['stage'],'input')
                p.evaluate('''()=>{for(const i of MoreGame.snapshot().sequence)MoreGame.press(i);}''')
            self.assertEqual(self.state(p)['completed'],3)
            p.clock.run_for(4000);wrong=(self.state(p)['sequence'][0]+1)%4
            p.evaluate('(i)=>MoreGame.press(i)',wrong)
            self.assertEqual(self.state(p)['phase'],'lost')

    def test_moles_immediate_pointerdown_penalties_pause_and_full_timed_round(self):
        with self.page('moles',width=390,clock=True) as p:
            p.evaluate('MoreGame.newGame();MoreGame.begin()')
            s=self.state(p);button=p.locator(f'[data-index="{s["target"]}"]');button.scroll_into_view_if_needed();rect=button.bounding_box()
            p.mouse.move(rect['x']+rect['width']/2,rect['y']+rect['height']/2);p.mouse.down()
            self.assertEqual(self.state(p)['score'],10)
            p.mouse.up();self.assertEqual(self.state(p)['score'],10)
            p.evaluate('(i)=>MoreGame.hit(i)',s['rock']);self.assertEqual(self.state(p)['score'],5)
            p.evaluate('SpinnerGame.pause()');before=self.state(p);p.clock.run_for(31000);self.assertEqual(self.state(p),before)
            p.locator('#more-resume').click();p.clock.run_for(31000)
            self.assertEqual(self.state(p)['phase'],'won')
            self.assertEqual(self.state(p)['target'],-1)

    def test_pong_paddle_angles_edges_scores_and_complete_seven_point_match(self):
        with self.page('pong') as p:
            p.evaluate('MoreGame.serve()')
            result=p.evaluate('''()=>{const s=MoreGame.state;s.py=240;s.x=54;s.y=260;s.vx=-400;s.vy=0;MoreGame.advance(.02);return MoreGame.snapshot();}''')
            self.assertGreater(result['vx'],0);self.assertGreater(result['vy'],0)
            result=p.evaluate('''()=>{const s=MoreGame.state;s.x=360;s.y=8;s.vx=200;s.vy=-200;MoreGame.advance(.02);return MoreGame.snapshot();}''')
            self.assertGreater(result['vy'],0)
            p.evaluate('''()=>{for(let i=0;i<7;i++){MoreGame.serve();const s=MoreGame.state;s.x=735;s.y=20;s.vx=350;s.vy=0;MoreGame.advance(.01);}}''')
            self.assertEqual(self.state(p)['player'],7);self.assertEqual(self.state(p)['phase'],'won')

    def test_orbit_controls_wrap_fragmentation_all_three_waves_and_immunity(self):
        with self.page('orbit',width=390) as p:
            p.keyboard.down('w');p.evaluate('MoreGame.advance(.1)');p.keyboard.up('w')
            self.assertNotEqual(self.state(p)['ship']['y'],260)
            p.keyboard.press('Space');self.assertGreaterEqual(len(self.state(p)['bullets']),1)
            result=p.evaluate('''()=>{const s=MoreGame.state;s.ship.x=719;s.ship.vx=200;MoreGame.advance(.05);return MoreGame.snapshot();}''')
            self.assertLess(result['ship']['x'],20)
            result=p.evaluate('''()=>{const s=MoreGame.state;s.ship.invincible=0;s.rocks[0].x=s.ship.x;s.rocks[0].y=s.ship.y;MoreGame.advance(.01);const one=s.lives;MoreGame.advance(.01);return{one,two:s.lives};}''')
            self.assertEqual(result,{'one':2,'two':2})
            p.evaluate('''()=>{const s=MoreGame.state;s.ship.invincible=100;for(let i=0;i<100&&MoreGame.snapshot().phase==='playing';i++){const r=s.rocks[0];s.bullets.push({x:r.x,y:r.y,vx:0,vy:0,ttl:1});MoreGame.advance(1/120);}}''')
            s=self.state(p);self.assertEqual(s['phase'],'won');self.assertEqual(s['wave'],3);self.assertEqual(s['score'],1440)

    def test_stack_reaction_autoplayer_completes_twenty_five_floors(self):
        with self.page('stack') as p:
            p.evaluate('MoreGame.drop()')
            result=p.evaluate('''()=>{for(let i=0;i<25;i++){const s=MoreGame.state,target=s.blocks.at(-1).x;const dt=Math.abs(target-s.x)/s.speed;MoreGame.advance(dt);if(!MoreGame.drop())throw Error('Drop failed');}return MoreGame.snapshot();}''')
            self.assertEqual(result['phase'],'won');self.assertEqual(result['level'],25);self.assertAlmostEqual(result['width'],280)
            p.locator('#more-new').click()
            result=p.evaluate('''()=>{MoreGame.drop();const s=MoreGame.state;s.x=120;MoreGame.drop();return MoreGame.snapshot();}''')
            self.assertEqual(result['width'],260)
            p.evaluate('''()=>{const s=MoreGame.state;s.blocks.at(-1).w=s.width=40;s.x=430;MoreGame.drop();}''')
            self.assertEqual(self.state(p)['phase'],'lost')

    def test_record_consent_persistence_and_clearing(self):
        for consent in [False,True]:
            with self.subTest(consent=consent),self.page('stack',consent=consent) as p:
                p.evaluate('MoreGame.drop();MoreGame.state.x=100;MoreGame.drop()')
                self.assertEqual(p.evaluate('localStorage.getItem("spinner:prefs:more:stack")'),'1' if consent else None)
                p.reload();self.assertEqual(p.locator('#more-stat-2').inner_text(),'1' if consent else '0')
                p.evaluate('SpinnerStorage.preferences.clear()')
                self.assertEqual(p.evaluate('localStorage.getItem("spinner:prefs:more:stack")'),None)
                expect(p.locator('#more-stat-2')).to_have_text('0')

    def test_lowest_result_record_uses_first_win_and_keeps_better_round(self):
        with self.page('codebreaker',consent=True) as p:
            p.evaluate('''()=>{for(const digit of MoreGame.snapshot().secret)MoreGame.enter(digit);MoreGame.submit();}''')
            self.assertEqual(p.evaluate('localStorage.getItem("spinner:prefs:more:codebreaker")'),'1')
            p.locator('#more-new').click()
            p.evaluate('''()=>{const code=MoreGame.snapshot().secret;for(const d of code)MoreGame.enter(d===6?1:d+1);MoreGame.submit();for(const d of code)MoreGame.enter(d);MoreGame.submit();}''')
            self.assertEqual(self.state(p)['phase'],'won')
            self.assertEqual(p.evaluate('localStorage.getItem("spinner:prefs:more:codebreaker")'),'1')

if __name__=='__main__':unittest.main(verbosity=2)
