import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotSearch, status } from '../api/_core.mjs';

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

test('search result keeps individual item URLs', async()=>{
  const r=await snapshotSearch('五条悟 アクスタ');
  assert.ok(r.items.length>=2);
  assert.ok(r.items.every(x=>/^https:\/\/(jp\.mercari\.com\/item\/|paypayfleamarket\.yahoo\.co\.jp\/item\/|auctions\.yahoo\.co\.jp\/jp\/auction\/)/.test(x.url)));
});

test('public page adapters are disabled by default',()=>{
  assert.equal(status().publicAdapters,false);
});
