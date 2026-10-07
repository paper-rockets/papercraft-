import {Paper3D,PaperCard,PaperNode,compose,translation,rotation} from './engine.js';
import {texturePaths} from './demos.js';

/* Folding nets for the solids in the book. Each net is a flat base face with flaps hinged on its
   edges (flaps can carry more flaps). Every hinge has its own fold amount (0 = flat, 1 = closed),
   so a child can fold one side by hand to any angle, or tap to fold the whole net.
   A face is written in its hinge's frame: the hinge edge runs (L,0) -> (0,0), the face lies at y < 0. */
const COLOR={teal:'#1f6b63',mustard:'#e9b530',cream:'#f6efe2'};
const rect=(L,H)=>[[L,0],[0,0],[0,-H],[L,-H]];
const tri=(L,h=L*Math.sqrt(3)/2)=>[[L,0],[0,0],[L/2,-h]];
const DEG=Math.PI/180;
// Base faces go counter-clockwise round the middle: edge 0 = bottom, then right, top, left.
const square=(w,h=w)=>[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]];
const triangle=L=>{const h=L*Math.sqrt(3)/2;return [[-L/2,-h/3],[L/2,-h/3],[0,2*h/3]];};
const PYRAMID4=180*DEG-Math.acos(1/Math.sqrt(3)); // square base, equilateral sides
const PYRAMID3=180*DEG-Math.acos(1/3);            // regular tetrahedron

// flap: {edge (of the parent face), points, fold (closed angle), texture, flaps:[...]}
export const SHAPES={
 cube:{name:'Cube',faces:6,extent:460,base:square(88),flaps:[
  {edge:0,points:rect(88,88),fold:90*DEG,texture:'teal'},
  {edge:1,points:rect(88,88),fold:90*DEG,texture:'mustard',flaps:[{edge:2,points:rect(88,88),fold:90*DEG,texture:'teal'}]},
  {edge:2,points:rect(88,88),fold:90*DEG,texture:'teal'},
  {edge:3,points:rect(88,88),fold:90*DEG,texture:'mustard'}]},
 squarePrism:{name:'Square prism',faces:6,extent:560,base:square(70),flaps:[
  {edge:0,points:rect(70,120),fold:90*DEG,texture:'teal'},
  {edge:1,points:rect(70,120),fold:90*DEG,texture:'mustard',flaps:[{edge:2,points:rect(70,70),fold:90*DEG,texture:'teal'}]},
  {edge:2,points:rect(70,120),fold:90*DEG,texture:'teal'},
  {edge:3,points:rect(70,120),fold:90*DEG,texture:'mustard'}]},
 triangularPrism:{name:'Triangular prism',faces:5,extent:520,base:square(150,80),flaps:[
  {edge:0,points:rect(150,80),fold:120*DEG,texture:'teal',flaps:[{edge:2,points:rect(150,80),fold:120*DEG,texture:'teal'}]},
  {edge:2,points:rect(150,80),fold:120*DEG,texture:'teal'},
  {edge:1,points:tri(80),fold:90*DEG,texture:'mustard'},
  {edge:3,points:tri(80),fold:90*DEG,texture:'mustard'}]},
 squarePyramid:{name:'Square pyramid',faces:5,extent:500,base:square(100),flaps:[0,1,2,3].map(edge=>({edge,points:tri(100),fold:PYRAMID4,texture:edge%2?'mustard':'teal'}))},
 triangularPyramid:{name:'Triangular pyramid',faces:4,extent:480,base:triangle(120),flaps:[0,1,2].map(edge=>({edge,points:tri(120),fold:PYRAMID3,texture:edge%2?'mustard':'teal'}))}
};


export function foldingNet(canvas,shapeKey='cube',options={}){
 const shape=SHAPES[shapeKey]||SHAPES.cube;
 const engine=new Paper3D(canvas,{extent:shape.extent,tableY:-86,...options});
 engine.foldKeys=[];engine.target=0;engine.shape=shapeKey;
 const root=new PaperNode({matrix:compose(translation(0,-83,15),rotation('x',-Math.PI/2))});
 const add=(id,points,node,texture,creases=[])=>engine.add(new PaperCard({id,points,node,texture,color:COLOR[texture],creases}));
 add('base',shape.base,root,'mustard');
 let n=0;
 const attach=(parentPoints,parentNode,flap)=>{
  const key=`fold-${n++}`,a=parentPoints[flap.edge],b=parentPoints[(flap.edge+1)%parentPoints.length];
  const angle=Math.atan2(b[1]-a[1],b[0]-a[0]),L=Math.hypot(b[0]-a[0],b[1]-a[1]);
  // The flap is written with its hinge from (L,0) to (0,0); line it up with the parent edge a -> b.
  const points=flap.points.map(([x,y])=>[x*L/flap.points[0][0],y*L/flap.points[0][0]]);
  engine.state[key]=0;engine.foldKeys.push(key);
  const node=new PaperNode({id:key,parent:parentNode,pose:state=>compose(translation(a[0],a[1],0),rotation('z',angle),rotation('x',-(state[key]||0)*flap.fold))});
  const card=add(`face-${n}`,points,node,flap.texture,[[[0,0],[L,0]]]);card.foldKey=key;card.foldNode=node;
  (flap.flaps||[]).forEach(child=>attach(points,node,child));
 };
 shape.flaps.forEach(flap=>attach(shape.base,root,flap));
 // Tap: fold everything closed, or open it all again if it is mostly folded already.
 engine.toggle=()=>{const avg=engine.foldKeys.reduce((s,k)=>s+(engine.state[k]||0),0)/engine.foldKeys.length;engine.target=avg>0.5?0:1;engine.foldKeys.forEach(k=>engine.animate(k,engine.target,{duration:1800}));};
 engine.onTap=engine.toggle;engine.loadTextures(texturePaths);return engine;
}
