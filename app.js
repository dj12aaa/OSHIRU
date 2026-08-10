const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const storage={
  get(k,f='[]'){try{return localStorage.getItem(k)||f}catch{return f}},
  set(k,v){try{localStorage.setItem(k,v)}catch{}}
};
const state={all:[],shown:[],direct:[],query:'',favorites:new Set(JSON.parse(storage.get('oshiru-v5-favs'))),compare:new Map(),broken:new Set(),searchSeq:0};
const sourceOrder=['メルカリ','Yahoo!フリマ','Yahoo!オークション'];
const liveStatuses=new Set(['販売中','販売中候補','入札受付中']);
const allowedHosts=new Set(['jp.mercari.com','paypayfleamarket.yahoo.co.jp','auctions.yahoo.co.jp']);
const fmt=n=>n==null?'不明':'¥'+Number(n).toLocaleString('ja-JP');
const total=i=>(i.price==null||i.shipping==null)?null:Number(i.price)+Number(i.shipping||0)+Number(i.fee||0);
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const dt=s=>{if(!s)return'不明';const d=new Date(s);return Number.isNaN(+d)?'不明':d.toLocaleString('ja-JP',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})};
const daysOld=s=>{const d=new Date(s);return Number.isNaN(+d)?Infinity:Math.max(0,(Date.now()-d.getTime())/86400000)};
const originLabel=o=>({'verified-snapshot':'確認済み出品','web-index-snapshot':'確認済み情報'}[o]||'確認済み情報');
function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1700)}
async function json(url,opts={}){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),8000);try{const r=await fetch(url,{...opts,signal:controller.signal,headers:{accept:'application/json',...(opts.headers||{})}});const text=await r.text();if(!r.ok)throw new Error(`${r.status}`);return JSON.parse(text)}finally{clearTimeout(timer)}}
function debounce(fn,ms=260){let id;return(...a)=>{clearTimeout(id);id=setTimeout(()=>fn(...a),ms)}}
function sourceClass(s){if(s==='メルカリ')return'mercari';if(s==='Yahoo!フリマ')return'yflea';if(s==='Yahoo!オークション')return'yauc';return''}
function sourceSearchUrl(source,q){const e=encodeURIComponent(q||'推し活 グッズ');if(source==='メルカリ')return`https://jp.mercari.com/search?keyword=${e}`;if(source==='Yahoo!フリマ')return`https://paypayfleamarket.yahoo.co.jp/search/${e}`;if(source==='Yahoo!オークション')return`https://auctions.yahoo.co.jp/search/search/${e}/0/`;return'#'}
function safeHref(url){try{const u=new URL(url);return u.protocol==='https:'&&allowedHosts.has(u.hostname)?u.href:'#'}catch{return'#'}}
function safeImage(i){if(!i?.image||i.imageVerified!==true)return'';try{const u=new URL(i.image);return u.protocol==='https:'?u.href:''}catch{return''}}
function itemLive(i){return liveStatuses.has(i.status)}
function freshness(i){const d=daysOld(i.verifiedAt);if(d<=3)return{label:'最近確認',cls:'live'};if(d<=14)return{label:'再確認推奨',cls:'collab'};return{label:'確認日が古い',cls:'ended'}}
function loadingCards(){return Array.from({length:8},()=>`<div class="product-card"><div class="visual skeleton"></div><div class="card-body"><div class="skeleton line"></div><div class="skeleton line short"></div><div class="skeleton price-sk"></div></div></div>`).join('')}

async function runSearch(){
  const q=($('#q')?.value||'').trim().slice(0,80);const seq=++state.searchSeq;state.query=q;state.broken.clear();
  $('#queryBadge').textContent=q?`「${q}」`:'すべて';
  $('#resultMeta').textContent='確認済み出品を検索しています…';
  $('#productGrid').innerHTML=loadingCards();$('#emptyState').classList.add('hidden');
  const btn=$('#searchBtn');btn.classList.add('loading');btn.textContent='検索中…';
  try{
    const data=await json(`/api/search?q=${encodeURIComponent(q)}`);if(seq!==state.searchSeq)return;
    state.all=Array.isArray(data.items)?data.items:[];state.direct=Array.isArray(data.direct)?data.direct:[];
    hydrateFilters();applyFilters();
  }catch(e){
    if(seq!==state.searchSeq)return;
    state.all=[];state.direct=sourceOrder.map(source=>({source,url:sourceSearchUrl(source,q)}));
    renderEmpty('検索サーバーに接続できませんでした','少し時間を置くか、販売サイトへの直接検索をご利用ください。');
  }finally{if(seq===state.searchSeq){btn.classList.remove('loading');btn.textContent='横断検索'}}
}

