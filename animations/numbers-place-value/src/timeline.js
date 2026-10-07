(()=>{
 const {A,T,show,hide,finish,done,guide}=PAPER_FILM;
 const B=n=>T.voice['n'+n],columns=[650,870,1090,1310];
 const headers=['thousands','hundreds','tens','ones'].map((name,i)=>{const p=A.piece('labels/word-'+name,.42,{rot:0});show(p,columns[i],290,.7+i*.12,{sound:false});return p;});
 const chart=guide('place-chart',890,600,'<path d="M5 5 H885 V595 H5 Z M225 5 V595 M445 5 V595 M665 5 V595" fill="none" stroke="#8c765b" stroke-width="4"/>');A.place(chart,980,640,.5,{rot:0,z:5});
 const digit=A.piece('digits/big-2',.5,{rot:0});show(digit,1310,460,B(1)+.8,{sound:false});
 const groups=['one','ten','hundred','thousand'].map(kind=>[0,1].map(()=>A.piece('blocks/'+kind,kind==='one'?.65:kind==='ten'?.36:.22,{rot:0})));
 const vals=['2','20','200','2000'].map(v=>A.piece('labels/val-'+v,1,{rot:0}));
 for(let step=0;step<4;step++){
   const t=B(step+2),x=columns[3-step];
   if(step)A.slide(digit,x,460,t+.3,1,{rot:0,sound:false,ease:'power2.inOut'});
   if(step){groups[step-1].forEach(p=>hide(p,t));hide(vals[step-1],t);}
   groups[step].forEach((p,i)=>show(p,step===3?x:x+(i-.5)*(step===2?115:70),step===3?620+i*165:710,t+1.3+i*.25,{sound:false}));
   show(vals[step],1730,620,t+1.5,{sound:false});
 }
 const place=A.piece('labels/place',.75,{rot:0}),value=A.piece('labels/value',.75,{rot:0});
 show(place,1730,380,B(6)+.5,{sound:false});show(value,1730,830,B(6)+1.2,{sound:false});
 [...groups[3],vals[3],digit,place,value].forEach(p=>hide(p,B(7)));
 const count=[1,2,3,4],kinds=['thousand','hundred','ten','one'],blocks=[],digits=[];
 kinds.forEach((kind,col)=>{
   const p=A.piece('digits/big-'+(col+1),.45,{rot:0});digits.push(p);show(p,columns[col],460,B(7)+.8+col*.35,{sound:false});
   for(let i=0;i<count[col];i++){
     const q=A.piece('blocks/'+kind,kind==='one'?.5:kind==='ten'?.32:.19,{rot:0});blocks.push(q);
     const x=columns[col]+(col===0?0:col===1?(i-.5)*100:col===2?(i-1)*58:(i%2-.5)*80);
     const y=col===3?655+Math.floor(i/2)*100:700;
     show(q,x,y,B(8)+.4+col*.7+i*.18,{sound:false});
   }
 });
 const number=A.piece('labels/num-1234',.85,{rot:0});show(number,1730,420,B(7)+2.5,{sound:false});
 const twoHundred=A.piece('labels/val-200',1,{rot:0});show(twoHundred,1730,740,B(9)+4,{sound:false});
 const marker=guide('hundreds-marker',200,170,'<rect x="5" y="5" width="190" height="160" rx="5" fill="none" stroke="#b94636" stroke-width="7"/>');A.place(marker,870,460,B(9)+3,{rot:0,z:30});
 // The loupe waits on the table; the child taps it and it enlarges the 2 in the hundreds place.
 const loupe=A.piece('props/magnifier-glass',.6,{rot:0,z:60}),rest=[1480,940],k=.6;
 show(loupe,...rest,B(8)+2.6,{rot:-8,z:60});
 A.carry(loupe,columns[1]-(368.48-323.5)*k,460-(257.98-378.5)*k,B(9)+.3,.9,{arc:60,rot:0,z:60});
 A.makeLensView(loupe,digits[1],1.45,'#ead8bc');
 A.carry(loupe,...rest,B(9)+2.9,.8,{arc:50,rot:-8,z:60});
 finish(B(10)+4.7);
 window.MATH_CHECKS={digit:2,values:[2,20,200,2000],number:1234,counts:[1,2,3,4],hundredsDigitValue:200};
 window.PLACE_GROUPS=groups;window.FINAL_BLOCKS=blocks;
 window.CHECKPOINTS={ones:B(3)-.3,tens:B(4)-.3,hundreds:B(5)-.3,thousands:B(6)-.3,number:B(9)-.3,complete:B(10)+3};done();
})();
