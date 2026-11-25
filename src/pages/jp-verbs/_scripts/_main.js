import { scrollToEl, flash } from './_scroll.js';
(()=>{const bar=document.querySelector('.bar'),sec=document.querySelector('.ctx-sec'),les=document.querySelector('.ctx-les'),

secs=[...document.querySelectorAll('.sec')],lessons=[...document.querySelectorAll('section.lesson')];
const name={general:'一般動詞',suru:'します'};

let last='';
const heroT=document.querySelector('.hero h1');
document.querySelector('.ctx').addEventListener('click',e=>{const t=e.target.closest('.t.in');if(!t||!t.dataset.href)return;const el=document.getElementById(t.dataset.href);if(!el)return;
 // Going to the top of a section: the lesson part leaves right away, before the page moves
 if(el.classList.contains('sec')){const m=ctxMode;ctxMode='jump';setT(les,'','');ctxMode=m}
 scrollToEl(el)});
let prevLi=-1;
// While a jump scrolls the page the breadcrumb holds still; when the page stops it changes once.
// ctxMode: 'normal' = slide; 'jump' = slide once, an emptied part moves down and out.
// Showing or hiding the whole breadcrumb never waits, so it always looks the same.
let jumping=false,jumpT=0,ctxMode='normal';
const settle=()=>{clearTimeout(jumpT);jumpT=setTimeout(()=>{jumping=false;ctxMode='jump';last='';update();ctxMode='normal'},150)};
const markJump=()=>{jumping=true;settle()};
markJump(); // the first position after load (restore or #hash) changes once, like a jump
// The current-lesson marks (index, lesson list, overview) move to the target as soon as a jump starts
let onEls=null,onId;
const setOn=id=>{if(id===onId)return;onId=id;if(!onEls||!onEls.length)onEls=[...document.querySelectorAll('.jump a,.idx a,.lc')];onEls.forEach(a=>a.classList.toggle('on',!!id&&a.getAttribute('href')==='#'+id))};
addEventListener('jp:jump',e=>{markJump();const t=e.detail;if(!t||!t.closest)return;const l=t.closest('section.lesson');if(l)setOn(l.id);else if(t.classList.contains('sec'))setOn(null)});
addEventListener('scroll',()=>{if(jumping)settle()},{passive:true});
// In-page links: scroll with our own scroll (lands exactly), keep history and the row flash
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a||a.closest('.idx'))return;const id=decodeURIComponent(a.getAttribute('href').slice(1));const el=id&&document.getElementById(id);if(!el)return;
 e.preventDefault();history.pushState(null,'','#'+id);scrollToEl(el);flash(el)});
// Back/forward between those links: scroll to the lesson in the address bar
addEventListener('popstate',()=>{const id=decodeURIComponent(location.hash.slice(1));const el=id&&document.getElementById(id);if(el)scrollToEl(el)});
function setT(el,txt,dir,href){const cur=el.querySelector('.t.in');if(cur&&href)cur.dataset.href=href;if((cur?cur.dataset.txt:'')===txt)return;
 el.querySelectorAll('.t.gone').forEach(x=>x.remove());
 // After a jump, a part that becomes empty moves down and out
 if(ctxMode==='jump'&&!txt)dir='up';
 if(cur&&cur.isConnected){cur.style.left=cur.offsetLeft+'px';cur.style.top=cur.offsetTop+'px';cur.className='t gone out-'+dir;cur.addEventListener('animationend',()=>cur.remove(),{once:true});setTimeout(()=>cur.remove(),400)}
 if(txt){const t=document.createElement('span');t.className=dir?'t in '+dir:'t in';const sp=document.createElement('span');sp.className='sep';sp.textContent='›';t.append(sp,txt);t.dataset.txt=txt;t.dataset.href=href||'';t.setAttribute('role','link');el.appendChild(t)}
 el.classList.toggle('has',!!txt)}
