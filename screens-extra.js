/**
 * VARNIS Demo — additional screens.
 * Injected into #screens on load. Split from index.html to keep the
 * markup file readable.
 */

// Shared status-bar SVG (kept small since it repeats).
const STATUS_BAR = `
  <div class="status-bar">
    <span class="time">9:41</span>
    <span class="indicators">
      <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
        <rect x="0" y="4" width="3" height="6" rx="1"/>
        <rect x="4" y="2" width="3" height="8" rx="1"/>
        <rect x="8" y="0" width="3" height="10" rx="1"/>
      </svg>
      <svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="1" y="2" width="18" height="8" rx="2"/>
        <rect x="20" y="4" width="2" height="4" rx="1" fill="currentColor"/>
        <rect x="3" y="4" width="12" height="4" rx="1" fill="currentColor"/>
      </svg>
    </span>
  </div>`;

// Standard app bar with a back button and optional right action.
function appbar(title, opts = {}) {
  const rightHtml = opts.action || '';
  return `
    <div class="appbar">
      <button class="appbar-back" data-back>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <div class="appbar-title">${title}</div>
      ${rightHtml}
    </div>`;
}

// Bottom nav footer — where present.
function bottomNav(current) {
  const items = [
    { id: 'dashboard',  label: 'Home',      path: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
    { id: 'community',  label: 'Community', path: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0z' },
    { id: 'learning',   label: 'Learn',     path: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
    { id: 'profile',    label: 'Profile',   path: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  ];
  return `
    <div class="bottom-nav">
      ${items.map(i => `
        <button class="bottom-nav-item ${current === i.id ? 'active' : ''}" data-goto="${i.id}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="${i.path}"/>
          </svg>
          <span>${i.label}</span>
        </button>
      `).join('')}
    </div>`;
}

// ==========================================================================
// All extra screens
// ==========================================================================
const EXTRA_SCREENS = {

  // ============ 09 REPORT INCIDENT ============
  'report': `
    ${STATUS_BAR}
    ${appbar('Report an incident')}
    <div class="screen-body">
      <div class="section">
        <div class="section-title">What happened?</div>
        <div class="report-cat-row">
          <div class="report-cat active">
            <div class="report-cat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
            Phishing
          </div>
          <div class="report-cat">
            <div class="report-cat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
            Scam Call
          </div>
          <div class="report-cat">
            <div class="report-cat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
            Fake Site
          </div>
          <div class="report-cat">
            <div class="report-cat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg></div>
            Suspicious
          </div>
          <div class="report-cat">
            <div class="report-cat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8L14 12.7 10 8.7 3 15.7"/></svg></div>
            Outage
          </div>
          <div class="report-cat">
            <div class="report-cat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
            Other
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">Description</label>
          <textarea class="input" placeholder="What did you observe? Include phone numbers, URLs, or messages if you have them.">Received an SMS asking for my MoMo PIN. Sender was 656 XX XX XX claiming to be MTN support. Suspicious.</textarea>
        </div>
        <div class="input-group">
          <label class="input-label">Location (optional)</label>
          <input type="text" class="input" placeholder="Neighborhood, city" value="Bastos, Yaoundé">
        </div>
        <div class="upload-box">
          <div class="upload-box-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
          Add a photo or screenshot as evidence
        </div>
        <div class="toggle-row">
          <div class="toggle-row-body">
            <div class="toggle-row-title">Report anonymously</div>
            <div class="toggle-row-sub">Your identity will be hidden from other users</div>
          </div>
          <div class="toggle"></div>
        </div>
        <button class="btn btn-primary" data-goto="dashboard" style="margin-top:16px;">Submit report</button>
      </div>
    </div>`,

  // ============ 10 COMMUNITY ============
  'community': `
    ${STATUS_BAR}
    ${appbar('Community', { action: '<button class="appbar-action"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>' })}
    <div class="screen-body">
      <div class="section">
        <div class="post">
          <div class="post-head">
            <div class="post-avatar">JP</div>
            <div style="flex:1;">
              <div class="post-author">Officer Jean-Pierre <span class="chip chip-primary" style="margin-left:6px;">VERIFIED</span></div>
              <div class="post-meta">Yaoundé · 2h ago</div>
            </div>
          </div>
          <div class="post-body">Warning: New phishing SMS wave targeting MTN MoMo users. Never share your PIN. Official MTN staff will never ask for it over SMS or a call.</div>
          <div>
            <span class="post-tag">#SafetyTip</span>
            <span class="post-tag">#MoMo</span>
            <span class="post-tag">#Phishing</span>
          </div>
          <div class="post-actions">
            <div class="post-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> 47</div>
            <div class="post-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> 12</div>
            <div class="post-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg></div>
          </div>
        </div>
        <div class="post">
          <div class="post-head">
            <div class="post-avatar" style="background:linear-gradient(135deg,#F97316,#EC4899);">MK</div>
            <div style="flex:1;">
              <div class="post-author">Marie K.</div>
              <div class="post-meta">Douala · 6h ago</div>
            </div>
          </div>
          <div class="post-body">Has anyone else noticed a spike in fake job SMS lately? Got three yesterday promising "Cameroon Gov jobs" needing 5,000 FCFA registration fee.</div>
          <div>
            <span class="post-tag">#JobScam</span>
            <span class="post-tag">#Awareness</span>
          </div>
          <div class="post-actions">
            <div class="post-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> 23</div>
            <div class="post-action"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> 8</div>
          </div>
        </div>
        <div class="post">
          <div class="post-head">
            <div class="post-avatar" style="background:linear-gradient(135deg,#22D3EE,#3B82F6);">EN</div>
            <div style="flex:1;">
              <div class="post-author">Emmanuel N.</div>
              <div class="post-meta">Bamenda · 1d ago</div>
            </div>
          </div>
          <div class="post-body">Reminder: Dial *#06# on any phone to see the IMEI. If you're buying used, always check it against the VARNIS registry first.</div>
          <div>
            <span class="post-tag">#Recovery</span>
            <span class="post-tag">#IMEI</span>
          </div>
          <div class="post-actions">
            <div class="post-action">♥ 89</div>
            <div class="post-action">💬 21</div>
          </div>
        </div>
      </div>
    </div>
    ${bottomNav('community')}`,

  // ============ 11 NOTIFICATIONS ============
  'notifications': `
    ${STATUS_BAR}
    ${appbar('Notifications', { action: '<button class="appbar-action" style="width:auto; padding:0 10px; font-size:12px; color:var(--primary); font-weight:600;">Read all</button>' })}
    <div class="screen-body">
      <div class="section">
        <div class="notif-item unread">
          <div class="notif-icon" style="background:var(--success-light); color:var(--success);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          </div>
          <div class="notif-body">
            <div class="notif-title">Report approved</div>
            <div class="notif-text">Your phishing report CV-6681D49 was verified.</div>
            <div class="notif-time">just now</div>
          </div>
        </div>
        <div class="notif-item unread">
          <div class="notif-icon" style="background:var(--primary-light); color:var(--primary);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="notif-body">
            <div class="notif-title">Officer Jean-Pierre replied</div>
            <div class="notif-text">On your community tip about MoMo scams.</div>
            <div class="notif-time">2h ago</div>
          </div>
        </div>
        <div class="notif-item">
          <div class="notif-icon" style="background:var(--warning-light); color:var(--warning-dark);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg>
          </div>
          <div class="notif-body">
            <div class="notif-title">National Alert</div>
            <div class="notif-text">ANTIC advisory: New malware targeting Android banking apps.</div>
            <div class="notif-time">yesterday</div>
          </div>
        </div>
        <div class="notif-item">
          <div class="notif-icon" style="background:var(--primary-light); color:var(--primary);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          </div>
          <div class="notif-body">
            <div class="notif-title">New lesson available</div>
            <div class="notif-text">"How to spot phishing attempts" — 5 min read</div>
            <div class="notif-time">2 days ago</div>
          </div>
        </div>
        <div class="notif-item">
          <div class="notif-icon" style="background:var(--gray-100); color:var(--gray-600);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 6 L20 14 L12 22 L4 14 L4 6 Z"/></svg>
          </div>
          <div class="notif-body">
            <div class="notif-title">Identity verified</div>
            <div class="notif-text">Welcome to VARNIS. You now have full access.</div>
            <div class="notif-time">3 days ago</div>
          </div>
        </div>
      </div>
    </div>`,

  // ============ 12 LEARNING / SAFETY TIPS ============
  'learning': `
    ${STATUS_BAR}
    ${appbar('Safety Lessons')}
    <div class="screen-body">
      <div class="section">
        <div style="padding:16px; background:linear-gradient(135deg,var(--primary),#7C3AED); border-radius:14px; margin-bottom:16px; color:white;">
          <div style="font-size:11px; opacity:0.85; margin-bottom:4px;">CONTINUE LEARNING</div>
          <div style="font-size:16px; font-weight:700;">Digital Self-Defense 101</div>
          <div style="font-size:11px; opacity:0.85; margin-top:8px;">3 of 8 lessons complete</div>
          <div style="height:4px; background:rgba(255,255,255,0.2); border-radius:2px; margin-top:8px;">
            <div style="width:37%; height:100%; background:white; border-radius:2px;"></div>
          </div>
        </div>
        <div style="font-size:12px; font-weight:700; color:var(--gray-500); text-transform:uppercase; letter-spacing:0.1em; margin-bottom:10px; padding:0 4px;">Recommended for you</div>
        <div class="lesson-card">
          <div class="lesson-thumb" style="background:linear-gradient(135deg,var(--primary),#7C3AED);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div class="lesson-body">
            <div class="lesson-title">How to spot phishing attempts</div>
            <div class="lesson-meta">5 min · 4 modules</div>
            <div class="lesson-progress"><div class="lesson-progress-fill" style="width:60%;"></div></div>
          </div>
        </div>
        <div class="lesson-card">
          <div class="lesson-thumb" style="background:linear-gradient(135deg,#F97316,#EC4899);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div class="lesson-body">
            <div class="lesson-title">Password hygiene &amp; managers</div>
            <div class="lesson-meta">7 min · 5 modules</div>
            <div class="lesson-progress"><div class="lesson-progress-fill" style="width:0;"></div></div>
          </div>
        </div>
        <div class="lesson-card">
          <div class="lesson-thumb" style="background:linear-gradient(135deg,#22D3EE,#3B82F6);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12h8"/></svg>
          </div>
          <div class="lesson-body">
            <div class="lesson-title">Mobile Money safety essentials</div>
            <div class="lesson-meta">6 min · 4 modules · MoMo &amp; Orange</div>
            <div class="lesson-progress"><div class="lesson-progress-fill" style="width:0;"></div></div>
          </div>
        </div>
        <div class="lesson-card">
          <div class="lesson-thumb" style="background:linear-gradient(135deg,#16A34A,#22C55E);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 6 L20 14 L12 22 L4 14 L4 6 Z"/></svg>
          </div>
          <div class="lesson-body">
            <div class="lesson-title">Public Wi-Fi &amp; VPNs</div>
            <div class="lesson-meta">4 min · 3 modules</div>
            <div class="lesson-progress"><div class="lesson-progress-fill" style="width:0;"></div></div>
          </div>
        </div>
      </div>
    </div>
    ${bottomNav('learning')}`,

  // ============ 13 PROFILE ============
  'profile': `
    ${STATUS_BAR}
    <div class="screen-body">
      <div class="profile-hero">
        <div class="profile-avatar">AD</div>
        <div class="profile-name">Amie Diland</div>
        <div class="profile-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          Identity verified
        </div>
      </div>
      <div class="profile-menu">
        <button class="profile-item">
          <div class="profile-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
          <div class="profile-item-title">Account details</div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="profile-item">
          <div class="profile-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 6 L20 14 L12 22 L4 14 L4 6 Z"/></svg></div>
          <div class="profile-item-title">Identity verification (KYC)</div>
          <span class="chip chip-success" style="margin-right:8px;">Approved</span>
        </button>
        <button class="profile-item" data-goto="recovery-home">
          <div class="profile-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 6 L20 14 L12 22 L4 14 L4 6 Z"/></svg></div>
          <div class="profile-item-title">My recovery cases</div>
          <span class="chip chip-primary" style="margin-right:8px;">2</span>
        </button>
        <button class="profile-item">
          <div class="profile-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
          <div class="profile-item-title">Settings</div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="profile-item" data-goto="support">
          <div class="profile-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
          <div class="profile-item-title">Help &amp; support</div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="profile-item" style="color:var(--error-dark);">
          <div class="profile-item-icon" style="background:var(--error-light); color:var(--error);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div>
          <div class="profile-item-title">Sign out</div>
        </button>
      </div>
    </div>
    ${bottomNav('profile')}`,

  // ============ 14 SUPPORT HOME ============
  'support': `
    ${STATUS_BAR}
    ${appbar('Help &amp; Support')}
    <div class="screen-body">
      <div class="section">
        <div class="support-hero">
          <div class="support-hero-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
          <div class="support-hero-body">
            <div class="support-hero-title">How can we help?</div>
            Our team responds within a few hours during business days.
          </div>
        </div>
        <button class="recovery-tile featured" data-goto="new-ticket">
          <div class="recovery-tile-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
          <div class="recovery-tile-body">
            <div class="recovery-tile-title">Live chat with support</div>
            <div class="recovery-tile-sub">Open a ticket. Our team responds in the app.</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="recovery-tile" data-goto="faq">
          <div class="recovery-tile-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
          <div class="recovery-tile-body">
            <div class="recovery-tile-title">Browse FAQs</div>
            <div class="recovery-tile-sub">Quick answers to common questions.</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="recovery-tile">
          <div class="recovery-tile-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
          <div class="recovery-tile-body">
            <div class="recovery-tile-title">Email support</div>
            <div class="recovery-tile-sub">support@varnis.cm</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="recovery-tile">
          <div class="recovery-tile-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
          <div class="recovery-tile-body">
            <div class="recovery-tile-title">Call support</div>
            <div class="recovery-tile-sub">+237 690 00 00 00</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <div class="section-title" style="margin-top:24px;">Your open tickets</div>
        <button class="ticket-card" data-goto="ticket-detail">
          <div class="ticket-card-head">
            <span class="chip chip-primary">Pending</span>
            <span class="chip chip-gray">Medium</span>
          </div>
          <div class="ticket-card-subject">Payment not credited after MoMo transfer</div>
          <div class="ticket-card-body">Thanks for reaching out — we've received your ticket and one of our agents will get back to you shortly.</div>
          <div class="ticket-card-meta">
            <span>Payment</span>
            <span>2h ago</span>
          </div>
        </button>
      </div>
    </div>`,

  // ============ 15 FAQ ============
  'faq': `
    ${STATUS_BAR}
    ${appbar('FAQs')}
    <div class="screen-body">
      <div class="section">
        <div class="faq-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Search FAQs…
        </div>
        <div class="faq-cat-label">Getting started</div>
        <div class="faq-item">
          <div class="faq-q">What is VARNIS?</div>
          <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="faq-item">
          <div class="faq-q">Do I need to pay to use VARNIS?</div>
          <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="faq-cat-label">KYC / verification</div>
        <div class="faq-item open">
          <div style="display:flex; align-items:center; width:100%;">
            <div class="faq-q">Why do I need to verify my identity?</div>
            <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(180deg);"><path d="M6 9l6 6 6-6"/></svg>
          </div>
          <div class="faq-a">Verified users can file reports that carry weight, post to the community, and use Device Recovery. Verification is required by Cameroon Law No. 2010/013 for services handling personal data.</div>
        </div>
        <div class="faq-item">
          <div class="faq-q">What documents do I need for KYC?</div>
          <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="faq-cat-label">Device recovery</div>
        <div class="faq-item">
          <div class="faq-q">Can VARNIS actually track my stolen phone?</div>
          <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="faq-item">
          <div class="faq-q">How much does device recovery cost?</div>
          <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </div>
    </div>`,

  // ============ 16 NEW TICKET ============
  'new-ticket': `
    ${STATUS_BAR}
    ${appbar('New support ticket')}
    <div class="screen-body">
      <div class="section">
        <div class="input-group">
          <label class="input-label">Subject</label>
          <input type="text" class="input" placeholder="A short summary" value="Payment not credited after MoMo transfer">
        </div>
        <div class="input-group">
          <label class="input-label">Category</label>
          <input type="text" class="input" value="Payment" readonly>
        </div>
        <div class="input-group">
          <label class="input-label">Priority</label>
          <div style="display:flex; gap:6px;">
            <button style="padding:8px 14px; border-radius:100px; border:1px solid var(--gray-200); font-size:12px; color:var(--gray-500);">Low</button>
            <button style="padding:8px 14px; border-radius:100px; background:var(--primary); color:white; font-size:12px; font-weight:600;">Medium</button>
            <button style="padding:8px 14px; border-radius:100px; border:1px solid var(--gray-200); font-size:12px; color:var(--gray-500);">High</button>
            <button style="padding:8px 14px; border-radius:100px; border:1px solid var(--gray-200); font-size:12px; color:var(--gray-500);">Urgent</button>
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">Describe the issue</label>
          <textarea class="input" style="min-height:120px;">I sent 5,000 FCFA via MTN MoMo to 673 XX XX XX at 14:32 but my recovery case still shows "awaiting payment". Reference number MOMO-8837291.</textarea>
        </div>
        <button class="btn btn-primary" data-goto="ticket-detail">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Send
        </button>
      </div>
    </div>`,

  // ============ 17 TICKET DETAIL (CHAT) ============
  'ticket-detail': `
    ${STATUS_BAR}
    <div class="chat-header" style="display:flex; align-items:center; gap:8px;">
      <button class="appbar-back" data-back>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div style="flex:1;">
        <div class="chat-title">Payment not credited</div>
        <div class="chat-sub">Payment · Pending · Ref VN-SUP-2026-000042</div>
      </div>
    </div>
    <div class="screen-body" style="background:var(--gray-50);">
      <div class="chat-messages">
        <div class="msg msg-system">Ticket opened · Ref VN-SUP-2026-000042</div>
        <div>
          <div class="msg msg-you">I sent 5,000 FCFA via MTN MoMo to 673 XX XX XX at 14:32 but my recovery case still shows "awaiting payment". Reference number MOMO-8837291.</div>
          <div class="msg-time" style="text-align:right;">14:35</div>
        </div>
        <div>
          <div style="font-size:10px; color:var(--gray-500); font-weight:600; margin-bottom:3px; margin-left:4px;">VARNIS Support</div>
          <div class="msg msg-them">Thanks for reaching out — we've received your ticket and one of our agents will get back to you shortly. Reference: VN-SUP-2026-000042</div>
          <div class="msg-time">14:36</div>
        </div>
        <div>
          <div style="font-size:10px; color:var(--gray-500); font-weight:600; margin-bottom:3px; margin-left:4px;">Agent Rose</div>
          <div class="msg msg-them">Hi Amie, I've located the transaction. It's showing on our end but wasn't linked to your case due to a mismatched reference. Fixing now — please refresh your Recovery Center in 2 minutes.</div>
          <div class="msg-time">15:02</div>
        </div>
        <div>
          <div class="msg msg-you">Thank you! Just checked — it's now showing as approved. 🙏</div>
          <div class="msg-time" style="text-align:right;">15:04</div>
        </div>
      </div>
    </div>
    <div class="chat-input">
      <input type="text" class="input" placeholder="Type a reply…">
      <button class="chat-send">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>`,

  // ============ 18 RECOVERY HOME ============
  'recovery-home': `
    ${STATUS_BAR}
    ${appbar('Recovery Center')}
    <div class="screen-body">
      <div class="section">
        <div class="recovery-disclaimer">
          <div class="recovery-disclaimer-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></div>
          <div class="recovery-disclaimer-text"><strong>VARNIS doesn't track devices directly.</strong> We verify your request, publish the IMEI to buyers, and forward approved cases to ANTIC's cybersecurity division under Cameroon Law 2010/012.</div>
        </div>
        <button class="recovery-tile featured" data-goto="ownership">
          <div class="recovery-tile-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></div>
          <div class="recovery-tile-body">
            <div class="recovery-tile-title">File a new recovery request</div>
            <div class="recovery-tile-sub">Report a lost or stolen device / vehicle.</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="recovery-tile" data-goto="imei-check">
          <div class="recovery-tile-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
          <div class="recovery-tile-body">
            <div class="recovery-tile-title">Check IMEI before buying</div>
            <div class="recovery-tile-sub">Verify a used phone hasn't been reported stolen.</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="recovery-tile">
          <div class="recovery-tile-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
          <div class="recovery-tile-body">
            <div class="recovery-tile-title">My cases</div>
            <div class="recovery-tile-sub">2 cases · 1 active</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <div class="section-title" style="margin-top:20px;">Recent cases</div>
        <button class="recovery-tile" data-goto="case-detail">
          <div class="recovery-tile-icon" style="background:var(--gray-100); color:var(--gray-500);"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></div>
          <div class="recovery-tile-body">
            <div class="recovery-tile-title">Samsung Galaxy A54</div>
            <div class="recovery-tile-sub" style="color:var(--primary); font-weight:600;">Sent to authorities</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>`,

  // ============ 19 OWNERSHIP VERIFICATION ============
  'ownership': `
    ${STATUS_BAR}
    ${appbar('Ownership Verification')}
    <div class="screen-body">
      <div class="section">
        <div class="recovery-disclaimer">
          <div class="recovery-disclaimer-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 6 L20 14 L12 22 L4 14 L4 6 Z"/></svg></div>
          <div class="recovery-disclaimer-text">We verify that you're authorized to file this report. At least 2 of 3 owner fields must match.</div>
        </div>
        <div class="input-label" style="margin-bottom:8px;">Whose device is this for?</div>
        <div class="seg">
          <button class="active">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Mine
          </button>
          <button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Helping
          </button>
        </div>
        <div class="input-group">
          <label class="input-label">Your full name</label>
          <input type="text" class="input" value="Amie Diland">
        </div>
        <div class="input-group">
          <label class="input-label">Your phone number</label>
          <input type="tel" class="input" value="+237 690 12 34 56">
        </div>
        <div class="input-group">
          <label class="input-label">Your VARNIS password</label>
          <input type="password" class="input" value="••••••••••">
        </div>
        <button class="btn btn-primary" data-goto="category">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 6 L20 14 L12 22 L4 14 L4 6 Z"/></svg>
          Verify ownership
        </button>
      </div>
    </div>`,

  // ============ 20 ASSET CATEGORY ============
  'category': `
    ${STATUS_BAR}
    ${appbar('What are you reporting?')}
    <div class="screen-body">
      <div class="section">
        <div style="font-size:13px; color:var(--gray-500); margin-bottom:16px; padding:0 4px;">Choose the category that best matches your item.</div>
        <button class="category-card" data-goto="device-form">
          <div class="category-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></div>
          <div style="flex:1;">
            <div class="category-title">Electronic Device</div>
            <div class="category-sub">Phone, laptop, tablet, camera, drone, console…</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <button class="category-card">
          <div class="category-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg></div>
          <div style="flex:1;">
            <div class="category-title">Vehicle</div>
            <div class="category-sub">Motorcycle, car, truck, bus…</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>`,

  // ============ 21 ELECTRONIC DEVICE FORM ============
  'device-form': `
    ${STATUS_BAR}
    ${appbar('Electronic Device')}
    <div class="screen-body">
      <div class="section">
        <div class="input-group">
          <label class="input-label">Device type</label>
          <input type="text" class="input" value="Phone / Smartphone" readonly>
        </div>
        <div class="input-group">
          <label class="input-label">Brand</label>
          <input type="text" class="input" value="Samsung">
        </div>
        <div class="input-group">
          <label class="input-label">Model</label>
          <input type="text" class="input" value="Galaxy A54">
        </div>
        <div class="input-group">
          <label class="input-label">Color</label>
          <input type="text" class="input" value="Awesome Black">
        </div>
        <div class="input-group">
          <label class="input-label">IMEI (dial *#06# on the phone)</label>
          <input type="text" class="input" value="356938035643809" style="font-family:ui-monospace,'SF Mono',monospace;">
          <div class="input-hint" style="color:var(--success);">✓ Valid IMEI (Luhn checksum passed)</div>
        </div>
        <div class="input-group">
          <label class="input-label">Serial number (optional)</label>
          <input type="text" class="input" placeholder="Optional">
        </div>
        <div class="input-label">Ownership receipt</div>
        <div style="padding:12px; background:var(--white); border:1.5px solid var(--success); border-radius:12px; display:flex; align-items:center; gap:12px; margin-top:8px;">
          <div style="width:56px; height:56px; border-radius:8px; background:var(--gray-100); display:grid; place-items:center; color:var(--gray-500);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div style="flex:1; font-size:13px;">Receipt attached — tap to change</div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
        </div>
        <button class="btn btn-primary" style="margin-top:20px;" data-goto="review">Continue</button>
      </div>
    </div>`,

  // ============ 22 REVIEW ============
  'review': `
    ${STATUS_BAR}
    ${appbar('Review &amp; submit')}
    <div class="screen-body">
      <div class="section">
        <div class="review-summary">
          <div class="review-row"><div class="review-row-label">Item</div><div class="review-row-value">Phone / Smartphone · Samsung Galaxy A54</div></div>
          <div class="review-row"><div class="review-row-label">Color</div><div class="review-row-value">Awesome Black</div></div>
          <div class="review-row"><div class="review-row-label">IMEI</div><div class="review-row-value" style="font-family:ui-monospace,monospace;">356938035643809</div></div>
          <div class="review-row"><div class="review-row-label">Document</div><div class="review-row-value">Receipt attached ✓</div></div>
        </div>
        <div style="text-align:center; padding:12px; background:var(--gray-100); border-radius:12px; color:var(--gray-500); font-size:11px; margin-bottom:12px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Preview of receipt.jpg
        </div>
        <div class="fee-box">
          <div class="fee-box-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="fee-box-label">Tracking fee</div>
          <div class="fee-box-value">5,000 FCFA</div>
        </div>
        <div class="warning-box">
          <div class="warning-box-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <div class="warning-box-text">Test mode — no real money is charged. Real payment goes live once the ANTIC MoU + terms of service are signed.</div>
        </div>
        <button class="btn btn-primary" style="margin-top:20px;" data-goto="payment">
          Submit and continue to payment
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>`,

  // ============ 23 PAYMENT ============
  'payment': `
    ${STATUS_BAR}
    ${appbar('Payment')}
    <div class="screen-body">
      <div class="section">
        <div class="amount-hero">
          <div class="amount-hero-label">AMOUNT TO PAY</div>
          <div class="amount-hero-value">5,000 FCFA</div>
        </div>
        <div class="input-label" style="margin-bottom:8px;">Payment method</div>
        <button class="method-card">
          <div class="method-icon mtn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
          <div class="method-name">MTN Mobile Money</div>
          <div class="method-radio"></div>
        </button>
        <button class="method-card selected">
          <div class="method-icon orange"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
          <div class="method-name">Orange Money</div>
          <div class="method-radio"></div>
        </button>
        <div class="pay-instr">
          <div class="pay-instr-title">How to pay</div>
          <div class="pay-instr-step">1. Open your Orange Money app and send</div>
          <div style="font-size:15px; font-weight:800; color:var(--primary); margin:4px 0;">5,000 FCFA to:</div>
          <div class="merchant-box">
            <div>
              <div class="merchant-num">693 XX XX XX</div>
              <div class="merchant-name">VARNIS RECOVERY</div>
            </div>
            <button class="merchant-copy" style="margin-left:auto;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
          </div>
          <div class="pay-instr-step">2. Take a screenshot of the successful transaction.</div>
          <div class="pay-instr-step">3. Enter your phone number and upload the screenshot below.</div>
        </div>
        <div class="input-group">
          <label class="input-label">Your Orange Money phone number</label>
          <input type="tel" class="input" placeholder="69X XX XX XX" value="690 12 34 56">
        </div>
        <div class="upload-box" style="border-color:var(--success); background:var(--success-light); color:var(--success-dark);">
          <div class="upload-box-icon" style="color:var(--success);">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          </div>
          Payment screenshot attached ✓
        </div>
        <button class="btn btn-primary" data-goto="case-detail">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Submit payment proof
        </button>
      </div>
    </div>`,

  // ============ 24 CASE DETAIL ============
  'case-detail': `
    ${STATUS_BAR}
    ${appbar('Case')}
    <div class="screen-body">
      <div class="section">
        <div style="padding:14px; background:var(--white); border:1px solid var(--gray-200); border-radius:14px; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--primary);"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            <div style="flex:1; font-size:15px; font-weight:700; color:var(--gray-900);">Phone · Samsung Galaxy A54</div>
          </div>
          <div style="display:flex; gap:6px; margin-bottom:8px;">
            <span class="chip chip-primary">Sent to authorities</span>
            <span class="chip chip-gray">Standard tier</span>
          </div>
          <div style="font-size:11px; color:var(--gray-500);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18M9 21V9"/></svg>
            Ref VN-TRK-2026-000101
          </div>
        </div>
        <div style="padding:14px; background:var(--primary-light); border-radius:12px; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:8px; color:var(--primary); margin-bottom:6px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div style="font-size:13px; font-weight:700;">Under investigation</div>
          </div>
          <div style="font-size:11px; color:var(--primary); line-height:1.5;">ANTIC is coordinating with mobile operators to trace the device. Updates depend on network activity.</div>
          <div style="font-size:10px; color:var(--primary); margin-top:8px; opacity:0.85;">Next update: in ~30 hours</div>
        </div>
        <div class="timeline">
          <div class="timeline-title">Timeline</div>
          <div class="timeline-item">
            <div class="timeline-dot-col"><div class="timeline-dot"></div><div class="timeline-line"></div></div>
            <div class="timeline-body">
              <div class="timeline-label">Ownership verified</div>
              <div class="timeline-meta">Jul 12, 14:22</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot-col"><div class="timeline-dot"></div><div class="timeline-line"></div></div>
            <div class="timeline-body">
              <div class="timeline-label">Payment submitted</div>
              <div class="timeline-meta">Jul 13, 09:15 · You</div>
              <div class="timeline-note">Orange Money · 5,000 FCFA</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot-col"><div class="timeline-dot"></div><div class="timeline-line"></div></div>
            <div class="timeline-body">
              <div class="timeline-label">Payment approved</div>
              <div class="timeline-meta">Jul 14, 11:03 · Mod. Alice</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot-col"><div class="timeline-dot"></div><div class="timeline-line"></div></div>
            <div class="timeline-body">
              <div class="timeline-label">Sent to ANTIC</div>
              <div class="timeline-meta">Jul 14, 11:12</div>
              <div class="timeline-note">Reference ANTIC-2026-0451</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot-col"><div class="timeline-dot"></div></div>
            <div class="timeline-body">
              <div class="timeline-label">Under investigation</div>
              <div class="timeline-meta">Jul 15, 08:00</div>
            </div>
          </div>
        </div>
        <div class="antic-badge">
          <div class="antic-badge-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 6 L20 14 L12 22 L4 14 L4 6 Z"/></svg></div>
          <div>
            <div class="antic-badge-title">Forwarded to ANTIC</div>
            <div class="antic-badge-ref">Reference: ANTIC-2026-0451</div>
          </div>
        </div>
      </div>
    </div>`,

  // ============ 25 IMEI CHECK ============
  'imei-check': `
    ${STATUS_BAR}
    ${appbar('Check IMEI')}
    <div class="screen-body">
      <div class="section">
        <div class="imei-hero">
          <div class="imei-hero-title">Before buying a used phone</div>
          <div class="imei-hero-desc">Ask the seller to dial *#06# to reveal the IMEI. Enter it below to check whether it's been reported stolen in Cameroon.</div>
        </div>
        <div class="input-group">
          <label class="input-label">IMEI (15 digits)</label>
          <input type="text" class="input" value="356938035643809" style="font-family:ui-monospace,'SF Mono',monospace;">
        </div>
        <button class="btn btn-primary" id="imei-check-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Check IMEI
        </button>
        <div class="imei-result stolen">
          <div class="imei-result-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Reported stolen
          </div>
          <div class="imei-result-desc">This device was reported STOLEN in the VARNIS registry. Do not purchase. Contact the police if the seller insists.</div>
        </div>
        <div class="imei-samples">
          <div class="imei-samples-label">Sample IMEIs for testing:</div>
          <button class="imei-sample">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span class="imei-sample-num">356938035643809</span>
            <span class="imei-sample-label">Reported stolen (Samsung Galaxy A54)</span>
          </button>
          <button class="imei-sample">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span class="imei-sample-num">490154203237518</span>
            <span class="imei-sample-label">Previously reported (recovered)</span>
          </button>
          <button class="imei-sample">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-400);"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span class="imei-sample-num">359123456789012</span>
            <span class="imei-sample-label">Not registered</span>
          </button>
        </div>
      </div>
    </div>`,
};

// Inject all extra screens into the DOM
(function injectScreens() {
  const container = document.getElementById('screens');
  if (!container) return;
  for (const [id, html] of Object.entries(EXTRA_SCREENS)) {
    const section = document.createElement('section');
    section.className = 'screen';
    section.dataset.screen = id;
    section.innerHTML = html;
    container.appendChild(section);
  }
})();
