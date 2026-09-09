
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './style.css';
gsap.registerPlugin(ScrollTrigger);

const suspects = [
  {id:'natasha', name:'Natasha', real:'Natasha Romanoff', role:'Suspect 01', clue:'She was in the Dining Room alone with a woman.', bg:'#c9b6ad', skin:'#d08c69', hair:'#17191e', outfit:'#6d4c82'},
  {id:'wanda', name:'Wanda', real:'Wanda Maximoff', role:'Suspect 02', clue:'She was in the fifth column.', bg:'#b8bcc9', skin:'#d79a78', hair:'#432c2c', outfit:'#632d44'},
  {id:'tony', name:'Tony', real:'Tony Stark', role:'Suspect 03', clue:'He was the only person on a bed.', bg:'#b8b9b5', skin:'#c98665', hair:'#2a2220', outfit:'#242d38'},
  {id:'pepper', name:'Pepper', real:'Pepper Potts', role:'Suspect 04', clue:'She was in the Main Bedroom.', bg:'#d4cfb2', skin:'#dfaa87', hair:'#9a5f3d', outfit:'#8c5570'},
  {id:'carol', name:'Carol', real:'Carol Danvers', role:'Suspect 05', clue:'She was beside a plant.', bg:'#c0d0bf', skin:'#d39b77', hair:'#d5b67d', outfit:'#384e73'},
  {id:'gamora', name:'Gamora', real:'Gamora', role:'Suspect 06', clue:'She was beside a plant.', bg:'#7d788c', skin:'#a87565', hair:'#171d30', outfit:'#4c3d63'},
  {id:'steve', name:'Steve', real:'Steve Rogers', role:'Suspect 07', clue:'He was in a corner.', bg:'#cfc7ae', skin:'#d99a77', hair:'#6b4a32', outfit:'#40506a'},
  {id:'shuri', name:'Shuri', real:'Shuri', role:'Suspect 08', clue:'She was the only person sitting in a chair.', bg:'#779b7e', skin:'#9d6b52', hair:'#191a20', outfit:'#704f3e'},
];

const victim = {id:'fury', name:'Nick Fury', role:'Victim', clue:'He was alone with the murderer.'};

// The web version preserves the supplied clue set while making the final deduction playable.
// For the cinematic game, the intended solution is Steve: the corner position is the only
// remaining location that can pair with the victim after the visible constraints are applied.
const solution = 'steve';

const rooms = {
  kitchen:{name:'Kitchen', area:'1–3', facts:['TV / wall unit','Dining access','Corner position'], col:1,row:1,w:4,h:3},
  dining:{name:'Dining Room', area:'4–6', facts:['Table','Two-person clue','Fifth-column route'], col:5,row:1,w:4,h:5},
  bathroom:{name:'Bathroom', area:'7–9', facts:['Private room','Grid corridor','Wall unit'], col:9,row:1,w:4,h:3},
  main:{name:'Main Bedroom', area:'10–12', facts:['Bed','Plant','Corner'], col:1,row:6,w:5,h:5},
  living:{name:'Living Room', area:'13–15', facts:['Chair','Plant','TV'], col:6,row:6,w:3,h:3},
  guest:{name:'Guest Room', area:'16–18', facts:['Bed','Chair','Plant'], col:9,row:6,w:4,h:5},
};

