(() => {
  const $ = id => document.getElementById(id);
  const groups = [...new Set(CMSSchema.fields.map(f=>f.group))];
  const extraDescriptions={'Tracking':'Add your Google Tag Manager container. Save changes to load it on new landing-page visits. Tracking is disabled inside this editor preview.','Flight settings':'Set the random fly-away range for each round and the shared multiplier speed.','Responsive settings':'Keep content inside the visible screen, with extra clearance for device navigation controls.'};
  const descriptions = { 'Page text':'Set the voice of your landing page.', 'Game labels':'Edit game controls and the player feed. Placeholders keep live values working.', 'Popups':'Make the loss message and welcome offer your own.', 'Flight messages':'Randomized chatter and reactions at each cashout milestone.', 'Legal popups':'Edit each notice. Separate paragraphs with a blank line.', 'Help & tour':'Guide your visitors through the flight.', 'Images & avatars':'Upload logos, characters, or player avatars. PNG, JPEG, WebP and plain SVG; up to 6 MB.', 'Colors':'Tune the page, game, and popup palette.', 'Labels & accessibility':'Descriptions for images, controls, and assistive technology.' };
  let saved, draft, revision=0, group=groups[0], canEdit=false, busy=false, mobile=false, previewReady=false;
  let adminSession=false,activityTimer;
  const draftKey = 'kixo9-cms-draft-v1';
  const dirty = () => saved && JSON.stringify(draft)!==JSON.stringify(saved);
  function notice(message,error=false) { $('notice').hidden=!message; $('notice').textContent=message; $('notice').classList.toggle('error',error); }
  function status() {
    const changed = dirty();
    $('saveBtn').disabled=!changed||!canEdit||busy;
    $('saveState').textContent=busy?'Saving…':changed?'Unsaved changes':'All changes saved';
    if (draft) {
      try { if(changed) localStorage.setItem(draftKey,JSON.stringify({revision,values:draft})); else localStorage.removeItem(draftKey); } catch {}
    }
  }
  async function request(url, options={}) {
    const response = await fetch(url,{...options,credentials:'same-origin',cache:'no-store'});
    const data = await response.json();
    if(!response.ok) {if(response.status===401){canEdit=false;showSession(false);status();}throw new Error(data.error || 'The request failed.');}
    return data;
  }
  function preview() {
    if(previewReady && draft) $('sitePreview').contentWindow.postMessage({type:'cms-preview',values:draft,popup:$('previewMode').value},location.origin);
  }
  function setValue(field,value,row) { draft[field.key]=value;row?.classList.toggle('changed',value!==saved[field.key]);status();preview(); }
  function create(tag,attributes={},text) {
    const element=document.createElement(tag);
    for(const [key,value] of Object.entries(attributes)) element.setAttribute(key,value);
    if(text!==undefined)element.textContent=text;
    return element;
  }
  function renderNav() {
    $('sectionNav').replaceChildren(...groups.map((name,i)=>{
      const button=create('button',{'type':'button','class':name===group?'active':''});
      button.append(create('span',{},name),create('small',{},String(CMSSchema.fields.filter(f=>f.group===name).length)));
      button.onclick=()=>{group=name;$('search').value='';renderNav();renderFields();document.querySelector('.editor').scrollTop=0;};return button;
    }));
  }
  function renderFields() {
    const search=$('search').value.trim().toLowerCase();
    $('sectionTitle').textContent=search?'Search results':group;
    $('sectionIndex').textContent=String(groups.indexOf(group)+1).padStart(2,'0');
    $('sectionDescription').textContent=search?'Matching fields from every section.':descriptions[group]||extraDescriptions[group];
    const fields=CMSSchema.fields.filter(f=>search?(f.label+' '+f.group+' '+draft[f.key]).toLowerCase().includes(search):f.group===group);
    $('fields').replaceChildren();
    if(!fields.length)$('fields').append(create('p',{},'No matching fields. Try a different search.'));
    fields.forEach(field=>{
      const row=create('div',{class:'field'+(draft[field.key]!==saved[field.key]?' changed':'')});
      const id='field-'+field.key;const label=create('label',{for:id},field.label);row.append(label);
      const input=create(field.type==='textarea'?'textarea':'input',{id,name:field.key});
      if(field.type!=='textarea')input.type=field.type==='email'?'email':field.type==='number'?'number':field.type==='toggle'?'checkbox':'text';
      if(field.type==='number'){input.min=field.min;input.max=field.max;input.step=field.step||1;}
      input.value=draft[field.key];input.maxLength=field.type==='textarea'?16000:2000;
      if(field.type==='toggle')input.checked=draft[field.key]==='true';
      input.addEventListener('input',()=>setValue(field,field.type==='toggle'?String(input.checked):input.value,row));
      if(field.type==='color') {
        const picker=create('input',{type:'color','aria-label':field.label+' picker'});picker.value=draft[field.key];
        const pair=create('div',{class:'color-row'});pair.append(picker,input);row.append(pair);
        picker.oninput=()=>{input.value=picker.value;setValue(field,picker.value,row);};
        input.addEventListener('input',()=>{if(/^#[\da-f]{6}$/i.test(input.value))picker.value=input.value;});
      } else if(field.type==='image') {
        const swatch=create('div',{class:'image-swatch'});
        const drawImage=()=>{swatch.replaceChildren();if(input.value){const img=create('img',{src:input.value,alt:field.label+' preview'});img.onerror=()=>swatch.replaceChildren(create('span',{},'Image could not load'));swatch.append(img);}else swatch.append(create('span',{},'Original game icon'));};
        drawImage();input.addEventListener('change',drawImage);row.append(swatch,input);
        const actions=create('div',{class:'image-actions'}), uploadLabel=create('label',{class:'upload-label'},'Upload image');
        const file=create('input',{type:'file',accept:'image/png,image/jpeg,image/webp,image/svg+xml',hidden:''});uploadLabel.append(file);
        file.onchange=async()=>{
          const chosen=file.files[0];if(!chosen)return;
          if(chosen.size>6*1024*1024){notice('Choose an image smaller than 6 MB.',true);return;}
          uploadLabel.setAttribute('aria-busy','true');
          try {
            const dataURL=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(chosen);});
            const result=await request('/api/cms/media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataURL})});
            input.value=result.url;setValue(field,result.url,row);drawImage();notice('Image uploaded to your draft. Save changes to use it on the site.');
          } catch(error){notice(error.message,true);}finally{uploadLabel.removeAttribute('aria-busy');file.value='';}
        };
        const reset=create('button',{type:'button'},'Use original');reset.onclick=()=>{input.value=field.default;setValue(field,field.default,row);drawImage();};
        actions.append(uploadLabel,reset);row.append(actions);
      } else row.append(input);
      const placeholders=draft[field.key].match(/\{\w+\}/g);
      if(field.hint||placeholders)row.append(create('small',{},field.hint||'Keep '+placeholders.join(', ')+' for live values.'));
      if(search)row.append(create('small',{},field.group));
      $('fields').append(row);
    });
  }
  function sizePreview() {
    const area=$('previewArea'), width=mobile?375:1366,height=mobile?812:856;
    const scale=Math.min(area.clientWidth/width,area.clientHeight/height);
    $('previewFrame').style.width=width*scale+'px';$('previewFrame').style.height=height*scale+'px';
    Object.assign($('sitePreview').style,{width:width+'px',height:height+'px',transform:`scale(${scale})`});
  }
  function showSession(loggedIn,username='') {
    adminSession=loggedIn;
    $('loginPanel').hidden=loggedIn;
    document.querySelector('.studio-layout').hidden=!loggedIn;
    $('accessLabel').textContent=loggedIn?'Signed in as '+username:'Signed out';
    for(const id of ['adminSessionBtn','changePasswordBtn','addAdminBtn','activityBtn'])$(id).hidden=!loggedIn;
    if(!loggedIn){$('accountDialog').close();$('activityDialog').close();}
    else requestAnimationFrame(sizePreview);
  }
  async function access() {
    const state=await request('/api/cms/access');canEdit=state.canEdit&&state.persistent;
    if(!state.persistent)notice('This deployment has temporary storage. Saving requires a persistent Node server.',true);
    const session=await request('/api/admin/session');showSession(session.isAdmin,session.username);
    status();return state;
  }
  $('loginForm').onsubmit=async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{await request('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('username').value.trim(),password:$('password').value})});await access();$('password').value='';notice('Signed in. Unlimited admin replay is enabled.');$('reloadPreview').click();}catch(error){notice(error.message,true);}finally{button.disabled=false;}};
  $('fields').onsubmit=event=>event.preventDefault();
  $('saveBtn').onclick=async()=>{
    busy=true;status();
    const submitted={...draft};
    try {const result=await request('/api/cms/content',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision,values:submitted})});saved={...result.values};if(JSON.stringify(draft)===JSON.stringify(submitted))draft={...saved};revision=result.revision;notice('Changes saved. The landing page is updated.');renderFields();}
    catch(error){notice(error.message,true);}finally{busy=false;status();}
  };
  $('revertBtn').onclick=async()=>{try{const data=await request('/api/cms/content');revision=data.revision;saved={...CMSSchema.defaults,...data.values};draft={...saved};renderFields();status();preview();notice('Loaded the saved version.');}catch(error){notice(error.message,true);}};
  $('defaultsBtn').onclick=()=>{draft={...CMSSchema.defaults};renderFields();status();preview();notice('Original content loaded into your draft. Save to apply it, or discard this draft.');};
  $('exportBtn').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,values:draft},null,2)],{type:'application/json'}));const a=create('a',{href:url,download:'kixo9-content.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('importFile').onchange=async()=>{try{const file=$('importFile').files[0];if(!file)return;if(file.size>1024*1024)throw new Error('The JSON file is too large.');const parsed=JSON.parse(await file.text());const values=parsed.values||parsed;for(const field of CMSSchema.fields){if(values[field.key]!==undefined&&typeof values[field.key]!=='string')throw new Error('Imported values must be text.');}draft=Object.fromEntries(CMSSchema.fields.map(f=>[f.key,values[f.key]??draft[f.key]]));renderFields();status();preview();notice('Imported into your draft. Review and save to publish.');}catch(error){notice(error.message,true);}finally{$('importFile').value='';}};
  $('search').oninput=renderFields;$('previewMode').onchange=preview;
  $('adminSessionBtn').onclick=async()=>{
    try {await request('/api/admin/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});await access();notice('Signed out.');$('reloadPreview').click();}
    catch(error){notice(error.message,true);}
  };
  let accountMode='password';
  function openAccount(mode){
    accountMode=mode;$('accountForm').reset();$('accountStatus').textContent='';
    const adding=mode==='add';$('accountTitle').textContent=$('accountSubmit').textContent=adding?'Add admin':'Change password';
    $('accountDescription').textContent=adding?'Create another admin with full content editing and unlimited replay access. Use at least 12 characters for the password.':'Use at least 12 characters. Changing your password signs out your other sessions.';
    $('newUsernameLabel').hidden=!adding;$('newUsername').required=adding;
    $('currentPasswordLabel').hidden=adding;$('currentPassword').required=!adding;
    $('accountDialog').showModal();
  }
  $('changePasswordBtn').onclick=()=>openAccount('password');$('addAdminBtn').onclick=()=>openAccount('add');
  $('closeAccount').onclick=()=>$('accountDialog').close();
  $('accountDialog').addEventListener('close',()=>$('accountForm').reset());
  $('accountForm').onsubmit=async event=>{
    event.preventDefault();if($('newPassword').value!==$('confirmPassword').value){$('accountStatus').textContent='The new passwords do not match.';return;}
    $('accountSubmit').disabled=true;
    try{const adding=accountMode==='add';const result=await request('/api/admin/'+(adding?'users':'password'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(adding?{username:$('newUsername').value.trim(),password:$('newPassword').value}:{currentPassword:$('currentPassword').value,newPassword:$('newPassword').value})});$('accountDialog').close();notice(adding?'Admin '+result.username+' created.':'Password changed. Your other sessions have been signed out.');}
    catch(error){$('accountStatus').textContent=error.message;}finally{$('accountSubmit').disabled=false;}
  };
  async function refreshActivity(){
    try {const data=await request('/api/admin/activity');$('activityRows').replaceChildren(...data.events.map(event=>{const row=create('tr');for(const value of [new Date(event.created_at).toLocaleString(),event.visitor+(event.admin?' · admin':''),event.type,event.details])row.append(create('td',{},value));return row;}));$('activityStatus').textContent='Updated '+new Date().toLocaleTimeString();}
    catch(error){$('activityStatus').textContent=error.message;}
  }
  $('activityBtn').onclick=()=>{$('activityDialog').showModal();refreshActivity();clearInterval(activityTimer);activityTimer=setInterval(refreshActivity,3000);};
  $('closeActivity').onclick=()=>$('activityDialog').close();
  $('activityDialog').addEventListener('close',()=>clearInterval(activityTimer));
  $('reloadPreview').onclick=()=>{previewReady=false;$('sitePreview').src='/?cms-preview=1&refresh='+Date.now();};
  for(const [id,value] of [['desktopBtn',false],['mobileBtn',true]])$(id).onclick=()=>{mobile=value;$('desktopBtn').classList.toggle('selected',!mobile);$('mobileBtn').classList.toggle('selected',mobile);$('desktopBtn').setAttribute('aria-pressed',!mobile);$('mobileBtn').setAttribute('aria-pressed',mobile);sizePreview();};
  window.addEventListener('message',event=>{if(event.origin===location.origin&&event.source===$('sitePreview').contentWindow&&event.data?.type==='cms-ready'){previewReady=true;preview();}});
  window.addEventListener('beforeunload',event=>{if(dirty()){event.preventDefault();event.returnValue='';}});
  new ResizeObserver(sizePreview).observe($('previewArea'));
  (async()=>{try{const result=await request('/api/cms/content');saved={...CMSSchema.defaults,...result.values};revision=result.revision;draft={...saved};try{const pending=JSON.parse(localStorage.getItem(draftKey));if(pending?.values){draft={...draft,...pending.values};revision=pending.revision;notice('Your unsaved draft has been restored.');}}catch{}renderNav();renderFields();await access();status();preview();}catch(error){notice('Could not load the CMS: '+error.message,true);}})();
})();
