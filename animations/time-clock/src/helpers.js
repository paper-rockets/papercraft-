// Small choreography helpers built on the existing paper engine, not a new lesson engine.
window.PAPER_FILM=(()=>{
 const A=window.PV, T=window.TIMING;
 A.camSet({x:1200,y:675,s:.8});
 const label=(text,k=.8)=>A.piece(window.LABELS[text],k,{rot:0});
 const word=(key,token,nth=0)=>{
   let n=0;for(const [w,off] of window.VOICE[key].words)
     if(w.toLowerCase().replace(/[.,!?’]/g,'')===token.toLowerCase()&&n++===nth)return T.voice[key]+off;
   throw new Error('Missing narration word '+key+': '+token);
 };
 const show=(p,x,y,t,o={})=>A.slap(p,x,y,t,{rot:0,...o});
 const hide=(p,t,d=.4)=>A.to(p,{op:0,lift:0},t,d,'power2.out');
 const heading=label(window.FILM.title,1);
 show(heading,1200,105,.08,{sound:false});
 const finish=t=>{
   for(let i=0;i<3;i++){
     const star=A.piece(i%2?'decor/star-red':'decor/star-yellow',.22);
     A.drop(star,1070+i*130,1190,t+i*.16,{sound:false,rot:(i-1)*9});
   }
   A.sfx('chime',t+.5,.4);
 };
 const done=()=>{
   for(const b of window.FILM.beats)A.voice(b.key,T.voice[b.key]);
   A.layout=()=>{
     if(!document.body.classList.contains('portrait'))return;
     for(const p of A.pieces){
       const st=p.st;
       let x,y,k=.72;
       if(p===heading){x=540;y=80;k=Math.min(.78,970/p.w);}
       else if(p.layoutRole==='amount'){x=540;y=st.x>=1450?1255:765;k=.72;}
       else if(st.y>=965){x=540;y=1395+(st.y-995)*.6;k=Math.min(.8,970/p.w);}
       else if(st.x>=1450){x=540+(st.x-1690)*.72;y=960+(st.y-590)*.72;}
       else {x=540+(st.x-1000)*.72;y=490+(st.y-590)*.72;}
       const rotation=window.CLOCK_STATE&&p.src==='clock-hour-hand'?window.CLOCK_STATE.hourDegrees:
         window.CLOCK_STATE&&p.src==='clock-minute-hand'?window.CLOCK_STATE.minuteDegrees:st.rot;
       p.el.style.transform=`translate(${x-p.w/2}px,${y+st.hy*k-p.h/2}px) rotate(${rotation}deg) scale(${st.s*k})`;
       p.last.tf='';
     }
   };
   A.finish(T.duration,T.beats);
 };
 const guide=(id,w,h,markup)=>{
   window.MANIFEST.sizes[id]=[w,h];
   window.ASSET_URLS[id]='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${markup}</svg>`);
   return A.piece(id,1,{rot:0});
 };
 return {A,T,label,word,show,hide,finish,done,heading,guide};
})();
