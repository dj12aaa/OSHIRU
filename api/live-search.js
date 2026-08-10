import { liveSearch, json } from './_core.mjs';
export default async function handler(req,res){try{const u=new URL(req.url,'http://local');const q=(u.searchParams.get('q')||'').trim();json(res,200,await liveSearch(q));}catch(e){json(res,500,{error:'live_search_failed'});}}
