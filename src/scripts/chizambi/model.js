// Settings names/defaults and projection scale math adapted from youtube-ambilight (MIT).
export const defaults = { enabled:true, brightness:100, blur2:30, spread:17, webGL:true, framerateLimit:30, resolution:25,
  edge:12, spreadFadeStart:15, spreadFadeCurve:35, frameFading:0, frameBlending:false,
  vibrance:100, contrast:100, saturation:100, fixedPosition:true, showResolutions:false,
  directionTopEnabled:true, directionRightEnabled:true, directionBottomEnabled:true, directionLeftEnabled:true };
export const directions = ['directionTopEnabled','directionRightEnabled','directionBottomEnabled','directionLeftEnabled'];
defaults.fadeInDuration=0;
defaults.theme='dark';
export const ranges = { brightness:[0,200], blur2:[0,100], spread:[1,100], fadeInDuration:[0,5] };
export function normalizeSettings(saved) {
  const result = {...defaults};
  for (const name of ['enabled','webGL',...directions,...Object.keys(ranges)]) {
    const value = saved[`setting-${name}`];
    if (typeof defaults[name] === 'boolean') { if (typeof value === 'boolean') result[name]=value; }
    else if (typeof value === 'number' && Number.isFinite(value)) result[name]=Math.min(ranges[name][1],Math.max(ranges[name][0],value));
  }
  if (['light','system','dark'].includes(saved['setting-theme'])) result.theme=saved['setting-theme'];
  return result;
}
export function geometry(w,h,s) {
  const factor = Math.min(.5,Math.max(64/w,64/h),Math.min(1024/w,1024/h));
  const width=Math.max(1,Math.ceil(w*factor)),height=Math.max(1,Math.ceil(h*factor));
  const levels=Math.max(4,Math.round(s.spread/s.edge)+3);
  const scales=Array.from({length:levels},(_,i)=>({x:Math.max(1/width,1+s.edge/100*(height/width)*(i-2)),y:Math.max(1/height,1+s.edge/100*(i-2))}));
  return {width,height,scales,last:scales.at(-1)};
}
export function shouldRender(s) {
  return /^\/live\/[^/]+\/?$/.test(s.path) && s.enabled && !s.hidden && !s.fullscreen && !s.pip && s.connected && s.visible;
}

export function isUnobstructedPlayer(video,main,headerBottom,viewportHeight) {
  if(!video||!main)return false;
  const tolerance=2;
  return video.top>=Math.max(0,main.top,headerBottom)-tolerance &&
    video.left>=Math.max(0,main.left)-tolerance &&
    video.right<=main.right+tolerance &&
    video.bottom<=Math.min(main.bottom,viewportHeight)+tolerance;
}

// A <video> box can include contain/scale-down letterboxing. Return image pixels only.
export function videoImageRect(box,sourceWidth,sourceHeight,fit='contain',position='50% 50%') {
  if(!sourceWidth||!sourceHeight||!['contain','scale-down'].includes(fit))return box;
  const tokens=position.trim().split(/\s+/);
  if(tokens.length!==2||tokens.some(p=>!/^\d+(\.\d+)?%$/.test(p)))return box;
  const scale=Math.min(box.width/sourceWidth,box.height/sourceHeight,fit==='scale-down'?1:Infinity);
  const width=sourceWidth*scale,height=sourceHeight*scale;
  const left=box.left+(box.width-width)*parseFloat(tokens[0])/100;
  const top=box.top+(box.height-height)*parseFloat(tokens[1])/100;
  return {left,top,width,height,right:left+width,bottom:top+height};
}
