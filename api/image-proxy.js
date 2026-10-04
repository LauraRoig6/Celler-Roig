function badHost(host='') {
  const h = host.toLowerCase();
  if (h === 'localhost' || h === '::1' || h === '127.0.0.1' || h.startsWith('127.')) return true;
  if (h.startsWith('10.') || h.startsWith('192.168.') || h === '169.254.169.254') return true;
  const m = h.match(/^172\.(\d+)\./); if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  return false;
}
export default async function handler(req,res) {
  const raw=String(req.query?.url||'');
  let url; try { url=new URL(raw); } catch { return res.status(400).json({error:'URL no válida'}); }
  if (!['http:','https:'].includes(url.protocol) || badHost(url.hostname)) return res.status(400).json({error:'URL no permitida'});
  try {
    const response=await fetch(url.toString(),{headers:{'User-Agent':'Mozilla/5.0 Celler-Roig/1.0','Accept':'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'},signal:AbortSignal.timeout(9000)});
    if(!response.ok)return res.status(502).json({error:'No se pudo leer la imagen'});
    const type=response.headers.get('content-type')||''; if(!type.startsWith('image/'))return res.status(415).json({error:'No es una imagen'});
    const buffer=Buffer.from(await response.arrayBuffer()); if(buffer.length>8*1024*1024)return res.status(413).json({error:'Imagen demasiado grande'});
    res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=86400');res.status(200).end(buffer);
  } catch { return res.status(502).json({error:'No se pudo descargar la imagen'}); }
}
