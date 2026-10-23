const crypto=require('crypto'),path=require('path');
const PASS=process.env.ADMIN_PASSWORD||'duda16',tokens=new Set();
const view=f=>path.join(__dirname,'../views',f);
const ok=c=>{const m=(c||'').match(/(?:^|; )adm=([a-f0-9]+)/);return !!m&&tokens.has(m[1])};
exports.PASS=PASS;exports.ok=ok;
exports.page=(q,s)=>s.sendFile(view(ok(q.headers.cookie)?'admin.html':'login.html'));
exports.login=(q,s)=>{
  if(q.body.password===PASS){const t=crypto.randomBytes(16).toString('hex');tokens.add(t);s.setHeader('Set-Cookie',`adm=${t}; Path=/; HttpOnly`);return s.redirect('/admin');}
  s.redirect('/admin?erro=1');
};
