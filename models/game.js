const Q=require('./questions');
class Game{
  static TIME=20;
  constructor(){this.reset()}
  reset(){this.players=new Map();this.phase='lobby';this.i=-1;this.t0=0;this.fin=0}
  get q(){return Q[this.i]}
  join(token,name,photo,sid){
    let p=this.players.get(token);
    if(!p){p={token,score:0,ans:null,gain:0,ok:false};this.players.set(token,p)}
    Object.assign(p,{name,photo,sid});return p;
  }
  begin(i){this.i=i;this.phase='question';this.t0=Date.now();this.players.forEach(p=>{p.ans=null;p.gain=0;p.ok=false})}
  // pontos: 1000 (instantâneo) até 500 (no limite do tempo) se acertar
  answer(token,c){
    const p=this.players.get(token);
    if(!p||this.phase!=='question'||p.ans!==null||!(c>=0&&c<4))return false;
    const dt=Date.now()-this.t0;if(dt>Game.TIME*1000+500)return false;
    p.ans=c;p.ok=c===this.q.a;p.gain=p.ok?Math.round(1000*(1-dt/(Game.TIME*1000)/2)):0;p.score+=p.gain;return true;
  }
  answered(){return [...this.players.values()].filter(p=>p.ans!==null).length}
  allAnswered(){return this.players.size>0&&this.answered()===this.players.size}
  ranking(){return [...this.players.values()].sort((a,b)=>b.score-a.score)}
}
module.exports=Game;
