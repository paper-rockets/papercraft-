(()=>{
 const {A,T,label,show,hide,word,finish,done,guide}=PAPER_FILM;
 const B=k=>T.voice['n'+k],cx=930,cy=590;
 const face=A.piece('clock-face',1,{rot:0,z:8}),rim=A.piece('clock-rim',1,{rot:0,z:9});
 show(face,cx,cy,.5,{sound:false,z:8});show(rim,cx,cy,.5,{sound:false,z:9});
 let marks='';
 for(let i=0;i<60;i++){
  const a=(i*6-90)*Math.PI/180,r=i%5?291:282;
  marks+=`<line x1="${330+Math.cos(a)*r}" y1="${330+Math.sin(a)*r}" x2="${330+Math.cos(a)*304}" y2="${330+Math.sin(a)*304}" stroke="#46382b" stroke-width="${i%5?2:5}"/>`;
 }
 for(let i=1;i<=12;i++){
  const a=(i*30-90)*Math.PI/180;marks+=`<text x="${330+Math.cos(a)*253}" y="${342+Math.sin(a)*253}" font-family="Segoe UI,sans-serif" font-weight="600" font-size="42" fill="#302820" text-anchor="middle">${i}</text>`;
 }
 const dial=guide('clock-computed-dial',660,660,marks);A.place(dial,cx,cy,.8,{z:10,rot:0});
 const hour=A.piece('clock-hour-hand',1,{rot:300,z:20}),minute=A.piece('clock-minute-hand',1,{rot:0,z:22}),pin=A.piece('clock-center-pin',1,{rot:0,z:25});
 A.place(hour,cx,cy,1.2,{rot:300,z:20});A.place(minute,cx,cy,1.2,{rot:0,z:22});A.place(pin,cx,cy,1.2,{rot:0,z:25});
 const hourTag=label('HOUR HAND',.6),minuteTag=label('MINUTE HAND',.6);
 show(hourTag,1700,390,B(1)+1,{sound:false});show(minuteTag,1700,590,B(1)+2,{sound:false});
 const times=['10:00','10:05','10:10','10:15','10:20','11:00'].map(s=>label(s,1.05));
 let prior=-1;
 function display(i,t){if(prior>=0)hide(times[prior],t);show(times[i],1700,810,t+.2,{sound:false});prior=i;}
 display(0,B(2)+.5);
 const state={minutes:0};
 // One parameter drives both hands: minute angle=6m; hour angle=300+0.5m.
 [[3,5],[4,10],[5,15],[6,20]].forEach(([beat,m],i)=>{
   A.PAPER.to(state,{minutes:m,duration:2.5,ease:'power2.inOut'},B(beat)+.5);
   display(i+1,B(beat)+3);A.sfx('tick',B(beat)+3,.35);
 });
 A.afterRender=()=>{
   const m=state.minutes;
   const transform=(p,degrees)=>{p.el.style.transform=`translate(${cx-p.w/2}px,${cy-p.h/2}px) rotate(${degrees}deg)`;};
   transform(hour,300+.5*m);transform(minute,6*m);
   window.CLOCK_STATE={minutes:m,hourDegrees:300+.5*m,minuteDegrees:6*m};
 };
 // The loupe waits on the table; on "Count the small minute marks" it slides over the marks from 12 to 1 and enlarges them.
 const loupe=A.piece('props/magnifier-glass',.85,{rot:0,z:60}),rest=[1290,930];
 show(loupe,...rest,B(3)+3.2,{rot:-8,z:60});
 // where to put the loupe so its glass centre sits on the dial at angle deg; turned by spin so the handle points away from the hands
 const spin=-125,lensAt=(deg,r=272)=>{const a=deg*Math.PI/180,k=.85,s=spin*Math.PI/180,ox=(368.48-323.5)*k,oy=(257.98-378.5)*k;
   return [cx+Math.cos(a)*r-(ox*Math.cos(s)-oy*Math.sin(s)),cy+Math.sin(a)*r-(ox*Math.sin(s)+oy*Math.cos(s))];};
 A.carry(loupe,...lensAt(-75),word('n4','count')-.7,.9,{arc:60,rot:spin,z:60});
 A.makeLensView(loupe,dial,1.6,'#efe5d2');
 A.carry(loupe,...rest,B(5)+.2,.8,{arc:50,rot:-8,z:60});hide(loupe,B(7));
 hide(hourTag,B(7));hide(minuteTag,B(7));
 const recap=label('60 MINUTES = 1 HOUR',.85);
 A.PAPER.to(state,{minutes:60,duration:5,ease:'power2.inOut'},B(8)+1);
 display(5,B(8)+6.1);show(recap,1200,1050,B(8)+6.4,{sound:false});
 const end=label('HOURS + MINUTES',.9);hide(recap,B(9));show(end,1200,1050,B(9)+.5,{sound:false});finish(B(9)+4.6);
 window.MATH_CHECKS={startHours:10,timeMinutes:20,minuteDegrees:120,hourDegrees:310,minutesPerHour:60};
 window.CHECKPOINTS={ten:B(3)-.1,twenty:B(7)+2,eleven:B(9)-.2,complete:B(9)+3};done();
})();
