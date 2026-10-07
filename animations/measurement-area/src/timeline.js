(()=>{
 const {A,T,label,show,hide,word,finish,done}=PAPER_FILM;
 const B=k=>T.voice['n'+k], x=760,y=435,u=142;
 // Paper pieces (3 Oct): a cream card for the rectangle, coral paper strips for the edges, mustard paper
 // squares for the square centimetres (made by work/frame-v3/make-measure-paper.py).
 const part=(id,w,h)=>{window.MANIFEST.sizes[id]=[w,h];window.ASSET_URLS[id]='assets/parts/'+id+'.webp';};
 part('rect-board',600,316);part('edge-h',580,18);part('edge-v',18,296);
 // Tall screens: the rectangle and everything on it keep their size in the upper middle, the notes
 // stack under it, and the sums sit above the capybara (helpers.js uses p.portraitMap).
 const rectAt=(sx,sy)=>[480+(sx-(x+284)),560+(sy-(y+142))];
 const onRect=p=>{p.portraitMap=st=>[...rectAt(st.x,st.y),1];return p;};
 const at=(p,px,py,k=1)=>{p.portraitMap=()=>[px,py,k];return p;};
 const sum=p=>at(p,540,1190,Math.min(.8,970/p.w));
 const rectangle=onRect(A.piece('rect-board',1,{rot:0}));
 A.place(rectangle,x+284,y+142,.3,{rot:0,z:8});
 const length=onRect(label('4 cm',.75)),width=onRect(label('2 cm',.75));
 show(length,x+284,y-72,B(1)+2,{sound:false});show(width,x+690,y+142,B(1)+4,{sound:false});
 const pin=onRect(A.piece('decor/star-red',.2,{rot:0}));show(pin,x,y,B(2)+.4,{sound:false});
 const edges=[[[x,y],[x+568,y]],[[x+568,y],[x+568,y+284]],[[x+568,y+284],[x,y+284]],[[x,y+284],[x,y]]];
 const linePieces=[];
 edges.forEach(([a,b])=>{
   const edge=onRect(A.piece(a[1]===b[1]?'edge-h':'edge-v',1,{rot:0}));linePieces.push(edge);
   A.place(edge,(a[0]+b[0])/2,(a[1]+b[1])/2,0,{op:0,z:12});
 });
 A.slide(pin,x+568,y,B(2)+2,2.6,{rot:0,sound:false,ease:'power2.inOut'});A.to(linePieces[0],{op:1},B(2)+2,.3);
 let t=B(3)+.5;
 for(let i=1;i<4;i++){
   A.slide(pin,...edges[i][1],t,1.5,{rot:0,sound:false,ease:'power2.inOut'});A.to(linePieces[i],{op:1},t,.3);A.sfx('pencil-tap',t+1.5,.3);t+=1.8;
 }
 const equation=sum(label('4 + 2 + 4 + 2 = 12 cm',.9));show(equation,1200,995,B(4)+1,{sound:false});
 const perimeter=at(label('PERIMETER: 12 cm',.7),540,860);show(perimeter,1790,460,B(4)+3,{sound:false});
 hide(pin,B(5));hide(equation,B(5));
 const UNIT=[540,1030];
 const unit=at(A.piece('area-unit',1,{rot:0}),...UNIT);show(unit,1770,720,B(5)+.7,{sound:false});
 const unitTag=at(label('1 cm × 1 cm',.65),540,1140);show(unitTag,1770,890,B(5)+2,{sound:false});
 const tiles=[];
 for(let r=0;r<2;r++)for(let c=0;c<4;c++){
   const p=A.piece('area-unit',1,{rot:0});tiles.push(p);
   const fx=x+71+c*u,fy=y+71+r*u,end=rectAt(fx,fy);
   // on tall screens each square travels from the sample square to its place, keeping its little arc
   p.portraitMap=st=>{const k=Math.max(0,Math.min(1,(1770-st.x)/(1770-fx)));const lift=st.y-(720+(fy-720)*k);
     return [UNIT[0]+(end[0]-UNIT[0])*k,UNIT[1]+(end[1]-UNIT[1])*k+lift,1];};
   A.place(p,1770,720,B(6)+(r*4+c)*.55,{op:1,rot:0,z:10});
   A.carry(p,fx,fy,B(6)+(r*4+c)*.55,.8,{arc:55,rot:0,sound:false,landGain:.2,z:10});
 }
 const area=sum(label('AREA: 8 cm²',.8));show(area,1200,995,word('n7','area')+.3,{sound:false});
 const areaNote=at(label('AREA: 8 cm²',.7),540,950);show(areaNote,1790,610,B(7)+3,{sound:false});hide(unit,B(7));hide(unitTag,B(7));
 linePieces.forEach(p=>A.to(p,{op:1},B(8)+.6,.3));
 const recap=sum(label('AROUND: cm     INSIDE: cm²',.85));hide(area,B(8));show(recap,1200,995,B(8)+1,{sound:false});finish(B(9)+4.7);
 window.MATH_CHECKS={length:4,width:2,perimeter:12,area:8,tileCount:8,tileSide:1,unit:'cm'};
 window.CHECKPOINTS={edge:B(4)-.2,perimeter:B(5)-.2,tiles:B(7)-.2,complete:B(9)+3};done();
})();
