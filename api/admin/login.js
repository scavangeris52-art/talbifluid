/**
 * TALBI'FLUID — Vercel Serverless Function
 * POST /api/admin/login — Authentification admin avec JWT
 *
 * Utilise bcrypt pour vérifier le mot de passe hashé
 * Retourne un JWT token pour les requêtes suivantes
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-2025';
const TOKEN_EXPIRY = '7d';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'Username et password requis' });
  }

  // Get admin credentials from environment variables
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPassHash = process.env.ADMIN_PASS_HASH;

  if (!adminPassHash) {
    return res.status(500).json({ error: 'Configuration erreur: ADMIN_PASS_HASH non défini' });
  }

  if (username !== adminUser) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  try {
    const isMatch = await bcrypt.compare(password, adminPassHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Générer JWT token
    const token = jwt.sign(
      { user: username },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
