/**
 * TALBI'FLUID — Vercel Serverless Function
 * GET /api/services — Retourne la liste des services / tarifs depuis la BD JSON
 *
 * Les services sont stockés dans backend/data/services.json
 * et gérés via l'admin panel pour ajouter/modifier/supprimer des services.
 */

const fs = require('fs');
const path = require('path');

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

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Lire les services depuis la BD JSON
  const services = readDb('services')
    .filter(s => s.active)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  return res.status(200).json(services);
};