function hydrateFilters(){
  const current=new Set($$('.source-check:checked').map(x=>x.value));
  const sources=[...new Set(state.all.map(x=>x.source).filter(x=>sourceOrder.includes(x)))].sort((a,b)=>sourceOrder.indexOf(a)-sourceOrder.indexOf(b));
  $('#sourceFilters').innerHTML=sources.length?sources.map(s=>`<label><input class="source-check" type="checkbox" value="${esc(s)}" ${!current.size||current.has(s)?'checked':''}><span class="source-dot ${sourceClass(s)}"></span>${esc(s)}</label>`).join(''):'<span class="filter-empty">検索後に表示</span>';
  $$('.source-check').forEach(x=>x.onchange=applyFilters);
  const currentCollab=$('#collabFilter').value;const cs=[...new Set(state.all.map(x=>x.collab).filter(Boolean))].sort();
  $('#collabFilter').innerHTML='<option value="">すべて</option>'+cs.map(c=>`<option ${c===currentCollab?'selected':''}>${esc(c)}</option>`).join('');
}

function applyFilters(){
  const sources=new Set($$('.source-check:checked').map(x=>x.value));const type=$('#typeFilter').value;const collab=$('#collabFilter').value;const max=Number($('#maxPrice').value);const imageOnly=$('#imageOnly').checked;const includeEnded=$('#includeEnded').checked;const liveOnly=$('#liveOnly').checked;
  let arr=state.all.filter(i=>{
    if(!sourceOrder.includes(i.source))return false;if(sources.size&&!sources.has(i.source))return false;if(type&&i.type!==type)return false;if(collab&&i.collab!==collab)return false;
    if(!includeEnded&&i.status==='終了')return false;if(liveOnly&&!itemLive(i))return false;const t=total(i);if(t!=null&&t>max)return false;if(imageOnly&&!safeImage(i))return false;return true;
  });
  const sort=$('#sort').value;
  if(sort==='price')arr.sort((a,b)=>(total(a)??a.price??Infinity)-(total(b)??b.price??Infinity));
  else if(sort==='source')arr.sort((a,b)=>sourceOrder.indexOf(a.source)-sourceOrder.indexOf(b.source));
  else if(sort==='new')arr.sort((a,b)=>new Date(b.verifiedAt||0)-new Date(a.verifiedAt||0));
  else arr.sort((a,b)=>(b._score||0)-(a._score||0)||(a.price??Infinity)-(b.price??Infinity));
  state.shown=arr;render();
}

