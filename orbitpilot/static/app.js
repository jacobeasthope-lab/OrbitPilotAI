const $ = (id) => document.getElementById(id);
const originalMountArt=document.querySelector('.mount-illustration');
if(originalMountArt){
  const viewer=document.createElement('section');
  viewer.className='mount3d-viewer';
  viewer.id='mount3dViewer';
  viewer.setAttribute('aria-label','Interactive 3D telescope model');
  viewer.innerHTML=`
    <div class="mount3d-toolbar">
      <div class="mount3d-title"><span class="mount3d-live-dot"></span><b>3D TELESCOPE MODEL</b><span id="mount3dMode">WAITING FOR MOUNT</span></div>
      <div class="mount3d-tools">
        <button type="button" class="mount3d-tool" id="mount3dZoomOut" title="Zoom out" aria-label="Zoom out">−</button>
        <button type="button" class="mount3d-tool" id="mount3dZoomIn" title="Zoom in" aria-label="Zoom in">+</button>
        <button type="button" class="mount3d-tool mount3d-reset" id="mount3dReset" title="Reset 3D view">Reset view</button>
      </div>
    </div>
    <div class="mount3d-scene" id="mount3dScene" tabindex="0" role="application" aria-label="Drag to orbit the 3D telescope model. Use arrow keys to rotate the view and plus or minus to zoom.">
      <div class="mount3d-stars" aria-hidden="true"></div>
      <div class="mount3d-horizon" aria-hidden="true"></div>
      <svg class="mount3d-model" id="mount3dModel" viewBox="0 0 560 340" role="img" aria-label="Three-dimensional SmartEQ-style telescope and tripod">
        <defs>
          <linearGradient id="m3-tube" x1="0" y1="0" x2="0.2" y2="1"><stop stop-color="#d8e6f4"/><stop offset=".24" stop-color="#71849a"/><stop offset=".7" stop-color="#3b4d62"/><stop offset="1" stop-color="#192637"/></linearGradient>
          <linearGradient id="m3-metal" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#d0dbe8"/><stop offset=".45" stop-color="#586b80"/><stop offset="1" stop-color="#202e3d"/></linearGradient>
          <linearGradient id="m3-leg" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#263548"/><stop offset=".5" stop-color="#8597a8"/><stop offset="1" stop-color="#263548"/></linearGradient>
          <linearGradient id="m3-lens" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b6ffff"/><stop offset=".38" stop-color="#39b9d1"/><stop offset="1" stop-color="#10263e"/></linearGradient>
          <radialGradient id="m3-glow"><stop stop-color="#44d8e8" stop-opacity=".28"/><stop offset="1" stop-color="#44d8e8" stop-opacity="0"/></radialGradient>
          <filter id="m3-shadow" x="-.5" y="-.5" width="2" height="2"><feGaussianBlur stdDeviation="7"/></filter>
        </defs>
        <ellipse cx="282" cy="312" rx="151" ry="17" fill="#02070d" opacity=".8" filter="url(#m3-shadow)"/>
        <g class="mount3d-tripod" stroke-linejoin="round">
          <path d="M270 220 181 309 169 309 260 210Z" fill="url(#m3-leg)" stroke="#a9bac8" stroke-opacity=".4"/>
          <path d="M285 218 388 302 379 310 274 230Z" fill="url(#m3-leg)" stroke="#b3c0cc" stroke-opacity=".42"/>
          <path d="M278 220 279 321 267 321 267 217Z" fill="url(#m3-leg)" stroke="#a9bac8" stroke-opacity=".35"/>
          <path d="m166 306 23 0-5 8-20 1Zm210-1 20-10 5 9-21 11Zm-112 12h20l-1 8h-20Z" fill="#111c29" stroke="#73899c" stroke-width="2"/>
          <path d="m177 292 21 3m178-2 17-11m-107 21v17" stroke="#c3d0db" stroke-opacity=".44" stroke-width="2"/>
          <path d="m188 302 4 5m188-10 5 5m-114 21 7 0" stroke="#45cedd" stroke-width="2"/>
        </g>
        <path d="M267 179h27v57l-7 12h-14l-6-12Z" fill="url(#m3-metal)" stroke="#a8bdcd" stroke-opacity=".55" stroke-width="2"/>
        <path d="M260 230h41l13 9-12 9h-41l-12-9Z" fill="#34475b" stroke="#a6b8c8" stroke-opacity=".65" stroke-width="2"/>
        <path d="M265 236h32" stroke="#40c8d8" stroke-opacity=".75" stroke-width="2"/>
        <circle cx="280" cy="133" r="52" fill="url(#m3-glow)"/>
        <g id="mount3dAzimuthAxis">
          <path d="m259 171 10-46 22-18 25 15-3 40-20 20Z" fill="#26394c" stroke="#9eafbf" stroke-width="2"/>
          <path d="m270 125 21-18 25 15-22 18Z" fill="#91a2b1" stroke="#e0e8ef" stroke-opacity=".65" stroke-width="1.5"/>
          <path d="m294 140 22-18 2 38-20 20Z" fill="#172536" stroke="#71879b" stroke-width="1.5"/>
          <circle cx="281" cy="136" r="26" fill="#182839" stroke="#a1b3c1" stroke-width="3"/>
          <circle cx="281" cy="136" r="17" fill="url(#m3-metal)" stroke="#45c6d6" stroke-width="2"/>
          <circle cx="281" cy="136" r="5" fill="#d0e4ef"/>
          <path d="m253 136h56m-28-28v56" stroke="#d4e0ea" stroke-opacity=".25" stroke-width="2"/>
          <g id="mount3dAltitudeAxis" transform="rotate(-30 281 136)">
            <path d="M279 136 193 174" stroke="#a9bac9" stroke-width="10" stroke-linecap="round"/>
            <path d="M279 136 193 174" stroke="#28394c" stroke-width="4" stroke-linecap="round"/>
            <path d="M202 158 183 166l9 23 20-8Z" fill="url(#m3-metal)" stroke="#c0cfda" stroke-width="2"/>
            <ellipse cx="190" cy="177" rx="8" ry="13" fill="#8796a5" stroke="#d9e3eb" stroke-width="2"/>
            <path d="M280 136h-8v-9h16v18h-16v-9m8-4v8" fill="#d0dbe5" stroke="#334559" stroke-width="2"/>
            <path d="M281 136 462 136l14-10 14 2v17l-15 4-13-7-181 6Z" fill="url(#m3-tube)" stroke="#d8e2eb" stroke-width="2"/>
            <path d="M294 130h168v5H294Zm0 17h168v5H294Z" fill="#18283a" opacity=".85"/>
            <path d="M308 128v28m8-28v28m137-29v29" stroke="#9aabba" stroke-opacity=".8" stroke-width="3"/>
            <ellipse cx="477" cy="136" rx="9" ry="15" fill="#182637" stroke="#d1e1ea" stroke-width="3"/>
            <ellipse cx="479" cy="136" rx="5" ry="10" fill="url(#m3-lens)" stroke="#5fe4ed" stroke-width="1.5"/>
            <path d="m351 130 12-17 25 0 11 17Z" fill="#40566c" stroke="#aebdca" stroke-width="2"/>
            <path d="m363 113 5-12h17l4 12" fill="#233548" stroke="#9eb0bf" stroke-width="2"/>
            <path d="m369 101h10" stroke="#48d6e0" stroke-width="2"/>
            <path d="m324 127 4-13 22-2 7 16" fill="#354a5e" stroke="#aab9c5" stroke-width="2"/>
            <circle cx="335" cy="112" r="4" fill="#5ed5de"/>
            <path d="M276 136h10m-5-5v10" stroke="#ecf8ff" stroke-width="2"/>
          </g>
          <path d="m272 170 18 2m-13-9 13 1" stroke="#41d1df" stroke-width="2"/>
        </g>
      </svg>
      <div class="mount3d-overlay mount3d-alt-label" id="mount3dAltLabel">ALT --.-°</div>
      <div class="mount3d-overlay mount3d-az-label" id="mount3dAzLabel">AZ --.-°</div>
      <div class="mount3d-compass" aria-hidden="true"><span>N</span><i></i><span>S</span></div>
      <div class="mount3d-drag-hint">DRAG TO ORBIT · SCROLL TO ZOOM</div>
    </div>`;
  originalMountArt.replaceWith(viewer);
}
function loadStored(key,fallback){try{const value=JSON.parse(localStorage.getItem(key));return value??fallback}catch{return fallback}}
const state = { page: 'dashboard', mountMode: 'ascom', mountConnected: false, mountSimulator: false, mountAxes: {}, mount3dYaw: -16, mount3dPitch: 8, mount3dZoom: 1, mount3dDrag: null, activeMotions: new Map(), cameraCount: 0, cameraCaptureConnected: false, cameraPreviewActive: false, cameraFrameBusy: false, cameraObjectUrl: null, phd: null, system: null, history: [], conversations: loadStored('orbitpilot-conversations',[]), activeConversationId: null, chatAbort: null, skySelection: null, skyObjects: [], journal: loadStored('orbitpilot-journal',[]) };
const initialWelcomeMarkup=$('chatMessages')?.innerHTML||'';

