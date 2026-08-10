import { json } from './_core.mjs';
export default function handler(req,res){json(res,200,{contactEmail:process.env.PUBLIC_CONTACT_EMAIL||''});}