function render(){
  $('#favCount').textContent=state.favorites.size;const arr=state.shown;$('#resultMeta').textContent=`${arr.length}件表示 / 確認済み候補 ${state.all.length}件`;
  renderStats(arr);
  if(!arr.length){$('#productGrid').innerHTML='';renderEmpty();return}
  $('#emptyState').classList.add('hidden');$('#productGrid').innerHTML=arr.map(card).join('');bindCards();
}
function renderStats(arr){
  const costs=arr.map(total).filter(Number.isFinite);const prices=arr.map(x=>x.price).filter(Number.isFinite);const sources=new Set(arr.map(x=>x.source));const recent=arr.filter(x=>daysOld(x.verifiedAt)<=7).length;const min=costs.length?Math.min(...costs):(prices.length?Math.min(...prices):null);
  $('#stats').innerHTML=`<div class="stat"><span>表示件数</span><b>${arr.length}件</b></div><div class="stat"><span>最安候補</span><b>${fmt(min)}</b></div><div class="stat"><span>販売サイト</span><b>${sources.size}サイト</b></div><div class="stat"><span>7日以内に確認</span><b>${recent}件</b></div>`;
}
function card(i){
  const t=total(i),shipping=i.shipping===0?'送料無料':i.shipping==null?'送料不明':`送料 ${fmt(i.shipping)}`,src=safeImage(i),fresh=freshness(i),href=safeHref(i.url),ended=i.status==='終了';
  const cta=href==='#'?'<span class="disabled-link">リンク確認中</span>':`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">この出品を見る ↗</a>`;
  return `<article class="product-card" data-card-id="${esc(i.id)}"><div class="visual">${src?`<img class="market-img" src="${esc(src)}" alt="${esc(i.title)}" loading="lazy" referrerpolicy="no-referrer" data-id="${esc(i.id)}">`:`<div class="image-fallback">販売元の画像は<br>出品ページで確認できます</div>`}<span class="source-pill"><span class="source-dot ${sourceClass(i.source)}"></span>${esc(i.source)}</span><button class="heart ${state.favorites.has(String(i.id))?'on':''}" data-fav="${esc(i.id)}" aria-label="お気に入り">${state.favorites.has(String(i.id))?'♥':'♡'}</button></div><div class="card-body"><div class="tag-row"><span class="tag ${ended?'ended':'live'}">${esc(i.status||'要確認')}</span><span class="tag ${fresh.cls}">${fresh.label}</span><span class="tag">${esc(i.type||'その他')}</span>${i.collab?`<span class="tag collab">${esc(i.collab)}</span>`:''}</div><div class="product-title">${esc(i.title)}</div><div class="meta-line">${esc([i.series,i.character].filter(Boolean).join(' / '))}</div><div class="price-block"><div class="main-price">${fmt(i.price)}</div><div class="ship">${shipping}<br>${t!=null?`実質 ${fmt(t)}`:'総額は要確認'}</div></div><div class="cost-row"><span>商品価格</span><b>${fmt(i.price)}</b><span>送料</span><b>${fmt(i.shipping)}</b><span>状態</span><b>${esc(i.condition||'要確認')}</b></div><div class="verified"><span>${esc(originLabel(i.origin))}</span><span>確認 ${esc(dt(i.verifiedAt))}</span></div><div class="card-actions"><button title="比較に追加" aria-label="比較に追加" data-compare="${esc(i.id)}">＋</button>${cta}</div></div></article>`;
}
function bindCards(){
  $$('.market-img').forEach(img=>img.addEventListener('error',()=>{state.broken.add(String(img.dataset.id));img.outerHTML='<div class="image-fallback">画像を表示できません<br><small>出品ページで確認できます</small></div>'},{once:true}));
  $$('[data-fav]').forEach(b=>b.onclick=()=>{const id=String(b.dataset.fav);state.favorites.has(id)?state.favorites.delete(id):state.favorites.add(id);storage.set('oshiru-v5-favs',JSON.stringify([...state.favorites]));render();toast(state.favorites.has(id)?'お気に入りに追加しました':'お気に入りから外しました')});
  $$('[data-compare]').forEach(b=>b.onclick=()=>{const id=String(b.dataset.compare),item=state.all.find(x=>String(x.id)===id);if(!item)return;if(state.compare.has(id))state.compare.delete(id);else{if(state.compare.size>=4)state.compare.delete(state.compare.keys().next().value);state.compare.set(id,item)}updateCompare()});
}
function renderEmpty(title='条件に合う確認済み商品がありません',body='検索語を短くするか、販売サイトで同じ検索語を確認してください。'){const box=$('#emptyState');box.classList.remove('hidden');box.innerHTML=`<h3>${esc(title)}</h3><p>${esc(body)}</p><div class="direct-links">${state.direct.filter(x=>safeHref(x.url)!=='#').map(x=>`<a href="${esc(safeHref(x.url))}" target="_blank" rel="noopener noreferrer">${esc(x.source)}で検索 ↗</a>`).join('')}</div>`}

function updateCompare(){const n=state.compare.size;$('#compareCount').textContent=n;$('#compareTray').classList.toggle('hidden',n===0)}
function openCompare(){
  const a=[...state.compare.values()];if(!a.length)return;
  $('#modalContent').innerHTML=`<h2>商品を比較</h2><p class="lead">価格・送料・状態・確認日時を比較できます。表示内容は取得時点の情報です。</p><div class="table-wrap"><table class="compare-table"><thead><tr><th>商品</th><th>販売元</th><th>商品価格</th><th>送料</th><th>実質額</th><th>状態</th><th>確認</th></tr></thead><tbody>${a.map(i=>`<tr><td>${esc(i.title)}</td><td>${esc(i.source)}</td><td>${fmt(i.price)}</td><td>${fmt(i.shipping)}</td><td>${fmt(total(i))}</td><td>${esc(i.condition||'要確認')}</td><td>${esc(dt(i.verifiedAt))}</td></tr>`).join('')}</tbody></table></div>`;
  openModal();
}
function openFavorites(){const a=state.all.filter(i=>state.favorites.has(String(i.id)));$('#modalContent').innerHTML=`<h2>お気に入り</h2><p class="lead">現在の検索候補内のお気に入りです。</p>${a.length?`<div class="favorite-list">${a.map(i=>`<div class="setting-row"><span>${esc(i.title)}</span><b>${fmt(i.price)}</b></div>`).join('')}</div>`:'<div class="empty-state"><p>現在の検索結果にお気に入り商品はありません。</p></div>'}`;openModal()}
function openModal(){$('#modal').classList.remove('hidden');document.body.style.overflow='hidden'}
function closeModal(){$('#modal').classList.add('hidden');document.body.style.overflow=''}