function update(){bar.classList.toggle('vis',heroT.getBoundingClientRect().bottom<8);const y=bar.offsetHeight+24;let cs=null,cl=null;
 for(const s of secs) if(s.getBoundingClientRect().top<=y+40) cs=s;
 for(const l of lessons) if(l.getBoundingClientRect().top<=y) cl=l;
 if(cl&&cs&&!cs.contains(cl)) cl=null;
 if(jumping&&!!cs===bar.classList.contains('in'))return;
 const key=(cs?cs.id:'')+'|'+(cl?cl.id:'');if(key===last)return;last=key;

 bar.classList.toggle('in',!!cs);
 const li=cl?lessons.indexOf(cl):-1,dir=li>=prevLi?'dn':'up';prevLi=li;
 setT(sec,cs?name[cs.id]:'',dir,cs?cs.id:'');setT(les,cl?cl.querySelector('h3').textContent:'',dir,cl?cl.id:'');
 if(!jumping)setOn(cl?cl.id:null);
 try{idle()}catch(_){}
 rail.classList.toggle('show',!!cs);curSec=cs?cs.id:'general';if(!railHover)openGrp(curSec);}
addEventListener('scroll',update,{passive:true});
const peek=document.querySelector('.peek'),pt=peek.querySelector('.pk-t'),ps=peek.querySelector('.pk-s'),pb=peek.querySelector('.pk-b');
const info={};lessons.forEach(l=>{const o=[...l.querySelectorAll('tr.original td.dic')].map(t=>t.textContent.trim()),c=l.querySelectorAll('tr.comparison').length;
 info[l.id]={n:o.length,c:c,sec:l.closest('.sec').id,t:l.querySelector('h3').textContent,s:(l.closest('.sec').id==='suru'?'します':'一般動詞')+' · '+o.length+' 個動詞'+(c?' · '+c+' 個對照':''),b:o.join('、')}});
const rail=document.querySelector('.idx');let railHover=false,curSec='general',down=false;
let openId='',lockT=0;
let swapT=0,swapT2=0;
const applyGrp=id=>rail.querySelectorAll('.grp').forEach(g=>g.classList.toggle('open',g.dataset.sec===id));
let seqT=[],lastPY=-1,lastPX=-1;
const clearSeq=()=>{seqT.forEach(clearTimeout);seqT=[];rail.classList.remove('busy');rail.querySelectorAll('.ticks').forEach(t=>{t.classList.remove('vanish','reveal');t.style.cssText=''})};
const later=(ms,f)=>seqT.push(setTimeout(f,ms));
function openGrp(id,instant){if(id===openId)return;const first=!openId,prev=openId;openId=id;clearSeq();
 if(instant||first){rail.classList.add('nott');applyGrp(id);void rail.offsetHeight;rail.classList.remove('nott');try{idle()}catch(_){};return}
 lockT=performance.now();peek.classList.remove('show');rail.querySelectorAll('a.hov').forEach(x=>x.classList.remove('hov'));rail.classList.add('busy');needGlide=!railHover;gliding=false;
 const follow=()=>{if(!rail.classList.contains('busy'))return;if(railHover&&!down&&lastPY>=0){const el=document.elementFromPoint(lastPX,lastPY);if(el&&el.closest('.grp-l'))pick({clientY:lastPY,label:1});else pick({clientY:lastPY})}setTimeout(follow,16)};follow();
 const og=rail.querySelector(`.grp[data-sec="${prev}"]`),ng=rail.querySelector(`.grp[data-sec="${id}"]`),ot=og.querySelector('.ticks'),nt=ng.querySelector('.ticks');
 const oh=ot.offsetHeight;ng.classList.add('open');nt.style.maxHeight='none';const full=nt.offsetHeight;
 ot.style.maxHeight=oh+'px';nt.style.maxHeight='0px';nt.querySelectorAll('a').forEach((a,i)=>a.style.setProperty('--i',i));
 ot.classList.add('vanish');nt.classList.add('reveal');void rail.offsetHeight;
 const tr='max-height .32s cubic-bezier(.4,0,.2,1)';ot.style.transition=tr;nt.style.transition=tr;ot.style.maxHeight='0px';nt.style.maxHeight=full+'px';
 if(railHover&&lastPY>=0)soft(lastPY);
 later(340,()=>{og.classList.remove('open');ot.classList.remove('vanish');ot.style.cssText=''});
 later(860,()=>{nt.classList.remove('reveal');nt.style.cssText='';rail.classList.remove('busy');if(railHover&&lastPY>=0){const el=document.elementFromPoint(lastPX,lastPY);if(el&&el.closest('.grp-l'))pick({clientY:lastPY,label:1});else pick({clientY:lastPY})}else idle()})}
