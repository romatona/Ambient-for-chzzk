import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPageTheme } from '../src/scripts/chizambi/page-theme.js';

test('page replacement and disabling restore surfaces without overwriting site styles',()=>{
  const node=parentElement=>({parentElement,attributes:new Map(),style:'padding: 0; color: red',
    setAttribute(k,v){this.attributes.set(k,v);},removeAttribute(k){this.attributes.delete(k);},hasAttribute(k){return this.attributes.has(k);}});
  const doc={body:node(null),documentElement:node(null)};
  const root=node(doc.body), first=node(root), second=node(root);
  const theme=createPageTheme(doc);
  theme.apply({closest:()=>first});
  assert.ok(first.hasAttribute('data-chizambi-surface'));
  theme.apply({closest:()=>second});
  assert.equal(first.hasAttribute('data-chizambi-surface'),false);
  assert.ok(second.hasAttribute('data-chizambi-surface'));
  theme.clear();
  assert.equal(root.hasAttribute('data-chizambi-surface'),false);
  assert.equal(second.hasAttribute('data-chizambi-surface'),false);
  assert.equal(doc.documentElement.hasAttribute('data-chizambi-page'),false);
  assert.equal(first.style,'padding: 0; color: red');
});
