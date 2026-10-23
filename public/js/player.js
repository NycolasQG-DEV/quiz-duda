const sock=io(),tok=localStorage.tok||(localStorage.tok=Math.random().toString(36).slice(2)+Date.now()),L='ABCD';
let me=JSON.parse(localStorage.me||'null'),photo=null,stream=null,pt;
const crop=(el,w,h)=>{const c=document.createElement('canvas');c.width=c.height=220;const s=Math.min(w,h);c.getContext('2d').drawImage(el,(w-s)/2,(h-s)/2,s,s,0,0,220,220);return c.toDataURL('image/jpeg',.75)};
const chk=()=>$('#ok').disabled=!(photo&&$('#name').value.trim());
const SVG_CAM='<svg viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="14"><rect x="1" y="3" width="18" height="12" rx="2.5" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="9" r="3.5" stroke="currentColor" stroke-width="1.5"/><path d="M7 3V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const SVG_RETRY='<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M3 10a7 7 0 1 0 1.5-4.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M1 5.5 4.5 10 8 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SVG_OK='<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="46" height="46"><circle cx="18" cy="18" r="15" fill="#1b8a43" fill-opacity="0.16" stroke="#1b8a43" stroke-width="2.8"/><path d="M11 18.5l5 5 10-10.5" stroke="#1b8a43" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SVG_FAIL='<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="46" height="46"><circle cx="18" cy="18" r="15" fill="#a8171c" fill-opacity="0.16" stroke="#a8171c" stroke-width="2.8"/><path d="M12 12l12 12M24 12l-12 12" stroke="#a8171c" stroke-width="3" stroke-linecap="round"/></svg>';
const SVG_TIME='<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="46" height="46"><circle cx="18" cy="18" r="15" fill="#cf6a35" fill-opacity="0.16" stroke="#cf6a35" stroke-width="2.8"/><path d="M18 10v8.5l5 3.5" stroke="#cf6a35" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const setP=u=>{photo=u;$('#prev').src=u||'';$('#prev').hidden=!u;$('#vid').hidden=!!u||!stream;$('#snap').innerHTML=u?`${SVG_RETRY} Refazer foto`:`${SVG_CAM} Tirar foto`;chk();if(u)SFX.sparkle()};
navigator.mediaDevices&&navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}}).then(s=>{stream=s;$('#vid').srcObject=s}).catch(()=>$('#vid').hidden=true);
$('#snap').onclick=()=>photo?setP(null):stream?setP(crop($('#vid'),$('#vid').videoWidth,$('#vid').videoHeight)):$('#file').click();
$('#file').onchange=e=>{const i=new Image();i.onload=()=>setP(crop(i,i.width,i.height));i.src=URL.createObjectURL(e.target.files[0])};
$('#name').oninput=chk;
$('#ok').onclick=()=>{me={name:$('#name').value.trim(),photo};localStorage.me=JSON.stringify(me);sock.emit('join',{tok,...me})};
sock.on('connect',()=>me?sock.emit('join',{tok,...me}):show('#join'));
sock.on('joined',()=>{const cur=$('.screen.on');if(cur&&cur.id!=='join')return;$('#me').src=me.photo;T($('#hi'),`Oi, ${me.name}!`);show('#wait');SFX.joined()});

sock.on('question',d=>{
  $('#qn').textContent=`Pergunta ${d.i+1} de ${d.total}`;
  $('#qt').textContent=d.text;
  $('#st').hidden=true;
  const t=$('.tm i');t.style.animation='none';t.offsetWidth;t.style.animation=`tm ${d.time}s linear forwards`;
  $('#opts').innerHTML=d.opts.map((o,i)=>`<button class="opt o${i}" style="--i:${i}" data-i="${i}"><b>${L[i]}</b>${esc(o)}</button>`).join('');
  show('#q');
  SFX.go();
  let s=d.time;clearInterval(pt);pt=setInterval(()=>{s--;if(s>0&&s<=5&&!$('.opt.sel'))SFX.tick(s,true);if(s<=0)clearInterval(pt)},1000);
});
$('#opts').onclick=e=>{const b=e.target.closest('.opt');if(!b||$('.opt.sel'))return;
  b.classList.add('sel');$$('#opts .opt').forEach(x=>x!==b&&x.classList.add('dim'));SFX.select();
  if(!isMob){const[x,y]=mid(b);spray(x,y,8,{spread:110,cherries:.3});}
  $('#st').textContent='Resposta enviada! Aguarde...';$('#st').hidden=false;sock.emit('answer',+b.dataset.i)};

sock.on('me',d=>{
  clearInterval(pt);
  const r=$('#res'),e=$('#re'),prev=d.score-d.gain;
  r.classList.toggle('ok',d.ok);r.classList.toggle('bad',!d.ok);
  e.innerHTML=d.answered?(d.ok?SVG_OK:SVG_FAIL):SVG_TIME;e.style.animation='none';e.offsetWidth;e.style.animation='';
  T($('#rt'),d.answered?(d.ok?'Acertou!':'Errou…'):'Tempo esgotado');
  $('#rp').textContent='+0 pts';$('#rs').textContent=`Total: ${prev} pontos`;$('#rm').textContent=(d.rank?`${d.rank}º lugar — `:'')+d.msg;
  show('#res');
  setTimeout(()=>{
    if(!d.answered)SFX.timeout();else if(d.ok){SFX.correct();flash('rgba(232,84,106,.9)')}else{SFX.wrong();shake($('#res .pts'));shake($('#rt'))}
  },380);
  // soma de pontos: +N sobe, cerejinhas voam até o total e o total sobe
  setTimeout(()=>{
    const rp=$('#rp'),rs=$('#rs');
    if(d.gain<=0){rs.textContent=`Total: ${d.score} pontos`;return}
    scoreUp(rp,0,d.gain,{ms:1100,pre:'+',suf:' pts',fx:()=>{const[x,y]=mid(rp);spray(x,y,1,{spread:70,cherries:.2})},done:()=>{
      const[x,y]=mid(rp);floatText(rp,'+'+d.gain);spray(x,y,16,{spread:200});
      flyTo(rp,rs,9,()=>{});
      setTimeout(()=>scoreUp(rs,prev,d.score,{ms:900,pre:'Total: ',suf:' pontos',silent:true}),650);
    }});
  },1400);
});

sock.on('count',onCount);
sock.on('finale',()=>{T($('#it'),'Olhe para o telão!');$('#me2').src=me.photo;show('#info')});
sock.on('final',d=>{T($('#it'),d.rank===1?'VOCE VENCEU!':`Voce ficou em ${d.rank}o lugar com ${d.score} pontos!`);if(d.rank===1){confetti();SFX.winner()}else SFX.finalOther()});
sock.on('reset',()=>location.reload());
