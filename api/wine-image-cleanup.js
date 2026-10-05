function json(res,status,body){res.setHeader('Cache-Control','no-store, max-age=0');res.status(status).setHeader('Content-Type','application/json; charset=utf-8').end(JSON.stringify(body));}
function parseBody(req){if(!req.body)return{};if(typeof req.body==='string'){try{return JSON.parse(req.body)}catch{return{}}}return req.body;}
function dataUrlToBlobPart(dataUrl){const m=String(dataUrl||'').match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);if(!m)return null;return{type:m[1],buffer:Buffer.from(m[2],'base64')};}
export const config={maxDuration:120};

export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Método no permitido.'});
  const apiKey=process.env.OPENAI_API_KEY;if(!apiKey)return json(res,503,{code:'OPENAI_NOT_CONFIGURED',error:'Falta OPENAI_API_KEY en Vercel.'});
  try{
    const body=parseBody(req);const bottle=dataUrlToBlobPart(body.bottleImageDataUrl);const front=dataUrlToBlobPart(body.frontImageDataUrl);const back=dataUrlToBlobPart(body.backImageDataUrl);
    if(!bottle)return json(res,400,{error:'Falta la foto de la botella entera.'});
    const identity=String(body.identity||'esta botella de vino').slice(0,220);
    const form=new FormData();
    form.append('model','gpt-image-2.5-sunburst');
    form.append('image[]',new Blob([bottle.buffer],{type:bottle.type}),'bottle.jpg');
    if(front)form.append('image[]',new Blob([front.buffer],{type:front.type}),'front-label.jpg');
    if(back)form.append('image[]',new Blob([back.buffer],{type:back.type}),'back-label.jpg');
    form.append('prompt',`Create a clean ecommerce-style product cutout of the EXACT wine bottle in the FIRST reference image (${identity}). The first image is the composition/source bottle; the other images are label references only. Preserve the exact bottle shape, glass color, capsule/cork, label layout, logos, colors, typography and visible wording as faithfully as possible. Do NOT redesign, rename, translate or invent the label. Remove all hands, fingers, table, shelf, support, room/background, glare and distracting reflections. Correct perspective only if needed, keep the bottle upright, centered and fully visible from base to top with natural studio lighting. Transparent background. No shadow outside the bottle. Do not add props or text.`);
    form.append('size','1024x1536');
    form.append('quality','medium');
    form.append('background','transparent');
    form.append('output_format','webp');
    form.append('output_compression','78');
    const r=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`},body:form,signal:AbortSignal.timeout(115000)});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data?.error?.message||`OpenAI Images ${r.status}`);
    const b64=data?.data?.[0]?.b64_json;if(!b64)throw new Error('La IA no devolvió la imagen mejorada.');
    return json(res,200,{imageDataUrl:`data:image/webp;base64,${b64}`,provider:'openai-image-edit'});
  }catch(err){console.error('wine-image-cleanup error',err);return json(res,502,{error:'No he podido limpiar la foto de la botella. Celler Roig usará una foto de catálogo si encuentra una.',detail:process.env.NODE_ENV==='development'?String(err?.message||err):undefined});}
}
