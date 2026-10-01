export const presetKeys=['brightness','blur2','spread'];
export const presets=[{brightness:100,blur2:30,spread:17},{brightness:110,blur2:10,spread:100}];
export function validPreset(value){
  return value && presetKeys.every(key=>Number.isFinite(value[key]) && value[key]>=(key==='spread'?1:0) && value[key]<=(key==='brightness'?200:100));
}
export function presetValues(settings){return Object.fromEntries(presetKeys.map(key=>[key,settings[key]]));}
export function canToggleLighting(event,path){
  if(!/^\/live\/[^/]+\/?$/.test(path)||event.defaultPrevented||event.repeat||event.isComposing||event.keyCode===229||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)return false;
  if(event.code!=='KeyG')return false;
  return !event.composedPath().some(node=>node?.isContentEditable||node?.matches?.('input,textarea,select,[role="textbox"],[contenteditable]:not([contenteditable="false"])'));
}
