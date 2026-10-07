(()=>{
 const {A,T,label,show,hide,finish,done,guide}=PAPER_FILM;
 const B=n=>T.voice['n'+n], counters=[];
 for(let i=0;i<8;i++){
   const p=A.piece('marble-green.webp',.105,{rot:0});counters.push(p);
   if(i<6)show(p,730+(i%3)*230,440+Math.floor(i/3)*220,.7+i*.18,{sound:false});
 }
 const pairPositions=[[740,470],[875,470],[1080,470],[1215,470],[740,700],[875,700],[1080,700],[1215,700]];
 counters.slice(0,6).forEach((p,i)=>A.slide(p,...pairPositions[i],B(2)+.5+i*.15,.8,{rot:0,sound:false,ease:'power2.inOut'}));
 const even6=label('6: EVEN',.85),odd7=label('7: ODD',.85),even8=label('8: EVEN',.85);
 show(even6,1720,470,B(2)+2,{sound:false});
 // The next counter waits at the side, so the child can tap it and watch it join.
 const wait=[420,585];
 show(counters[6],...wait,B(2)+3,{sound:false});
 A.carry(counters[6],...pairPositions[6],B(3)+.4,.7,{arc:70,rot:0});hide(even6,B(3));show(odd7,1720,470,B(3)+1.5,{sound:false});
 const leftover=label('ONE LEFTOVER',.65);show(leftover,1720,690,B(3)+2,{sound:false});
 A.wiggle(counters[6],B(3)+2.4,{amp:6});
 show(counters[7],...wait,B(3)+4,{sound:false});
 A.carry(counters[7],...pairPositions[7],B(4)+.4,.7,{arc:70,rot:0});hide(odd7,B(4));hide(leftover,B(4));show(even8,1720,470,B(4)+1.5,{sound:false});
 const none=label('NO LEFTOVERS',.65);show(none,1720,690,B(4)+2,{sound:false});
 [...counters,even8,none].forEach(p=>hide(p,B(5),.4));
 const nums=[15,25,35,45,55,65].map(n=>{const p=label(String(n),1.15);p.layoutRole='row';return p;});
 const xs=[250,550,850,1150,1450,1750],rowY=560;
 nums.slice(0,3).forEach((p,i)=>show(p,xs[i],rowY,B(5)+1+i*.55,{sound:false}));
 const rule=label('+10',1);rule.layoutRole='row';show(rule,860,840,B(6)+.8,{sound:false});
 const ruleTag=label('FIND THE RULE',.75);ruleTag.layoutRole='row';show(ruleTag,1300,840,B(6)+1.5,{sound:false});
 // A curved hop with +10 over each gap, drawn when the step is named.
 const hop=i=>{
   const g=guide('pattern-hop-'+i,260,150,'<path d="M22 132 C52 34 208 34 238 132" fill="none" stroke="#b94636" stroke-width="9" stroke-linecap="round"/><path d="M238 132 l-32 -12 M238 132 l4 -34" fill="none" stroke="#b94636" stroke-width="9" stroke-linecap="round"/><text x="130" y="50" font-family="Fredoka,Segoe UI,sans-serif" font-weight="600" font-size="48" fill="#7b2f22" text-anchor="middle">+10</text>');g.layoutRole='row';
   return g;
 };
 const hops=[0,1,2,3,4].map(hop);
 hops.slice(0,2).forEach((g,i)=>show(g,(xs[i]+xs[i+1])/2,rowY-150,B(6)+.6+i*.5,{sound:false,rot:0}));
 nums.slice(3,5).forEach((p,i)=>{show(hops[2+i],(xs[2+i]+xs[3+i])/2,rowY-150,B(7)+.6+i*3,{sound:false,rot:0});show(p,xs[i+3],rowY,B(7)+1+i*3,{sound:false});});
 show(hops[4],(xs[4]+xs[5])/2,rowY-150,B(8)+.6,{sound:false,rot:0});show(nums[5],xs[5],rowY,B(8)+1,{sound:false});
 finish(B(9)+4.6);
 window.MATH_CHECKS={sixPairs:3,sixLeftovers:0,sevenPairs:3,sevenLeftovers:1,eightPairs:4,sequence:[15,25,35,45,55,65],step:10};
 window.COUNTERS=counters;window.PATTERN_NUMBERS=nums;
 window.CHECKPOINTS={pairs:B(3)-.3,odd:B(4)-.3,even:B(5)-.3,rule:B(7)-.3,complete:B(9)+3};done();
})();
