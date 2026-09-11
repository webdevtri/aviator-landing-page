# KIXO9 × Aviator campaign

Brand source: `../K9-brand guidelines/KIXO9 Brand Guidelines.dc.html`, v1.0, September 2026. Uses the supplied logo and favicon, Bone #F8F8F8, Ink #0E0F13, Blue #225EF8, registration green #33C85D with an ink label, Inter UI text and the guide's Saira Condensed display substitute. Aviator retains its own red logo and plane.

The user supplied the 500% welcome offer and https://www.kixo9.com/signup as the registration destination. The completed-flight popup uses this destination. The main-page offer and signup CTA have been replaced with the requested pilot greeting. The scripted two-round demo awards no real-money bonus; fabricated countdown, licence and payout assertions and the simulated claim-success alert were removed from the visible flow.

Policy content is in `js/kixo9.js`. Native dialog popups support keyboard focus, Escape, close button, backdrop dismissal and focus return. Longer notices paginate automatically when necessary so small screens do not require scrolling.

## Required campaign information

The implementation does not certify Google Ads or Meta eligibility. The following details were not supplied and must replace the clearly identified gaps before public launch:

- Legal operator name, registered address, registration number, regulator and licence number, reproduced verbatim as required by the brand guide.
- Support and privacy contact, retention periods and the final privacy notice.
- Full 500% promotion conditions: eligibility, deposit requirements, cap, wagering rules, game exclusions, withdrawal rules and expiry.
- Permitted target jurisdictions and applicable platform gambling permissions/certification. A real-money brand promotion with a demo is not automatically eligible for Google's social-casino category.

No Meta Pixel, Google Ads tag or optional analytics was installed. Reassess the privacy/cookie notices and consent requirements if tracking changes.

Primary policy reference: https://support.google.com/adspolicy/answer/6018017 . Meta's policy endpoint could not be retrieved during this edit; current Meta requirements must be checked before launch.

The original backend remains in place. It stores demo sessions; the legacy bonus-claim endpoint is no longer called by this landing-page flow. Existing database content is not reset by the redesign.

Flight pacing: both rounds use the same exponential multiplier curve, exp(0.3 × elapsed seconds), with random fly-away limits of 1.00–1.15× and 120–147×. Duration follows from the chosen limit. Chatter and post-cashout milestone reactions continue during flight. A successful second-round cashout opens the reward only after the plane flies away. Closing retains the win; bet controls and Take Off reopen that reward instead of starting another round.
