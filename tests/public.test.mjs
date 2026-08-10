import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

test('required public pages exist',()=>{
  for(const p of ['index.html','about.html','terms.html','privacy.html','disclaimer.html','contact.html','404.html']) assert.equal(fs.existsSync(new URL(`../${p}`,import.meta.url)),true,p);
});

test('homepage includes legal links and removes commerce/status UI',()=>{
  const h=read('index.html');
  for(const p of ['terms.html','privacy.html','disclaimer.html','contact.html']) assert.match(h,new RegExp(p.replace('.','\\.')));
  assert.doesNotMatch(h,/通販API|接続状況|Yahoo!ショッピング|楽天市場/);
  assert.doesNotMatch(h,/og\.png|icon-192\.png|icon-512\.png/);
});

test('unused risky endpoints are removed',()=>{
  for(const p of ['api/live-search.js','api/status.js','api/public-config.js','api/image-proxy.js','api/vision-search.js']) assert.equal(fs.existsSync(new URL(`../${p}`,import.meta.url)),false,p);
});

test('secrets are not embedded in browser files or env template',()=>{
  const text=read('index.html')+'\n'+read('app.js')+'\n'+read('.env.example');
  assert.doesNotMatch(text,/sk-[A-Za-z0-9_-]{20,}|X_BEARER_TOKEN\s*=|OPENAI_API_KEY\s*=|YAHOO_CLIENT_ID\s*=|RAKUTEN_APP_ID\s*=/);
});

test('production headers include CSP, anti-framing and HSTS',()=>{
  const v=read('vercel.json');
  assert.match(v,/Content-Security-Policy/);
  assert.match(v,/frame-ancestors 'none'/);
  assert.match(v,/X-Frame-Options/);
  assert.match(v,/DENY/);
  assert.match(v,/Strict-Transport-Security/);
});
