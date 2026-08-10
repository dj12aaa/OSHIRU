import { status, json } from './_core.mjs';
export default function handler(req,res){json(res,200,status());}
