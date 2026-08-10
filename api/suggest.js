import { suggest, json } from './_core.mjs';
export default async function handler(req,res){try{const u=new URL(req.url,'http://local');json(res,200,await suggest((u.searchParams.get('q')||'').trim()));}catch(e){json(res,502,{items:[],error:'suggest_failed'});}}
