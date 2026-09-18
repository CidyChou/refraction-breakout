import { VIEW, COLORS, BALANCE } from './config.js';
import { FIGHTER_TYPES, fighterEvolutionMeta, fighterStats, supportRange, supportFieldType, supportFieldColor, supportFieldStrength } from './fighters.js';
import { TAU, rand } from './utils.js';

export class Renderer{
  constructor(canvas,state){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.state=state;this.dpr=Math.min(2,devicePixelRatio||1);this.resize();addEventListener('resize',()=>this.resize())}
  resize(){const r=this.canvas.getBoundingClientRect();this.canvas.width=Math.floor(r.width*this.dpr);this.canvas.height=Math.floor(r.height*this.dpr);this.ctx.setTransform(this.canvas.width/VIEW.width,0,0,this.canvas.height/VIEW.height,0,0)}
  selected(){return this.state.fighters.battle.find(f=>f.uid===this.state.fighters.selectedUid)||null}
  draw(){const s=this.state,g=s.game,ctx=this.ctx;ctx.save();ctx.translate(g.shake?rand(-g.shake,g.shake):0,g.shake?rand(-g.shake,g.shake):0);this.background();this.portal();this.aim();for(const b of s.bullets)this.bullet(b);for(const e of s.enemies)this.enemy(e);this.fx();this.fighters();this.placementGhost();ctx.restore();if(g.flash>0){ctx.save();ctx.globalAlpha=g.flash*.26;ctx.fillStyle='#ff5877';ctx.fillRect(0,0,VIEW.width,VIEW.height);ctx.restore()}}

  background(){
    const {ctx,state:s}=this;const g=ctx.createLinearGradient(0,0,0,VIEW.height);g.addColorStop(0,'#0a0f1c');g.addColorStop(.55,'#0a0d16');g.addColorStop(1,'#05070b');ctx.fillStyle=g;ctx.fillRect(0,0,VIEW.width,VIEW.height);
    ctx.save();for(const st of s.stars){ctx.globalAlpha=st.a;ctx.fillStyle='#d9e8ff';ctx.fillRect(st.x,st.y,st.s,st.s*2)}ctx.restore();
    ctx.save();ctx.globalAlpha=.055;ctx.strokeStyle='#dbe7ff';ctx.lineWidth=1;for(let x=0;x<VIEW.width;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,VIEW.height);ctx.stroke()}for(let y=0;y<VIEW.height;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(VIEW.width,y);ctx.stroke()}ctx.restore();

