(function () {
  let values = { ...CMSSchema.defaults, ...window.CMSContent };
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const get = key => {
    const value = String(values[key] ?? '');
    const field = CMSSchema.fields.find(f=>f.key===key);
    if (field?.type === 'url' && !/^https?:\/\/[^\s<>"']+$/i.test(value)) return field.default;
    if (field?.type === 'image' && value && (!/^(?:\/?assets\/[a-z0-9_./-]+|https:\/\/[^\s<>"']+)$/i.test(value) || value.split('/').includes('..'))) return field.default;
    if (field?.type === 'color' && !/^#[a-f0-9]{6}$/i.test(value)) return field.default;
    return value;
  };
  const text = (key, variables = {}) => String(get(key)).replace(/\{(\w+)\}/g, (all, key) => variables[key] ?? all);
  function apply() {
    document.documentElement.dataset.safeArea=get('responsive.safeArea')==='false'?'false':'true';
    for(const edge of ['bottom','top','side'])document.documentElement.style.setProperty('--extra-'+edge,Math.max(0,Math.min(120,Number(get('responsive.'+edge+'Inset'))||0))+'px');
    for (const field of CMSSchema.fields) {
      if (field.type === 'color') document.documentElement.style.setProperty('--cms-'+field.key.slice(6),get(field.key));
      if (!field.selector) continue;
      document.querySelectorAll(field.selector).forEach(el => {
        const value = get(field.key);
        if (field.attr) el.setAttribute(field.attr,value);
        else if (field.preserveChild) {
          const child = el.querySelector(field.preserveChild);
          el.textContent = value+' ';
          if (child) el.append(child);
        } else if (el.textContent.trim() !== value.trim()) el.textContent = value;
        if (field.key === 'page.email') el.setAttribute('href','mailto:'+value);
      });
    }
  }
  window.CMS = { get, text, esc,
    color(key, alpha = 1) {
      const hex = get('color.'+key) || '#225ef8';
      const n = parseInt(hex.slice(1),16);
      return `rgba(${n>>16},${n>>8&255},${n&255},${alpha})`;
    },
    policy(key) {
      return [get(`policy.${key}.title`), get(`policy.${key}.body`).split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('')];
    }
  };
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    if (window.parent !== window) window.parent.postMessage({type:'cms-ready'},location.origin);
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent || window.parent === window || event.data?.type !== 'cms-preview') return;
    // Values originate in the same-origin editor and contain text, never executable HTML.
    values = { ...CMSSchema.defaults, ...event.data.values };
    apply();
    document.dispatchEvent(new Event('cms:change'));
    const key = event.data.popup;
    if (key !== 'win') document.getElementById('bonusModal').classList.remove('active');
    document.getElementById('helpModal').classList.toggle('active',key==='help');
    const policyDialog = document.getElementById('policyDialog');
    if (!['privacy','terms','responsible','cookies'].includes(key) && policyDialog.open) policyDialog.close();
    if (key === 'win') {
      document.getElementById('bonusModal').classList.add('active');
    } else if (key === 'loss') {
      document.getElementById('flightToastTitle').textContent=get('loss.title');
      document.getElementById('flightToastBody').textContent=get('loss.body');
      document.getElementById('flightToast').hidden=false;
    } else if (['privacy','terms','responsible','cookies'].includes(key)) document.querySelector(`[data-policy="${CSS.escape(key)}"]`)?.click();
  });
})();
(() => {
  function fitViewport(){
    const height=window.visualViewport?.height||window.innerHeight;
    document.documentElement.style.setProperty('--visible-height',height+'px');
    const style=getComputedStyle(document.documentElement);
    const clearance=(parseFloat(style.getPropertyValue('--extra-top'))||0)+(parseFloat(style.getPropertyValue('--extra-bottom'))||0);
    document.documentElement.dataset.compact=String(height-clearance<540);
  }
  window.addEventListener('resize',fitViewport);
  window.visualViewport?.addEventListener('resize',fitViewport);
  document.addEventListener('cms:change',fitViewport);
  document.addEventListener('DOMContentLoaded',fitViewport);
  fitViewport();
})();
