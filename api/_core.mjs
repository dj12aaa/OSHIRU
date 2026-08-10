import fs from 'node:fs';

const rawVerified=JSON.parse(fs.readFileSync(new URL('../data/verified-listings.json',import.meta.url),'utf8'));
const allowedSources=new Set(['メルカリ','Yahoo!フリマ','Yahoo!オークション']);
const allowedHosts=new Set(['jp.mercari.com','paypayfleamarket.yahoo.co.jp','auctions.yahoo.co.jp']);
const anilistEnabled=String(process.env.ANILIST_METADATA_ENABLED||'true').toLowerCase()!=='false';
const aliases={
  アクスタ:['アクスタ','アクリルスタンド','アクリルフィギュア'],
  グリ缶:['グリ缶','グリッター缶バッジ'],
  プロセカ:['プロセカ','プロジェクトセカイ'],
  ぼざろ:['ぼざろ','ぼっち・ざ・ろっく','ぼっちざろっく'],
  サンリオ:['サンリオ','シナモロール','シナモンロール'],
  呪術:['呪術','呪術廻戦']
};

function validListing(i){
  try{const u=new URL(i.url);return allowedSources.has(i.source)&&u.protocol==='https:'&&allowedHosts.has(u.hostname)&&typeof i.title==='string'&&i.title.length<=240}catch{return false}
}
const verified=rawVerified.filter(validListing);

const buckets=globalThis.__oshiruRateBuckets||(globalThis.__oshiruRateBuckets=new Map());
export function allowRequest(req,key='default',limit=60,windowMs=60000){
  const forwarded=String(req.headers?.['x-forwarded-for']||'').split(',')[0].trim();
  const ip=forwarded||req.socket?.remoteAddress||'unknown';
  const now=Date.now();const id=`${key}:${ip}`;let b=buckets.get(id);
  if(!b||now-b.start>=windowMs)b={start:now,count:0};b.count++;buckets.set(id,b);
  if(buckets.size>2000){for(const [k,v] of buckets){if(now-v.start>windowMs*2)buckets.delete(k)}}
  return b.count<=limit;
}
export function methodAllowed(req,methods=['GET']){return methods.includes(String(req.method||'GET').toUpperCase())}
export function normalizeQuery(q=''){return String(q).replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,80)}
export function setCommon(res,cache='no-store'){
  res.setHeader('Cache-Control',cache);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Type','application/json; charset=utf-8');
}
export function json(res,status,data,cache='no-store'){setCommon(res,cache);res.status(status).json(data)}

export function outbound(source,q){
  const e=encodeURIComponent(normalizeQuery(q)||'推し活 グッズ');
  if(source==='メルカリ')return`https://jp.mercari.com/search?keyword=${e}`;
  if(source==='Yahoo!フリマ')return`https://paypayfleamarket.yahoo.co.jp/search/${e}`;
  if(source==='Yahoo!オークション')return`https://auctions.yahoo.co.jp/search/search/${e}/0/`;
  return'#';
}
function expand(q=''){
  const s=normalizeQuery(q).toLowerCase();const out=new Set(s.split(/\s+/).filter(Boolean));
  for(const [k,vs] of Object.entries(aliases)){if(s.includes(k.toLowerCase())||vs.some(v=>s.includes(v.toLowerCase())))vs.forEach(v=>out.add(v.toLowerCase()))}
  return[...out];
}
function score(i,q){
  if(!q)return 1;const hay=[i.title,i.series,i.character,i.type,i.collab,...(i.tags||[])].filter(Boolean).join(' ').toLowerCase();const terms=expand(q);let n=0;
  for(const t of terms){if(hay.includes(t))n+=t.length>3?4:2}const raw=normalizeQuery(q).toLowerCase();if(hay.includes(raw))n+=10;return n;
}

async function fetchJson(url,opts={}){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),3500);
  try{
    const r=await fetch(url,{...opts,signal:controller.signal,headers:{accept:'application/json','user-agent':'OSHIRU-public-beta/1.1 (+https://oshiruoshi.vercel.app)',...(opts.headers||{})}});
    const text=await r.text();if(!r.ok)throw new Error(`upstream_${r.status}`);if(text.length>500000)throw new Error('upstream_too_large');return JSON.parse(text);
  }finally{clearTimeout(timer)}
}

function localSuggestions(q){
  const needle=normalizeQuery(q).toLowerCase();if(needle.length<2)return[];
  const seen=new Set(),out=[];
  for(const i of verified){for(const [kind,value] of [['character',i.character],['media',i.series],['keyword',i.collab]]){if(!value)continue;for(const part of String(value).split(/\s*\/\s*/)){const name=part.trim();if(!name||!name.toLowerCase().includes(needle)||seen.has(name))continue;seen.add(name);out.push({kind,name,origin:'local'})}}}
  return out.slice(0,6);
}
async function anilistSuggestions(q){
  const s=normalizeQuery(q);if(!anilistEnabled||s.length<2)return[];
  const query=`query($s:String){Page(page:1,perPage:5){media(search:$s){type isAdult title{native romaji english}} characters(search:$s){name{full native}}}}`;
  const d=await fetchJson('https://graphql.anilist.co',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query,variables:{s}})});
  const p=d.data?.Page||{};const out=[];
  for(const x of p.characters||[]){const name=x.name?.native||x.name?.full;if(name)out.push({kind:'character',name,origin:'anilist'})}
  for(const x of p.media||[]){if(x.isAdult)continue;const name=x.title?.native||x.title?.romaji||x.title?.english;if(name)out.push({kind:'media',name,origin:'anilist'})}
  return out;
}

export async function snapshotSearch(q){
  const clean=normalizeQuery(q);const items=verified.map(i=>({...i,_score:score(i,clean),real:true})).filter(i=>!clean||i._score>0).sort((a,b)=>b._score-a._score||(a.price??Infinity)-(b.price??Infinity));
  const direct=['メルカリ','Yahoo!フリマ','Yahoo!オークション'].map(source=>({source,url:outbound(source,clean)}));
  return{query:clean,items,direct,snapshotCount:items.length,generatedAt:new Date().toISOString(),notice:'表示内容は取得時点の確認情報です。購入前に販売元で最新状態を確認してください。'};
}
export async function suggest(q){
  const clean=normalizeQuery(q);const local=localSuggestions(clean);let remote=[];
  try{remote=await anilistSuggestions(clean)}catch{}
  const merged=[],seen=new Set();for(const x of [...local,...remote]){const k=`${x.kind}|${x.name}`;if(!x.name||seen.has(k))continue;seen.add(k);merged.push(x)}
  return{items:merged.slice(0,8),metadataSource:remote.length?'AniList public API + local':'local',generatedAt:new Date().toISOString()};
}
