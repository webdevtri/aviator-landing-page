const fs = require('fs');
const vm = require('vm');
const fields = [];
const add = (key, group, label, value, options = {}) => fields.push({ key, group, label, default: value, type: 'text', ...options });
const page = (key, label, selector, value, options = {}) => add(key, 'Page text', label, value, { selector, ...options });
page('page.title', 'Browser title', 'title', 'KIXO9 × Aviator — Take Flight');
page('page.description', 'Search description', 'meta[name="description"]', 'Discover the KIXO9 Aviator experience. Try two simulated flights with virtual credits. Adults only. No real-money prizes in this demo.', { attr:'content', type:'textarea' });
page('page.greeting', 'Pilot greeting', '.pilot-greeting', 'Ahoy, Pilot! 👀');
page('page.headline', 'Main headline', '.takeoff-title em', 'READY FOR TAKEOFF? 🚀');
page('page.subtitle', 'Subtitle', '.takeoff-subtitle', 'Make your choice, and take off!');
page('page.credits', 'Credits label', '.balance-label', 'CREDITS');
page('page.players', 'Players online label', '.active-players-badge>span:last-child', 'players online');
page('page.age', 'Age badge', '.age-badge', '18+');
page('page.responsible', 'Footer notice', '.legal-summary>span:last-child', 'Adults only. Play responsibly.', { preserveChild:'.footer-detail' });
page('page.virtual', 'Footer detail', '.footer-detail', 'Virtual credits have no cash value.');
page('page.email', 'Contact email', '.contact-email', 'contact@kixo9.com', { type:'email' });
add('links.signup', 'Popups', 'Claim CTA destination URL', 'https://www.kixo9.com/signup', { type:'url', hint:'The YOURS. CLAIM IT button opens this link. Include https://.' });
for (const [id,label] of [['privacy','Privacy'],['terms','Terms'],['responsible','Responsible play'],['cookies','Cookies']]) page('footer.'+id, label+' button', `[data-policy="${id}"]`, label);
const game = { takeoff:'Take Off', cashout:'Cash Out', cashed:'Cashed Out', waiting:'Waiting ({seconds})', won:'WON {amount}!', you:'YOU (Winner!)', currencyINR:'INR (₹)', currencyUSD:'USD ($)' };
for(const [key,value] of Object.entries(game)) add('game.'+key,'Game labels',key,value);
page('game.flewaway','Flew-away label','#flewAwayLabel','FLEW AWAY!'); fields.at(-1).group='Game labels';
page('game.cashoutBanner','Cashout banner title','.win-title','DEMO CASH OUT'); fields.at(-1).group='Game labels';
const attrs = [['soundToggleBtn','Sound button','Toggle Sound','title'],['helpBtn','Help button','Game Rules & Info','title'],['currencyToggleBtn','Currency tooltip','Switch Currency','title'],['btnMinus','Decrease bet','Decrease Bet','aria-label'],['btnPlus','Increase bet','Increase Bet','aria-label'],['betAmountInput','Stake input','Virtual stake amount','aria-label'],['closeBonusBtn','Close reward','Close Bonus Modal','aria-label'],['closePolicyBtn','Close information','Close information','aria-label'],['policyPrevBtn','Previous page','Previous policy page','aria-label'],['policyNextBtn','Next page','Next policy page','aria-label']];
attrs.forEach(([id,label,value,attr])=>add('access.'+id,'Labels & accessibility',label,value,{selector:'#'+id,attr}));
for(const [key,label,selector,value] of [
 ['win.title','Win title','#congratsTitle','YOU COOKED. 🔥'],['win.subtitle','Win subtitle','#congratsCredits','Pilot, you’re in. 🫡'],
 ['win.bonus','Offer text','.welcome-bonus','🎁 500% WELCOME BONUS'],['win.cta','Claim button','#bonusClaimBtn','YOURS. CLAIM IT'],
 ['win.note','Offer footnote','.bonus-timer-bar','18+ · Offer terms apply · Virtual winnings have no cash value']
]) add(key,'Popups',label,value,{selector});
add('loss.title','Popups','Loss title','OOOPS! 😮‍💨');
add('loss.body','Popups','Loss message','That Flight Just Flew AWAY. Try Again!',{type:'textarea'});
const messages = fs.readFileSync('js/flight-messages.js','utf8');
const chatter = vm.runInNewContext(messages.match(/const chatter = ([\s\S]*?);/)[1]);
const milestones = vm.runInNewContext(messages.match(/const milestones = ([\s\S]*?);/)[1]);
chatter.forEach((pair,i)=>pair.forEach((value,j)=>add(`chatter.${i}.${j}`,'Flight messages',`Message ${i+1} · ${j?'second line':'first line'}`,value)));
milestones.forEach(([mult,value])=>add('milestone.'+mult,'Flight messages',mult+'× after cashout',value));
const policySource=fs.readFileSync('js/kixo9.js','utf8');
const policies=vm.runInNewContext('('+policySource.match(/const policies = ([\s\S]*?\n  });/)[1]+')');
for(const [key,[title,html]] of Object.entries(policies)) {
  add('policy.'+key+'.title','Legal popups',key+' · title',title);
  add('policy.'+key+'.body','Legal popups',key+' · content',html.replace(/<\/p>\s*<p>/g,'\n\n').replace(/<a href="([^"]+)"[^>]*>(.*?)<\/a>/g,'$2 ($1)').replace(/<[^>]+>/g,''),{type:'textarea'});
}
page('policy.eyebrow','Information label','.policy-topline>span','KIXO9 / INFORMATION');fields.at(-1).group='Legal popups';
page('policy.footer','Information footer','.policy-bottom>span','18+ · Play responsibly');fields.at(-1).group='Legal popups';
page('policy.done','Dismiss button','#policyDoneBtn','Got it ↗');fields.at(-1).group='Legal popups';
const html=fs.readFileSync('index.html','utf8');
const help=[...html.matchAll(/<div class="help-step">[\s\S]*?<strong>(.*?)<\/strong>\s*<p>(.*?)<\/p>/g)];
help.forEach((m,i)=>{for(const [suffix,value,tag] of [['title',m[1],'strong'],['body',m[2],'p']]) add(`help.${i}.${suffix}`,'Help & tour',`Help ${i+1} · ${suffix}`,value,{selector:`.help-step:nth-child(${i+1}) ${tag}`,type:suffix==='body'?'textarea':'text'});});
add('help.title','Help & tour','Help heading','How to Play Aviator',{selector:'.help-header h3'});
add('help.replay','Help & tour','Tour button','🎬 Play Interactive Tour',{selector:'#replayTourBtn'});
const tour=fs.readFileSync('js/tour.js','utf8');
[...tour.matchAll(/title: "(.*?)",\s*desc: "(.*?)"/g)].forEach((m,i)=>{add(`tour.${i}.title`,'Help & tour',`Tour ${i+1} title`,m[1]);add(`tour.${i}.body`,'Help & tour',`Tour ${i+1} body`,m[2],{type:'textarea'});});
add('tour.next','Help & tour','Next button','Next →');add('tour.done','Help & tour','Finish button',"Let’s fly! 🚀");add('tour.step','Help & tour','Step badge','STEP {step} / {total}');
const media=[['brand','KIXO9 logo','assets/kixo9-logo.webp','.k9-wordmark img'],['aviator','Aviator logo','assets/aviator-logo.svg','.brand-logo'],['favicon','Browser icon','assets/kixo9-favicon.webp','link[rel="icon"]'],['mascot','Thumbs-up character','assets/raccoon-thumbs-up.png','.pilot-character-image'],['plane','In-game plane','assets/raccoon-pilot-cartoon.png',null]];
media.forEach(([key,label,value,selector])=>{add('media.'+key,'Images & avatars',label,value,{type:'image',selector,attr:key==='favicon'?'href':'src'});if(selector && key!=='favicon')add('alt.'+key,'Labels & accessibility',label+' description',key==='brand'?'KIXO9':key==='aviator'?'Aviator Logo':'Raccoon pilot in a blue flight jacket giving a thumbs up for takeoff',{selector,attr:'alt'});});
for(let i=0;i<4;i++) add('avatar.'+i,'Images & avatars','Player avatar '+(i+1),'',{type:'image',hint:'Leave empty to use the original game icon.'});
const names=vm.runInNewContext(fs.readFileSync('js/winners.js','utf8').match(/this.mockNames = ([\s\S]*?);/)[1]);
add('players.names','Game labels','Player names (one per line)',names.join('\n'),{type:'textarea'});
for(const [key,label,value] of [['accent','Brand blue','#225ef8'],['background','Page background','#f8f8f8'],['surface','Cards & popups','#ffffff'],['ink','Main text','#0e0f13'],['muted','Secondary text','#606575'],['signup','Claim button','#33c85d'],['signupText','Claim button text','#0e0f13'],['game','Game background','#f8f8f8'],['flight','Flight trail / flew-away','#e50539'],['purple','Medium multiplier','#913ef8'],['gold','High multiplier / cashout','#ffc700'],['border','Borders','#d8e0f8']])add('color.'+key,'Colors',label,value,{type:'color'});

