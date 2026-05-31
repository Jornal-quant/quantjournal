import { getSql, isAdminRequest, normalizeRow, normalizeRows, parseOrder, sendJson, tableFor, toDatabasePayload } from '../_db.js';

// Escritas liberadas ao público (sem token de admin):
// - cadastro de newsletter (POST NewsletterSubscriber)
// - contador de leituras do artigo (PATCH Article só com o campo `views`)
function isPublicWrite(method, entity, body) {
  if (method === 'POST') return entity === 'NewsletterSubscriber';
  if (method === 'PATCH') {
    return entity === 'Article' && Object.keys(body || {}).every((k) => k === 'views');
  }
  return false;
}

function parseFilters(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function assertIdentifier(identifier) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }
  return identifier;
}

function buildWhere(filters, values) {
  const entries = Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (entries.length === 0) return '';
  const clauses = entries.map(([key, value]) => {
    values.push(value);
    return `${assertIdentifier(key)} = $${values.length}`;
  });
  return ` where ${clauses.join(' and ')}`;
}

function buildInsert(payload, values) {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  const columns = entries.map(([key]) => key);
  const placeholders = entries.map(([, value]) => {
    values.push(value);
    return `$${values.length}`;
  });
  return { columns, placeholders };
}

export default async function handler(req, res) {
  try {
    const sql = getSql();
    const entity = req.query.entity;
    const table = tableFor(entity);

    // Leitura é pública; escrita exige admin, salvo as exceções públicas.
    if (req.method !== 'GET' && !isPublicWrite(req.method, entity, req.body) && !isAdminRequest(req)) {
      return sendJson(res, 401, { error: 'Não autorizado' });
    }

    if (req.method === 'GET') {
      const values = [];
      const filters = parseFilters(req.query.filters);
      const limit = Math.min(Number(req.query.limit || 100), 500);
      const { column, direction } = parseOrder(req.query.order);
      const orderColumn = assertIdentifier(column);
      values.push(limit);
      const where = buildWhere(filters, values);
      const result = await sql.query(
        `select * from ${table}${where} order by ${orderColumn} ${direction} limit $1`,
        values,
      );
      return sendJson(res, 200, normalizeRows(result));
    }

    if (req.method === 'POST') {
      const payload = toDatabasePayload(req.body || {});
      const values = [];
      const { columns, placeholders } = buildInsert(payload, values);
      if (columns.length === 0) return sendJson(res, 400, { error: 'Empty payload' });
      const result = await sql.query(
        `insert into ${table} (${columns.map(assertIdentifier).join(', ')}) values (${placeholders.join(', ')}) returning *`,
        values,
      );
      return sendJson(res, 200, normalizeRow(result[0]));
    }

    if (req.method === 'PATCH') {
      const id = req.query.id;
      if (!id) return sendJson(res, 400, { error: 'id is required' });
      const payload = toDatabasePayload(req.body || {});
      const values = [];
      const assignments = Object.entries(payload)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => {
          values.push(value);
          return `${assertIdentifier(key)} = $${values.length}`;
        });
      if (assignments.length === 0) return sendJson(res, 400, { error: 'Empty payload' });
      values.push(id);
      const result = await sql.query(
        `update ${table} set ${assignments.join(', ')} where id = $${values.length} returning *`,
        values,
      );
      return sendJson(res, 200, normalizeRow(result[0]));
    }

    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return sendJson(res, 400, { error: 'id is required' });
      await sql.query(`delete from ${table} where id = $1`, [id]);
      return sendJson(res, 200, { success: true });
    }

    return sendJson(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
}
