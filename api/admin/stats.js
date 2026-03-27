/**
 * TALBI'FLUID — Vercel Serverless Function
 * GET /api/admin/stats — Statistiques admin (requiert JWT)
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = verifyAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const contacts = readDb('contacts');
  const reviews = readDb('reviews');
  const approved = reviews.filter(r => r.approved);
  const avgRating = approved.length
    ? (approved.reduce((s, r) => s + r.rating, 0) / approved.length).toFixed(1)
    : '—';

  return res.status(200).json({
    pendingContacts: contacts.filter(c => c.status === 'pending').length,
    totalContacts:   contacts.length,
    pendingReviews:  reviews.filter(r => !r.approved).length,
    totalReviews:    approved.length,
    avgRating
  });
};