function updateMount3dCamera(){
  const model=$('mount3dModel');
  if(model)model.style.transform=`perspective(900px) rotateX(${state.mount3dPitch}deg) rotateY(${state.mount3dYaw}deg) scale(${state.mount3dZoom})`;
}
const mount3dScene=$('mount3dScene');
if(mount3dScene){
  mount3dScene.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    state.mount3dDrag={x:event.clientX,y:event.clientY,yaw:state.mount3dYaw,pitch:state.mount3dPitch};
    mount3dScene.classList.add('dragging');
    mount3dScene.setPointerCapture(event.pointerId);
  });
  mount3dScene.addEventListener('pointermove',event=>{
    if(!state.mount3dDrag)return;
    state.mount3dYaw=state.mount3dDrag.yaw+(event.clientX-state.mount3dDrag.x)*.55;
    state.mount3dPitch=Math.max(-18,Math.min(35,state.mount3dDrag.pitch+(event.clientY-state.mount3dDrag.y)*.35));
    updateMount3dCamera();
  });
  const endMount3dDrag=()=>{state.mount3dDrag=null;mount3dScene.classList.remove('dragging')};
  mount3dScene.addEventListener('pointerup',endMount3dDrag);
  mount3dScene.addEventListener('pointercancel',endMount3dDrag);
  mount3dScene.addEventListener('wheel',event=>{
    event.preventDefault();
    state.mount3dZoom=Math.max(.72,Math.min(1.45,state.mount3dZoom+(event.deltaY<0?.08:-.08)));
    updateMount3dCamera();
  },{passive:false});
  mount3dScene.addEventListener('keydown',event=>{
    const step=event.shiftKey?12:5;
    if(event.key==='ArrowLeft')state.mount3dYaw-=step;
    else if(event.key==='ArrowRight')state.mount3dYaw+=step;
    else if(event.key==='ArrowUp')state.mount3dPitch=Math.max(-18,state.mount3dPitch-step);
    else if(event.key==='ArrowDown')state.mount3dPitch=Math.min(35,state.mount3dPitch+step);
    else if(event.key==='+'||event.key==='=')state.mount3dZoom=Math.min(1.45,state.mount3dZoom+.08);
    else if(event.key==='-')state.mount3dZoom=Math.max(.72,state.mount3dZoom-.08);
    else return;
    event.preventDefault();
    updateMount3dCamera();
  });
}
$('mount3dZoomIn')?.addEventListener('click',()=>{state.mount3dZoom=Math.min(1.45,state.mount3dZoom+.1);updateMount3dCamera()});
$('mount3dZoomOut')?.addEventListener('click',()=>{state.mount3dZoom=Math.max(.72,state.mount3dZoom-.1);updateMount3dCamera()});
$('mount3dReset')?.addEventListener('click',()=>{state.mount3dYaw=-16;state.mount3dPitch=8;state.mount3dZoom=1;updateMount3dCamera()});
updateMount3dCamera();

const galaxies = [
  {id:'M31',name:'Andromeda Galaxy',type:'Spiral',distance:'2.54 million ly',mag:'3.4',difficulty:'Beginner',constellation:'Andromeda',ra:'00h 42m 44s',dec:'+41° 16′ 09″',raH:0.712,decD:41.269,desc:'The nearest large spiral galaxy to the Milky Way and the dominant member of the Local Group.',fact:'Andromeda is approaching the Milky Way; the two galaxies are expected to interact billions of years from now.',art:1},
  {id:'M33',name:'Triangulum Galaxy',type:'Spiral',distance:'2.73 million ly',mag:'5.7',difficulty:'Intermediate',constellation:'Triangulum',ra:'01h 33m 50s',dec:'+30° 39′ 37″',raH:1.564,decD:30.660,desc:'A face-on spiral galaxy and another important member of the Local Group.',fact:'M33 has extensive star-forming regions, including the giant nebula NGC 604.',art:2},
  {id:'M51',name:'Whirlpool Galaxy',type:'Interacting',distance:'~23 million ly',mag:'8.4',difficulty:'Intermediate',constellation:'Canes Venatici',ra:'13h 29m 53s',dec:'+47° 11′ 43″',raH:13.498,decD:47.195,desc:'A striking interacting pair with a prominent spiral structure and a smaller companion.',fact:'Its companion galaxy helps shape the Whirlpool’s spiral arms through gravitational interaction.',art:3},
  {id:'M81',name:'Bode’s Galaxy',type:'Spiral',distance:'~12 million ly',mag:'6.9',difficulty:'Beginner',constellation:'Ursa Major',ra:'09h 55m 33s',dec:'+69° 03′ 55″',raH:9.926,decD:69.065,desc:'A bright, grand-design spiral galaxy in Ursa Major, often observed alongside M82.',fact:'M81 is one of the brightest galaxies in the sky as seen from Earth.',art:4},
  {id:'M82',name:'Cigar Galaxy',type:'Interacting',distance:'~12 million ly',mag:'8.4',difficulty:'Intermediate',constellation:'Ursa Major',ra:'09h 55m 52s',dec:'+69° 40′ 47″',raH:9.931,decD:69.680,desc:'An edge-on starburst galaxy with strong star formation near its central region.',fact:'Powerful winds from its starburst region carry gas out above and below the galactic disk.',art:5},
  {id:'M101',name:'Pinwheel Galaxy',type:'Spiral',distance:'~21 million ly',mag:'7.9',difficulty:'Intermediate',constellation:'Ursa Major',ra:'14h 03m 13s',dec:'+54° 20′ 57″',raH:14.054,decD:54.349,desc:'A large, face-on spiral galaxy with extended, asymmetric spiral arms.',fact:'Its large apparent size makes it a rewarding wide-field astrophotography target under dark skies.',art:6},
  {id:'M104',name:'Sombrero Galaxy',type:'Spiral',distance:'~29 million ly',mag:'8.0',difficulty:'Advanced',constellation:'Virgo',ra:'12h 39m 59s',dec:'−11° 37′ 23″',raH:12.666,decD:-11.623,desc:'A galaxy seen at a shallow angle, famous for its bright central bulge and dark dust lane.',fact:'It has a very prominent central bulge and a striking dust lane across its disk.',art:7},
  {id:'M64',name:'Black Eye Galaxy',type:'Spiral',distance:'~17 million ly',mag:'8.5',difficulty:'Intermediate',constellation:'Coma Berenices',ra:'12h 56m 44s',dec:'+21° 40′ 58″',raH:12.945,decD:21.683,desc:'A spiral galaxy with a distinctive dark band of dust in front of its bright nucleus.',fact:'Its inner gas rotates in the opposite direction to much of its outer gas.',art:8}
];

function toast(message, tone='info') { const el=$('toast'); el.textContent=message; el.dataset.tone=tone; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),3600); }
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function api(path, options={}) {
  let res;
  try{
    res=await fetch(path,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  }catch(error){
    if(error.name==='AbortError')throw error;
    if(error instanceof TypeError)throw new Error('Cannot reach the OrbitPilotAI local service. This may be an old browser preview; launch the latest dist\\OrbitPilotAI.exe and use its app window. The saved Groq key is not the cause.');
    throw error;
  }
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.detail||data.message||`Request failed (${res.status})`);
  return data;
}
function setPage(page){state.page=page;document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${page}`));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));const names={dashboard:'Home',assistant:'AI Assistant',sky:'Sky map',galaxies:'Galaxy explorer',telescope:'Telescope control',camera:'Camera studio',guiding:'PHD2 guiding',journal:'Observing journal',settings:'Settings'};$('pageTitle').textContent=names[page]||page;$('appShell').classList.toggle('dashboard-active',page==='dashboard');if(page==='sky')drawSky();if(page==='camera')refreshCamera();if(page==='telescope')refreshMount();if(page==='journal')renderJournal();if(page==='assistant')renderConversationHistory();$('appShell').classList.remove('mobile-nav-open');}
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.page)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>setPage(b.dataset.go)));

const artwork=Object.entries({
  '.feature-ai':'ai','.feature-sky':'sky','.feature-deep':'galaxy','.feature-mount':'telescope',
  '.feature-guide':'guiding','.feature-camera':'camera','.feature-journal':'journal','.feature-settings':'settings',
  '#page-galaxies .page-intro':'galaxy','#page-sky .page-intro':'sky','#page-telescope .page-intro':'telescope',
  '#page-camera .page-intro':'camera','#page-guiding .page-intro':'guiding','#page-journal .page-intro':'journal',
  '#page-settings .page-intro':'settings'
});
for(const [selector,symbol] of artwork){
  const container=document.querySelector(selector);if(!container)continue;
  const illustration=document.createElementNS('http://www.w3.org/2000/svg','svg');
  illustration.classList.add(selector.startsWith('.feature-')?'feature-art':'page-art');
  illustration.setAttribute('viewBox','0 0 220 140');illustration.setAttribute('aria-hidden','true');illustration.setAttribute('focusable','false');
  const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href',`/static/orbit-art.svg#${symbol}`);illustration.append(use);container.prepend(illustration);
}

