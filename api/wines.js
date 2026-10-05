import { neon } from '@neondatabase/serverless';

function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').end(JSON.stringify(body));
}

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

async function ensureTables(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS celler_roig_wines (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      manual_order integer NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS celler_roig_meta (
      id integer PRIMARY KEY,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`INSERT INTO celler_roig_meta (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
}

async function touchMeta(sql) {
  const rows = await sql`UPDATE celler_roig_meta SET updated_at = now() WHERE id = 1 RETURNING updated_at`;
  return rows[0]?.updated_at || new Date().toISOString();
}

async function getMeta(sql) {
  const rows = await sql`SELECT updated_at FROM celler_roig_meta WHERE id = 1`;
  return rows[0]?.updated_at || null;
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

async function upsertWine(sql, wine) {
  if (!wine?.id) throw new Error('INVALID_WINE');
  const data = JSON.stringify(wine);
  const order = Number.isFinite(Number(wine.manualOrder)) ? Number(wine.manualOrder) : 0;
  await sql`
    INSERT INTO celler_roig_wines (id, data, manual_order, updated_at)
    VALUES (${String(wine.id)}, ${data}::jsonb, ${order}, now())
    ON CONFLICT (id) DO UPDATE SET
      data = EXCLUDED.data,
      manual_order = EXCLUDED.manual_order,
      updated_at = now()
  `;
}

export default async function handler(req, res) {
  const sql = getSql();
  if (!sql) return json(res, 503, { code: 'DATABASE_NOT_CONFIGURED', error: 'Falta DATABASE_URL en Vercel.' });

  try {
    await ensureTables(sql);

    if (req.method === 'GET') {
      const updatedAt = await getMeta(sql);
      if (String(req.query?.meta || '') === '1') return json(res, 200, { updatedAt });
      const rows = await sql`SELECT data FROM celler_roig_wines ORDER BY manual_order ASC, updated_at ASC`;
      return json(res, 200, { wines: rows.map(row => row.data), updatedAt });
    }

    const body = parseBody(req);

    if (req.method === 'PUT') {
      await upsertWine(sql, body.wine);
      const updatedAt = await touchMeta(sql);
      return json(res, 200, { ok: true, updatedAt });
    }

    if (req.method === 'POST') {
      const wines = Array.isArray(body.wines) ? body.wines : [];
      const payload = JSON.stringify(wines);
      if (wines.length) {
        await sql`
          INSERT INTO celler_roig_wines (id, data, manual_order, updated_at)
          SELECT
            item->>'id' AS id,
            item AS data,
            COALESCE((item->>'manualOrder')::integer, 0) AS manual_order,
            now()
          FROM jsonb_array_elements(${payload}::jsonb) AS item
          WHERE COALESCE(item->>'id', '') <> ''
          ON CONFLICT (id) DO UPDATE SET
            data = EXCLUDED.data,
            manual_order = EXCLUDED.manual_order,
            updated_at = now()
        `;
      }
      if (body.replace === true) {
        await sql`
          DELETE FROM celler_roig_wines
          WHERE id NOT IN (
            SELECT item->>'id'
            FROM jsonb_array_elements(${payload}::jsonb) AS item
            WHERE COALESCE(item->>'id', '') <> ''
          )
        `;
      }
      const updatedAt = await touchMeta(sql);
      return json(res, 200, { ok: true, count: wines.length, updatedAt });
    }

    if (req.method === 'PATCH') {
      const order = Array.isArray(body.order) ? body.order : [];
      const payload = JSON.stringify(order);
      if (order.length) {
        await sql`
          UPDATE celler_roig_wines AS w
          SET
            manual_order = (item->>'manualOrder')::integer,
            data = jsonb_set(w.data, '{manualOrder}', to_jsonb((item->>'manualOrder')::integer), true),
            updated_at = now()
          FROM jsonb_array_elements(${payload}::jsonb) AS item
          WHERE w.id = item->>'id'
        `;
      }
      const updatedAt = await touchMeta(sql);
      return json(res, 200, { ok: true, updatedAt });
    }

    if (req.method === 'DELETE') {
      if (!body.id) return json(res, 400, { error: 'Falta el id del vino.' });
      await sql`DELETE FROM celler_roig_wines WHERE id = ${String(body.id)}`;
      const updatedAt = await touchMeta(sql);
      return json(res, 200, { ok: true, updatedAt });
    }

    res.setHeader('Allow', 'GET,POST,PUT,PATCH,DELETE');
    return json(res, 405, { error: 'Método no permitido.' });
  } catch (error) {
    console.error('Celler Roig wines API error', error);
    return json(res, 500, { error: 'No se ha podido guardar la colección en la nube.' });
  }
}
