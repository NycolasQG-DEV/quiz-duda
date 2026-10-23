const sock=io(),L='ABCD',
  SVG_GOLD='<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="20" r="11" fill="#d4a017" stroke="#fff" stroke-width="1.5"/><path d="M11 8V4h10v4l-5 4-5-4Z" fill="#d4a017" stroke="#fff" stroke-width="1.5"/><text x="16" y="25" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="900" font-size="11" fill="#fff">1</text></svg>',
  SVG_SILVER='<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="20" r="11" fill="#9aa5b4" stroke="#fff" stroke-width="1.5"/><path d="M11 8V4h10v4l-5 4-5-4Z" fill="#9aa5b4" stroke="#fff" stroke-width="1.5"/><text x="16" y="25" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="900" font-size="11" fill="#fff">2</text></svg>',
  SVG_BRONZE='<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="20" r="11" fill="#b87333" stroke="#fff" stroke-width="1.5"/><path d="M11 8V4h10v4l-5 4-5-4Z" fill="#b87333" stroke="#fff" stroke-width="1.5"/><text x="16" y="25" text-anchor="middle" font-family="Montserrat,sans-serif" font-weight="900" font-size="11" fill="#fff">3</text></svg>',
  SVG_CROWN='<svg viewBox="0 0 40 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 26L6 10l8 8L20 2l6 16 8-8 4 16H2Z" fill="#d4a017" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><circle cx="20" cy="2" r="2.5" fill="#fff"/><circle cx="6" cy="10" r="2" fill="#fff"/><circle cx="34" cy="10" r="2" fill="#fff"/></svg>',
  MED=['',SVG_GOLD,SVG_SILVER,SVG_BRONZE],H=[0,240,180,130],seen=new Set();
let qtext='',opts=[],qn='',tmr,lastN=0,lobbyInit=true,podShown=false;
$('#url').textContent=location.host;
SFX.scene('lobby');
sock.on('connect',()=>sock.emit('watch'));
const mk=el=>el.innerHTML=[2,1,3].map(n=>`<div class="slot s${n}"><div class="who"></div><div class="bar">${MED[n]}</div></div>`).join('');
mk($('#pod'));mk($('#fpod'));
const slot=(r,n)=>$(`${r} .s${n}`);
const optHtml=(o,i,x='')=>`<div class="opt o${i}" style="--i:${i}"><b>${L[i]}</b>${esc(o)}${x}</div>`;

// preenche um lugar do pódio; "from" = pontuação antes desta pergunta (a soma sobe até o total)
// animate=true → pop de entrada; animate=false → só atualiza pontuação suavemente
function fill(sl,p,h,from=0,gain=0,animate=true){
  const w=sl.querySelector('.who');
  if(animate){
    w.innerHTML=p?`<img class="av" src="${p.photo}"><b>${esc(p.name)}</b><em>${from} pts</em>`:'';
    w.classList.remove('pop');w.offsetWidth;w.classList.add('pop');
  } else if(p){
    // atualiza apenas o score sem re-render completo
    const existing=w.querySelector('em');
    if(existing) existing.textContent=from+' pts';
  }
  sl.querySelector('.bar').style.height=h+'px';
  if(p){
    const em=w.querySelector('em');
    const delay=animate?700:200;
    setTimeout(()=>{
      scoreUp(em,from,p.score,{ms:1500,suf:' pts',silent:true});
      if(gain>0){floatText(em,'+'+gain);sl.classList.add('gained');setTimeout(()=>sl.classList.remove('gained'),2000);}
    },delay);
  }
}

sock.on('lobby',d=>{
  count($('#cnt'),d.count,500);
  let fresh=0;
  $('#ppl').innerHTML=d.players.map(p=>{const n=!seen.has(p.name);if(n)fresh++;seen.add(p.name);return`<div class="chip${n?' pop':''}"><img class="av sm" src="${p.photo}">${esc(p.name)}</div>`}).join('');
  if(fresh&&!lobbyInit)SFX.join();lobbyInit=false;
  if(!$('.screen.on'))show('#lobby');
});

sock.on('question',d=>{
  qtext=d.text;opts=d.opts;qn=`Pergunta ${d.i+1} de ${d.total}`;
  $('#qn').textContent=qn;T($('#qt'),d.text);$('#opts').innerHTML=d.opts.map((o,i)=>optHtml(o,i)).join('');$('#ans').textContent='Aguardando respostas…';lastN=0;
  const r=$('#qs .r1'),ring=$('#qs .ring');r.style.animation='none';r.getBoundingClientRect();r.style.animation=`rg ${d.time}s linear forwards`;ring.classList.remove('hot');
  let s=d.time;$('#sec2').textContent=s;clearInterval(tmr);
  tmr=setInterval(()=>{s--;$('#sec2').textContent=Math.max(s,0);if(s<=5)ring.classList.add('hot');if(s>0)SFX.tick(s);if(s<=0)clearInterval(tmr)},1000);
  show('#qs');SFX.scene('question');SFX.go();
  for(let i=0;i<4;i++)setTimeout(()=>SFX.optIn(i),420+i*120);
});

