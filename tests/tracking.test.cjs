const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {containerId}=require('../js/gtm-config');
const {validateValues}=require('../cms');
const {defaults,fields}=require('../js/cms-schema');
test('GTM settings accept IDs or installation snippets and save only one validated ID',()=>{
  assert.equal(containerId(''),'');
  assert.equal(containerId('GTM-ABC1234'),'GTM-ABC1234');
  const snippet='<script src="https://www.googletagmanager.com/gtm.js?id=GTM-ABC1234"></script>';
  assert.equal(validateValues({...defaults,'tracking.gtmCode':snippet})['tracking.gtmCode'],'GTM-ABC1234');
  assert.throws(()=>containerId('<script>alert(1)</script>'));
  assert.throws(()=>containerId(snippet+' GTM-XYZ5678'));
  const link=fields.find(f=>f.key==='links.signup');assert.equal(link.group,'Popups');assert.equal(link.type,'url');
});
test('GTM loads once on configured landing pages and stays disabled in previews or with no ID',()=>{
  const source=fs.readFileSync(require.resolve('../js/tracking.js'),'utf8');
  function page(value,preview=false,search=''){
    const scripts=[];const window={CMSContent:{'tracking.gtmCode':value}};window.parent=preview?{}:window;
    const document={getElementById:id=>scripts.find(s=>s.id===id),createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}};
    const context={window,document,location:{search},URLSearchParams,GTMConfig:{containerId},Date,encodeURIComponent};
    vm.runInNewContext(source,context);vm.runInNewContext(source,context);return {scripts,window};
  }
  const active=page('GTM-ABC1234');assert.equal(active.scripts.length,1);assert.equal(active.scripts[0].src,'https://www.googletagmanager.com/gtm.js?id=GTM-ABC1234');assert.equal(active.window.dataLayer[0].event,'gtm.js');
  for(const args of [[''],['bad'],['GTM-ABC1234',true],['GTM-ABC1234',false,'?cms-preview=1']])assert.equal(page(...args).scripts.length,0);
});
