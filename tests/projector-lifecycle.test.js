import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';

test('removed 2D projectors release wrapped context listeners on shrink and dispose',async()=>{
  globalThis.matchMedia=()=>({matches:false});
  globalThis.cancelAnimationFrame=()=>{};
  class Canvas extends EventTarget {
    width=1; height=1; style={}; classList={add(){}};
    getContext(){return {};}
    remove(){}
  }
  globalThis.document={createElement:()=>new Canvas()};
  const bundle=await rollup({input:'src/scripts/libs/projector-2d.js',plugins:[resolve()],onwarn(){}});
  const {output}=await bundle.generate({format:'es'});await bundle.close();
  const {default:Projector}=await import(`data:text/javascript;base64,${Buffer.from(output[0].code).toString('base64')}`);
  let warnings=0;
  const p=new Projector({}, {appendChild(){},prepend(){}},()=>{},{setWarning(){warnings++;}});
  p.recreate(5);
  const removed=p.projectors[4].elem;
  p.recreate(4);
  removed.dispatchEvent(new Event('contextlost'));
  assert.equal(warnings,0,'shrinking must detach the wrapped listener');
  const retained=p.projectors.map(p=>p.elem);
  p.dispose();
  retained.forEach(canvas=>canvas.dispatchEvent(new Event('contextlost')));
  assert.equal(warnings,0,'disposing must detach all wrapped listeners');
});
