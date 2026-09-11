const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const express=require('express');
const {ActivityStore}=require('../activity-store');
const {createVisitorAPI}=require('../visitor-api');
const {validateValues}=require('../cms');
const {defaults}=require('../js/cms-schema');

test('Refresh, cookie clearing, parallel tabs and server restarts do not grant more attempts',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'aviator-activity-'));const file=path.join(directory,'activity.sqlite');
  let now=100000;let store=new ActivityStore(file,()=>now,()=>({'flight.firstMin':'1.1','flight.firstMax':'1.1'}));
  try {
    const first=store.identity('192.0.2.1');
    assert.throws(()=>store.start(first,false,2,100,'INR'),/changed/);
    const flight1=store.start(first,false,1,100,'INR');assert.equal(flight1.attemptNumber,1);
    assert.equal(store.state(store.identity('192.0.2.1',first.visitor)).remaining,1);
    assert.throws(()=>store.start(store.identity('192.0.2.1'),false,1,100,'INR'),/in progress/);
    now=flight1.endsAt+1;store.close();store=new ActivityStore(file,()=>now);
    const fresh=store.identity('192.0.2.1');assert.equal(fresh.subject,first.subject);
    assert.throws(()=>store.start(fresh,false,1,100,'INR'),/changed/);
    const flight2=store.start(fresh,false,2,100,'INR');assert.equal(flight2.attemptNumber,2);
    now+=1000;const receipt=store.cashout(fresh,flight2.sessionToken,false);assert.ok(receipt.amount>100);
    assert.deepEqual(store.cashout(fresh,flight2.sessionToken,false),receipt);
    now=flight2.endsAt+1;assert.equal(store.state(fresh).wonSecond,true);
    assert.throws(()=>store.start(store.identity('192.0.2.1'),false,1,100,'INR'),/used/);
    assert.equal(store.state(store.identity('192.0.2.2',fresh.visitor)).remaining,0);
    assert.ok(store.recent().some(e=>e.type==='cashout'));
  } finally {store.close();if(path.dirname(directory)!==os.tmpdir())throw new Error('Unexpected test directory');fs.rmSync(directory,{recursive:true,force:true});}
});

test('Cashout uses server time and per-flight CMS snapshots; admins may replay indefinitely',()=>{
  let now=1000,config={'flight.firstMin':'2','flight.firstMax':'2','flight.secondMin':'8','flight.secondMax':'8','flight.growthRate':'0.5'};
  const store=new ActivityStore(':memory:',()=>now,()=>config);const who=store.identity('192.0.2.3');
  try{
    const flight=store.start(who,false,1,50,'USD');assert.equal(flight.targetMultiplier,2);assert.equal(flight.growthRate,0.5);
    config={...config,'flight.growthRate':'1','flight.secondMin':'9','flight.secondMax':'9'};
    now+=500;assert.ok(Math.abs(store.cashout(who,flight.sessionToken,false).multiplier-Math.exp(0.25))<1e-9);
    assert.throws(()=>store.cashout(store.identity('192.0.2.4'),flight.sessionToken,false),/not found/);
    now=flight.endsAt+1;const next=store.start(who,false,2,50,'USD');assert.equal(next.targetMultiplier,9);assert.equal(next.growthRate,1);
    now=next.endsAt+1;assert.throws(()=>store.cashout(who,next.sessionToken,false),/flown away/);
    for(let i=0;i<6;i++){const round=store.start(who,true,1,100,'INR');now=round.endsAt+1;}
    assert.equal(store.state(who,true).isAdmin,true);assert.equal(store.state(who,false).remaining,0);
    store.addAdmin('admin','test-password-123');const token=store.login('admin');assert.equal(store.isAdmin(token),true);store.logout(token);assert.equal(store.isAdmin(token),false);
  } finally{store.close();}
});

test('Admin privilege is server authenticated, activity private, and public limits cannot be spoofed',async t=>{
  const store=new ActivityStore(':memory:');store.addAdmin('admin','test-password-123');const app=express();app.use('/api',createVisitorAPI(store,{ephemeral:false}).router);
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));t.after(()=>{server.close();store.close();});
  const base=`http://127.0.0.1:${server.address().port}/api`;
  assert.equal((await fetch(base+'/admin/activity')).status,401);
  assert.equal((await fetch(base+'/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
  const login=await fetch(base+'/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'test-password-123'})});
  assert.equal(login.status,200);const cookie=login.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
  assert.equal((await (await fetch(base+'/visitor/state',{headers:{Cookie:cookie}})).json()).isAdmin,true);
  assert.equal((await fetch(base+'/admin/activity',{headers:{Cookie:cookie}})).status,200);
  const spoof=await (await fetch(base+'/visitor/state',{headers:{Cookie:'k9_admin=fake','X-Forwarded-For':'8.8.8.8'}})).json();assert.equal(spoof.isAdmin,false);
});

test('CMS validates multiplier ranges and responsive clearance',()=>{
  assert.throws(()=>validateValues({...defaults,'flight.firstMin':'5','flight.firstMax':'2'}),/Minimum/);
  assert.throws(()=>validateValues({...defaults,'flight.growthRate':'0'}));
  assert.throws(()=>validateValues({...defaults,'responsive.bottomInset':'999'}));
  assert.equal(validateValues({...defaults,'responsive.bottomInset':'48'})['responsive.bottomInset'],'48');
});

test('Neither local nor forwarded requests have a password-free admin shortcut',async t=>{
  const store=new ActivityStore(':memory:');const app=express();app.use(createVisitorAPI(store,{password:'',ephemeral:false}).router);
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));t.after(()=>{server.close();store.close();});
  const response=await fetch(`http://127.0.0.1:${server.address().port}/admin/login`,{method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':'192.0.2.20'},body:'{}'});
  assert.equal(response.status,401);
  assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
});
