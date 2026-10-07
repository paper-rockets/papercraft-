import {Paper3D,PaperCard,PaperNode,rectangle,compose,translation,rotation} from './engine.js';
export const texturePaths={cream:'/papercraft-/paper3d/textures/cream.webp',mustard:'/papercraft-/paper3d/textures/mustard.webp',teal:'/papercraft-/paper3d/textures/teal.webp'};
const card=(engine,id,w,h,node,texture='mustard',options={})=>engine.add(new PaperCard({id,points:rectangle(w,h),node,texture,color:texture==='teal'?'#1f6b63':texture==='mustard'?'#e9b530':'#f6efe2',...options}));
export function cubeNet(canvas,options={}){
 const engine=new Paper3D(canvas,{extent:460,tableY:-86,...options});engine.state.fold=0;
 const s=88,root=new PaperNode({matrix:compose(translation(0,-83,15),rotation('x',-Math.PI/2))});
 card(engine,'base',s,s,root,'mustard',{creases:[[[-s/2,-s/2],[s/2,-s/2]],[[-s/2,s/2],[s/2,s/2]]]});
 const hinge=(id,parent,x,y,axis,sign,dx,dy)=>new PaperNode({id,parent,pose:state=>compose(translation(x,y,0),rotation(axis,sign*(state.fold||0)*Math.PI/2),translation(dx,dy,0))});
 const left=hinge('left-hinge',root,-s/2,0,'y',1,-s/2,0),right=hinge('right-hinge',root,s/2,0,'y',-1,s/2,0),top=hinge('top-hinge',root,0,s/2,'x',1,0,s/2),bottom=hinge('bottom-hinge',root,0,-s/2,'x',-1,0,-s/2),lid=hinge('lid-hinge',top,0,s/2,'x',1,0,s/2);
 [left,right,top,bottom,lid].forEach((node,i)=>card(engine,['left','right','top','bottom','lid'][i],s,s,node,i%2?'teal':'mustard',{creases:[i===0||i===1?[[i===0?s/2:-s/2,-s/2],[i===0?s/2:-s/2,s/2]]:[[-s/2,-s/2],[s/2,-s/2]]]}));
 engine.toggle=()=>{engine.target=engine.target===1?0:1;engine.animate('fold',engine.target,{duration:1800});};engine.onTap=engine.toggle;engine.loadTextures(texturePaths);return engine;
}
/** Six thick card faces form a hollow, matte unit box. */
export function addPaperBox(engine,{id,size=26,node,texture='mustard'}){
 const half=size/2;
 const faces=[['front',translation(0,0,half)],['back',compose(translation(0,0,-half),rotation('y',Math.PI))],['left',compose(translation(-half,0,0),rotation('y',-Math.PI/2))],['right',compose(translation(half,0,0),rotation('y',Math.PI/2))],['top',compose(translation(0,half,0),rotation('x',-Math.PI/2))],['bottom',compose(translation(0,-half,0),rotation('x',Math.PI/2))]];
 return faces.map(([side,matrix])=>card(engine,`${id}-${side}`,size,size,new PaperNode({parent:node,matrix}),texture,{thickness:1.2}));
}
export function tenRod(canvas,options={}){
 const engine=new Paper3D(canvas,{extent:400,tableY:-48,...options});engine.state.split=0;
 for(let i=0;i<10;i++){const node=new PaperNode({pose:state=>{const t=state.split||0;return translation((i-4.5)*(26+10*t),-32+Math.sin(i*1.7)*9*t,(i%2?1:-1)*24*t);}});addPaperBox(engine,{id:`one-${i+1}`,node,size:26});}
 engine.toggle=()=>{engine.target=engine.target===1?0:1;engine.animate('split',engine.target,{duration:1200});};engine.onTap=engine.toggle;engine.loadTextures(texturePaths);return engine;
}
export function popupCard(canvas,options={}){
 const engine=new Paper3D(canvas,{extent:380,tableY:-60,...options});engine.state.open=0;engine.target=0;
 const root=new PaperNode({matrix:compose(translation(0,-57,0),rotation('x',-Math.PI/2))});
 const left=new PaperNode({parent:root,matrix:translation(-62,0,0)});card(engine,'left-cover',124,170,left,'cream',{thickness:2,creases:[[[62,-85],[62,85]]]});
 // The right cover folds over the left one. Its spine lifts as it closes so it lies flat on top of
 // the folded layers instead of cutting through them.
 const right=new PaperNode({parent:root,pose:state=>{const t=state.open||0;return compose(translation(0,0,2+7*(1-t)),rotation('y',-Math.PI*(1-t)),translation(62,0,0));}});card(engine,'right-cover',124,170,right,'cream',{thickness:2,creases:[[[-62,-85],[-62,85]]]});
 // Three layers hinged on the left page, parallel to the spine. Closed: they lie flat inside the card,
 // pointing away from the spine, so nothing shows. Opening stands them up one behind the other.
 for(let i=0;i<3;i++){const height=55+i*17,width=92-i*14,hinge=-8-i*12;const panel=new PaperNode({parent:root,pose:state=>{const t=state.open||0;return compose(translation(hinge,0,1.75+i*1.6),rotation('y',t*Math.PI/2),translation(-height/2,0,0));}});card(engine,`popup-layer-${i+1}`,height,width,panel,['teal','mustard','cream'][i],{thickness:1.5,creases:[[[height/2,-width/2],[height/2,width/2]]]});}
 engine.toggle=()=>{engine.target=engine.target===1?0:1;engine.animate('open',engine.target,{duration:1800});};engine.onTap=engine.toggle;engine.loadTextures(texturePaths);return engine;
}
