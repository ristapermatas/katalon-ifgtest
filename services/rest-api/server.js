'use strict';

const http = require('node:http');
const { Pool } = require('pg');

const port = Number(process.env.PORT || 8080);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(Object.assign(new Error('Request body too large'), { statusCode: 413 }));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(Object.assign(new Error('Request body must be valid JSON'), { statusCode: 400 }));
      }
    });
    request.on('error', reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'GET' && url.pathname === '/health') {
    try {
      await pool.query('SELECT 1');
      return sendJson(response, 200, { status: 'ok', database: 'connected' });
    } catch {
      return sendJson(response, 503, { status: 'unavailable', database: 'disconnected' });
    }
  }

  if (request.method === 'POST' && url.pathname === '/records') {
    try {
      const input = await readJson(request);
      if (typeof input.name !== 'string' || !input.name.trim() ||
          typeof input.job !== 'string' || !input.job.trim()) {
        return sendJson(response, 400, { error: 'name and job must be non-empty strings' });
      }
      const result = await pool.query(
        'INSERT INTO records (name, job) VALUES ($1, $2) RETURNING id, name, job, created_at',
        [input.name.trim(), input.job.trim()]
      );
      return sendJson(response, 201, result.rows[0]);
    } catch (error) {
      return sendJson(response, error.statusCode || 500, { error: error.message || 'Internal server error' });
    }
  }

  if (request.method === 'GET' && url.pathname === '/records') {
    try {
      const result = await pool.query(
        'SELECT id, name, job, created_at FROM records ORDER BY id'
      );
      return sendJson(response, 200, result.rows);
    } catch {
      return sendJson(response, 500, { error: 'Internal server error' });
    }
  }

  const recordMatch = url.pathname.match(/^\/records\/(\d+)$/);
  if (request.method === 'GET' && recordMatch) {
    try {
      const result = await pool.query(
        'SELECT id, name, job, created_at FROM records WHERE id = $1',
        [recordMatch[1]]
      );
      if (result.rowCount === 0) return sendJson(response, 404, { error: 'Record not found' });
      return sendJson(response, 200, result.rows[0]);
    } catch {
      return sendJson(response, 500, { error: 'Internal server error' });
    }
  }

  return sendJson(response, 404, { error: 'Route not found' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`IFG REST API listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
