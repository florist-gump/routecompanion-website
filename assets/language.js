(() => {
  const routes = {
    en: '',
    de: '/de',
    fr: '/fr',
    es: '/es',
    it: '/it',
    'pt-BR': '/pt-br',
    'pt-PT': '/pt-pt',
  };
  const aliases = {
    en: 'en',
    de: 'de',
    fr: 'fr',
    es: 'es',
    it: 'it',
    pt: 'pt-PT',
    'pt-br': 'pt-BR',
    'pt-pt': 'pt-PT',
  };
  const enabledLanguages = ['en', 'de', 'fr'];
  const preferenceKey = 'route-companion-language';
  const parameterNames = ['lang', 'language', 'locale'];
  const localizedPaths = new Set([
    '/',
    '/live/',
    '/live/index.html',
    '/tools/',
    '/tools/fueling.html',
    '/tools/route-weather.html',
    '/tools/tyre-pressure.html',
    '/tools/tyre-pressure/road.html',
    '/tools/tyre-pressure/gravel.html',
    '/tools/tyre-pressure/mtb.html',
    '/guides/',
    '/guides/cycling-fueling.html',
    '/guides/cycling-tyre-pressure.html',
    '/guides/cycling-weather-clothing.html',
    '/guides/route-stops.html',
    '/guides/running-weather-clothing.html',
  ]);
  const selectorLabels = {
    en: 'Website language',
    de: 'Sprache der Website',
    fr: 'Langue du site',
    es: 'Idioma del sitio web',
    it: 'Lingua del sito',
    'pt-BR': 'Idioma do site',
    'pt-PT': 'Idioma do site',
  };
  const languageNames = {
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
    it: 'Italiano',
    'pt-BR': 'Português (Brasil)',
    'pt-PT': 'Português (Portugal)',
  };
  const enabledLanguageNames = Object.fromEntries(
    enabledLanguages.map((language) => [language, languageNames[language]]),
  );

  const normalize = (value) => {
    const locale =
      aliases[
        String(value || '')
          .trim()
          .replace('_', '-')
          .toLowerCase()
      ] || null;
    return enabledLanguages.includes(locale) ? locale : null;
  };

  const browserLanguage = () => {
    for (const value of navigator.languages || [navigator.language]) {
      const exact = normalize(value);
      if (exact) return exact;
      const base = normalize(String(value || '').split('-')[0]);
      if (base) return base;
    }
    return 'en';
  };

  const pathParts = () => location.pathname.split('/').filter(Boolean);
  const pathLanguage = () => normalize(pathParts()[0]) || 'en';
  const contentPath = () => {
    const parts = pathParts();
    if (normalize(parts[0])) parts.shift();
    const path = `/${parts.join('/')}`;
    return location.pathname.endsWith('/') ? `${path}/`.replace('//', '/') : path || '/';
  };

  const readPreference = () => {
    try {
      return localStorage.getItem(preferenceKey);
    } catch {
      return null;
    }
  };

  const savePreference = (value) => {
    try {
      localStorage.setItem(preferenceKey, value);
    } catch {
      // Browsing still works when storage is unavailable.
    }
  };

  const destination = (language, params = new URLSearchParams(location.search)) => {
    parameterNames.forEach((name) => params.delete(name));
    const query = params.toString();
    const path = contentPath();
    const localizedPath = `${routes[language]}${path}` || '/';
    return `${localizedPath}${query ? `?${query}` : ''}${location.hash}`;
  };

  const translateTool = async (language) => {
    const root = document.getElementById('tool-root') || document.getElementById('live-root');
    if (!root || language === 'en') return;

    const response = await fetch(`/assets/i18n/tools-${language}.json`, { cache: 'no-cache' });
    if (!response.ok) return;
    const catalog = await response.json();
    const fragments = Object.entries(catalog)
      .filter(([source, translation]) => source !== translation && source.length >= 4)
      .sort(([left], [right]) => right.length - left.length);

    const translatedText = (value) => {
      const whitespace = value.match(/^(\s*)(.*?)(\s*)$/s);
      const text = whitespace[2];
      if (!text) return value;
      if (catalog[text]) return `${whitespace[1]}${catalog[text]}${whitespace[3]}`;
      let translated = text;
      fragments.forEach(([source, replacement]) => {
        if (translated.includes(source)) translated = translated.split(source).join(replacement);
      });
      return `${whitespace[1]}${translated}${whitespace[3]}`;
    };

    const translateNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const translated = translatedText(node.nodeValue || '');
        if (translated !== node.nodeValue) node.nodeValue = translated;
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      ['aria-label', 'placeholder', 'title'].forEach((attribute) => {
        const value = node.getAttribute(attribute);
        if (!value) return;
        const translated = translatedText(value);
        if (translated !== value) node.setAttribute(attribute, translated);
      });
      node.childNodes.forEach(translateNode);
    };

    translateNode(root);
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') translateNode(mutation.target);
        mutation.addedNodes.forEach(translateNode);
      });
    }).observe(root, { childList: true, characterData: true, subtree: true });
  };

  const params = new URLSearchParams(location.search);
  const parameterName = parameterNames.find((name) => params.has(name));
  const currentLanguage = pathLanguage();

  if (parameterName) {
    const value = params.get(parameterName);
    const automatic = String(value || '').toLowerCase() === 'auto';
    const targetLanguage = automatic ? browserLanguage() : normalize(value);
    if (targetLanguage) {
      savePreference(automatic ? 'auto' : targetLanguage);
      location.replace(destination(targetLanguage, params));
      return;
    }
  }

  if (currentLanguage === 'en' && localizedPaths.has(contentPath())) {
    const saved = readPreference();
    const targetLanguage = saved && saved !== 'auto' ? normalize(saved) : browserLanguage();
    if (!saved) savePreference('auto');
    if (targetLanguage && targetLanguage !== 'en') {
      location.replace(destination(targetLanguage));
      return;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const footer = document.querySelector('.footer');
    if (!footer) return;

    const footerLinks = footer.querySelector('.footer-links') || footer;
    const separator = document.createElement('span');
    separator.className = 'dot language-switcher-separator';
    separator.setAttribute('aria-hidden', 'true');
    separator.textContent = '·';

    const switcher = document.createElement('span');
    switcher.className = 'language-switcher';
    switcher.innerHTML = `
      <button class="language-switcher-trigger" type="button" aria-expanded="false"
        aria-haspopup="menu" aria-controls="website-language-menu"
        aria-label="${selectorLabels[currentLanguage]}">
        <svg class="language-switcher-icon" aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M3 12h18M12 3c3 3.4 3 14.6 0 18M12 3c-3 3.4-3 14.6 0 18"></path>
        </svg>
        <span>${languageNames[currentLanguage]}</span>
      </button>
      <span class="language-switcher-menu" id="website-language-menu" role="menu" data-open="false">
        ${Object.entries(enabledLanguageNames)
          .map(
            ([language, name]) => `
              <button class="language-switcher-option" type="button" role="menuitem"
                data-language="${language}" aria-current="${language === currentLanguage}">
                <span>${name}</span><span class="language-switcher-check" aria-hidden="true">${language === currentLanguage ? '✓' : ''}</span>
              </button>`,
          )
          .join('')}
      </span>`;
    footerLinks.append(separator, switcher);

    const trigger = switcher.querySelector('.language-switcher-trigger');
    const menu = switcher.querySelector('.language-switcher-menu');
    const options = [...switcher.querySelectorAll('.language-switcher-option')];
    const setOpen = (open) => {
      trigger.setAttribute('aria-expanded', String(open));
      menu.dataset.open = String(open);
      if (open) options.find((option) => option.getAttribute('aria-current') === 'true')?.focus();
    };

    trigger.addEventListener('click', () => {
      setOpen(trigger.getAttribute('aria-expanded') !== 'true');
    });
    options.forEach((option) =>
      option.addEventListener('click', () => {
        const targetLanguage = option.dataset.language;
        savePreference(targetLanguage);
        location.assign(destination(targetLanguage));
      }),
    );
    document.addEventListener('click', (event) => {
      if (!switcher.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        trigger.focus();
      }
    });

    translateTool(currentLanguage).catch(() => {
      // The calculators remain usable in English if the optional catalog fails to load.
    });
  });
})();
