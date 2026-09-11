(function(root){const fields=[
  {
    "key": "page.title",
    "group": "Page text",
    "label": "Browser title",
    "default": "KIXO9 × Aviator — Take Flight",
    "type": "text",
    "selector": "title"
  },
  {
    "key": "page.description",
    "group": "Page text",
    "label": "Search description",
    "default": "Discover the KIXO9 Aviator experience. Try two simulated flights with virtual credits. Adults only. No real-money prizes in this demo.",
    "type": "textarea",
    "selector": "meta[name=\"description\"]",
    "attr": "content"
  },
  {
    "key": "page.greeting",
    "group": "Page text",
    "label": "Pilot greeting",
    "default": "Ahoy, Pilot! 👀",
    "type": "text",
    "selector": ".pilot-greeting"
  },
  {
    "key": "page.headline",
    "group": "Page text",
    "label": "Main headline",
    "default": "READY FOR TAKEOFF? 🚀",
    "type": "text",
    "selector": ".takeoff-title em"
  },
  {
    "key": "page.subtitle",
    "group": "Page text",
    "label": "Subtitle",
    "default": "Make your choice, and take off!",
    "type": "text",
    "selector": ".takeoff-subtitle"
  },
  {
    "key": "page.credits",
    "group": "Page text",
    "label": "Credits label",
    "default": "CREDITS",
    "type": "text",
    "selector": ".balance-label"
  },
  {
    "key": "page.players",
    "group": "Page text",
    "label": "Players online label",
    "default": "players online",
    "type": "text",
    "selector": ".active-players-badge>span:last-child"
  },
  {
    "key": "page.age",
    "group": "Page text",
    "label": "Age badge",
    "default": "18+",
    "type": "text",
    "selector": ".age-badge"
  },
  {
    "key": "page.responsible",
    "group": "Page text",
    "label": "Footer notice",
    "default": "Adults only. Play responsibly.",
    "type": "text",
    "selector": ".legal-summary>span:last-child",
    "preserveChild": ".footer-detail"
  },
  {
    "key": "page.virtual",
    "group": "Page text",
    "label": "Footer detail",
    "default": "Virtual credits have no cash value.",
    "type": "text",
    "selector": ".footer-detail"
  },
  {
    "key": "page.email",
    "group": "Page text",
    "label": "Contact email",
    "default": "contact@kixo9.com",
    "type": "email",
    "selector": ".contact-email"
  },
  {
    "key": "links.signup",
    "group": "Popups",
    "label": "Claim CTA destination URL",
    "default": "https://www.kixo9.com/signup",
    "type": "url",
    "hint": "The YOURS. CLAIM IT button opens this link. Include https://."
  },
  {
    "key": "footer.privacy",
    "group": "Page text",
    "label": "Privacy button",
    "default": "Privacy",
    "type": "text",
    "selector": "[data-policy=\"privacy\"]"
  },
  {
    "key": "footer.terms",
    "group": "Page text",
    "label": "Terms button",
    "default": "Terms",
    "type": "text",
    "selector": "[data-policy=\"terms\"]"
  },
  {
    "key": "footer.responsible",
    "group": "Page text",
    "label": "Responsible play button",
    "default": "Responsible play",
    "type": "text",
    "selector": "[data-policy=\"responsible\"]"
  },
  {
    "key": "footer.cookies",
    "group": "Page text",
    "label": "Cookies button",
    "default": "Cookies",
    "type": "text",
    "selector": "[data-policy=\"cookies\"]"
  },
  {
    "key": "game.takeoff",
    "group": "Game labels",
    "label": "takeoff",
    "default": "Take Off",
    "type": "text"
  },
  {
    "key": "game.cashout",
    "group": "Game labels",
    "label": "cashout",
    "default": "Cash Out",
    "type": "text"
  },
  {
    "key": "game.cashed",
    "group": "Game labels",
    "label": "cashed",
    "default": "Cashed Out",
    "type": "text"
  },
  {
    "key": "game.waiting",
    "group": "Game labels",
    "label": "waiting",
    "default": "Waiting ({seconds})",
    "type": "text"
  },
  {
    "key": "game.won",
    "group": "Game labels",
    "label": "won",
    "default": "WON {amount}!",
    "type": "text"
  },
  {
    "key": "game.you",
    "group": "Game labels",
    "label": "you",
    "default": "YOU (Winner!)",
    "type": "text"
  },
  {
    "key": "game.currencyINR",
    "group": "Game labels",
    "label": "currencyINR",
    "default": "INR (₹)",
    "type": "text"
  },
  {
    "key": "game.currencyUSD",
    "group": "Game labels",
    "label": "currencyUSD",
    "default": "USD ($)",
    "type": "text"
  },
  {
    "key": "game.flewaway",
    "group": "Game labels",
    "label": "Flew-away label",
    "default": "FLEW AWAY!",
    "type": "text",
    "selector": "#flewAwayLabel"
  },
  {
    "key": "game.cashoutBanner",
    "group": "Game labels",
    "label": "Cashout banner title",
    "default": "DEMO CASH OUT",
    "type": "text",
    "selector": ".win-title"
  },
  {
    "key": "access.soundToggleBtn",
    "group": "Labels & accessibility",
    "label": "Sound button",
    "default": "Toggle Sound",
    "type": "text",
    "selector": "#soundToggleBtn",
    "attr": "title"
  },
  {
    "key": "access.helpBtn",
    "group": "Labels & accessibility",
    "label": "Help button",
    "default": "Game Rules & Info",
    "type": "text",
    "selector": "#helpBtn",
    "attr": "title"
  },
  {
    "key": "access.currencyToggleBtn",
    "group": "Labels & accessibility",
    "label": "Currency tooltip",
    "default": "Switch Currency",
    "type": "text",
    "selector": "#currencyToggleBtn",
    "attr": "title"
  },
  {
    "key": "access.btnMinus",
    "group": "Labels & accessibility",
    "label": "Decrease bet",
    "default": "Decrease Bet",
    "type": "text",
    "selector": "#btnMinus",
    "attr": "aria-label"
  },
  {
    "key": "access.btnPlus",
    "group": "Labels & accessibility",
    "label": "Increase bet",
    "default": "Increase Bet",
    "type": "text",
    "selector": "#btnPlus",
    "attr": "aria-label"
  },
  {
    "key": "access.betAmountInput",
    "group": "Labels & accessibility",
    "label": "Stake input",
    "default": "Virtual stake amount",
    "type": "text",
    "selector": "#betAmountInput",
    "attr": "aria-label"
  },
  {
    "key": "access.closeBonusBtn",
    "group": "Labels & accessibility",
    "label": "Close reward",
    "default": "Close Bonus Modal",
    "type": "text",
    "selector": "#closeBonusBtn",
    "attr": "aria-label"
  },
  {
    "key": "access.closePolicyBtn",
    "group": "Labels & accessibility",
    "label": "Close information",
    "default": "Close information",
    "type": "text",
    "selector": "#closePolicyBtn",
    "attr": "aria-label"
  },
  {
    "key": "access.policyPrevBtn",
    "group": "Labels & accessibility",
    "label": "Previous page",
    "default": "Previous policy page",
    "type": "text",
    "selector": "#policyPrevBtn",
    "attr": "aria-label"
  },
  {
    "key": "access.policyNextBtn",
    "group": "Labels & accessibility",
    "label": "Next page",
    "default": "Next policy page",
    "type": "text",
    "selector": "#policyNextBtn",
    "attr": "aria-label"
  },
  {
    "key": "win.title",
    "group": "Popups",
    "label": "Win title",
    "default": "YOU COOKED. 🔥",
    "type": "text",
    "selector": "#congratsTitle"
  },
  {
    "key": "win.subtitle",
    "group": "Popups",
    "label": "Win subtitle",
    "default": "Pilot, you’re in. 🫡",
    "type": "text",
    "selector": "#congratsCredits"
  },
  {
    "key": "win.bonus",
    "group": "Popups",
    "label": "Offer text",
    "default": "🎁 500% WELCOME BONUS",
    "type": "text",
    "selector": ".welcome-bonus"
  },
  {
    "key": "win.cta",
    "group": "Popups",
    "label": "Claim button",
    "default": "YOURS. CLAIM IT",
    "type": "text",
    "selector": "#bonusClaimBtn"
  },
  {
    "key": "win.note",
    "group": "Popups",
    "label": "Offer footnote",
    "default": "18+ · Offer terms apply · Virtual winnings have no cash value",
    "type": "text",
    "selector": ".bonus-timer-bar"
  },
  {
    "key": "loss.title",
    "group": "Popups",
    "label": "Loss title",
    "default": "OOOPS! 😮‍💨",
    "type": "text"
  },
  {
    "key": "loss.body",
    "group": "Popups",
    "label": "Loss message",
    "default": "That Flight Just Flew AWAY. Try Again!",
    "type": "textarea"
  },
  {
    "key": "chatter.0.0",
    "group": "Flight messages",
    "label": "Message 1 · first line",
    "default": "Okay PILOT… 👀",
    "type": "text"
  },
  {
    "key": "chatter.0.1",
    "group": "Flight messages",
    "label": "Message 1 · second line",
    "default": "We’re FLYING!",
    "type": "text"
  },
  {
    "key": "chatter.1.0",
    "group": "Flight messages",
    "label": "Message 2 · first line",
    "default": "BRO, it’s still GOING 🔥",
    "type": "text"
  },
  {
    "key": "chatter.1.1",
    "group": "Flight messages",
    "label": "Message 2 · second line",
    "default": "",
    "type": "text"
  },
  {
    "key": "chatter.2.0",
    "group": "Flight messages",
    "label": "Message 3 · first line",
    "default": "AYOOO 👀🔥",
    "type": "text"
  },
  {
    "key": "chatter.2.1",
    "group": "Flight messages",
    "label": "Message 3 · second line",
    "default": "Now we're TALKING.",
    "type": "text"
  },
  {
    "key": "chatter.3.0",
    "group": "Flight messages",
    "label": "Message 4 · first line",
    "default": "👀 Still watching?",
    "type": "text"
  },
  {
    "key": "chatter.3.1",
    "group": "Flight messages",
    "label": "Message 4 · second line",
    "default": "",
    "type": "text"
  },
  {
    "key": "chatter.4.0",
    "group": "Flight messages",
    "label": "Message 5 · first line",
    "default": "🚀 Up we go!",
    "type": "text"
  },
  {
    "key": "chatter.4.1",
    "group": "Flight messages",
    "label": "Message 5 · second line",
    "default": "",
    "type": "text"
  },
  {
    "key": "chatter.5.0",
    "group": "Flight messages",
    "label": "Message 6 · first line",
    "default": "🔥 This is getting interesting.",
    "type": "text"
  },
  {
    "key": "chatter.5.1",
    "group": "Flight messages",
    "label": "Message 6 · second line",
    "default": "",
    "type": "text"
  },
  {
    "key": "chatter.6.0",
    "group": "Flight messages",
    "label": "Message 7 · first line",
    "default": "Pilots, stay sharp.",
    "type": "text"
  },
  {
    "key": "chatter.6.1",
    "group": "Flight messages",
    "label": "Message 7 · second line",
    "default": "",
    "type": "text"
  },
  {
    "key": "chatter.7.0",
    "group": "Flight messages",
    "label": "Message 8 · first line",
    "default": "😮‍💨 What a climb.",
    "type": "text"
  },
  {
    "key": "chatter.7.1",
    "group": "Flight messages",
    "label": "Message 8 · second line",
    "default": "",
    "type": "text"
  },
  {
    "key": "chatter.8.0",
    "group": "Flight messages",
    "label": "Message 9 · first line",
    "default": "👀 Don’t blink.",
    "type": "text"
  },
  {
    "key": "chatter.8.1",
    "group": "Flight messages",
    "label": "Message 9 · second line",
    "default": "",
    "type": "text"
  },
  {
    "key": "chatter.9.0",
    "group": "Flight messages",
    "label": "Message 10 · first line",
    "default": "✈️ Smooth flying.",
    "type": "text"
  },
  {
    "key": "chatter.9.1",
    "group": "Flight messages",
    "label": "Message 10 · second line",
    "default": "",
    "type": "text"
  },
  {
    "key": "chatter.10.0",
    "group": "Flight messages",
    "label": "Message 11 · first line",
    "default": "🚀 We’re going higher.",
    "type": "text"
  },
  {
    "key": "chatter.10.1",
    "group": "Flight messages",
    "label": "Message 11 · second line",
    "default": "",
    "type": "text"
  },
  {
    "key": "chatter.11.0",
    "group": "Flight messages",
    "label": "Message 12 · first line",
    "default": "🔥 Okayyy, Pilot!",
    "type": "text"
  },
  {
    "key": "chatter.11.1",
    "group": "Flight messages",
    "label": "Message 12 · second line",
    "default": "",
    "type": "text"
  },
  {
    "key": "chatter.12.0",
    "group": "Flight messages",
    "label": "Message 13 · first line",
    "default": "🫡 Locked in?",
    "type": "text"
  },
  {
    "key": "chatter.12.1",
    "group": "Flight messages",
    "label": "Message 13 · second line",
    "default": "",
    "type": "text"
  },
  {
    "key": "milestone.3",
    "group": "Flight messages",
    "label": "3× after cashout",
    "default": "AND… IT’S STILL CLIMBING. 🚀",
    "type": "text"
  },
  {
    "key": "milestone.5",
    "group": "Flight messages",
    "label": "5× after cashout",
    "default": "STILL GOING…",
    "type": "text"
  },
  {
    "key": "milestone.10",
    "group": "Flight messages",
    "label": "10× after cashout",
    "default": "10x?! 😳",
    "type": "text"
  },
  {
    "key": "milestone.20",
    "group": "Flight messages",
    "label": "20× after cashout",
    "default": "BROOO.",
    "type": "text"
  },
  {
    "key": "milestone.35",
    "group": "Flight messages",
    "label": "35× after cashout",
    "default": "NO WAY. 🚀",
    "type": "text"
  },
  {
    "key": "milestone.50",
    "group": "Flight messages",
    "label": "50× after cashout",
    "default": "50x?! 🔥",
    "type": "text"
  },
  {
    "key": "milestone.75",
    "group": "Flight messages",
    "label": "75× after cashout",
    "default": "THIS FLIGHT 😮‍💨",
    "type": "text"
  },
  {
    "key": "milestone.100",
    "group": "Flight messages",
    "label": "100× after cashout",
    "default": "100x. 👀",
    "type": "text"
  },
  {
    "key": "milestone.140",
    "group": "Flight messages",
    "label": "140× after cashout",
    "default": "WHAT A RUN. ✈️",
    "type": "text"
  },
  {
    "key": "policy.privacy.title",
    "group": "Legal popups",
    "label": "privacy · title",
    "default": "Privacy notice",
    "type": "text"
  },
  {
    "key": "policy.privacy.body",
    "group": "Legal popups",
    "label": "privacy · content",
    "default": "Visitor records. This site uses an essential visitor cookie and an IP-derived network identifier to remember used flights, including after refresh. The server records page views, button interactions, stake changes, round starts, cashouts and completed results in a database. IP addresses are converted to keyed hashes for matching.\n\nAdmin access. Logged-in administrators have a separate, time-limited session cookie and can replay for testing. Admin activity is recorded separately. No payment details are requested by this page. Google Fonts receives normal connection information when fonts load.\n\nYour choices. Clearing browser data removes local cookies but does not reset server-recorded chances. Visitors sharing a network may share the two-flight limit. Contact contact@kixo9.com with privacy questions. Operator identity and a published retention policy must be supplied before a public campaign launches.",
    "type": "textarea"
  },
  {
    "key": "policy.terms.title",
    "group": "Legal popups",
    "label": "terms · title",
    "default": "Terms of this demo",
    "type": "text"
  },
  {
    "key": "policy.terms.body",
    "group": "Legal popups",
    "label": "terms · content",
    "default": "Adults only. Use this experience only if you are 18 or older and meet the legal age requirement where you live.\n\nVirtual play. This is a scripted, two-flight demonstration. The balance, activity feed and results are simulated. No deposit, purchase, withdrawal or prize of real-world value is available here.\n\nNo prediction or entitlement. Demo results do not represent real game odds or guarantee future outcomes. Playing creates no entitlement to a KIXO9 bonus. Any separate promotion needs its own published eligibility and complete terms.",
    "type": "textarea"
  },
  {
    "key": "policy.responsible.title",
    "group": "Legal popups",
    "label": "responsible · title",
    "default": "Keep play in balance",
    "type": "text"
  },
  {
    "key": "policy.responsible.body",
    "group": "Legal popups",
    "label": "responsible · content",
    "default": "For adults of legal age. Take regular breaks and set limits on your time. Gambling should never be treated as income or a solution to financial problems.\n\nKnow the difference. This demo uses scripted outcomes and virtual credits. Its results do not predict real-money play. Never chase losses or play with money needed for essentials.\n\nNeed support? If play stops feeling enjoyable, stop and seek help. Visit Gambling Therapy (https://www.gamblingtherapy.org/) for international support and guidance.",
    "type": "textarea"
  },
  {
    "key": "policy.cookies.title",
    "group": "Legal popups",
    "label": "cookies · title",
    "default": "Cookies & browser storage",
    "type": "text"
  },
  {
    "key": "policy.cookies.body",
    "group": "Legal popups",
    "label": "cookies · content",
    "default": "Essential cookies. The k9_visitor cookie identifies this browser for up to one year. The k9_admin cookie identifies an authenticated administrator for up to 12 hours. These are HttpOnly, SameSite cookies; secure transmission is enabled on HTTPS.\n\nServer records. Used chances and game actions are recorded on the server. Clearing cookies or refreshing does not restore chances on the same network. The CMS also stores unsaved editor drafts locally in the admin browser.\n\nAdvertising and analytics. When a Google Tag Manager container is configured, it can load the advertising and analytics tags selected by the site operator. Those tags may use cookies or process interaction data according to their configuration.",
    "type": "textarea"
  },
  {
    "key": "policy.promotion.title",
    "group": "Legal popups",
    "label": "promotion · title",
    "default": "500% welcome bonus",
    "type": "text"
  },
  {
    "key": "policy.promotion.body",
    "group": "Legal popups",
    "label": "promotion · content",
    "default": "The KIXO9 welcome offer. A 500% welcome bonus is advertised for eligible new players. Adults of legal age only. Availability depends on your location and the operator’s eligibility rules.\n\nCheck the full offer before depositing. Deposit requirements, bonus caps, wagering requirements, game restrictions, withdrawal limits and expiry are governed by KIXO9’s current promotion terms. Those detailed conditions have not been supplied for this landing page.\n\nSeparate from the demo. Virtual winnings here cannot be withdrawn or exchanged for this offer. Continue to KIXO9 (https://www.kixo9.com/signup) to review the offer before participating.",
    "type": "textarea"
  },
  {
    "key": "policy.eyebrow",
    "group": "Legal popups",
    "label": "Information label",
    "default": "KIXO9 / INFORMATION",
    "type": "text",
    "selector": ".policy-topline>span"
  },
  {
    "key": "policy.footer",
    "group": "Legal popups",
    "label": "Information footer",
    "default": "18+ · Play responsibly",
    "type": "text",
    "selector": ".policy-bottom>span"
  },
  {
    "key": "policy.done",
    "group": "Legal popups",
    "label": "Dismiss button",
    "default": "Got it ↗",
    "type": "text",
    "selector": "#policyDoneBtn"
  },
  {
    "key": "help.0.title",
    "group": "Help & tour",
    "label": "Help 1 · title",
    "default": "Set your stake",
    "type": "text",
    "selector": ".help-step:nth-child(1) strong"
  },
  {
    "key": "help.0.body",
    "group": "Help & tour",
    "label": "Help 1 · body",
    "default": "Use the − / + buttons or quick chips (₹100, ₹200...) to choose your bet amount for the round.",
    "type": "textarea",
    "selector": ".help-step:nth-child(1) p"
  },
  {
    "key": "help.1.title",
    "group": "Help & tour",
    "label": "Help 2 · title",
    "default": "Launch the round",
    "type": "text",
    "selector": ".help-step:nth-child(2) strong"
  },
  {
    "key": "help.1.body",
    "group": "Help & tour",
    "label": "Help 2 · body",
    "default": "Tap \"Take Off\" to start a simulated round with your virtual stake.",
    "type": "textarea",
    "selector": ".help-step:nth-child(2) p"
  },
  {
    "key": "help.2.title",
    "group": "Help & tour",
    "label": "Help 3 · title",
    "default": "Watch it climb",
    "type": "text",
    "selector": ".help-step:nth-child(3) strong"
  },
  {
    "key": "help.2.body",
    "group": "Help & tour",
    "label": "Help 3 · body",
    "default": "The multiplier starts at 1.00x and climbs higher into the stratosphere as the flight progresses.",
    "type": "textarea",
    "selector": ".help-step:nth-child(3) p"
  },
  {
    "key": "help.3.title",
    "group": "Help & tour",
    "label": "Help 4 · title",
    "default": "Cash out in time",
    "type": "text",
    "selector": ".help-step:nth-child(4) strong"
  },
  {
    "key": "help.3.body",
    "group": "Help & tour",
    "label": "Help 4 · body",
    "default": "Tap the cash-out button before the plane flies away to secure your win. If it flies away first, the round is lost.",
    "type": "textarea",
    "selector": ".help-step:nth-child(4) p"
  },
  {
    "key": "help.4.title",
    "group": "Help & tour",
    "label": "Help 5 · title",
    "default": "Practice with virtual credits",
    "type": "text",
    "selector": ".help-step:nth-child(5) strong"
  },
  {
    "key": "help.4.body",
    "group": "Help & tour",
    "label": "Help 5 · body",
    "default": "The activity feed and both flights are simulated. Credits cannot be withdrawn, and demo results do not predict real-money outcomes.",
    "type": "textarea",
    "selector": ".help-step:nth-child(5) p"
  },
  {
    "key": "help.title",
    "group": "Help & tour",
    "label": "Help heading",
    "default": "How to Play Aviator",
    "type": "text",
    "selector": ".help-header h3"
  },
  {
    "key": "help.replay",
    "group": "Help & tour",
    "label": "Tour button",
    "default": "🎬 Play Interactive Tour",
    "type": "text",
    "selector": "#replayTourBtn"
  },
  {
    "key": "tour.0.title",
    "group": "Help & tour",
    "label": "Tour 1 title",
    "default": "Set your stake",
    "type": "text"
  },
  {
    "key": "tour.0.body",
    "group": "Help & tour",
    "label": "Tour 1 body",
    "default": "Tap − or + to choose how much rides on the round.",
    "type": "textarea"
  },
  {
    "key": "tour.1.title",
    "group": "Help & tour",
    "label": "Tour 2 title",
    "default": "Launch the round",
    "type": "text"
  },
  {
    "key": "tour.1.body",
    "group": "Help & tour",
    "label": "Tour 2 body",
    "default": "Hit 'Take Off' to place your stake and launch the flight.",
    "type": "textarea"
  },
  {
    "key": "tour.2.title",
    "group": "Help & tour",
    "label": "Tour 3 title",
    "default": "Watch it climb",
    "type": "text"
  },
  {
    "key": "tour.2.body",
    "group": "Help & tour",
    "label": "Tour 3 body",
    "default": "The multiplier starts at 1.00x and speeds up as it rises.",
    "type": "textarea"
  },
  {
    "key": "tour.3.title",
    "group": "Help & tour",
    "label": "Tour 4 title",
    "default": "Cash out in time",
    "type": "text"
  },
  {
    "key": "tour.3.body",
    "group": "Help & tour",
    "label": "Tour 4 body",
    "default": "Tap the same button mid-flight. Too late and the bet is gone.",
    "type": "textarea"
  },
  {
    "key": "tour.4.title",
    "group": "Help & tour",
    "label": "Tour 5 title",
    "default": "Practice, not prediction",
    "type": "text"
  },
  {
    "key": "tour.4.body",
    "group": "Help & tour",
    "label": "Tour 5 body",
    "default": "Both flights and the activity feed are simulated. Credits have no cash value.",
    "type": "textarea"
  },
  {
    "key": "tour.next",
    "group": "Help & tour",
    "label": "Next button",
    "default": "Next →",
    "type": "text"
  },
  {
    "key": "tour.done",
    "group": "Help & tour",
    "label": "Finish button",
    "default": "Let’s fly! 🚀",
    "type": "text"
  },
  {
    "key": "tour.step",
    "group": "Help & tour",
    "label": "Step badge",
    "default": "STEP {step} / {total}",
    "type": "text"
  },
  {
    "key": "media.brand",
    "group": "Images & avatars",
    "label": "KIXO9 logo",
    "default": "assets/kixo9-logo.webp",
    "type": "image",
    "selector": ".k9-wordmark img",
    "attr": "src"
  },
  {
    "key": "alt.brand",
    "group": "Labels & accessibility",
    "label": "KIXO9 logo description",
    "default": "KIXO9",
    "type": "text",
    "selector": ".k9-wordmark img",
    "attr": "alt"
  },
  {
    "key": "media.aviator",
    "group": "Images & avatars",
    "label": "Aviator logo",
    "default": "assets/aviator-logo.svg",
    "type": "image",
    "selector": ".brand-logo",
    "attr": "src"
  },
  {
    "key": "alt.aviator",
    "group": "Labels & accessibility",
    "label": "Aviator logo description",
    "default": "Aviator Logo",
    "type": "text",
    "selector": ".brand-logo",
    "attr": "alt"
  },
  {
    "key": "media.favicon",
    "group": "Images & avatars",
    "label": "Browser icon",
    "default": "assets/kixo9-favicon.webp",
    "type": "image",
    "selector": "link[rel=\"icon\"]",
    "attr": "href"
  },
  {
    "key": "media.mascot",
    "group": "Images & avatars",
    "label": "Thumbs-up character",
    "default": "assets/raccoon-thumbs-up.png",
    "type": "image",
    "selector": ".pilot-character-image",
    "attr": "src"
  },
  {
    "key": "alt.mascot",
    "group": "Labels & accessibility",
    "label": "Thumbs-up character description",
    "default": "Raccoon pilot in a blue flight jacket giving a thumbs up for takeoff",
    "type": "text",
    "selector": ".pilot-character-image",
    "attr": "alt"
  },
  {
    "key": "media.plane",
    "group": "Images & avatars",
    "label": "In-game plane",
    "default": "assets/raccoon-pilot-cartoon.png",
    "type": "image",
    "selector": null,
    "attr": "src"
  },
  {
    "key": "avatar.0",
    "group": "Images & avatars",
    "label": "Player avatar 1",
    "default": "",
    "type": "image",
    "hint": "Leave empty to use the original game icon."
  },
  {
    "key": "avatar.1",
    "group": "Images & avatars",
    "label": "Player avatar 2",
    "default": "",
    "type": "image",
    "hint": "Leave empty to use the original game icon."
  },
  {
    "key": "avatar.2",
    "group": "Images & avatars",
    "label": "Player avatar 3",
    "default": "",
    "type": "image",
    "hint": "Leave empty to use the original game icon."
  },
  {
    "key": "avatar.3",
    "group": "Images & avatars",
    "label": "Player avatar 4",
    "default": "",
    "type": "image",
    "hint": "Leave empty to use the original game icon."
  },
  {
    "key": "players.names",
    "group": "Game labels",
    "label": "Player names (one per line)",
    "default": "StarChaser\nPlayer ••••7\nRaniOfRisk\nAarav_Pro\nSkyQueen\nVikram99\nLuckyAces\nViperKing\nTigerBet_88\nThunderAce\nRohan_VIP\nSpeedJet\nAnanya_7\nPilot_Kabir\nGoldFalcon\nShadowFlight\nCasinoKing_9\nPooja_Wins\nRocketMan_X\nHighRoller_8",
    "type": "textarea"
  },
  {
    "key": "color.accent",
    "group": "Colors",
    "label": "Brand blue",
    "default": "#225ef8",
    "type": "color"
  },
  {
    "key": "color.background",
    "group": "Colors",
    "label": "Page background",
    "default": "#f8f8f8",
    "type": "color"
  },
  {
    "key": "color.surface",
    "group": "Colors",
    "label": "Cards & popups",
    "default": "#ffffff",
    "type": "color"
  },
  {
    "key": "color.ink",
    "group": "Colors",
    "label": "Main text",
    "default": "#0e0f13",
    "type": "color"
  },
  {
    "key": "color.muted",
    "group": "Colors",
    "label": "Secondary text",
    "default": "#606575",
    "type": "color"
  },
  {
    "key": "color.signup",
    "group": "Colors",
    "label": "Claim button",
    "default": "#33c85d",
    "type": "color"
  },
  {
    "key": "color.signupText",
    "group": "Colors",
    "label": "Claim button text",
    "default": "#0e0f13",
    "type": "color"
  },
  {
    "key": "color.game",
    "group": "Colors",
    "label": "Game background",
    "default": "#f8f8f8",
    "type": "color"
  },
  {
    "key": "color.flight",
    "group": "Colors",
    "label": "Flight trail / flew-away",
    "default": "#e50539",
    "type": "color"
  },
  {
    "key": "color.purple",
    "group": "Colors",
    "label": "Medium multiplier",
    "default": "#913ef8",
    "type": "color"
  },
  {
    "key": "color.gold",
    "group": "Colors",
    "label": "High multiplier / cashout",
    "default": "#ffc700",
    "type": "color"
  },
  {
    "key": "color.border",
    "group": "Colors",
    "label": "Borders",
    "default": "#d8e0f8",
    "type": "color"
  },
  {
    "key": "flight.firstMin",
    "group": "Flight settings",
    "label": "Round 1 · minimum multiplier",
    "default": "1",
    "type": "number",
    "min": 1,
    "max": 1000,
    "step": 0.01,
    "hint": "Random fly-away limit. Changes affect new flights."
  },
  {
    "key": "flight.firstMax",
    "group": "Flight settings",
    "label": "Round 1 · maximum multiplier",
    "default": "1.15",
    "type": "number",
    "min": 1,
    "max": 1000,
    "step": 0.01,
    "hint": "Random fly-away limit. Changes affect new flights."
  },
  {
    "key": "flight.secondMin",
    "group": "Flight settings",
    "label": "Round 2 · minimum multiplier",
    "default": "120",
    "type": "number",
    "min": 1,
    "max": 1000,
    "step": 0.01,
    "hint": "Random fly-away limit. Changes affect new flights."
  },
  {
    "key": "flight.secondMax",
    "group": "Flight settings",
    "label": "Round 2 · maximum multiplier",
    "default": "147",
    "type": "number",
    "min": 1,
    "max": 1000,
    "step": 0.01,
    "hint": "Random fly-away limit. Changes affect new flights."
  },
  {
    "key": "flight.growthRate",
    "group": "Flight settings",
    "label": "Shared multiplier growth speed",
    "default": "0.3",
    "type": "number",
    "min": 0.01,
    "max": 5,
    "step": 0.01,
    "hint": "Both rounds use this speed. Higher values climb faster. Changes affect new flights."
  },
  {
    "key": "responsive.safeArea",
    "group": "Responsive settings",
    "label": "Respect device safe areas",
    "default": "true",
    "type": "toggle"
  },
  {
    "key": "responsive.bottomInset",
    "group": "Responsive settings",
    "label": "Extra bottom clearance (px)",
    "default": "0",
    "type": "number",
    "min": 0,
    "max": 120,
    "step": 1,
    "hint": "Additional space if a device does not report its navigation-bar inset."
  },
  {
    "key": "responsive.topInset",
    "group": "Responsive settings",
    "label": "Extra top clearance (px)",
    "default": "0",
    "type": "number",
    "min": 0,
    "max": 120,
    "step": 1,
    "hint": "Additional space if a device does not report its navigation-bar inset."
  },
  {
    "key": "responsive.sideInset",
    "group": "Responsive settings",
    "label": "Extra side clearance (px)",
    "default": "0",
    "type": "number",
    "min": 0,
    "max": 120,
    "step": 1,
    "hint": "Additional space if a device does not report its navigation-bar inset."
  },
  {
    "key": "game.checking",
    "group": "Game labels",
    "label": "Checking visitor status",
    "default": "Checking flights…",
    "type": "text"
  },
  {
    "key": "game.activeElsewhere",
    "group": "Game labels",
    "label": "Already running flight",
    "default": "Flight in progress",
    "type": "text"
  },
  {
    "key": "game.exhausted",
    "group": "Game labels",
    "label": "No chances remaining",
    "default": "Flights used",
    "type": "text"
  },
  {
    "key": "game.retry",
    "group": "Game labels",
    "label": "Network retry button",
    "default": "Retry connection",
    "type": "text"
  },
  {
    "key": "tracking.gtmCode",
    "group": "Tracking",
    "label": "Google Tag Manager code or container ID",
    "default": "",
    "type": "textarea",
    "hint": "Paste your Google GTM installation code or GTM-XXXXXXX ID. Only the container ID is saved; pasted HTML is not executed. Leave blank to disable tracking. Changes apply on the next page load."
  },
  {
    "key": "game.claimBonus",
    "group": "Game labels",
    "label": "After-win claim button",
    "default": "Claim Bonus",
    "type": "text"
  }
];const schema={fields,defaults:Object.fromEntries(fields.map(f=>[f.key,f.default]))};if(typeof module!=="undefined"&&module.exports)module.exports=schema;else root.CMSSchema=schema;})(globalThis);
