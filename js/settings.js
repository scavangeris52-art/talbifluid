/* ======================================================
   TALBI'FLUID — Système de paramètres dynamiques
   Stockage : JSONBin.io (gratuit)
   Les visiteurs voient toujours les derniers paramètres
====================================================== */

const SETTINGS_DEFAULTS = {
  phone:              '+33 7 81 62 61 23',
  email:              'contact@talbifluid.fr',
  hours:              'Lun–Ven 8h–19h · Sam 9h–17h · Urgences 24/7',
  urgenceHours:       'Urgences 24h/24 · 7j/7',
  heroTitle:          'Votre expert plomberie,',
  heroTitleLine2:     'chauffage & climatisation',
  heroSubtitle:       'Dépannage 24h/24, installation et maintenance par des professionnels certifiés. Devis gratuit et intervention rapide dans toute la région.',
  urgenceBanner:      'Fuite d\'eau, dégât des eaux, panne de chauffage — nous intervenons en moins d\'1h',
  zone:               'Département de l\'Hérault',
  price1Name:         'Détection de fuite',
  price1Amount:       '49',
  price1Desc:         'Diagnostic complet avec rapport',
  price2Name:         'Entretien chaudière',
  price2Amount:       '89',
  price2Desc:         'Révision complète + attestation',
  price3Name:         'Installation climatisation',
  price3Amount:       '799',
  price3Desc:         'Fourniture + pose + mise en service',
};

/* ── Récupère les IDs/clés depuis localStorage ── */
function getBinId()       { return localStorage.getItem('tf_bin_id') || ''; }
function getMasterKey()   { return localStorage.getItem('tf_master_key') || ''; }
function getPhotosBinId() { return localStorage.getItem('tf_photos_bin_id') || ''; }

/* ── Cache localStorage (fonctionne sans JSONBin) ── */
function getLocalSettings() {
  try {
    const raw = localStorage.getItem('tf_settings_cache');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/* ── Charge les paramètres : JSONBin → cache local → défauts ── */
async function loadSettings() {
  const binId = getBinId();

  /* 1. Appliquer immédiatement le cache local (pas d'attente réseau) */
  const cached = getLocalSettings();
  if (cached) applySettings({ ...SETTINGS_DEFAULTS, ...cached });

  /* 2. Essayer JSONBin en arrière-plan si configuré */
  if (binId) {
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
        headers: { 'X-Bin-Meta': 'false' }
      });
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      const settings = { ...SETTINGS_DEFAULTS, ...data };
      /* Mettre à jour le cache local avec les données distantes */
      localStorage.setItem('tf_settings_cache', JSON.stringify(settings));
      applySettings(settings);
      return settings;
    } catch {}
  }

  /* 3. Fallback : cache local ou défauts */
  const fallback = { ...SETTINGS_DEFAULTS, ...(cached || {}) };
  applySettings(fallback);
  return fallback;
}

/* ── Sauvegarde les paramètres dans JSONBin ── */
async function saveSettings(settings) {
  const binId     = getBinId();
  const masterKey = getMasterKey();
  if (!binId || !masterKey) {
    alert('⚠️ Bin ID ou Master Key manquant. Vérifiez la configuration JSONBin dans Paramètres.');
    return false;
  }
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': masterKey },
      body:    JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('save failed');
    return true;
  } catch {
    alert('❌ Erreur de sauvegarde. Vérifiez votre Master Key JSONBin.');
    return false;
  }
}

/* ── Crée un nouveau Bin avec les valeurs par défaut ── */
async function createBin(masterKey) {
  const res = await fetch('https://api.jsonbin.io/v3/b', {
    method:  'POST',
    headers: {
      'Content-Type':   'application/json',
      'X-Master-Key':   masterKey,
      'X-Bin-Name':     'talbifluid-settings',
      'X-Bin-Private':  'false'
    },
    body: JSON.stringify(SETTINGS_DEFAULTS)
  });
  if (!res.ok) throw new Error('create failed');
  const data = await res.json();
  return data.metadata.id;
}

