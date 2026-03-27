/**
 * TALBI'FLUID — Vercel Serverless Function
 * GET  /api/reviews — Retourne les avis publiés depuis la BD JSON
 * POST /api/reviews — Soumet un nouvel avis (sauvegardé en BD)
 *
 * Les avis sont stockés dans backend/data/reviews.json et gérés via l'admin.
 */

const nodemailer = require('nodemailer');
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

function writeDb(name, data) {
  try {
    const file = path.join(getDataDir(), name + '.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('DB write error:', err.message);
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — retourner les avis approuvés
  if (req.method === 'GET') {
    const reviews = readDb('reviews')
      .filter(r => r.approved)
      .reverse();

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(reviews);
  }

  // POST — recevoir un nouvel avis
  if (req.method === 'POST') {
    const { name, service, rating, text } = req.body || {};

    if (!name || !rating || !text) {
      return res.status(400).json({ error: 'Champs manquants' });
    }

    try {
      // Sauvegarder l'avis en attente d'approbation
      const reviews = readDb('reviews');
      const id = reviews.length > 0 ? Math.max(...reviews.map(r => r.id || 0)) + 1 : 1;
      const entry = {
        id,
        name,
        service: service || '',
        rating: +rating,
        text,
        approved: false,
        created_at: new Date().toISOString()
      };
      reviews.push(entry);
      writeDb('reviews', reviews);
    } catch (err) {
      console.warn('Could not save review:', err.message);
    }

    // Envoyer email à l'admin pour modération
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const stars = '★'.repeat(+rating) + '☆'.repeat(5 - +rating);
      const transporter = nodemailer.createTransport({
        host:   process.env.SMTP_HOST || 'smtp.gmail.com',
        port:   parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });

      try {
        await transporter.sendMail({
          from:    `"TALBI'FLUID Avis" <${process.env.SMTP_USER}>`,
          to:      process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          subject: `⭐ Nouvel avis client — ${stars} — ${name}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
              <div style="background:#0f2044;padding:20px;text-align:center">
                <h2 style="color:white;margin:0">Nouvel avis client à valider</h2>
              </div>
              <div style="padding:24px;background:#f8fafc">
                <p><strong>Nom :</strong> ${name}</p>
                <p><strong>Service :</strong> ${service || 'Non précisé'}</p>
                <p><strong>Note :</strong> <span style="color:#f59e0b;font-size:1.3rem">${stars}</span> (${rating}/5)</p>
                <div style="padding:16px;background:white;border-radius:8px;border-left:4px solid #f59e0b;margin-top:12px">
                  <em>${text}</em>
                </div>
                <p style="margin-top:16px;font-size:0.85rem;color:#64748b">
                  Validez cet avis dans le panel d'administration: <code>/admin</code>
                </p>
              </div>
            </div>
          `
        });
      } catch (err) {
        console.error('Email avis error:', err.message);
      }
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
