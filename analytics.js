(function () {
  'use strict';

  const MEASUREMENT_ID = 'G-NLL9GDQY8S';
  const ATTRIBUTION_KEY = 'ables-demo-attribution-v1';
  const ALLOWED_EVENTS = new Set(['demo_open', 'demo_video_click', 'generate_lead']);
  const ALLOWED_EVENT_PARAMS = new Set(['form_name', 'lead_type', 'page_path', 'cta_name', 'cta_location', 'destination_host']);
  const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'];

  function clean(value, maxLength) {
    return typeof value === 'string'
      ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLength)
      : '';
  }

  function cleanPath(value) {
    const path = clean(value, 500);
    return path.startsWith('/') ? path : '/';
  }

  function cleanReferrer(value) {
    if (!value) return '';
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      return clean(`${url.origin}${url.pathname}`, 500);
    } catch (_) {
      return '';
    }
  }

  function readFirstTouch() {
    try {
      const stored = sessionStorage.getItem(ATTRIBUTION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (_) {}

    const params = new URLSearchParams(window.location.search);
    const firstTouch = {
      landing_page: cleanPath(window.location.pathname),
      referrer: cleanReferrer(document.referrer),
    };
    UTM_FIELDS.forEach((field) => {
      const value = clean(params.get(field), 200);
      if (value) firstTouch[field] = value;
    });

    try {
      sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(firstTouch));
    } catch (_) {}
    return firstTouch;
  }

  const firstTouch = readFirstTouch();

  function track(eventName, params) {
    if (!ALLOWED_EVENTS.has(eventName) || typeof window.gtag !== 'function') return;
    const safeParams = { page_path: cleanPath(window.location.pathname) };
    Object.entries(params || {}).forEach(([key, value]) => {
      if (!ALLOWED_EVENT_PARAMS.has(key)) return;
      const cleaned = key === 'page_path' ? cleanPath(value) : clean(value, 100);
      if (cleaned) safeParams[key] = cleaned;
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
