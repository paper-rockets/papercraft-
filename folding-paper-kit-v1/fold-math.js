export const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function rotate(p,a,b,deg){
  const v=sub(p,a),d=sub(b,a),n=Math.hypot(...d),u=d.map(x=>x/n),r=deg*Math.PI/180,c=Math.cos(r),s=Math.sin(r),uv=cross(u,v);
  return add(a,v.map((x,i)=>x*c+uv[i]*s+u[i]*dot(u,v)*(1-c)));
}
export function foldPoint(solid,index,p,t){const h=solid.hinges.find(h=>h.child===index);if(!h)return p;return foldPoint(solid,h.parent,rotate(p,[...h.edge[0],0],[...h.edge[1],0],h.targetAngleDeg*t),t);}
