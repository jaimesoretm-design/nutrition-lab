const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 4173;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PLANS_FILE = path.join(DATA_DIR, 'plans.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf8');
if (!fs.existsSync(PLANS_FILE)) fs.writeFileSync(PLANS_FILE, '[]', 'utf8');

function readUsers() { try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return []; } }
function writeUsers(users) { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8'); }
function readPlans() { try { return JSON.parse(fs.readFileSync(PLANS_FILE, 'utf8')); } catch { return []; } }
function writePlans(plans) { fs.writeFileSync(PLANS_FILE, JSON.stringify(plans, null, 2), 'utf8'); }
function send(res, status, payload, type = 'application/json; charset=utf-8') { res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(type.startsWith('application/json') ? JSON.stringify(payload) : payload); }
function body(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', chunk => { raw += chunk; if (raw.length > 100000) req.destroy(); }); req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('JSON inválido')); } }); req.on('error', reject); }); }
function safePath(urlPath) { const requested = urlPath === '/' ? '/index.html' : urlPath.split('?')[0]; const full = path.resolve(ROOT, `.${requested}`); return full.startsWith(ROOT) ? full : null; }

const server = http.createServer(async (req, res) => {
  try {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, { ok: true, service: 'nutrition-lab', timestamp: new Date().toISOString() });
    if (req.method === 'GET' && req.url === '/api/recipes') return send(res, 200, { recipes: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'recipes.json'), 'utf8')) });
    if (req.method === 'GET' && req.url === '/api/foods') return send(res, 200, { foods: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'foods.json'), 'utf8')) });
    if (req.method === 'POST' && req.url === '/api/profile') {
      const input = await body(req);
      if (!input.name || !input.email || Number(input.age) < 18) return send(res, 400, { error: 'Se necesita nombre, correo y una edad de 18 años o más.' });
      const users = readUsers();
      const existing = users.find(user => user.email.toLowerCase() === String(input.email).toLowerCase());
      const profile = { id: existing?.id || crypto.randomUUID(), ...input, updatedAt: new Date().toISOString() };
      if (existing) users[users.indexOf(existing)] = profile; else users.push(profile);
      writeUsers(users);
      return send(res, 200, { profile });
    }
    if (req.method === 'GET' && req.url.startsWith('/api/profile/')) {
      const email = decodeURIComponent(req.url.slice('/api/profile/'.length)).toLowerCase();
      const profile = readUsers().find(user => user.email.toLowerCase() === email);
      return profile ? send(res, 200, { profile }) : send(res, 404, { error: 'Perfil no encontrado.' });
    }
    if (req.method === 'POST' && req.url === '/api/plan') {
      const input = await body(req);
      if (!input.email || !Array.isArray(input.days)) return send(res, 400, { error: 'El plan necesita un correo y los días de la semana.' });
      const plans = readPlans();
      const plan = { id: input.id || crypto.randomUUID(), email: input.email, days: input.days, updatedAt: new Date().toISOString() };
      const index = plans.findIndex(item => item.email.toLowerCase() === input.email.toLowerCase());
      if (index >= 0) plans[index] = plan; else plans.push(plan);
      writePlans(plans);
      return send(res, 200, { plan });
    }
    if (req.method === 'GET' && req.url.startsWith('/api/plan/')) {
      const email = decodeURIComponent(req.url.slice('/api/plan/'.length)).toLowerCase();
      const plan = readPlans().find(item => item.email.toLowerCase() === email);
      return plan ? send(res, 200, { plan }) : send(res, 404, { error: 'Plan no encontrado.' });
    }
    if (req.method === 'GET') {
      const file = safePath(req.url);
      if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
      const ext = path.extname(file).toLowerCase();
      const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' };
      return send(res, 200, fs.readFileSync(file), types[ext] || 'application/octet-stream');
    }
    send(res, 405, { error: 'Método no permitido.' });
  } catch (error) { send(res, 500, { error: 'No se pudo completar la operación.' }); }
});

server.listen(PORT, '0.0.0.0', () => console.log(`Nutrition Lab disponible en http://localhost:${PORT}`));
