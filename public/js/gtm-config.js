(function(root){
  function containerId(value){
    const text=String(value||'').trim();
    if(!text)return '';
    if(/^GTM-[A-Z0-9]{4,32}$/.test(text))return text;
    const ids=[...new Set(text.match(/\bGTM-[A-Z0-9]{4,32}\b/g)||[])];
    if(ids.length===1&&/www\.googletagmanager\.com\/(?:gtm\.js|ns\.html)/.test(text))return ids[0];
    throw new Error('Enter a GTM container ID (GTM-…) or its Google Tag Manager installation code. Use one container only.');
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={containerId};else root.GTMConfig={containerId};
})(globalThis);
