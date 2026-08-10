import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotSearch, normalizeQuery } from '../api/_core.mjs';

test('東雲絵名 6c returns individual Mercari listing', async()=>{
  const r=await snapshotSearch('東雲絵名 6c');
  assert.ok(r.items.length>=1);
  assert.ok(r.items.some(x=>x.url==='https://jp.mercari.com/item/m42733344317' && x.price===2666));
});

test('五条悟 サンリオ returns multiple marketplaces', async()=>{
  const r=await snapshotSearch('五条悟 サンリオ');
  const sources=new Set(r.items.map(x=>x.source));
  assert.ok(sources.has('メルカリ'));
  assert.ok(sources.has('Yahoo!フリマ'));
});

test('search result only keeps allowlisted individual item URLs', async()=>{
  const r=await snapshotSearch('五条悟 アクスタ');
  assert.ok(r.items.length>=2);
  assert.ok(r.items.every(x=>/^https:\/\/(jp\.mercari\.com\/item\/|paypayfleamarket\.yahoo\.co\.jp\/item\/|auctions\.yahoo\.co\.jp\/jp\/auction\/)/.test(x.url)));
});

test('query input is normalized and capped',()=>{
  const q=normalizeQuery(`\u0000   ${'あ'.repeat(100)}   `);
  assert.equal(q.length,80);
  assert.doesNotMatch(q,/\u0000/);
});

test('direct search links use only the three supported marketplaces',async()=>{
  const r=await snapshotSearch('五条悟');
  assert.deepEqual(r.direct.map(x=>x.source),['メルカリ','Yahoo!フリマ','Yahoo!オークション']);
});
