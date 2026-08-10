import { json, allowRequest, methodAllowed } from './_core.mjs';
export default function handler(req,res){
  if(!methodAllowed(req,['GET']))return json(res,405,{error:'method_not_allowed'});
  if(!allowRequest(req,'contact',30,60000))return json(res,429,{error:'rate_limited'});
  const raw=String(process.env.PUBLIC_CONTACT_EMAIL||'').trim();
  const contactEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)?raw:null;
  return json(res,200,{contactEmail},'private, no-store');
}
