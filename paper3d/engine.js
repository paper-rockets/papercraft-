/** Lightweight true-geometry paper renderer. No audio or storage access. */
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
export function multiply(a,b){const o=new Array(16);for(let col=0;col<4;col++){const b0=b[col*4],b1=b[col*4+1],b2=b[col*4+2],b3=b[col*4+3];for(let row=0;row<4;row++)o[col*4+row]=a[row]*b0+a[row+4]*b1+a[row+8]*b2+a[row+12]*b3;}return o;}
// Each picture works out every node's position once; FRAME moves on whenever the values may have changed.
let FRAME=0;export const nextFrame=()=>++FRAME;
export const translation=(x=0,y=0,z=0)=>{const m=identity();m[12]=x;m[13]=y;m[14]=z;return m;};
export function rotation(axis,a){const c=Math.cos(a),s=Math.sin(a);if(axis==='x')return [1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1];if(axis==='y')return [c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1];return [c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1];}
export const transform=(m,p)=>[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
export const compose=(...ms)=>ms.reduce(multiply,identity());
export const rectangle=(w,h)=>[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const l=Math.hypot(...a)||1;return a.map(n=>n/l);};
const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
const light=unit([-0.6,0.9,0.65]);
// Painting order. Sorting by average depth alone fails when a big sheet lies just above small ones
// (a closed card over its folded layers): the small pieces get painted on top. So for every two
// faces that overlap on screen, test which one is wholly on the viewer's side of the other's plane,
// and paint the one behind first. Faces with no clear answer fall back to average depth.
const onEyeSide=(f,g)=>g.points.every(p=>dot(f.normal,sub(p,f.points[0]))>=-0.05);
const behind=(f,g)=>g.points.every(p=>dot(f.normal,sub(p,f.points[0]))<=0.05);
// g is in front of f when g lies wholly on the viewer's side of f, or f lies wholly behind g.
const inFront=(g,f)=>onEyeSide(f,g)||behind(g,f);
function paintOrder(faces){
 const n=faces.length,box=faces.map(f=>{let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const p of f.ps){x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1]);}return [x0,y0,x1,y1];});
 const after=faces.map(()=>[]),waiting=new Array(n).fill(0);
 for(let a=0;a<n;a++)for(let b=a+1;b<n;b++){const A=box[a],B=box[b];if(A[2]<=B[0]||B[2]<=A[0]||A[3]<=B[1]||B[3]<=A[1])continue;
  const bFront=inFront(faces[b],faces[a]),aFront=inFront(faces[a],faces[b]);
  if(bFront&&!aFront){after[a].push(b);waiting[b]++;}else if(aFront&&!bFront){after[b].push(a);waiting[a]++;}}
 const order=[],done=new Array(n).fill(false),byDepth=[...faces.keys()].sort((a,b)=>faces[a].depth-faces[b].depth);
 while(order.length<n){let pick=byDepth.find(i=>!done[i]&&waiting[i]===0);if(pick===undefined)pick=byDepth.find(i=>!done[i]);done[pick]=true;order.push(faces[pick]);for(const j of after[pick])waiting[j]--;}
 return order;
}
const inPolygon=(p,poly)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};

