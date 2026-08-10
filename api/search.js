import { snapshotSearch, json, allowRequest, methodAllowed, normalizeQuery } from './_core.mjs';
export default async function handler(req,res){
  if(!methodAllowed(req,['GET']))return json(res,405,{error:'method_not_allowed'});
  if(!allowRequest(req,'search',90,60000))return json(res,429,{error:'rate_limited'});
  try{const u=new URL(req.url,'http://local');const q=normalizeQuery(u.searchParams.get('q')||'');return json(res,200,await snapshotSearch(q),'public, max-age=0, s-maxage=30, stale-while-revalidate=60')}catch{return json(res,500,{error:'search_failed'})}
}