sock.on('answered',d=>{$('#ans').textContent=`${d.n} de ${d.t} já responderam`;if(d.n>lastN)SFX.blip();lastN=d.n});

sock.on('reveal',d=>{
  clearInterval(tmr);$('#rqn').textContent=qn;T($('#rt'),qtext);
  $('#ropts').innerHTML=opts.map((o,i)=>optHtml(o,i,`<small>${d.counts[i]}</small>`)).join('');
  [$('#ropts'),$('#rt'),$('#rqn')].forEach(e=>{e.hidden=false;e.classList.remove('fgone')});
  $('#pod').hidden=$('#ptitle').hidden=$('#secret').hidden=true;show('#rv');
  SFX.scene(null);setTimeout(()=>SFX.suspense(2.0),350);               // suspense antes da resposta
  setTimeout(()=>{                                                      // momento da verdade
    const bs=$$('#ropts .opt');bs.forEach((b,i)=>b.classList.add(i===d.a?'right':'wrong'));
    const[x,y]=mid(bs[d.a]);flash('rgba(232,84,106,.9)');shake($('#ropts'));SFX.reveal();SFX.fall();spray(x,y,26,{spread:320});SFX.scene('reveal');
  },2200);
  setTimeout(()=>{[$('#ropts'),$('#rt'),$('#rqn')].forEach(e=>e.classList.add('fgone'));SFX.whoosh()},4600);
  setTimeout(()=>{
    [$('#ropts'),$('#rt'),$('#rqn')].forEach(e=>e.hidden=true);
    if(!d.show){$('#secret').hidden=false;SFX.secret();return}
    const pod=$('#pod'),ptitle=$('#ptitle');
    ptitle.hidden=false;
    SFX.podium();
    if(!podShown){
      // Primeira vez: entra com animação dramática
      podShown=true;
      pod.hidden=false;
      pod.classList.remove('pod-update');
      setTimeout(()=>{const m=d.top[0]&&d.top[0].score||1;
        [3,2,1].forEach((n,k)=>setTimeout(()=>{
          const p=d.top[n-1];
          fill(slot('#pod',n),p,70+170*(p?p.score/m:0),p?p.score-(p.gain||0):0,p?p.gain||0:0,true);
          if(p)SFX.rise(n);if(n===1&&p)SFX.pointRoll(1.5);
        },k*380));
      },150);
    } else {
      // Próximas vezes: fade-in suave, só anima quem pontuou
      pod.hidden=false;
      pod.classList.add('pod-update');
      setTimeout(()=>{const m=d.top[0]&&d.top[0].score||1;
        [3,2,1].forEach((n,k)=>setTimeout(()=>{
          const p=d.top[n-1],gain=p?p.gain||0:0;
          const sl=slot('#pod',n);
          // rebuild who se mudou de pessoa ou se ainda não tem conteúdo
          const curName=sl.querySelector('.who b');
          const changed=!curName||(p&&curName.textContent!==p.name)||(!p&&curName);
          fill(sl,p,70+170*(p?p.score/m:0),p?p.score-(p.gain||0):0,gain,changed);
          if(p&&gain>0)SFX.rise(n);
          if(n===1&&p&&gain>0)SFX.pointRoll(1.2);
        },k*200));
      },100);
    }
  },5300);
});

sock.on('count',onCount);

sock.on('finale',()=>{
  const f=$('#fin');document.body.classList.add('dark');f.classList.remove('winner','susp');$('#ft').textContent='';
  [1,2,3].forEach(n=>{const s=slot('#fpod',n);s.className=`slot s${n} hid`;s.querySelector('.who').innerHTML='';s.querySelector('.bar').style.height=H[n]+'px'});
  f.classList.add('open');show('#fin');setTimeout(()=>f.classList.remove('open'),800);SFX.scene('finale');
});

sock.on('fstep',d=>{
  const f=$('#fin');f.classList.add('susp');T($('#ft'),'Rufem os tambores...');
  const wait=d.step===1?3500:2800;SFX.drumroll(wait/1000);
  setTimeout(()=>{
    f.classList.remove('susp');$$('#fpod .slot').forEach(s=>s.classList.remove('lit'));
    if(d.step<4){
      const n=[0,3,2,1][d.step],s=slot('#fpod',n);if(d.step===1){f.classList.add('open');SFX.curtain()}
      s.classList.remove('hid');s.classList.add('lit');fill(s,d.top[n-1],H[n]);T($('#ft'),`${n}º lugar`);
      SFX.place(n);flash('rgba(248,180,190,.85)');const[x,y]=mid(s.querySelector('.bar'));spray(x,y-60,22,{spread:260});
    }else{
      slot('#fpod',2).classList.add('gone');slot('#fpod',3).classList.add('gone');
      const w=slot('#fpod',1);w.classList.add('win','lit');w.querySelector('.who').insertAdjacentHTML('afterbegin',`<span class="crown">${SVG_CROWN}</span>`);
      f.classList.add('winner');T($('#ft'),`${d.top[0].name} é a grande vencedora!`);confetti();
      SFX.winner();SFX.scene('win');flash('rgba(232,84,106,.95)');
    }
  },wait);
});
sock.on('reset',()=>location.reload());