function redesignDashboard(){
  const dashboard=$('page-dashboard'),hero=dashboard?.querySelector('.hero-card'),copy=hero?.querySelector('.hero-copy');
  if(!dashboard||!hero||!copy)return;
  const brandMark=document.querySelector('.brand-mark');
  if(brandMark){
    const logo=document.createElement('img');
    logo.className='brand-mark';
    logo.src='/static/dashboard-logo.png';
    logo.alt='';
    logo.setAttribute('aria-hidden','true');
    brandMark.replaceWith(logo);
  }
  dashboard.classList.add('orbit-home');
  dashboard.querySelector('.welcome-row')?.remove();
  hero.classList.add('orbit-command-hero');
  copy.innerHTML=`
    <h2><i class="dashboard-brand-name">ORBIT<span>PILOTAI</span></i><strong class="dashboard-tagline">Your Intelligence. <span>Without Limits.</span></strong></h2>
    <p>One powerful workspace for astronomy, your telescope, and the night sky.</p>
    <div class="hero-benefits"><span><i>✓</i> Astronomy AI</span><span><i>✓</i> Live sky map</span><span><i>✓</i> Telescope tools</span></div>
    <div class="dashboard-composer">
      <textarea id="dashboardPrompt" rows="1" placeholder="Ask anything…" aria-label="Ask Orbit AI"></textarea>
      <div class="dashboard-composer-foot">
        <div class="dashboard-composer-tools">
          <button type="button" class="composer-tool" id="dashboardAttach" title="Attach a text note"><span>＋</span> Attach notes</button>
          <button type="button" class="composer-tool" id="dashboardVoice" title="Dictate a prompt"><span>◖</span> Voice</button>
          <button type="button" class="composer-tool composer-camera" id="dashboardCamera" title="Open camera studio"><span>▣</span> Camera</button>
        </div>
        <div class="dashboard-composer-submit"><span class="dashboard-model"><i class="composer-status"></i><span id="dashboardModel">Groq · checking connection…</span></span><button class="send-btn" id="dashboardSend" title="Start a conversation" aria-label="Send prompt"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/></svg></button></div>
      </div>
    </div>`;
  hero.querySelector('.hero-art')?.remove();

  const statusHeading=dashboard.querySelector('.section-head:not(.feature-heading)');
  const statusGrid=dashboard.querySelector('.stat-grid');
  const featureGrid=dashboard.querySelector('.feature-grid');
  dashboard.querySelector('.quick-panel')?.remove();
  statusHeading?.remove();
  const featureCopy={
    '.feature-ai':['AI ASSISTANT','AI Assistant','Get astronomy answers and plan observing sessions.'],
    '.feature-camera':['LIVE CAMERA','Camera studio','Connect your ZWO camera and capture image frames.'],
    '.feature-deep':['DEEP-SKY EXPLORER','Galaxy explorer','Browse real targets, coordinates, and observing details.'],
    '.feature-sky':['LOCAL PLANETARIUM','Sky map','Explore stars and objects above your local horizon.'],
    '.feature-mount':['HARDWARE CONTROL','Telescope control','Connect a simulator or an ASCOM telescope mount.'],
    '.feature-guide':['PHD2 INTEGRATION','Autoguiding','Monitor PHD2 and manage your ST-4 guiding connection.']
  };
  if(featureGrid){
    for(const card of [...featureGrid.querySelectorAll('.feature-card')]){
      const featureName=[...card.classList].find(name=>Object.prototype.hasOwnProperty.call(featureCopy,`.${name}`));
      const content=featureName?featureCopy[`.${featureName}`]:null;
      if(!content){card.remove();continue}
      const label=card.querySelector('.feature-label'),title=card.querySelector('b'),description=card.querySelector('small');
      if(label)label.textContent=content[0];
      if(title)title.textContent=content[1];
      if(description)description.textContent=content[2];
      const arrow=card.querySelector('.feature-arrow');
      if(arrow)arrow.textContent='Explore →';
    }
    for(const selector of Object.keys(featureCopy)){
      const card=featureGrid.querySelector(selector);
      if(card)featureGrid.append(card);
    }
  }
  const bottom=document.createElement('div');bottom.className='dashboard-lower-grid';
  if(statusGrid){
    const workspace=document.createElement('section');workspace.className='dashboard-lower-card dashboard-workspace panel';
    workspace.innerHTML='<div class="dashboard-lower-heading"><div><h3>Your AI Workspace</h3><small>A complete suite of tools for your observing sessions.</small></div></div><div class="workspace-capabilities"><span><i>✓</i>Astronomy chat with Orbit AI</span><span><i>✓</i>Local star map and catalogue</span><span><i>✓</i>ASCOM telescope and simulator</span><span><i>✓</i>ZWO camera and PHD2 guiding</span></div><button type="button" class="workspace-start" id="dashboardGetStarted">Get started <span>→</span></button>';
    statusGrid.hidden=true;
    statusGrid.style.display='none';
    dashboard.append(statusGrid);
    bottom.append(workspace);
  }
  const activity=document.createElement('section');activity.className='dashboard-lower-card dashboard-activity panel';
  activity.innerHTML='<div class="dashboard-lower-heading"><div><h3>Latest Activity</h3></div><button type="button" class="text-btn" id="dashboardViewChats">View all <span>→</span></button></div><div id="dashboardActivityList" class="dashboard-activity-list"></div>';
  bottom.append(activity);
  const modelPanel=document.createElement('section');modelPanel.className='dashboard-lower-card dashboard-model-panel panel';
  modelPanel.innerHTML='<div class="dashboard-lower-heading"><div><h3>Orbit AI Model</h3></div><span class="model-tag">GROQ</span></div><div class="dashboard-model-focus"><span class="dashboard-model-emblem">✦</span><span class="dashboard-model-copy"><small>ACTIVE MODEL</small><b id="dashboardCurrentModel">Checking connection…</b><small id="dashboardAiConnection">Checking Groq connection…</small></span></div><div class="dashboard-model-storage"><span>API key</span><b>Stored in Windows Credential Manager</b></div><button type="button" class="workspace-start" id="dashboardManageAi">Manage AI connection <span>→</span></button>';
  bottom.append(modelPanel);
  if(featureGrid)featureGrid.after(bottom);
  dashboard.querySelector('.two-col')?.remove();
  $('appShell').classList.add('dashboard-active');
  $('dashboardGetStarted').onclick=()=>setPage('assistant');
  $('dashboardManageAi').onclick=()=>$('manageGroqKey').click();
  $('dashboardAttach').onclick=()=>$('attachFile').click();
  $('dashboardVoice').onclick=()=>$('voiceInput').click();
  $('dashboardCamera').onclick=()=>setPage('camera');
  $('dashboardViewChats').onclick=()=>$('viewAllChats').click();
}
redesignDashboard();

