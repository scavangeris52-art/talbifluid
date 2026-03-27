# Dossier Images — TALBI'FLUID

Ce dossier contient toutes les images optimisées du site web.

## Structure recommandée

```
images/
├── logo/
│   ├── logo-full.png          # Logo complet avec texte
│   ├── logo-icon.png          # Icône logo seule
│   └── logo-white.png         # Logo blanc (pour fond sombre)
├── hero/
│   ├── hero-plomberie.jpg     # Image héros plomberie
│   ├── hero-chauffage.jpg     # Image héros chauffage
│   └── hero-climatisation.jpg # Image héros climatisation
├── services/
│   ├── plomberie-1.jpg
│   ├── chauffage-1.jpg
│   └── climatisation-1.jpg
├── gallery/
│   ├── before-after-1.jpg
│   ├── before-after-2.jpg
│   └── before-after-3.jpg
├── team/
│   ├── hassan-talbi.jpg       # Photo du fondateur
│   └── team-photo.jpg         # Photo d'équipe
├── testimonials/
│   ├── avatar-marie-l.jpg
│   └── avatar-jean-b.jpg
└── icons/
    ├── plumbing.svg
    ├── heating.svg
    └── air-conditioning.svg
```

## Format et optimisation

- **Format recommandé :** WebP pour réduire la taille, PNG comme fallback
- **Résolution :**
  - Hero : 1920x1080 minimum
  - Galerie : 1200x800
  - Avatars : 150x150
- **Taille maximale :** 500 KB par image (après compression)
- **Outil de compression :** TinyPNG, ImageOptim ou Squoosh

## Utilisation dans le HTML

```html
<!-- Avec fallback WebP -->
<picture>
  <source srcset="images/logo/logo-full.webp" type="image/webp">
  <img src="images/logo/logo-full.png" alt="TALBI'FLUID">
</picture>

<!-- Format classique -->
<img src="images/hero/hero-plomberie.jpg" alt="Plomberie" loading="lazy">
```

## Ajouter des images

1. Optimiser l'image (compression + redimensionnement)
2. Placer dans le sous-dossier approprié
3. Mettre à jour le HTML en utilisant `loading="lazy"` pour les images non-visibles
4. Valider sur mobile (images responsive)

## Images urgentes

- Logo complet : **PRIORITAIRE**
- Photos des services (plomberie, chauffage, clim) : Important
- Photos avant/après : Important pour la galerie

## Placeholder temporaires

En attente des vraies images, on peut utiliser :
- `background: linear-gradient(135deg, #e8f4fd, #bfdbfe);` pour les blocs vides
- Emoji (actuellement utilisés) : 🔧 💧 🔥 ❄️ etc.
