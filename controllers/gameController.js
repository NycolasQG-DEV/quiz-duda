const Q=require('../models/questions'),Game=require('../models/game'),TIME=Game.TIME;
module.exports=io=>{
  const game=new Game(),R=()=>io.to('admin').to('screen');let timer,cool=0;
  const pub=p=>({name:p.name,photo:p.photo,score:p.score});
  const names=()=>[...game.players.values()].map(p=>p.name);
  const state=()=>{
    const q=game.q,ph=game.phase,last=game.i===Q.length-1;
    const btn=ph==='lobby'?'Iniciar quiz':ph==='question'?'Encerrar pergunta agora'
      :ph==='reveal'?(last?'Ir para o resultado final':'Próxima pergunta')
      :ph==='finale'?['Revelar o 3º lugar','Revelar o 2º lugar','Revelar a vencedora',''][game.fin]:'';
    io.to('admin').emit('state',{phase:ph,i:game.i,total:Q.length,count:game.players.size,answered:game.answered(),
      q:q?q.q:'',ans:q?q.o[q.a]:'',btn,cool:Math.max(0,cool-Date.now()),names:names()});
  };
  const lobby=()=>{R().emit('lobby',{count:game.players.size,players:[...game.players.values()].map(p=>({name:p.name,photo:p.photo}))});state()};
  const gap=(r,k)=>k===0?(r[1]?`Você lidera, ${r[0].score-r[1].score} pontos à frente de ${r[1].name}!`:'Você lidera!')
    :k<3?`Você está a ${r[k-1].score-r[k].score} pontos de alcançar ${r[k-1].name}!`
    :`Você está quase lá! Só ${r[2].score-r[k].score} pontos abaixo do 3º lugar.`;
  const startQ=i=>{
    game.begin(i);const q=game.q;
    io.emit('question',{i,total:Q.length,text:q.q,opts:q.o,time:TIME});
    clearTimeout(timer);timer=setTimeout(reveal,TIME*1000+400);state();
  };
  const reveal=()=>{
    if(game.phase!=='question')return;
    clearTimeout(timer);game.phase='reveal';
    const r=game.ranking(),last=game.i===Q.length-1,show=Q.length-1-game.i>=2,counts=[0,0,0,0];
    r.forEach(p=>p.ans!==null&&counts[p.ans]++);
    io.emit('reveal',{a:game.q.a,counts,show,last,top:show?r.slice(0,3).map(p=>({...pub(p),gain:p.gain})):[]});
    r.forEach((p,k)=>io.to(p.sid).emit('me',{ok:p.ok,gain:p.gain,score:p.score,answered:p.ans!==null,rank:show?k+1:null,msg:show?gap(r,k):'O ranking está em segredo…'}));
    state();
  };
  const countdown=()=>{
    game.phase='countdown';state();let n=3;
    const t=()=>{if(!n)return startQ(game.i+1);io.emit('count',n--);timer=setTimeout(t,1000)};t();
  };
  const finale=()=>{game.phase='finale';game.fin=0;io.emit('finale');state()};
  io.on('connection',sock=>{
    if(sock.data.admin){
      sock.join('admin');state();
      sock.on('admin:next',()=>{
        const ph=game.phase;
        if(ph==='lobby'){if(game.players.size)startQ(0)}
        else if(ph==='question')reveal();
        else if(ph==='reveal')game.i===Q.length-1?finale():countdown();
        else if(ph==='finale'&&game.fin<3&&Date.now()>=cool){
          game.fin++;cool=Date.now()+(game.fin===1?4300:3600);const r=game.ranking();
          io.to('screen').emit('fstep',{step:game.fin,top:r.slice(0,3).map(pub)});
          if(game.fin===3)r.forEach((p,k)=>io.to(p.sid).emit('final',{rank:k+1,score:p.score}));
          state();
        }
      });
      sock.on('admin:reset',()=>{clearTimeout(timer);cool=0;game.reset();io.emit('reset')});
    }
    sock.on('watch',()=>{sock.join('screen');lobby()});
    sock.on('join',d=>{
      if(!d||typeof d.tok!=='string'||typeof d.photo!=='string'||!d.photo.startsWith('data:image/'))return;
      game.join(d.tok,String(d.name||'Convidado').slice(0,20),d.photo,sock.id);
      sock.data.token=d.tok;sock.emit('joined');lobby();
    });
    sock.on('answer',c=>{
      if(!game.answer(sock.data.token,c))return;
      R().emit('answered',{n:game.answered(),t:game.players.size});state();
      if(game.allAnswered()){clearTimeout(timer);timer=setTimeout(reveal,900)}
    });
    sock.on('disconnect',()=>{
      const p=game.players.get(sock.data.token);
      if(game.phase==='lobby'&&p&&p.sid===sock.id){game.players.delete(sock.data.token);lobby()}
    });
  });
};
