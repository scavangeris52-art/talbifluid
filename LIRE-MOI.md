# TALBI'FLUID — Guide de démarrage

## Structure des fichiers

```
Plomberie/
├── index.html          ← Page d'accueil
├── services.html       ← Page services
├── urgence.html        ← Page urgence 24h/24
├── about.html          ← Page à propos
├── avis.html           ← Avis clients
├── blog.html           ← Blog
├── contact.html        ← Contact & devis
├── admin/
│   └── index.html      ← Panel administrateur
├── css/
│   └── main.css        ← Styles globaux
├── js/
│   ├── main.js         ← JavaScript principal
│   └── i18n.js         ← Système multilingue (FR/EN/ES)
└── backend/
    ├── server.js       ← API Node.js
    ├── package.json    ← Dépendances
    └── .env.example    ← Variables d'environnement
```

## Ouvrir le site (mode statique, sans backend)

Double-cliquez simplement sur `index.html` — le site fonctionne immédiatement !

## Démarrer le backend (mode complet)

```bash
cd backend
npm install
node server.js
```

Puis ouvrez : http://localhost:3000

## Accéder à l'administration

URL : `/admin/index.html`
Login : **admin**
Mot de passe : **admin123**

## Personnalisation rapide

### Changer le numéro de téléphone
Rechercher `+33 6 12 34 56 78` dans tous les fichiers HTML et remplacer par votre numéro.

### Changer les couleurs
Dans `css/main.css`, modifier les variables CSS au début du fichier :
```css
--primary: #1a73e8;   /* Bleu principal */
--accent:  #ff6b35;   /* Orange accent */
```

### Changer les textes
- Éditer directement les fichiers HTML
- Ou utiliser le panel admin → Textes du site
- Les traductions sont dans `js/i18n.js`

## Mise en ligne (hébergement)

### Option 1 — Simple (site statique)
Uploadez tous les fichiers sauf `backend/` sur :
- OVH, Infomaniak, o2switch (FTP)
- Netlify, Vercel (glisser-déposer)

### Option 2 — Complet (avec backend)
Hébergement VPS ou cloud (OVH, DigitalOcean, Render) :
```bash
npm install pm2 -g
pm2 start backend/server.js --name talbifluid
pm2 save
```

## SEO — Checklist

- [ ] Modifier les meta description dans chaque page HTML
- [ ] Créer un compte Google Business Profile
- [ ] Soumettre le sitemap sur Google Search Console
- [ ] Ajouter votre numéro réel et adresse
- [ ] Publier 1 article de blog par semaine
- [ ] Demander des avis Google à vos clients
