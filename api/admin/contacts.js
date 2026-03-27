/**
 * TALBI'FLUID — Vercel Serverless Function
 * GET  /api/admin/contacts — Liste des demandes de contact
 * PATCH /api/admin/contacts/:id — Mettre à jour une demande
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  // GET /api/admin/contacts
  if (req.method === 'GET') {
    let contacts = readDb('contacts').reverse();
    if (req.query.status) {
      contacts = contacts.filter(c => c.status === req.query.status);
    }
    return res.status(200).json(contacts);
  }

  // PATCH /api/admin/contacts/:id
  if (req.method === 'PATCH') {
    const id = parseInt(req.url.split('/').pop());
    const contacts = readDb('contacts');
    const idx = contacts.findIndex(c => c.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Non trouvé' });
    }

    contacts[idx] = { ...contacts[idx], ...req.body };
    writeDb('contacts', contacts);

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
