(()=>{
 const {A,T,label,show,hide,finish,done,guide}=PAPER_FILM;
 const B=n=>T.voice['n'+n],graph=[];
 let axis='<path d="M80 30 V580 H810" fill="none" stroke="#4a4033" stroke-width="5"/>';
 for(let i=0;i<=8;i++)axis+=`<path d="M72 ${580-i*60} H810" stroke="#8c765b" stroke-width="${i?1:3}" opacity=".6"/><text x="50" y="${590-i*60}" font-family="Segoe UI" font-size="40" font-weight="600" fill="#4a4033" text-anchor="end">${i}</text>`;
 const grid=guide('bar-grid',850,640,axis);A.place(grid,990,560,.3,{z:5,rot:0});graph.push(grid);
 const bars=[],pets=[];
 [[5,'cat.webp','CATS','#b85a44'],[2,'dog.webp','DOGS','#cc9b38'],[8,'fish-side.webp','FISH','#427c73']].forEach(([count,asset,text,color],col)=>{
   const x=800+col*240;
   const pet=A.piece(asset,.13,{rot:0});show(pet,x,915,.7+col*.25,{sound:false});graph.push(pet);pets.push(pet);
   const tag=label(text,.55);show(tag,x,1055,1+col*.25,{sound:false});graph.push(tag);
   const blocks=[];
   for(let i=0;i<count;i++){
     const block=guide(`bar-${col}-${i}`,120,60,`<rect x="2" y="2" width="116" height="56" fill="${color}" stroke="#f6eddb" stroke-width="3"/>`);
     show(block,x,790-i*60,B(col+2)+.5+i*.38,{sound:false,z:10});blocks.push(block);graph.push(block);
   }bars.push(blocks);
 });
 const scale=label('1 BLOCK = 1 PET',.65);show(scale,1780,440,B(2)+.5,{sound:false});graph.push(scale);
 const counts=label('5 CATS · 2 DOGS · 8 FISH',.55);show(counts,1780,650,B(4)+4,{sound:false});graph.push(counts);
 graph.forEach(p=>hide(p,B(6),.4));
 const jar=A.piece('jar-back',1,{rot:0,z:8}),jarFront=A.piece('jar-front',1,{rot:0,z:30});
 A.place(jar,1000,600,B(6)+.4,{rot:0,z:8});A.place(jarFront,1000,600,B(6)+.4,{rot:0,z:30});
 const marbles=[];
 for(let i=0;i<6;i++){
   const p=A.piece(i===0?'marble-red.webp':'marble-green.webp',.115,{rot:0,z:20});marbles.push(p);
   show(p,850+(i%3)*155,620+Math.floor(i/3)*165,B(6)+1+i*.3,{sound:false,z:20});
 }
 const ratio=label('1 RED + 5 GREEN',.7);show(ratio,1740,420,B(6)+3.5,{sound:false});
 for(let i=0;i<6;i++){
   A.carry(marbles[i],850+((i+2)%3)*155,620+Math.floor((i+2)%6/3)*165,B(7)+.5+i*.08,1.5,{arc:40,rot:0,sound:false,landSound:false,z:20});
 }
 const likely=label('GREEN: MORE LIKELY',.6);show(likely,1740,640,B(7)+3,{sound:false});
 const possible=label('RED: POSSIBLE',.65);show(possible,1740,820,B(8)+.7,{sound:false});
 const recap=label('MORE LIKELY ≠ CERTAIN',.8);show(recap,1200,1050,B(8)+2,{sound:false});finish(B(9)+4.8);
 window.MATH_CHECKS={counts:[5,2,8],barUnit:1,marbles:{red:1,green:5,total:6},greenProbability:5/6,redProbability:1/6};
 window.BAR_BLOCKS=bars;window.MARBLES=marbles;
 window.CHECKPOINTS={cats:B(3)-.3,bars:B(6)-.3,jar:B(7)-.3,mixed:B(8)-.3,complete:B(9)+3};done();
})();
