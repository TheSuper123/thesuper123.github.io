"""Forty new engines: independent rule fixtures, complete rounds and real inputs."""
from pathlib import Path
import json
import unittest
from playwright.sync_api import expect
from test_more_games import MoreGames
from game_controls import choose_option

INFO=json.loads((Path(__file__).resolve().parents[1]/'docs/new40-info.json').read_text())
IDS=[g['id'] for g in INFO]
PUZZLES=['kakuro','nurikabe','kuromasu','hitori','star-battle','tents','fleet-puzzle','akari','netwalk','paths']
ARCADE=[g['id'] for g in INFO if g['category']=='arcade']

class HundredGames(MoreGames):
    def state(self,p):return p.evaluate('MoreGame.snapshot()')
    def local(self,p):choose_option(p.get_by_label('RYWAL',exact=True),'local')

    def test_catalog_has_one_hundred_unique_games_and_quiz_filter(self):
        with self.page() as p:
            games=p.evaluate('SpinnerGames')
            self.assertEqual(len(games),100)
            self.assertEqual(len({g['id'] for g in games}),100)
            self.assertEqual([g['id'] for g in games[60:]],IDS)
            expect(p.locator('.game-card')).to_have_count(100)
            p.get_by_role('button',name='Quizy i testy',exact=True).click()
            expect(p.locator('.game-card')).to_have_count(5)
            p.locator('#game-search').fill('kompas');expect(p.locator('.game-card')).to_have_count(1)

    def test_every_new_game_loads_theme_pause_restart_and_no_answer_storage(self):
        for game in IDS:
            with self.subTest(game=game),self.page(game,width=390,clock=True) as p:
                p.wait_for_function('window.MoreGame&&document.body.dataset.viewportReady')
                before=self.state(p)
                for theme in ['dark','light']:
                    p.evaluate('(m)=>SpinnerTheme.set(m)',theme)
                    self.assertEqual(self.state(p),before)
                p.evaluate('SpinnerGame.pause();SpinnerGame.pause()')
                paused=self.state(p);self.assertEqual(paused['phase'],'paused')
                p.keyboard.press('1');p.keyboard.press('ArrowLeft');p.keyboard.press('Space');p.clock.run_for(150)
                self.assertEqual(self.state(p),paused)
                p.locator('#more-resume').click();self.assertEqual(self.state(p)['phase'],'ready')
                p.locator('#more-new').click();self.assertEqual(self.state(p)['phase'],'ready')
                self.assertEqual(p.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])

    def test_generated_puzzles_have_legal_complete_solutions_over_many_rounds(self):
        for game in PUZZLES:
            with self.subTest(game=game),self.page(game) as p:
                for _ in range(20):
                    self.assertTrue(p.evaluate('''()=>{const s=MoreGame.snapshot();return MoreGame.valid({...s,board:s.solution});}'''),game)
                    p.evaluate('MoreGame.newGame()')

    def test_chess_perft_opening_castle_en_passant_promotion_and_pins(self):
        with self.page('chess') as p:
            data=p.evaluate('''()=>{const r=MoreGame.rules,s=MoreGame.snapshot(),perft=(s,n)=>!n?1:r.legal(s).reduce((a,m)=>a+perft(r.apply(s,m),n-1),0);const base={board:Array(64).fill(0),turn:1,castle:[true,true,false,false],ep:-1,quiet:0,moves:0,positions:[]};base.board[60]=6;base.board[4]=-6;base.board[56]=base.board[63]=4;const castle=r.legal(base).filter(m=>m.from===60&&Math.abs(m.to-60)===2);base.board[5]=-4;const throughCheck=r.legal(base).some(m=>m.from===60&&m.to===62);base.board[5]=0;base.board[28]=1;base.board[27]=-1;base.ep=19;const ep=r.legal(base).find(m=>m.from===28&&m.to===19),after=r.apply(base,ep);base.board[28]=base.board[27]=0;base.ep=-1;base.board[8]=1;const promote=r.legal(base).filter(m=>m.from===8&&m.to===0);return{counts:[perft(s,1),perft(s,2),perft(s,3)],castle:castle.length,throughCheck,ep:after.board[27],promote:promote.map(m=>m.promotion).sort()};}''')
            self.assertEqual(data,{'counts':[20,400,8902],'castle':2,'throughCheck':False,'ep':0,'promote':[2,3,4,5]})

    def test_chess_actual_fools_mate_and_undo(self):
        with self.page('chess') as p:
            self.local(p)
            p.evaluate('''()=>{for(const[from,to]of[[53,45],[12,28],[54,38],[3,39]]){const m=MoreGame.rules.legal(MoreGame.snapshot()).find(m=>m.from===from&&m.to===to);if(!m||!MoreGame.move(m))throw Error('Legal move rejected');}}''')
            self.assertEqual(self.state(p)['phase'],'won')
            expect(p.locator('#more-result-text')).to_contain_text('II')
            p.get_by_role('button',name='Cofnij',exact=True).click();self.assertEqual(self.state(p)['phase'],'playing')

    def test_go_capture_suicide_ko_and_two_pass_scoring(self):
        with self.page('go') as p:
            data=p.evaluate('''()=>{const r=MoreGame.rules,s=r.initial();s.board[0]=2;s.board[1]=1;const capture=r.apply(s,9),ko={...s,previous:capture.board.join(',')};const suicide=r.initial();for(const i of[31,39,41,49])suicide.board[i]=2;return{captured:capture.board[0],prisoners:capture.captures,suicide:r.apply(suicide,40),ko:r.apply(ko,9),area:MoreGame.area(r.initial())};}''')
            self.assertEqual(data,{'captured':0,'prisoners':[1,0],'suicide':None,'ko':None,'area':[0,6.5]})
            self.local(p);p.get_by_role('button',name='Pas',exact=True).click();p.get_by_role('button',name='Pas',exact=True).click();self.assertEqual(self.state(p)['phase'],'won')

    def test_backgammon_bar_priority_higher_die_bearing_off_and_conservation(self):
        with self.page('backgammon') as p:
            data=p.evaluate('''()=>{const r=MoreGame.rules,s=r.initial();s.board=Array(24).fill(0);s.board[23]=1;s.off=[14,15];s.bar=[0,0];s.dice=[1,6];const high=r.legal(s);s.board[23]=0;s.board[0]=-2;s.bar=[1,0];s.dice=[1,2];const bar=r.legal(s);return{high,bar};}''')
            self.assertEqual(data['high'],[[23,6]]);self.assertEqual(data['bar'],[[-1,2]])
            self.local(p)
            data=p.evaluate('''()=>{let audit=true;for(let k=0;k<2000&&['ready','playing'].includes(MoreGame.snapshot().phase);k++){const s=MoreGame.snapshot();for(let player=1;player<=2;player++){const count=s.board.reduce((sum,v)=>sum+(player===1&&v>0?v:player===2&&v<0?-v:0),0)+s.bar[player-1]+s.off[player-1];if(count!==15)audit=false;}if(!MoreGame.move(MoreGame.choose()))throw Error('CPU chose illegal move');}return{audit,last:MoreGame.snapshot()};}''')
            self.assertTrue(data['audit']);self.assertEqual(data['last']['phase'],'won');self.assertIn(15,data['last']['off'])

    def test_gomoku_full_line_and_cpu_block(self):
        with self.page('gomoku') as p:
            self.local(p)
            p.evaluate('''()=>{for(const i of[0,13,1,14,2,15,3,16,4])if(!MoreGame.move(i))throw Error('Move failed');}''')
            self.assertEqual(self.state(p)['phase'],'won')
            self.assertEqual(p.evaluate('''()=>{const s=MoreGame.rules.initial();s.turn=2;s.board[0]=s.board[1]=s.board[2]=s.board[3]=1;return MoreGame.choose(s);}'''),4)

    def test_ataxx_clone_jump_conversion_and_pass(self):
        with self.page('ataxx') as p:
            data=p.evaluate('''()=>{const r=MoreGame.rules,s=r.initial();s.board[8]=2;const t=r.apply(s,[0,1]),jump=r.apply(s,[0,14]);return{count:t.board.filter(v=>v===1).length,converted:t.board[8],original:t.board[0],jump:[jump.board[0],jump.board[14]],legal:r.legal(s).includes([0,1])};}''')
            self.assertEqual(data['count'],4);self.assertEqual(data['converted'],1);self.assertEqual(data['original'],1);self.assertEqual(data['jump'],[0,1])
            self.local(p)
            p.evaluate('''()=>{for(let k=0;k<500&&['ready','playing'].includes(MoreGame.snapshot().phase);k++)if(!MoreGame.move(MoreGame.choose()))throw Error('Illegal move');}''')
            self.assertEqual(self.state(p)['phase'],'won')

    def test_pentago_rotates_quadrants_and_completes_match(self):
        with self.page('pentago') as p:
            data=p.evaluate('''()=>{const r=MoreGame.rules,s=r.initial();s.board[0]=1;const t=r.apply(s,[35,0,1]);return[t.board[2],t.board[0],t.board[35],t.turn];}''')
            self.assertEqual(data,[1,0,1,2]);self.local(p)
            p.evaluate('''()=>{for(let k=0;k<36&&['ready','playing'].includes(MoreGame.snapshot().phase);k++)if(!MoreGame.move(MoreGame.choose()))throw Error('Illegal move');}''')
            self.assertEqual(self.state(p)['phase'],'won')

    def test_konane_opening_multijump_and_complete_match(self):
        with self.page('konane') as p:
            data=p.evaluate('''()=>{const r=MoreGame.rules,s=r.initial();s.stage=2;s.board=Array(36).fill(0);s.board[0]=1;s.board[1]=s.board[3]=2;return{legal:r.legal(s),after:r.apply(s,[0,2,4])};}''')
            self.assertIn([0,2,4],data['legal']);self.assertEqual(data['after']['board'][:5],[0,0,0,0,1])
            self.local(p);p.evaluate('''()=>{for(let k=0;k<100&&['ready','playing'].includes(MoreGame.snapshot().phase);k++)if(!MoreGame.move(MoreGame.choose()))throw Error('Illegal move');}''')
            self.assertEqual(self.state(p)['phase'],'won')

    def test_fox_geese_valid_board_capture_and_complete_match(self):
        with self.page('fox-geese') as p:
            self.assertEqual(self.state(p)['board'].count(2),13)
            data=p.evaluate('''()=>{const r=MoreGame.rules,s=r.initial();s.board=Array(49).fill(0);s.board[24]=1;s.board[25]=2;return{legal:r.legal(s),after:r.apply(s,[24,26])};}''')
            self.assertIn([24,26],data['legal']);self.assertEqual(data['after']['caught'],1);self.assertEqual(data['after']['board'][25],0)
            self.local(p);p.evaluate('''()=>{for(let k=0;k<1000&&['ready','playing'].includes(MoreGame.snapshot().phase);k++)if(!MoreGame.move(MoreGame.choose()))throw Error('Illegal move');}''')
            self.assertEqual(self.state(p)['phase'],'won')

    def test_puzzle_complete_rounds_using_actual_moves_and_undo(self):
        for game in PUZZLES:
            with self.subTest(game=game),self.page(game) as p:
                result=p.evaluate('''()=>{const s=MoreGame.snapshot();for(let i=0;i<s.board.length;i++){if(s.fixed?.[i])continue;if(s.solution[i]===s.board[i])continue;if(document.body.dataset.game==='netwalk'){for(let k=0;k<4&&MoreGame.snapshot().board[i]!==s.solution[i];k++)MoreGame.act(i);}else MoreGame.act(i,s.solution[i]);if(MoreGame.snapshot().phase==='won')break;}return MoreGame.snapshot();}''')
                self.assertEqual(result['phase'],'won',game)
                p.get_by_role('button',name='Cofnij',exact=True).click();self.assertEqual(self.state(p)['phase'],'playing')

    def test_rush_hour_reverse_certificate_solves_real_moves(self):
        with self.page('rush-hour') as p:
            s=self.state(p)
            cells=[]
            for c in s['cars']:
                cells.extend((c['y']+(j if c['v'] else 0))*6+c['x']+(0 if c['v'] else j) for j in range(c['len']))
            self.assertEqual(len(cells),len(set(cells)))
            p.evaluate('''()=>{for(const[k,d]of MoreGame.snapshot().certificate){if(MoreGame.snapshot().phase==='won')break;if(!MoreGame.move(k,d))throw Error('Reverse move failed');}}''')
            self.assertEqual(self.state(p)['phase'],'won');p.get_by_role('button',name='Cofnij',exact=True).click();self.assertEqual(self.state(p)['phase'],'playing')

    def test_knight_tour_route_has_36_unique_legal_steps_and_finishes(self):
        with self.page('knight-tour') as p:
            path=self.state(p)['solution'];self.assertEqual(sorted(path),list(range(36)))
            for a,b in zip(path,path[1:]):self.assertEqual(abs(a//6-b//6)*abs(a%6-b%6),2)
            p.evaluate('''()=>{for(const i of MoreGame.snapshot().solution)if(!MoreGame.act(i))throw Error('Rejected knight move');}''')
            self.assertEqual(self.state(p)['phase'],'won')

    def test_eight_queens_accepts_solution_rejects_attacks(self):
        with self.page('eight-queens') as p:
            p.evaluate('MoreGame.act(0);MoreGame.act(1)');self.assertFalse(p.evaluate('MoreGame.valid()'))
            p.evaluate('''()=>{MoreGame.newGame();for(const[r,c]of[0,4,7,5,2,6,1,3].entries())MoreGame.act(r*8+c);}''')
            self.assertEqual(self.state(p)['phase'],'won')

    def test_polyomino_pieces_connected_cover_thirty_and_rotate_four_times(self):
        with self.page('polyomino') as p:
            s=self.state(p);self.assertEqual(len(s['pieces']),6)
            for piece in s['pieces']:
                self.assertEqual(len({tuple(c) for c in piece}),5)
                todo=[tuple(piece[0])];seen=set();allowed=set(map(tuple,piece))
                while todo:
                    a=todo.pop()
                    if a in seen:continue
                    seen.add(a)
                    todo.extend(b for b in allowed-seen if abs(a[0]-b[0])+abs(a[1]-b[1])==1)
                self.assertEqual(len(seen),5)
            p.evaluate('''()=>{for(const p of MoreGame.snapshot().solution)if(!MoreGame.place(p.i,p.k,0,false))throw Error('Piece failed');}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(len(self.state(p)['board']),30)

    def test_twenty_four_exact_fractions_solution_zero_guard_and_undo(self):
        with self.page('twenty-four') as p:
            result=p.evaluate('''()=>({third:MoreGame.calc({a:1,b:1},{a:3,b:1},'÷'),zero:MoreGame.calc({a:1,b:1},{a:0,b:1},'÷')})''')
            self.assertEqual(result,{'third':{'a':1,'b':3},'zero':None})
            p.evaluate('''()=>{for(const[i,j,op]of MoreGame.snapshot().solution)if(!MoreGame.combine(i,j,op))throw Error('24 solution rejected');}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(self.state(p)['items'][0]['a'],24)
            p.get_by_role('button',name='Cofnij',exact=True).click();self.assertEqual(len(self.state(p)['items']),2)

    def test_cryptogram_consistent_substitution_and_complete_keyboard_mapping(self):
        with self.page('cryptogram') as p:
            s=self.state(p);self.assertEqual(len(set(s['decode'].values())),len(s['decode']))
            p.evaluate('''()=>{for(const[c,letter]of Object.entries(MoreGame.snapshot().decode)){MoreGame.select(c);MoreGame.enter(letter);}}''')
            self.assertEqual(self.state(p)['phase'],'won')

    def test_stroop_counts_ink_not_word_and_time_limit(self):
        with self.page('stroop',clock=True) as p:
            p.evaluate('''()=>{const s=MoreGame.getState();s.word=0;s.ink=1;MoreGame.answer(0);}''')
            self.assertEqual(self.state(p)['wrong'],1)
            p.evaluate('MoreGame.answer(MoreGame.snapshot().ink)');self.assertEqual(self.state(p)['right'],1)
            p.clock.run_for(45100);self.assertEqual(self.state(p)['phase'],'won')

    def test_arithmetic_twenty_exact_answers_and_capitals_fifteen_unique_countries(self):
        for game,count in [('mental-math',20),('capitals',15)]:
            with self.subTest(game=game),self.page(game) as p:
                p.evaluate('''(count)=>{for(let i=0;i<count;i++){const s=MoreGame.snapshot();if(new Set(s.options).size!==4)throw Error('Duplicate answers');MoreGame.answer(s.expected??s.current.answer);}}''',count)
                s=self.state(p);self.assertEqual(s['correct'],count);self.assertEqual(s['phase'],'won')
                if game=='capitals':self.assertEqual(len({a['country'] for a in s['answers']}),15)

    def test_asteroids_split_collision_shields_and_three_wave_finish(self):
        with self.page('asteroids') as p:
            data=p.evaluate('''()=>{MoreGame.begin();const s=MoreGame.getState();s.rocks=[{x:100,y:100,vx:0,vy:0,r:30,size:2,seed:0}];s.bullets=[{x:100,y:100,vx:0,vy:0,life:1}];MoreGame.advance(.01);return MoreGame.snapshot();}''')
            self.assertEqual(len(data['rocks']),2);self.assertEqual(data['score'],30)
            p.evaluate('''()=>{const s=MoreGame.getState();for(let wave=1;wave<=3;wave++){s.rocks=[{x:100,y:100,vx:0,vy:0,r:15,size:1,seed:0}];s.bullets=[{x:100,y:100,vx:0,vy:0,life:1}];MoreGame.advance(.01);}}''')
            self.assertEqual(self.state(p)['phase'],'won')
            p.evaluate('''()=>{MoreGame.newGame();MoreGame.begin();const s=MoreGame.getState();s.immune=0;s.rocks=[{x:s.x,y:s.y,vx:0,vy:0,r:30,size:2,seed:0}];MoreGame.advance(.01);}''')
            self.assertEqual(self.state(p)['lives'],2)

    def test_artillery_independent_ballistic_aim_deforms_ground_and_full_duel(self):
        with self.page('artillery') as p:
            data=p.evaluate('''()=>{MoreGame.begin();const terrain=[...MoreGame.snapshot().terrain];for(let k=0;k<10&&MoreGame.snapshot().phase==='playing';k++){const s=MoreGame.getState(),me=s.tanks[s.turn-1],enemy=s.tanks[2-s.turn],dir=s.turn===1?1:-1;let best=null;for(let angle=15;angle<=75;angle+=2)for(let power=180;power<=450;power+=5){let x=me.x,y=s.terrain[Math.floor(x)]-12,vx=Math.cos(angle*Math.PI/180)*power*dir,vy=-Math.sin(angle*Math.PI/180)*power;for(let tick=0;tick<2000;tick++){vx+=s.wind/240;vy+=170/240;x+=vx/240;y+=vy/240;if(x<0||x>=720)break;if(y>=s.terrain[Math.floor(x)]){const error=Math.abs(x-enemy.x);if(!best||error<best.error)best={error,angle,power};break;}}}if(!best)throw Error('No trajectory');s.angle=best.angle;s.power=best.power;if(!MoreGame.fire())throw Error('Shot rejected');MoreGame.advance(8);}return{state:MoreGame.snapshot(),changed:terrain.some((v,i)=>v!==MoreGame.snapshot().terrain[i])};}''')
            self.assertTrue(data['changed']);self.assertEqual(data['state']['phase'],'won')
            self.assertTrue(any(t['hp']<=0 for t in data['state']['tanks']))

    def test_curling_six_physical_stones_friction_and_final_score(self):
        with self.page('curling') as p:
            p.evaluate('MoreGame.launch();MoreGame.advance(6)')
            s=self.state(p);self.assertFalse(s['moving']);self.assertAlmostEqual(s['stones'][0]['x'],587,delta=4)
            self.assertEqual(p.evaluate('MoreGame.score()'),50)
            p.evaluate('''()=>{for(let i=0;i<5;i++){MoreGame.launch();MoreGame.advance(8);}}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(len(self.state(p)['stones']),6)

    def test_minigolf_wall_reflection_three_cup_transitions_and_real_pointer_shot(self):
        with self.page('minigolf',width=390) as p:
            p.evaluate('''()=>{MoreGame.begin();const s=MoreGame.getState();s.moving=true;s.ball={x:292,y:230,vx:200,vy:0};MoreGame.advance(.02);}''')
            self.assertLess(self.state(p)['ball']['vx'],0)
            p.evaluate('''()=>{MoreGame.newGame();MoreGame.begin();for(let k=0;k<3;k++){const s=MoreGame.getState(),cup=MoreGame.holes[k].cup;s.ball={x:cup[0],y:cup[1],vx:10,vy:0};s.moving=true;MoreGame.advance(.01);}}''')
            self.assertEqual(self.state(p)['phase'],'won')
            p.evaluate('MoreGame.newGame()');canvas=p.locator('#game');r=canvas.bounding_box()
            p.mouse.move(r['x']+r['width']*85/720,r['y']+r['height']*.5);p.mouse.down();p.mouse.move(r['x']+r['width']*.3,r['y']+r['height']*.5);p.mouse.up()
            self.assertEqual(self.state(p)['strokes'],1);self.assertTrue(self.state(p)['moving'])

    def test_bowling_strike_spare_bonuses_real_collisions_and_complete_ten_frames(self):
        with self.page('bowling') as p:
            scores=p.evaluate('''()=>[MoreGame.scoreFrames([...Array.from({length:9},()=>[10]),[10,10,10]]),MoreGame.scoreFrames([...Array.from({length:9},()=>[5,5]),[5,5,5]]),MoreGame.scoreFrames(Array.from({length:10},()=>[3,4]))]''')
            self.assertEqual(scores,[300,150,70])
            p.evaluate('MoreGame.throwBall();MoreGame.advance(5)')
            self.assertGreater(sum(self.state(p)['frames'][0]),0)
            p.evaluate('''()=>{for(let k=0;k<25&&['ready','playing'].includes(MoreGame.snapshot().phase);k++){const s=MoreGame.getState();s.aim=k%2?9:-9;if(!MoreGame.throwBall())throw Error('Throw blocked');MoreGame.advance(5);}}''')
            s=self.state(p);self.assertEqual(s['phase'],'won');self.assertEqual(len(s['frames']),10);self.assertTrue(all(0<=x<=10 for f in s['frames'] for x in f))

    def test_darts_sector_values_bust_reset_and_full_501_double_out(self):
        with self.page('darts') as p:
            hits=p.evaluate('''()=>[MoreGame.hit(360,100).value,MoreGame.hit(360,116).value,MoreGame.hit(360,40).value,MoreGame.hit(360,240).value,MoreGame.hit(360,20).value]''')
            self.assertEqual(hits,[20,60,40,50,0])
            p.evaluate('''()=>{const s=MoreGame.getState();s.remaining[0]=32;s.start=50;s.thrown=1;MoreGame.throwDart(360,116);}''')
            self.assertEqual(self.state(p)['remaining'][0],50);self.assertEqual(self.state(p)['turn'],2)
            p.evaluate('''()=>{MoreGame.newGame();const order=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];for(let i=0;i<40&&['ready','playing'].includes(MoreGame.snapshot().phase);i++){const s=MoreGame.snapshot(),left=s.remaining[s.turn-1];let base,mult,r;if(left===50){MoreGame.throwDart(360,240);continue;}if(left>62){base=20;mult=3;r=123;}else if(left<=40&&left%2===0){base=left/2;mult=2;r=200;}else{base=left%2?1:20;mult=1;r=155;}const a=order.indexOf(base)*Math.PI/10;MoreGame.throwDart(360+Math.sin(a)*r,240-Math.cos(a)*r);}}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertIn(0,self.state(p)['remaining'])

    def test_helicopter_actual_key_controller_completes_corridor(self):
        with self.page('helicopter') as p:
            result=p.evaluate('''()=>{MoreGame.begin();for(let i=0;i<2000&&MoreGame.snapshot().phase==='playing';i++){const s=MoreGame.getState(),d=s.distance+150,target=240+Math.sin(d/270)*90+Math.sin(d/660)*30,desired=Math.max(-120,Math.min(120,(target-s.y)*3));document.dispatchEvent(new KeyboardEvent(s.vy>desired?'keydown':'keyup',{key:'ArrowUp',bubbles:true}));MoreGame.advance(.02);}return MoreGame.snapshot();}''')
            self.assertEqual(result['phase'],'won',result);self.assertGreaterEqual(result['distance'],2500)

    def test_tower_defense_actual_economy_building_five_waves_and_win(self):
        with self.page('tower-defense') as p:
            result=p.evaluate('''()=>{const s=MoreGame.getState();for(const slot of[1,3,5]){s.selected=slot;if(!MoreGame.build(0))throw Error('Initial tower blocked');}for(let i=0;i<5000&&MoreGame.snapshot().phase==='playing';i++){if(!s.spawning&&!s.enemies.length)MoreGame.wave();if(s.gold>=50&&s.towers.length<9){s.selected=[0,2,4,6,7,8].find(k=>!s.towers.some(t=>t.plot===k));if(s.selected!==undefined)MoreGame.build(0);}MoreGame.advance(.2);}return MoreGame.snapshot();}''')
            self.assertEqual(result['phase'],'won',result);self.assertEqual(result['wave'],5);self.assertGreater(result['lives'],0);self.assertGreater(len(result['towers']),3)

    def test_fishing_bite_window_and_reel_controller_catches_five_fish(self):
        with self.page('fishing') as p:
            result=p.evaluate('''()=>{for(let fish=0;fish<5;fish++){if(!MoreGame.cast())throw Error('Cast blocked');MoreGame.advance(MoreGame.getState().biteAt+.1);if(!MoreGame.hook())throw Error('Hook missed');for(let k=0;k<1400&&MoreGame.getState().mode==='fight';k++){const s=MoreGame.getState(),pulling=Math.sin(s.time*2.1)>.45,reel=!pulling&&s.tension<75;document.dispatchEvent(new KeyboardEvent(reel?'keydown':'keyup',{key:'ArrowUp',bubbles:true}));MoreGame.advance(.05);}document.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowUp',bubbles:true}));}return MoreGame.snapshot();}''')
            self.assertEqual(result['phase'],'won',result);self.assertEqual(result['caught'],5);self.assertEqual(result['misses'],0)

    def test_skiing_actual_steering_finishes_twenty_gate_course(self):
        with self.page('skiing') as p:
            result=p.evaluate('''()=>{MoreGame.begin();for(let k=0;k<2000&&MoreGame.snapshot().phase==='playing';k++){const s=MoreGame.getState(),g=s.gates.find(g=>!g.done),target=g?g.x:240,desired=Math.max(-190,Math.min(190,(target-s.x)*4)),dir=s.vx<desired-20?'ArrowRight':s.vx>desired+20?'ArrowLeft':null;for(const key of['ArrowLeft','ArrowRight'])document.dispatchEvent(new KeyboardEvent(key===dir?'keydown':'keyup',{key,bubbles:true}));MoreGame.advance(.02);}return MoreGame.snapshot();}''')
            self.assertEqual(result['phase'],'won',result);self.assertGreaterEqual(result['passed'],16)

    def test_volleyball_contact_net_reflection_and_full_score(self):
        with self.page('volleyball') as p:
            data=p.evaluate('''()=>{const b={x:170,y:365,vx:0,vy:150};const contact=MoreGame.collide(b,{x:170,y:395,vy:0});MoreGame.begin();const s=MoreGame.getState();s.wait=0;s.ball={x:349,y:340,vx:120,vy:30};MoreGame.advance(.01);return{contact,vy:b.vy,net:s.ball.vx};}''')
            self.assertTrue(data['contact']);self.assertLess(data['vy'],0);self.assertLess(data['net'],0)
            p.evaluate('''()=>{const s=MoreGame.getState();for(let k=0;k<7;k++){s.wait=0;s.ball={x:650,y:434,vx:0,vy:200};MoreGame.advance(.02);}}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(self.state(p)['scores'][0],7)

    def test_every_new_arcade_freezes_simulation_and_held_controls_on_pause(self):
        for game in ARCADE:
            with self.subTest(game=game),self.page(game,clock=True) as p:
                p.evaluate('MoreGame.begin();MoreGame.advance(.1)');p.evaluate('SpinnerGame.pause()');before=self.state(p)
                p.evaluate('MoreGame.advance(1)');p.keyboard.press('Space');p.keyboard.press('ArrowLeft');p.clock.run_for(1000)
                self.assertEqual(self.state(p),before)

    def test_arcade_slider_restart_resets_visible_controls_and_pause_disables_them(self):
        for game,label,field,expected in [('artillery','Kąt','angle',45),('curling','Siła','power',390),('bowling','Kierunek rzutu','aim',0)]:
            with self.subTest(game=game),self.page(game) as p:
                control=p.get_by_label(label,exact=True)
                control.fill(control.get_attribute('max'))
                self.assertNotEqual(self.state(p)[field],expected)
                p.locator('#more-new').click()
                self.assertEqual(self.state(p)[field],expected);expect(control).to_have_value(str(expected))
                p.locator('#more-pause').click();expect(control).to_be_disabled()
                p.locator('#more-resume').click();expect(control).to_be_enabled()

    def test_typing_real_input_accuracy_completion_and_pause(self):
        with self.page('typing',clock=True) as p:
            target=self.state(p)['text'];field=p.get_by_label('Przepisz tekst',exact=True)
            field.fill('X'+target[1:10]);self.assertEqual(p.evaluate('MoreGame.metrics().accuracy'),90)
            p.locator('#more-pause').click();expect(field).to_be_disabled();before=self.state(p);p.clock.run_for(1000);self.assertEqual(self.state(p),before)
            p.locator('#more-resume').click();field.fill(target);self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(p.evaluate('MoreGame.metrics().accuracy'),100)

if __name__=='__main__':unittest.main(verbosity=2)
