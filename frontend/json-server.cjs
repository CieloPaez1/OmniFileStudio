/**
 * Servidor compatible con json-server (REST API sobre db.json en puerto 3000)
 * Soporta GET /files, GET /files/:id, POST /files, PUT /files/:id, PATCH /files/:id, DELETE /files/:id
 * y sincroniza los cambios en tiempo real sobre db.json.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { files: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  // Sincronizar también en el db.json de la raíz si existe
  const rootDb = path.join(__dirname, '..', 'db.json');
  if (fs.existsSync(rootDb)) {
    try {
      fs.writeFileSync(rootDb, JSON.stringify(data, null, 2), 'utf-8');
    } catch {}
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = urlObj.pathname.replace(/\/+$/, '') || '/';

  // GET /db
  if (req.method === 'GET' && pathname === '/db') {
    return sendJson(res, 200, readDb());
  }

  // Rutas /files y /files/:id
  const match = pathname.match(/^\/files(?:\/([^/]+))?$/);
  if (!match) {
    return sendJson(res, 200, {
      name: 'json-server (db.json)',
      resources: ['/files'],
      status: 'online'
    });
  }

  const idParam = match[1];
  const db = readDb();
  db.files = Array.isArray(db.files) ? db.files : [];

  if (req.method === 'GET' && !idParam) {
    let list = [...db.files];
    const tag = urlObj.searchParams.get('tag');
    const q = urlObj.searchParams.get('q');
    if (tag) {
      list = list.filter(f => String(f.tag).toLowerCase() === tag.toLowerCase());
    }
    if (q) {
      const query = q.toLowerCase();
      list = list.filter(
        f =>
          String(f.name || '').toLowerCase().includes(query) ||
          String(f.description || '').toLowerCase().includes(query)
      );
    }
    return sendJson(res, 200, list);
  }

  if (req.method === 'GET' && idParam) {
    const found = db.files.find(f => String(f.id) === String(idParam));
    if (!found) return sendJson(res, 404, { error: 'Archivo no encontrado' });
    return sendJson(res, 200, found);
  }

  if (req.method === 'POST' && !idParam) {
    try {
      const body = await parseBody(req);
      const maxId = db.files.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
      const newRecord = {
        ...body,
        id: body.id ?? maxId + 1,
        createdAt: body.createdAt || new Date().toISOString()
      };
      db.files.unshift(newRecord);
      writeDb(db);
      return sendJson(res, 201, newRecord);
    } catch {
      return sendJson(res, 400, { error: 'JSON inválido' });
    }
  }

  if ((req.method === 'PUT' || req.method === 'PATCH') && idParam) {
    try {
      const body = await parseBody(req);
      const idx = db.files.findIndex(f => String(f.id) === String(idParam));
      if (idx === -1) return sendJson(res, 404, { error: 'Archivo no encontrado' });
      db.files[idx] =
        req.method === 'PUT'
          ? { ...body, id: db.files[idx].id }
          : { ...db.files[idx], ...body, id: db.files[idx].id };
      writeDb(db);
      return sendJson(res, 200, db.files[idx]);
    } catch {
      return sendJson(res, 400, { error: 'JSON inválido' });
    }
  }

  if (req.method === 'DELETE' && idParam) {
    const idx = db.files.findIndex(f => String(f.id) === String(idParam));
    if (idx === -1) return sendJson(res, 404, { error: 'Archivo no encontrado' });
    db.files.splice(idx, 1);
    writeDb(db);
    return sendJson(res, 200, {});
  }

  return sendJson(res, 405, { error: 'Método no permitido' });
});

server.listen(PORT, () => {
  console.log(`JSON Server corriendo sobre db.json en http://localhost:${PORT}/files`);
});
