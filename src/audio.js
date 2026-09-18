const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class AudioEngine{
  constructor(){
    this.ctx=null;
    this.master=null;
    this.muted=localStorage.getItem('refraction-sfx-muted')==='1';
    this.last={};
    this.noiseBuffer=null;
  }
  ensure(){
    if(!this.ctx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return false;
      this.ctx=new AC();
      this.master=this.ctx.createGain();
      this.master.gain.value=this.muted?0:.34;
      this.master.connect(this.ctx.destination);
      const len=Math.floor(this.ctx.sampleRate*.5);this.noiseBuffer=this.ctx.createBuffer(1,len,this.ctx.sampleRate);const data=this.noiseBuffer.getChannelData(0);for(let i=0;i<len;i++)data[i]=Math.random()*2-1;
    }
    if(this.ctx.state==='suspended')this.ctx.resume();
    return true;
  }
  toggle(){
    this.ensure();
    this.muted=!this.muted;
    localStorage.setItem('refraction-sfx-muted',this.muted?'1':'0');
    if(this.master)this.master.gain.setTargetAtTime(this.muted?0:.34,this.ctx.currentTime,.025);
    if(!this.muted)this.uiConfirm();
    return !this.muted;
  }
  isEnabled(){return !this.muted}
  allow(key,interval=.04){
    const now=performance.now()/1000;
    if(now-(this.last[key]||-99)<interval)return false;
    this.last[key]=now;return true;
  }
  osc({type='sine',f0=440,f1=null,dur=.08,gain=.08,when=0,attack=.004}){
    if(!this.ensure()||this.muted)return;
    const t=this.ctx.currentTime+when,o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(Math.max(30,f0),t);
    if(f1!==null)o.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(this.master);o.start(t);o.stop(t+dur+.02);
  }
  noise({dur=.09,gain=.035,when=0,highpass=500,lowpass=9000}){
    if(!this.ensure()||this.muted)return;
    const t=this.ctx.currentTime+when,src=this.ctx.createBufferSource(),hp=this.ctx.createBiquadFilter(),lp=this.ctx.createBiquadFilter(),g=this.ctx.createGain();
    src.buffer=this.noiseBuffer;hp.type='highpass';hp.frequency.value=highpass;lp.type='lowpass';lp.frequency.value=lowpass;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    src.connect(hp);hp.connect(lp);lp.connect(g);g.connect(this.master);src.start(t,Math.random()*.35,dur);src.stop(t+dur+.01);
  }
  shoot(){
    if(!this.allow('shoot',.085))return;
    // Bright arcade "bling": short glassy transient + tiny laser fall.
    // Small pitch variation prevents automatic fire from sounding like one flat beep.
    const jitter=(Math.random()-.5)*90;
    this.osc({type:'sine',f0:1680+jitter,f1:1180+jitter*.35,dur:.072,gain:.031,attack:.0015});
    this.osc({type:'triangle',f0:2520+jitter*1.4,f1:1850,dur:.038,gain:.014,attack:.001});
    this.osc({type:'sine',f0:840+jitter*.25,f1:690,dur:.052,gain:.010,when:.006,attack:.002});
  }
  ricochet(wall='left',bounce=1){
    if(!this.allow('ricochet',.045))return;
    const base=wall==='left'?850:690;
    this.osc({type:'sine',f0:base+bounce*45,f1:base*1.35+bounce*50,dur:.075,gain:.05});
    this.osc({type:'triangle',f0:base*.55,f1:base*.82,dur:.055,gain:.02});
  }
  hit(reflected=false){
    if(!this.allow('hit',.035))return;
    this.noise({dur:.045,gain:reflected?.028:.018,highpass:900,lowpass:7200});
    this.osc({type:'sine',f0:reflected?360:250,f1:reflected?250:190,dur:.045,gain:reflected?.023:.013});
  }
  buff(kind='slow',stacks=1){
    if(!this.allow(`buff-${kind}`,.07))return;
    if(kind==='slow'){
      this.osc({type:'sine',f0:980+Math.min(8,stacks)*40,f1:1320,dur:.07,gain:.025});
    }else{
      this.noise({dur:.065,gain:.022,highpass:1500,lowpass:7200});
      this.osc({type:'sawtooth',f0:210+Math.min(8,stacks)*12,f1:150,dur:.075,gain:.012});
    }
  }
  kill(){
    if(!this.allow('kill',.055))return;
    this.noise({dur:.11,gain:.045,highpass:180,lowpass:4800});
    this.osc({type:'triangle',f0:230,f1:85,dur:.13,gain:.035});
  }
  upgradeReady(){
    if(!this.allow('upgrade-ready',.2))return;
    // A subtle lift before the three cards slam in.
    this.osc({type:'sine',f0:330,f1:520,dur:.13,gain:.022});
    this.osc({type:'sine',f0:520,f1:760,dur:.15,gain:.018,when:.055});
  }
  upgradeCard(index=0){
    if(!this.allow(`upgrade-card-${index}`,.12))return;
    const step=index*18;
    // "DUANG": short low body + metallic top + tiny impact noise.
    this.osc({type:'sine',f0:150+step,f1:78+step*.25,dur:.16,gain:.052,attack:.0015});
    this.osc({type:'triangle',f0:540+index*70,f1:350+index*45,dur:.10,gain:.030,attack:.001});
    this.osc({type:'sine',f0:1180+index*125,f1:900+index*80,dur:.085,gain:.017,when:.012,attack:.001});
    this.noise({dur:.055,gain:.018,highpass:420,lowpass:3300});
  }
  uiConfirm(){
    if(!this.allow('ui-confirm',.08))return;
    this.osc({type:'sine',f0:660,f1:980,dur:.08,gain:.035});
  }
  breakthrough(){
    if(!this.allow('breakthrough',.4))return;
    this.osc({type:'triangle',f0:260,f1:520,dur:.22,gain:.045});
    this.osc({type:'sine',f0:520,f1:980,dur:.25,gain:.036,when:.08});
    this.osc({type:'sine',f0:780,f1:1320,dur:.22,gain:.026,when:.16});
  }
  coreHit(){
    if(!this.allow('core-hit',.15))return;
    this.noise({dur:.15,gain:.055,highpass:80,lowpass:2200});
    this.osc({type:'sine',f0:150,f1:55,dur:.24,gain:.06});
  }
  gameOver(){
    if(!this.allow('gameover',.5))return;
    this.osc({type:'triangle',f0:260,f1:145,dur:.28,gain:.045});
    this.osc({type:'sine',f0:190,f1:75,dur:.42,gain:.035,when:.12});
  }
}
