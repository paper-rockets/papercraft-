(()=>{
 const {A,T,label,show,hide,word,finish,done,guide}=PAPER_FILM;
 const B=k=>T.voice['n'+k], center=[980,620], q=[], halves=[], eighths=[];
 const whole=A.piece('pizza-whole',1,{rot:0});show(whole,...center,.5,{sound:false});
 const caption=[ 'ONE WHOLE','4 EQUAL PARTS','1/4','2/4','1/2','4/8','1/2 = 2/4 = 4/8','SAME WHOLE · SAME AMOUNT'].map(s=>label(s,.82));
 // Notes sit below the 1/2, 2/4 and 4/8 tags; the 1/2 and 4/8 notes are skipped because the tags already say them.
 const note=(i,t)=>{caption.forEach((p,j)=>{if(j!==i)hide(p,t,.2);});if(i!==4&&i!==5)show(caption[i],1200,1095,t+.2,{sound:false});};
 note(0,1);
 // Each slice is a mask of the SAME 620px pizza, with a shared centre and radius.
 for(let i=0;i<4;i++){
   const p=A.piece('pizza-4-'+i,1,{rot:0});q.push(p);
   A.place(p,...center,B(2),{op:0,rot:0});A.to(p,{op:1},B(2),.25);
   const a=(-45+i*90)*Math.PI/180;
   A.slide(p,center[0]+Math.cos(a)*30,center[1]+Math.sin(a)*30,B(2)+1.8,.8,{rot:0,sound:false});
 }
 hide(whole,B(2));note(1,B(2)+.3);
 const outline=guide('whole-circle-guide',650,650,'<circle cx="325" cy="325" r="309" fill="none" stroke="#8c765b" stroke-width="3" stroke-dasharray="10 10"/>');
 A.place(outline,980,620,B(3),{z:5});
 q.forEach((p,i)=>A.to(p,{op:i===0?1:.2},B(3)+1.2,.6));note(2,word('n3','quarter'));
 A.to(q[1],{op:1},B(4)+1,.5);
 q.slice(0,2).forEach(p=>A.slide(p,...center,B(4)+2,.8,{rot:0,sound:false}));
 note(3,word('n4','half'));
 // The second pizza has exactly the same diameter. One half is taken, one is left faint.
 for(let i=0;i<2;i++){
   const p=A.piece('pizza-2-'+i,1,{rot:0});halves.push(p);
   show(p,1690,620,B(5)+.8+i*.2,{sound:false,rot:0});
 }
 A.to(halves[1],{op:.2},B(5)+3,.7);
 const halfTag=label('1/2',.8);halfTag.layoutRole='amount';show(halfTag,1690,970,B(5)+3.4,{sound:false});
 const quarterTag=label('2/4',.8);quarterTag.layoutRole='amount';show(quarterTag,980,970,B(5)+3.4,{sound:false});
 hide(outline,B(5));q.slice(2).forEach(p=>hide(p,B(5)));
 // Cover the half with the two quarters: exact overlays prove equal area.
 q.slice(0,2).forEach(p=>A.carry(p,1690,620,B(6)+2,1.4,{arc:65,rot:0,sound:false,landGain:.2}));
 A.to(halves[0],{op:.4},B(6)+3.5,.4);note(4,B(6));
 q.slice(0,2).forEach(p=>A.carry(p,...center,B(6)+5,1,{arc:50,rot:0,sound:false,landGain:.2}));
 A.to(halves[0],{op:1},B(6)+6,.4);hide(caption[3],B(5),.2);
 for(let i=0;i<4;i++){
   const p=A.piece('pizza-8-'+i,1,{rot:0});eighths.push(p);A.place(p,...center,B(7)+2,{op:0,rot:0});
   A.to(p,{op:1},B(7)+2,.45);
   const a=(-67.5+i*45)*Math.PI/180;
   A.slide(p,center[0]+Math.cos(a)*42,center[1]+Math.sin(a)*42,B(7)+3.3,.9,{rot:0,sound:false});
 }
 q.slice(0,2).forEach(p=>hide(p,B(7)+2,.45));hide(quarterTag,B(7)+2);note(5,B(7)+.5);
 eighths.forEach(p=>A.slide(p,...center,B(8)+.5,.8,{rot:0,sound:false}));
 const eighthTag=label('4/8',.8);eighthTag.layoutRole='amount';show(eighthTag,980,970,B(8)+.2,{sound:false});note(6,B(8)+1);
 [whole,outline,...q,...halves,...eighths].forEach(p=>p.layoutRole='pizza');
 note(7,B(9));finish(B(9)+4.8);
 window.MATH_CHECKS={wholeDiameter:620,comparedWholeDiameter:620,quartersSelected:2,quartersTotal:4,eighthsSelected:4,eighthsTotal:8,equivalent:true};
 window.CHECKPOINTS={quarters:B(3)-.2,half:B(6)-.2,overlay:B(6)+4,eighths:B(8)+3,complete:B(9)+3};done();
})();