export class PaperNode {
 constructor({id='',matrix=identity(),pose=null,parent=null}={}){this.id=id;this.matrix=matrix;this.pose=pose;this.parent=parent;this.cards=[];}
 world(state){if(this._f===FRAME&&this._s===state)return this._m;const local=this.pose?this.pose(state):this.matrix;const m=this.parent?multiply(this.parent.world(state),local):local;this._f=FRAME;this._s=state;this._m=m;return m;}
}
/** A rigid thick card. Use parented nodes for crease hinges, not vertex morphing. */
export class PaperCard {
 constructor({id,points,thickness=1.5,texture='cream',color='#f6efe2',edge='#b98a5a',node=new PaperNode(),onTap=null,creases=[],visible=null}){
  if(!points||points.length<3)throw new Error('Card requires a polygon of at least 3 points');
  Object.assign(this,{id,points,thickness,texture,color,edge,node,onTap,creases,visible});
 }
 // visible(state) false = the card is not drawn (e.g. a ten-rod while it is broken into ones).
 faces(state){if(this.visible&&!this.visible(state))return [];const m=this.node.world(state);
  // thickness 0 = one-sided sheet (a face of a closed box): no back or card edges to draw.
  if(!this.thickness)return [{points:this.points.map(p=>transform(m,[...p,0])),card:this,kind:'front'}];
  const front=this.points.map(p=>transform(m,[...p,this.thickness/2])),back=this.points.map(p=>transform(m,[...p,-this.thickness/2]));return [{points:front,card:this,kind:'front'},{points:[...back].reverse(),card:this,kind:'back'},...front.map((p,i)=>({points:[p,back[i],back[(i+1)%front.length],front[(i+1)%front.length]],card:this,kind:'edge'}))];}
}
export class Paper3D {
 constructor(canvas,{extent=500,tableY=-155,onTap=null,onChange=null}={}){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});if(!this.ctx)throw new Error('Canvas renderer unavailable');
  Object.assign(this,{extent,tableY,onTap,onChange});this.cards=[];this.textures=new Map();this.state={};this.watchers=[];this.transitions=new Map();this.camera={yaw:-0.45,pitch:0.65,zoom:1};this.defaultCamera={...this.camera};this.pointers=new Map();this.hits=[];this.frames=0;this.raf=0;this.hidden=document.hidden;this.motion=false;this.tilt={x:0,y:0};this.cleanups=[];this.reduce=matchMedia('(prefers-reduced-motion: reduce)');
  this.listen(this.reduce,'change',()=>{if(this.reduce.matches){for(const [key,t]of this.transitions)this.state[key]=t.to;this.transitions.clear();this.setMotion(false);}this.invalidate();});
  this.listen(document,'visibilitychange',()=>{this.hidden=document.hidden;if(this.hidden){cancelAnimationFrame(this.raf);this.raf=0;this.hiddenAt=performance.now();this.pointers.clear();clearTimeout(this.tapTimer);this.lastTap=0;}else{const pause=performance.now()-(this.hiddenAt||performance.now());for(const t of this.transitions.values())t.start+=pause;this.invalidate();}});
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.bindInput();this.resize();
 }
 listen(target,event,fn,options){target.addEventListener(event,fn,options);this.cleanups.push(()=>target.removeEventListener(event,fn,options));}
 add(card){this.cards.push(card);this.invalidate();return card;}
 async loadTextures(paths){await Promise.all(Object.entries(paths).map(([key,url])=>new Promise(resolve=>{const im=new Image();im.onload=()=>{const tile=document.createElement('canvas');tile.width=256;tile.height=256;tile.getContext('2d').drawImage(im,0,0,256,256);this.textures.set(key,tile);this.invalidate();resolve(true);};im.onerror=()=>resolve(false);im.src=url;})));return this.textures.size;}
 resize(){const r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;this.dpr=Math.min(devicePixelRatio||1,1.5);this.canvas.width=Math.max(1,Math.round(r.width*this.dpr));this.canvas.height=Math.max(1,Math.round(r.height*this.dpr));this.invalidate();}
 animate(key,to,{duration=720}={}){this.sample(performance.now());const from=this.state[key]??0;if(this.reduce.matches||duration===0){this.state[key]=to;this.transitions.delete(key);}else this.transitions.set(key,{from,to,start:performance.now(),duration});this.invalidate();}
 sample(now){for(const [key,t] of this.transitions){const p=clamp((now-t.start)/t.duration,0,1),e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;this.state[key]=t.from+(t.to-t.from)*e;if(p===1)this.transitions.delete(key);} }
 invalidate(){if(!this.hidden&&!this.raf)this.raf=requestAnimationFrame(now=>{this.raf=0;this.sample(now);this.render();this.onChange?.(this);for(const w of this.watchers)w(this);if(this.transitions.size)this.invalidate();});}
 project(p){const yaw=this.camera.yaw+this.tilt.x,pitch=this.camera.pitch+this.tilt.y,c=Math.cos(yaw),s=Math.sin(yaw),x=p[0]*c+p[2]*s,z=-p[0]*s+p[2]*c,y=p[1]*Math.cos(pitch)-z*Math.sin(pitch),depth=p[1]*Math.sin(pitch)+z*Math.cos(pitch),distance=1100,f=distance/(distance-depth),scale=Math.min(this.width,this.height)*this.camera.zoom/this.extent;return [this.width/2+x*f*scale,this.height*.51-y*f*scale,depth];}
 path(points){const c=this.ctx;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();}
 render(){nextFrame();const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#e8dfce';c.fillRect(0,0,this.width,this.height);this.frames++;
  const faces=this.cards.flatMap(card=>card.faces(this.state));
  // Project real geometry away from the upper-left light onto a fixed table plane.
  c.save();c.fillStyle='#57412d';c.shadowColor='#57412d55';c.shadowBlur=13*this.dpr;c.shadowOffsetX=2;c.shadowOffsetY=4;c.globalAlpha=.035;
  for(const card of this.cards){const face=card.faces(this.state)[0];if(!face)continue;const shadow=face.points.map(p=>{const h=Math.max(0,p[1]-this.tableY);return this.project([p[0]-light[0]/light[1]*h,this.tableY,p[2]-light[2]/light[1]*h]);});this.path(shadow);c.fill();}c.restore();
  this.hits=[];const yaw=this.camera.yaw+this.tilt.x,pitch=this.camera.pitch+this.tilt.y,eye=[-Math.sin(yaw)*Math.cos(pitch)*1100,Math.sin(pitch)*1100,Math.cos(yaw)*Math.cos(pitch)*1100];
  const visible=paintOrder(faces.flatMap(f=>{const normal=unit(cross(sub(f.points[1],f.points[0]),sub(f.points[2],f.points[0])));if(dot(normal,sub(eye,f.points[0]))<=0)return [];const ps=f.points.map(p=>this.project(p));return [{...f,normal,ps,depth:ps.reduce((s,p)=>s+p[2],0)/ps.length}];}));
  for(const f of visible){const normal=f.normal;const brightness=.77+.23*Math.max(0,dot(normal,light));this.path(f.ps);const area=Math.abs(f.ps.reduce((s,p,i)=>{const q=f.ps[(i+1)%f.ps.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;
   // Box faces (thickness 0) skip the extra soft drop shadow; it only matters for loose cards.
   if(f.kind==='front'&&f.card.thickness){c.save();c.shadowColor='#46301d30';c.shadowBlur=3*this.dpr;c.shadowOffsetX=1.2;c.shadowOffsetY=1.8;c.fillStyle=f.card.color;c.fill();c.restore();}c.save();c.clip();c.fillStyle=f.kind==='edge'?f.card.edge:f.card.color;c.fill();
   const texture=this.textures.get(f.card.texture);
   // Faces too small to show the paper grain get flat colour (much cheaper).
   if(texture&&f.kind!=='edge'&&area>1400&&(f.ps.length===4||f.ps.length===3)){this.textureQuad(texture,f.ps);}
   c.fillStyle=`rgba(35,24,12,${1-brightness})`;this.path(f.ps);c.fill();c.restore();
   // Thin seams and contact shadow make stacked card surfaces readable without gloss.
   this.path(f.ps);c.lineWidth=f.kind==='edge'?.55:.7;c.strokeStyle=f.kind==='edge'?'#76563c55':'#6a4b2e28';c.stroke();
   if(f.kind!=='edge')this.hits.push({polygon:f.ps,id:f.card.id,card:f.card});
   if(f.kind==='front'){const m=f.card.node.world(this.state);for(const crease of f.card.creases){const ps=crease.map(p=>this.project(transform(m,[...p,f.card.thickness/2+.1])));c.save();c.setLineDash([4,4]);c.strokeStyle='#6c523d70';c.lineWidth=1;c.beginPath();c.moveTo(...ps[0].slice(0,2));c.lineTo(...ps[1].slice(0,2));c.stroke();c.restore();}}
  }
 }
 textureQuad(im,p){const tri=p.length===3,triangles=tri?[[0,1,2]]:[[0,1,2],[0,2,3]],uv=tri?[[0,0],[256,0],[128,222]]:[[0,0],[256,0],[256,256],[0,256]];for(const ids of triangles){const [a,b,d]=ids.map(i=>uv[i]),[A,B,D]=ids.map(i=>p[i]),u=b[0]-a[0],v=b[1]-a[1],w=d[0]-a[0],z=d[1]-a[1],det=u*z-v*w;if(Math.abs(det)<.01)continue;const m=[((B[0]-A[0])*z-(D[0]-A[0])*v)/det,((B[1]-A[1])*z-(D[1]-A[1])*v)/det,((D[0]-A[0])*u-(B[0]-A[0])*w)/det,((D[1]-A[1])*u-(B[1]-A[1])*w)/det];const c=this.ctx;c.save();this.path(ids.map(i=>p[i]));c.clip();c.transform(...m,A[0]-m[0]*a[0]-m[2]*a[1],A[1]-m[1]*a[0]-m[3]*a[1]);c.drawImage(im,0,0);c.restore();}}
 react(card,{kind='wobble',duration=450,height=16,angle=.12}={}){if(this.reduce.matches)return;const key='reaction-'+card.id;card.reactionOptions={kind,height,angle};if(!card.reactionNode){const original=card.node;card.reactionNode=new PaperNode({parent:original,pose:state=>{const q=Math.sin(Math.PI*(state[key]||0)),o=card.reactionOptions;return o.kind==='lift'?translation(0,0,o.height*q):rotation('x',o.angle*Math.sin(2*Math.PI*(state[key]||0))*q);}});card.node=card.reactionNode;}this.state[key]=0;this.transitions.delete(key);this.animate(key,1,{duration});}
 /** Fold a hinged card by hand: pick the fold amount that puts the card's middle closest to the finger. */
 foldTo(card,p){const key=card.foldKey;this.transitions.delete(key);let best=this.state[key]||0,bestD=Infinity;
  for(let k=0;k<=40;k++){const t=k/40;this.state[key]=t;nextFrame();const m=card.node.world(this.state),c=card.points.reduce((s,q)=>[s[0]+q[0]/card.points.length,s[1]+q[1]/card.points.length],[0,0]),s=this.project(transform(m,[c[0],c[1],0])),d=Math.hypot(s[0]-p[0],s[1]-p[1]);if(d<bestD-.01){bestD=d;best=t;}}
  this.state[key]=best;nextFrame();this.invalidate();}
 reset(){clearTimeout(this.tapTimer);this.camera={...this.defaultCamera};this.tilt={x:0,y:0};this.pointers.clear();this.invalidate();}
 bindInput(){const el=this.canvas;el.style.touchAction='none';const point=e=>{const r=el.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top];};
  this.listen(el,'pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;el.setPointerCapture(e.pointerId);const p=point(e);const grabbed=[...this.hits].reverse().find(h=>inPolygon(p,h.polygon));this.pointers.set(e.pointerId,{start:p,p,moved:false,fold:grabbed?.card.foldKey?grabbed.card:null});if(this.pointers.size>1){for(const v of this.pointers.values())v.moved=true;clearTimeout(this.tapTimer);this.lastTap=0;}this.pinch=null;});
  this.listen(el,'pointermove',e=>{const v=this.pointers.get(e.pointerId);if(!v)return;const p=point(e),prev=v.p;v.p=p;if(Math.hypot(p[0]-v.start[0],p[1]-v.start[1])>7)v.moved=true;const values=[...this.pointers.values()];if(values.length===2){const d=Math.hypot(values[0].p[0]-values[1].p[0],values[0].p[1]-values[1].p[1]);if(this.pinch)this.camera.zoom=clamp(this.camera.zoom*d/this.pinch,.55,2);this.pinch=d;}else if(values.length===1&&v.moved&&v.fold){this.foldTo(v.fold,p);}else if(values.length===1&&v.moved){this.camera.yaw+=(p[0]-prev[0])*.009;this.camera.pitch=clamp(this.camera.pitch+(p[1]-prev[1])*.008,-1.25,1.25);}this.invalidate();});
  const end=e=>{const v=this.pointers.get(e.pointerId);this.pointers.delete(e.pointerId);this.pinch=null;if(!v||v.moved||e.type==='pointercancel')return;const now=performance.now();if(now-(this.lastTap||0)<280){clearTimeout(this.tapTimer);this.reset();this.lastTap=0;return;}this.lastTap=now;const p=point(e);const hit=[...this.hits].reverse().find(h=>inPolygon(p,h.polygon));if(hit){this.tapTimer=setTimeout(()=>{if(this.hidden)return;if(hit.card.onTap)hit.card.onTap(hit.card,this);else if(this.onTap)this.onTap(hit.card,this);else this.react(hit.card);},280);}};
  this.listen(el,'pointerup',end);this.listen(el,'pointercancel',end);this.listen(el,'lostpointercapture',e=>{this.pointers.delete(e.pointerId);this.pinch=null;});
  this.listen(el,'wheel',e=>{e.preventDefault();this.camera.zoom=clamp(this.camera.zoom*Math.exp(-e.deltaY*.001),.55,2);this.invalidate();},{passive:false});this.listen(el,'dblclick',()=>this.reset());
  this.listen(el,'keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','0','Enter',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')this.camera.yaw-=.12;if(e.key==='ArrowRight')this.camera.yaw+=.12;if(e.key==='ArrowUp')this.camera.pitch=clamp(this.camera.pitch-.12,-1.25,1.25);if(e.key==='ArrowDown')this.camera.pitch=clamp(this.camera.pitch+.12,-1.25,1.25);if(e.key==='+')this.camera.zoom=clamp(this.camera.zoom*1.1,.55,2);if(e.key==='-')this.camera.zoom=clamp(this.camera.zoom/1.1,.55,2);if(e.key==='0')this.reset();if(e.key==='Enter'||e.key===' ')this.onTap?.(this.cards[0],this);this.invalidate();});
 }
 async setMotion(enabled){if(!enabled){this.motion=false;this.orientationBaseline=null;this.tilt={x:0,y:0};if(this.orientationHandler)window.removeEventListener('deviceorientation',this.orientationHandler);this.orientationHandler=null;this.invalidate();return 'off';}if(this.reduce.matches)return 'reduced-motion';if(!('DeviceOrientationEvent'in window))return 'unavailable';try{if(typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted')return 'denied';}catch{return 'denied';}
  if(this.motion)return 'on';this.motion=true;this.orientationHandler=e=>{if(this.hidden||e.beta==null||e.gamma==null)return;if(!this.orientationBaseline)this.orientationBaseline={beta:e.beta,gamma:e.gamma};this.tilt.x=clamp((e.gamma-this.orientationBaseline.gamma)*.003,-.10,.10);this.tilt.y=clamp((e.beta-this.orientationBaseline.beta)*.003,-.08,.08);this.invalidate();};window.addEventListener('deviceorientation',this.orientationHandler);return 'on';
 }
 destroy(){this.hidden=true;clearTimeout(this.tapTimer);cancelAnimationFrame(this.raf);this.raf=0;this.observer.disconnect();this.setMotion(false);for(const cleanup of this.cleanups)cleanup();this.cleanups=[];this.hidden=true;}
}
