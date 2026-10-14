'use strict';
const topics = {
  web: { label: 'WEB APPLICATION SECURITY', title: 'Understand what a request can do.', copy: "I want to understand how authentication, access control, and input handling shape an application's security—and how mistakes in those boundaries create weaknesses.", tags: 'HTTP · Authentication · Access control · Input handling', color: '#67e8f9' },
  systems: { label: 'SYSTEMS & NETWORKS', title: 'Look beneath the application.', copy: 'My direction includes understanding operating systems, processes, permissions, and network traffic. I want a stronger mental model of the environment an application depends on.', tags: 'Operating systems · Permissions · Protocols · Network traffic', color: '#a5b4fc' },
  scripting: { label: 'SECURITY SCRIPTING', title: 'Make the repeatable work repeatable.', copy: 'I want to use programming to automate focused tasks, parse results, and build small tools I can explain. A useful script should have a clear purpose and honest limitations.', tags: 'Automation · Parsing · Debugging · Reproducible results', color: '#6ee7b7' },
  method: { label: 'OFFENSIVE METHODOLOGY', title: 'Observe. Form a hypothesis. Test it.', copy: 'I am working toward a structured approach to security: understand the system, ask a specific question, test it in an authorized environment, and explain the impact and possible remediation.', tags: 'Observation · Controlled testing · Evidence · Remediation', color: '#f7c783' }
};
let accent = topics.web.color;
document.querySelectorAll('[data-focus]').forEach(button => button.addEventListener('click', () => {
  const topic = topics[button.dataset.focus];
  document.querySelectorAll('[data-focus]').forEach(other => {
    const selected = other === button;
    other.classList.toggle('active', selected);
    other.setAttribute('aria-pressed', String(selected));
  });
  accent = topic.color;
  document.documentElement.style.setProperty('--accent', accent);
  document.querySelector('#core-label').textContent = topic.label;
  document.querySelector('#detail-kicker').textContent = 'FOCUS / ' + topic.label;
  document.querySelector('#detail-title').textContent = topic.title;
  document.querySelector('#detail-copy').textContent = topic.copy;
  document.querySelector('#detail-tags').textContent = topic.tags;
  draw();
}));

