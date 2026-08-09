(function () {
  'use strict';

  const MEASUREMENT_ID = 'G-NLL9GDQY8S';
  const ATTRIBUTION_KEY = 'ables-demo-attribution-v1';
  const ALLOWED_EVENTS = new Set(['demo_open', 'demo_video_click', 'generate_lead']);
  const ALLOWED_EVENT_PARAMS = new Set(['form_name', 'lead_type', 'page_path', 'cta_name', 'cta_location', 'destination_host']);
  const ALLOWED_ATTRIBUTION_SOURCES = new Set([
    'direct', 'google', 'bing', 'duckduckgo', 'yahoo', 'linkedin',
    'facebook', 'instagram', 'meta', 'newsletter', 'email', 'trustpilot',
    'bbb', 'referral', 'ables',
  ]);
  const ALLOWED_ATTRIBUTION_MEDIA = new Set([
    'none', 'organic', 'cpc', 'ppc', 'paid_search', 'paid-search',
    'paid_social', 'paid-social', 'social', 'email', 'referral', 'display',
    'affiliate', 'sms',
  ]);
  const ALLOWED_LANDING_PATHS = new Set([
    '/',
    '/about/',
    '/security/',
    '/privacy/',
    '/terms/',
    '/solutions/',
    '/solutions/lender-lead-qualification/',
    '/solutions/bank-statement-review/',
    '/solutions/configurable-risk-scoring/',
    '/solutions/lending-workflow-automation/',
    '/solutions/offer-and-renewal-workflows/',
    '/integrations/',
    '/integrations/zoho-crm/',
    '/integrations/microsoft-email/',
    '/integrations/telnyx/',
    '/integrations/lendsaas-lendtech/',
    '/integrations/api-webhooks/',
    '/resources/',
    '/resources/evaluate-ai-underwriting-software/',
    '/resources/build-vs-buy-lending-automation/',
    '/resources/lending-workflow-platform-vs-point-tools/',
    '/resources/workflow-readiness-assessment/',
  ]);

  function clean(value, maxLength) {
    return typeof value === 'string'
      ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLength)
      : '';
  }

  function looksLikePii(value) {
    const text = clean(value, 500);
    return /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)
      || /\b\d{3}[ -]?\d{2}[ -]?\d{4}\b/.test(text)
      || /(?:\d[\s().+-]*){7,}/.test(text);
  }

  function cleanPath(value) {
    const path = clean(value, 500);
    return ALLOWED_LANDING_PATHS.has(path) && !looksLikePii(path) ? path : '/';
  }

  function cleanReferrer(value) {
    if (!value) return '';
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return clean(url.origin, 200);
    } catch (_) {
      return '';
    }
  }

  function allowlistedToken(value, allowlist) {
    const token = clean(value, 80).toLowerCase();
    return allowlist.has(token) ? token : '';
  }

  function sanitizeAttribution(raw) {
    const source = allowlistedToken(raw?.utm_source, ALLOWED_ATTRIBUTION_SOURCES);
    const medium = allowlistedToken(raw?.utm_medium, ALLOWED_ATTRIBUTION_MEDIA);
    const sanitized = {
      landing_page: cleanPath(raw?.landing_page || window.location.pathname),
      referrer: cleanReferrer(raw?.referrer),
    };
    if (source && medium) {
      sanitized.utm_source = source;
      sanitized.utm_medium = medium;
    }
    return sanitized;
  }

  function storeFirstTouch(firstTouch) {
    try {
      sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(firstTouch));
    } catch (_) {}
  }

  function readFirstTouch() {
    try {
      const stored = sessionStorage.getItem(ATTRIBUTION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          const sanitized = sanitizeAttribution(parsed);
          storeFirstTouch(sanitized);
          return sanitized;
        }
      }
    } catch (_) {}

    const params = new URLSearchParams(window.location.search);
    const firstTouch = sanitizeAttribution({
      landing_page: cleanPath(window.location.pathname),
      referrer: cleanReferrer(document.referrer),
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
    });

    storeFirstTouch(firstTouch);
    return firstTouch;
  }

  const firstTouch = readFirstTouch();

  function track(eventName, params) {
    if (!ALLOWED_EVENTS.has(eventName) || typeof window.gtag !== 'function') return;
    const safeParams = eventName === 'generate_lead'
      ? {}
      : { page_path: cleanPath(window.location.pathname) };
    Object.entries(params || {}).forEach(([key, value]) => {
      if (!ALLOWED_EVENT_PARAMS.has(key)) return;
      const cleaned = key === 'page_path' ? cleanPath(value) : clean(value, 100);
      if (cleaned && !looksLikePii(cleaned)) safeParams[key] = cleaned;
    });
    window.gtag('event', eventName, safeParams);
  }

  function getClientId(timeoutMs) {
    return new Promise((resolve) => {
      if (typeof window.gtag !== 'function') return resolve('');
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const clientId = clean(value, 100);
        resolve(/^\d+\.\d+$/.test(clientId) ? clientId : '');
      };
      const timer = setTimeout(() => finish(''), Number(timeoutMs) || 800);
      try {
        window.gtag('get', MEASUREMENT_ID, 'client_id', finish);
      } catch (_) {
        finish('');
      }
    });
  }

  window.AblesAnalytics = Object.freeze({
    getAttribution: () => ({ ...firstTouch }),
    getClientId,
    track,
  });
})();