function sizeRail(){const mx=Math.max(...[...rail.querySelectorAll('.ticks')].map(t=>t.children.length));rail.style.setProperty('--tick-h',Math.min(mx*8,innerHeight-200)+'px');rail.style.minHeight='';if(matchMedia('(max-width:760px)').matches){const k=openId;openId='';openGrp(k||curSec,true);return}rail.classList.add('measure');let h=0;
 for(const g of rail.querySelectorAll('.grp')){rail.querySelectorAll('.grp').forEach(x=>x.classList.toggle('open',x===g));h=Math.max(h,rail.offsetHeight)}
 rail.classList.remove('measure');rail.style.minHeight=h+'px';const k=openId;openId='';openGrp(k||curSec,true)}
const vis=()=>[...rail.querySelectorAll('.grp.open .ticks:not(.vanish) a')];
const R=56;
const centers=()=>vis().map(x=>{const r=x.getBoundingClientRect();return [x,r.top+r.height/2]});
// amp: how strong the magnification is (0..1). It ramps up when the pointer comes in and down when it leaves.
let amp=0,ampR=0;
const magC=(cs,y)=>{for(const [x,c] of cs){const d=Math.abs(c-y),k=Math.max(0,1-d/R),e=k*k*(3-2*k)*amp;
  x.style.setProperty('--sx',(1+2.2*e).toFixed(3));x.style.setProperty('--o',(.55+.45*e).toFixed(2));x.style.setProperty('--sy',(1+e/1.5).toFixed(3))}};
const mag=y=>magC(centers(),y);
const ramp=(to,dur,done)=>{cancelAnimationFrame(ampR);const from=amp,t0=performance.now();
 const step=now=>{const p=Math.min(1,(now-t0)/dur),q=to>from?1-Math.pow(1-p,3):(p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2);
  amp=from+(to-from)*q;rail.style.setProperty('--amp',amp.toFixed(3));if(lastPY>=0)magC(centers(),lastPY);
  if(p<1)ampR=requestAnimationFrame(step);else if(done)done()};ampR=requestAnimationFrame(step)};
const unmag=()=>rail.querySelectorAll('a').forEach(x=>{x.style.removeProperty('--sx');x.style.removeProperty('--o');x.style.removeProperty('--sy')});
function idle(){if(railHover||down)return;unmag()}
const inSafe=y=>{for(const l of rail.querySelectorAll('.grp-l')){const r=l.getBoundingClientRect();if(y>=r.top-16&&y<=r.bottom+8)return true}return false};
let needGlide=false,gliding=false;
const glide=()=>{gliding=true;const v=vis();if(!v.length){gliding=false;return}const on=v.find(x=>x.classList.contains('on'))||v[0],orr=on.getBoundingClientRect();
 const from=orr.top+orr.height/2,t0=performance.now(),D=360;
 const step=()=>{if(!gliding)return;const p=Math.min(1,(performance.now()-t0)/D),k=1-Math.pow(1-p,3),y=from+(lastPY-from)*k;core(y,true);
  if(p<1)setTimeout(step,16);else{gliding=false;pick({clientY:lastPY})}};step()};
