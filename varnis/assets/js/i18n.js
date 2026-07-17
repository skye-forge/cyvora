/**
 * Varnis — Simple Bilingual System (EN / FR)
 * ------------------------------------------------------------
 * Usage:
 *   window.t('nav.home')           // Returns translated string
 *   window.setLanguage('fr')       // Switch language
 *   window.getCurrentLanguage()    // Returns 'en' or 'fr'
 */

(function () {
  "use strict";

  var translations = {
    en: {
      // Navigation
      "nav.home": "Home",
      "nav.reports": "Reports",
      "nav.community": "Community",
      "nav.learn": "Learn",
      "nav.assistant": "Ask AI",
      "search.pages": "Pages",
      "search.reports": "Reports",
      "search.alerts": "Alerts",
      "search.learning": "Learning",
      "search.community": "Community",
      "search.searching": "Searching\u2026",
      "search.no_results": "No results for",
      "nav.leaderboard": "Leaderboard",
      "nav.monitor": "Monitor",
      "nav.certificates": "Certificates",
      "nav.profile": "Profile",
      "nav.settings": "Settings",
      "nav.support": "Support",
      "nav.emergency": "Emergency Alert",
      "nav.dashboard": "Dashboard",
      "nav.notifications": "Notifications",

      // Notifications page
      "notif.title": "Notifications",
      "notif.loading": "Checking for updates…",
      "notif.mark_all": "Mark all as read",
      "notif.filter_all": "All",
      "notif.filter_unread": "Unread",
      "notif.filter_alerts": "Alerts",
      "notif.filter_reports": "Reports",
      "notif.filter_learning": "Learning",
      "notif.filter_community": "Community",
      "notif.one_unread": "unread update",
      "notif.many_unread": "unread updates",
      "notif.total": "total",
      "notif.none_unread": "You're all caught up — no unread updates.",
      "notif.empty_title": "You're all caught up",
      "notif.empty_filtered": "Nothing here for this filter",
      "notif.empty_body": "Alerts, report updates, learning reminders and community news will appear here as they happen.",
      "notif.empty_cta": "Back to home",
      "notif.all_read_toast": "All notifications marked as read.",
      "notif.all_read_fail": "Could not sync with the server — will retry next visit.",
      "notif.load_fail": "Couldn't load notifications.",

      // Top bar
      "top.search": "Search reports, IDs, or locations…",
      "top.report_incident": "Report Incident",

      // Home
      "home.pending": "Pending reports",
      "home.pending_sub": "Awaiting review",
      "home.approved": "Approved",
      "home.approved_sub": "Actioned by ANTIC",
      "home.trust": "Trust rating",
      "home.trust_sub": "Out of 10",
      "home.featured": "Featured lesson",
      "home.featured_title": "Spot & report phishing before it spreads",
      "home.featured_body": "Learn to identify fake SMS, emails and sites targeting MoMo and bank users. Earn the Cyber Vigilant badge.",
      "home.start_training": "Start training",
      "home.community_highlights": "Community highlights",
      "home.view_board": "View community board",
      "home.national_alerts": "National alerts",
      "home.live": "Live",
      "home.see_monitor": "See national monitor",
      "home.tips_title": "Quick safety tips",
      "home.tip1": "Never share your MoMo PIN or OTP — not even with \"support\".",
      "home.tip2": "Enable critical alerts in your phone's OS settings.",
      "home.tip3": "Report suspicious numbers to help protect your community.",
      "home.quick_access": "Quick-access reporting",
      "home.q_momo": "Mobile money fraud",
      "home.q_phishing": "Phishing",
      "home.q_hacking": "Account hacking",
      "home.q_ai": "AI-generated scam",

      // My Reports
      "reports.title": "My Reports",
      "reports.sub": "Monitor and manage your submitted incidents and civic reports.",
      "reports.export": "Export CSV",
      "reports.print": "Print view",
      "reports.status": "Status",
      "reports.category": "Category",
      "reports.all_statuses": "All statuses",
      "reports.all_categories": "All categories",
      "reports.from": "From",
      "reports.to": "To",
      "reports.col_id": "Report ID",
      "reports.col_category": "Category",
      "reports.col_date": "Incident date",
      "reports.col_status": "Status",
      "reports.col_actions": "Actions",
      "reports.view_details": "View details",
      "reports.total": "Total submissions",
      "reports.resolved": "Reports resolved",
      "reports.pending_action": "Pending action",
      "reports.avg_response": "Avg. response time",

      // Learn
      "learn.title": "Learn",
      "learn.sub": "Build your cyber-safety skills. Earn XP, badges and certificates.",
      "learn.daily_challenge": "Daily challenge",
      "learn.enrolled": "Your enrolled courses",
      "learn.stats": "Learning stats",
      "learn.view_certs": "View certificates",

      // Community
      "community.title": "Community",
      "community.sub": "Share safety updates, celebrate wins, and coordinate with your neighbours.",
      "community.topics": "Topics",
      "community.all_posts": "All posts",
      "community.safety_alerts": "Safety alerts",
      "community.announcements": "Announcements",
      "community.local_events": "Local events",
      "community.trending": "Trending tags",
      "community.share_placeholder": "Share a safety update or start a discussion…",
      "community.details_placeholder": "Add details, context, or a request for help.",
      "community.post": "Post",
      "community.stats": "Community stats",

      // Profile
      "profile.title": "Profile",
      "profile.sub": "Manage your account identity and public information.",
      "profile.verified": "Verified citizen",
      "profile.trust_score": "Trust score",
      "profile.reports_filed": "Reports filed",
      "profile.general": "General settings",
      "profile.full_name": "Full name",
      "profile.email": "Email address",
      "profile.phone": "Phone number",
      "profile.region": "Region",
      "profile.save": "Save changes",
      "profile.discard": "Discard changes",
      "profile.sign_out": "Sign out",

      // Settings
      "settings.title": "Settings",
      "settings.sub": "Manage your language, notifications, and report subscriptions.",
      "settings.language": "Language",
      "settings.language_sub": "VARNIS is fully bilingual. Your choice applies across every screen and notification.",
      "settings.notifications": "Notifications",
      "settings.subscriptions": "Report subscriptions",
      "settings.privacy": "Privacy",
      "settings.save": "Save changes",
      "settings.reset": "Reset",
      "settings.saved": "Your settings have been saved.",


      // Common
      "common.report_incident": "Report Incident",
      "common.search": "Search safety database...",
      "common.submit": "Submit",
      "common.cancel": "Cancel",
      "common.save": "Save",
      "common.loading": "Loading...",
      "common.error": "An error occurred. Please try again.",

      // Login
      "login.title": "Sign in",
      "login.identifier": "Phone or email",
      "login.password": "Password",
      "login.remember": "Remember me",
      "login.forgot": "Forgot password?",
      "login.button": "Continue",
      "login.or": "or",
      "login.google": "Continue with Google",
      "login.new_user": "New to VARNIS?",
      "login.create_account": "Create account",

      // Register
      "register.title": "Create account",
      "register.name": "Full name",
      "register.phone": "Phone number",
      "register.email": "Email (optional)",
      "register.password": "Password",
      "register.idcard": "National ID card",
      "register.idcard_hint": "Upload a photo or scan of your ID card (JPG, PNG or PDF \u00b7 max 5 MB)",
      "register.terms": "I agree to the Terms of Governance and consent to data processing under CPDP regulations.",
      "register.button": "Register & verify",
      "assistant.title": "Ask VARNIS",
      "assistant.subtitle": "Your cybersecurity assistant — scams, account safety, and how to use the platform.",
      "assistant.placeholder": "Ask a question\u2026",
      "assistant.send": "Send",
      "assistant.new": "New conversation",
      "assistant.disclaimer": "AI answers can be imperfect. For active threats, contact local emergency services and file a report.",
      "assistant.empty_title": "What would you like to know?",
      "assistant.empty_sub": "Ask about scams, protecting your accounts, or anything on VARNIS.",

      // Report Incident
      "report.title": "Report Incident",
      "report.category": "Category",
      "report.subject": "Subject / Title",
      "report.description": "Description",
      "report.location": "Location (optional)",
      "report.submit": "Submit Report",

      // Home
      "home.greeting": "Hello",
      "home.trust_score": "Trust Score",
      "home.pending_reports": "Pending Reports",
      "home.approved_reports": "Approved Reports",

      // Toast messages
      "toast.report_submitted": "Report filed successfully",
      "toast.post_submitted": "Post submitted for review",
      "toast.alert_published": "Alert published successfully",
      "toast.login_success": "Login successful",
      "toast.validation_error": "Please fix the errors in the form",
    },

    fr: {
      // Navigation
      "nav.home": "Accueil",
      "nav.reports": "Rapports",
      "nav.community": "Communauté",
      "nav.learn": "Apprendre",
      "nav.assistant": "Assistant IA",
      "search.pages": "Pages",
      "search.reports": "Rapports",
      "search.alerts": "Alertes",
      "search.learning": "Formation",
      "search.community": "Communaut\u00e9",
      "search.searching": "Recherche\u2026",
      "search.no_results": "Aucun r\u00e9sultat pour",
      "nav.leaderboard": "Classement",
      "nav.monitor": "Surveillance",
      "nav.certificates": "Certificats",
      "nav.profile": "Profil",
      "nav.settings": "Paramètres",
      "nav.support": "Assistance",
      "nav.emergency": "Alerte d'urgence",
      "nav.dashboard": "Tableau de bord",
      "nav.notifications": "Notifications",

      // Page notifications
      "notif.title": "Notifications",
      "notif.loading": "Recherche de mises à jour…",
      "notif.mark_all": "Tout marquer comme lu",
      "notif.filter_all": "Toutes",
      "notif.filter_unread": "Non lues",
      "notif.filter_alerts": "Alertes",
      "notif.filter_reports": "Rapports",
      "notif.filter_learning": "Apprentissage",
      "notif.filter_community": "Communauté",
      "notif.one_unread": "mise à jour non lue",
      "notif.many_unread": "mises à jour non lues",
      "notif.total": "au total",
      "notif.none_unread": "Vous êtes à jour — aucune notification non lue.",
      "notif.empty_title": "Vous êtes à jour",
      "notif.empty_filtered": "Rien à afficher pour ce filtre",
      "notif.empty_body": "Les alertes, mises à jour de rapports, rappels d'apprentissage et actualités de la communauté apparaîtront ici.",
      "notif.empty_cta": "Retour à l'accueil",
      "notif.all_read_toast": "Toutes les notifications ont été marquées comme lues.",
      "notif.all_read_fail": "Synchronisation impossible avec le serveur — nouvel essai à la prochaine visite.",
      "notif.load_fail": "Impossible de charger les notifications.",

      // Top bar
      "top.search": "Rechercher des signalements, ID ou lieux…",
      "top.report_incident": "Signaler un incident",

      // Home
      "home.pending": "Signalements en attente",
      "home.pending_sub": "En cours d'examen",
      "home.approved": "Approuvés",
      "home.approved_sub": "Traités par l'ANTIC",
      "home.trust": "Indice de confiance",
      "home.trust_sub": "Sur 10",
      "home.featured": "Leçon à la une",
      "home.featured_title": "Repérez et signalez l'hameçonnage avant qu'il ne se propage",
      "home.featured_body": "Apprenez à identifier les faux SMS, e-mails et sites ciblant les utilisateurs de Mobile Money et des banques. Gagnez le badge Cyber Vigilant.",
      "home.start_training": "Commencer la formation",
      "home.community_highlights": "Temps forts de la communauté",
      "home.view_board": "Voir le forum communautaire",
      "home.national_alerts": "Alertes nationales",
      "home.live": "En direct",
      "home.see_monitor": "Voir la surveillance nationale",
      "home.tips_title": "Conseils de sécurité rapides",
      "home.tip1": "Ne partagez jamais votre code PIN MoMo ou OTP, même avec « l'assistance ».",
      "home.tip2": "Activez les alertes critiques dans les paramètres de votre téléphone.",
      "home.tip3": "Signalez les numéros suspects pour protéger votre communauté.",
      "home.quick_access": "Signalement rapide",
      "home.q_momo": "Fraude Mobile Money",
      "home.q_phishing": "Hameçonnage",
      "home.q_hacking": "Piratage de compte",
      "home.q_ai": "Arnaque générée par IA",

      // My Reports
      "reports.title": "Mes signalements",
      "reports.sub": "Suivez et gérez vos incidents et signalements civiques soumis.",
      "reports.export": "Exporter CSV",
      "reports.print": "Vue impression",
      "reports.status": "Statut",
      "reports.category": "Catégorie",
      "reports.all_statuses": "Tous les statuts",
      "reports.all_categories": "Toutes les catégories",
      "reports.from": "Du",
      "reports.to": "Au",
      "reports.col_id": "N° de signalement",
      "reports.col_category": "Catégorie",
      "reports.col_date": "Date de l'incident",
      "reports.col_status": "Statut",
      "reports.col_actions": "Actions",
      "reports.view_details": "Voir les détails",
      "reports.total": "Total des soumissions",
      "reports.resolved": "Signalements résolus",
      "reports.pending_action": "En attente d'action",
      "reports.avg_response": "Temps de réponse moyen",

      // Learn
      "learn.title": "Apprendre",
      "learn.sub": "Développez vos compétences en cybersécurité. Gagnez des XP, badges et certificats.",
      "learn.daily_challenge": "Défi du jour",
      "learn.enrolled": "Vos cours inscrits",
      "learn.stats": "Statistiques d'apprentissage",
      "learn.view_certs": "Voir les certificats",

      // Community
      "community.title": "Communauté",
      "community.sub": "Partagez des mises à jour de sécurité, célébrez les réussites et coordonnez-vous avec vos voisins.",
      "community.topics": "Sujets",
      "community.all_posts": "Toutes les publications",
      "community.safety_alerts": "Alertes de sécurité",
      "community.announcements": "Annonces",
      "community.local_events": "Événements locaux",
      "community.trending": "Tags tendance",
      "community.share_placeholder": "Partagez une mise à jour de sécurité ou lancez une discussion…",
      "community.details_placeholder": "Ajoutez des détails, du contexte ou une demande d'aide.",
      "community.post": "Publier",
      "community.stats": "Statistiques de la communauté",

      // Profile
      "profile.title": "Profil",
      "profile.sub": "Gérez l'identité de votre compte et vos informations publiques.",
      "profile.verified": "Citoyen vérifié",
      "profile.trust_score": "Indice de confiance",
      "profile.reports_filed": "Signalements déposés",
      "profile.general": "Paramètres généraux",
      "profile.full_name": "Nom complet",
      "profile.email": "Adresse e-mail",
      "profile.phone": "Numéro de téléphone",
      "profile.region": "Région",
      "profile.save": "Enregistrer les modifications",
      "profile.discard": "Annuler les modifications",
      "profile.sign_out": "Se déconnecter",

      // Settings
      "settings.title": "Paramètres",
      "settings.sub": "Gérez votre langue, vos notifications et vos abonnements aux rapports.",
      "settings.language": "Langue",
      "settings.language_sub": "VARNIS est entièrement bilingue. Votre choix s'applique à tous les écrans et notifications.",
      "settings.notifications": "Notifications",
      "settings.subscriptions": "Abonnements aux rapports",
      "settings.privacy": "Confidentialité",
      "settings.save": "Enregistrer les modifications",
      "settings.reset": "Réinitialiser",
      "settings.saved": "Vos paramètres ont été enregistrés.",


      // Common
      "common.report_incident": "Signaler un incident",
      "common.search": "Rechercher dans la base de données de sécurité...",
      "common.submit": "Soumettre",
      "common.cancel": "Annuler",
      "common.save": "Enregistrer",
      "common.loading": "Chargement...",
      "common.error": "Une erreur s'est produite. Veuillez réessayer.",

      // Login
      "login.title": "Connexion",
      "login.identifier": "Téléphone ou email",
      "login.password": "Mot de passe",
      "login.remember": "Se souvenir de moi",
      "login.forgot": "Mot de passe oublié ?",
      "login.button": "Continuer",
      "login.or": "ou",
      "login.google": "Continuer avec Google",
      "login.new_user": "Nouveau sur VARNIS ?",
      "login.create_account": "Créer un compte",

      // Register
      "register.title": "Créer un compte",
      "register.name": "Nom complet",
      "register.phone": "Numéro de téléphone",
      "register.email": "Email (optionnel)",
      "register.password": "Mot de passe",
      "register.idcard": "Carte nationale d'identit\u00e9",
      "register.idcard_hint": "T\u00e9l\u00e9versez une photo ou un scan de votre carte d'identit\u00e9 (JPG, PNG ou PDF \u00b7 max 5 Mo)",
      "register.terms": "J'accepte les Conditions de Gouvernance et consens au traitement des données conformément au CPDP.",
      "register.button": "S'inscrire et vérifier",
      "assistant.title": "Demandez \u00e0 VARNIS",
      "assistant.subtitle": "Votre assistant cybers\u00e9curit\u00e9 \u2014 arnaques, protection des comptes et utilisation de la plateforme.",
      "assistant.placeholder": "Posez une question\u2026",
      "assistant.send": "Envoyer",
      "assistant.new": "Nouvelle conversation",
      "assistant.disclaimer": "Les r\u00e9ponses de l'IA peuvent \u00eatre imparfaites. En cas de menace active, contactez les services d'urgence et signalez l'incident.",
      "assistant.empty_title": "Que souhaitez-vous savoir\u00a0?",
      "assistant.empty_sub": "Posez vos questions sur les arnaques, la protection de vos comptes ou VARNIS.",

      // Report Incident
      "report.title": "Signaler un incident",
      "report.category": "Catégorie",
      "report.subject": "Sujet / Titre",
      "report.description": "Description",
      "report.location": "Lieu (optionnel)",
      "report.submit": "Soumettre le rapport",

      // Home
      "home.greeting": "Bonjour",
      "home.trust_score": "Score de confiance",
      "home.pending_reports": "Rapports en attente",
      "home.approved_reports": "Rapports approuvés",

      // Toast messages
      "toast.report_submitted": "Rapport soumis avec succès",
      "toast.post_submitted": "Publication soumise pour examen",
      "toast.alert_published": "Alerte publiée avec succès",
      "toast.login_success": "Connexion réussie",
      "toast.validation_error": "Veuillez corriger les erreurs dans le formulaire",
    }
  };

  var currentLang = localStorage.getItem('varnis_lang') || 'en';

  function t(key) {
    var lang = translations[currentLang] || translations.en;
    return lang[key] || key; // fallback to key if translation missing
  }

  function setLanguage(lang) {
    if (!translations[lang]) lang = 'en';
    currentLang = lang;
    localStorage.setItem('varnis_lang', lang);

    // Trigger language change event so pages can react
    document.dispatchEvent(new CustomEvent('varnis:language-changed', { detail: { lang: lang } }));
  }

  function getCurrentLanguage() {
    return currentLang;
  }

  // Auto-translate elements. Supports:
  //   data-i18n="key"                → element text (preserving a leading icon)
  //   data-i18n-placeholder="key"    → input/textarea placeholder
  //   data-i18n-aria="key"           → aria-label
  //   data-i18n-html="key"           → innerHTML (use sparingly, trusted strings)
  function setTextPreservingIcon(el, text) {
    // If the element starts with a material icon, keep it and only swap the
    // trailing text node(s). Otherwise replace textContent.
    var first = el.firstElementChild;
    if (first && first.classList && first.classList.contains("material-symbols-outlined")) {
      // remove existing text nodes after the icon, then append fresh text
      var node = first.nextSibling;
      while (node) { var next = node.nextSibling; el.removeChild(node); node = next; }
      el.appendChild(document.createTextNode(" " + text));
    } else {
      el.textContent = text;
    }
  }

  function applyTranslations(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) setTextPreservingIcon(el, t(key));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    root.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });

    // Reflect the current language on <html> and on any toggle labels.
    document.documentElement.setAttribute('lang', currentLang);
    document.querySelectorAll('[data-lang-label]').forEach(function (el) {
      el.textContent = currentLang === 'fr' ? 'FR' : 'EN';
    });
    document.querySelectorAll('[data-lang-other]').forEach(function (el) {
      el.textContent = currentLang === 'fr' ? 'English' : 'Français';
    });

    // Dynamic content: elements marked [data-i18n-auto] hold text that isn't
    // in the curated dictionary (report descriptions, AI lessons, posts).
    // Translate them with the REAL translation API and cache the result. The
    // element keeps its English source in data-i18n-src so switching back is
    // instant and re-translation is avoided.
    translateDynamic(root);
  }

  function translateDynamic(root) {
    root = root || document;
    if (!(window.VarnisAPI && window.VarnisAPI.i18n)) return;
    var els = root.querySelectorAll('[data-i18n-auto]');
    els.forEach(function (el) {
      // Capture the original (source) text once.
      if (!el.getAttribute('data-i18n-src')) el.setAttribute('data-i18n-src', el.textContent.trim());
      var src = el.getAttribute('data-i18n-src') || '';
      if (!src) return;
      if (currentLang === 'en') { el.textContent = src; return; } // source is EN
      window.VarnisAPI.i18n.translate(src, { from: 'en', to: currentLang })
        .then(function (translated) { el.textContent = translated; })
        .catch(function () { /* keep source on failure */ });
    });
  }

  // Initialize on load
  function initI18n() {
    applyTranslations();
    document.addEventListener('varnis:language-changed', function () {
      applyTranslations();
    });
    // Any element marked [data-lang-toggle] flips the language when clicked.
    document.querySelectorAll('[data-lang-toggle]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e && e.cancelable) e.preventDefault();
        setLanguage(currentLang === 'fr' ? 'en' : 'fr');
      });
    });
  }

  // Expose globally
  window.t = t;
  window.setLanguage = setLanguage;
  window.getCurrentLanguage = getCurrentLanguage;
  window.VarnisI18n = {
    translateDynamic: translateDynamic,
    init: initI18n,
    apply: applyTranslations,
    t: t
  };

  // Auto init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }

  console.log("[Varnis] Bilingual system loaded. Current language:", currentLang);
})();