    const lg=ctx.createLinearGradient(0,0,26,0);lg.addColorStop(0,'rgba(202,239,248,.44)');lg.addColorStop(1,'rgba(202,239,248,0)');ctx.fillStyle=lg;ctx.fillRect(0,0,26,VIEW.height);
    const rg=ctx.createLinearGradient(VIEW.width,0,VIEW.width-26,0);rg.addColorStop(0,'rgba(202,239,248,.44)');rg.addColorStop(1,'rgba(202,239,248,0)');ctx.fillStyle=rg;ctx.fillRect(VIEW.width-26,0,26,VIEW.height);
    const tg=ctx.createLinearGradient(0,0,0,26);tg.addColorStop(0,'rgba(202,239,248,.40)');tg.addColorStop(1,'rgba(202,239,248,0)');ctx.fillStyle=tg;ctx.fillRect(0,0,VIEW.width,26);
    ctx.save();ctx.globalAlpha=.78;ctx.lineWidth=1.6;ctx.strokeStyle='#d9f7ff';ctx.beginPath();ctx.moveTo(4,64);ctx.lineTo(4,VIEW.height-100);ctx.stroke();ctx.beginPath();ctx.moveTo(VIEW.width-4,64);ctx.lineTo(VIEW.width-4,VIEW.height-100);ctx.stroke();ctx.beginPath();ctx.moveTo(4,4);ctx.lineTo(VIEW.width-4,4);ctx.stroke();ctx.restore();
    ctx.save();ctx.setLineDash([6,8]);ctx.globalAlpha=.18;ctx.strokeStyle=COLORS.danger;ctx.beginPath();ctx.moveTo(18,VIEW.height-103);ctx.lineTo(VIEW.width-18,VIEW.height-103);ctx.stroke();ctx.restore();
  }


  portal(){
    const {ctx,state:s}=this,p=BALANCE.portal||{x:58,y:108,width:304,height:48};
    const pulse=.5+.5*Math.sin(s.game.time*3.2),cx=p.x+p.width/2,cy=p.y;
    ctx.save();
    const glow=ctx.createRadialGradient(cx,cy,8,cx,cy,p.width*.55);
    glow.addColorStop(0,`rgba(142,109,255,${.14+pulse*.08})`);
    glow.addColorStop(.45,`rgba(84,224,255,${.08+pulse*.05})`);
    glow.addColorStop(1,'rgba(84,224,255,0)');
    ctx.fillStyle=glow;ctx.fillRect(p.x-32,p.y-p.height*.9,p.width+64,p.height*1.8);
    ctx.globalAlpha=.82;ctx.strokeStyle='#80eaff';ctx.lineWidth=1.5;ctx.setLineDash([7,6]);
    ctx.beginPath();ctx.roundRect(p.x,p.y-p.height/2,p.width,p.height,15);ctx.stroke();
    ctx.setLineDash([]);ctx.globalAlpha=.35;ctx.strokeStyle='#bb8cff';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(p.x+18,p.y);ctx.bezierCurveTo(p.x+p.width*.28,p.y-14,p.x+p.width*.72,p.y+14,p.x+p.width-18,p.y);ctx.stroke();
    ctx.globalAlpha=.75;ctx.fillStyle='#bdefff';ctx.font='800 7px sans-serif';ctx.textAlign='center';ctx.letterSpacing='1px';ctx.fillText('ENEMY GATE',cx,p.y-p.height/2-7);
    for(let i=0;i<5;i++){
      const x=p.x+26+i*(p.width-52)/4,yy=p.y+Math.sin(s.game.time*2.6+i)*5;
      ctx.globalAlpha=.28+.22*Math.sin(s.game.time*3+i)*.5+.12;ctx.fillStyle=i%2?'#a789ff':'#76e9ff';ctx.beginPath();ctx.arc(x,yy,2.2,0,TAU);ctx.fill();
    }
    ctx.restore();
  }

  aim(){
    const {ctx,state:s}=this,f=this.selected();if(!f||f.type==='support'||!['playing','intermission'].includes(s.game.state))return;
    const a=f.aimAngle;let x=f.x+Math.cos(a)*19,y=f.y+Math.sin(a)*19,vx=Math.cos(a),vy=Math.sin(a);
    ctx.save();ctx.globalAlpha=.34;ctx.strokeStyle=FIGHTER_TYPES[f.type].accent;ctx.lineWidth=1.25;ctx.setLineDash([6,7]);ctx.beginPath();ctx.moveTo(x,y);
    for(let k=0;k<8;k++){
      const tx=vx<0?(0-x)/vx:(vx>0?(VIEW.width-x)/vx:Infinity);
      const tyTop=vy<0?(0-y)/vy:Infinity;
      const tyBottom=vy>0?(BALANCE.projectileBottom-y)/vy:Infinity;
      const step=Math.min(tx,tyTop,tyBottom,220);
      x+=vx*step;y+=vy*step;ctx.lineTo(x,y);
      if(step===tx){vx*=-1;continue}
      if(step===tyTop){vy*=-1;continue}
      break;
    }
    ctx.stroke();ctx.restore();
  }

  fighters(){
    const {ctx,state:s}=this,selected=s.fighters.selectedUid;
    for(const sup of s.fighters.battle){
      if(sup.type!=='support')continue;
      const color=supportFieldColor(sup),range=supportRange(sup),power=supportFieldStrength(sup),label=supportFieldType(sup).toUpperCase();
      ctx.save();ctx.globalAlpha=.13;ctx.fillStyle=color;ctx.beginPath();ctx.arc(sup.x,sup.y,range,0,TAU);ctx.fill();ctx.globalAlpha=.34;ctx.strokeStyle=color;ctx.lineWidth=1.3;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(sup.x,sup.y,range,0,TAU);ctx.stroke();ctx.restore();
      ctx.save();ctx.textAlign='center';ctx.font='700 8px sans-serif';ctx.fillStyle=color;ctx.globalAlpha=.88;ctx.fillText(`${label} ×${power}`,sup.x,sup.y-range-8);ctx.restore();
    }

    for(const f of s.fighters.battle){
      const c=FIGHTER_TYPES[f.type]?.accent||'#8df6ff',isSel=f.uid===selected,a=f.aimAngle;
      ctx.save();ctx.translate(f.x,f.y);if(isSel){ctx.globalAlpha=.28;ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,25+Math.sin(s.game.time*4)*1.5,0,TAU);ctx.stroke()}
      if(f.type==='support'){
        const pulse=1+Math.sin(s.game.time*4+f.x*.01)*.05;ctx.scale(pulse,pulse);ctx.shadowBlur=18;ctx.shadowColor=c;ctx.strokeStyle=c;ctx.fillStyle='rgba(15,19,28,.92)';ctx.lineWidth=2;ctx.rotate(Math.PI/4);ctx.strokeRect(-10,-10,20,20);ctx.fillRect(-7,-7,14,14);ctx.rotate(-Math.PI/4);ctx.globalAlpha=.38;ctx.beginPath();ctx.arc(0,0,19,0,TAU);ctx.stroke();
      }else{
        ctx.rotate(a+Math.PI/2);ctx.shadowBlur=18;ctx.shadowColor=c;ctx.fillStyle='#111927';ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(12,14);ctx.lineTo(0,8);ctx.lineTo(-12,14);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-4,3.8,0,TAU);ctx.fill();
      }
      ctx.restore();
      ctx.save();ctx.textAlign='center';ctx.font='800 8px sans-serif';ctx.fillStyle=c;ctx.globalAlpha=.92;const evo=fighterEvolutionMeta(f),stars='★'.repeat(f.star||1);ctx.fillText(evo?evo.tag.split(' ')[0]:FIGHTER_TYPES[f.type].short,f.x,f.y+29);ctx.fillStyle='#ffe787';ctx.font='800 8px sans-serif';ctx.fillText(`${stars} · L${f.level}`,f.x,f.y+39);ctx.restore();
      if(f.type!=='support'){ctx.save();ctx.globalAlpha=isSel?.9:.32;ctx.strokeStyle=c;ctx.lineWidth=isSel?2:1;ctx.beginPath();ctx.moveTo(f.x+Math.cos(a)*16,f.y+Math.sin(a)*16);ctx.lineTo(f.x+Math.cos(a)*29,f.y+Math.sin(a)*29);ctx.stroke();ctx.restore()}
    }
    const f=this.selected();if(f&&f.type!=='support'&&['playing','intermission'].includes(s.game.state)){const d=BALANCE.aimHandleDistance,hx=f.x+Math.cos(f.aimAngle)*d,hy=f.y+Math.sin(f.aimAngle)*d,c=FIGHTER_TYPES[f.type].accent;ctx.save();ctx.shadowBlur=14;ctx.shadowColor=c;ctx.fillStyle='#09111b';ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(hx,hy,7,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(hx,hy,2.2,0,TAU);ctx.fill();ctx.restore()}
  }

  placementGhost(){const {ctx,state:s}=this,g=s.game;if(g.state!=='placing'||!g.pendingFighter)return;const f=g.pendingFighter,c=FIGHTER_TYPES[f.type].accent,x=g.placementX,y=g.placementY,valid=!s.fighters.battle.some(o=>Math.hypot(o.x-x,o.y-y)<34);ctx.save();ctx.globalAlpha=.72;ctx.strokeStyle=valid?c:'#ff5f72';ctx.fillStyle=valid?'rgba(120,235,255,.08)':'rgba(255,80,100,.08)';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(x,y,23,0,TAU);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.font='900 17px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=valid?c:'#ff5f72';ctx.fillText(FIGHTER_TYPES[f.type].icon,x,y);ctx.restore()}

  bullet(b){
    const {ctx}=this,sp=Math.max(1,Math.hypot(b.vx,b.vy)),nx=b.vx/sp,ny=b.vy/sp;
    const base=b.kind==='laser'?'#d6a7ff':b.kind==='aoe'?'#ffad73':b.kind==='pierce'?'#8fffc0':'#8cf7ff';
    const c=(b.prismBuff||0)>0?COLORS.prism:(b.slowBuff&&b.burnBuff)?'#d7a7ff':b.slowBuff?COLORS.slow:b.burnBuff?COLORS.burn:base;
    const len=(b.kind==='laser'?52:b.kind==='pierce'?24:18)*(b.trailScale||1);
    const g=ctx.createLinearGradient(b.x-nx*len,b.y-ny*len,b.x,b.y);g.addColorStop(0,'rgba(104,244,255,0)');g.addColorStop(1,c);
    ctx.save();ctx.strokeStyle=g;ctx.lineWidth=b.kind==='laser'?6:b.r*1.25;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x-nx*len,b.y-ny*len);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.shadowBlur=b.kind==='laser'?20:14;ctx.shadowColor=c;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,b.kind==='laser'?2.8:b.r*.68,0,TAU);ctx.fill();
    if(b.kind==='aoe'){ctx.shadowBlur=0;ctx.globalAlpha=.45;ctx.strokeStyle=c;ctx.beginPath();ctx.arc(b.x,b.y,b.r+4,0,TAU);ctx.stroke()}
    if((b.slowBuff||0)||(b.burnBuff||0)||(b.prismBuff||0)){ctx.shadowBlur=0;ctx.fillStyle=c;ctx.font='700 8px sans-serif';ctx.textAlign='center';const parts=[];if(b.slowBuff)parts.push(`S${b.slowBuff}`);if(b.burnBuff)parts.push(`B${b.burnBuff}`);if(b.prismBuff)parts.push(`P${b.prismBuff}`);ctx.fillText(parts.join('·'),b.x,b.y-b.r-7)}
    ctx.restore();
  }

  enemyColor(t){return t==='shield'?'#ffcc67':t==='spinner'?'#60e6ff':t==='splitter'?'#ff76b7':t==='pulse'?'#ff9d69':t==='bumper'?'#ff75c8':t==='magnet'?'#9a8cff':t==='warden'?'#8f7cff':t==='drifter'?'#68ffc4':t==='tank'?'#ff6e63':t==='regen'?'#77ff9b':t==='carrier'?'#ffe064':t==='titan'?'#f2a1ff':t==='mini'?'#edf4ff':'#ff6276'}
  polygonPath(ctx,sides,r,rot=-Math.PI/2){ctx.beginPath();for(let i=0;i<sides;i++){const a=rot+i*TAU/sides,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath()}
  enemy(e){
    const {ctx}=this,c=this.enemyColor(e.type),phase=e.phase||0;
    const bob=Math.sin(e.t*3.5+phase)*1.8,breath=Math.sin(e.t*3.1+phase),sx=1+breath*.035,sy=1-breath*.025,rot=e.t*(e.spin||.45);
    ctx.save();ctx.translate(e.x,e.y+bob);
    if(e.spawnT>0){const k=1-Math.max(0,e.spawnT)/(e.spawnMax||.42);ctx.globalAlpha=.24+.76*k;const sc=.55+.45*k;ctx.scale(sc,sc);ctx.rotate((1-k)*.22);ctx.shadowBlur=24;ctx.shadowColor='#9e8cff'}

    // Functional outer effects: magnet radius, shields and moving rings are readable before collision.
    if(e.type==='magnet'){
      const pulse=1+Math.sin(e.t*4+phase)*.06;
      ctx.save();ctx.globalAlpha=.12;ctx.fillStyle=c;ctx.beginPath();ctx.arc(0,0,(e.gravity||105)*pulse,0,TAU);ctx.fill();ctx.globalAlpha=.35;ctx.strokeStyle=c;ctx.setLineDash([3,7]);ctx.lineWidth=1.2;ctx.rotate(-rot*.3);ctx.beginPath();ctx.arc(0,0,e.r+10,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(0,0,e.r+17,0,TAU);ctx.stroke();ctx.restore();
    }
    if(['spinner','warden','pulse','shield','tank','regen','carrier','titan','bumper'].includes(e.type)){
      ctx.save();ctx.rotate(rot*(e.type==='shield'?.35:e.type==='tank'?.16:e.type==='titan'?.22:1));ctx.globalAlpha=e.type==='pulse'?.45:e.type==='bumper'?.5:e.type==='titan'?.5:.28;ctx.strokeStyle=c;ctx.lineWidth=e.type==='titan'?2:1.2;ctx.setLineDash(e.type==='warden'?[5,5]:e.type==='spinner'?[2,6]:e.type==='tank'?[7,4]:e.type==='regen'?[3,5]:e.type==='bumper'?[2,4]:e.type==='titan'?[9,5]:[]);ctx.beginPath();ctx.arc(0,0,e.r+(e.type==='pulse'?8+Math.sin(e.t*4+phase)*3:e.type==='titan'?12+Math.sin(e.t*2.3)*3:8),0,TAU);ctx.stroke();ctx.restore();
    }

    ctx.scale(sx,sy);ctx.shadowBlur=18;ctx.shadowColor=c;ctx.fillStyle='rgba(18,22,33,.94)';ctx.strokeStyle=c;ctx.lineWidth=e.type==='titan'?2.4:2;

    // Restore strong geometry language: every role has a recognisable silhouette.
    if(e.type==='grunt'||e.type==='drifter'){
      ctx.save();ctx.rotate(e.type==='drifter'?rot*.55:0);this.polygonPath(ctx,3,e.r,Math.PI/2);ctx.fill();ctx.stroke();ctx.restore();
    }else if(e.type==='shield'||e.type==='tank'){
      ctx.save();ctx.rotate(e.type==='tank'?rot*.08:0);ctx.beginPath();ctx.roundRect(-e.r,-e.r,e.r*2,e.r*2,e.type==='tank'?5:2);ctx.fill();ctx.stroke();ctx.restore();
      if(e.type==='shield'){ctx.save();ctx.strokeStyle='#fff2b0';ctx.globalAlpha=.72;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-e.r*.7,-e.r*.52);ctx.lineTo(e.r*.7,-e.r*.52);ctx.stroke();ctx.restore()}
    }else if(e.type==='spinner'||e.type==='carrier'){
      ctx.save();ctx.rotate(rot);this.polygonPath(ctx,4,e.r,Math.PI/4);ctx.fill();ctx.stroke();ctx.restore();
    }else if(e.type==='splitter'){
      ctx.save();ctx.rotate(rot*.28);this.polygonPath(ctx,6,e.r,0);ctx.fill();ctx.stroke();ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(-e.r*.42,0);ctx.lineTo(e.r*.42,0);ctx.stroke();ctx.restore();
    }else if(e.type==='bumper'){
      ctx.save();ctx.rotate(rot*.7);this.polygonPath(ctx,4,e.r,0);ctx.fill();ctx.stroke();ctx.globalAlpha=.75;ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(-e.r*.48,0);ctx.lineTo(e.r*.48,0);ctx.moveTo(0,-e.r*.48);ctx.lineTo(0,e.r*.48);ctx.stroke();ctx.restore();
    }else if(e.type==='warden'){
      ctx.save();ctx.rotate(rot*.2);this.polygonPath(ctx,6,e.r,Math.PI/6);ctx.fill();ctx.stroke();ctx.globalAlpha=.42;ctx.beginPath();ctx.arc(0,0,e.r*.48,0,TAU);ctx.stroke();ctx.restore();
    }else if(e.type==='regen'){
      ctx.save();ctx.rotate(rot*.16);this.polygonPath(ctx,6,e.r,Math.PI/6);ctx.fill();ctx.stroke();ctx.fillStyle=c;ctx.globalAlpha=.75;ctx.fillRect(-2,-e.r*.48,4,e.r*.96);ctx.fillRect(-e.r*.48,-2,e.r*.96,4);ctx.restore();
    }else if(e.type==='magnet'){
      ctx.save();ctx.rotate(rot*.34);this.polygonPath(ctx,8,e.r,Math.PI/8);ctx.fill();ctx.stroke();ctx.globalAlpha=.78;ctx.strokeStyle='#e5ddff';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(0,0,e.r*.48,.15*Math.PI,.85*Math.PI);ctx.stroke();ctx.beginPath();ctx.arc(0,0,e.r*.48,1.15*Math.PI,1.85*Math.PI);ctx.stroke();ctx.restore();
    }else if(e.type==='titan'){
      ctx.save();ctx.rotate(rot*.12);this.polygonPath(ctx,8,e.r,Math.PI/8);ctx.fill();ctx.stroke();ctx.restore();
    }else{
      // pulse / mini retain circular language so not every unit is polygonal.
      ctx.beginPath();ctx.arc(0,0,e.r,0,TAU);ctx.fill();ctx.stroke();
    }

    ctx.fillStyle='rgba(255,255,255,.95)';
    if(e.type!=='magnet'&&e.type!=='bumper'){ctx.beginPath();ctx.arc(-e.r*.25,-e.r*.08,Math.max(1.8,e.r*.105),0,TAU);ctx.arc(e.r*.25,-e.r*.08,Math.max(1.8,e.r*.105),0,TAU);ctx.fill()}
    ctx.restore();

    if(e.spawnT<=0){ctx.save();ctx.fillStyle='rgba(11,18,28,.78)';ctx.fillRect(e.x-e.r,e.y+e.r+8,e.r*2,5);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(e.x-e.r,e.y+e.r+8,e.r*2,5);ctx.fillStyle=c;ctx.fillRect(e.x-e.r,e.y+e.r+8,e.r*2*Math.max(0,e.hp/e.maxHp),5);ctx.restore()}
  }

  fx(){
    const {ctx,state:s}=this;
    for(const p of s.particles){const a=Math.max(0,p.life/(p.max||p.life||1));ctx.save();ctx.globalAlpha=a;ctx.fillStyle=p.kind==='burnfx'?'#ffb46b':'rgba(234,243,255,.88)';ctx.beginPath();ctx.arc(p.x,p.y,p.size||2,0,TAU);ctx.fill();ctx.restore()}
    for(const r of s.rings){ctx.save();ctx.globalAlpha=Math.max(0,1-r.t/r.life);ctx.strokeStyle=r.color||'rgba(255,255,255,.75)';ctx.lineWidth=1.6;if(r.kind==='arc'&&r.x2!=null){ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(r.x2,r.y2);ctx.stroke()}else{const rr=r.r+(r.max-r.r)*(r.t/r.life);ctx.beginPath();ctx.arc(r.x,r.y,rr,0,TAU);ctx.stroke()}ctx.restore()}
    for(const f of s.floating){ctx.save();ctx.globalAlpha=Math.max(0,f.life/.8);ctx.fillStyle=f.color||'#fff';ctx.font='700 12px sans-serif';ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y);ctx.restore()}
  }
}