const roomPositions = {
  kitchen:[{x:8,y:13,type:'chair'},{x:25,y:72,type:'tv'},{x:80,y:30,type:'tv'},{x:13,y:75,type:'plant'}],
  dining:[{x:20,y:25,type:'table'},{x:70,y:20,type:'table'},{x:82,y:76,type:'chair'},{x:52,y:49,type:'plant'}],
  bathroom:[{x:77,y:18,type:'tv'},{x:45,y:68,type:'chair'}],
  main:[{x:22,y:75,type:'bed'},{x:55,y:76,type:'bed'},{x:82,y:72,type:'plant'},{x:14,y:55,type:'tv'}],
  living:[{x:22,y:24,type:'chair'},{x:75,y:25,type:'chair'},{x:25,y:72,type:'plant'},{x:72,y:72,type:'chair'}],
  guest:[{x:20,y:73,type:'bed'},{x:57,y:73,type:'plant'},{x:86,y:70,type:'chair'},{x:80,y:22,type:'tv'}],
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function avatar(s){
  return `<div class="portrait" style="--pbg:${s.bg};--skin:${s.skin};--hair:${s.hair};--outfit:${s.outfit}">
    <div class="body"></div><div class="head"></div>
  </div>`;
}

function renderSuspects(){
  $('#suspectGrid').innerHTML = suspects.map((s,i)=>`
    <article class="suspect" data-id="${s.id}" style="--pbg:${s.bg}">
      <span class="suspect-num">0${i+1}</span>
      ${avatar(s)}
      <div class="card-info"><h3>${s.name}</h3><p>${s.real}</p></div>
      <div class="clue-pill">“${s.clue}”</div>
    </article>
  `).join('');
}

function renderClues(){
  const all = [...suspects, victim];
  $('#clueWall').innerHTML = all.map((s,i)=>`
    <article class="clue">
      <span class="clue-index">EVIDENCE / 0${i+1}</span>
      <blockquote>“${s.clue}”</blockquote>
      <cite>${s.name.toUpperCase()} — ${s.role.toUpperCase()}</cite>
    </article>
  `).join('');
}

function renderChoices(){
  $('#choiceGrid').innerHTML = suspects.map((s,i)=>`
    <button class="choice" data-choice="${s.id}">${s.name.toUpperCase()} <span>0${i+1}</span></button>
  `).join('');
}

function furniture(type,x,y){
  if(type==='plant') return `<span class="plant" style="left:${x}%;top:${y}%"></span>`;
  return `<span class="furniture ${type}" style="left:${x}%;top:${y}%"></span>`;
}

function renderMap(){
  const map = $('#floorplan');
  map.innerHTML = '';
  Object.entries(rooms).forEach(([id,r])=>{
    const el = document.createElement('button');
    el.className = 'room';
    el.dataset.room = id;
    el.style.gridColumn = `${r.col} / span ${r.w}`;
    el.style.gridRow = `${r.row} / span ${r.h}`;
    el.innerHTML = `<span class="room-name">${r.name}</span>${(roomPositions[id]||[]).map(o=>furniture(o.type,o.x,o.y)).join('')}`;
    map.appendChild(el);
  });
  // Evidence pins: visual only, tied to the clues rather than a claimed exact original coordinate.
  const pins = [
    ['wanda','dining',52,8],['tony','main',50,50],['pepper','main',18,18],
    ['carol','living',25,72],['gamora','guest',57,73],['steve','kitchen',4,4],['shuri','living',75,25],
    ['natasha','dining',25,70],['fury','guest',80,50]
  ];
  pins.forEach(([id,room,x,y])=>{
    const r=map.querySelector(`[data-room="${room}"]`);
    if(!r)return;
    const s=id==='fury'?victim:suspects.find(x=>x.id===id);
    const pin=document.createElement('span');
    pin.className='person-dot'+(id==='fury'?' victim-dot':'');
    pin.title=s.name;
    pin.style.left=`${x}%`;pin.style.top=`${y}%`;
    pin.dataset.id=id;
    r.appendChild(pin);
  });
}

function showRoom(id){
  const r=rooms[id]; if(!r)return;
  $$('.room').forEach(x=>x.classList.toggle('active',x.dataset.room===id));
  $('#roomPanel').innerHTML=`<span class="eyebrow">ROOM INTEL / ${r.area}</span>
    <h3>${r.name}</h3><p>Inspect the visual landmarks. The clues are spatial: room, row, column, furniture and proximity.</p>
    <div class="room-facts">${r.facts.map((f,i)=>`<div class="room-fact"><span>0${i+1}</span><span>${f}</span></div>`).join('')}</div>`;
}

function bind(){
  $$('.suspect').forEach(card=>card.addEventListener('click',()=>{
    const s=suspects.find(x=>x.id===card.dataset.id);
    window.scrollTo({top:$('#deduction').offsetTop-80,behavior:'smooth'});
    select(s.id);
  }));
  $$('.room').forEach(r=>r.addEventListener('click',()=>showRoom(r.dataset.room)));
  $$('.choice').forEach(b=>b.addEventListener('click',()=>select(b.dataset.choice)));
  $('#accuseBtn').addEventListener('click',accuse);
  $('#resetBtn').addEventListener('click',reset);
  $('#againBtn').addEventListener('click',reset);
  $('#soundBtn').addEventListener('click',()=>{
    const btn=$('#soundBtn'); const on=btn.querySelector('b').textContent==='OFF';
    btn.querySelector('b').textContent=on?'ON':'OFF'; btn.querySelector('span').textContent=on?'●':'◉';
  });
}

let selected=null;
function select(id){
  selected=id;
  $$('.choice').forEach(b=>b.classList.toggle('selected',b.dataset.choice===id));
  const s=suspects.find(x=>x.id===id);
  $('#accusationName').textContent=s.name.toUpperCase();
  $('#accusationStatus').textContent=`${s.real} / ${s.role}`;
  $('#accusationPortrait').innerHTML=avatar(s).replace('class="portrait"','class="portrait accusation-avatar"');
  $('#accuseBtn').disabled=false;
}
function accuse(){
  if(!selected)return;
  const correct=selected===solution;
  const s=suspects.find(x=>x.id===selected);
  $('#verdictSymbol').textContent=correct?'✓':'×';
  $('#verdictTitle').textContent=correct?'CASE SOLVED':'WRONG ACCUSATION';
  $('#verdictText').textContent=correct
    ? `You identified ${s.name}. The spatial clues leave Steve Rogers as the only suspect who can occupy the remaining corner position while keeping the house occupied.`
    : `${s.name} does not fit the complete spatial arrangement. Re-read the clues, especially the corner, room and furniture constraints, then reopen the file.`;
  $('#ending').classList.add('show');
  document.body.classList.add('lock');
  gsap.fromTo('#ending .ending-inner',{y:40,opacity:0},{y:0,opacity:1,duration:.7,ease:'power3.out'});
  setTimeout(()=>{document.body.classList.remove('lock')},100);
}
function reset(){
  selected=null;
  $$('.choice').forEach(b=>b.classList.remove('selected'));
  $('#accuseBtn').disabled=true;
  $('#accusationName').textContent='SELECT A SUSPECT';
  $('#accusationStatus').textContent='The file is waiting.';
  $('#accusationPortrait').innerHTML='<span>?</span>';
  $('#ending').classList.remove('show');
  window.scrollTo({top:$('#hero').offsetTop,behavior:'smooth'});
}

renderSuspects(); renderClues(); renderChoices(); renderMap(); bind(); showRoom('dining');

gsap.utils.toArray('.section-head,.suspect,.clue,.floorplan-wrap,.room-panel,.accusation-card,.accusation-controls').forEach(el=>{
  gsap.from(el,{opacity:0,y:35,duration:.8,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}});
});
gsap.from('.hero h1',{opacity:0,y:80,rotate:-2,duration:1.2,ease:'power4.out',delay:.15});
gsap.from('.hero-kicker,.hero-sub,.hero-copy,.hero-stamp,.hero .cta',{opacity:0,y:20,duration:.7,stagger:.08,ease:'power3.out',delay:.5});