const soft=y=>{peek.classList.remove('show');rail.querySelectorAll('a.hov').forEach(x=>x.classList.remove('hov'));mag(y)};
let easeT=0,wasSafe=false;
const settling=()=>lockT&&performance.now()-lockT<340;
const pick=e=>{if(!down&&inSafe(e.clientY)){if(gliding)return null;soft(e.clientY);return null}
 if(!down&&settling()){needGlide=false;soft(e.clientY);return null}
 if(!down&&needGlide){needGlide=false;glide();return null}
 if(!down&&gliding)return null;
 if(down)gliding=false;
 return core(e.clientY,down)};
const core=(Y,force,noPeek)=>{const cs=centers();let a=null,best=1e9;for(const [x,c] of cs){const d=Math.abs(c-Y);if(d<best){best=d;a=x}}magC(cs,Y);
 if(!a||best>14&&!force){hide();return null}
 rail.querySelectorAll('a').forEach(x=>x.classList.toggle('hov',x===a));const d=info[a.getAttribute('href').slice(1)];
 if(noPeek){peek.classList.remove('show');return a}
 pt.textContent=d.t;ps.textContent=d.s;pb.textContent=d.b;
 const nr=rail.getBoundingClientRect();peek.style.left=(nr.left-12-peek.offsetWidth)+'px';
 const h=peek.offsetHeight;peek.style.top=Math.max(64,Math.min(innerHeight-h-12,Y-28))+'px';peek.classList.add('show');return a};
const hide=()=>{unmag();if(!railHover)idle();peek.classList.remove('show');rail.querySelectorAll('a.hov').forEach(x=>x.classList.remove('hov'))};
let target=null;
// A click on the index scrolls smoothly; dragging along it follows the finger at once
const jump=(a,smooth=false)=>{const t=document.querySelector(a.getAttribute('href'));scrollToEl(t,{smooth})};
const go=e=>{const a=pick(e);if(a&&a!==target){target=a;jump(a)}};
rail.querySelectorAll('.grp-l').forEach(l=>l.addEventListener('pointerenter',e=>{if(!down&&e.clientY)soft(e.clientY);if(!down)openGrp(l.parentNode.dataset.sec)}));
let trackT=0;
rail.addEventListener('pointerenter',()=>{railHover=true;clearTimeout(trackT);rail.classList.add('tracking');ramp(1,280)});
rail.addEventListener('pointerdown',e=>{if(e.target.classList.contains('grp-l')){hide();openSheet(e.target.parentNode.dataset.sec);return}
 down=true;rail.classList.add('dragging');target=null;try{rail.setPointerCapture(e.pointerId)}catch(_){};const a=pick(e);if(a){target=a;jump(a,true)};e.preventDefault()});
let pmR=0,onLabel=false;
const tick=()=>{pmR=0;const q={clientX:lastPX,clientY:lastPY};if(down){go(q);return}if(!railHover)return;if(onLabel){gliding=false;soft(q.clientY);return}pick(q)};
rail.addEventListener('pointermove',e=>{lastPY=e.clientY;lastPX=e.clientX;onLabel=!!e.target.closest('.grp-l');if(!pmR)pmR=requestAnimationFrame(tick)});
const leaveNow=()=>{railHover=false;clearTimeout(trackT);peek.classList.remove('show');
 ramp(0,420,()=>{if(railHover)return;rail.classList.remove('tracking');hide()});setTimeout(()=>{if(!railHover&&!down)openGrp(curSec)},450)};
const up=e=>{if(!down)return;down=false;rail.classList.remove('dragging');
 try{rail.releasePointerCapture(e.pointerId)}catch(_){}
 if(target){try{history.replaceState(null,'',target.getAttribute('href'))}catch(_){}}
 const r=rail.getBoundingClientRect(),inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
 if(e.pointerType!=='mouse'||!inside)leaveNow()};