const canvas = document.querySelector('#core');
const ctx = canvas.getContext('2d');
const motion = document.querySelector('#motion');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let yaw = .64, pitch = -.38, auto = !reducedMotion.matches, dragging = false, dragX = 0, dragY = 0;
let width = 0, height = 0, lastTime = 0, frame = null;
function syncMotion() {
  motion.textContent = auto ? 'Pause motion' : 'Resume motion';
  motion.setAttribute('aria-pressed', String(!auto));
}
function project(point) {
  const x = point[0] * Math.cos(yaw) + point[2] * Math.sin(yaw);
  const z = -point[0] * Math.sin(yaw) + point[2] * Math.cos(yaw);
  const y = point[1] * Math.cos(pitch) - z * Math.sin(pitch);
  const depth = point[1] * Math.sin(pitch) + z * Math.cos(pitch);
  const scale = Math.min(width, height) * .27 * 5 / (5 + depth);
  return [width / 2 + x * scale, height / 2 + y * scale - 9, depth];
}
function path(points, stroke, fill, thickness = 1) {
  if (!ctx) return;
  ctx.beginPath();
  points.forEach((point, i) => { const p = project(point); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
  if (fill) { ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = stroke; ctx.lineWidth = thickness; ctx.stroke();
}
function draw() {
  if (!ctx || !width || !height) return;
  ctx.clearRect(0, 0, width, height);
  // A faint floor gives the rotating object a stable sense of depth.
  for (let n = -4; n <= 4; n++) {
    path([[n * .52, 1.65, -2.1], [n * .52, 1.65, 2.1]], '#29465455');
    path([[-2.1, 1.65, n * .52], [2.1, 1.65, n * .52]], '#29465455');
  }
  [1.1, 1.36].forEach((y, i) => path([[-1.35,y,-1.35],[1.35,y,-1.35],[1.35,y,1.35],[-1.35,y,1.35],[-1.35,y,-1.35]], accent + (i ? '40' : '80'), '#0b1a2660'));
  const vertices = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
  const faces = [[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[0,1,5,4],[3,2,6,7]];
  faces.sort((a,b) => b.reduce((sum,i)=>sum+project(vertices[i])[2],0)-a.reduce((sum,i)=>sum+project(vertices[i])[2],0));
  faces.forEach(face => { const points = face.map(i => vertices[i]); points.push(points[0]); path(points, accent + 'a0', accent + '10', 1.2); });
  const inner = .47;
  [[-inner,-inner,-inner],[inner,-inner,-inner],[inner,inner,-inner],[-inner,inner,-inner]].forEach((p,i,a)=>path([p,a[(i+1)%4]],accent+'65'));
  path([[-.32,-.99,0],[-.08,-.99,.24],[.4,-.99,-.24]],accent,null,3);
  for (let orbit = 0; orbit < 2; orbit++) {
    const ring = [];
    for (let i=0;i<=80;i++) { const t=i/80*Math.PI*2; ring.push([Math.cos(t)*1.77,Math.sin(t)*.68*(orbit ? -1:1),Math.sin(t)*1.77]); }
    path(ring,accent+'40');
    const dot=project(ring[orbit ? 51 : 12]);ctx.beginPath();ctx.arc(dot[0],dot[1],3,0,Math.PI*2);ctx.fillStyle=accent;ctx.fill();
  }
  vertices.forEach(v=>{const p=project(v);ctx.beginPath();ctx.arc(p[0],p[1],2,0,Math.PI*2);ctx.fillStyle=accent;ctx.fill();});
}
function resize() {
  const bounds = canvas.getBoundingClientRect(); width = bounds.width; height = bounds.height;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}
function tick(time) {
  frame = null;
  if (!auto || document.hidden) { lastTime = 0; return; }
  if (lastTime && !dragging) yaw += Math.min(time-lastTime,50)*.00015;
  lastTime = time; draw(); frame = requestAnimationFrame(tick);
}
function schedule() { if (auto && !document.hidden && frame === null) frame = requestAnimationFrame(tick); }
function setMotion(value) { auto = value; lastTime=0; syncMotion(); if (!auto && frame !== null) { cancelAnimationFrame(frame); frame=null; } schedule(); }
motion.addEventListener('click',()=>setMotion(!auto));
document.querySelector('#reset').addEventListener('click',()=>{yaw=.64;pitch=-.38;draw();});
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;dragX=e.clientX;dragY=e.clientY;canvas.classList.add('dragging');canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});});
canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-dragX)*.008;pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.clientY-dragY)*.008));dragX=e.clientX;dragY=e.clientY;draw();});
function endDrag(){dragging=false;canvas.classList.remove('dragging');}
canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
canvas.addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))return;
  e.preventDefault(); if(e.key===' '){setMotion(!auto);return;}
  if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;
  if(e.key==='ArrowUp')pitch=Math.max(-1.1,pitch-.12);if(e.key==='ArrowDown')pitch=Math.min(1.1,pitch+.12);draw();
});
reducedMotion.addEventListener('change',e=>setMotion(!e.matches));
document.addEventListener('visibilitychange',()=>{lastTime=0;schedule();});
new ResizeObserver(resize).observe(canvas);syncMotion();schedule();

const output = document.querySelector('#terminal-output');
const commandInput = document.querySelector('#command');
const answers = {
  help: 'Commands: about, focus, stack, contact, github, clear, help',
  about: 'Prathyudh Prem · BCA graduate\nCybersecurity learner working toward offensive security.\nI learned programming to support that goal.',
  focus: 'My learning direction:\n01 Web application security\n02 Systems & networks\n03 Security scripting\n04 Offensive methodology\nSelect a topic above to explore it.',
  stack: 'Programming foundation:\nJavaScript · Node.js · Express · Angular\nMongoDB · HTML & CSS · Git',
  contact: 'Email: prathyudhpremap@gmail.com\nLinkedIn: https://linkedin.com/in/prathyudh',
  github: 'Explore my code: https://github.com/PR4THYUDH?tab=repositories'
};
function appendLine(text, className) { const p=document.createElement('p');p.textContent=text;if(className)p.className=className;output.append(p); }
function runCommand(value) {
  const raw=value.trim().slice(0,80); if(!raw)return;
  const command=raw.toLowerCase();
  if(command==='clear'){output.replaceChildren();commandInput.value='';return;}
  appendLine('visitor ~ $ '+raw,'accent');
  appendLine(Object.hasOwn(answers,command)?answers[command]:'Unknown command. Type help to see the available commands.');
  while(output.children.length>60)output.firstElementChild.remove();
  output.scrollTop=output.scrollHeight;commandInput.value='';
}
document.querySelector('#terminal-form').addEventListener('submit',e=>{e.preventDefault();runCommand(commandInput.value);});
document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>runCommand(button.dataset.command)));
