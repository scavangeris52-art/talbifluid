/**
 * TALBI'FLUID — Vercel Serverless Function
 * POST   /api/admin/services — Ajouter un service
 * PATCH  /api/admin/services/:id — Modifier un service
 * DELETE /api/admin/services/:id — Supprimer un service
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-2025';

const getDataDir = () => {
  return path.join(process.cwd(), 'backend', 'data');
};

function readDb(name) {
  try {
    const file = path.join(getDataDir(), name + '.json');
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {
    console.error('DB read error:', err.message);
  }
  return [];
}

function writeDb(name, data) {
  try {
    const file = path.join(getDataDir(), name + '.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('DB write error:', err.message);
  }
}

function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  // POST /api/admin/services
  if (req.method === 'POST') {
    const services = readDb('services');
    const id = services.length > 0 ? Math.max(...services.map(s => s.id || 0)) + 1 : 1;
    const entry = { id, active: true, featured: false, ...req.body };
    services.push(entry);
    writeDb('services', services);
    return res.status(200).json({ success: true, id });
  }

  // Extraire l'ID depuis l'URL
  const id = parseInt(req.url.split('/').pop());

  // PATCH /api/admin/services/:id
  if (req.method === 'PATCH') {
    const services = readDb('services');
    const idx = services.findIndex(s => s.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Non trouvé' });
    }

    services[idx] = { ...services[idx], ...req.body };
    writeDb('services', services);
    return res.status(200).json({ success: true });
  }

  // DELETE /api/admin/services/:id
  if (req.method === 'DELETE') {
    const services = readDb('services').filter(s => s.id !== id);
    writeDb('services', services);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
