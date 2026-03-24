import '../style.css';
import { auth, clients, tracking, proposals, email, documents, gem, safeJ } from './services/api.js';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import gsap from 'gsap';

/* ══ CONFIG ══ */
const DEPLOY_URL = (import.meta.env.VITE_DEPLOY_URL || window.location.origin).replace(/\/$/, '');

/* ══ STATE ══ */
let allClients = [];
let cli = null, prof = null, convo = [], reqs = null, sol = null;
let phase = 'login', rn = 0, discoveryComplete = false;
let pendingBlob = null, pendingName = '';
let fileContent = '';
let currentTrackingClient = null;
let activeClientId = null;

/* ══ ENHANCED ZOHO KNOWLEDGE BASE WITH NATURAL LANGUAGE UNDERSTANDING ══ */
const ZK = `You are a high-performing Senior Presales Solutions Architect at Fristine Infotech (India's leading Premium Zoho Partner, 10 years, 200+ implementations).

YOUR COMPANY — FRISTINE INFOTECH:
- India's leading Premium Zoho Partner
- Awards: Zoho Creator Partner Award 2021 — Innovator of the Year & Regional Champion (ANZ)
- Key clients: eBay, Pepperfry, Edelweiss, YES Securities, Mahindra Solarize, NPCI, Jio, Suzlon, Mercedes-Benz, Samsonite, TATA MD, CARE Ratings, CRISIL, TeamLease, Transasia

YOUR MISSION:
Conduct a strategic discovery session. Move beyond "features" and uncover "business value". Use the MEDDPICC framework naturally in conversation without being robotic.

ZOHO PRODUCTS PRICING:
• Zoho CRM — $14/$23/$40/$52/user/month
• Zoho Books — Free/$15/$40/org/month
• Zoho Desk — Free/$14/$23/$40/agent/month
• Zoho Projects — Free/$4/$9/user/month
• Zoho Inventory — $39/$99/org/month
• Zoho People — Free/$1.25/$2/$3/user/month
• Zoho Analytics — $22/$45/$112/month
• Zoho Campaigns — Free/$3/$4.5/month
• Zoho Sign — $10/$20/month
• Zoho Creator — $8/$20/user/month
• Zoho Flow — Free/$10/$25/month
• Zoho One — $37/user/month (all employees) or $90 flexible
• Zoho Bigin — $7/$12/user/month

⚡ ENHANCED NATURAL LANGUAGE UNDERSTANDING:

1. INTERPRET CASUAL & INFORMAL LANGUAGE:
   - Understand slang: "kinda", "sorta", "tbh" (to be honest), "ngl" (not gonna lie), "rn" (right now), "atm" (at the moment), "idk" (I don't know), "smth" (something)
   - Parse numbers casually mentioned: "like 50 people", "maybe 30 users", "around 100"
   - Recognize informal pain points: "it's a mess", "driving us crazy", "waste of time", "super frustrating"
   
   Examples:
   - "rn we're using excel" → current_tools: ["Excel"]
   - "we have like 50 ppl" → user_count: ~50
   - "tbh our crm sucks" → pain_point: "Dissatisfaction with current CRM"

2. HANDLE TYPOS & MISSPELLINGS:
   Don't get confused by common typos:
   - manegment → management
   - custemer → customer
   - recieve → receive
   - seperate → separate
   - definitly → definitely
   - loose → lose (in context: "we loose deals")

3. UNDERSTAND CONTEXT & IMPLICIT MEANING:
   Infer requirements from context:
   - "we lose deals at the last minute" → pain_point: "Late-stage deal losses", need: "Better pipeline visibility"
   - "everyone uses their own spreadsheet" → pain_point: "Data fragmentation", need: "Centralized system"
   - "manual work is killing us" → automation_opportunities: HIGH
   - "can't see what's happening" → need: "Reporting & dashboards"
   - "too slow to respond to leads" → pain_point: "Slow response time", need: "Lead routing automation"

4. EXTRACT MULTIPLE INTENTS FROM ONE MESSAGE:
   Parse compound statements:
   - "we're a 50-person manufacturing company using quickbooks and excel and it's chaotic" →
     * industry: "Manufacturing"
     * user_count: 50
     * current_tools: ["QuickBooks", "Excel"]
     * pain_point: "Operational chaos/disorganization"

5. RECOGNIZE IMPLICIT REQUIREMENTS:
   Infer needs from business context:
   - "we're scaling fast" → needs: scalability, automation, better processes
   - "getting more complex" → needs: better organization, workflow management
   - "hiring more people" → needs: onboarding, team collaboration tools
   - "expanding to new markets" → needs: multi-currency, localization

6. BE CONVERSATIONAL & EMPATHETIC:
   - Match the user's tone (casual ↔ casual, formal ↔ formal)
   - Acknowledge emotions: "I totally understand how frustrating that must be"
   - Use natural transitions: "Got it!", "Makes sense", "That's a common challenge"
   - Avoid robotic language: DON'T say "I comprehend your requirements" → DO say "I hear you"

7. ASK SMART, NATURAL FOLLOW-UPS:
   Instead of: "What is your exact user count?"
   Say: "Just to get a sense of scale — roughly how many people would be using this?"
   
   Instead of: "Please enumerate your pain points"
   Say: "What's the biggest headache this is causing you right now?"

8. EXTRACT STRUCTURED DATA FROM CASUAL CONVERSATION:
   Transform unstructured input into structured requirements:
   
   Input: "so basically we're drowning in spreadsheets and everyone's doing their own thing and we can't track anything properly"
   Extract: {
     current_tools: ["Excel/Spreadsheets"],
     pain_points: ["Data fragmentation", "Lack of visibility", "Inconsistent processes"],
     must_have: ["Centralized data management", "Reporting/tracking capability"]
   }

CONSULTATION RULES:
1. BE WARM & CONVERSATIONAL: Talk like a helpful colleague, not a robot. Use natural language.
2. KEEP IT BRIEF: 2-4 sentences maximum. Be conversational and engaging.
3. ONE QUESTION AT A TIME: Don't overwhelm with multiple questions. Focus on ONE thing.
4. ACKNOWLEDGE WHAT THEY SAID: Always acknowledge the user's input before asking the next question.
5. MEDDPICC NATURALLY: Uncover Pain, Metrics, Decision process through natural conversation.
6. JSON TRIGGER: After 4-6 meaningful exchanges (when you have enough information), output REQUIREMENTS_COMPLETE followed by JSON:
{
  "business_overview": "A detailed 3-5 sentence narrative describing the core business goals and challenges.",
  "departments": ["Sales (5 users)", "Marketing (3 users)"],
  "current_tools": ["Legacy ERP system", "Manual spreadsheets for tracking"],
  "pain_points": ["Highly manual data entry causing errors", "No real-time visibility into inventory"],
  "must_have": ["Automated quotation generation", "Centralized customer database", "Mobile access for field team"],
  "nice_to_have": ["Integration with legacy accounting", "Advanced forecasting dashboards"],
  "automation_opportunities": ["Automated email follow-ups for quotes", "Inventory sync triggers"],
  "integrations": ["QuickBooks Online", "Custom internal ERP via API"],
  "success_metrics": ["Reduce quote creation time by 50%", "Increase sales conversion by 20%"],
  "zoho_products": ["Zoho CRM", "Zoho Books", "Zoho Creator"],
  "user_count": 50,
  "industry": "Manufacturing",
  "summary": "Full digital transformation of sales and inventory processes."
}

7. HIGHLY DETAILED ARRAYS: You MUST output at least 3-6 items for each array above. Do NOT use brief 1-word summaries. Provide descriptive, multi-word contextual items based on the user pain points.

CONVERSATION FLOW:
- Rounds 1-2: Understand current pain & situation (be empathetic!)
- Rounds 3-4: Dig into specific needs, metrics, goals (ask smart questions!)
- Rounds 5-6: Verify understanding, fill gaps, then REQUIREMENTS_COMPLETE

QUALITY CHECKLIST BEFORE RESPONDING:
✓ Did I acknowledge what the user just said?
✓ Is my response natural and conversational (not robotic)?
✓ Am I asking ONE clear question (not a list)?
✓ Would a real human consultant say this?
✓ Am I being helpful and empathetic?`;

/* ══ BOOT ══ */
async function init() {
    initTheme();
    initPasswordToggle();
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('client');

    if (clientId) {
        activeClientId = clientId;
        await bootClientSession(clientId);
    } else {
        await bootStaffLogin();
    }
}

async function bootStaffLogin() {
    showLdr('Connecting to portal…');
    try {
        allClients = await clients.list();
        setSS('ok', `Connected · ${allClients.length} clients loaded`);
        const activeAgent = localStorage.getItem('f_active_agent');
        if (activeAgent) {
            startStaffPortal(activeAgent);
        }
    } catch (e) {
        setSS('er', 'Could not connect to backend — is the server running?');
        console.error('[Boot]', e);
    }
    hideLdr();
}

async function bootClientSession(clientId) {
    showLdr('Loading your session…');
    try {
        allClients = await clients.list();
    } catch (e) {
        console.warn('[Boot] client list failed', e);
    }

    const found = allClients.find(c => (c.client_id || '').toLowerCase() === clientId.toLowerCase());
    if (found) {
        cli = found;
        await tracking.logEvent(clientId, 'bot_accessed');
        startSession();
    } else {
        show('L');
        setSS('er', 'Invalid session link. Contact Fristine Infotech.');
        document.getElementById('em').closest('.field').style.display = 'none';
        document.getElementById('pw').closest('.field').style.display = 'none';
        document.getElementById('loginBtn').style.display = 'none';
    }
    hideLdr();
}

/* ══ AUTH ══ */
function setSS(type, txt) {
    const el = document.getElementById('ss');
    el.className = 'conn-status ' + type;
    document.getElementById('stxt').textContent = txt;
    const dot = document.getElementById('sdot');
    dot.className = type === 'ok' ? 'cs-dot' : 'cs-dot spin';
}

document.getElementById('loginBtn').addEventListener('click', async () => {
    const em = document.getElementById('em').value.trim().toLowerCase();
    const pw = document.getElementById('pw').value.trim();
    const err = document.getElementById('lerr');
    err.textContent = '';

    if (!em.endsWith('@fristinetech.com')) {
        err.textContent = 'Access restricted to @fristinetech.com accounts.';
        return;
    }

    const btn = document.getElementById('loginBtn');
    btn.disabled = true; btn.querySelector('span').textContent = 'Signing in…';

    try {
        const check = await auth.check(em);
        if (!check.hasPassword) {
            // First time — go to set password screen
            hide('L'); show('SP');
            document.getElementById('sp-email-show').textContent = `Setting up account for ${em}`;
            document.getElementById('SP').dataset.email = em;
            if (pw) document.getElementById('sp-pw1').value = pw;
            return;
        }

        await auth.login(em, pw);
        localStorage.setItem('f_active_agent', em);
        allClients = await clients.list();
        startStaffPortal(em);
    } catch (e) {
        if (e.data?.error === 'NO_PASSWORD') {
            hide('L'); show('SP');
            document.getElementById('sp-email-show').textContent = `Setting up account for ${em}`;
            document.getElementById('SP').dataset.email = em;
        } else if (e.data?.error === 'WRONG_PASSWORD') {
            err.textContent = 'Incorrect password. Use "Forgot Password?" to reset.';
        } else {
            err.textContent = e.message || 'Login failed. Is the backend running?';
        }
    } finally {
        btn.disabled = false; btn.querySelector('span').textContent = 'Sign In';
    }
});

document.getElementById('pw').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

document.getElementById('forgotLink').addEventListener('click', () => {
    hide('L'); show('FP');
    document.getElementById('fp-form-wrap').style.display = '';
    document.getElementById('fp-success').classList.add('hidden');
});

