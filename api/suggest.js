import { suggest, json, allowRequest, methodAllowed, normalizeQuery } from './_core.mjs';
export default async function handler(req,res){
  if(!methodAllowed(req,['GET']))return json(res,405,{error:'method_not_allowed'});
  if(!allowRequest(req,'suggest',20,60000))return json(res,429,{items:[],error:'rate_limited'});
  try{const u=new URL(req.url,'http://local');const q=normalizeQuery(u.searchParams.get('q')||'');if(q.length<2)return json(res,200,{items:[]},'public, max-age=0, s-maxage=120');return json(res,200,await suggest(q),'public, max-age=0, s-maxage=900, stale-while-revalidate=3600')}catch{return json(res,200,{items:[],error:'suggest_unavailable'},'public, max-age=0, s-maxage=60')}
}
