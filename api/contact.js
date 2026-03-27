/**
 * TALBI'FLUID — Vercel Serverless Function
 * POST /api/contact — Reçoit les demandes et envoie un email au gérant
 *
 * En Vercel, ce fichier est automatiquement déployé en serverless function.
 * Configuration dans vercel.json
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Pour accéder aux fichiers JSON en production Vercel
const getDataDir = () => {
  // Sur Vercel, utiliser /tmp ou le répertoire partagé
  // Mais pour la démo, on peut stocker dans une base de données externe
  // Pour l'instant, on accepte la demande sans la persister
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
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, service, address, disponibilite, message, lang } = req.body || {};

  if (!name || !phone) {
    return res.status(400).json({ error: 'Nom et téléphone requis' });
  }

  // Libellés multilingues pour l'email
  const labels = {
    fr: { subject: `🔧 Nouvelle demande — ${service || 'Contact'}`, received: 'Reçu le' },
    en: { subject: `🔧 New request — ${service || 'Contact'}`,    received: 'Received on' },
    es: { subject: `🔧 Nueva solicitud — ${service || 'Contacto'}`, received: 'Recibido el' }
  };
  const l = labels[lang] || labels.fr;

  // Sauvegarder dans la BD locale (même en Vercel cela fonctionne en dev)
  try {
    const contacts = readDb('contacts');
    const id = contacts.length > 0 ? Math.max(...contacts.map(c => c.id || 0)) + 1 : 1;
    const entry = {
      id,
      name, phone,
      email: email || '',
      service: service || '',
      address: address || '',
      message: message || '',
      lang: lang || 'fr',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    contacts.push(entry);
    writeDb('contacts', contacts);
  } catch (err) {
    console.warn('Could not save to DB:', err.message);
  }

  // Envoyer email
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#0f2044,#1a73e8);padding:28px 24px;text-align:center">
          <h1 style="color:white;margin:0;font-size:1.3rem;font-weight:800">TALBI<span style="color:#fbbf24">'FLUID</span></h1>
          <p style="color:rgba(255,255,255,.8);margin:6px 0 0;font-size:0.9rem">Nouvelle demande reçue via le site web</p>
        </div>

        <div style="padding:28px 24px;background:#f8fafc">
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)">
            <tr style="background:#f1f5f9">
              <td style="padding:12px 16px;font-weight:700;color:#64748b;font-size:0.85rem;width:160px">👤 Nom</td>
              <td style="padding:12px 16px;font-weight:700;font-size:1rem">${name}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:700;color:#64748b;font-size:0.85rem">📞 Téléphone</td>
              <td style="padding:12px 16px"><a href="tel:${phone}" style="color:#1a73e8;font-weight:700;font-size:1.05rem">${phone}</a></td>
            </tr>
            <tr style="background:#f1f5f9">
              <td style="padding:12px 16px;font-weight:700;color:#64748b;font-size:0.85rem">📧 Email</td>
              <td style="padding:12px 16px">${email ? `<a href="mailto:${email}" style="color:#1a73e8">${email}</a>` : '<span style="color:#94a3b8">Non renseigné</span>'}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;font-weight:700;color:#64748b;font-size:0.85rem">🔧 Service</td>
              <td style="padding:12px 16px"><span style="background:#e8f4fd;color:#1a73e8;padding:4px 12px;border-radius:50px;font-weight:600;font-size:0.9rem">${service || 'Non précisé'}</span></td>
            </tr>
            ${address ? `<tr style="background:#f1f5f9"><td style="padding:12px 16px;font-weight:700;color:#64748b;font-size:0.85rem">📍 Adresse</td><td style="padding:12px 16px">${address}</td></tr>` : ''}
            ${disponibilite ? `<tr><td style="padding:12px 16px;font-weight:700;color:#64748b;font-size:0.85rem">🕐 Disponibilité</td><td style="padding:12px 16px">${disponibilite}</td></tr>` : ''}
          </table>

          ${message ? `
          <div style="margin-top:20px;padding:20px;background:white;border-radius:10px;border-left:4px solid #1a73e8;box-shadow:0 2px 12px rgba(0,0,0,.06)">
            <p style="font-weight:700;color:#64748b;margin:0 0 8px;font-size:0.85rem">💬 MESSAGE</p>
            <p style="margin:0;color:#1e293b;line-height:1.7">${message.replace(/\n/g, '<br>')}</p>
          </div>` : ''}

          <div style="margin-top:24px;text-align:center">
            <a href="tel:${phone}" style="background:#1a73e8;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block">
              📞 Rappeler ${name}
            </a>
          </div>
        </div>

        <div style="padding:16px 24px;text-align:center;color:#94a3b8;font-size:0.78rem;border-top:1px solid #e2e8f0">
          ${l.received} ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })} · Site TALBI'FLUID
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from:    `"TALBI'FLUID Site Web" <${process.env.SMTP_USER}>`,
        to:      process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        replyTo: email || undefined,
        subject: l.subject,
        html:    htmlBody
      });
    } catch (err) {
      console.error('SMTP Error:', err.message);
    }
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({ success: true });
};