document.getElementById('setPwBtn').addEventListener('click', async () => {
    const email_ = document.getElementById('SP').dataset.email;
    const pw1 = document.getElementById('sp-pw1').value.trim();
    const pw2 = document.getElementById('sp-pw2').value.trim();
    const err = document.getElementById('sp-err');
    err.textContent = '';
    if (pw1.length < 8) { err.textContent = 'Password must be at least 8 characters.'; return; }
    if (pw1 !== pw2)    { err.textContent = 'Passwords do not match.'; return; }
    try {
        await auth.setPassword(email_, pw1);
        localStorage.setItem('f_active_agent', email_);
        allClients = await clients.list();
        hide('SP');
        startStaffPortal(email_);
    } catch (e) {
        err.textContent = e.message;
    }
});

document.getElementById('resetPwBtn').addEventListener('click', async () => {
    const em   = document.getElementById('fp-em').value.trim().toLowerCase();
    const pw1  = document.getElementById('fp-pw1').value.trim();
    const pw2  = document.getElementById('fp-pw2').value.trim();
    const err  = document.getElementById('fp-err');
    err.textContent = '';
    if (!em.endsWith('@fristinetech.com')) { err.textContent = 'Must be a @fristinetech.com email.'; return; }
    if (pw1.length < 8) { err.textContent = 'Password must be at least 8 characters.'; return; }
    if (pw1 !== pw2)    { err.textContent = 'Passwords do not match.'; return; }
    try {
        await auth.setPassword(em, pw1);
        document.getElementById('fp-form-wrap').style.display = 'none';
        document.getElementById('fp-success').classList.remove('hidden');
    } catch (e) {
        err.textContent = e.message;
    }
});

document.getElementById('backToLoginFromFP').addEventListener('click', () => { hide('FP'); show('L'); });
document.getElementById('backToLoginBtn2').addEventListener('click', () => { hide('FP'); show('L'); });

/* ══ STAFF PORTAL ══ */
async function startStaffPortal(agentEmail) {
    if (agentEmail) document.getElementById('agentChip').textContent = agentEmail.split('@')[0];
    hide('L'); hide('SP'); hide('FP');
    show('H');
    await renderClientTable();
    animateDashboardEntrance();
}

function animateDashboardEntrance() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(c => c.classList.add('anim-in'));

    gsap.from('.dash-topbar', { opacity: 0, y: -20, duration: 0.5, ease: 'power3.out' });
    gsap.from('.table-wrap', { opacity: 0, y: 20, duration: 0.5, delay: 0.3, ease: 'power3.out' });
}

async function renderClientTable(filter = '') {
    const tbody = document.getElementById('clientTableBody');
    try {
        allClients = await clients.list();
    } catch (e) {
        console.warn('[Table] Could not refresh clients:', e);
    }

    const filtered = filter
        ? allClients.filter(c =>
            (c.company || '').toLowerCase().includes(filter) ||
            (c.email || '').toLowerCase().includes(filter) ||
            (c.industry || '').toLowerCase().includes(filter))
        : allClients;

    document.getElementById('clientCount').textContent = `${allClients.length} clients in pipeline`;
    document.getElementById('statTotal').textContent = allClients.length;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="tbl-empty">${filter ? 'No results found.' : 'No clients yet. Add a lead to get started.'}</td></tr>`;
        document.getElementById('statSent').textContent = '0';
        document.getElementById('statActive').textContent = '0';
        document.getElementById('statProposal').textContent = '0';
        return;
    }

    let sentCount = 0, activeCount = 0, proposalCount = 0;
    tbody.innerHTML = '';

    for (const client of filtered) {
        const clientId = client.client_id || '';
        let evts = [];
        try { evts = await tracking.getEvents(clientId); } catch {}
        const status = getClientStatus(evts);

        if (status.sent)     sentCount++;
        if (status.active)   activeCount++;
        if (status.proposal) proposalCount++;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="tbl-co-wrap">
                    <div class="tbl-co-ico">${(client.company || '?')[0].toUpperCase()}</div>
                    <div>
                        <div class="tbl-co-name">${client.company || '—'}</div>
                        <div class="tbl-co-id">${clientId || '—'}</div>
                    </div>
                </div>
            </td>
            <td><span class="tbl-industry">${client.industry || '—'}</span></td>
            <td><span class="tbl-email">${client.email || '—'}</span></td>
            <td>${renderStatusBadge(status)}</td>
            <td>
                <div class="tbl-actions">
                    <button class="btn-tbl btn-tbl-send">Send Bot</button>
                    <button class="btn-tbl btn-tbl-track">Track</button>
                    <button class="btn-tbl btn-tbl-del">Delete</button>
                </div>
            </td>`;
        tbody.appendChild(tr);
        tr.querySelector('.btn-tbl-send').onclick  = () => sendBotEmail(clientId);
        tr.querySelector('.btn-tbl-track').onclick = () => openTracking(clientId);
        tr.querySelector('.btn-tbl-del').onclick   = () => deleteLead(clientId);
        tr.querySelector('.tbl-co-name').onclick   = () => openTracking(clientId);
    }

    document.getElementById('statSent').textContent    = sentCount;
    document.getElementById('statActive').textContent  = activeCount;
    document.getElementById('statProposal').textContent = proposalCount;

    // Animate table rows in with stagger
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, i) => {
        setTimeout(() => row.classList.add('anim-in'), i * 50);
    });
}

function getClientStatus(events) {
    const names = events.map(e => e.event);
    return {
        sent:     names.includes('bot_sent'),
        accessed: names.includes('bot_accessed'),
        active:   names.includes('conversation_started'),
        proposal: names.includes('proposal_generated'),
        submitted:names.includes('proposal_submitted'),
    };
}

function renderStatusBadge(s) {
    if (s.submitted) return '<span class="badge badge-done"><svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M3.5 8l3 3 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Submitted</span>';
    if (s.proposal)  return '<span class="badge badge-proposal"><svg viewBox="0 0 16 16" width="12" height="12" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> Proposal Ready</span>';
    if (s.active)    return '<span class="badge badge-active"><svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M2 4h12v7a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" stroke="currentColor" stroke-width="1.5"/><path d="M5 7.5h6M5 10h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> In Session</span>';
    if (s.accessed)  return '<span class="badge badge-accessed"><svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M8 3C4 3 1 8 1 8s3 5 7 5 7-5 7-5-3-5-7-5z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg> Accessed</span>';
    if (s.sent)      return '<span class="badge badge-sent"><svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M2 4l6 4 6-4M2 4h12v8H2V4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Sent</span>';
    return '<span class="badge badge-pending"><svg viewBox="0 0 16 16" width="12" height="12" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Not Started</span>';
}

/* ── Search ── */
document.getElementById('searchInput').addEventListener('input', e => {
    renderClientTable(e.target.value.trim().toLowerCase());
});
document.getElementById('refreshBtn').addEventListener('click', () => renderClientTable());

/* ══ SEND BOT EMAIL ══ */
async function sendBotEmail(clientId) {
    const client = allClients.find(c => c.client_id === clientId);
    if (!client) return;
    const botUrl = `${DEPLOY_URL}/?client=${encodeURIComponent(clientId)}`;
    try {
        await email.sendBot(client.email, client.company, clientId, botUrl);
        await tracking.logEvent(clientId, 'bot_sent');
        showToast('Bot link sent!', 'success');
        renderClientTable();
    } catch (e) {
        showToast('Failed to send email: ' + e.message, 'error');
    }
}

/* ══ LEAD MANAGEMENT ══ */
document.getElementById('openCreateBtn').addEventListener('click', async () => {
    openModal('createLeadModal');
    try {
        const data = await clients.nextId();
        document.getElementById('nl-id-preview').textContent = data.next_id;
    } catch {}
});

document.getElementById('closeCreateBtn').addEventListener('click', () => closeModal('createLeadModal'));
document.getElementById('cancelCreateBtn')?.addEventListener('click', () => closeModal('createLeadModal'));

window.previewClientId = function () {};

document.getElementById('saveLeadBtn').addEventListener('click', async () => {
    const co  = document.getElementById('nl-co').value.trim();
    const ind = document.getElementById('nl-ind').value.trim();
    const em  = document.getElementById('nl-em').value.trim();
    if (!co || !em) { showToast('Company and email are required.', 'error'); return; }

    const btn = document.getElementById('saveLeadBtn');
    btn.textContent = 'Saving…'; btn.disabled = true;
    try {
        await clients.create({ company: co, industry: ind, email: em });
        showToast('Lead created!', 'success');
        closeModal('createLeadModal');
        ['nl-co', 'nl-ind', 'nl-em'].forEach(id => { document.getElementById(id).value = ''; });
        document.getElementById('nl-id-preview').textContent = '—';
        await renderClientTable();
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    } finally {
        btn.textContent = 'Create Lead'; btn.disabled = false;
    }
});

async function deleteLead(clientId) {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    try {
        await clients.delete(clientId);
        showToast('Lead deleted.', 'success');
        renderClientTable();
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    }
}

