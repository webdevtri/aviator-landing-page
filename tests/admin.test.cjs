const {test}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const {ActivityStore}=require('../activity-store');
const {createVisitorAPI}=require('../visitor-api');
const {createCMS}=require('../cms');

test('Named accounts hash passwords, revoke old sessions on password change, and expire sessions',()=>{
  let now=1000;const store=new ActivityStore(':memory:',()=>now);
  try{
    store.addAdmin('admin','first-password-123');
    assert.ok(!store.db.prepare('SELECT password_hash FROM admin_users').get().password_hash.includes('first-password'));
    assert.equal(store.verifyAdmin('wrong','first-password-123'),false);
    assert.equal(store.verifyAdmin('admin','wrong'),false);
    assert.throws(()=>store.addAdmin('ADMIN','second-password-123'),/already exists/);
    assert.throws(()=>store.addAdmin('new','short'),/12/);
    const session=store.login('admin');
    assert.throws(()=>store.changePassword('admin','wrong','next-password-123'),/incorrect/);
    assert.equal(store.isAdmin(session),true);
    store.changePassword('admin','first-password-123','next-password-123');
    assert.equal(store.isAdmin(session),false);
    assert.equal(store.verifyAdmin('admin','first-password-123'),false);
    assert.equal(store.verifyAdmin('admin','next-password-123'),true);
    const next=store.login('admin');now+=12*3600000;assert.equal(store.isAdmin(next),false);
  }finally{store.close();}
});

test('CMS requires session login; admins can add accounts and change passwords without exposing credentials',async t=>{
  const store=new ActivityStore(':memory:');store.addAdmin('admin','first-password-123');
  const api=createVisitorAPI(store,{ephemeral:false}),app=express();app.use('/api',api.router);app.use('/api/cms',createCMS({isAuthenticated:api.isAdmin}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>{server.close();store.close();});
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const post=(route,body,cookie='',extra={})=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie,...extra},body:JSON.stringify(body)});
  const cookieOf=res=>res.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
  assert.equal((await (await fetch(base+'/cms/access')).json()).canEdit,false);
  assert.equal((await fetch(base+'/cms/content',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Basic '+Buffer.from('admin:first-password-123').toString('base64')},body:'{}'})).status,401);
  assert.equal((await post('/admin/users',{username:'rogue',password:'first-password-123'})).status,401);
  assert.equal((await post('/admin/login',{username:'wrong',password:'first-password-123'})).status,401);
  const login=await post('/admin/login',{username:'admin',password:'first-password-123'});assert.equal(login.status,200);
  assert.match(login.headers.getSetCookie().join(' '),/HttpOnly/);const cookie=cookieOf(login);
  assert.equal((await (await fetch(base+'/cms/access',{headers:{Cookie:cookie}})).json()).canEdit,true);
  assert.equal((await post('/admin/users',{username:'editor',password:'editor-password-123'},cookie,{Origin:'https://unrelated.example'})).status,403);
  assert.equal((await post('/admin/users',{username:'editor',password:'editor-password-123'},cookie)).status,201);
  assert.equal((await post('/admin/login',{username:'editor',password:'editor-password-123'})).status,200);
  const changed=await post('/admin/password',{currentPassword:'first-password-123',newPassword:'next-password-123'},cookie);assert.equal(changed.status,200);
  assert.equal((await (await fetch(base+'/admin/session',{headers:{Cookie:cookie}})).json()).isAdmin,false);
  const renewed=cookieOf(changed);assert.equal((await (await fetch(base+'/admin/session',{headers:{Cookie:renewed}})).json()).username,'admin');
  assert.equal((await post('/admin/login',{username:'admin',password:'first-password-123'})).status,401);
  assert.equal((await post('/admin/login',{username:'admin',password:'next-password-123'})).status,200);
  assert.ok(!JSON.stringify(store.recent()).includes('password-123'));
  await post('/admin/logout',{},renewed);
  assert.equal((await (await fetch(base+'/admin/session',{headers:{Cookie:renewed}})).json()).isAdmin,false);
});

test('Repeated login failures are throttled until the window expires',async t=>{
  let now=1000;const store=new ActivityStore(':memory:',()=>now);store.addAdmin('admin','first-password-123');
  const app=express();app.use(createVisitorAPI(store,{ephemeral:false}).router);
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>{server.close();store.close();});
  const login=password=>fetch(`http://127.0.0.1:${server.address().port}/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password})});
  for(let i=0;i<10;i++)assert.equal((await login('incorrect')).status,401);
  assert.equal((await login('first-password-123')).status,429);
  now+=15*60000;assert.equal((await login('first-password-123')).status,200);
});
