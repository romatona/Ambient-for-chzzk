import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSettings, geometry, shouldRender, isUnobstructedPlayer, videoImageRect } from '../src/scripts/chizambi/model.js';

test('image bounds follow both letterbox and pillarbox without resizing video',()=>{
  const wide={left:82,top:60,width:2400,height:1080,right:2482,bottom:1140};
  const pillar=videoImageRect(wide,1920,1080);
  assert.equal(pillar.left,322);assert.equal(pillar.width,1920);assert.equal(pillar.top,60);
  const tall={left:0,top:0,width:1920,height:1200,right:1920,bottom:1200};
  const letter=videoImageRect(tall,1920,1080);
  assert.equal(letter.top,60);assert.equal(letter.height,1080);assert.equal(letter.left,0);
  assert.equal(videoImageRect(tall,1920,1080,'cover'),tall);
  assert.equal(wide.width,2400);
});

test('scroll clipping and chat-side mini player suspend lighting; full video resumes',()=>{
  const main={left:82,top:60,right:1303,bottom:1260};
  const video={left:82,top:60,right:1302,bottom:746};
  assert.equal(isUnobstructedPlayer(video,main,60,1260),true);
  assert.equal(isUnobstructedPlayer({...video,top:-140,bottom:546},main,60,1260),false);
  assert.equal(isUnobstructedPlayer({left:1303,top:104,right:1697,bottom:334},main,60,1260),false);
  assert.equal(isUnobstructedPlayer(video,main,60,600),false);
});

test('popup direction, fade and theme settings persist with validated values',()=>{
  const s=normalizeSettings({'setting-directionTopEnabled':false,'setting-directionBottomEnabled':false,'setting-fadeInDuration':2.5,'setting-theme':'light'});
  assert.equal(s.directionTopEnabled,false);assert.equal(s.directionBottomEnabled,false);
  assert.equal(s.directionLeftEnabled,true);assert.equal(s.fadeInDuration,2.5);assert.equal(s.theme,'light');
  assert.equal(normalizeSettings({'setting-fadeInDuration':100}).fadeInDuration,5);
  assert.equal(normalizeSettings({'setting-theme':'invalid'}).theme,'dark');
});

test('saved settings reject corrupt types and clamp expensive values', () => {
  const s = normalizeSettings({ 'setting-enabled': 'false', 'setting-spread': 9999, 'setting-brightness': NaN, 'setting-blur2': -5 });
  assert.equal(s.enabled, true);
  assert.equal(s.spread, 100);
  assert.equal(s.brightness, 100);
  assert.equal(s.blur2, 0);
});
test('wide and portrait video keep finite positive renderer dimensions and scales', () => {
  for (const [w,h] of [[1920,1080],[720,1280],[1,1]]) {
    const g = geometry(w,h,normalizeSettings({}));
    assert.ok(g.width > 0 && g.height > 0);
    assert.ok(g.scales.length >= 3);
    assert.ok(g.scales.every(s => Number.isFinite(s.x) && s.x > 0 && Number.isFinite(s.y) && s.y > 0));
    assert.ok(g.last.x > 1 && g.last.y > 1);
  }
});
test('lifecycle suspends on route exit, hidden tab, fullscreen, PiP and disabled setting', () => {
  const state = { path:'/live/abc', enabled:true, hidden:false, fullscreen:false, pip:false, connected:true, visible:true };
  assert.equal(shouldRender(state),true);
  for (const change of [{path:'/'},{enabled:false},{hidden:true},{fullscreen:true},{pip:true},{connected:false},{visible:false}]) assert.equal(shouldRender({...state,...change}),false);
});