function renderPopular(){ const list=$('popularTargets');if(!list)return;list.innerHTML=galaxies.slice(0,4).map(g=>`<div class="target-row"><div class="target-thumb"></div><div class="target-meta"><b>${esc(g.name)}</b><small>${g.id} · ${esc(g.constellation)} · ${esc(g.type)}</small></div><div class="target-magnitude">mag ${g.mag}</div></div>`).join(''); }
function renderGalaxies(){const q=$('galaxySearch').value.toLowerCase(),type=$('galaxyType').value,diff=$('galaxyDifficulty').value;const list=galaxies.filter(g=>(g.name.toLowerCase().includes(q)||g.id.toLowerCase().includes(q)||g.constellation.toLowerCase().includes(q))&&(type==='all'||g.type===type)&&(diff==='all'||g.difficulty===diff));$('galaxyGrid').innerHTML=list.map(g=>`<article class="galaxy-card"><div class="galaxy-art art-${g.art}"><span class="galaxy-code">${g.id}</span></div><div class="galaxy-info"><h3>${esc(g.name)}</h3><p>${esc(g.type)} · ${esc(g.constellation)}</p><div class="tag-row"><span class="tag">${esc(g.difficulty)}</span><span class="tag">${g.distance}</span></div><div class="galaxy-actions"><button data-details="${g.id}">Explore object ↗</button><span>mag ${g.mag}</span></div></div></article>`).join('')||'<div class="panel">No galaxies match those filters.</div>';document.querySelectorAll('[data-details]').forEach(b=>b.addEventListener('click',()=>showGalaxy(b.dataset.details)));}
$('galaxySearch').addEventListener('input',renderGalaxies);$('galaxyType').addEventListener('change',renderGalaxies);$('galaxyDifficulty').addEventListener('change',renderGalaxies);
function modal(html){$('modalContent').innerHTML=html;$('modalBackdrop').classList.add('open');}
function closeModal(){$('modalBackdrop').classList.remove('open')}
$('modalClose').addEventListener('click',closeModal);$('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal()});
function showGalaxy(id){const g=galaxies.find(x=>x.id===id);if(!g)return;modal(`<div class="eyebrow cyan">${g.id} · GALAXY PROFILE</div><h2>${esc(g.name)}</h2><p>${esc(g.desc)}</p><div class="detail-line"><span>Classification</span><b>${esc(g.type)}</b></div><div class="detail-line"><span>Distance</span><b>${g.distance}</b></div><div class="detail-line"><span>Magnitude</span><b>${g.mag}</b></div><div class="detail-line"><span>Constellation</span><b>${esc(g.constellation)}</b></div><div class="detail-line"><span>RA / DEC (J2000)</span><b>${g.ra} · ${g.dec}</b></div><p style="margin-top:14px"><b>Interesting fact</b><br>${esc(g.fact)}</p><p class="micro-note">Reference coordinates are J2000. This preview does not apply precession, current ephemeris or local horizon checks.</p><div class="button-row"><button class="secondary-btn" id="saveGalaxy">☆ Save to journal</button><button class="primary-btn" id="setSlewTarget">Use coordinates ↗</button></div>`);$('saveGalaxy').onclick=()=>{addJournalEntry(g.name,`Saved ${g.id} to my astronomy targets.`);closeModal();toast(`${g.name} saved to your journal.`)};$('setSlewTarget').onclick=()=>{closeModal();$('slewRA').value=g.raH;$('slewDEC').value=g.decD;setPage('telescope');toast(`${g.id} reference coordinates filled in. Confirm coordinate system and safety before any real slew.`)};}

function updateClock(){const now=new Date();$('clock').textContent=now.toLocaleTimeString(undefined,{hour12:false});$('localDate').textContent=now.toLocaleDateString(undefined,{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).toUpperCase()+' · LOCAL';}
function updateMountUI(m){
  if(!m)return;
  state.mountMode=m.connected?(m.mode||'ascom'):(state.mountMode||m.mode||'ascom');state.mountConnected=!!m.connected;state.mountAxes=m.axes||{};
  const simulator=m.connected?(state.mountMode==='alpaca'||state.mountMode==='visual'||/simulat|virtual/i.test(String(m.driver||''))):state.mountMode==='alpaca'||state.mountMode==='visual';state.mountSimulator=simulator;
  const modeName=state.mountMode==='visual'?'BUILT-IN VISUAL SIMULATOR':simulator?(state.mountMode==='alpaca'?'ALPACA SIMULATOR':'ASCOM SIMULATOR'):'ASCOM';
  $('mountStat').textContent=m.connected?'Connected':'Disconnected';
  $('mountStatText').textContent=m.connected?(simulator?(state.mountMode==='visual'?'Built-in visual simulator · software only':'Local Alpaca simulator · software only'):'ASCOM telescope driver connected'):'No telescope connected';
  $('mountStatDot').classList.toggle('active',!!m.connected);$('mountSub').textContent=m.driver||(state.mountMode==='visual'?'Built-in visual simulator':simulator?'Local Alpaca simulator':'ASCOM telescope');
  $('connectionMode').textContent=modeName;$('mountConnectionEyebrow').textContent=simulator?'LOCAL SOFTWARE SIMULATOR':'TELESCOPE CONNECTION';
  $('telescopeDriverName').textContent=simulator?(m.driver||(state.mountMode==='visual'?'Built-in visual simulator':'Alpaca telescope simulator')):'iOptron SmartEQ Pro+';
  $('telescopeDeviceCode').textContent=simulator?(state.mountMode==='visual'?'IN-APP · SOFTWARE ONLY':'LOCALHOST · SOFTWARE ONLY'):'PRODUCT 3200 · GO2NOVA 8408';
  $('telescopeConnectionTitle').textContent=m.connected?(simulator?'Simulator connected':'Telescope connected'):'Telescope not connected';
  $('telescopeConnectionText').textContent=m.connected?(simulator?`Connected to software-only telescope · ${m.driver||'simulator'}. No physical hardware is controlled.`:`Connected to actual mount via ASCOM · ${m.driver||'Telescope driver'}`):(state.mountMode==='visual'?'Run the visual test for an animated in-app mount. It sends no hardware commands.':simulator?'Start a local Alpaca telescope simulator on port 11111. This connection is software-only.':'Connect Windows, ASCOM Platform and the actual telescope driver.');
  $('motionSafetyTitle').textContent=simulator?'Software-only movement test':'Physical movement';
  $('motionSafetyText').textContent=simulator?'This software simulator cannot move a physical telescope. Hold a direction and release to stop; the visual orientation and coordinates update while it moves.':"Clear the full slew path, balance the mount and secure cables. These controls send real ASCOM MoveAxis commands. Release to stop; a 1.5-second server watchdog stops motion if the app loses contact. The app inhibits idle sleep while manual motion is active, but do not force Windows to sleep; stop the mount first.";
  $('mountConnectionType').value=state.mountMode;$('mountConnectionType').disabled=!!m.connected;$('alpacaOptions').hidden=state.mountMode!=='alpaca';
  $('connectAscom').textContent=state.mountMode==='visual'?'Connect visual simulator':state.mountMode==='alpaca'?'Connect local simulator':'Connect ASCOM telescope';$('connectAscom').disabled=!!m.connected;
  $('disconnectMount').disabled=!m.connected;
  $('switchToRealMount').hidden=!m.connected||!simulator;
  $('mountRA').textContent=Number.isFinite(m.rightAscension)?`${Number(m.rightAscension).toFixed(4)} h`:'—';
  $('mountDEC').textContent=Number.isFinite(m.declination)?`${Number(m.declination).toFixed(3)}°`:'—';
  $('mountALT').textContent=Number.isFinite(m.altitude)?`${Number(m.altitude).toFixed(1)}°`:'—';
  $('mountAZ').textContent=Number.isFinite(m.azimuth)?`${Number(m.azimuth).toFixed(1)}°`:'—';
  $('trackingFlag').textContent=m.tracking===true?'Tracking on':m.tracking===false?'Tracking off':'Tracking unknown';
  $('slewingFlag').textContent=m.slewing===true?'Slewing':'Not slewing';
  const topbar=$('topbarMode');if(topbar){topbar.innerHTML='<i></i><span></span>';topbar.querySelector('span').textContent=m.connected?(simulator?`SOFTWARE SIMULATOR · ${state.mountMode==='visual'?'VISUAL TEST':'ALPACA'}`:'REAL MOUNT · ASCOM'):(simulator?'SIMULATOR DISCONNECTED':'NO MOUNT CONNECTED');topbar.classList.toggle('connected',!!m.connected);topbar.classList.toggle('simulator',simulator)}
  $('footerMountMode').textContent=simulator?'Software simulator only · no physical movement':'Real ASCOM mount only · Confirm every physical movement';
  const viewer=$('mount3dViewer'),visualStatus=$('mountVisualStatus');
  if(viewer){
    viewer.dataset.connected=m.connected?'true':'false';
    viewer.dataset.simulator=simulator&&!!m.connected?'true':'false';
    const altitude=Number(m.altitude),azimuth=Number(m.azimuth);
    $('mount3dMode').textContent=!m.connected?'WAITING FOR MOUNT':simulator?(state.mountMode==='visual'?'BUILT-IN SIMULATION':'ALPACA SIMULATION'):'LIVE ASCOM TELEMETRY';
    $('mount3dAltLabel').textContent=Number.isFinite(altitude)?`ALT ${altitude.toFixed(1)}°`:'ALT --.-°';
    $('mount3dAzLabel').textContent=Number.isFinite(azimuth)?`AZ ${azimuth.toFixed(1)}°`:'AZ --.-°';
    if(Number.isFinite(azimuth))$('mount3dAzimuthAxis').style.transform=`rotateY(${azimuth}deg)`;
    if(Number.isFinite(altitude))$('mount3dAltitudeAxis').setAttribute('transform',`rotate(${-Math.max(-90,Math.min(90,altitude))} 281 136)`);
    if(visualStatus)visualStatus.textContent=!m.connected?'Waiting for mount telemetry':simulator?(Number.isFinite(altitude)&&Number.isFinite(azimuth)?`${state.mountMode==='visual'?'VISUAL TEST':'SIMULATED'} · ALT ${altitude.toFixed(1)}° · AZ ${azimuth.toFixed(1)}°`:'SIMULATOR · awaiting coordinates'):(Number.isFinite(altitude)&&Number.isFinite(azimuth)?`LIVE ASCOM TELEMETRY · ALT ${altitude.toFixed(1)}° · AZ ${azimuth.toFixed(1)}°`:'Connected · coordinate telemetry unavailable');
  }
  const speed=Number($('axisRate').value);
  for(const button of document.querySelectorAll('.axis-move')){const axis=button.dataset.axis,capability=state.mountAxes[axis],supported=(capability?.rates||[]).some(range=>speed>=range.minimum&&speed<=range.maximum);button.disabled=!m.connected||!capability?.canMove||!supported}
  const anyAxis=Object.values(state.mountAxes).some(axis=>axis.canMove);
  $('axisSupport').textContent=!m.connected?'Connect the selected telescope to check its advertised axis capabilities and rates.':state.mountMode==='visual'?'Built-in visual simulator; movement controls animate the on-screen telescope only.':simulator?'Software-only localhost simulator; movement commands cannot reach physical telescope hardware.':anyAxis?'Manual control is enabled only for rates advertised by the connected ASCOM driver.':'This driver does not advertise MoveAxis support for its primary or secondary axes.';
  $('stopAxes').disabled=!m.connected||!anyAxis;
}
async function refreshMount(){try{const m=await api('/api/mount/status');updateMountUI(m);if(state.skySelection)$('skySlewTarget').disabled=!m.connected||state.skySelection.type==='Sun'||!isSkyTimeCurrent()}catch(e){state.mountConnected=false;state.mountAxes={};updateMountUI({mode:state.mountMode||'ascom',connected:false,driver:'Status unavailable',axes:{}});if(state.skySelection)$('skySlewTarget').disabled=true}}
async function connectMount(){
  const mode=$('mountConnectionType').value;
  const connection={mode,host:$('alpacaHost').value.trim(),port:Number($('alpacaPort').value),device_number:0};
  try{const m=await api('/api/mount/connect',{method:'POST',body:JSON.stringify(connection)});updateMountUI(m);await refreshMount();toast(state.mountSimulator?'Connected software simulator. Movements are software-only.':'Real ASCOM mount connected. Verify status and clearances before movement.')}
  catch(e){toast(e.message,'error')}
}
$('mountConnectionType').addEventListener('change',()=>{state.mountMode=$('mountConnectionType').value;updateMountUI({mode:state.mountMode,connected:false,axes:{}})});
$('connectAscom').onclick=()=>{if($('mountConnectionType').value==='ascom'&&!confirm('Open the Windows ASCOM chooser. Select the iOptron driver for your physical mount; no movement will be commanded automatically.'))return;connectMount()};
$('runVisualTest').onclick=async()=>{
  $('runVisualTest').disabled=true;
  try{
    const result=await api('/api/mount/visual-test',{method:'POST'});
    state.mountMode='visual';
    $('mountConnectionType').value='visual';
    updateMountUI(await api('/api/mount/status'));
    toast(result.message,'success');
  }catch(error){toast(error.message,'error')}
  finally{$('runVisualTest').disabled=false}
};
$('disconnectMount').onclick=async()=>{try{const m=await api('/api/mount/disconnect',{method:'POST'});updateMountUI(m);toast('Telescope disconnected.')}catch(e){toast(e.message,'error')}};
async function switchToRealMount(){if(!state.mountConnected||!state.mountSimulator)return;if(!confirm('Disconnect the software simulator and open the Windows ASCOM chooser for your real mount? No movement will be commanded automatically.'))return;try{await api('/api/mount/disconnect',{method:'POST'});state.mountMode='ascom';$('mountConnectionType').value='ascom';updateMountUI({connected:false,mode:'ascom',axes:{}});await connectMount()}catch(e){toast(e.message,'error')}}
$('switchToRealMount').addEventListener('click',switchToRealMount);
async function slewToCoordinates(ra,dec,targetName='entered coordinates'){if(!Number.isFinite(ra)||!Number.isFinite(dec)){toast('Enter valid RA and DEC coordinates.','error');return}if(!state.mountConnected){toast('Connect a telescope before slewing.','error');return}const simulator=state.mountSimulator,prompt=simulator?`Move the software simulator to ${targetName}?\n\nRA ${ra.toFixed(5)} h · DEC ${dec.toFixed(4)}°\n\nThis is software-only and cannot move physical telescope hardware.`:`Move the real telescope to ${targetName}?\n\nRA ${ra.toFixed(5)} h · DEC ${dec.toFixed(4)}°\n\nVerify the target, mount limits, balance, cable clearance and local conditions before proceeding.`;if(!confirm(prompt))return;try{const result=await api('/api/mount/slew',{method:'POST',body:JSON.stringify({ra,dec,confirmed:true})});toast(result.message||`${state.mountMode.toUpperCase()} slew command accepted.`);await refreshMount()}catch(e){toast(e.message,'error')}}
$('slewBtn').onclick=()=>slewToCoordinates(Number($('slewRA').value),Number($('slewDEC').value));
$('trackOn').onclick=()=>setTracking(true);$('trackOff').onclick=()=>setTracking(false);async function setTracking(enabled){if(!state.mountConnected){toast('Connect a telescope first.','error');return}try{await api('/api/mount/tracking',{method:'POST',body:JSON.stringify({enabled})});toast(enabled?'Telescope tracking enabled.':'Telescope tracking disabled.');await refreshMount()}catch(e){toast(e.message,'error')}}
$('stopMount').onclick=async()=>{if(!confirm(state.mountSimulator?'Stop all software simulator movement?':'Send AbortSlew and stop physical mount axis motion?'))return;try{const result=await api('/api/mount/stop',{method:'POST'});stopAllAxisMotion();toast(result.message||'Mount stop command sent.')}catch(e){toast(e.message,'error')}};
$('zeroMount').onclick=async()=>{if(!state.mountConnected){toast('Connect a telescope first.','error');return}if(!confirm(state.mountSimulator?'Return the software simulator to its mechanical Zero/Home Position?':'Command the real mount to its mechanical Zero/Home Position? Check the full movement path and keep the hand controller ready.'))return;try{const result=await api('/api/mount/zero',{method:'POST'});toast(result.message||'FindHome request sent.')}catch(e){toast(e.message,'error')}};

function axisCommand(axis,rate){const command=(state.axisQueue||Promise.resolve()).then(()=>api('/api/mount/move-axis',{method:'POST',body:JSON.stringify({axis,rate})}));state.axisQueue=command.catch(()=>{});return command}
function stopAxis(axis){const motion=state.activeMotions.get(axis);if(motion){clearInterval(motion.heartbeat);state.activeMotions.delete(axis)}return axisCommand(axis,0).catch(e=>toast(`Axis ${axis+1} stop: ${e.message}`,'error'))}
function stopAllAxisMotion(){for(const axis of [...state.activeMotions.keys()])stopAxis(Number(axis))}
for(const button of document.querySelectorAll('.axis-move')){button.addEventListener('pointerdown',event=>{event.preventDefault();const axis=Number(button.dataset.axis),rate=Number(button.dataset.direction)*Number($('axisRate').value);if(!state.mountConnected||button.disabled)return;button.setPointerCapture?.(event.pointerId);axisCommand(axis,rate).catch(e=>{toast(e.message,'error');stopAxis(axis)});const heartbeat=setInterval(()=>axisCommand(axis,rate).catch(e=>{toast(e.message,'error');stopAxis(axis)}),500);state.activeMotions.set(axis,{heartbeat,rate})});for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>stopAxis(Number(button.dataset.axis)))}
document.addEventListener('pointerup',stopAllAxisMotion);window.addEventListener('blur',stopAllAxisMotion);document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAllAxisMotion()});
$('axisRate').addEventListener('change',()=>refreshMount());
$('stopAxes').onclick=async()=>{stopAllAxisMotion();try{const result=await api('/api/mount/stop',{method:'POST'});toast(result.message||'All supported mount motion stopped.')}catch(e){toast(e.message,'error')}};

