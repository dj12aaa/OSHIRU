import { vision, json } from './_core.mjs';
export const config={api:{bodyParser:{sizeLimit:'8mb'}}};
export default async function handler(req,res){if(req.method!=='POST')return json(res,405,{error:'method_not_allowed'});try{const b=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});const result=await vision(b.imageData);json(res,200,{enabled:true,...result});}catch(e){json(res,e.status||500,{error:e.message||'vision_failed'});}}
