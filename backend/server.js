/**
 * TALBI'FLUID — Backend Node.js + Express
 * Stockage : fichiers JSON (aucune compilation native requise)
 *
 * Démarrage :
 *   npm install
 *   node server.js
 */

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARES ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir le frontend statique (dossier parent)
app.use(express.static(path.join(__dirname, '..')));

// ========== BASE DE DONNÉES JSON ==========
const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

function dbFile(name) { return path.join(DB_DIR, name + '.json'); }

function readDb(name) {
  const file = dbFile(name);
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}

function writeDb(name, data) {
  fs.writeFileSync(dbFile(name), JSON.stringify(data, null, 2), 'utf8');
}

function nextId(collection) {
  const items = readDb(collection);
  return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

function now() { return new Date().toISOString(); }

// Données par défaut — services
if (!fs.existsSync(dbFile('services'))) {
  writeDb('services', [
    { id:1, name:'Détection de fuite',       category:'Plomberie',      price:49,  description:'Diagnostic complet avec rapport',          featured:false, active:true },
    { id:2, name:'Entretien chaudière',       category:'Chauffage',      price:89,  description:'Révision complète + attestation',           featured:true,  active:true },
    { id:3, name:'Installation climatisation',category:'Climatisation',  price:799, description:'Fourniture + pose + mise en service',       featured:false, active:true },
  ]);
}

// ========== EMAIL (Nodemailer) ==========
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'votre@email.com',
    pass: process.env.SMTP_PASS || 'votre-mot-de-passe'
  }
});

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: '"TALBI\'FLUID" <contact@talbifluid.fr>',
      to, subject, html
    });
  } catch (err) {
    // Ne pas bloquer l'API si l'email échoue
    console.warn('Email non envoyé (SMTP non configuré):', err.message);
  }
}

// ========== ROUTES CONTACT ==========
app.post('/api/contact', (req, res) => {
  const { name, phone, email, service, address, message, lang } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Nom et téléphone requis' });

  const contacts = readDb('contacts');
  const entry = {
    id: nextId('contacts'),
    name, phone,
    email:   email   || '',
    service: service || '',
    address: address || '',
    message: message || '',
    lang:    lang    || 'fr',
    status: 'pending',
    created_at: now()
  };
  contacts.push(entry);
  writeDb('contacts', contacts);

  sendEmail(
    process.env.ADMIN_EMAIL || 'admin@talbifluid.fr',
    `Nouvelle demande — ${service || 'Site web'}`,
    `<h2>Nouvelle demande de contact</h2>
     <p><strong>Nom :</strong> ${name}</p>
     <p><strong>Téléphone :</strong> ${phone}</p>
     <p><strong>Email :</strong> ${email || 'Non renseigné'}</p>
     <p><strong>Service :</strong> ${service || 'Non précisé'}</p>
     <p><strong>Message :</strong> ${message || 'Aucun message'}</p>`
  );

  res.json({ success: true, id: entry.id });
});

app.get('/api/contacts', adminAuth, (req, res) => {
  let contacts = readDb('contacts').reverse();
  if (req.query.status) contacts = contacts.filter(c => c.status === req.query.status);
  res.json(contacts);
});

