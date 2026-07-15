/**
 * Cyvora — Simple Bilingual System (EN / FR)
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
      "nav.leaderboard": "Leaderboard",
      "nav.monitor": "Monitor",
      "nav.certificates": "Certificates",
      "nav.profile": "Profile",

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
      "login.new_user": "New to Cyvora?",
      "login.create_account": "Create account",

      // Register
      "register.title": "Create account",
      "register.name": "Full name",
      "register.phone": "Phone number",
      "register.email": "Email (optional)",
      "register.password": "Password",
      "register.terms": "I agree to the Terms of Governance and consent to data processing under CPDP regulations.",
      "register.button": "Register & verify",

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
      "nav.leaderboard": "Classement",
      "nav.monitor": "Surveillance",
      "nav.certificates": "Certificats",
      "nav.profile": "Profil",

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
      "login.new_user": "Nouveau sur Cyvora ?",
      "login.create_account": "Créer un compte",

      // Register
      "register.title": "Créer un compte",
      "register.name": "Nom complet",
      "register.phone": "Numéro de téléphone",
      "register.email": "Email (optionnel)",
      "register.password": "Mot de passe",
      "register.terms": "J'accepte les Conditions de Gouvernance et consens au traitement des données conformément au CPDP.",
      "register.button": "S'inscrire et vérifier",

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

  var currentLang = localStorage.getItem('cyvora_lang') || 'en';

  function t(key) {
    var lang = translations[currentLang] || translations.en;
    return lang[key] || key; // fallback to key if translation missing
  }

  function setLanguage(lang) {
    if (!translations[lang]) lang = 'en';
    currentLang = lang;
    localStorage.setItem('cyvora_lang', lang);

    // Trigger language change event so pages can react
    document.dispatchEvent(new CustomEvent('cyvora:language-changed', { detail: { lang: lang } }));
  }

  function getCurrentLanguage() {
    return currentLang;
  }

  // Auto-translate elements with data-i18n attribute
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = t(key);
      }
    });
  }

  // Initialize on load
  function initI18n() {
    // Apply translations to elements with data-i18n
    applyTranslations();

    // Re-apply when language changes
    document.addEventListener('cyvora:language-changed', function () {
      applyTranslations();
    });
  }

  // Expose globally
  window.t = t;
  window.setLanguage = setLanguage;
  window.getCurrentLanguage = getCurrentLanguage;
  window.CyvoraI18n = {
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

  console.log("[Cyvora] Bilingual system loaded. Current language:", currentLang);
})();
