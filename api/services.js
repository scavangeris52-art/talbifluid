/**
 * TALBI'FLUID — Vercel Serverless Function
 * GET /api/services — Retourne la liste des services / tarifs
 *
 * Pour modifier les tarifs : éditez le tableau `SERVICES` ci-dessous,
 * puis faites un git push → redéploiement automatique sur Vercel.
 */

const SERVICES = [
  {
    id: 1,
    name: 'Détection de fuite',
    category: 'Plomberie',
    price: 49,
    description: 'Diagnostic complet avec rapport',
    featured: false,
    active: true
  },
  {
    id: 2,
    name: 'Entretien chaudière',
    category: 'Chauffage',
    price: 89,
    description: 'Révision complète + attestation',
    featured: true,
    active: true
  },
  {
    id: 3,
    name: 'Installation climatisation',
    category: 'Climatisation',
    price: 799,
    description: 'Fourniture + pose + mise en service',
    featured: false,
    active: true
  },
  {
    id: 4,
    name: 'Débouchage canalisation',
    category: 'Plomberie',
    price: 120,
    description: 'Débouchage haute pression',
    featured: false,
    active: true
  },
  {
    id: 5,
    name: 'Remplacement chauffe-eau',
    category: 'Plomberie',
    price: 450,
    description: 'Fourniture + installation + mise en service',
    featured: false,
    active: true
  }
];

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const active = SERVICES
    .filter(s => s.active)
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  return res.status(200).json(active);
};