function setCameraControls(controls){
  if(!controls)return;
  $('cameraExposure').value=controls.exposureMs;
  $('cameraExposure').min=controls.exposureMinMs;
  $('cameraExposure').max=controls.exposureMaxMs;
  $('cameraGain').value=controls.gain;
  $('cameraGain').min=controls.gainMin;
  $('cameraGain').max=controls.gainMax;
  $('cameraFrameSize').textContent=`${controls.width} × ${controls.height} · ${controls.bitDepth}-BIT`;
}
function updateCameraUI(c){
  const wasConnected=state.cameraCaptureConnected;
  state.cameraCount=c.cameraCount||0;
  state.cameraCaptureConnected=!!c.captureConnected;
  if(wasConnected&&!state.cameraCaptureConnected){
    stopCameraPreview();
    $('cameraFrame').hidden=true;
    $('cameraPreviewEmpty').hidden=false;
    $('cameraPreviewPlaceholder').hidden=false;
    if(state.cameraObjectUrl)URL.revokeObjectURL(state.cameraObjectUrl);
    state.cameraObjectUrl=null;
  }
  $('cameraStat').textContent=c.connected?`${c.cameraCount} detected`:'Not detected';
  $('cameraSub').textContent=c.captureConnected?'ZWO camera connected · live capture ready':c.sdkLoaded?'ZWO SDK ready':'ZWO camera SDK unavailable';
  $('cameraDeviceTitle').textContent=c.captureConnected?(c.cameraName||'ZWO camera connected'):c.connected?`${c.cameraCount} camera(s) detected`:'Camera not detected';
  $('cameraDeviceText').textContent=c.captureConnected?(c.capability||'Camera connected and ready.'):c.connected?'Camera detected. Connect it here to begin capture; close PHD2 if it currently owns the device.':(c.error||c.capability||'Connect a ZWO ASI camera and install its official USB driver.');
  $('cameraPreviewState').textContent=c.captureConnected?'CAMERA CONNECTED · READY':c.connected?'CAMERA DETECTED':'NO CAMERA FEED';
  $('connectCamera').disabled=!!c.captureConnected||!c.connected;
  $('disconnectCamera').disabled=!c.captureConnected;
  $('toggleCameraPreview').disabled=!c.captureConnected;
  $('captureFits').disabled=!c.captureConnected;
  $('applyCameraControls').disabled=!c.captureConnected;
  if(c.controls)setCameraControls(c.controls);
  if(c.captureConnected&&c.controls)$('cameraDeviceText').textContent=`${c.controls.width} × ${c.controls.height} pixels · ${c.controls.bitDepth}-bit capture.`;
}
async function refreshCamera(notify=false){
  try{const c=await api('/api/camera/status');updateCameraUI(c);if(notify)toast(c.connected?'ZWO camera detected. Connect to start capturing.':'No ZWO camera detected. Check the official driver and USB connection.',c.connected?'success':'error')}
  catch(error){if(notify)toast(`Camera status failed: ${error.message}`,'error')}
}
async function connectCamera(){
  $('connectCamera').disabled=true;
  try{const c=await api('/api/camera/connect',{method:'POST'});updateCameraUI(c);toast('Camera connected. Close PHD2 before using the same camera there.','success')}
  catch(error){toast(error.message,'error');await refreshCamera()}
}
async function disconnectCamera(){
  stopCameraPreview();
  try{await api('/api/camera/disconnect',{method:'POST'});await refreshCamera();toast('Camera released for PHD2 or other software.')}
  catch(error){toast(error.message,'error')}
}
function stopCameraPreview(){
  state.cameraPreviewActive=false;
  $('toggleCameraPreview').textContent='Start live preview';
  $('cameraPreviewState').textContent=state.cameraCaptureConnected?'CAMERA CONNECTED · READY':'NO CAMERA FEED';
}
async function updateCameraPreview(){
  if(!state.cameraPreviewActive||state.cameraFrameBusy)return;
  state.cameraFrameBusy=true;
  try{
    const response=await fetch(`/api/camera/frame?t=${Date.now()}`,{cache:'no-store'});
    if(!response.ok){const result=await response.json().catch(()=>({}));throw new Error(result.detail||`Preview failed (${response.status})`)}
    const url=URL.createObjectURL(await response.blob());
    if(state.cameraPreviewActive){
      const previous=state.cameraObjectUrl;
      state.cameraObjectUrl=url;
      $('cameraFrame').src=url;
      $('cameraFrame').hidden=false;
      $('cameraPreviewEmpty').hidden=true;
      $('cameraPreviewPlaceholder').hidden=true;
      $('cameraPreviewState').textContent='LIVE · SINGLE-FRAME';
      if(previous)URL.revokeObjectURL(previous);
    }else URL.revokeObjectURL(url);
  }catch(error){stopCameraPreview();toast(error.message,'error')}
  finally{state.cameraFrameBusy=false;if(state.cameraPreviewActive)setTimeout(updateCameraPreview,200)}
}
function toggleCameraPreview(){
  if(!state.cameraCaptureConnected)return;
  if(state.cameraPreviewActive){stopCameraPreview();return}
  state.cameraPreviewActive=true;
  $('toggleCameraPreview').textContent='Stop live preview';
  $('cameraPreviewState').textContent='EXPOSING…';
  updateCameraPreview();
}
$('connectCamera').onclick=connectCamera;
$('disconnectCamera').onclick=disconnectCamera;
$('refreshCamera').onclick=()=>refreshCamera(true);
$('toggleCameraPreview').onclick=toggleCameraPreview;
$('applyCameraControls').onclick=async()=>{
  try{const controls=await api('/api/camera/controls',{method:'PUT',body:JSON.stringify({exposure_ms:Number($('cameraExposure').value),gain:Number($('cameraGain').value)})});setCameraControls(controls);toast('Camera exposure and gain updated.')}
  catch(error){toast(error.message,'error')}
};
$('captureFits').onclick=async()=>{
  $('captureFits').disabled=true;
  try{const capture=await api('/api/camera/capture',{method:'POST'});toast(`FITS saved: ${capture.path}`,'success')}
  catch(error){toast(error.message,'error')}
  finally{$('captureFits').disabled=!state.cameraCaptureConnected}
};

async function refreshPHD(){try{const p=await api('/api/guiding/status');state.phd=p;$('phdBadge').textContent=p.available?'CONNECTED':'NOT CONNECTED';$('phdState').textContent=p.available?`PHD2 state: ${p.state}`:'PHD2 not detected';$('phdDetail').textContent=p.available?`Equipment connected: ${p.equipmentConnected?'yes':'no'}`:(p.error||'127.0.0.1 : 4400');$('guideStat').textContent=p.available?p.state:'Not connected';$('guideSub').textContent=p.available?'PHD2 server responding':'Waiting for PHD2 server';$('phdEquipment').textContent=p.available?JSON.stringify(p.equipment,null,2):p.error||'PHD2 server not available.';return p}catch(e){$('phdState').textContent='PHD2 not detected';$('phdDetail').textContent=e.message;$('phdEquipment').textContent=e.message;return null}}
$('refreshPHD').onclick=refreshPHD;$('startGuiding').onclick=async()=>{if(!confirm('Send Start Guiding to PHD2? Confirm the ASI120MM Mini is connected and PHD2 is configured to use On-camera ST-4 output with a guide scope.'))return;try{const r=await api('/api/guiding/start',{method:'POST'});toast(r.message);setTimeout(refreshPHD,1000)}catch(e){toast(e.message,'error')}};$('stopGuiding').onclick=async()=>{if(!confirm('Stop PHD2 guiding?'))return;try{const r=await api('/api/guiding/stop',{method:'POST'});toast(r.message);setTimeout(refreshPHD,1000)}catch(e){toast(e.message,'error')}};

