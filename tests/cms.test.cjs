const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const {createCMS,validateValues,decodeImage} = require('../cms');
const {defaults} = require('../js/cms-schema');

test('CMS validates editable values and rejects executable URLs and images',()=>{
  const edited=validateValues({...defaults,'page.greeting':'Hello, Pilot!','color.accent':'#112233'});
  assert.equal(edited['page.greeting'],'Hello, Pilot!');
  assert.throws(()=>validateValues({...defaults,'links.signup':'javascript:alert(1)'}));
  assert.throws(()=>validateValues({...defaults,'media.brand':'assets/../../secret'}));
  assert.throws(()=>validateValues({...defaults,'color.accent':'red;display:none'}));
  assert.throws(()=>validateValues({...defaults,'page.email':'invalid'}));
  const svg=text=>'data:image/svg+xml;base64,'+Buffer.from(text).toString('base64');
  assert.equal(decodeImage(svg('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10z"/></svg>')).extension,'svg');
  assert.throws(()=>decodeImage(svg('<svg onload="alert(1)"></svg>')));
  assert.throws(()=>decodeImage(svg('<svg><script>alert(1)</script></svg>')));
  assert.throws(()=>decodeImage('data:image/png;base64,'+Buffer.from('not an image').toString('base64')));
});

test('CMS authenticates, persists edits, rejects conflicting saves, and uploads images',async t=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'aviator-cms-test-'));
  const app=express();app.use('/api/cms',createCMS({directory,uploadDirectory:path.join(directory,'uploads'),isAuthenticated:req=>req.headers.authorization==='test-session',ephemeral:false}));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>{server.close();fs.rmSync(directory,{recursive:true,force:true});});
  const base=`http://127.0.0.1:${server.address().port}/api/cms`;
  const headers={'Content-Type':'application/json',Authorization:'test-session'};
  const initial=await (await fetch(base+'/content')).json();assert.equal(initial.revision,0);
  const denied=await fetch(base+'/content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(initial)});assert.equal(denied.status,401);
  const crossOrigin=await fetch(base+'/content',{method:'PUT',headers:{...headers,Origin:'https://unrelated.example'},body:JSON.stringify(initial)});assert.equal(crossOrigin.status,403);
  const values={...defaults,'page.greeting':'CMS test greeting','win.title':'Saved popup','media.brand':'assets/new-logo.svg','avatar.0':'assets/avatar.png','color.accent':'#123456','policy.privacy.body':'First paragraph.\n\nSecond paragraph.'};
  const save=await fetch(base+'/content',{method:'PUT',headers,body:JSON.stringify({revision:0,values})});assert.equal(save.status,200);
  const saved=await save.json();assert.equal(saved.revision,1);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory,'site-content.json'))).values,values);
  const loaded=await (await fetch(base+'/content')).json();assert.equal(loaded.values['win.title'],'Saved popup');
  const conflict=await fetch(base+'/content',{method:'PUT',headers,body:JSON.stringify({revision:0,values})});assert.equal(conflict.status,409);
  const bootstrap=await (await fetch(base+'/bootstrap.js')).text();assert.match(bootstrap,/CMS test greeting/);
  const dataURL='data:image/svg+xml;base64,'+Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="4"/></svg>').toString('base64');
  const upload=await fetch(base+'/media',{method:'POST',headers,body:JSON.stringify({dataURL})});assert.equal(upload.status,201);
  const asset=await upload.json();assert.ok(fs.existsSync(path.join(directory,'uploads',path.basename(asset.url))));
});

test('Temporary deployments do not pretend CMS saves are durable',async t=>{
  const app=express();app.use(createCMS({isAuthenticated:()=>true,ephemeral:true}));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));t.after(()=>server.close());
  const res=await fetch(`http://127.0.0.1:${server.address().port}/content`,{method:'PUT',headers:{Authorization:'Basic '+Buffer.from('admin:test').toString('base64')}});
  assert.equal(res.status,503);
});