app.patch('/api/contacts/:id', adminAuth, (req, res) => {
  const contacts = readDb('contacts');
  const idx = contacts.findIndex(c => c.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Non trouvé' });
  contacts[idx] = { ...contacts[idx], ...req.body };
  writeDb('contacts', contacts);
  res.json({ success: true });
});

// ========== ROUTES AVIS ==========
app.post('/api/reviews', (req, res) => {
  const { name, service, rating, text } = req.body;
  if (!name || !rating || !text) return res.status(400).json({ error: 'Champs manquants' });

  const reviews = readDb('reviews');
  const entry = {
    id: nextId('reviews'),
    name, service: service || '',
    rating: +rating, text,
    approved: false,
    created_at: now()
  };
  reviews.push(entry);
  writeDb('reviews', reviews);
  res.json({ success: true, id: entry.id });
});

app.get('/api/reviews', (req, res) => {
  const reviews = readDb('reviews').filter(r => r.approved).reverse();
  res.json(reviews);
});

app.get('/api/reviews/pending', adminAuth, (req, res) => {
  res.json(readDb('reviews').filter(r => !r.approved).reverse());
});

app.patch('/api/reviews/:id/approve', adminAuth, (req, res) => {
  const reviews = readDb('reviews');
  const idx = reviews.findIndex(r => r.id === +req.params.id);
  if (idx !== -1) { reviews[idx].approved = true; writeDb('reviews', reviews); }
  res.json({ success: true });
});

app.delete('/api/reviews/:id', adminAuth, (req, res) => {
  writeDb('reviews', readDb('reviews').filter(r => r.id !== +req.params.id));
  res.json({ success: true });
});

// ========== ROUTES ARTICLES BLOG ==========
app.get('/api/articles', (req, res) => {
  const articles = readDb('articles').filter(a => a.published).reverse();
  res.json(articles);
});

app.get('/api/articles/:slug', (req, res) => {
  const article = readDb('articles').find(a => a.slug === req.params.slug && a.published);
  if (!article) return res.status(404).json({ error: 'Article non trouvé' });
  res.json(article);
});

app.get('/api/admin/articles', adminAuth, (req, res) => {
  res.json(readDb('articles').reverse());
});

app.post('/api/admin/articles', adminAuth, (req, res) => {
  const { title, category, excerpt, content, published } = req.body;
  const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const articles = readDb('articles');
  const entry = {
    id: nextId('articles'),
    title, slug, category: category || '',
    excerpt: excerpt || '', content: content || '',
    published: !!published,
    created_at: now(), updated_at: now()
  };
  articles.push(entry);
  writeDb('articles', articles);
  res.json({ success: true, id: entry.id, slug });
});

app.patch('/api/admin/articles/:id', adminAuth, (req, res) => {
  const articles = readDb('articles');
  const idx = articles.findIndex(a => a.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Non trouvé' });
  articles[idx] = { ...articles[idx], ...req.body, updated_at: now() };
  writeDb('articles', articles);
  res.json({ success: true });
});

app.delete('/api/admin/articles/:id', adminAuth, (req, res) => {
  writeDb('articles', readDb('articles').filter(a => a.id !== +req.params.id));
  res.json({ success: true });
});

// ========== ROUTES SERVICES / TARIFS ==========
app.get('/api/services', (req, res) => {
  const services = readDb('services').filter(s => s.active)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  res.json(services);
});

app.post('/api/admin/services', adminAuth, (req, res) => {
  const services = readDb('services');
  const entry = { id: nextId('services'), active: true, featured: false, ...req.body };
  services.push(entry);
  writeDb('services', services);
  res.json({ success: true, id: entry.id });
});

app.patch('/api/admin/services/:id', adminAuth, (req, res) => {
  const services = readDb('services');
  const idx = services.findIndex(s => s.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Non trouvé' });
  services[idx] = { ...services[idx], ...req.body };
  writeDb('services', services);
  res.json({ success: true });
});

app.delete('/api/admin/services/:id', adminAuth, (req, res) => {
  writeDb('services', readDb('services').filter(s => s.id !== +req.params.id));
  res.json({ success: true });
});

// ========== AUTH ADMIN ==========
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const u = process.env.ADMIN_USER || 'admin';
  const p = process.env.ADMIN_PASS || 'admin123';
  if (username === u && password === p) {
    res.json({ success: true, token: 'talbi-admin-token-2025' });
  } else {
    res.status(401).json({ error: 'Identifiants incorrects' });
  }
});

// ========== STATISTIQUES ADMIN ==========
app.get('/api/admin/stats', adminAuth, (req, res) => {
  const contacts = readDb('contacts');
  const reviews  = readDb('reviews');
  const approved = reviews.filter(r => r.approved);
  const avgRating = approved.length
    ? (approved.reduce((s, r) => s + r.rating, 0) / approved.length).toFixed(1)
    : '—';
  res.json({
    pendingContacts: contacts.filter(c => c.status === 'pending').length,
    totalContacts:   contacts.length,
    pendingReviews:  reviews.filter(r => !r.approved).length,
    totalReviews:    approved.length,
    avgRating
  });
});

// ========== MIDDLEWARE AUTH ==========
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token === 'talbi-admin-token-2025' || process.env.NODE_ENV === 'development') {
    return next();
  }
  res.status(401).json({ error: 'Non autorisé' });
}

// ========== FALLBACK SPA ==========
app.get(/^(?!\/api).*/, (req, res) => {
  const file = path.join(__dirname, '..', req.path.endsWith('.html') ? req.path : 'index.html');
  res.sendFile(fs.existsSync(file) ? file : path.join(__dirname, '..', 'index.html'));
});

// ========== DÉMARRAGE ==========
app.listen(PORT, () => {
  console.log(`\n🚀 TALBI'FLUID Backend démarré !`);
  console.log(`   Site  : http://localhost:${PORT}`);
  console.log(`   Admin : http://localhost:${PORT}/admin`);
  console.log(`   API   : http://localhost:${PORT}/api`);
  console.log(`\n   Ctrl+C pour arrêter\n`);
});

module.exports = app;
