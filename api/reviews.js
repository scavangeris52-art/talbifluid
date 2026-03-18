/**
 * TALBI'FLUID — Vercel Serverless Function
 * GET  /api/reviews — Retourne les avis publiés
 * POST /api/reviews — Soumet un nouvel avis (envoyé par email à l'admin)
 *
 * Les avis affichés sont définis ici.
 * Pour en ajouter un après validation : ajoutez-le dans REVIEWS et git push.
 */

const nodemailer = require('nodemailer');

const REVIEWS = [
  {
    id: 1,
    name: 'Marie L.',
    service: 'Plomberie',
    rating: 5,
    text: 'Intervention ultra rapide suite à une fuite importante. Le technicien était professionnel, propre et efficace. Je recommande vivement TALBI\'FLUID !',
    date: 'Mars 2025'
  },
  {
    id: 2,
    name: 'Jean-Pierre B.',
    service: 'Chauffage',
    rating: 5,
    text: 'Entretien chaudière réalisé dans les règles de l\'art. Devis respecté, travail soigné. Personnel très agréable. Je referai appel à eux sans hésiter.',
    date: 'Février 2025'
  },
  {
    id: 3,
    name: 'Sophie M.',
    service: 'Climatisation',
    rating: 5,
    text: 'Installation d\'une pompe à chaleur parfaitement réalisée. Bilan énergétique excellent. Équipe sérieuse et à l\'écoute. Merci à toute l\'équipe TALBI\'FLUID !',
    date: 'Janvier 2025'
  },
  {
    id: 4,
    name: 'Thomas R.',
    service: 'Dépannage urgent',
    rating: 5,
    text: 'Dépannage WC bouché en urgence le dimanche matin. Arrivée en 45 minutes. Problème résolu en 30 minutes. Tarif raisonnable. Très satisfait !',
    date: 'Décembre 2024'
  },
  {
    id: 5,
    name: 'Amélie D.',
    service: 'Rénovation',
    rating: 5,
    text: 'Rénovation complète de notre salle de bain. Travail impeccable, respect des délais et du budget. La salle de bain est magnifique. Un grand merci !',
    date: 'Novembre 2024'
  },
  {
    id: 6,
    name: 'Philippe V.',
    service: 'Chauffage',
    rating: 4,
    text: 'Très bon service, technicien compétent et ponctuel. Je recommande.',
    date: 'Octobre 2024'
  }
];

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — retourner les avis
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(REVIEWS);
  }

  // POST — recevoir un nouvel avis et notifier l'admin par email
  if (req.method === 'POST') {
    const { name, service, rating, text } = req.body || {};

    if (!name || !rating || !text) {
      return res.status(400).json({ error: 'Champs manquants' });
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      // SMTP non configuré — on accepte quand même pour l'UX
      return res.status(200).json({ success: true });
    }

    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const stars = '★'.repeat(+rating) + '☆'.repeat(5 - +rating);

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
                Pour publier cet avis, ajoutez-le dans <code>api/reviews.js</code> et faites un git push.
              </p>
            </div>
          </div>
        `
      });
    } catch (err) {
      console.error('Email avis error:', err.message);
    }

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
