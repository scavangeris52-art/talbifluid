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

/* ── Récupère le Bin ID depuis localStorage ── */
function getBinId()     { return localStorage.getItem('tf_bin_id') || ''; }
function getMasterKey() { return localStorage.getItem('tf_master_key') || ''; }

/* ── Charge les paramètres depuis JSONBin ── */
async function loadSettings() {
  const binId = getBinId();
  if (!binId) {
    applySettings(SETTINGS_DEFAULTS);
    return SETTINGS_DEFAULTS;
  }
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Bin-Meta': 'false' }
    });
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    const settings = { ...SETTINGS_DEFAULTS, ...data };
    applySettings(settings);
    return settings;
  } catch {
    applySettings(SETTINGS_DEFAULTS);
    return SETTINGS_DEFAULTS;
  }
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

/* ── Initialisation automatique sur les pages publiques ── */
if (!window.location.pathname.includes('/admin')) {
  document.addEventListener('DOMContentLoaded', loadSettings);
}