/* ── Applique les paramètres sur les éléments du DOM ── */
function applySettings(s) {
  const set = (sel, val) => {
    document.querySelectorAll(sel).forEach(el => {
      if (el.tagName === 'A' && el.href.startsWith('tel:')) {
        el.href = 'tel:' + val.replace(/[\s.]/g, '');
        el.textContent = val;
      } else if (el.tagName === 'A' && el.href.startsWith('mailto:')) {
        el.href = 'mailto:' + val;
        el.textContent = val;
      } else {
        el.textContent = val;
      }
    });
  };

  /* Téléphone */
  document.querySelectorAll('[data-s="phone"]').forEach(el => {
    if (el.tagName === 'A') {
      el.href = 'tel:' + s.phone.replace(/[\s.]/g, '');
    }
    el.textContent = s.phone;
  });

  /* Email */
  document.querySelectorAll('[data-s="email"]').forEach(el => {
    if (el.tagName === 'A') el.href = 'mailto:' + s.email;
    el.textContent = s.email;
  });

  /* Horaires */
  set('[data-s="hours"]',         s.hours);
  set('[data-s="urgenceHours"]',  s.urgenceHours);

  /* Hero */
  set('[data-s="heroTitle"]',     s.heroTitle);
  set('[data-s="heroTitleLine2"]',s.heroTitleLine2);
  set('[data-s="heroSubtitle"]',  s.heroSubtitle);

  /* Bannière urgence */
  set('[data-s="urgenceBanner"]', s.urgenceBanner);

  /* Zone */
  set('[data-s="zone"]',          s.zone);

  /* Tarifs */
  set('[data-s="price1Name"]',    s.price1Name);
  set('[data-s="price1Amount"]',  s.price1Amount);
  set('[data-s="price1Desc"]',    s.price1Desc);
  set('[data-s="price2Name"]',    s.price2Name);
  set('[data-s="price2Amount"]',  s.price2Amount);
  set('[data-s="price2Desc"]',    s.price2Desc);
  set('[data-s="price3Name"]',    s.price3Name);
  set('[data-s="price3Amount"]',  s.price3Amount);
  set('[data-s="price3Desc"]',    s.price3Desc);
}

/* ══════════════════════════════════════════════════════
   PHOTOS AVANT / APRÈS
══════════════════════════════════════════════════════ */

/* ── Charge les photos : JSONBin → cache local → vide ── */
async function loadPhotos() {
  /* Appliquer le cache local immédiatement */
  try {
    const raw = localStorage.getItem('tf_photos_cache');
    if (raw) {
      const cached = JSON.parse(raw);
      if (Array.isArray(cached) && cached.length > 0) applyPhotos(cached);
    }
  } catch {}

  /* Essayer JSONBin si configuré */
  const binId = getPhotosBinId();
  if (!binId) {
    try {
      const raw = localStorage.getItem('tf_photos_cache');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Bin-Meta': 'false' }
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const photos = Array.isArray(data) ? data : [];
    localStorage.setItem('tf_photos_cache', JSON.stringify(photos));
    applyPhotos(photos);
    return photos;
  } catch {
    try {
      const raw = localStorage.getItem('tf_photos_cache');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
}

/* ── Sauvegarde les photos dans JSONBin ── */
async function savePhotos(photos) {
  const binId     = getPhotosBinId();
  const masterKey = getMasterKey();
  if (!binId || !masterKey) return false;
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': masterKey },
      body:    JSON.stringify(photos)
    });
    return res.ok;
  } catch { return false; }
}

/* ── Applique les photos dans la section avant/après ── */
function applyPhotos(photos) {
  const grid = document.getElementById('aa-grid');
  if (!grid || !photos || photos.length === 0) return;

  const catIcons = { 'Plomberie':'🔧', 'Climatisation':'❄️', 'Chauffage':'🔥', 'Rénovation':'🏠', 'Autre':'⚙️' };

  grid.innerHTML = photos.map(p => {
    const icon = catIcons[p.cat] || '⚙️';
    const avantHtml = p.avant
      ? `<img src="${p.avant}" alt="Avant" style="width:100%;height:200px;object-fit:cover;display:block">`
      : `<div class="aa-img-placeholder"><span class="aa-placeholder-icon">📷</span><span class="aa-placeholder-text">Photo à venir</span></div>`;
    const apresHtml = p.apres
      ? `<img src="${p.apres}" alt="Après" style="width:100%;height:200px;object-fit:cover;display:block">`
      : `<div class="aa-img-placeholder"><span class="aa-placeholder-icon">📷</span><span class="aa-placeholder-text">Photo à venir</span></div>`;
    return `
      <div class="aa-card">
        <div class="aa-images">
          <div class="aa-side">
            <div class="aa-label aa-label-avant">Avant</div>
            ${avantHtml}
          </div>
          <div class="aa-divider">↔</div>
          <div class="aa-side">
            <div class="aa-label aa-label-apres">Après</div>
            ${apresHtml}
          </div>
        </div>
        <div class="aa-caption">
          <span class="aa-cat">${icon} ${p.cat || ''}</span>
          <p class="aa-desc">${p.desc || ''}</p>
        </div>
      </div>`;
  }).join('');
}

/* ── Initialisation automatique sur les pages publiques ── */
if (!window.location.pathname.includes('/admin')) {
  document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadPhotos();
  });
}