function setAssistantStatus(stateName,label){
  const status=$('assistantConnection'),labelElement=$('assistantStatusLabel'),chatLabel=$('chatStatusLabel');
  if(status){status.dataset.state=stateName;labelElement.textContent=label}
  const dot=$('chatStatusDot');if(dot){dot.dataset.state=stateName==='ready'?'ready':stateName==='offline'?'offline':'setup'}
  if(chatLabel)chatLabel.textContent=stateName==='ready'?'Ready to explore':stateName==='offline'?'Local service unavailable':'AI setup needed';
}
async function refreshSystem(){try{const s=await api('/api/system');state.system=s;$('aiStat').textContent=s.aiConfigured?'Ready':'Needs API key';$('aiSub').textContent=s.aiConfigured?`Model ${s.aiModel}`:'Configure a key securely on this PC';$('settingsAi').textContent=s.aiConfigured?'CONFIGURED':'NOT CONFIGURED';$('settingsModel').textContent=s.aiModel||'llama-3.3-70b-versatile';$('chatModel').textContent=s.aiConfigured?s.aiModel:'API not configured';setAssistantStatus(s.aiConfigured?'ready':'setup',s.aiConfigured?`Connected · ${s.aiModel}`:'Connect Groq to start chatting');if(s.camera) {state.cameraCount=s.camera.cameraCount||0;$('cameraStat').textContent=s.camera.connected?`${s.camera.cameraCount} detected`:'Not detected';$('cameraSub').textContent=s.camera.sdkLoaded?'SDK wrapper loaded':'SDK detection pending'}}catch{$('aiStat').textContent='Local preview';$('aiSub').textContent='Start local server for live AI and hardware status';$('settingsAi').textContent='SERVER OFFLINE';$('chatModel').textContent='Offline preview';setAssistantStatus('offline','Local service unavailable')}}

