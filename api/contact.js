/**
 * TALBI'FLUID — Vercel Serverless Function
 * POST /api/contact — Reçoit les demandes et envoie un email au gérant
 */

const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('SMTP Error:', err.message);
    // On retourne quand même succès pour ne pas bloquer l'UX
    // (la demande est perdue, mais l'utilisateur ne voit pas d'erreur)
    // En production, logger dans Vercel Dashboard
    return res.status(200).json({ success: true, _warn: 'email_failed' });
  }
};
