(() => {
  // Editor previews must not send campaign page views or conversion events.
  if(window.parent!==window||new URLSearchParams(location.search).has('cms-preview'))return;
  let id;
  try{id=GTMConfig.containerId(window.CMSContent?.['tracking.gtmCode']);}catch{return;}
  if(!id||document.getElementById('k9-gtm'))return;
  window.dataLayer=window.dataLayer||[];
  window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
  const script=document.createElement('script');
  script.id='k9-gtm';script.async=true;
  script.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(id);
  document.head.appendChild(script);
})();
