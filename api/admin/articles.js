/**
 * TALBI'FLUID — Vercel Serverless Function
 * GET    /api/admin/articles — Liste des articles
 * POST   /api/admin/articles — Créer un article
 * PATCH  /api/admin/articles/:id — Modifier un article
 * DELETE /api/admin/articles/:id — Supprimer un article
 *
 * GET /api/articles — Articles publiés (public)
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

function generateSlug(title) {
  return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/articles (public)
  if (req.method === 'GET' && !req.url.includes('/admin/')) {
    const articles = readDb('articles').filter(a => a.published).reverse();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(articles);
  }

  const user = verifyAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  // GET /api/admin/articles
  if (req.method === 'GET') {
    const articles = readDb('articles').reverse();
    return res.status(200).json(articles);
  }

  // POST /api/admin/articles
  if (req.method === 'POST') {
    const { title, category, excerpt, content, published } = req.body;
    const articles = readDb('articles');
    const id = articles.length > 0 ? Math.max(...articles.map(a => a.id || 0)) + 1 : 1;
    const slug = generateSlug(title);
    const entry = {
      id,
      title, slug, category: category || '',
      excerpt: excerpt || '', content: content || '',
      published: !!published,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    articles.push(entry);
    writeDb('articles', articles);
    return res.status(200).json({ success: true, id, slug });
  }

  // Extraire l'ID depuis l'URL
  const id = parseInt(req.url.split('/').pop());

  // PATCH /api/admin/articles/:id
  if (req.method === 'PATCH') {
    const articles = readDb('articles');
    const idx = articles.findIndex(a => a.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Non trouvé' });
    }

    articles[idx] = {
      ...articles[idx],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    writeDb('articles', articles);
    return res.status(200).json({ success: true });
  }

  // DELETE /api/admin/articles/:id
  if (req.method === 'DELETE') {
    const articles = readDb('articles').filter(a => a.id !== id);
    writeDb('articles', articles);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