/* ══ TRACKING PAGE ══ */
async function openTracking(clientId) {
    const client = allClients.find(c => c.client_id === clientId);
    if (!client) return;
    currentTrackingClient = client;

    hide('H'); show('T');
    // Animate tracking page entrance
    gsap.from('.client-hero', { y: -20, opacity: 0, duration: 0.4, ease: 'power3.out' });
    gsap.from('.section-card', { y: 20, opacity: 0, duration: 0.4, stagger: 0.08, delay: 0.15, ease: 'power3.out' });
    gsap.from('.two-col-grid', { y: 20, opacity: 0, duration: 0.4, delay: 0.3, ease: 'power3.out' });
    document.getElementById('trackingClientName').textContent = client.company || 'Client';
    document.getElementById('tClientIco').textContent  = (client.company || '?')[0].toUpperCase();
    document.getElementById('tClientName').textContent = client.company || '—';
    document.getElementById('tClientMeta').textContent = `${client.industry || '—'} · ${client.email || '—'}`;
    document.getElementById('tClientId').textContent   = `Client ID: ${clientId}`;

    showLdr('Loading tracking data…');
    let evts = [];
    try { evts = await tracking.getEvents(clientId); } catch {}
    hideLdr();

    renderPipeline(evts);
    renderEventLog(evts);

    const ps = document.getElementById('proposalSection');
    try { 
        const pData = await proposals.get(clientId); 
        if (pData && pData.versions && pData.versions.length > 0) {
            ps.style.display = 'block';
            let html = '<div class="section-title">Generated Proposals</div><div style="display:flex;flex-direction:column;gap:12px;">';
            
            const rev = [...pData.versions].reverse();
            rev.forEach(v => {
                const dateRaw = new Date(v.savedAt);
                const dateStr = isNaN(dateRaw) ? v.savedAt : dateRaw.toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
                
                html += `
                    <div class="proposal-banner">
                        <div class="proposal-banner-icon"><svg viewBox="0 0 20 20" fill="none" width="28"><rect x="5" y="4" width="10" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 2h4a1 1 0 011 1v1H7V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5"/><path d="M8 10h4M8 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>
                        <div class="proposal-banner-text">
                            <div class="proposal-banner-title">Version ${v.version} ${v.version === pData.versions.length ? '<span style="color:var(--green);font-size:11px;margin-left:6px">(Latest)</span>' : ''}</div>
                            <div class="proposal-banner-sub">${dateStr}</div>
                        </div>
                        <div class="proposal-banner-actions">
                            <button class="btn-primary btn-sm view-ver-btn" data-v="${v.version}">View Proposal</button>
                            <button class="btn-success btn-sm send-ver-btn" data-v="${v.version}">Send</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            ps.innerHTML = html;
            
            ps.querySelectorAll('.view-ver-btn').forEach(btn => {
                btn.onclick = () => {
                    const ver = pData.versions.find(x => x.version == btn.dataset.v);
                    document.getElementById('proposalIframe').srcdoc = ver.proposal_html;
                    document.getElementById('proposalModal').dataset.version = ver.version;
                    openModal('proposalModal');
                };
            });
            ps.querySelectorAll('.send-ver-btn').forEach(btn => {
                btn.onclick = async () => {
                    const ver = pData.versions.find(x => x.version == btn.dataset.v);
                    btn.disabled = true;
                    btn.textContent = 'Sending...';
                    try {
                        await email.sendProposal(client.email, client.company, ver.proposal_html);
                        await tracking.logEvent(clientId, 'proposal_submitted');
                        const evts2 = await tracking.getEvents(clientId);
                        renderPipeline(evts2);
                        renderEventLog(evts2);
                        showToast('Proposal Version ' + btn.dataset.v + ' securely sent to client!', 'success');
                    } catch (e) {
                        showToast('Failed to send email: ' + e.message, 'error');
                    } finally {
                        btn.disabled = false;
                        btn.textContent = 'Send';
                    }
                };
            });
        } else {
            ps.style.display = 'none';
        }
    } catch {
        ps.style.display = 'none';
    }

    renderClientFiles(clientId);

    document.getElementById('resendBotBtn').onclick = () => sendBotEmail(clientId);
    document.getElementById('copyLinkBtn').onclick = () => {
        const url = `${DEPLOY_URL}/?client=${encodeURIComponent(clientId)}`;
        navigator.clipboard.writeText(url).then(() => {
            document.getElementById('copyLinkBtn').textContent = 'Copied!';
            setTimeout(() => { document.getElementById('copyLinkBtn').innerHTML = `<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M3 13V3h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Copy Link`; }, 2000);
        });
    };
}

function renderPipeline(evts) {
    const map = {};
    evts.forEach(e => { if (!map[e.event]) map[e.event] = e.timestamp; });
    const stages = [
        { key: 'bot_sent', id: 0 },
        { key: 'bot_accessed', id: 1 },
        { key: 'conversation_started', id: 2 },
        { key: 'proposal_generated', id: 3 },
        { key: 'proposal_submitted', id: 4 },
    ];
    stages.forEach(({ key, id }) => {
        const step = document.getElementById(`ps${id}`);
        const time = document.getElementById(`pt${id}`);
        const conn = document.getElementById(`pc${id-1}${id}`);
        if (map[key]) {
            step.classList.add('done'); step.classList.remove('active');
            time.textContent = formatTime(map[key]);
            if (conn) conn.classList.add('done');
        } else {
            step.classList.remove('done', 'active');
            time.textContent = '—';
        }
    });
}

function renderEventLog(evts) {
    const log = document.getElementById('eventLog');
    const evtIcons = {
        'bot_sent':             '<svg viewBox="0 0 18 18" width="16" height="16" fill="none"><path d="M2 5l7 4 7-4M2 5h14v9H2V5z" stroke="var(--amber)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        'bot_accessed':         '<svg viewBox="0 0 18 18" width="16" height="16" fill="none"><path d="M9 4C5 4 1.5 9 1.5 9S5 14 9 14s7.5-5 7.5-5S13 4 9 4z" stroke="#2563EB" stroke-width="1.5"/><circle cx="9" cy="9" r="2" stroke="#2563EB" stroke-width="1.5"/></svg>',
        'conversation_started': '<svg viewBox="0 0 18 18" width="16" height="16" fill="none"><path d="M2 5h14v8a1 1 0 01-1 1H6l-3 2v-2H2V5z" stroke="var(--green)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        'proposal_generated':   '<svg viewBox="0 0 18 18" width="16" height="16" fill="none"><rect x="4" y="2" width="10" height="14" rx="2" stroke="#7C3AED" stroke-width="1.5"/><path d="M7 6h4M7 9h4M7 12h2" stroke="#7C3AED" stroke-width="1.3" stroke-linecap="round"/></svg>',
        'proposal_submitted':   '<svg viewBox="0 0 18 18" width="16" height="16" fill="none"><circle cx="9" cy="9" r="7" stroke="var(--green)" stroke-width="1.5"/><path d="M6 9l2.5 2.5L12.5 7" stroke="var(--green)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        'proposal_sent':        '<svg viewBox="0 0 18 18" width="16" height="16" fill="none"><path d="M2 5l7 4 7-4M2 5h14v9H2V5z" stroke="var(--green)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 12l2 2 3-4" stroke="var(--green)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };
    const evtLabels = {
        'bot_sent':              'Bot link sent to client',
        'bot_accessed':          'Client accessed the bot',
        'conversation_started':  'Client started a conversation',
        'proposal_generated':    'Proposal generated',
        'proposal_submitted':    'Proposal submitted to agent',
        'proposal_sent':         'Proposal sent to client',
    };
    if (!evts.length) {
        log.innerHTML = '<div class="event-empty">No activity recorded yet.</div>';
        return;
    }
    log.innerHTML = [...evts].reverse().map(e => `
        <div class="event-row">
            <div class="event-icon">${evtIcons[e.event] || '<svg viewBox="0 0 18 18" width="16" height="16" fill="none"><circle cx="9" cy="9" r="7" stroke="var(--dim)" stroke-width="1.5"/></svg>'}</div>
            <div class="event-desc">${evtLabels[e.event] || e.event}</div>
            <div class="event-time">${formatTime(e.timestamp)}</div>
        </div>`).join('');
}

function formatTime(ts) {
    try { return new Date(ts).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }
    catch { return ts || '—'; }
}

/* ══ CLIENT BOT SESSION ══ */
async function startSession() {
    hide('L'); show('A');
    // Animate bot layout entrance
    gsap.from('.bot-header', { y: -30, opacity: 0, duration: 0.4, ease: 'power3.out' });
    gsap.from('.bot-sidebar', { x: -30, opacity: 0, duration: 0.5, delay: 0.15, ease: 'power3.out' });
    gsap.from('.chat-panel', { opacity: 0, duration: 0.4, delay: 0.2, ease: 'power2.out' });
    document.getElementById('topco').textContent  = cli.company;
    document.getElementById('topco-ico').textContent = (cli.company || '?')[0].toUpperCase();
    document.getElementById('sbi').textContent    = cli.industry || 'Detecting…';
    document.getElementById('sbs').textContent    = cli.size || '—';

    const restored = activeClientId ? loadConversationMemory(activeClientId) : false;

    if (restored && convo.length > 0) {
        setStg(0, 'done'); setStg(1, 'done');
        if (prof) renderSidebar();
        const feed = document.getElementById('feed');
        feed.innerHTML = '';
        convo.forEach(msg => {
            if (msg.role === 'assistant') addAg(msg.content);
            else if (msg.role === 'user' && !msg.content.startsWith('[File uploaded:')) addUs(msg.content);
        });
        if (discoveryComplete && reqs) {
            setStg(2, 'done'); setStg(3, 'act');
            showReqSummary();
        } else {
            setStg(2, 'act'); setPhase('Discovery Phase');
            addAg(`Welcome back! I remember our conversation. Where were we — shall we continue?`);
        }
        return;
    }

    setStg(0, 'act'); setPhase('Researching your company…');
    showLdr('Researching ' + cli.company + '…');
    try {
        const res = await gem(
            `Research "${cli.company}". Industry: ${cli.industry}. Size: ${cli.size}.\nReturn JSON: {"industries":["..."],"description":"...","pain_points":["..."],"tech":"...","zoho_fit":["..."],"user_est":{"CRM":10}}`,
            1000, 0.3, false, [], ZK
        );
        prof = safeJ(res) || fallback();
        renderSidebar();
    } catch (e) {
        prof = fallback();
    }
    hideLdr();
    setStg(0, 'done');

    const inds = getInds();
    if (inds.length > 1) {
        setStg(1, 'act'); setPhase('Confirming Industry Focus…');
        askInd(inds);
    } else {
        prof.confirmed = inds[0] || cli.industry;
        setStg(1, 'done');
        beginGather();
    }
}

function renderSidebar() {
    document.getElementById('sbi').textContent = (prof.industries || [cli.industry]).join(' · ');
    document.getElementById('sbs').textContent = prof.size || cli.size || 'Medium';
    document.getElementById('sbt').textContent = prof.tech || 'High';
    updateCov(20);
}

function fallback() {
    return { industries: [cli.industry || 'Technology'], size: cli.size || 'Medium', pain_points: ['Process Optimisation'], tech: 'Medium', zoho_fit: ['Zoho CRM'], confirmed: cli.industry };
}

function getInds() {
    let inds = prof.industries || [];
    if (!inds.length) inds = (cli.industry || '').split(',').map(s => s.trim()).filter(Boolean);
    return [...new Set(inds)];
}

function askInd(inds) {
    addAg(`Welcome! I've researched <strong>${cli.company}</strong>. Which sector should we focus on today?`, { inds });
}

async function beginGather() {
    setStg(2, 'act'); setPhase('Discovery Phase: Requirements'); phase = 'gather';
    if (activeClientId) await tracking.logEvent(activeClientId, 'conversation_started').catch(() => {});
    showLdr('Tailoring consultation…');
    try {
        const open = await nextQ(true);
        addAg(open);
        convo.push({ role: 'assistant', content: open });
    } catch (e) {
        addAg(`I'm ready to dive in! Based on our research into ${cli.company}, what are the high-priority challenges you'd like to solve?`);
    }
    hideLdr();
}

async function nextQ(isOpen = false) {
    const sys = `${ZK}\n\nRESEARCH CONTEXT for ${cli.company}:\n${JSON.stringify(prof)}\n${fileContent ? `UPLOADED FILE:\n${fileContent}\n` : ''}`;

    // Round-specific guidance so the AI NEVER repeats the same question.
    // Each round has a clear, distinct focus — the AI must acknowledge what was
    // just said, then move to the next topic. It must NEVER ask something already answered.
    const roundGuide = {
        1: `ROUND 1 — Current tools & team size.
ALREADY DISCUSSED: Review the conversation above. Do NOT repeat anything already asked.
YOUR TASK: Acknowledge what the user just shared warmly. Then ask about the NUMBER OF USERS/TEAM SIZE and which specific DEPARTMENTS will use the new system (e.g. Sales, Finance, Operations, HR).
Example style: "Got it — that sounds really frustrating! Just to get a sense of scale, roughly how many people would be using this system, and which teams would it span?"`,

        2: `ROUND 2 — Biggest pain point & what's failing today.
ALREADY DISCUSSED: Review the conversation above carefully. Do NOT ask anything already answered.
YOUR TASK: Acknowledge the user's last reply. Then dig into the SINGLE BIGGEST pain point — what is costing them the most time or money right now? What happens if this problem is NOT solved?
Example style: "That makes sense — siloed systems are a real bottleneck. What's the one thing causing the most pain day-to-day? Is it manual data entry, missed follow-ups, slow reporting, or something else?"`,

        3: `ROUND 3 — Decision process, timeline & budget signal.
ALREADY DISCUSSED: Review the full conversation above. Do NOT re-ask anything already covered.
YOUR TASK: Acknowledge the user's last point. Then find out: (a) WHO makes the final decision on this purchase, and (b) is there a timeline or deadline driving this project?
Example style: "That's really helpful context. When you're evaluating a solution like this — who would be involved in the final decision? And is there a particular go-live date or event driving the timeline?"`,

        4: `ROUND 4 — Success metrics & must-haves.
ALREADY DISCUSSED: Review the full conversation. Do NOT repeat earlier questions.
YOUR TASK: Acknowledge what they shared. Then ask: what does SUCCESS look like in 6 months? What are the 2-3 things the solution MUST do for them to consider it a win?
Example style: "Love that — clear picture of what you need. If we fast-forward 6 months and the implementation was a total success, what would look different? What are the absolute must-haves vs nice-to-haves?"`,
    };

    let turnPrompt;
    if (isOpen) {
        turnPrompt = `Initialize the discovery session for ${cli.company}. Greet them warmly (use their company name), briefly mention you've done research on their business, and ask ONE open question: "What's the main challenge you're hoping to solve today?"`;
    } else if (rn >= 5) {
        turnPrompt = `You have now gathered rich information across ${rn} rounds of conversation. 
CRITICAL: Output REQUIREMENTS_COMPLETE followed by a COMPLETE JSON object with ALL fields populated from the conversation. Do not leave any field empty.

{
  "business_overview": "Comprehensive 2-3 sentence narrative",
  "departments": ["All departments mentioned"],
  "current_tools": ["All tools/systems mentioned"],
  "pain_points": ["Every pain point — be thorough"],
  "must_have": ["All must-have requirements"],
  "nice_to_have": ["Nice-to-have features"],
  "automation_opportunities": ["Automation needs identified"],
  "integrations": ["All integrations needed"],
  "success_metrics": ["Success metrics per stakeholder"],
  "stakeholders": {
    "economic_buyer": "Who approves the purchase",
    "champion": "Internal project driver",
    "influencers": ["Other influencers"]
  },
  "timeline": "Timeline mentioned",
  "budget_info": "Budget range or constraints",
  "zoho_products": ["Recommended Zoho products"],
  "user_count": 0,
  "industry": "Industry",
  "summary": "One comprehensive sentence"
}`;
    } else {
        // Use the round-specific guide, fall back to a generic progressive prompt
        const guide = roundGuide[rn] || `ROUND ${rn} — Continue discovery.
CRITICAL RULES:
1. Read the FULL conversation history above carefully.
2. Do NOT repeat or rephrase any question already asked.
3. Acknowledge what the user just said in 1-2 sentences.
4. Ask ONE NEW question about something not yet covered: integrations needed, data migration concerns, existing vendors, approval process, or specific feature requirements.`;
        turnPrompt = guide;
    }

    return await gem(turnPrompt, rn >= 5 ? 2000 : 1000, 0.7, rn >= 5, convo, sys);
}

/* ── File upload ── */
document.getElementById('fileBtn').onclick = () => document.getElementById('fileIn').click();

document.getElementById('fileIn').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    showLdr(`Reading ${f.name}…`);
    addUs(`[Uploaded: ${f.name}]`);

    try {
        // Process supported documents (PDF, DOCX, TXT) via the robust Python backend parser
        if (['.pdf', '.docx', '.txt', '.csv'].some(ext => f.name.toLowerCase().endsWith(ext))) {
            const parsed = await documents.parse(f);
            fileContent = parsed.text;
            if (fileContent.length > 15000) fileContent = fileContent.slice(0, 15000) + '\n...[truncated]';
        } else if (f.type.startsWith('image/')) {
            // For images we can't extract text right now — acknowledge upload, push to convo, and return early.
            fileContent = `[File: ${f.name} — ${f.type}. No text could be extracted. Client should describe requirements verbally.]`;
            const ackMsg = `I uploaded a file: ${f.name} (${f.type}). Please acknowledge receipt and ask me ONE focused question about the key requirements it covers.`;
            convo.push({ role: 'user', content: ackMsg });
            saveFileToMemory(activeClientId, { name: f.name, type: f.type, size: f.size }, fileContent);
            hideLdr();
            showTypingIndicator();
            const ackResp = await gem(ackMsg, 500, 0.5, false, convo, ZK);
            removeTypingIndicator();
            if (ackResp) {
                addAg(ackResp);
                convo.push({ role: 'assistant', content: ackResp });
            }
            e.target.value = '';
            return;
        } else {
            fileContent = await readText(f);
            if (fileContent.length > 8000) fileContent = fileContent.slice(0, 8000) + '\n...[truncated]';
        }

        saveFileToMemory(activeClientId, { name: f.name, type: f.type, size: f.size }, fileContent);
        convo.push({ role: 'user', content: `[File uploaded: ${f.name}]\n\nFile contents:\n${fileContent}` });

        hideLdr();
        showLdr('Analysing document & suggesting solutions…');
        showTypingIndicator();
        rn++;
        const sys = `${ZK}\nRESEARCH CONTEXT for ${cli.company}:\n${JSON.stringify(prof)}\nRound: ${rn}/6`;

        // Enhanced prompt — pass full convo history so AI has full context (Fix 1)
        const resp = await gem(
            `The client uploaded a requirement document "${f.name}".\n\nFILE CONTENTS:\n${fileContent}\n\nINSTRUCTIONS:\n1. Acknowledge the file upload warmly\n2. Briefly summarise the KEY requirements found (2-3 bullet points)\n3. Suggest specific Zoho products that match each requirement\n4. If the document is comprehensive enough (covers pain points, departments, requirements), output REQUIREMENTS_COMPLETE followed by the full JSON with ALL fields populated\n5. If more info is needed, ask ONE focused follow-up question about what's missing\n\nCRITICAL: If the file contains clear business requirements, DO extract them into REQUIREMENTS_COMPLETE JSON. Treat the file as a primary source of truth. Map every requirement to relevant Zoho products. IMPORTANT DETAILS: When building the JSON, you MUST populate arrays with highly detailed, contextual descriptions natively from the text (3-8 descriptive items per array). Do not use brief 1-2 word summaries! Be extremely detailed.`,
            2000, 0.5, false, convo, sys
        );
        removeTypingIndicator();
        hideLdr();

        const potentialJson = safeJ(resp);
        if (resp.includes('REQUIREMENTS_COMPLETE')) {
            const parts = resp.split('REQUIREMENTS_COMPLETE');
            if (parts[0].trim()) addAg(parts[0].trim());
            reqs = safeJ(parts[1]) || { summary: fileContent.slice(0, 200), must_have: ['Zoho Implementation'] };
            discoveryComplete = true;
            showReqSummary();
        } else if (potentialJson && (potentialJson.must_have || potentialJson.pain_points)) {
            // Robustly catch if generated JSON missed the exact REQUIREMENTS_COMPLETE keyword
            reqs = potentialJson;
            discoveryComplete = true;
            showReqSummary();
        } else {
            addAg(resp);
            convo.push({ role: 'assistant', content: resp });
        }
    } catch (err) {
        console.error('[Document Analysis Error]', err);
        removeTypingIndicator();
        hideLdr();
        addAg(`I encountered an issue reading or analysing your file <strong>${f.name}</strong>. Could you briefly summarise the key requirements it covers?`);
    }
    e.target.value = '';
};

function readBase64(f) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = ev => res(ev.target.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(f);
    });
}
function readArrayBuffer(f) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = ev => res(ev.target.result);
        r.onerror = rej;
        r.readAsArrayBuffer(f);
    });
}
function readText(f) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = ev => res(ev.target.result);
        r.onerror = rej;
        r.readAsText(f);
    });
}

