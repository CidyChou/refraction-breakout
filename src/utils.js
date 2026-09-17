export const TAU = Math.PI * 2;
export const rand = (a,b)=>a+Math.random()*(b-a);
export const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp = (a,b,t)=>a+(b-a)*t;
export function compactByFlag(arr, key='dead'){ for(let i=arr.length-1;i>=0;i--) if(arr[i][key]) arr.splice(i,1); }
export function compactByLife(arr){ for(let i=arr.length-1;i>=0;i--) if(arr[i].life<=0) arr.splice(i,1); }
