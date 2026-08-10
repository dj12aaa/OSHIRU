import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('required public pages exist',()=>{
  for(const p of ['index.html','about.html','terms.html','privacy.html','disclaimer.html','contact.html','404.html']) assert.equal(fs.existsSync(new URL(`../${p}`,import.meta.url)),true,p);
});

test('homepage includes legal links and no missing PNG references',()=>{
  const h=read('index.html');
  for(const p of ['terms.html','privacy.html','disclaimer.html','contact.html']) assert.match(h,new RegExp(p.replace('.','\\.')));
  assert.doesNotMatch(h,/og\.png|icon-192\.png|icon-512\.png/);
});

test('secrets are not embedded in browser files',()=>{
  const text=read('index.html')+'\n'+read('app.js');
  assert.doesNotMatch(text,/sk-[A-Za-z0-9_-]{20,}|X_BEARER_TOKEN\s*=|OPENAI_API_KEY\s*=|YAHOO_CLIENT_ID\s*=/);
});