rail.addEventListener('pointerup',up);rail.addEventListener('pointercancel',up);rail.addEventListener('lostpointercapture',e=>{if(down)up(e)});
rail.addEventListener('pointerleave',()=>{if(!down)leaveNow()});
sizeRail();addEventListener('jp:resize',sizeRail);
rail.addEventListener('click',e=>e.preventDefault());
document.querySelectorAll('.theme').forEach(b=>b.addEventListener('click',()=>{const r=document.documentElement,cur=r.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'),nx=cur==='dark'?'light':'dark';
 r.dataset.theme=nx;try{localStorage.setItem('theme',nx)}catch(e){};last='';update()}));
const kids=r=>{const a=[];let n=r.nextElementSibling;while(n&&n.classList.contains('comparison')){a.push(n);n=n.nextElementSibling}return a};
const animT=new WeakMap();
const setOpen=(r,open,anim)=>{const b=r.querySelector('.disc');if(!b)return;b.setAttribute('aria-expanded',open);r.classList.toggle('closed',!open);const ks=kids(r);
 const cws=ks.map(k=>[...k.querySelectorAll('.cw')]);
 ks.forEach((k,i)=>{clearTimeout(animT.get(k));if(k.classList.contains('anim')){k.classList.remove('anim','shut');cws[i].forEach(c=>c.style.maxHeight='')}});
 if(!anim){ks.forEach(k=>k.classList.toggle('fold',!open));return}
 if(!open){
  const hs=cws.map(cs=>cs.map(c=>c.scrollHeight));                       // read (1 layout)
  ks.forEach((k,i)=>{cws[i].forEach((c,j)=>c.style.maxHeight=hs[i][j]+'px');k.classList.add('anim')});
  void r.offsetHeight;                                                    // commit start (1 layout)
  ks.forEach(k=>k.classList.add('shut'));
  const t=setTimeout(()=>{ks.forEach((k,i)=>{k.classList.add('fold');k.classList.remove('anim','shut');cws[i].forEach(c=>c.style.maxHeight='')})},340);ks.forEach(k=>animT.set(k,t));
 }else{
  ks.forEach(k=>{k.classList.remove('fold');k.classList.add('anim','nott')});
  const hs=cws.map(cs=>cs.map(c=>c.scrollHeight));                       // read (1 layout)
  ks.forEach(k=>k.classList.add('shut'));void r.offsetHeight;             // commit collapsed start (1 layout)
  ks.forEach((k,i)=>{k.classList.remove('nott','shut');cws[i].forEach((c,j)=>c.style.maxHeight=hs[i][j]+'px')});
  const t=setTimeout(()=>{ks.forEach((k,i)=>{k.classList.remove('anim');cws[i].forEach(c=>c.style.maxHeight='')})},340);ks.forEach(k=>animT.set(k,t));
 }};
const origRows=[...document.querySelectorAll('tr.original')].filter(r=>r.querySelector('.disc'));
const lessonRows=l=>origRows.filter(r=>l.contains(r));
const syncLes=()=>document.querySelectorAll('.lfold').forEach(b=>{const any=lessonRows(b.closest('.lesson')).some(r=>!r.classList.contains('closed'));b.setAttribute('aria-expanded',any)});
const syncAll=()=>{syncLes();const c=origRows.filter(r=>r.classList.contains('closed')).length,st=c===0?'true':c===origRows.length?'false':'mixed';
 document.querySelectorAll('.foldall').forEach(b=>{b.setAttribute('aria-checked',st);b.querySelector('.fl').textContent=st==='true'?'收起全部對照':'展開全部對照'})};
document.querySelectorAll('.disc,.disc-n').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const r=b.closest('tr');setOpen(r,r.classList.contains('closed'),true);syncAll()}));
document.querySelectorAll('.lfold').forEach(b=>{const l=b.closest('.lesson');if(!lessonRows(l).length){b.style.display='none';return}
 b.addEventListener('click',e=>{e.stopPropagation();const rs=lessonRows(l),open=rs.every(r=>r.classList.contains('closed'));rs.forEach(r=>setOpen(r,open,true));syncAll()})});
