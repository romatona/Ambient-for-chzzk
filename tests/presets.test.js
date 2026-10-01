import test from 'node:test';
import assert from 'node:assert/strict';
import {canToggleLighting,validPreset,presetValues,presets} from '../src/scripts/chizambi/presets.js';

test('G ignores editing, composition, repeats, modifiers and non-live pages',()=>{
  const event={code:'KeyG',composedPath:()=>[]};
  assert.equal(canToggleLighting(event,'/live/channel'),true);
  for(const key of ['defaultPrevented','repeat','isComposing','ctrlKey','altKey','metaKey','shiftKey'])
    assert.equal(canToggleLighting({...event,[key]:true},'/live/channel'),false,key);
  assert.equal(canToggleLighting({...event,keyCode:229},'/live/channel'),false);
  assert.equal(canToggleLighting(event,'/'),false);
  assert.equal(canToggleLighting({...event,composedPath:()=>[{isContentEditable:true}]},'/live/channel'),false);
  assert.equal(canToggleLighting({...event,composedPath:()=>[{matches:()=>true}]},'/live/channel'),false);
});
test('presets contain only lighting values and reject invalid saved data',()=>{
  for(const preset of presets)assert.ok(validPreset(preset));
  assert.deepEqual(presetValues({...presets[0],enabled:false,theme:'light'}),presets[0]);
  for(const value of [{},{brightness:110,blur2:10,spread:101},{brightness:'100',blur2:30,spread:17}])assert.ok(!validPreset(value));
});
