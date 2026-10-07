(()=>{
 const {A,T,label,show,hide,finish,done,guide}=PAPER_FILM;
 const B=n=>T.voice['n'+n],state={sides:0,ends:0,spin:0};
 const model=guide('folding-prism',920,870,'');A.place(model,1000,600,.4,{rot:0,z:10});
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 920 870');svg.style.cssText='width:100%;height:100%;overflow:visible';
 model.el.replaceChildren(svg);
 const defs=document.createElementNS(ns,'defs');
 defs.innerHTML='<pattern id="paper" width="400" height="400" patternUnits="userSpaceOnUse"><image href="assets/prism/mustard.webp" width="400" height="400"/></pattern>';
 svg.append(defs);
 const faces=PRISM.faces.map(face=>{const polygon=document.createElementNS(ns,'polygon');polygon.setAttribute('fill','url(#paper)');polygon.setAttribute('stroke','#705b31');polygon.setAttribute('stroke-width','3');polygon.setAttribute('stroke-linejoin','round');polygon.dataset.face=face.id;svg.append(polygon);return polygon;});
 function folded(index,p){
   const h=PRISM.hinges.find(h=>h.child===index);if(!h)return p;
   const amount=PRISM.faces[index].type==='triangle'?state.ends:state.sides;
   return folded(h.parent,rotate(p,[...h.edge[0],0],[...h.edge[1],0],h.targetAngleDeg*amount));
 }
 function projected(p){
   const a=state.sides*.95+state.spin,b=state.sides*.45;
   const x=p[0]-(90-60*state.sides),y=p[1]-122,z=p[2]+26*state.sides;
   const xx=x*Math.cos(a)+z*Math.sin(a),zz=-x*Math.sin(a)+z*Math.cos(a);
   const zoom=3.65+2*state.sides;
   return [460+xx*zoom,435+(y*Math.cos(b)-zz*Math.sin(b))*zoom, y*Math.sin(b)+zz*Math.cos(b)];
 }
 A.PAPER.to(state,{sides:1,duration:5,ease:'power2.inOut'},B(5)+.5);
 A.PAPER.to(state,{ends:1,duration:4.5,ease:'power2.inOut'},B(6)+.5);
 A.PAPER.to(state,{spin:Math.PI*2,duration:6,ease:'power1.inOut'},B(7)+.3);
 A.PAPER.to(state,{ends:0,duration:2.5,ease:'power2.inOut'},B(8)+.3);
 A.PAPER.to(state,{sides:0,duration:3.5,ease:'power2.inOut'},B(8)+3);
 A.afterRender=t=>{
   const posed=PRISM.faces.map(face=>face.points2D.map(p=>folded(face.id,[...p,0])));
   const projectedFaces=posed.map(ps=>ps.map(projected));
   const order=projectedFaces.map((ps,i)=>({i,depth:ps.reduce((s,p)=>s+p[2],0)/ps.length})).sort((a,b)=>a.depth-b.depth);
   for(const {i} of order){
     const face=PRISM.faces[i],poly=faces[i];poly.setAttribute('points',projectedFaces[i].map(p=>p.slice(0,2).join(',')).join(' '));
     const highlight=(t>=B(2)&&t<B(3)&&face.type==='rectangle')||(t>=B(3)&&t<B(4)&&face.type==='triangle');
     poly.setAttribute('stroke',highlight?'#b94636':'#705b31');poly.setAttribute('stroke-width',highlight?'7':'3');svg.append(poly);
     // Light from the upper left: each face is as bright as it turns toward the light (paper shows both sides).
     const [p0,p1,p2]=projectedFaces[i],u=[p1[0]-p0[0],p1[1]-p0[1],p1[2]-p0[2]],v=[p2[0]-p0[0],p2[1]-p0[1],p2[2]-p0[2]];
     const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n)||1;
     const lit=Math.abs((n[0]*-.45+n[1]*-.55+n[2]*.7)/len);
     poly.style.filter=`brightness(${(.68+.42*lit).toFixed(3)})`;
   }
   window.PRISM_STATE={sides:state.sides,ends:state.ends,faces:posed};
 };
 const tags=['3 RECTANGLES','2 TRIANGLES','FOLD ALONG SHARED EDGES','TRIANGULAR PRISM','5 FACES','SAME FACES · FLAT OR FOLDED'].map(s=>label(s,.65));
 function note(index,beat){tags.forEach((p,i)=>{if(i!==index)hide(p,B(beat),.25);});show(tags[index],1740,520,B(beat)+.5,{sound:false});}
 note(0,2);note(1,3);note(2,4);note(3,6);note(4,7);note(5,8);
 finish(B(9)+4.8);
 window.MATH_CHECKS={rectangles:3,triangles:2,faces:5,vertices:6,edges:9};
 window.CHECKPOINTS={flat:B(2)-.3,rectangles:B(3)-.3,triangles:B(4)-.3,closed:B(8)-.3,unfolded:B(9)+3};done();
})();
