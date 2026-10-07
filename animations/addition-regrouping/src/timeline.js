/* Page 15. Exact conserved quantities: 1146 + 1237 -> 13 ones -> 1 ten + 3 ones. */
(()=>{
 const {A,T,label,show,hide,word,finish,done,guide}=PAPER_FILM;
 const B=k=>T.voice['n'+k], C=[310,595,880,1165], P=['thousand','hundred','ten','one'];
 const SCALE=[.19,.19,.29,.34], first=[1,1,4,6], second=[1,2,3,7];
 const rows=[[],[]];
 const header=['THOUSANDS','HUNDREDS','TENS','ONES'].map(s=>label(s,.52));
 header.forEach((p,c)=>show(p,C[c],265,.7+c*.12,{sound:false}));
 const digitRows=[[],[]], answer=[];
 [first,second].forEach((values,r)=>{
   values.forEach((n,c)=>{
     const d=A.piece('digits/tile-'+n,.15,{rot:0});digitRows[r].push(d);show(d,1600+c*110,430+r*180,1+r*.8+c*.16);
     const ps=[];rows[r][c]=ps;
     for(let i=0;i<n;i++){
       const p=A.piece('blocks/'+P[c],SCALE[c],{rot:0});ps.push(p);
       const x=C[c]+(c===3?(i%3-1)*56:(i-(n-1)/2)*(c===2?37:105));
       const y=445+r*215+(c===3?Math.floor(i/3)*56-28:0);
       A.drop(p,x,y,2+r*1.4+c*.5+i*.09,{light:true,rot:0,gain:.18});
     }
   });
 });
 const plus=A.piece('labels/plus',.35);show(plus,1480,610,3,{sound:false});
 const line=A.piece('props/underline',.57,{rot:0});show(line,1760,713,3.8,{sound:false});
 [2,3,8,3].forEach(n=>answer.push(A.piece('digits/tile-'+n,.15,{rot:0})));
 const equations=['6 + 7 = 13','10 ONES = 1 TEN','3 ONES REMAIN','4 + 3 + 1 = 8 TENS','1 + 2 = 3 HUNDREDS','1 + 1 = 2 THOUSANDS','1,146 + 1,237 = 2,383'].map(s=>label(s,.75));
 const atEq=(i,t)=>{if(i)hide(equations[i-1],t);show(equations[i],1200,1060,t+.2,{sound:false});};
 const ones=[...rows[0][3],...rows[1][3]];
 const blockScene=new Set([...rows.flat(2),...header]);
 const writtenScene=new Set([...digitRows.flat(),...answer,plus,line]);
 // Exactly ten form two rows of five. Three stay separately below the group.
 ones.forEach((p,i)=>A.carry(p,i<10?C[3]+(i%5-2)*47:C[3]+(i-11)*56,i<10?735+Math.floor(i/5)*50:885,B(2)+.8+i*.13,.6,{arc:40,sound:false,landGain:.18,rot:0}));
 atEq(0,word('n2','thirteen'));
 const bracket=guide('ten-unit-bracket',270,122,'<rect x="4" y="4" width="262" height="114" rx="12" fill="none" stroke="#314e77" stroke-width="5" stroke-dasharray="12 7"/>');
 A.place(bracket,C[3],760,B(3)+.2,{op:0});A.to(bracket,{op:1},B(3)+.2,.35);
 atEq(1,B(3)+.3);
 const newTen=A.piece('blocks/ten',SCALE[2],{rot:0});
 blockScene.add(newTen);blockScene.add(bracket);
 ones.slice(0,10).forEach((p,i)=>{
   A.carry(p,C[3],760,B(3)+1.7+i*.035,1.0,{arc:35,sound:false,landSound:false,rot:0});
   hide(p,B(3)+3.4,.55);
 });
 A.place(newTen,C[3],760,B(3)+3.4,{op:0,rot:0});A.to(newTen,{op:1},B(3)+3.4,.55);
 A.sfx('snap',B(3)+3.7,.6);hide(bracket,B(3)+4.2);
 const carry=A.piece('digits/tile-1',.095,{rot:0});
 writtenScene.add(carry);
 atEq(2,B(4));show(answer[3],1930,820,word('n4','write')+.15);
 A.carry(newTen,C[2]+130,770,B(4)+2.4,1.2,{arc:80,rot:0,gain:.25});
 show(carry,1820,290,word('n4','one')+.1);
 const tenNote=label('1 TEN',.47);show(tenNote,1820,210,B(4)+4.8,{sound:false});
 const pointer=A.piece('props/pointer',.17,{rot:-30});show(pointer,1750,285,B(4)+5,{sound:false,rot:-30});
 writtenScene.add(pointer);writtenScene.add(tenNote);
 atEq(3,B(5));hide(pointer,B(5)+.4);hide(tenNote,B(5)+.4);
 const tens=[...rows[0][2],...rows[1][2],newTen];
 tens.forEach((p,i)=>A.carry(p,C[2]+(i-3.5)*34,655,B(5)+.6+i*.11,.85,{arc:45,sound:false,landGain:.12,rot:0}));
 show(answer[2],1820,820,word('n5','eight')+.2);
 atEq(4,B(6));const hundreds=[...rows[0][1],...rows[1][1]];
 hundreds.forEach((p,i)=>A.carry(p,C[1]+(i-1)*91,655,B(6)+.5+i*.15,.75,{arc:40,sound:false,landGain:.2,rot:0}));
 show(answer[1],1710,820,word('n6','three')+.15);
 atEq(5,B(7));const thousands=[...rows[0][0],...rows[1][0]];
 thousands.forEach((p,i)=>A.carry(p,C[0]+(i-.5)*116,655,B(7)+.5+i*.15,.8,{arc:40,sound:false,landGain:.2,rot:0}));
 show(answer[0],1600,820,word('n7','two')+.1);
 ones.slice(10).forEach((p,i)=>A.carry(p,C[3]+(i-1)*56,655,B(8)+.2+i*.1,.65,{arc:30,sound:false,landGain:.15,rot:0}));
 atEq(6,B(8)+.2);
 hide(equations[6],B(9));const recap=label('10 ONES = 1 TEN',.9);show(recap,1200,1060,B(9)+.3,{sound:false});finish(B(9)+3.7);
 window.MATH_CHECKS={a:1146,b:1237,sum:2383,initialOnes:13,exchangedOnes:10,remainingOnes:3,finalTens:8,finalHundreds:3,finalThousands:2};
 window.CHECKPOINTS={thirteen:B(3)-.3,exchange:B(3)+4.2,carry:B(5)-.2,complete:B(9)-.2};
 // Portrait gets its own composition: physical columns above the written calculation.
 // Choreography and exact quantities remain shared; only the framing changes.
 A.afterRender=()=>{
   if(!document.body.classList.contains('portrait'))return;
   document.getElementById('camera').style.transform='none';
   for(const p of A.pieces){
     const s=p.st;let x,y,k;
     if(blockScene.has(p)){x=(s.x-310)*.82+180;y=(s.y-265)*.82+285;k=.82;}
     else if(writtenScene.has(p)){x=(s.x-1480)*1.4+215;y=(s.y-210)*.75+800;k=1.35;}
     else if(p.src.startsWith('decor/star-')){x=(s.x-1200)*.8+540;y=1495;k=.8;}
     else {x=540;y=s.y<200?105:1400;k=.9;}
     p.el.style.transform=`translate(${x-p.w/2}px,${y+s.hy*k-p.h/2}px) rotate(${s.rot}deg) scale(${s.s*k})`;
   }
 };
 done();
})();