function renderWatchList(){let list=[];try{list=JSON.parse(storage.get('oshiru-v5-watch'))}catch{}const root=$('#watchList');root.innerHTML=list.map((x,i)=>`<div class="watch-item"><button data-watch-run="${i}">${esc(x.q||'すべて')}</button><button data-watch-del="${i}" aria-label="削除">×</button></div>`).join('');$$('[data-watch-run]').forEach(b=>b.onclick=()=>{const x=list[Number(b.dataset.watchRun)];if(!x)return;$('#q').value=x.q||'';$('#maxPrice').value=x.maxPrice||15000;$('#maxPriceLabel').textContent=`${fmt(Number($('#maxPrice').value))}以下`;runSearch()});$$('[data-watch-del]').forEach(b=>b.onclick=()=>{list.splice(Number(b.dataset.watchDel),1);storage.set('oshiru-v5-watch',JSON.stringify(list));renderWatchList()})}
function saveWatch(){let list=[];try{list=JSON.parse(storage.get('oshiru-v5-watch'))}catch{}const item={q:state.query,maxPrice:Number($('#maxPrice').value),savedAt:new Date().toISOString()};if(!list.some(x=>x.q===item.q&&x.maxPrice===item.maxPrice))list.unshift(item);list=list.slice(0,12);storage.set('oshiru-v5-watch',JSON.stringify(list));renderWatchList();toast('検索条件を保存しました')}

const suggest=debounce(async()=>{
  const q=($('#q')?.value||'').trim();if(q.length<2){$('#suggestBox').classList.add('hidden');return}
  try{const d=await json(`/api/suggest?q=${encodeURIComponent(q.slice(0,80))}`);const items=Array.isArray(d.items)?d.items.slice(0,8):[];if(!items.length){$('#suggestBox').classList.add('hidden');return}$('#suggestBox').innerHTML=items.map(x=>`<div class="suggest-item" data-suggest="${esc(x.name)}" role="option"><div><b>${esc(x.name)}</b><span>${x.kind==='character'?'キャラクター候補':x.kind==='media'?'作品候補':'検索候補'}</span></div></div>`).join('');$('#suggestBox').classList.remove('hidden');$$('[data-suggest]').forEach(el=>el.onclick=()=>{$('#q').value=el.dataset.suggest;$('#suggestBox').classList.add('hidden');runSearch()})}catch{$('#suggestBox').classList.add('hidden')}
},320);

function resetFilters(){$('#typeFilter').value='';$('#collabFilter').value='';$('#maxPrice').value=15000;$('#maxPriceLabel').textContent='¥15,000以下';$('#liveOnly').checked=true;$('#imageOnly').checked=false;$('#includeEnded').checked=false;$$('.source-check').forEach(x=>x.checked=true);applyFilters()}
function bind(){
  $('#searchBtn').onclick=runSearch;$('#q').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#suggestBox').classList.add('hidden');runSearch()}});$('#q').addEventListener('input',suggest);$('#clearQ').onclick=()=>{$('#q').value='';$('#suggestBox').classList.add('hidden');runSearch()};
  $$('.query-chip').forEach(b=>b.onclick=()=>{$('#q').value=b.dataset.query;runSearch()});
  $('#typeFilter').onchange=applyFilters;$('#collabFilter').onchange=applyFilters;$('#sort').onchange=applyFilters;$('#liveOnly').onchange=applyFilters;$('#imageOnly').onchange=applyFilters;$('#includeEnded').onchange=applyFilters;
  $('#maxPrice').oninput=()=>{$('#maxPriceLabel').textContent=`${fmt(Number($('#maxPrice').value))}以下`;applyFilters()};$('#resetBtn').onclick=resetFilters;$('#saveWatchBtn').onclick=saveWatch;
  $('#mobileFilterBtn').onclick=()=>$('.filter-panel').classList.toggle('mobile-open');$('#favoritesBtn').onclick=openFavorites;$('#openCompare').onclick=openCompare;$('#clearCompare').onclick=()=>{state.compare.clear();updateCompare()};$('#modalClose').onclick=closeModal;$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
  document.addEventListener('click',e=>{if(!e.target.closest('.search-panel'))$('#suggestBox').classList.add('hidden')});
}
bind();renderWatchList();runSearch();
