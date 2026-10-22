"""Gameplay checks for the 30 additional local implementations."""
from pathlib import Path
import json
import math
import unittest
from playwright.sync_api import expect
from test_more_games import MoreGames

INFO=json.loads((Path(__file__).resolve().parents[1]/'docs/new30-info.json').read_text())
IDS=[g['id'] for g in INFO]

class ThirtyGames(MoreGames):
    def state(self,p):return p.evaluate('MoreGame.snapshot()')
    def local(self,p):p.get_by_label('RYWAL',exact=True).select_option('local',force=True)

    def test_catalog_exactly_thirty_additions_distinct_local_assets(self):
        with self.page() as p:
            games=p.evaluate('SpinnerGames')
            self.assertEqual(len(games),60);self.assertEqual(len({g['id'] for g in games}),60)
            self.assertEqual([g['id'] for g in games[30:]],IDS)
            expect(p.locator('.game-card')).to_have_count(60)
            p.get_by_role('button',name='Na główkowanie',exact=True).click();expect(p.locator('.game-card')).to_have_count(40)
            p.locator('#game-search').fill('futoshiki');expect(p.locator('.game-card')).to_have_count(1)
            p.locator('#game-search').fill('mniejsze');expect(p.locator('.game-card')).to_have_count(1)

    def test_every_new_engine_loads_pauses_without_reset_and_restarts(self):
        for game in IDS:
            with self.subTest(game=game),self.page(game,width=390) as p:
                p.wait_for_function('document.body.dataset.viewportReady&&window.MoreGame')
                p.evaluate('SpinnerGame.pause();SpinnerGame.pause()');before=self.state(p)
                self.assertEqual(before['phase'],'paused')
                p.keyboard.press('1');p.keyboard.press('ArrowLeft');p.wait_for_timeout(65)
                self.assertEqual(self.state(p),before)
                p.locator('#more-resume').click();self.assertEqual(self.state(p)['phase'],'ready')
                p.locator('#more-new').click();self.assertEqual(self.state(p)['phase'],'ready')
                self.assertEqual(p.evaluate('Object.keys(localStorage).filter(k=>k.startsWith("spinner:prefs:"))'),[])

    def test_checkers_compulsory_capture_promotion_chain_and_full_match(self):
        with self.page('checkers') as p:
            data=p.evaluate('''()=>{const r=MoreGame.rules;let b=Array(64).fill(0);b[42]=1;b[35]=-1;b[21]=-1;const s={board:b,turn:1,forced:-1,quiet:0},a=r.apply(s,42*64+28);b=Array(64).fill(0);b[10]=1;b[3]=-1;return{legal:r.legal(s),chain:a,next:r.legal(a),promotion:r.apply({board:b,turn:1,forced:-1,quiet:0},10*64+1)};}''')
            self.assertEqual(data['legal'],[42*64+28]);self.assertEqual(data['chain']['turn'],1)
            self.assertEqual(data['next'],[28*64+14]);self.assertEqual(data['promotion']['board'][1],2)
            self.local(p)
            result=p.evaluate('''()=>{let n=0;while(['ready','playing'].includes(MoreGame.snapshot().phase)&&n++<1200){const s=MoreGame.snapshot();MoreGame.move(MoreGame.choose(s,1));}return MoreGame.snapshot();}''')
            self.assertIn(result['phase'],['won','lost']);self.assertLessEqual(sum(v!=0 for v in result['board']),24)

    def test_hex_both_connection_directions_and_complete_game(self):
        with self.page('hex') as p:
            self.assertEqual(p.evaluate('''()=>{const a=Array(49).fill(0),b=Array(49).fill(0);for(let i=0;i<7;i++){a[21+i]=1;b[i*7+3]=2;}return[MoreGame.distance(a,1),MoreGame.distance(b,2)];}'''),[0,0])
            self.local(p);p.evaluate('''()=>{for(let i=0;i<49&&MoreGame.snapshot().phase!=='won';i++)MoreGame.move(i);}''')
            s=self.state(p);self.assertEqual(s['phase'],'won');self.assertIn(p.evaluate('MoreGame.rules.result(MoreGame.snapshot())'),[1,2])

    def test_morris_mills_removal_placement_and_finite_complete_match(self):
        with self.page('morris') as p:
            result=p.evaluate('''()=>{const r=MoreGame.rules,b=Array(24).fill(0);b[0]=b[1]=1;b[8]=b[9]=b[10]=2;b[14]=2;const s=r.apply({board:b,left:[7,5],turn:1,remove:false,quiet:0},2);return{state:s,remove:r.legal(s),millCount:MoreGame.mills.length};}''')
            self.assertTrue(result['state']['remove']);self.assertEqual(result['remove'],[1014]);self.assertEqual(result['millCount'],16)
            self.local(p)
            result=p.evaluate('''()=>{for(let i=0;i<800&&['ready','playing'].includes(MoreGame.snapshot().phase);i++)MoreGame.move(MoreGame.choose(MoreGame.snapshot(),1));return MoreGame.snapshot();}''')
            self.assertEqual(result['phase'],'won')

    def test_nim_computer_leaves_zero_xor_and_complete_local_round(self):
        with self.page('nim') as p:
            result=p.evaluate('''()=>{const s=MoreGame.snapshot(),m=MoreGame.choose(s,2);return MoreGame.rules.apply(s,m).board.reduce((a,b)=>a^b,0);}''')
            self.assertEqual(result,0);self.local(p)
            p.evaluate('''()=>{for(let i=0;i<15&&MoreGame.snapshot().phase!=='won';i++)MoreGame.move(MoreGame.rules.legal(MoreGame.snapshot())[0]);}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(self.state(p)['board'],[0,0,0])

    def test_chomp_cut_is_monotone_poison_loses_and_full_round(self):
        with self.page('chomp') as p:
            result=p.evaluate('''()=>{const r=MoreGame.rules,s=r.initial();return{cut:r.apply(s,2*8+3),poison:r.result(r.apply(s,0))};}''')
            self.assertEqual(result['cut']['board'],[8,8,3,3,3,3]);self.assertEqual(result['poison'],2)
            self.local(p);p.evaluate('MoreGame.move(0)');self.assertEqual(self.state(p)['phase'],'won')
            expect(p.locator('#more-result-text')).to_contain_text('gracz II')

    def test_amazons_three_stage_action_creates_one_block_and_complete_game(self):
        with self.page('amazons') as p:
            self.local(p)
            result=p.evaluate('''()=>{let s=MoreGame.snapshot(),m=MoreGame.rules.legal(s)[0];MoreGame.move(m);const first=MoreGame.snapshot();for(let i=0;i<36&&MoreGame.snapshot().phase!=='won';i++)MoreGame.move(MoreGame.rules.legal(MoreGame.snapshot())[0]);return{first,last:MoreGame.snapshot()};}''')
            self.assertEqual(result['first']['board'].count(3),1);self.assertEqual(result['first']['board'].count(1),2)
            self.assertEqual(result['last']['phase'],'won')

    def test_battleships_fleets_do_not_touch_and_twelve_hits_win(self):
        with self.page('battleships') as p:
            s=self.state(p)
            for fleet in [s['own'],s['enemy']]:
                self.assertEqual(sorted(map(len,fleet)),[2,3,3,4]);self.assertEqual(len(set(sum(fleet,[]))),12)
                for i,a in enumerate(fleet):
                    for b in fleet[:i]:
                        self.assertTrue(all(max(abs(x//8-y//8),abs(x%8-y%8))>1 for x in a for y in b))
            p.evaluate('''()=>{const cells=MoreGame.snapshot().enemy.flat();for(const i of cells){MoreGame.fire(i);if(MoreGame.snapshot().phase==='won')break;MoreGame.cpu();}}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(len(self.state(p)['shots']),12)

    def test_domino_twenty_eight_tiles_conserved_and_valid_chain_through_full_round(self):
        with self.page('domino') as p:
            data=p.evaluate('''()=>{const audit=[];for(let k=0;k<300&&['ready','playing'].includes(MoreGame.snapshot().phase);k++){const s=MoreGame.snapshot();audit.push(s);if(s.busy){MoreGame.cpu();continue;}const legal=MoreGame.available(0);if(!legal.length){MoreGame.draw();continue;}const i=legal[0],tile=s.hands[0][i],side=!s.chain.length||tile.includes(s.chain.at(-1)[1])?'right':'left';MoreGame.play(i,side);}return{audit,last:MoreGame.snapshot()};}''')
            self.assertIn(data['last']['phase'],['won','lost'])
            for s in data['audit']:
                tiles=s['stock']+s['hands'][0]+s['hands'][1]+s['chain']
                self.assertEqual(len(tiles),28);self.assertEqual(len({tuple(sorted(t)) for t in tiles}),28)
                self.assertTrue(all(a[1]==b[0] for a,b in zip(s['chain'],s['chain'][1:])))

    def test_cards_deal_has_fifty_two_unique_cards_and_draw_undo(self):
        for game in ['solitaire','freecell']:
            with self.subTest(game=game),self.page(game) as p:
                s=self.state(p);cards=[v['card'] for col in s['columns'] for v in col]+s['stock']+s['waste']
                self.assertEqual(sorted(cards),list(range(52)))
                if game=='solitaire':
                    self.assertEqual([len(col) for col in s['columns']],list(range(1,8)))
                    p.evaluate('MoreGame.draw();MoreGame.undo()');self.assertEqual(self.state(p)['stock'],s['stock'])
                else:self.assertEqual(sorted(map(len,s['columns'])),[6,6,6,6,7,7,7,7])

    def test_solitaire_and_freecell_legal_foundation_moves_complete_all_suits(self):
        for game in ['solitaire','freecell']:
            with self.subTest(game=game),self.page(game) as p:
                p.evaluate('''(mode)=>{const s=MoreGame.getState();s.found=Array.from({length:4},(_,suit)=>Array.from({length:suit?13:12},(_,i)=>suit*13+i));s.columns=Array.from({length:mode==='freecell'?8:7},()=>[]);s.stock=[];s.waste=[];s.free=[null,null,null,null];if(mode==='freecell'){s.free[0]=12;MoreGame.move({type:'free',col:0},{type:'found',col:0});}else{s.columns[0]=[{card:12,up:true}];MoreGame.move({type:'col',col:0,index:0},{type:'found',col:0});}}''',game)
                self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(sum(map(len,self.state(p)['found'])),52)

    def test_freecell_sequence_capacity_and_klondike_empty_column_rule(self):
        with self.page('freecell') as p:
            result=p.evaluate('''()=>{const s=MoreGame.getState();s.columns=Array.from({length:8},()=>[{card:8,up:true}]);s.columns[0]=[{card:4,up:true},{card:16,up:true}];s.columns[1]=[{card:18,up:true}];s.free=[0,1,2,3];const no=MoreGame.legalMove({type:'col',col:0,index:0},{type:'col',col:1});s.free[0]=null;const yes=MoreGame.legalMove({type:'col',col:0,index:0},{type:'col',col:1});return{no,yes};}''')
            self.assertEqual(result,{'no':False,'yes':True})
        with self.page('solitaire') as p:
            result=p.evaluate('''()=>{const s=MoreGame.getState();s.columns[0]=[{card:5,up:true}];s.columns[1]=[];const a=MoreGame.legalMove({type:'col',col:0,index:0},{type:'col',col:1});s.columns[0]=[{card:12,up:true}];return[a,MoreGame.legalMove({type:'col',col:0,index:0},{type:'col',col:1})];}''')
            self.assertEqual(result,[False,True])

    def test_golf_full_thirty_five_card_sequence_and_no_ace_king_wrap(self):
        with self.page('golf') as p:
            result=p.evaluate('''()=>{const s=MoreGame.getState(),ranks=[2,3,4,5,6,7,8,9,10,11,12,13,12,11,10,9,8,7,6,5,4,3,2,1,2,3,4,5,6,7,8,9,10,11,12],used={1:1};s.base=0;s.columns=Array.from({length:7},()=>[]);const cards=ranks.map(r=>{const n=used[r]||0;used[r]=n+1;return n*13+r-1;});for(let i=cards.length-1;i>=0;i--)s.columns[i%7].push(cards[i]);s.stock=Array.from({length:52},(_,i)=>i).filter(i=>i!==0&&!cards.includes(i));for(let i=0;i<cards.length;i++)if(!MoreGame.move(i%7))throw Error('Legal golf move rejected');return MoreGame.snapshot();}''')
            self.assertEqual(result['phase'],'won');self.assertEqual(result['removed'],35)

    def test_dice_duplicate_straights_full_house_bonus_and_thirteen_rounds(self):
        with self.page('dice') as p:
            result=p.evaluate('''()=>({full:MoreGame.score([2,2,3,3,3],8),notFull:MoreGame.score([4,4,4,4,4],8),small:MoreGame.score([1,2,2,3,4],9),large:MoreGame.score([2,3,4,5,6],10),five:MoreGame.score([6,6,6,6,6],11)})''')
            self.assertEqual(result,{'full':25,'notFull':0,'small':30,'large':40,'five':50})
            p.evaluate('''()=>{for(let i=0;i<13;i++){MoreGame.roll();MoreGame.choose(i);}}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertTrue(all(v is not None for v in self.state(p)['scores']))

    def test_takuzu_generated_constraints_and_complete_round(self):
        with self.page('takuzu') as p:
            for _ in range(5):
                s=self.state(p)
                rows=[s['solution'][i:i+6] for i in range(0,36,6)];cols=list(map(list,zip(*rows)))
                for lines in [rows,cols]:
                    self.assertEqual(len({tuple(r) for r in lines}),6)
                    for row in lines:self.assertEqual(sum(row),3);self.assertFalse(any(row[i]==row[i+1]==row[i+2] for i in range(4)))
                p.evaluate('MoreGame.newGame()')
            p.evaluate('''()=>{const s=MoreGame.snapshot();for(let i=0;i<36;i++)if(!s.fixed[i]){MoreGame.choose(i);MoreGame.enter(s.solution[i]);}}''')
            self.assertEqual(self.state(p)['phase'],'won')

    def test_three_latin_puzzles_givens_constraints_and_complete_rounds(self):
        for game in ['futoshiki','skyscrapers','cages']:
            with self.subTest(game=game),self.page(game) as p:
                s=self.state(p);n=4 if game=='cages' else 5;rows=[s['solution'][i:i+n] for i in range(0,n*n,n)]
                for row in rows+list(map(list,zip(*rows))):self.assertEqual(sorted(row),list(range(1,n+1)))
                if game=='futoshiki':self.assertTrue(all((s['solution'][e['a']]<s['solution'][e['b']])==e['less'] for e in s['inequalities']))
                if game=='cages':self.assertEqual(sorted(i for cage in s['cages'] for i in cage['cells']),list(range(16)))
                if game=='skyscrapers':
                    def seen(row):return sum(v>max(row[:i],default=0) for i,v in enumerate(row))
                    self.assertEqual([seen(row) for row in rows],s['clues']['left'])
                    self.assertEqual([seen(row[::-1]) for row in rows],s['clues']['right'])
                p.evaluate('''()=>{const s=MoreGame.snapshot();for(let i=0;i<s.board.length;i++)if(!s.fixed[i]){MoreGame.choose(i);MoreGame.enter(s.solution[i]);}}''')
                self.assertEqual(self.state(p)['phase'],'won')

    def test_shikaku_rectangles_cover_board_without_overlap_and_undo(self):
        with self.page('shikaku') as p:
            s=self.state(p);covered=[]
            for rect in s['solution']:
                cells=[(rect['r']+r)*6+rect['c']+c for r in range(rect['h']) for c in range(rect['w'])]
                labels=[s['clues'][i] for i in cells if s['clues'][i]];self.assertEqual(labels,[len(cells)]);covered+=cells
            self.assertEqual(sorted(covered),list(range(36)))
            p.evaluate('''()=>{for(const r of MoreGame.snapshot().solution)MoreGame.place(r.r*6+r.c,(r.r+r.h-1)*6+r.c+r.w-1);}''')
            self.assertEqual(self.state(p)['phase'],'won');p.get_by_role('button',name='Cofnij',exact=True).click();self.assertEqual(self.state(p)['phase'],'playing')

    def test_bridges_counts_connected_solution_and_complete_round(self):
        with self.page('bridges') as p:
            s=self.state(p);self.assertTrue(p.evaluate('MoreGame.connected(MoreGame.snapshot().solution)'))
            self.assertEqual(p.evaluate('MoreGame.degree(MoreGame.snapshot().solution)'),s['clues'])
            p.evaluate('''()=>{for(const[i,n]of MoreGame.snapshot().solution.entries())for(let k=0;k<n;k++)MoreGame.toggle(i);}''')
            self.assertEqual(self.state(p)['phase'],'won')

    def test_loop_is_one_cycle_not_disjoint_cycles_and_complete_round(self):
        with self.page('loop') as p:
            self.assertTrue(p.evaluate('MoreGame.valid(MoreGame.snapshot().solution)'))
            self.assertFalse(p.evaluate('MoreGame.valid(Array(60).fill(false))'))
            p.evaluate('''()=>{for(const[i,v]of MoreGame.snapshot().solution.entries())if(v)MoreGame.toggle(i);}''')
            self.assertEqual(self.state(p)['phase'],'won')

    def test_untangle_rejects_stacked_nodes_and_completes_certified_planar_graph(self):
        with self.page('untangle') as p:
            self.assertGreater(self.state(p)['points'].__len__(),0)
            self.assertGreater(p.evaluate('MoreGame.crossings(Array.from({length:9},()=>({x:300,y:200}))).count'),0)
            self.assertEqual(p.evaluate('MoreGame.crossings(MoreGame.snapshot().solution).count'),0)
            p.evaluate('''()=>{for(const[i,v]of MoreGame.snapshot().solution.entries())MoreGame.move(i,v.x,v.y);}''')
            self.assertEqual(self.state(p)['phase'],'won')

    def test_invaders_bullet_collisions_clear_all_three_waves(self):
        with self.page('invaders') as p:
            result=p.evaluate('''()=>{MoreGame.begin();const s=MoreGame.getState();for(let i=0;i<100&&MoreGame.snapshot().phase==='playing';i++){const e=s.enemies[0];s.bullets.push({x:e.x+s.offset,y:e.y+s.drop+1});MoreGame.advance(1/120);}return MoreGame.snapshot();}''')
            self.assertEqual(result['phase'],'won');self.assertEqual(result['wave'],3);self.assertEqual(result['score'],2100)

    def test_crossing_immediate_hop_traffic_logs_and_three_distinct_goals(self):
        with self.page('crossing') as p:
            p.locator('.gv-input button').first.click();self.assertEqual(self.state(p)['row'],7)
            result=p.evaluate('''()=>{const s=MoreGame.getState();s.row=7;s.x=s.lanes[0].objects[0]+40;MoreGame.advance(.01);return MoreGame.snapshot();}''')
            self.assertEqual(result['lives'],2);self.assertEqual(result['row'],8)
            p.evaluate('''()=>{const s=MoreGame.getState();for(const x of[125,275,475]){s.row=1;s.x=x;s.cooldown=0;MoreGame.hop(0,-1);}}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(len(self.state(p)['goals']),3)

    def test_racer_lanes_collisions_fuel_and_finish_line(self):
        with self.page('racer') as p:
            p.keyboard.press('ArrowLeft');self.assertEqual(self.state(p)['lane'],0)
            result=p.evaluate('''()=>{const s=MoreGame.getState();s.objects=[{lane:0,y:395,kind:'car'}];MoreGame.advance(.01);s.objects=[{lane:0,y:395,kind:'fuel'}];MoreGame.advance(.01);return MoreGame.snapshot();}''')
            self.assertEqual(result['lives'],2);self.assertGreater(result['fuel'],95)
            p.evaluate('MoreGame.getState().distance=2999;MoreGame.getState().objects=[];MoreGame.advance(.02)')
            self.assertEqual(self.state(p)['phase'],'won')

    def test_platformer_real_jump_buffer_key_collection_and_three_exits(self):
        with self.page('platformer') as p:
            p.keyboard.press('Space');p.evaluate('MoreGame.advance(.1)');self.assertLess(self.state(p)['player']['y'],408)
            p.evaluate('''()=>{const s=MoreGame.getState();for(let stage=0;stage<3;stage++){for(const k of s.keys){s.player.x=k.x-12;s.player.y=k.y-16;s.player.vy=0;MoreGame.advance(.001);}s.player.x=665;s.player.y=408;s.player.vy=0;MoreGame.advance(.001);}}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(self.state(p)['level'],3)
            for level in p.evaluate('MoreGame.levels'):
                self.assertTrue(all(w<=212 for _,w in level['spikes']))

    def test_lander_safe_thresholds_crash_and_three_landings(self):
        with self.page('lander') as p:
            p.evaluate('''()=>{MoreGame.begin();const s=MoreGame.getState(),pad=MoreGame.pads[0];Object.assign(s.ship,{x:pad.x+pad.w/2,y:pad.y-13.1,vx:0,vy:8,angle:.4});MoreGame.advance(.03);}''')
            self.assertEqual(self.state(p)['lives'],2)
            p.evaluate('''()=>{const s=MoreGame.getState();for(let i=0;i<3;i++){const pad=MoreGame.pads[s.level-1];Object.assign(s.ship,{x:pad.x+pad.w/2,y:pad.y-13.1,vx:0,vy:5,angle:0});MoreGame.advance(.03);}}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertEqual(self.state(p)['level'],3)

    def test_pinball_bumper_impulse_and_three_drained_balls(self):
        with self.page('pinball') as p:
            result=p.evaluate('''()=>{MoreGame.launch();const s=MoreGame.getState();Object.assign(s.ball,{x:140,y:120,vx:0,vy:120});MoreGame.advance(.01);return MoreGame.snapshot();}''')
            self.assertGreaterEqual(result['score'],25);self.assertLess(result['ball']['vy'],0)
            p.evaluate('''()=>{const s=MoreGame.getState();for(let i=0;i<3;i++){MoreGame.launch();Object.assign(s.ball,{y:710,vy:100});MoreGame.advance(.01);}}''')
            self.assertEqual(self.state(p)['phase'],'lost');self.assertEqual(self.state(p)['balls'],0)

    def test_archery_independent_ballistic_aim_completes_ten_shots(self):
        with self.page('archery') as p:
            result=p.evaluate('''()=>{MoreGame.begin();for(let shot=0;shot<10;shot++){const s=MoreGame.getState();let best=null;for(let power=500;power<=650;power+=5)for(let degrees=20;degrees<=65;degrees++){const angle=degrees*Math.PI/180,vx=power*Math.cos(angle),a=s.wind*2.5,disc=vx*vx+2*a*598;if(disc<=0)continue;const t=Math.abs(a)<.001?598/vx:(-vx+Math.sqrt(disc))/a;if(t<=0||t>4)continue;const y=370-power*Math.sin(angle)*t+210*t*t,target=210+Math.sin((s.time+t)*.8)*95,error=Math.abs(y-target);if(!best||error<best.error)best={error,power,degrees,t};}if(!best)throw Error('No ballistic path');s.angle=best.degrees;s.power=best.power;MoreGame.shoot();MoreGame.advance(best.t+.1);}return MoreGame.snapshot();}''')
            self.assertEqual(result['phase'],'won');self.assertEqual(result['shots'],10);self.assertGreaterEqual(result['hits'],9);self.assertGreater(result['score'],50)

    def test_billiards_equal_mass_impulse_six_pockets_and_completion(self):
        with self.page('billiards') as p:
            data=p.evaluate('''()=>{const a={x:100,y:100,vx:100,vy:0},b={x:119,y:100,vx:0,vy:0};MoreGame.collide(a,b);return{a,b};}''')
            self.assertAlmostEqual(data['a']['vx']+data['b']['vx'],100);self.assertGreater(data['b']['vx'],90)
            p.evaluate('''()=>{MoreGame.begin();const s=MoreGame.getState();for(let i=1;i<7;i++){const[x,y]=MoreGame.pockets[i-1];Object.assign(s.balls[i],{x,y,vx:0,vy:0});}s.moving=true;MoreGame.advance(.01);}''')
            self.assertEqual(self.state(p)['phase'],'won');self.assertTrue(all(not b['active'] for b in self.state(p)['balls'][1:]))

    def test_rhythm_all_notes_timed_through_real_clock_and_keyboard(self):
        with self.page('rhythm',clock=True) as p:
            p.evaluate('MoreGame.begin()');notes=self.state(p)['notes']
            for i,note in enumerate(notes):
                delta=max(0,note['at']-self.state(p)['elapsed'])
                p.clock.run_for(delta)
                if i<4:p.keyboard.press('dfjk'[note['lane']])
                else:p.evaluate('(lane)=>MoreGame.hit(lane)',note['lane'])
            p.clock.run_for(4000);s=self.state(p)
            self.assertEqual(s['phase'],'won');self.assertEqual(s['hits'],len(notes));self.assertEqual(s['misses'],0)

    def test_balance_real_physics_controller_reaches_all_eight_targets(self):
        with self.page('balance') as p:
            result=p.evaluate('''()=>{MoreGame.begin();let time=0;for(let i=0;i<2400&&MoreGame.snapshot().phase==='playing';i++){const s=MoreGame.getState(),target=MoreGame.targets[s.collected],acc=1.4*(target-s.position)-2.6*s.velocity,desired=Math.asin(Math.max(-.3,Math.min(.3,(acc+.45*s.velocity)/260))),direction=s.angle<desired-.008?'ArrowRight':s.angle>desired+.008?'ArrowLeft':null;for(const k of['ArrowLeft','ArrowRight'])document.dispatchEvent(new KeyboardEvent(k===direction?'keydown':'keyup',{key:k,bubbles:true}));MoreGame.advance(.025);time+=.025;}return{state:MoreGame.snapshot(),time};}''')
            self.assertEqual(result['state']['phase'],'won',result);self.assertLessEqual(result['time'],60)

    def test_canvas_inputs_cancel_on_pause_and_all_states_freeze(self):
        for game in ['invaders','crossing','racer','platformer','lander','pinball','archery','billiards','rhythm','balance']:
            with self.subTest(game=game),self.page(game,clock=True) as p:
                p.evaluate('MoreGame.begin()');p.keyboard.down('ArrowLeft');p.clock.run_for(80);p.evaluate('SpinnerGame.pause()');before=self.state(p)
                p.clock.run_for(2000);self.assertEqual(self.state(p),before)
                p.keyboard.up('ArrowLeft');p.locator('#more-resume').click();self.assertEqual(self.state(p)['phase'],'playing')

    def test_held_touch_repeat_is_cancelled_by_pause_before_release(self):
        with self.page('crossing',width=390,clock=True) as p:
            p.evaluate('MoreGame.getState().lanes=[]')
            button=p.locator('.gv-input button').first;box=button.bounding_box()
            p.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);p.mouse.down()
            self.assertEqual(self.state(p)['row'],7)
            p.evaluate('SpinnerGame.pause()');p.clock.run_for(500)
            p.locator('#more-resume').evaluate('(button)=>button.click()');p.clock.run_for(800)
            self.assertEqual(self.state(p)['row'],7)
            p.mouse.up()

    def test_two_touch_controls_can_be_held_together(self):
        with self.page('pinball',width=390) as p:
            p.wait_for_function('document.body.dataset.viewportReady')
            left=p.locator('[data-key="left"]').bounding_box();right=p.locator('[data-key="right"]').bounding_box()
            client=p.context.new_cdp_session(p)
            touches=[{'x':r['x']+r['width']/2,'y':r['y']+r['height']/2,'id':i+1} for i,r in enumerate([left,right])]
            client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':touches})
            p.evaluate('MoreGame.advance(.1)');s=self.state(p)
            self.assertLess(s['left'],-.4);self.assertGreater(s['right'],math.pi+.4)
            p.evaluate('SpinnerGame.pause()')
            client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
            p.locator('#more-resume').click();p.evaluate('MoreGame.advance(.1)');s=self.state(p)
            self.assertAlmostEqual(s['left'],.3);self.assertAlmostEqual(s['right'],math.pi-.3)

if __name__=='__main__':unittest.main(verbosity=2)
