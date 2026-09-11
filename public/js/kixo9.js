/* Operator-specific legal details must be completed before campaign launch. */
(() => {
  const policies = {
    privacy: ['Privacy notice', '<p><strong>Demo data.</strong> Playing sends a session identifier, virtual stake, currency, flight result and timestamp to this site’s server. If the server is unavailable, results may be saved in this browser.</p><p><strong>Your browser.</strong> This page does not ask for your name, email or payment details. Fonts are requested from Google Fonts, which receives standard connection information such as your IP address. Hosting providers may keep technical access logs.</p><p><strong>Your choices.</strong> Clear site data in your browser to remove locally stored results. Operator identity, retention periods and a privacy contact must be supplied before a public campaign launches.</p>'],
    terms: ['Terms of this demo', '<p><strong>Adults only.</strong> Use this experience only if you are 18 or older and meet the legal age requirement where you live.</p><p><strong>Virtual play.</strong> This is a scripted, two-flight demonstration. The balance, activity feed and results are simulated. No deposit, purchase, withdrawal or prize of real-world value is available here.</p><p><strong>No prediction or entitlement.</strong> Demo results do not represent real game odds or guarantee future outcomes. Playing creates no entitlement to a KIXO9 bonus. Any separate promotion needs its own published eligibility and complete terms.</p>'],
    responsible: ['Keep play in balance', '<p><strong>For adults of legal age.</strong> Take regular breaks and set limits on your time. Gambling should never be treated as income or a solution to financial problems.</p><p><strong>Know the difference.</strong> This demo uses scripted outcomes and virtual credits. Its results do not predict real-money play. Never chase losses or play with money needed for essentials.</p><p><strong>Need support?</strong> If play stops feeling enjoyable, stop and seek help. Visit <a href="https://www.gamblingtherapy.org/" target="_blank" rel="noopener noreferrer">Gambling Therapy</a> for international support and guidance.</p>'],
    cookies: ['Cookies & browser storage', '<p><strong>Current setup.</strong> This page does not install Meta Pixel, Google Ads tags or optional analytics cookies. No advertising trackers are loaded by this implementation.</p><p><strong>Demo storage.</strong> If the server is unavailable, completed flights may be saved under <strong>aviator_sessions</strong> in browser storage. Older versions may also have stored <strong>aviator_claims</strong>. You can remove these through your browser’s site-data settings.</p><p><strong>Future changes.</strong> Adding advertising or analytics technology requires updating this notice and implementing any consent controls required for your audience.</p>'],
    promotion: ['500% welcome bonus', '<p><strong>The KIXO9 welcome offer.</strong> A 500% welcome bonus is advertised for eligible new players. Adults of legal age only. Availability depends on your location and the operator’s eligibility rules.</p><p><strong>Check the full offer before depositing.</strong> Deposit requirements, bonus caps, wagering requirements, game restrictions, withdrawal limits and expiry are governed by KIXO9’s current promotion terms. Those detailed conditions have not been supplied for this landing page.</p><p><strong>Separate from the demo.</strong> Virtual winnings here cannot be withdrawn or exchanged for this offer. <a href="https://www.kixo9.com/signup" target="_blank" rel="noopener noreferrer">Continue to KIXO9</a> to review the offer before participating.</p>']
  };
  const dialog = document.getElementById('policyDialog');
  const body = document.getElementById('policyBody');
  const pagination = document.getElementById('policyPagination');
  let paragraphs = [];
  let currentPage = 0;
  function renderPolicy() {
    pagination.hidden = true;
    body.innerHTML = paragraphs.join('');
    if (dialog.scrollHeight > dialog.clientHeight) {
      body.innerHTML = paragraphs[currentPage];
      pagination.hidden = false;
      document.getElementById('policyPageCount').textContent = `${currentPage + 1} / ${paragraphs.length}`;
      document.getElementById('policyPrevBtn').disabled = currentPage === 0;
      document.getElementById('policyNextBtn').disabled = currentPage === paragraphs.length - 1;
    }
  }
  let trigger = null;
  function openPolicy(key) {
    const policy = window.CMS ? window.CMS.policy(key) : policies[key];
    if (!policy) return;
    trigger = document.activeElement;
    document.getElementById('policyTitle').textContent = policy[0];
    paragraphs = policy[1].match(/<p>[\s\S]*?<\/p>/g) || [];
    currentPage = 0;
    body.innerHTML = policy[1];
    if (!dialog.open) dialog.showModal();
    renderPolicy();
    document.getElementById('closePolicyBtn').focus();
  }
  document.querySelectorAll('[data-policy]').forEach(button => button.addEventListener('click', () => openPolicy(button.dataset.policy)));
  document.getElementById('bonusClaimBtn').addEventListener('click', () => {
    window.open(window.CMS?.get('links.signup') || 'https://www.kixo9.com/signup', '_blank', 'noopener,noreferrer');
  });
  document.getElementById('closePolicyBtn').addEventListener('click', () => dialog.close());
  document.getElementById('policyDoneBtn').addEventListener('click', () => dialog.close());
  document.getElementById('policyPrevBtn').addEventListener('click', () => { currentPage = Math.max(0, currentPage - 1); renderPolicy(); });
  document.getElementById('policyNextBtn').addEventListener('click', () => { currentPage = Math.min(paragraphs.length - 1, currentPage + 1); renderPolicy(); });
  window.addEventListener('resize', () => { if (dialog.open) renderPolicy(); });
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => trigger?.focus());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Escape') event.stopPropagation();
  });
})();