origRows.forEach(r=>{r.classList.add('foldable');r.addEventListener('click',e=>{if(e.target.closest('a,button'))return;const sel=getSelection();if(sel&&String(sel).trim())return;setOpen(r,r.classList.contains('closed'),true);syncAll()})});
document.querySelectorAll('.foldall').forEach(b=>b.addEventListener('click',()=>{const open=b.getAttribute('aria-checked')!=='true';
 const edge=(bar.classList.contains('vis')?bar.offsetHeight:0)+1;let ref=null;
 for(const r of document.querySelectorAll('tbody tr:not(.fold)')){if(r.getBoundingClientRect().bottom>edge){ref=r;break}}
 if(ref&&ref.classList.contains('comparison')&&!open){let p=ref.previousElementSibling;while(p&&!p.classList.contains('original'))p=p.previousElementSibling;if(p)ref=p}
 const top=ref?ref.getBoundingClientRect().top:0;
 const vh=innerHeight,still=matchMedia('(prefers-reduced-motion: reduce)').matches,inView=el=>{const q=el.getBoundingClientRect();return q.bottom>0&&q.top<vh};
 const animRows=new Set(still?[]:origRows.filter(r=>r.classList.contains('closed')===open&&(inView(r)||kids(r).some(k=>!k.classList.contains('fold')&&inView(k)))));
 origRows.forEach(r=>setOpen(r,open,animRows.has(r)));syncAll();try{localStorage.setItem('fold',open?'open':'closed')}catch(_){}
 if(ref)scrollBy({top:ref.getBoundingClientRect().top-top,behavior:'instant'});last='';update()}));
try{if(localStorage.getItem('fold')==='closed'){origRows.forEach(r=>setOpen(r,false,false));syncAll()}}catch(_){}
const sheet=document.querySelector('.sheet'),ctxBtn=document.querySelector('.ctx'),shSum=sheet.querySelector('.sh-sum');
const esc=t=>t.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'})[m]);
sheet.querySelectorAll('.sh-list').forEach(box=>{box.innerHTML=lessons.filter(l=>info[l.id].sec===box.dataset.sec).map(l=>{const d=info[l.id];
 return `<a class="lc" href="#${l.id}"><span class="lc-t">${esc(d.t)}</span><span class="lc-s">${d.n} 個動詞${d.c?' · '+d.c+' 個對照':''}</span><span class="lc-b" lang="ja">${esc(d.b)}</span></a>`}).join('')});
const tabTo=sec=>{sheet.dataset.sec=sec;sheet.querySelectorAll('.sh-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.sec===sec));
 const ls=lessons.filter(l=>info[l.id].sec===sec),n=ls.reduce((a,l)=>a+info[l.id].n,0),c=ls.reduce((a,l)=>a+info[l.id].c,0);
 shSum.textContent=`${ls.length} 課 · ${n} 個動詞 · ${c} 個對照`};
sheet.querySelectorAll('.sh-tabs button').forEach(b=>b.addEventListener('click',()=>{tabTo(b.dataset.sec);sheet.querySelector('.sh-body').scrollTop=0}));
let sheetWant=false;
const openSheet=sec=>{tabTo(sec||curSec);sheetWant=true;sheet.hidden=false;requestAnimationFrame(()=>{if(sheetWant)sheet.classList.add('open')});
 const on=sheet.querySelector(`.sh-list[data-sec="${sheet.dataset.sec}"] a.on`);if(on)on.scrollIntoView({block:'center'})};
const closeSheet=()=>{sheetWant=false;sheet.classList.remove('open');setTimeout(()=>{if(!sheetWant)sheet.hidden=true},250)};

sheet.querySelector('.sheet-bg').addEventListener('click',closeSheet);sheet.querySelector('.sh-x').addEventListener('click',closeSheet);
addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)closeSheet()});
sheet.addEventListener('click',e=>{const a=e.target.closest('a.lc');if(a)closeSheet()});
addEventListener('jp:resize',()=>{last='';update()});update();})();
