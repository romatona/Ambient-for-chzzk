import ProjectorWebGL from '../libs/projector-webgl';
import Projector2d from '../libs/projector-2d';
import { normalizeSettings, geometry, shouldRender, isUnobstructedPlayer, videoImageRect } from './model';
import { storage, subscribe } from './storage';
import { createPageTheme } from './page-theme';
import { canToggleLighting } from './presets';
import { createToolbar } from './toolbar';

export async function start() {
  if (document.getElementById('chizambi-status')) return;
  const settings=normalizeSettings(await storage.get());
  const ui=document.createElement('div');ui.id='chizambi-status';ui.hidden=true;ui.dataset.build='responsive-1';
  const pageTheme=createPageTheme();
  document.body.append(ui);
  const warning=message=>{ui.dataset.warning=message || '';};
  let engine=null, generation=0, initializing=false, force2d=false, lastTime=0, frameCount=0, stopped=false;
  let fadeStart=null;
  const unsubscribe=subscribe(changes=>{
    const saved=Object.fromEntries(Object.entries(settings).map(([key,value])=>['setting-'+key,value]));
    for(const [key,change] of Object.entries(changes)) saved[key]=change.newValue;
    const next=normalizeSettings(saved), rendererChanged=next.webGL!==settings.webGL;
    Object.assign(settings,next);
    toolbar.sync(settings.enabled,/^\/live\/[^/]+\/?$/.test(location.pathname));
    fadeStart=null;
    if(rendererChanged){force2d=false;reset();}else if(engine)engine.sizeKey='';
  });
  let shortcutQueue=Promise.resolve();
  const toggleLighting=()=>{
    shortcutQueue=shortcutQueue.then(async()=>{
      const saved=normalizeSettings(await storage.get());
      await storage.set('setting-enabled',!saved.enabled);
    }).catch(error=>console.warn('[chizAmbi] Shortcut save failed',error));
  };
  const toolbar=createToolbar(toggleLighting);
  const onShortcut=event=>{
    if(!canToggleLighting(event,location.pathname))return;
    event.preventDefault();toggleLighting();
  };
  document.addEventListener('keydown',onShortcut);
  function dispose(target) {
    if(!target)return;
    const renderer=target.projector;
    renderer.cancelCompilation=true;
    renderer.dispose?.();
    cancelAnimationFrame(renderer.scheduledRedrawAfterRestoreId);
    for(const p of renderer.projectors || []) {
      for(const [event,handler] of [['webglcontextlost',renderer.onCtxLost],['webglcontextrestored',renderer.onCtxRestored],['contextlost',renderer.onBlurCtxLost],['contextrestored',renderer.onBlurCtxRestored],['contextlost',renderer.onProjectorCtxLost],['contextrestored',renderer.onProjectorCtxRestored]]) {
        if(handler)p.elem.removeEventListener?.(event,handler);
      }
      if(p.elem.width)p.elem.width=1;if(p.elem.height)p.elem.height=1;
    }
    renderer.ctx?.getExtension?.('WEBGL_lose_context')?.loseContext();
    target.root.remove();
  }
  function reset(){generation++;dispose(engine);engine=null;fadeStart=null;pageTheme.clear();}
  const pickVideo=()=>Array.from(document.querySelectorAll('.chzzk_player video, .pzp video')).filter(v=>v.isConnected&&v.readyState>=2&&v.videoWidth>0&&v.getBoundingClientRect().width>100).sort((a,b)=>b.clientWidth*b.clientHeight-a.clientWidth*a.clientHeight)[0];
  async function mount(video) {
    initializing=true;const token=generation;
    const root=document.createElement('div');root.id='chizambi-light';root.setAttribute('aria-hidden','true');
    const projectors=document.createElement('div');projectors.className='chizambi-projectors';root.append(projectors);document.body.append(root);
    const host={videoElem:video,videoContainerElem:video.parentElement,atTop:true,isPageHidden:false,barDetection:{clear(){}},optionalFrame:async()=>{if(engine)engine.sizeKey='';},setDrawWarning:()=>warning('조명 렌더링 오류가 발생했어요.')};
    const restored=()=>{host.sizesChanged=true;};
    settings.setWarning=message=>{if(message)warning('그래픽 가속 상태를 확인 중이에요.');};
    settings.set=(key,value)=>{settings[key]=value;};
    let projector;
    try {
      if(settings.webGL&&!force2d) {
        try {projector=await new ProjectorWebGL(host,projectors,restored,settings);if(!projector.ctx||projector.ctxIsInvalid)throw Error('WebGL unavailable');}
        catch(error){console.warn('[chizAmbi] Canvas fallback',error);if(projector)dispose({projector,root});projectors.replaceChildren();if(!root.isConnected)document.body.append(root);projector=null;force2d=true;}
      }
      projector ||= new Projector2d(host,projectors,restored,settings);
      projector.handleRestored=restored;
      const buffer=document.createElement('canvas');
      const next={root,projectors,projector,video,host,buffer,ctx:buffer.getContext('2d'),sizeKey:''};
      if(token!==generation||!video.isConnected||stopped){dispose(next);return;}
      engine=next;ui.dataset.renderer=projector.type;
    } catch(error){root.remove();warning('조명을 시작하지 못했어요. WebGL을 끄고 다시 시도해 주세요.');console.error('[chizAmbi]',error);}
    finally {initializing=false;}
  }
  function layout(e,r) {
    const g=geometry(e.video.videoWidth,e.video.videoHeight,settings);
    Object.assign(e.projectors.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});
    // The full viewport is available behind page content. Only the video is excluded.
    e.root.style.clipPath=`polygon(evenodd,0px 0px,${innerWidth}px 0px,${innerWidth}px ${innerHeight}px,0px ${innerHeight}px,0px 0px,${r.left}px ${r.top}px,${r.left}px ${r.bottom}px,${r.right}px ${r.bottom}px,${r.right}px ${r.top}px,${r.left}px ${r.top}px)`;
    e.projectors.style.filter=`brightness(${settings.brightness}%)${e.projector.type==='Projector2d'?` blur(${r.height*.0025*settings.blur2}px)`:''}`;
    const key=JSON.stringify([r.width,r.height,e.video.videoWidth,e.video.videoHeight,settings.spread,settings.blur2,settings.brightness]);
    if(key!==e.sizeKey||e.host.sizesChanged){
      e.sizeKey=key;e.host.sizesChanged=false;
      e.buffer.width=g.width*2;e.buffer.height=g.height*2;
      e.projector.recreate?.(g.scales.length);e.projector.resize(g.width,g.height);
      e.projector.rescale(g.scales,g.last,{w:g.width,h:g.height},[0,0],settings);
    }
    e.projector.cropped=false;
  }
  function tick(now) {
    if(stopped)return;
    requestAnimationFrame(tick);
    if(now-lastTime<1000/settings.framerateLimit)return;lastTime=now;
    const active=/^\/live\/[^/]+\/?$/.test(location.pathname);
    if(engine&&(!engine.video.isConnected||!active))reset();
    const video=engine?.video;
    const box=video?.getBoundingClientRect();
    const videoStyle=video?getComputedStyle(video):null;
    const r=box?videoImageRect(box,video.videoWidth,video.videoHeight,videoStyle.objectFit,videoStyle.objectPosition):null;
    if(engine)engine.host.getVideoRect=()=>r;
    const unobstructed=isUnobstructedPlayer(r,video?.closest('main')?.getBoundingClientRect(),document.querySelector('#header')?.getBoundingClientRect().bottom??0,innerHeight);
    const render=unobstructed&&shouldRender({path:location.pathname,enabled:settings.enabled,hidden:document.hidden,fullscreen:!!document.fullscreenElement,pip:!!document.pictureInPictureElement,connected:!!video?.isConnected,visible:!!r&&r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight});
    if(!engine){ui.dataset.state='waiting';return;}
    engine.root.hidden=!render;
    if(!render){pageTheme.clear();ui.dataset.state='suspended';fadeStart=null;return;}
    pageTheme.apply(video);
    try {
      if(fadeStart===null)fadeStart=now;
      engine.root.style.opacity=String(.72*(settings.fadeInDuration===0?1:Math.min(1,(now-fadeStart)/(settings.fadeInDuration*1000))));
      layout(engine,r);
      if(video.readyState<2)return;
      engine.ctx.drawImage(video,0,0,engine.buffer.width,engine.buffer.height);
      engine.projector.draw(engine.buffer);
      ui.dataset.frames=String(++frameCount);ui.dataset.state='running';

    }catch(error){
      if(engine.projector.type==='ProjectorWebGL'){force2d=true;reset();warning('영상 호환성을 위해 Canvas 2D로 전환했어요.');}
      else {engine.root.hidden=true;settings.enabled=false;pageTheme.clear();warning('이 영상에서는 조명을 그릴 수 없어요.');}
      console.warn('[chizAmbi] draw',error.name,error.message);
    }
  }
  const timer=setInterval(()=>{
    toolbar.sync(settings.enabled,/^\/live\/[^/]+\/?$/.test(location.pathname));
    if(stopped||document.hidden||!settings.enabled||!/^\/live\/[^/]+\/?$/.test(location.pathname))return;
    const next=pickVideo();
    if(engine&&next&&next!==engine.video)reset();
    if(!engine&&!initializing&&next)void mount(next);
  },500);
  requestAnimationFrame(tick);
  window.addEventListener('pagehide',event=>{reset();toolbar.clear();if(!event.persisted){stopped=true;clearInterval(timer);unsubscribe();document.removeEventListener('keydown',onShortcut);ui.remove();}},{once:false});
}