/* ── Send message ── */
document.getElementById('sendBtn').addEventListener('click', async () => {
    const inp = document.getElementById('msgIn');
    const msg = inp.value.trim();
    if (!msg) return;
    if (discoveryComplete) discoveryComplete = false;
    addUs(msg);
    convo.push({ role: 'user', content: msg });
    inp.value = '';
    rn++;
    updateCov(Math.min(95, 20 + rn * 20));
    showTypingIndicator();
    try {
        const resp = await nextQ();
        removeTypingIndicator();
        const potentialJson = safeJ(resp);
        if (resp.includes('REQUIREMENTS_COMPLETE')) {
            const parts = resp.split('REQUIREMENTS_COMPLETE');
            if (parts[0].trim()) addAg(parts[0].trim());
            reqs = safeJ(parts[1]) || { summary: 'Requirement analysis complete', must_have: ['Zoho One'] };
            discoveryComplete = true;
            showReqSummary();
        } else if (potentialJson && (potentialJson.must_have || potentialJson.pain_points)) {
            // Handle cases where the AI forced JSON output and omitted the keyword
            reqs = potentialJson;
            discoveryComplete = true;
            showReqSummary();
        } else {
            addAg(resp);
            convo.push({ role: 'assistant', content: resp });
        }
    } catch (e) {
        removeTypingIndicator();
        console.error('[nextQ error]', e);
        if (rn >= 5) {
            discoveryComplete = true;
            // Less rigid fallback, reflecting actual generic discovery rather than forcing 'Zoho One Implementation' alone
            reqs = { summary: 'Discovery session concluded.', must_have: ['Project Requirements Gathering', 'Module Configuration'] };
            showReqSummary();
        } else {
            // Round-specific fallbacks — never the same message twice
            const fallbacks = {
                1: `Thanks for sharing that! Just to understand the scale — roughly how many people would be using this system, and which departments would it cover?`,
                2: `Got it! What's the single biggest bottleneck this is causing your team right now — is it manual work, missed follow-ups, or lack of visibility?`,
                3: `That's helpful context. Who would be involved in the final decision on this, and is there a particular timeline or deadline you're working towards?`,
                4: `Great — and what would success look like in 6 months? What are the 2-3 things the solution absolutely must do for you?`,
            };
            addAg(fallbacks[rn] || `Thanks for that detail! What else should I know about your requirements — any specific integrations or systems you'd need to connect with?`);
        }
    }
});

function showTypingIndicator() {
    const f = document.getElementById('feed');
    const existing = f.querySelector('.typing-indicator');
    if (existing) return;
    const d = document.createElement('div');
    d.className = 'typing-indicator';
    d.innerHTML = `<div class="msg-av">F</div><div class="typing-dots"><span></span><span></span><span></span></div>`;
    f.appendChild(d);
    f.scrollTop = f.scrollHeight;
}

function removeTypingIndicator() {
    const f = document.getElementById('feed');
    const ti = f.querySelector('.typing-indicator');
    if (ti) {
        gsap.to(ti, { opacity: 0, y: -8, duration: 0.2, onComplete: () => ti.remove() });
    }
}

document.getElementById('msgIn').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('sendBtn').click();
});

/* ══ MIC ══ */
(function initMic() {
    const micBtn = document.getElementById('micBtn');
    if (!micBtn) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { micBtn.style.opacity = '.3'; micBtn.style.cursor = 'not-allowed'; return; }
    const recognition = new SR();
    // FIX: Use non-continuous mode so the engine delivers a proper final result
    // before onend fires. Continuous mode caused partial transcripts to be lost.
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    let listening = false, finalT = '', interimT = '';

    micBtn.addEventListener('click', () => {
        if (discoveryComplete) return;
        if (listening) { recognition.stop(); return; }
        finalT = ''; interimT = '';
        document.getElementById('msgIn').value = '';
        try { recognition.start(); } catch {}
    });

    recognition.onstart = () => {
        listening = true;
        micBtn.classList.add('mic-listening');
        document.getElementById('msgIn').placeholder = 'Listening…';
    };
    recognition.onresult = (e) => {
        // FIX: Accumulate final results correctly — don't reset finalT to '' on each
        // event. Instead build it from all final results, and track interim separately.
        let newFinal = '';
        interimT = '';
        for (let i = 0; i < e.results.length; i++) {
            if (e.results[i].isFinal) newFinal += e.results[i][0].transcript + ' ';
            else interimT += e.results[i][0].transcript;
        }
        if (newFinal) finalT = newFinal.trim();
        document.getElementById('msgIn').value = finalT || interimT;
    };
    recognition.onend = () => {
        listening = false;
        micBtn.classList.remove('mic-listening');
        document.getElementById('msgIn').placeholder = 'Type your response…';
        // Use whatever we collected — final preferred, interim as fallback
        const transcript = (finalT || interimT).trim();
        if (transcript) {
            document.getElementById('msgIn').value = transcript;
            // Short delay so user can see/edit before auto-send
            setTimeout(() => {
                const val = document.getElementById('msgIn').value.trim();
                if (val) document.getElementById('sendBtn').click();
            }, 1500);
        }
    };
    recognition.onerror = (e) => {
        listening = false;
        micBtn.classList.remove('mic-listening');
        document.getElementById('msgIn').placeholder = 'Type your response…';
        if (e.error === 'not-allowed') alert('Microphone access denied. Please allow it in browser settings.');
    };
})();