function renderMarkdown(text){
  const blocks=[];
  let html=esc(text).replace(/```([\w#+.-]*)\n([\s\S]*?)```/g,(_,language,code)=>{const index=blocks.push(`<pre><code>${code}</code></pre>`) - 1;return `\u0000${index}\u0000`});
  html=html.replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/\n/g,'<br>');
  return html.replace(/\u0000(\d+)\u0000/g,(_,index)=>blocks[Number(index)]);
}
function appendMessage(role,text,withSuggestions=false){
  const el=document.createElement('div');el.className=`message ${role}`;
  const avatar=role==='assistant'?'<div class="message-avatar">✧</div>':'';
  el.innerHTML=`${avatar}<div class="bubble">${renderMarkdown(text)}</div>`;
  $('chatMessages').appendChild(el);
  if(role==='assistant'||role==='user'){
    const actions=document.createElement('div');actions.className='message-actions';
    actions.innerHTML=role==='assistant'?'<button type="button" data-message-action="copy">Copy</button><button type="button" data-message-action="regenerate">Regenerate</button>':'<button type="button" data-message-action="edit">Edit</button>';
    el.appendChild(actions);
    actions.querySelector('[data-message-action="copy"]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(text);toast('Message copied.')}catch{toast('Clipboard access is unavailable in this window.','error')}});
    actions.querySelector('[data-message-action="regenerate"]')?.addEventListener('click',()=>{const last=state.history.filter(item=>item.role==='user').at(-1);if(last)sendChat(last.content)});
    actions.querySelector('[data-message-action="edit"]')?.addEventListener('click',()=>{$('chatInput').value=text;$('chatInput').focus()});
  }
  if(withSuggestions){
    const suggestions=document.createElement('div');suggestions.className='message assistant';
    suggestions.innerHTML='<div class="message-avatar">✧</div><div class="bubble"><b>What would you like to do next?</b><div class="suggestion-grid"><button data-prompt="Tell me more about the object and its discovery history.">Learn more <span>↗</span></button><button data-prompt="Compare this object with three similar targets.">Compare targets <span>↗</span></button><button data-prompt="What equipment and conditions are best for observing it?">Best equipment <span>↗</span></button><button data-prompt="Give me a safe step-by-step observing plan.">Observing plan <span>↗</span></button></div></div>';
    $('chatMessages').appendChild(suggestions);suggestions.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>sendChat(b.dataset.prompt));
  }
  $('chatMessages').scrollTop=$('chatMessages').scrollHeight;
}
function saveConversation(){
  if(!state.history.length)return;
  const id=state.activeConversationId||(crypto.randomUUID?crypto.randomUUID():`chat-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  state.activeConversationId=id;
  const first=state.history.find(item=>item.role==='user')?.content||'New conversation';
  const conversation={id,title:first.replace(/\s+/g,' ').slice(0,58),updatedAt:Date.now(),messages:state.history.slice(-24)};
  state.conversations=[conversation,...state.conversations.filter(item=>item.id!==id)].slice(0,30);
  localStorage.setItem('orbitpilot-conversations',JSON.stringify(state.conversations));
  renderConversationHistory();
  renderDashboardActivity();
}
function renderConversationHistory(){
  const list=$('chatHistoryList');if(!list)return;
  const recent=[...state.conversations].sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,4);
  list.innerHTML=recent.length?recent.map(item=>`<button class="history-item${item.id===state.activeConversationId?' active':''}" data-conversation="${esc(item.id)}"><span>${esc(item.title)}</span><small>${new Date(item.updatedAt).toLocaleDateString()}</small></button>`).join(''):'<div class="history-empty">Your saved conversations will appear here.</div>';
  list.querySelectorAll('[data-conversation]').forEach(button=>button.onclick=()=>openConversation(button.dataset.conversation));
}
function renderDashboardActivity(){
  const list=$('dashboardActivityList');if(!list)return;
  const recent=[...state.conversations].sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,4);
  list.innerHTML=recent.length?recent.map(item=>`<button type="button" class="dashboard-activity-item" data-dashboard-conversation="${esc(item.id)}"><span class="activity-symbol">✦</span><span class="activity-copy"><b>${esc(item.title)}</b><small>${new Date(item.updatedAt).toLocaleString()}</small></span><span class="feature-arrow">↗</span></button>`).join(''):'<div class="dashboard-activity-empty"><span>✦</span><b>Your next discovery starts here.</b><small>Start a conversation with Orbit AI to see it in your recent activity.</small><button type="button" class="secondary-btn" data-dashboard-new-chat>Start a chat</button></div>';
  list.querySelectorAll('[data-dashboard-conversation]').forEach(button=>button.onclick=()=>openConversation(button.dataset.dashboardConversation));
  list.querySelector('[data-dashboard-new-chat]')?.addEventListener('click',newChat);
}
function openConversation(id){
  const item=state.conversations.find(conversation=>conversation.id===id);if(!item)return;
  if(state.chatAbort)state.chatAbort.abort();
  state.activeConversationId=item.id;state.history=item.messages.map(message=>({...message}));
  $('chatMessages').innerHTML='';for(const message of state.history)appendMessage(message.role,message.content);
  setPage('assistant');renderConversationHistory();
}
function newChat(){
  if(state.chatAbort)state.chatAbort.abort();
  state.history=[];state.activeConversationId=null;
  $('chatMessages').innerHTML=initialWelcomeMarkup;
  $('chatInput').value='';setPage('assistant');renderConversationHistory();$('chatInput').focus();
}
async function sendChat(override){
  if(state.chatAbort)return;
  const text=(override??$('chatInput').value).trim();if(!text)return;
  if(!override)$('chatInput').value='';
  state.history.push({role:'user',content:text});state.history=state.history.slice(-24);appendMessage('user',text);saveConversation();
  const controller=new AbortController();state.chatAbort=controller;
  $('sendChat').disabled=true;$('stopChat').hidden=false;
  const thinking=document.createElement('div');thinking.id='chatThinking';thinking.className='chat-thinking';thinking.textContent='Orbit AI is thinking…';$('chatMessages').appendChild(thinking);
  try{
    const result=await api('/api/ai/chat',{method:'POST',body:JSON.stringify({message:text,history:state.history.slice(0,-1)}),signal:controller.signal});
    if(controller.signal.aborted)return;
    state.history.push({role:'assistant',content:result.answer});state.history=state.history.slice(-24);appendMessage('assistant',result.answer,true);saveConversation();
  }catch(error){
    if(error.name==='AbortError'){toast('Stopped waiting for the response. The provider may still finish processing.');return}
    const offline=`${error.message}\n\nI can still help you explore the built-in galaxy catalogue and equipment guide. Connect a valid Groq API key in Settings to use live Orbit AI.`;
    appendMessage('assistant',offline,true);saveConversation();
  }finally{
    thinking.remove();if(state.chatAbort===controller)state.chatAbort=null;
    $('sendChat').disabled=false;$('stopChat').hidden=true;
  }
}
$('sendChat').onclick=()=>sendChat();
$('stopChat').onclick=()=>state.chatAbort?.abort();
$('newChat').onclick=newChat;$('chatNewButton').onclick=newChat;$('assistantNewAction').onclick=newChat;
$('chatInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}});
$('dashboardSend').onclick=()=>{const prompt=$('dashboardPrompt').value.trim();if(prompt){setPage('assistant');$('chatInput').value=prompt;$('dashboardPrompt').value='';sendChat()}else{setPage('assistant');$('chatInput').focus()}};
$('dashboardPrompt').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('dashboardSend').click()}});
document.querySelectorAll('[data-prompt]').forEach(b=>b.addEventListener('click',()=>sendChat(b.dataset.prompt)));

function addJournalEntry(title,note){const entry={date:new Date().toLocaleString(),title,note};state.journal.unshift(entry);state.journal=state.journal.slice(0,80);localStorage.setItem('orbitpilot-journal',JSON.stringify(state.journal));renderJournal()}
function renderJournal(){$('journalEntries').innerHTML=state.journal.length?state.journal.map(x=>`<div class="journal-entry"><div class="journal-date">${esc(x.date)}</div><div><b>${esc(x.title)}</b><p>${esc(x.note)}</p></div></div>`).join(''):'<div class="empty-state"><span>✧</span><b>Your observing journal is waiting.</b><p>Save a galaxy or add a note after your next session.</p></div>'}
$('addJournal').onclick=()=>{modal(`<div class="eyebrow cyan">OBSERVING JOURNAL</div><h2>New observation note</h2><label class="form-grid" style="display:block">Target or title<input id="journalTitle" placeholder="e.g. Andromeda Galaxy" style="display:block;width:100%;margin-top:7px;background:#091320;border:1px solid #263a50;border-radius:8px;padding:10px;color:#fff"></label><label style="display:block;font-size:10px;color:#cbd9e8;margin-top:10px">Your notes<textarea id="journalNote" rows="4" placeholder="What did you observe? What equipment did you use?" style="display:block;width:100%;margin-top:7px;background:#091320;border:1px solid #263a50;border-radius:8px;padding:10px;color:#fff"></textarea></label><button id="saveJournal" class="primary-btn full">Save journal entry</button>`);$('saveJournal').onclick=()=>{const title=$('journalTitle').value.trim(),note=$('journalNote').value.trim();if(!title){toast('Enter a title first.');return}addJournalEntry(title,note||'Observation note added.');closeModal();toast('Journal entry saved locally.')}};

function updateSkyCatalogStatus(status=window.OrbitSky?.catalogStatus?.()){
  if(!status)return;
  $('skyCatalogStatus').textContent=status.state==='ready'?`Offline star catalog loaded · ${status.count.toLocaleString()} catalog records · stars to magnitude 6.5`:
    status.state==='error'?`Offline star catalog could not be loaded: ${status.error}`:'Loading offline star catalog…';
}
window.addEventListener('orbit-sky-catalog-ready',event=>{updateSkyCatalogStatus(event.detail);if(state.page==='sky')drawSky()});
function drawSky(){const canvas=$('skyCanvas');if(!canvas||!window.OrbitSky)return;const latitude=Number($('skyLatitude').value),longitude=Number($('skyLongitude').value),time=new Date($('skyDateTime').value);if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180||Number.isNaN(time.getTime()))return;localStorage.setItem('orbitpilot-sky-location',JSON.stringify({latitude,longitude}));const positions=window.OrbitSky.render(canvas,galaxies,latitude,longitude,time,selectSkyObject);state.skyObjects=positions?.objects||[];updateSkyCatalogStatus();$('skyMapStatus').textContent=`${latitude.toFixed(2)}°, ${longitude.toFixed(2)}° · ${time.toLocaleString()} · ${state.skyObjects.length.toLocaleString()} objects above horizon`;updatePolarGuide(latitude,longitude,time);if(state.skySelection){const refreshed=state.skyObjects.find(object=>object.code===state.skySelection.code);if(refreshed)selectSkyObject({...refreshed,raH:refreshed.ra/15,decD:refreshed.dec,visible:true});else{state.skySelection=null;$('skySelectedName').textContent='Choose an object on the map';$('skySelectedDesc').textContent='Click a visible star, deep-sky object, Sun, Moon or planet.';$('skySelectedCode').textContent='—';$('skySelectedRA').textContent='—';$('skySelectedDEC').textContent='—';$('skySelectedAltAz').textContent='—';$('skySlewTarget').disabled=true}}}
function updatePolarGuide(latitude,longitude,time){const guide=window.OrbitSky.polarGuide(latitude,longitude,time);$('polarPoleAltitude').textContent=`${guide.altitude.toFixed(2)}°`;$('polarPoleDirection').textContent=guide.direction;if(guide.hemisphere==='north'&&guide.polaris){$('polarReference').textContent=guide.polaris.alt>0?`Polaris ${guide.polaris.alt.toFixed(1)}° alt · ${guide.polaris.az.toFixed(1)}° az`:'Polaris below horizon';}else if(guide.hemisphere==='south')$('polarReference').textContent='Use a southern polar-scope chart';else $('polarReference').textContent='No single pole is above the horizon';}
function selectSkyObject(object){state.skySelection=object;$('skySelectedName').textContent=object.name;$('skySelectedDesc').textContent=object.type==='Deep-sky'?`${object.target.type} · ${object.target.constellation} · mag ${object.target.mag}`:object.type==='Star'?'Bright star · J2000 catalog position precessed to date':`${object.type} · calculated for selected date`;$('skySelectedCode').textContent=object.code||object.type;$('skySelectedRA').textContent=window.OrbitSky.formatRa(object.ra);$('skySelectedDEC').textContent=`${object.dec>=0?'+':''}${object.dec.toFixed(3)}°`;$('skySelectedAltAz').textContent=`${object.alt.toFixed(1)}° / ${object.az.toFixed(1)}°`;$('skySlewTarget').disabled=object.type==='Sun'||!state.mountConnected||!isSkyTimeCurrent();}
function isSkyTimeCurrent(){const selected=new Date($('skyDateTime').value).getTime();return Number.isFinite(selected)&&Math.abs(Date.now()-selected)<=5*60*1000;}
function setSkyTimeNow(){const now=new Date(),offset=now.getTimezoneOffset(),local=new Date(now.getTime()-offset*60000);$('skyDateTime').value=local.toISOString().slice(0,16);drawSky()}
const savedSkyLocation=JSON.parse(localStorage.getItem('orbitpilot-sky-location')||'null');if(savedSkyLocation){$('skyLatitude').value=savedSkyLocation.latitude;$('skyLongitude').value=savedSkyLocation.longitude}setSkyTimeNow();
for(const id of ['skyLatitude','skyLongitude','skyDateTime'])$(id).addEventListener('change',drawSky);
$('skyNow').onclick=setSkyTimeNow;
$('skyLocate').onclick=()=>{if(!navigator.geolocation){toast('Location is not available in this app window. Enter latitude and longitude manually.','error');return}navigator.geolocation.getCurrentPosition(position=>{$('skyLatitude').value=position.coords.latitude.toFixed(4);$('skyLongitude').value=position.coords.longitude.toFixed(4);drawSky();toast('Observer location updated for this device.')},error=>toast(`Location unavailable: ${error.message}`,'error'),{enableHighAccuracy:false,timeout:10000})};
$('skySlewTarget').onclick=()=>{const target=state.skySelection;if(!target)return;if(!isSkyTimeCurrent()){toast('Set the sky map to the current time with Now, then select the target again before slewing.','error');$('skySlewTarget').disabled=true;return}slewToCoordinates(target.raH,target.decD,target.name)};
$('askPolarAI').onclick=()=>{const latitude=Number($('skyLatitude').value),longitude=Number($('skyLongitude').value),time=new Date($('skyDateTime').value),guide=window.OrbitSky.polarGuide(latitude,longitude,time);const polaris=guide.polaris?` Polaris is approximately ${guide.polaris.alt.toFixed(1)}° altitude and ${guide.polaris.az.toFixed(1)}° azimuth for the selected time; use it only as a nearby reference star and follow your polar-scope reticle instructions.`:'';setPage('assistant');sendChat(`Guide me through a manual polar alignment for my mount. My latitude is ${latitude.toFixed(4)}° and longitude is ${longitude.toFixed(4)}°. The polar axis should be set to ${guide.altitude.toFixed(2)}° altitude toward ${guide.direction}.${polaris} Explain safe tripod leveling, setting the mount altitude, aiming at true north/south, locking the bolts, and the limitations: this mount has no motorized altitude/azimuth adjusters and no camera plate-solving feedback, so I must make the physical adjustments and the app cannot measure final alignment error.`)};
$('openTelescopeForPolar').onclick=()=>setPage('telescope');
$('askSkyTarget').onclick=async()=>{if(!state.skyObjects.length){$('skyTargetStatus').textContent='No objects are above the horizon for the selected location and time.';return}const candidates=state.skyObjects.filter(object=>object.type!=='Sun'&&object.type!=='Star').map(object=>({code:String(object.code||object.name),name:object.name,type:object.type,raH:object.ra/15,decD:object.dec,alt:object.alt,az:object.az}));if(!candidates.length){$('skyTargetStatus').textContent='No safe deep-sky or solar-system targets are currently above the horizon.';return}const request=$('skyTargetRequest').value.trim()||'Choose a bright beginner-friendly observing target';$('askSkyTarget').disabled=true;$('skyTargetStatus').textContent='Orbit AI is choosing only from the visible objects on this map…';try{const result=await api('/api/ai/choose-target',{method:'POST',body:JSON.stringify({request,candidates})});if(!result.candidate){$('skyTargetStatus').textContent=result.reason||'No suitable visible target was found.';return}const selected=state.skyObjects.find(object=>String(object.code||object.name)===result.candidate.code);if(!selected){$('skyTargetStatus').textContent='The selected object is no longer visible. Refresh the sky map and try again.';return}selectSkyObject({...selected,raH:selected.ra/15,decD:selected.dec,visible:true});$('skyTargetStatus').textContent=`Orbit AI selected ${selected.name}: ${result.reason} Review its coordinates, then confirm separately before any real slew.`}catch(error){$('skyTargetStatus').textContent=error.message;toast(error.message,'error')}finally{$('askSkyTarget').disabled=false}};
$('notificationButton').onclick=async()=>{await refreshSystem();await refreshMount();await refreshCamera();await refreshPHD();toast('Status refreshed.')};
window.addEventListener('resize',()=>{if(state.page==='sky')drawSky()});

function applyTheme(theme){
  const allowed=['premium-dark','midnight-blue','graphite','light'];
  const selected=allowed.includes(theme)?theme:'premium-dark';
  document.documentElement.dataset.theme=selected;
  localStorage.setItem('orbitpilot-theme',selected);
  document.querySelectorAll('[data-theme-choice]').forEach(button=>button.classList.toggle('active',button.dataset.themeChoice===selected));
}
applyTheme(loadStored('orbitpilot-theme','premium-dark'));
document.querySelectorAll('[data-theme-choice]').forEach(button=>button.addEventListener('click',()=>{applyTheme(button.dataset.themeChoice);toast(`Theme changed to ${button.querySelector('b').textContent}.`)}));
  $('themeToggle').onclick=()=>{const next=document.documentElement.dataset.theme==='light'?'premium-dark':'light';applyTheme(next);toast(`Theme changed to ${next==='light'?'Light mode':'Premium dark'}.`)};
function applyBackground(background){
  const allowed=['deep-field','aurora','coordinates'];
  const selected=allowed.includes(background)?background:'deep-field';
  document.body.dataset.background=selected;
  localStorage.setItem('orbitpilot-background',selected);
  document.querySelectorAll('[data-background-choice]').forEach(button=>button.classList.toggle('active',button.dataset.backgroundChoice===selected));
}
applyBackground(loadStored('orbitpilot-background','deep-field'));
document.querySelectorAll('[data-background-choice]').forEach(button=>button.addEventListener('click',()=>{applyBackground(button.dataset.backgroundChoice);toast(`Background changed to ${button.querySelector('b').textContent}.`)}));
const savedSidebarState=loadStored('orbitpilot-sidebar-collapsed',false);
if(savedSidebarState)$('appShell').classList.add('sidebar-collapsed');
$('sidebarToggle').setAttribute('aria-expanded',String(!savedSidebarState));
$('sidebarToggle').onclick=()=>{const collapsed=$('appShell').classList.toggle('sidebar-collapsed');$('sidebarToggle').setAttribute('aria-expanded',String(!collapsed));localStorage.setItem('orbitpilot-sidebar-collapsed',JSON.stringify(collapsed))};
$('mobileSidebarToggle').onclick=()=>$('appShell').classList.toggle('mobile-nav-open');
document.querySelector('.brand').addEventListener('click',event=>{event.preventDefault();setPage('dashboard')});
document.querySelector('[data-action="chat-history"]').onclick=()=>{setPage('assistant');$('chatHistoryList').scrollIntoView({behavior:'smooth',block:'center'})};
$('profileButton').onclick=$('topProfileButton').onclick=()=>setPage('settings');
$('helpButton').onclick=()=>modal('<div class="eyebrow cyan">ORBITPILOTAI SUPPORT</div><h2>Help & support</h2><p>OrbitPilotAI connects to local astronomy hardware through ASCOM and PHD2. Use the Settings page to review setup requirements and configure your Groq API key.</p><div class="notice info"><b>Safe telescope operation</b><span>Verify mount clearance, coordinate system and tracking state. Every slew requires a separate confirmation in the telescope controls.</span></div><p>For AI key issues, visit <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">Groq API keys ↗</a>.</p>');

const commandPages=[
  {label:'Home',page:'dashboard',type:'Page'},{label:'Orbit AI',page:'assistant',type:'Page'},{label:'Sky map',page:'sky',type:'Page'},
  {label:'Galaxy explorer',page:'galaxies',type:'Page'},{label:'Telescope control',page:'telescope',type:'Page'},
  {label:'Camera studio',page:'camera',type:'Page'},{label:'PHD2 guiding',page:'guiding',type:'Page'},
  {label:'Observing journal',page:'journal',type:'Page'},{label:'Settings',page:'settings',type:'Page'}
];
let commandSelection=0,commandItems=[];
function renderCommandResults(){
  const query=$('commandInput').value.trim().toLowerCase();
  commandItems=[...commandPages.filter(item=>item.label.toLowerCase().includes(query)).map(item=>({...item,kind:'page'})),
    ...galaxies.filter(item=>`${item.name} ${item.id} ${item.constellation}`.toLowerCase().includes(query)).map(item=>({label:`${item.id} · ${item.name}`,type:`Galaxy · ${item.constellation}`,kind:'galaxy',id:item.id}))].slice(0,12);
  commandSelection=Math.min(commandSelection,Math.max(commandItems.length-1,0));
  $('commandResults').innerHTML=commandItems.length?commandItems.map((item,index)=>`<button class="command-result${index===commandSelection?' active':''}" data-command-index="${index}"><span>${esc(item.label)}</span><small>${esc(item.type)}</small></button>`).join(''):'<div class="history-empty">No pages or catalogue targets found.</div>';
  $('commandResults').querySelectorAll('[data-command-index]').forEach(button=>button.onclick=()=>openCommandItem(Number(button.dataset.commandIndex)));
}
function openCommandItem(index){
  const item=commandItems[index];if(!item)return;
  $('commandBackdrop').hidden=true;
  if(item.kind==='page')setPage(item.page);else{setPage('galaxies');showGalaxy(item.id)}
}
function openCommandPalette(){$('commandBackdrop').hidden=false;$('commandInput').value='';commandSelection=0;renderCommandResults();$('commandInput').focus()}
$('searchButton').onclick=openCommandPalette;
$('commandInput').addEventListener('input',()=>{commandSelection=0;renderCommandResults()});
$('commandInput').addEventListener('keydown',event=>{
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const step=event.key==='ArrowDown'?1:-1;commandSelection=(commandSelection+step+commandItems.length)%commandItems.length;renderCommandResults()}
  if(event.key==='Enter'){event.preventDefault();openCommandItem(commandSelection)}
  if(event.key==='Escape')$('commandBackdrop').hidden=true;
});
$('commandBackdrop').addEventListener('click',event=>{if(event.target===$('commandBackdrop'))$('commandBackdrop').hidden=true});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){$('commandBackdrop').hidden=true;closeModal();$('appShell').classList.remove('mobile-nav-open')}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openCommandPalette()}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='n'){event.preventDefault();newChat()}
});

$('viewAllChats').onclick=()=>{
  const conversations=[...state.conversations].sort((a,b)=>b.updatedAt-a.updatedAt);
  modal(`<div class="eyebrow cyan">YOUR WORKSPACE</div><h2>Conversation history</h2><div class="all-history-list">${conversations.length?conversations.map(item=>`<button class="history-item" data-open-conversation="${esc(item.id)}"><b>${esc(item.title)}</b><small>${new Date(item.updatedAt).toLocaleString()}</small></button>`).join(''):'<div class="history-empty">No saved conversations yet.</div>'}</div>`);
  document.querySelectorAll('[data-open-conversation]').forEach(button=>button.onclick=()=>{const id=button.dataset.openConversation;closeModal();openConversation(id)});
};
$('attachFile').onclick=()=>$('chatFileInput').click();
$('chatFileInput').addEventListener('change',async()=>{
  const file=$('chatFileInput').files?.[0];$('chatFileInput').value='';if(!file)return;
  if(file.size>100*1024){toast('Choose a text note smaller than 100 KB.','error');return}
  try{const content=await file.text();$('chatInput').value=`${$('chatInput').value.trim()}\n\n[Attached text: ${file.name}]\n${content}`.trim();$('chatInput').focus();toast(`${file.name} added as text context.`)}
  catch(error){toast(`Could not read the selected file: ${error.message}`,'error')}
});
$('voiceInput').onclick=()=>{
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition){toast('Speech recognition is not available in this WebView. Type your prompt instead.','error');return}
  const recognition=new Recognition();recognition.lang=navigator.language||'en-US';recognition.interimResults=false;recognition.maxAlternatives=1;
  recognition.onresult=event=>{const transcript=event.results[0]?.[0]?.transcript;if(transcript){$('chatInput').value=`${$('chatInput').value.trim()} ${transcript}`.trim();$('chatInput').focus();toast('Voice transcription added to the prompt.')}};
  recognition.onerror=event=>toast(`Voice input failed: ${event.error}.`,'error');
  recognition.start();toast('Listening for a prompt…');
};

const refreshSystemWithDashboard=refreshSystem;
refreshSystem=async function(){
  await refreshSystemWithDashboard();
  $('dashboardModel').textContent=state.system?.aiConfigured?`Groq · ${state.system.aiModel}`:state.system?'Groq · configure API key in Settings':'Local service unavailable';
  const model=$('dashboardModel').closest('.dashboard-model');
  if(model)model.dataset.state=state.system?.aiConfigured?'ready':state.system?'offline':'setup';
  $('dashboardCurrentModel').textContent=state.system?.aiModel||'Model not connected';
  $('dashboardAiConnection').textContent=state.system?.aiConfigured?'Connected · key stored securely':state.system?'Connect a key in Settings to use Orbit AI':'Local service unavailable';
  const health=$('appHealthStatus');
  if(health){const online=$('settingsAi').textContent!=='SERVER OFFLINE';health.dataset.state=online?'online':'offline';health.querySelector('span').textContent=online?'Local app online':'Local service offline'}
};

renderPopular();renderGalaxies();renderJournal();renderDashboardActivity();updateClock();setInterval(updateClock,1000);setInterval(()=>{if(state.page==='dashboard'||state.page==='telescope')refreshMount();if(state.page==='guiding'||state.page==='dashboard')refreshPHD()},8000);setInterval(()=>{if(state.mountConnected&&state.mountSimulator&&(state.page==='dashboard'||state.page==='telescope'))refreshMount()},1200);refreshSystem();refreshMount();refreshCamera();refreshPHD();


function showGroqKeyDialog(force=false){
  if(!force && state.system && state.system.aiConfigured)return;
  modal(`<div class="eyebrow cyan">GROQ AI CONFIGURATION</div><h2>Connect your AI</h2><p>Enter your Groq API key to activate OrbitPilot AI. The key is checked with Groq and then stored in this Windows user's Credential Manager, not in the app files.</p><label style="display:block;font-size:11px;color:#cbd9e8;margin-top:14px">Groq API key<input id="groqApiKey" type="password" autocomplete="off" placeholder="gsk_…" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;background:#091320;border:1px solid #344a61;border-radius:8px;padding:12px;color:#fff"></label><div id="groqKeyStatus" class="notice info" style="margin-top:12px">Enter a key to connect or replace the key saved on this PC.</div><button id="saveGroqKey" class="primary-btn full">Validate and save key</button><p style="margin-bottom:0">Need a key? <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">Create one at Groq ↗</a></p>`);
  $('saveGroqKey').onclick=async()=>{
    const key=$('groqApiKey').value.trim();
    if(!key){$('groqKeyStatus').textContent='Paste your Groq API key first.';return}
    const btn=$('saveGroqKey');btn.disabled=true;btn.textContent='Checking key…';$('groqKeyStatus').textContent='Checking with Groq and saving securely…';
    try{const r=await api('/api/ai/key',{method:'POST',body:JSON.stringify({api_key:key})});$('groqKeyStatus').textContent=r.message;state.system={...(state.system||{}),aiConfigured:true,aiModel:r.model};closeModal();await refreshSystem();toast('Groq AI connected.')}
    catch(e){$('groqKeyStatus').textContent=e.message;btn.disabled=false;btn.textContent='Try again'}
  };
}
$('manageGroqKey').addEventListener('click',()=>showGroqKeyDialog(true));
const originalRefreshSystem=refreshSystem;
refreshSystem=async function(){await originalRefreshSystem();if(state.system && !state.system.aiConfigured && !sessionStorage.getItem('orbitpilot-key-prompted')){sessionStorage.setItem('orbitpilot-key-prompted','1');showGroqKeyDialog(true)}};
const refreshAIStatusOnFocus=()=>{if(document.visibilityState==='visible')refreshSystem()};
window.addEventListener('focus',refreshAIStatusOnFocus);
document.addEventListener('visibilitychange',refreshAIStatusOnFocus);
refreshSystem();
