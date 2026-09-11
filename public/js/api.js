/* Visitor attempts and cashouts require the persistent server. */
const AviatorAPI = {
  isAdmin:false,
  async request(path,body) {
    const response=await fetch(path,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});
    const data=await response.json();
    if(!response.ok)throw Object.assign(new Error(data.error||'The server could not complete this request.'),{state:data.state});
    return data;
  },
  async getState(){const state=await this.request('/api/visitor/state');this.isAdmin=state.isAdmin;return state;},
  startFlight(attemptNumber,betAmount,currency){return this.request('/api/flight/start',{attemptNumber,betAmount,currency});},
  cashout(sessionToken){return this.request('/api/flight/cashout',{sessionToken});},
  completeFlight(data){return this.request('/api/flight/complete',{sessionToken:data.sessionToken}).catch(()=>({success:false}));},
  track(type,target='',value='') {fetch('/api/visitor/event',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({type,target,value})}).catch(()=>{});}
};
window.AviatorAPI=AviatorAPI;
document.addEventListener('DOMContentLoaded',()=>{
  document.addEventListener('click',event=>{
    const control=event.target.closest('button,a');if(!control)return;
    const stakeControl=['btnMinus','btnPlus'].includes(control.id)||control.classList.contains('quick-chip');
    const value=stakeControl?document.getElementById('betAmountInput').value:control.id==='currencyToggleBtn'?control.textContent:'';
    AviatorAPI.track(control.id==='bonusClaimBtn'?'claim_click':stakeControl?'stake_change':control.id==='currencyToggleBtn'?'currency_change':'click',control.id||control.dataset.policy||control.getAttribute('aria-label')||control.textContent.trim().slice(0,100),value);
  });
  document.getElementById('betAmountInput').addEventListener('change',event=>AviatorAPI.track('stake_change','betAmountInput',event.target.value));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)AviatorAPI.track('page_hidden');});
  window.addEventListener('pagehide',()=>AviatorAPI.track('page_exit'));
});
