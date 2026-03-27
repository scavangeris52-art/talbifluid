/**
 * TALBI'FLUID — Vercel Serverless Function
 * GET    /api/admin/reviews — Liste des avis en attente
 * PATCH  /api/admin/reviews/:id/approve — Approuver un avis
 * DELETE /api/admin/reviews/:id — Supprimer un avis
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = verifyAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  // GET /api/admin/reviews
  if (req.method === 'GET') {
    const reviews = readDb('reviews').filter(r => !r.approved).reverse();
    return res.status(200).json(reviews);
  }

  // Extraire l'ID depuis l'URL
  const urlParts = req.url.split('/');
  const id = parseInt(urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1]);

  // PATCH /api/admin/reviews/:id/approve
  if (req.method === 'PATCH') {
    const reviews = readDb('reviews');
    const idx = reviews.findIndex(r => r.id === id);

    if (idx !== -1) {
      reviews[idx].approved = true;
      writeDb('reviews', reviews);
    }

    return res.status(200).json({ success: true });
  }

  // DELETE /api/admin/reviews/:id
  if (req.method === 'DELETE') {
    const reviews = readDb('reviews').filter(r => r.id !== id);
    writeDb('reviews', reviews);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
