import { VIEW, COLORS } from './config.js';
import { TAU, clamp, lerp, rand } from './utils.js';

export class Renderer{
  constructor(canvas,state){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.state=state;this.dpr=Math.min(2,devicePixelRatio||1);this.resize();addEventListener('resize',()=>this.resize())}
  resize(){const r=this.canvas.getBoundingClientRect();this.canvas.width=Math.floor(r.width*this.dpr);this.canvas.height=Math.floor(r.height*this.dpr);this.ctx.setTransform(this.canvas.width/VIEW.width,0,0,this.canvas.height/VIEW.height,0,0)}
  draw(){const s=this.state,g=s.game,ctx=this.ctx;ctx.save();ctx.translate(g.shake?rand(-g.shake,g.shake):0,g.shake?rand(-g.shake,g.shake):0);this.background();this.aim();for(const b of s.bullets)this.bullet(b);for(const e of s.enemies)this.enemy(e);this.fx();this.player();ctx.restore();if(g.flash>0){ctx.save();ctx.globalAlpha=g.flash*.26;ctx.fillStyle='#ff5877';ctx.fillRect(0,0,VIEW.width,VIEW.height);ctx.restore()}}
  background(){
    const {ctx,state:s}=this,p=s.player;
    const g=ctx.createLinearGradient(0,0,0,VIEW.height);g.addColorStop(0,'#0a0f1c');g.addColorStop(.55,'#0a0d16');g.addColorStop(1,'#05070b');ctx.fillStyle=g;ctx.fillRect(0,0,VIEW.width,VIEW.height);
    ctx.save();for(const st of s.stars){ctx.globalAlpha=st.a;ctx.fillStyle='#d9e8ff';ctx.fillRect(st.x,st.y,st.s,st.s*2)}ctx.restore();
    ctx.save();ctx.globalAlpha=.055;ctx.strokeStyle='#dbe7ff';ctx.lineWidth=1;for(let x=0;x<VIEW.width;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,VIEW.height);ctx.stroke()}for(let y=0;y<VIEW.height;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(VIEW.width,y);ctx.stroke()}ctx.restore();
    const leftActive=p.slowWall>0,rightActive=p.burnWall>0;
    const lg=ctx.createLinearGradient(0,0,32,0);lg.addColorStop(0,leftActive?'rgba(82,218,255,.68)':'rgba(202,239,248,.34)');lg.addColorStop(1,'rgba(82,218,255,0)');ctx.fillStyle=lg;ctx.fillRect(0,0,32,VIEW.height);
    const rg=ctx.createLinearGradient(VIEW.width,0,VIEW.width-32,0);rg.addColorStop(0,rightActive?'rgba(255,120,70,.72)':'rgba(202,239,248,.34)');rg.addColorStop(1,'rgba(202,239,248,0)');ctx.fillStyle=rg;ctx.fillRect(VIEW.width-32,0,32,VIEW.height);
    ctx.save();ctx.globalAlpha=.7;ctx.lineWidth=1.5;ctx.strokeStyle=leftActive?COLORS.slow:'#d9f7ff';ctx.beginPath();ctx.moveTo(4,64);ctx.lineTo(4,VIEW.height-126);ctx.stroke();ctx.strokeStyle=rightActive?COLORS.burn:'#d9f7ff';ctx.beginPath();ctx.moveTo(VIEW.width-4,64);ctx.lineTo(VIEW.width-4,VIEW.height-126);ctx.stroke();ctx.restore();
    ctx.save();ctx.setLineDash([6,8]);ctx.globalAlpha=.18;ctx.strokeStyle=COLORS.danger;ctx.beginPath();ctx.moveTo(18,VIEW.height-112);ctx.lineTo(VIEW.width-18,VIEW.height-112);ctx.stroke();ctx.restore();
  }
  aim(){
    const {ctx,state:s}=this,a=s.game.aimAngle,p=s.player;
    let x=p.x+Math.cos(a)*24,y=p.y+Math.sin(a)*24,vx=Math.cos(a),vy=Math.sin(a);
    ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle='#d8faff';ctx.lineWidth=1.1;ctx.setLineDash([6,7]);ctx.beginPath();ctx.moveTo(x,y);
    let bounces=0;for(let k=0;k<6;k++){let tx=vx<0?(0-x)/vx:(vx>0?(VIEW.width-x)/vx:Infinity),ty=vy<0?(0-y)/vy:(vy>0?(VIEW.height-y)/vy:Infinity),step=Math.min(tx,ty,220);x+=vx*step;y+=vy*step;ctx.lineTo(x,y);if(step===tx&&bounces<Math.min(p.ricochets,3)){vx*=-1;bounces++;continue}break}ctx.stroke();
    ctx.setLineDash([]);ctx.globalAlpha=.7;ctx.fillStyle='#c9fbff';ctx.beginPath();ctx.arc(p.x+Math.cos(a)*24,p.y+Math.sin(a)*24,2.4,0,TAU);ctx.fill();ctx.restore();
  }
  player(){const {ctx,state:s}=this,x=s.player.x,y=s.player.y;ctx.save();ctx.translate(x,y);ctx.rotate(s.game.aimAngle+Math.PI/2);ctx.shadowBlur=22;ctx.shadowColor='rgba(91,236,255,.48)';ctx.fillStyle='#111927';ctx.strokeStyle='#8df6ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-23);ctx.lineTo(15,17);ctx.lineTo(0,10);ctx.lineTo(-15,17);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-4,4.5,0,TAU);ctx.fill();ctx.restore()}
  bullet(b){const {ctx}=this,sp=Math.hypot(b.vx,b.vy),nx=b.vx/sp,ny=b.vy/sp,len=18;const c=b.slowBuff&&b.burnBuff?'#d7a7ff':b.slowBuff?COLORS.slow:b.burnBuff?COLORS.burn:'#8cf7ff';const g=ctx.createLinearGradient(b.x-nx*len,b.y-ny*len,b.x,b.y);g.addColorStop(0,'rgba(104,244,255,0)');g.addColorStop(1,c);ctx.save();ctx.strokeStyle=g;ctx.lineWidth=b.r*1.25;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x-nx*len,b.y-ny*len);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.shadowBlur=14;ctx.shadowColor=c;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,b.r*.68,0,TAU);ctx.fill();if(b.slowBuff||b.burnBuff){ctx.shadowBlur=0;ctx.fillStyle=c;ctx.font='700 8px sans-serif';ctx.textAlign='center';ctx.fillText(`${b.slowBuff?`S${b.slowBuff}`:''}${b.slowBuff&&b.burnBuff?'·':''}${b.burnBuff?`B${b.burnBuff}`:''}`,b.x,b.y-b.r-7)}ctx.restore()}
  enemyColor(t){return t==='shield'?'#ffcc67':t==='spinner'?'#60e6ff':t==='splitter'?'#ff76b7':t==='pulse'?'#ff9d69':t==='warden'?'#9f86ff':t==='drifter'?'#68ffc4':t==='mini'?'#edf4ff':'#ff6276'}
  enemy(e){
    const {ctx}=this,c=this.enemyColor(e.type),phase=e.phase||0;
    const bob=Math.sin(e.t*3.5+phase)*1.8,breath=Math.sin(e.t*3.1+phase),sx=1+breath*.035,sy=1-breath*.025,rot=e.t*(e.spin||.45);
    ctx.save();ctx.translate(e.x,e.y+bob);

    // 某些敌人的外圈会持续旋转，提供运动感和类型识别。
    if(e.type==='spinner'||e.type==='warden'||e.type==='pulse'||e.type==='shield'){
      ctx.save();ctx.rotate(rot*(e.type==='shield'?.35:1));ctx.globalAlpha=e.type==='pulse'?.42:.28;ctx.strokeStyle=c;ctx.lineWidth=1.2;ctx.setLineDash(e.type==='warden'?[5,5]:e.type==='spinner'?[2,6]:[]);ctx.beginPath();ctx.arc(0,0,e.r+(e.type==='pulse'?8+Math.sin(e.t*4+phase)*3:8),0,TAU);ctx.stroke();
      if(e.type==='spinner'){for(let i=0;i<4;i++){const a=i*TAU/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*(e.r+5),Math.sin(a)*(e.r+5));ctx.lineTo(Math.cos(a)*(e.r+12),Math.sin(a)*(e.r+12));ctx.stroke()}}
      ctx.restore();
    }

    ctx.save();ctx.scale(sx,sy);ctx.rotate(rot*(e.type==='grunt'?.35:e.type==='mini'?.7:e.type==='splitter'?.45:e.type==='spinner'?1:e.type==='drifter'?.28:.16));
    ctx.shadowBlur=11;ctx.shadowColor=c;ctx.fillStyle='rgba(10,12,18,.90)';ctx.strokeStyle=c;ctx.lineWidth=2;
    if(e.type==='grunt'||e.type==='mini'){
      ctx.rotate(Math.PI/4);ctx.fillRect(-e.r*.7,-e.r*.7,e.r*1.4,e.r*1.4);ctx.strokeRect(-e.r*.7,-e.r*.7,e.r*1.4,e.r*1.4);
      ctx.globalAlpha=.45;ctx.fillStyle=c;ctx.fillRect(-2,-2,4,4);
    }else if(e.type==='shield'){
      ctx.beginPath();for(let i=0;i<6;i++){const a=-Math.PI/2+i*TAU/6,px=Math.cos(a)*e.r,py=Math.sin(a)*e.r;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill();ctx.stroke();ctx.globalAlpha=.9;ctx.strokeStyle='#fff0a6';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-2,e.r+5,Math.PI*1.08,Math.PI*1.92);ctx.stroke();
    }else if(e.type==='spinner'){
      ctx.beginPath();for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3,rr=i%2?e.r*.9:e.r*1.05,px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill();ctx.stroke();ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(0,0,e.r*.35,0,TAU);ctx.stroke();
    }else if(e.type==='splitter'){
      ctx.beginPath();ctx.arc(0,0,e.r,0,TAU);ctx.fill();ctx.stroke();ctx.rotate(e.t*.9);ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.moveTo(0,-9);ctx.lineTo(0,9);ctx.stroke();
    }else if(e.type==='pulse'){
      ctx.beginPath();for(let i=0;i<8;i++){const a=i*TAU/8,rr=e.r*(i%2?0.82:1),px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill();ctx.stroke();ctx.globalAlpha=.65;ctx.beginPath();ctx.arc(0,0,e.r*(.28+.08*Math.sin(e.t*5+phase)),0,TAU);ctx.fillStyle=c;ctx.fill();
    }else if(e.type==='warden'){
      ctx.rotate(Math.PI/4);ctx.rect(-e.r*.72,-e.r*.72,e.r*1.44,e.r*1.44);ctx.fill();ctx.stroke();ctx.rotate(-Math.PI/4);ctx.globalAlpha=.55;ctx.beginPath();ctx.arc(0,0,e.r*.34,0,TAU);ctx.stroke();
    }else{
      ctx.beginPath();ctx.moveTo(0,-e.r);ctx.lineTo(e.r,0);ctx.lineTo(0,e.r);ctx.lineTo(-e.r,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-e.r-7,0);ctx.lineTo(e.r+7,0);ctx.stroke();
    }
    ctx.restore();

    ctx.shadowBlur=0;
    if(e.protected>0&&e.type!=='warden'){ctx.globalAlpha=.28;ctx.strokeStyle='#b09bff';ctx.beginPath();ctx.arc(0,0,e.r+6,0,TAU);ctx.stroke()}
    if(e.slowT>0){ctx.globalAlpha=.92;ctx.fillStyle=COLORS.slow;ctx.font='700 9px sans-serif';ctx.textAlign='center';ctx.fillText(`S${e.slowStacks}`,0,-e.r-13)}
    if(e.burnT>0){ctx.globalAlpha=.92;ctx.fillStyle=COLORS.burn;ctx.textAlign='center';ctx.fillText(`B${e.burnStacks}`,0,e.r+18)}
    if(e.maxHp>1){ctx.globalAlpha=.45;ctx.fillStyle='#2a3242';ctx.fillRect(-e.r,-e.r-8,e.r*2,2);ctx.fillStyle=c;ctx.fillRect(-e.r,-e.r-8,e.r*2*clamp(e.hp/e.maxHp,0,1),2)}
    ctx.restore();
  }
  fx(){const {ctx,state:s}=this;for(const r of s.rings){const t=r.t/r.life;ctx.save();if(r.kind==='arc'){ctx.globalAlpha=1-t;ctx.strokeStyle='#c7b6ff';ctx.lineWidth=2.3;ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.quadraticCurveTo((r.x+r.x2)/2+rand(-8,8),(r.y+r.y2)/2+rand(-8,8),r.x2,r.y2);ctx.stroke()}else{ctx.globalAlpha=(1-t)*.65;ctx.strokeStyle=r.color||'#a8f7ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,lerp(r.r,r.max,t),0,TAU);ctx.stroke()}ctx.restore()}for(const p of s.particles){ctx.save();ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.kind==='burnfx'?COLORS.burn:p.kind==='slowfx'?COLORS.slow:this.enemyColor(p.kind);ctx.fillRect(p.x,p.y,p.size,p.size);ctx.restore()}for(const f of s.floating){ctx.save();ctx.globalAlpha=clamp(f.life/.7,0,1);ctx.fillStyle=f.color||'#fff';ctx.font='700 10px sans-serif';ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y);ctx.restore()}}
}