/* ══ CONVERSATION MEMORY ══ */
function saveConversationMemory() {
    if (!activeClientId) return;
    localStorage.setItem(`session_${activeClientId}`, JSON.stringify({
        convo, reqs, sol, prof, rn, fileContent: fileContent.slice(0, 4000), discoveryComplete, ts: Date.now()
    }));
}

function loadConversationMemory(clientId) {
    const saved = localStorage.getItem(`session_${clientId}`);
    if (!saved) return false;
    try {
        const m = JSON.parse(saved);
        if (Date.now() - m.ts > 7 * 86400000) return false;
        ({ convo, reqs, sol, prof, rn, fileContent, discoveryComplete } = {
            convo: m.convo || [], reqs: m.reqs || null, sol: m.sol || null,
            prof: m.prof || null, rn: m.rn || 0,
            fileContent: m.fileContent || '', discoveryComplete: m.discoveryComplete || false
        });
        return true;
    } catch { return false; }
}

function saveFileToMemory(clientId, meta, content) {
    const key = `files_${clientId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = existing.findIndex(f => f.name === meta.name);
    const entry = { ...meta, content: content.slice(0, 5000), ts: Date.now() };
    if (idx >= 0) existing[idx] = entry; else existing.push(entry);
    localStorage.setItem(key, JSON.stringify(existing));
}

function renderClientFiles(clientId) {
    const container = document.getElementById('clientFilesSection');
    if (!container) return;
    const files = JSON.parse(localStorage.getItem(`files_${clientId}`) || '[]');
    if (!files.length) { container.style.display = 'none'; return; }
    container.style.display = 'block';
    document.getElementById('filesList').innerHTML = files.map(f => `
        <div class="file-row">
            <div class="file-icon">${f.type?.startsWith('image/') ? '<svg viewBox="0 0 20 20" width="20" height="20" fill="none"><rect x="2" y="3" width="16" height="14" rx="2" stroke="var(--sub)" stroke-width="1.5"/><path d="M4 14l3-3 2 2 4-5 3 3" stroke="var(--sub)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : f.type === 'application/pdf' ? '<svg viewBox="0 0 20 20" width="20" height="20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke="var(--red)" stroke-width="1.5"/><path d="M8 7h4M8 10h4M8 13h2" stroke="var(--red)" stroke-width="1.3" stroke-linecap="round"/></svg>' : '<svg viewBox="0 0 20 20" width="20" height="20" fill="none"><path d="M3 5h5l2 2h7v10H3V5z" stroke="var(--sub)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'}</div>
            <div><div class="file-name">${f.name}</div><div class="file-meta">${(f.size/1024).toFixed(1)}KB · ${new Date(f.ts).toLocaleString()}</div></div>
        </div>`).join('');
}

/* ══ REQUIREMENTS SUMMARY ══ */
function showReqSummary() {
    if (!reqs) reqs = { summary: 'Ready to proceed.', must_have: [] };
    setStg(2, 'done'); setStg(3, 'act'); setPhase('Reviewing Requirements…');
    saveConversationMemory();

    const makeChips = (arr) => (arr || []).map(t => `<span class="reqs-chip">${t}</span>`).join('');
    const makeList  = (arr) => (arr || []).map(i => `<li>${i}</li>`).join('');

    const products = reqs.zoho_products || [];
    const productChips = products.length ? products.map(p => `<span style="background:rgba(26,79,214,.08);color:#1A4FD6;border:1px solid rgba(26,79,214,.2);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:4px"><svg viewBox="0 0 16 16" width="12" height="12" fill="none"><path d="M4 8l3 3 5-5" stroke="#1A4FD6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${p}</span>`).join(' ') : '';

    const html = `
    <div class="reqcard-full">
      <div class="reqcard-intro">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--green),#34d399);display:flex;align-items:center;justify-content:center">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M4 8l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <strong style="font-size:15px;color:var(--text)">Discovery Complete</strong>
        </div>
        Here's a complete summary of everything we've captured. Please review carefully — if this accurately reflects your requirements, confirm and I'll generate your formal proposal.
      </div>
      <div class="reqcard-box">
        <div class="reqcard-title" style="display:flex;align-items:center;gap:8px">
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none"><rect x="4" y="3" width="12" height="15" rx="2" stroke="#fff" stroke-width="1.5"/><path d="M8 7h4M8 10h4M8 13h2" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>
          Requirements Summary — ${cli?.company || ''}
        </div>
        ${reqs.business_overview ? `<div class="reqs-section"><div class="reqs-label">Business Overview</div><div class="reqs-text">${reqs.business_overview}</div></div>` : ''}
        ${reqs.industry ? `<div class="reqs-section" style="display:flex;gap:24px;flex-wrap:wrap"><div><div class="reqs-label">Industry</div><div style="font-size:13px;font-weight:600;color:var(--text)">${reqs.industry}</div></div>${reqs.user_count ? `<div><div class="reqs-label">Users</div><div style="font-size:13px;font-weight:600;color:var(--text)">${reqs.user_count}</div></div>` : ''}${reqs.timeline ? `<div><div class="reqs-label">Timeline</div><div style="font-size:13px;font-weight:600;color:var(--text)">${reqs.timeline}</div></div>` : ''}</div>` : ''}
        ${(reqs.departments||[]).length ? `<div class="reqs-section"><div class="reqs-label">Departments / Teams</div><div class="reqs-chips">${makeChips(reqs.departments)}</div></div>` : ''}
        ${(reqs.current_tools||[]).length ? `<div class="reqs-section"><div class="reqs-label">Current Tools</div><div class="reqs-chips">${makeChips(reqs.current_tools)}</div></div>` : ''}
        ${(reqs.pain_points||[]).length ? `<div class="reqs-section"><div class="reqs-label">Pain Points</div><ul class="reqs-list">${makeList(reqs.pain_points)}</ul></div>` : ''}
        ${(reqs.must_have||[]).length ? `<div class="reqs-section"><div class="reqs-label">Must-Have Requirements</div><ul class="reqs-list">${makeList(reqs.must_have)}</ul></div>` : ''}
        ${(reqs.nice_to_have||[]).length ? `<div class="reqs-section"><div class="reqs-label">Nice to Have</div><ul class="reqs-list">${makeList(reqs.nice_to_have)}</ul></div>` : ''}
        ${(reqs.automation_opportunities||[]).length ? `<div class="reqs-section"><div class="reqs-label">Automation Opportunities</div><ul class="reqs-list">${makeList(reqs.automation_opportunities)}</ul></div>` : ''}
        ${(reqs.integrations||[]).length ? `<div class="reqs-section"><div class="reqs-label">Integration Requirements</div><ul class="reqs-list">${makeList(reqs.integrations)}</ul></div>` : ''}
        ${(reqs.success_metrics||[]).length ? `<div class="reqs-section"><div class="reqs-label">Success Metrics</div><ul class="reqs-list">${makeList(reqs.success_metrics)}</ul></div>` : ''}
        ${productChips ? `<div class="reqs-section"><div class="reqs-label">Recommended Zoho Products</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">${productChips}</div></div>` : ''}
        <div class="reqs-actions" style="display:flex;flex-wrap:wrap;gap:10px;padding:16px 18px;background:var(--bg);border-top:1px solid var(--brd)">
          <button class="reqs-btn-confirm" id="confirmProposal" style="flex:1;min-width:180px;display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 20px;font-size:13px;border-radius:10px">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M4 8l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Create Proposal
          </button>
          <button class="reqs-btn-clarify" id="clarifyBtn" style="display:flex;align-items:center;gap:6px;padding:12px 16px;border-radius:10px">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Changes Required
          </button>
          <button class="reqs-btn-wrong" id="wrongBtn" style="display:flex;align-items:center;gap:6px;padding:12px 16px;border-radius:10px">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Not Right
          </button>
        </div>
      </div>
    </div>`;

    addAg(html, { noEscape: true });
    setTimeout(() => {
        document.getElementById('confirmProposal')?.addEventListener('click', buildSolution);
        document.getElementById('clarifyBtn')?.addEventListener('click', () => {
            discoveryComplete = false;
            addAg("Of course! What changes would you like? I'll update the requirements accordingly.");
            document.getElementById('msgIn').focus();
        });
        document.getElementById('wrongBtn')?.addEventListener('click', () => {
            discoveryComplete = false; reqs = null;
            addAg("No problem at all — let's start fresh. What didn't look right? I want to make sure we capture your needs accurately.");
            document.getElementById('msgIn').focus();
        });
    }, 100);
}

async function buildSolution() {
    setStg(3, 'done'); setStg(4, 'act'); setPhase('Architecting Proposal…');
    const steps = [
        { pct: 15, txt: 'Analysing discovery profile…' },
        { pct: 35, txt: 'Mapping to Zoho modules…' },
        { pct: 60, txt: 'Structuring implementation plan…' },
        { pct: 80, txt: 'Finalising proposal…' },
    ];
    try {
        for (const s of steps) { showLdr(s.txt, s.pct); await sleep(600 + Math.random() * 300); }
        const res = await gem(
            `DESIGN ZOHO SOLUTION FOR ${cli.company} BASED ON: ${JSON.stringify(reqs)}\nCRITICAL: RETURN ONLY RAW JSON. NO MARKDOWN. SCHEMA: {"primary_products":["..."],"implementation_phases":[{"name":"...","duration":"..."}],"team_structure":"...","monthly_cost":"...","workflow":[{"step":"1","name":"...","description":"..."}]}\n\nCRITICAL: YOU MUST INCLUDE THE FOLLOWING SPECIFIC WORKFLOWS IN THE "workflow" ARRAY (adapt specific names/steps to the client but keep the core meaning):\n1) Marketing Drip & Lead Scoring\n2) Multi-Channel Lead Routing\n3) S0-S4 Opportunity Pipeline\n4) QDE Onboarding & Locker Management System\n5) Mutual Fund Folios Integration`,
            2000, 0.4, true
        );
        sol = safeJ(res);
        if (!sol) throw new Error('Bad JSON from AI');
        hideLdr(); setStg(4, 'done');
        // Skip video modal - go directly to proposal generation
        generateProposal();
    } catch (e) {
        // Heuristic fallback
        const products = [];
        if (reqs.must_have?.some(m => /crm|sales|lead/i.test(m))) products.push('Zoho CRM');
        if (reqs.must_have?.some(m => /account|book|invoice|tax/i.test(m))) products.push('Zoho Books');
        if (reqs.must_have?.some(m => /support|desk|ticket/i.test(m))) products.push('Zoho Desk');
        if (products.length === 0) products.push('Zoho One');
        sol = {
            primary_products: products,
            implementation_phases: [{ name: 'Requirement & FSD', duration: '2 Weeks' }, { name: 'Configuration', duration: '4 Weeks' }, { name: 'UAT & Training', duration: '2 Weeks' }],
            team_structure: '1 Sr. BA, 1 Developer, 1 QA', monthly_cost: 'Based on User Count',
            workflow: [
                { step: '1', name: 'Marketing Drip & Lead Scoring', description: 'Automated engagement and prioritization.' },
                { step: '2', name: 'Multi-Channel Lead Routing', description: 'Assigning leads based on territory and skill.' },
                { step: '3', name: 'S0-S4 Opportunity Pipeline', description: 'Standardized sales stages from qualification to closure.' },
                { step: '4', name: 'QDE Onboarding & Locker Management', description: 'Quick Data Entry and secure document handling.' },
                { step: '5', name: 'Mutual Fund Folios Integration', description: 'Syncing investment data with client profiles.' }
            ]
        };
        hideLdr(); setStg(4, 'done');
        generateProposal();
    }
}

async function generateProposal() {
    showLdr('Generating proposal…');
    const fname   = `Zoho_Proposal_${(cli.company||'Client').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.html`;
    const dateStr = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    const mustHaves  = reqs.must_have || ['Zoho Implementation'];
    const products   = reqs.zoho_products || sol?.primary_products || ['Zoho CRM'];
    const userCount  = reqs.user_count || '—';
    const industry   = reqs.industry || cli.industry || '—';
    const integrations = reqs.integrations || [];
    const workflows  = sol?.workflow || sol?.workflows || [
        { step: '1', name: 'Marketing Drip & Lead Scoring', description: 'Automated engagement and prioritization.' },
        { step: '2', name: 'Multi-Channel Lead Routing', description: 'Assigning leads based on territory and skill.' },
        { step: '3', name: 'S0-S4 Opportunity Pipeline', description: 'Standardized sales stages from qualification to closure.' },
        { step: '4', name: 'QDE Onboarding & Locker Management', description: 'Quick Data Entry and secure document handling.' },
        { step: '5', name: 'Mutual Fund Folios Integration', description: 'Syncing investment data with client profiles.' }
    ];

    const scopeRows = mustHaves.map(m => `<tr><td>${m}</td><td><span class="badge-config">Configuration</span></td><td>Business Team</td><td><ul style="margin:0;padding-left:16px;font-size:12.5px;color:#4F6282"><li>Configure module per requirements</li><li>Workflows, validations, custom fields</li><li>Role-based access and reporting</li></ul></td></tr>`).join('');
    const intgRows   = integrations.map(i => `<tr><td>${i}</td><td><span class="badge-custom">Customization</span></td><td>IT / Admin</td><td><ul style="margin:0;padding-left:16px;font-size:12.5px;color:#4F6282"><li>Integrate ${i} with Zoho</li><li>Configure data sync</li><li>End-to-end testing</li></ul></td></tr>`).join('');
    const wfRows     = workflows.map(w => `<tr><td style="font-weight:700;color:#1A4FD6;text-align:center;width:40px">${w.step}</td><td style="font-weight:600">${w.name}</td><td style="color:#4F6282">${w.description}</td></tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Zoho Proposal — ${cli.company}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;color:#1A2540;line-height:1.6;background:#f5f7fa}
.page{max-width:960px;margin:0 auto;background:#fff;box-shadow:0 4px 40px rgba(0,0,0,.1)}
.cover{background:#fff;padding:60px;border-bottom:4px solid #1A4FD6}
.cover-logo{display:flex;align-items:center;gap:10px;margin-bottom:40px}
.cover-logo-box{width:36px;height:36px;background:#1A4FD6;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px}
.cover-logo-name{font-weight:700;font-size:14px;color:#1A4FD6}
h1{font-size:32px;font-weight:800;color:#1A4FD6;margin-bottom:10px}
.client-name{font-size:24px;font-weight:700;margin-bottom:8px}
.subtitle{font-size:14px;color:#4F6282;margin-bottom:40px}
.cover-hero{width:100%;height:140px;background:linear-gradient(135deg,#EEF4FF,#C8DAFF);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:52px;opacity:.6;margin-bottom:40px}
.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;border-top:1px solid #E8EFF8;padding-top:24px}
.meta-item label{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#7A91B3;display:block;margin-bottom:3px}
.meta-item span{font-size:14px;font-weight:600;color:#1A2540}
.section{padding:48px 60px;border-top:1px solid #E8EFF8}
.sec-head{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.sec-num{width:32px;height:32px;background:#1A4FD6;border-radius:8px;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}
.sec-title{font-size:20px;font-weight:700;color:#1A4FD6}
p{font-size:14px;color:#4F6282;line-height:1.75;margin-bottom:12px}
table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}
thead tr{background:#0B1120}
th{padding:12px 14px;text-align:left;font-size:11px;font-weight:700;color:rgba(255,255,255,.75);text-transform:uppercase;letter-spacing:.5px}
td{padding:12px 14px;border-bottom:1px solid #E8EFF8;vertical-align:top}
tr:last-child td{border-bottom:none}
tr:nth-child(even) td{background:#FAFBFD}
.badge-config{background:#EEF4FF;color:#1A4FD6;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px}
.badge-custom{background:#FFF3E0;color:#E65100;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px}
.badge-tm{background:#E8F5E9;color:#2E7D32;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px}
.about-box{background:linear-gradient(135deg,#0B1120,#132040);border-radius:14px;padding:28px 32px;margin-bottom:20px}
.about-box p{color:rgba(255,255,255,.7);margin-bottom:0}
.awards{display:flex;gap:12px;flex-wrap:wrap;margin:14px 0}
.award{background:#1A4FD6;color:#fff;font-size:12px;font-weight:600;padding:7px 14px;border-radius:10px}
.clients-grid{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.client-tag{background:#EEF4FF;color:#1A4FD6;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;border:1px solid #C8DAFF}
ul.bullets{padding-left:20px}
ul.bullets li{font-size:13.5px;color:#4F6282;margin-bottom:8px}
.acceptance-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:16px}
.acceptance-col label{font-weight:700;font-size:14px;color:#1A2540;display:block;margin-bottom:16px}
.sign-line{border-bottom:1px solid #CBD5E1;margin-bottom:12px;height:40px}
.sign-field{font-size:12px;color:#7A91B3;margin-bottom:12px}
.footer{background:#0B1120;padding:24px 60px;display:flex;align-items:center;justify-content:space-between}
.footer-logo{display:flex;align-items:center;gap:8px}
.footer-logo-box{width:28px;height:28px;background:#1A4FD6;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff}
.footer-brand{font-size:13px;font-weight:600;color:rgba(255,255,255,.65)}
.footer-conf{color:rgba(255,255,255,.3);font-size:12px}
.editable-price{cursor:pointer;border-bottom:1px dashed #A0AEC0;font-weight:700;color:#1A4FD6;transition:all .2s}
.editable-price:focus{background:#EEF4FF;outline:none}
</style></head><body><div class="page">
<div class="cover">
  <div class="cover-logo"><div class="cover-logo-box">F</div><div class="cover-logo-name">FRISTINE INFOTECH</div></div>
  <h1>Zoho Implementation Proposal For</h1>
  <div class="client-name">${cli.company}</div>
  <div class="subtitle">${industry} · Prepared by Fristine Infotech Presales Team</div>
  <div class="cover-hero"><svg viewBox="0 0 120 60" width="120" height="60" fill="none"><rect x="10" y="20" width="20" height="30" rx="3" fill="#C8DAFF"/><rect x="35" y="10" width="20" height="40" rx="3" fill="#1A4FD6"/><rect x="60" y="25" width="20" height="25" rx="3" fill="#C8DAFF"/><path d="M90 15l10 20H80z" fill="#1A4FD6" opacity=".3"/><circle cx="95" cy="15" r="5" fill="#1A4FD6"/></svg></div>
  <div class="meta-grid">
    <div class="meta-item"><label>Date</label><span>${dateStr}</span></div>
    <div class="meta-item"><label>Prepared For</label><span>${cli.company}</span></div>
    <div class="meta-item"><label>Prepared By</label><span>Fristine Infotech Presales</span></div>
    <div class="meta-item"><label>Contact</label><span>presales@fristinetech.com</span></div>
  </div>
</div>

<div class="section">
  <div class="sec-head"><div class="sec-num">1</div><div class="sec-title">About Fristine Infotech</div></div>
  <div class="about-box"><p>Fristine Infotech is India's leading Premium Zoho Partner helping clients across markets, industries & geographies solve complex business problems through bespoke Zoho implementations.</p></div>
  <p>Over <strong>10 years</strong> and <strong>200+ implementations</strong> across Marketing, Sales, Operations, Finance, and Support.</p>
  <div class="awards"><div class="award"><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><path d="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" stroke="#FFD700" stroke-width="1.2" fill="#FFD700"/></svg> Zoho Creator Partner Award 2021 — Innovator of the Year</div><div class="award"><svg viewBox="0 0 16 16" width="14" height="14" fill="none"><circle cx="8" cy="8" r="6" stroke="#fff" stroke-width="1.5"/><path d="M3 8h10M8 3c-2 2-2 10 0 10M8 3c2 2 2 10 0 10" stroke="#fff" stroke-width="1.2"/></svg> Regional Champion — Australia & New Zealand</div></div>
  <p style="font-weight:600;color:#1A2540;margin-bottom:8px">Our Clients:</p>
  <div class="clients-grid">${['eBay','Pepperfry','Edelweiss','YES Securities','NPCI','Jio','Suzlon','Mercedes-Benz','Samsonite','TATA MD','CARE Ratings','CRISIL','TeamLease','Transasia'].map(c=>`<span class="client-tag">${c}</span>`).join('')}</div>
</div>

<div class="section">
  <div class="sec-head"><div class="sec-num">2</div><div class="sec-title">Proposal & Scope of Work</div></div>
  <p><strong>${cli.company}</strong> is looking to implement <strong>${products.join(', ')}</strong> to digitalise and optimise its business processes.</p>
  ${products.map(prod=>`<p style="font-weight:700;color:#0B1120;font-size:14px;margin-top:20px;margin-bottom:10px">${prod}</p><table><thead><tr><th>Requirement</th><th>Status</th><th>User Persona</th><th>Fristine Remark</th></tr></thead><tbody>${scopeRows}</tbody></table>`).join('')}
  ${intgRows?`<p style="font-weight:700;color:#0B1120;font-size:14px;margin-top:20px;margin-bottom:10px">Integrations</p><table><thead><tr><th>Requirement</th><th>Status</th><th>User Persona</th><th>Fristine Remark</th></tr></thead><tbody>${intgRows}</tbody></table>`:''}
  <p style="font-weight:700;color:#0B1120;font-size:14px;margin-top:20px;margin-bottom:10px">Training & UAT</p>
  <table><thead><tr><th>Requirement</th><th>Status</th><th>User Persona</th><th>Fristine Remark</th></tr></thead><tbody><tr><td>User Training, Help Document & UAT</td><td><span class="badge-tm">Time & Material</span></td><td>IT / Admin Team</td><td><ul style="margin:0;padding-left:16px;font-size:12.5px;color:#4F6282"><li>UAT</li><li>User Training</li><li>Help Documentation</li></ul></td></tr></tbody></table>
</div>

<div class="section">
  <div class="sec-head"><div class="sec-num" style="background:linear-gradient(135deg,#1A4FD6,#3B82F6)">W</div><div class="sec-title" style="color:#0B1120">Implementation Workflow</div></div>
  <p style="margin-bottom:20px">The following workflow outlines how Fristine Infotech will implement your requirements step-by-step:</p>
  <div style="display:flex;flex-direction:column;gap:0;margin:20px 0">
    ${workflows.map((w, i) => `
    <div style="display:flex;align-items:stretch;gap:16px;position:relative">
      <div style="width:40px;display:flex;flex-direction:column;align-items:center;flex-shrink:0">
        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1A4FD6,#3B82F6);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(26,79,214,.3)">${w.step}</div>
        ${i < workflows.length - 1 ? '<div style="flex:1;width:2px;background:linear-gradient(180deg,#1A4FD6,#C8DAFF);min-height:16px"></div>' : ''}
      </div>
      <div style="flex:1;background:#F8FBFF;border:1px solid #E0EAFF;border-radius:10px;padding:14px 18px;margin-bottom:12px">
        <div style="font-weight:700;font-size:14px;color:#1A4FD6;margin-bottom:4px">${w.name}</div>
        <div style="font-size:12.5px;color:#4F6282;line-height:1.6">${w.description}</div>
      </div>
    </div>`).join('')}
  </div>
  <table style="margin-top:16px"><thead style="background:#1A4FD6"><tr><th style="color:#fff;text-align:center">Step</th><th style="color:#fff">Workflow</th><th style="color:#fff">Description</th></tr></thead><tbody>${wfRows}</tbody></table>
</div>

<div class="section">
  <div class="sec-head"><div class="sec-num">3</div><div class="sec-title">Project Team</div></div>
  <table><thead><tr><th>#</th><th>Role</th><th>Description</th></tr></thead><tbody>
    <tr><td>1</td><td><strong>CTO</strong></td><td>Architecture and risk mitigation accountability.</td></tr>
    <tr><td>2</td><td><strong>Project Manager</strong></td><td>Overall project outcomes and day-to-day progress.</td></tr>
    <tr><td>3</td><td><strong>Sr Business Analyst</strong></td><td>Functional requirements, user training, and backlog management.</td></tr>
    <tr><td>4</td><td><strong>Jr Business Analyst</strong></td><td>Documentation assistance and requirements support.</td></tr>
    <tr><td>5</td><td><strong>Sr Developer</strong></td><td>Quality development and implementation tasks.</td></tr>
    <tr><td>6</td><td><strong>QA / Tester</strong></td><td>Test planning, execution, and quality assurance.</td></tr>
  </tbody></table>
</div>

<div class="section">
  <div class="sec-head"><div class="sec-num">4</div><div class="sec-title">Escalation Process</div></div>
  <table><thead><tr><th>#</th><th>Escalation Level</th><th>Response Time</th></tr></thead><tbody>
    <tr><td>1</td><td>Level 1 — Sr Business Analyst</td><td>4 Hours</td></tr>
    <tr><td>2</td><td>Level 2 — CTO</td><td>1 Business Day</td></tr>
    <tr><td>3</td><td>Level 3 — CEO</td><td>3 Business Days</td></tr>
  </tbody></table>
</div>

<div class="section">
  <div class="sec-head"><div class="sec-num">5</div><div class="sec-title">Commercials</div></div>
  <p style="font-weight:700;color:#0B1120;margin-bottom:10px">Software License</p>
  <table><thead><tr><th>#</th><th>Product</th><th>Users</th><th>Billing</th><th>Amount (INR)</th></tr></thead><tbody>
    ${products.map((p,i)=>`<tr><td>${i+1}</td><td>${p}</td><td>${userCount}</td><td>Annual</td><td contenteditable="true" class="editable-price">₹ (To be quoted)</td></tr>`).join('')}
  </tbody></table>
  <p style="font-size:12px;color:#7A91B3;margin-bottom:20px">Pricing exclusive of GST</p>
  <p style="font-weight:700;color:#0B1120;margin-bottom:10px">Implementation</p>
  <table><thead><tr><th>#</th><th>Particulars</th><th>Type</th><th>Est. Hours</th><th>Amount (INR)</th></tr></thead><tbody>
    <tr><td>1</td><td>Requirement Gathering & FSD</td><td><span class="badge-config">Project-based</span></td><td>NA</td><td contenteditable="true" class="editable-price">₹ (To be quoted)</td></tr>
    <tr><td>2</td><td>${products.join(' & ')} Implementation</td><td><span class="badge-config">Project-based</span></td><td>NA</td><td contenteditable="true" class="editable-price">₹ (To be quoted)</td></tr>
    <tr><td>3</td><td>Data Migration</td><td><span class="badge-tm">T&M</span></td><td>4 days</td><td contenteditable="true" class="editable-price">₹ (To be quoted)</td></tr>
    <tr><td>4</td><td>30-day Hypercare</td><td><span class="badge-config">Project-based</span></td><td>NA</td><td contenteditable="true" class="editable-price">₹ (To be quoted)</td></tr>
    <tr style="background:#EEF4FF"><td colspan="4" style="font-weight:700;color:#1A4FD6;font-size:14px">Total [Excl. GST]</td><td contenteditable="true" class="editable-price">₹ (To be quoted)</td></tr>
  </tbody></table>
</div>

<div class="section">
  <div class="sec-head"><div class="sec-num">6</div><div class="sec-title">Constraints & Assumptions</div></div>
  <ul class="bullets">
    <li>Delivery dates may change based on stakeholder responsiveness.</li>
    <li>Third-party integrations depend on external API capabilities.</li>
    <li>Zoho plan limits on records/storage may require add-ons.</li>
    <li>Final scope confirmed through FSD sign-off.</li>
    <li>Clean, validated data to be provided by ${cli.company} for migration.</li>
  </ul>
</div>

<div class="section">
  <div class="sec-head"><div class="sec-num">7</div><div class="sec-title">Acceptance</div></div>
  <div class="acceptance-grid">
    <div class="acceptance-col"><label>For Fristine Infotech Pvt Ltd</label><div class="sign-line"></div><div class="sign-field">Signature:</div><div class="sign-line"></div><div class="sign-field">Name:</div><div class="sign-line"></div><div class="sign-field">Date:</div></div>
    <div class="acceptance-col"><label>For ${cli.company}</label><div class="sign-line"></div><div class="sign-field">Signature:</div><div class="sign-line"></div><div class="sign-field">Name:</div><div class="sign-line"></div><div class="sign-field">Date:</div></div>
  </div>
</div>

<div class="footer">
  <div class="footer-logo"><div class="footer-logo-box">F</div><div class="footer-brand">Fristine Infotech · India's Leading Premium Zoho Partner</div></div>
  <div class="footer-conf">Confidential · ${new Date().getFullYear()}</div>
</div>
</div></body></html>`;

    if (activeClientId) {
        try { await proposals.save(activeClientId, html, `Proposal — ${cli.company}`); } catch {}
        try { await tracking.logEvent(activeClientId, 'proposal_generated'); } catch {}
        try { await tracking.logEvent(activeClientId, 'proposal_submitted'); } catch {}
    }

    pendingBlob = new Blob([html], { type: 'text/html' });
    pendingName = fname;
    hideLdr();

    addAg(`
        <div class="reqcard-box" style="text-align:center;padding:28px 20px;">
            <div style="margin-bottom:14px"><svg viewBox="0 0 48 48" width="48" height="48" fill="none"><circle cx="24" cy="24" r="20" stroke="var(--green)" stroke-width="2.5"/><path d="M15 24l6 6 12-12" stroke="var(--green)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
            <div style="font-size:17px;font-weight:700;margin-bottom:10px">Your Zoho Proposal is Generated!</div>
            <div style="font-size:13px;color:var(--sub);line-height:1.75;max-width:400px;margin:0 auto">
                Your requirements have been successfully mapped and your strategic Zoho roadmap has been compiled.<br/><br/>
                <strong>A Fristine presales specialist is reviewing your proposal and will share the detailed documents with you shortly.</strong>
            </div>
        </div>`, { noEscape: true });
}

/**
 * Properly converts a full HTML document string to PDF.
 * Handles <!DOCTYPE> documents by extracting styles and body content,
 * rendering inside a hidden iframe so styles apply correctly.
 */
async function exportHtmlToPdf(htmlString, filename) {
    return new Promise((resolve, reject) => {
        // Use a hidden iframe so the full HTML document renders with its own styles
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:960px;height:auto;border:none;';
        document.body.appendChild(iframe);

        iframe.onload = () => {
            // Wait a moment for fonts/styles to apply
            setTimeout(() => {
                const body = iframe.contentDocument.body;
                if (!body || !body.firstElementChild) {
                    document.body.removeChild(iframe);
                    reject(new Error('Empty document'));
                    return;
                }

                const opt = {
                    margin: 0,
                    filename,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, windowWidth: 960 },
                    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
                };

                html2pdf().set(opt).from(body.firstElementChild).save().then(() => {
                    document.body.removeChild(iframe);
                    resolve();
                }).catch(err => {
                    document.body.removeChild(iframe);
                    reject(err);
                });
            }, 500);
        };

        iframe.srcdoc = htmlString;
    });
}

document.addEventListener('downloadClientProposal', async () => {
    if (!pendingBlob) return;
    const htmlText = await pendingBlob.text();
    showLdr('Exporting PDF…');
    try {
        await exportHtmlToPdf(htmlText, pendingName.replace('.html', '.pdf'));
    } catch (e) {
        console.error('[PDF]', e);
        showToast('PDF export failed', 'error');
    }
    hideLdr();
});

/* ── Client-side DOCX download ── */
document.addEventListener('downloadClientDocx', async () => {
    if (!pendingBlob || !cli) return;
    showLdr('Generating DOCX…');
    try {
        const htmlText = await pendingBlob.text();
        await generateDocx(htmlText, cli.company || 'Client');
        hideLdr();
        showToast('DOCX downloaded!', 'success');
    } catch (e) {
        hideLdr();
        showToast('DOCX export failed: ' + e.message, 'error');
    }
});

/* ══ BRD / FSD GENERATION ══ */
document.addEventListener('generateBRD', async () => {
    if (!reqs || !cli) return;
    showLdr('Generating Business Requirements Document…');
    try {
        const brdPrompt = `Generate a comprehensive Business Requirements Document (BRD) in clean HTML for ${cli.company}.

REQUIREMENTS DATA:
${JSON.stringify(reqs, null, 2)}

SOLUTION DATA:
${JSON.stringify(sol || {}, null, 2)}

Generate a professional BRD HTML document with these sections:
1. Executive Summary
2. Business Objectives
3. Project Scope (In-Scope / Out-of-Scope)
4. Stakeholders & Roles
5. Current State Analysis (current tools, pain points)
6. Business Requirements (numbered, with priority: Must-Have / Nice-to-Have)
7. Functional Requirements (grouped by department/module)
8. Non-Functional Requirements (performance, security, scalability)
9. Integration Requirements
10. Success Criteria & KPIs
11. Assumptions & Constraints
12. Approval & Sign-off

Use clean professional styling. Company: ${cli.company}, Industry: ${reqs.industry || cli.industry || '—'}.
Include Fristine Infotech branding (India's leading Premium Zoho Partner).
Return ONLY the complete HTML document, no markdown wrapping.`;

        const brdHtml = await gem(brdPrompt, 4000, 0.4, true);
        const cleanHtml = brdHtml.replace(/```html|```/g, '').trim();
        await exportHtmlToPdf(cleanHtml, `BRD_${(cli.company || 'Client').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
        hideLdr();
        showToast('BRD downloaded!', 'success');
    } catch (e) {
        hideLdr();
        showToast('BRD generation failed: ' + e.message, 'error');
    }
});

document.addEventListener('generateFSD', async () => {
    if (!reqs || !cli) return;
    showLdr('Generating Functional Specification Document…');
    try {
        const fsdPrompt = `Generate a comprehensive Functional Specification Document (FSD) in clean HTML for ${cli.company}.

REQUIREMENTS DATA:
${JSON.stringify(reqs, null, 2)}

SOLUTION DATA:
${JSON.stringify(sol || {}, null, 2)}

Generate a professional FSD HTML document with these sections:
1. Document Control (version, date, author: Fristine Infotech Presales)
2. Introduction & Purpose
3. System Overview & Architecture
4. Zoho Modules Configuration:
   - For each recommended product, detail: module setup, custom fields, layouts, workflows, automation rules
5. User Roles & Permissions Matrix
6. Data Model & Field Mappings
7. Business Process Workflows (step-by-step with triggers, conditions, actions)
8. Automation Rules & Workflow Definitions
9. Integration Specifications (APIs, data flow, sync frequency)
10. Data Migration Plan (source → target mapping, cleansing rules)
11. Reporting & Dashboard Specifications
12. UAT Test Scenarios (test case ID, steps, expected result)
13. Training Plan
14. Deployment & Go-Live Checklist

Products to configure: ${(reqs.zoho_products || sol?.primary_products || ['Zoho CRM']).join(', ')}
Company: ${cli.company}, Industry: ${reqs.industry || cli.industry || '—'}, Users: ${reqs.user_count || '—'}
Include Fristine Infotech branding.
Return ONLY the complete HTML document, no markdown wrapping.`;

        const fsdHtml = await gem(fsdPrompt, 4000, 0.4, true);
        const cleanHtml = fsdHtml.replace(/```html|```/g, '').trim();
        await exportHtmlToPdf(cleanHtml, `FSD_${(cli.company || 'Client').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
        hideLdr();
        showToast('FSD downloaded!', 'success');
    } catch (e) {
        hideLdr();
        showToast('FSD generation failed: ' + e.message, 'error');
    }
});

/* ══ DOCX GENERATION ══ */
async function generateDocx(proposalHtml, companyName) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(proposalHtml, 'text/html');

    const sections = doc.querySelectorAll('.section');
    const children = [];

    // Title page
    children.push(
        new Paragraph({ spacing: { after: 600 }, children: [] }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'FRISTINE INFOTECH', bold: true, size: 28, color: '1A4FD6', font: 'Calibri' })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: "India's Leading Premium Zoho Partner", italics: true, size: 20, color: '4F6282', font: 'Calibri' })],
        }),
        new Paragraph({ spacing: { after: 400 }, children: [] }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'Zoho Implementation Proposal', bold: true, size: 36, color: '1A4FD6', font: 'Calibri' })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: `For ${companyName}`, bold: true, size: 28, color: '1A2540', font: 'Calibri' })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: `Prepared: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, size: 20, color: '7A91B3', font: 'Calibri' })],
        }),
        new Paragraph({ spacing: { after: 200 }, children: [] })
    );

    // Parse all text content from sections
    sections.forEach(section => {
        const titleEl = section.querySelector('.sec-title');
        if (titleEl) {
            children.push(new Paragraph({
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
                children: [new TextRun({ text: titleEl.textContent, bold: true, size: 28, color: '1A4FD6', font: 'Calibri' })],
            }));
        }

        // Get all paragraphs
        section.querySelectorAll('p').forEach(p => {
            children.push(new Paragraph({
                spacing: { after: 120 },
                children: [new TextRun({ text: p.textContent, size: 22, color: '4F6282', font: 'Calibri' })],
            }));
        });

        // Get all table data
        section.querySelectorAll('table').forEach(table => {
            const rows = [];
            table.querySelectorAll('tr').forEach(tr => {
                const cells = [];
                tr.querySelectorAll('th, td').forEach(cell => {
                    const isHeader = cell.tagName === 'TH';
                    cells.push(new TableCell({
                        width: { size: 100 / tr.children.length, type: WidthType.PERCENTAGE },
                        shading: isHeader ? { fill: '0B1120', type: ShadingType.SOLID, color: '0B1120' } : undefined,
                        children: [new Paragraph({
                            spacing: { after: 60 },
                            children: [new TextRun({
                                text: cell.textContent.trim(),
                                bold: isHeader,
                                size: isHeader ? 18 : 20,
                                color: isHeader ? 'FFFFFF' : '1A2540',
                                font: 'Calibri',
                            })],
                        })],
                    }));
                });
                if (cells.length > 0) {
                    rows.push(new TableRow({ children: cells }));
                }
            });
            if (rows.length > 0) {
                children.push(new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows,
                }));
                children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
            }
        });

        // Get lists
        section.querySelectorAll('li').forEach(li => {
            children.push(new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60 },
                children: [new TextRun({ text: li.textContent.trim(), size: 22, color: '4F6282', font: 'Calibri' })],
            }));
        });
    });

    // Footer
    children.push(
        new Paragraph({ spacing: { after: 400 }, children: [] }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Confidential — Fristine Infotech Pvt Ltd — ${new Date().getFullYear()}`, size: 18, color: '7A91B3', font: 'Calibri' })],
        })
    );

    const docxDoc = new Document({
        sections: [{
            properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
            children,
        }],
    });

    const blob = await Packer.toBlob(docxDoc);
    saveAs(blob, `Proposal_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.docx`);
}

/* ══ MODALS ══ */
function openModal(id)  { document.getElementById(id).classList.add('visible'); }
function closeModal(id) { document.getElementById(id).classList.remove('visible'); }

document.getElementById('closeVideoBtn').addEventListener('click', () => { closeModal('videoModal'); generateProposal(); });
document.getElementById('playBtn')?.addEventListener('click', () => {
    const vpInner = document.querySelector('.vp-inner');
    if (vpInner && !vpInner.querySelector('video')) {
        vpInner.innerHTML = `<video width="100%" height="100%" controls autoplay style="border-radius:12px;background:#000;">
                                <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
                                Your browser does not support HTML video.
                             </video>`;
    }
});
document.getElementById('closeProposalBtn').addEventListener('click',  () => closeModal('proposalModal'));
document.getElementById('closeProposalBtn2')?.addEventListener('click', () => closeModal('proposalModal'));

document.getElementById('saveProposalEditsBtn')?.addEventListener('click', async () => {
    const cid  = currentTrackingClient?.client_id || activeClientId;
    if (!cid) return;
    const iframe = document.getElementById('proposalIframe');
    const updatedHtml = iframe.contentDocument.documentElement.outerHTML;
    const verId = document.getElementById('proposalModal').dataset.version;
    try {
        await proposals.update(cid, updatedHtml, verId ? parseInt(verId) : null);
        showToast(`Saved Version ${verId || 'Latest'}!`, 'success');
    } catch { showToast('Save failed', 'error'); }
});

document.getElementById('downloadProposalBtn')?.addEventListener('click', async () => {
    if (!currentTrackingClient) return;
    const btn = document.getElementById('downloadProposalBtn');
    const ogText = btn.textContent;
    btn.textContent = 'Exporting...';
    btn.disabled = true;
    try {
        const pData = await proposals.get(currentTrackingClient.client_id);
        const verId = document.getElementById('proposalModal').dataset.version;
        const pVer = verId ? pData.versions.find(x => x.version == parseInt(verId)) : pData.versions[pData.versions.length-1];
        if (!pVer || !pVer.proposal_html) throw new Error('No proposal');
        await exportHtmlToPdf(pVer.proposal_html, `Proposal_${currentTrackingClient.company}_v${verId||pData.versions.length}.pdf`);
    } catch { showToast('No proposal found', 'error'); }
    btn.textContent = ogText;
    btn.disabled = false;
});

/* ── DOCX Download ── */
document.getElementById('downloadDocxBtn')?.addEventListener('click', async () => {
    if (!currentTrackingClient) return;
    const btn = document.getElementById('downloadDocxBtn');
    const ogText = btn.textContent;
    btn.textContent = 'Generating...';
    btn.disabled = true;
    try {
        const pData = await proposals.get(currentTrackingClient.client_id);
        const verId = document.getElementById('proposalModal').dataset.version;
        const pVer = verId ? pData.versions.find(x => x.version == parseInt(verId)) : pData.versions[pData.versions.length - 1];
        if (pVer && pVer.proposal_html) {
            await generateDocx(pVer.proposal_html, currentTrackingClient.company || 'Client');
            showToast('DOCX downloaded!', 'success');
        } else {
            showToast('No proposal found', 'error');
        }
    } catch (e) {
        showToast('DOCX export failed: ' + e.message, 'error');
    } finally {
        btn.textContent = ogText;
        btn.disabled = false;
    }
});

/* ══ LOGOUT / BACK ══ */
document.getElementById('staffLogout').addEventListener('click', () => { localStorage.removeItem('f_active_agent'); location.reload(); });
document.getElementById('logoutBtn').addEventListener('click', () => { window.location.href = window.location.pathname; });
document.getElementById('trackLogout').addEventListener('click', () => { localStorage.removeItem('f_active_agent'); location.reload(); });
document.getElementById('backToDashBtn').addEventListener('click', () => { hide('T'); show('H'); renderClientTable(); });

/* ══ THEME ══ */
function initTheme() {
    const saved = localStorage.getItem('f_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    ['themeToggleH', 'themeToggleT', 'themeToggleA', 'themeToggleL'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = toggleTheme;
    });
}
function toggleTheme() {
    const cur  = document.documentElement.getAttribute('data-theme') || 'light';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('f_theme', next);
}

/* ══ PASSWORD TOGGLE ══ */
function initPasswordToggle() {
    document.getElementById('pwToggle')?.addEventListener('click', () => {
        const inp = document.getElementById('pw');
        inp.type = inp.type === 'password' ? 'text' : 'password';
    });
}

/* ══ UI HELPERS ══ */
function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

function showLdr(txt, pct = null) {
    const l  = document.getElementById('ldr');
    l.classList.remove('hidden');
    document.getElementById('ltxt').textContent = txt;
    const pb = document.getElementById('ldrPb');
    if (pb) { pb.style.display = pct !== null ? 'block' : 'none'; if (pct !== null) pb.style.width = pct + '%'; }
    spawnParticles();
    gsap.fromTo(l, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
}
function hideLdr() {
    const l = document.getElementById('ldr');
    gsap.to(l, { opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: () => l.classList.add('hidden') });
}

function spawnParticles() {
    const container = document.getElementById('ldrParticles');
    if (!container || container.childElementCount > 15) return;
    container.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = 40 + Math.random() * 50 + '%';
        p.style.animationDelay = Math.random() * 3 + 's';
        p.style.animationDuration = 2 + Math.random() * 2 + 's';
        p.style.width = p.style.height = 2 + Math.random() * 3 + 'px';
        container.appendChild(p);
    }
}

function setStg(i, st) {
    const d = document.getElementById('s' + i), l = document.getElementById('sl' + i);
    if (!d || !l) return;
    d.className = 'stage-num ' + st;
    l.className = 'stage-lbl ' + st;
}
function setPhase(txt) { document.getElementById('phaseTxt').textContent = txt; }
function updateCov(p) { document.getElementById('cvb').style.width = p + '%'; document.getElementById('cvp').textContent = p + '%'; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function addAg(msg, opts = {}) {
    const f = document.getElementById('feed');
    const d = document.createElement('div');
    d.className = 'msg ag';
    if (opts.noEscape) {
        d.innerHTML = `<div class="msg-av">F</div><div class="msg-bubble msg-bubble-wide">${msg}</div>`;
    } else {
        d.innerHTML = `<div class="msg-av">F</div><div class="msg-bubble">${msg}</div>`;
    }
    if (opts.inds) {
        const wrap = document.createElement('div');
        wrap.className = 'industry-btns';
        opts.inds.forEach(ind => {
            const btn = document.createElement('button');
            btn.className = 'ind-btn';
            btn.textContent = ind;
            btn.onclick = () => {
                prof.confirmed = ind;
                document.querySelectorAll('.ind-btn').forEach(b => b.disabled = true);
                addUs(ind); setStg(1, 'done'); beginGather();
            };
            wrap.appendChild(btn);
        });
        d.querySelector('.msg-bubble').appendChild(wrap);
    }
    if (opts.video) {
        const vid = document.createElement('div');
        vid.className = 'video-placeholder'; vid.style.marginTop = '12px'; vid.style.height = '120px';
        vid.innerHTML = `<div class="vp-inner"><div class="vp-play">▶</div><div class="vp-text">Strategy Brief</div></div>`;
        vid.onclick = () => openModal('videoModal');
        d.querySelector('.msg-bubble').appendChild(vid);
    }
    f.appendChild(d);
    f.scrollTop = f.scrollHeight;
    saveConversationMemory();
}

function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function addUs(msg) {
    const f = document.getElementById('feed');
    const d = document.createElement('div');
    d.className = 'msg u';
    d.innerHTML = `<div class="msg-av">U</div><div class="msg-bubble">${escHtml(msg)}</div>`;
    f.appendChild(d);
    f.scrollTop = f.scrollHeight;
    saveConversationMemory();
}

function showToast(message, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast-notification ${type}`;
    const icon = type === 'success'
        ? '<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M4 8l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : '<svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>';
    t.innerHTML = icon + message;
    document.body.appendChild(t);
    setTimeout(() => {
        t.classList.add('exiting');
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

/* ══ BOOT ══ */
init();