for (const [key,label,value,min,max] of [
 ['firstMin','Round 1 · minimum multiplier','1',1,1000],['firstMax','Round 1 · maximum multiplier','1.15',1,1000],
 ['secondMin','Round 2 · minimum multiplier','120',1,1000],['secondMax','Round 2 · maximum multiplier','147',1,1000],
 ['growthRate','Shared multiplier growth speed','0.3',0.01,5]
]) add('flight.'+key,'Flight settings',label,value,{type:'number',min,max,step:0.01,hint:key==='growthRate'?'Both rounds use this speed. Higher values climb faster. Changes affect new flights.':'Random fly-away limit. Changes affect new flights.'});
add('responsive.safeArea','Responsive settings','Respect device safe areas','true',{type:'toggle'});
for(const [key,label] of [['bottomInset','Extra bottom clearance (px)'],['topInset','Extra top clearance (px)'],['sideInset','Extra side clearance (px)']])add('responsive.'+key,'Responsive settings',label,'0',{type:'number',min:0,max:120,step:1,hint:'Additional space if a device does not report its navigation-bar inset.'});
for(const [key,label,value] of [['checking','Checking visitor status','Checking flights…'],['activeElsewhere','Already running flight','Flight in progress'],['exhausted','No chances remaining','Flights used'],['retry','Network retry button','Retry connection']])add('game.'+key,'Game labels',label,value);
fields.push({"key":"tracking.gtmCode","group":"Tracking","label":"Google Tag Manager code or container ID","default":"","type":"textarea","hint":"Paste your Google GTM installation code or GTM-XXXXXXX ID. Only the container ID is saved; pasted HTML is not executed. Leave blank to disable tracking. Changes apply on the next page load."});
fields.push({"key":"game.claimBonus","group":"Game labels","label":"After-win claim button","default":"Claim Bonus","type":"text"});
fs.writeFileSync('js/cms-schema.js',`/* CMS field definitions and initial content. */\n(function(root){const fields=${JSON.stringify(fields,null,2)}; const schema={fields,defaults:Object.fromEntries(fields.map(f=>[f.key,f.default]))}; if(typeof module!=='undefined'&&module.exports)module.exports=schema;else root.CMSSchema=schema;})(globalThis);\n`);
console.log('Created CMS schema:',fields.length,'fields');
