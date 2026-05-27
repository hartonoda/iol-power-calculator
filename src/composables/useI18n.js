import { ref, computed } from 'vue';
import { locales, defaultLocale, availableLocales } from '@/locales';

// Global reactive locale state
const currentLocale = ref(localStorage.getItem('locale') || defaultLocale);

/**
 * i18n composable for multilingual support
 * Usage:
 *   const { t, locale, setLocale, availableLocales } = useI18n();
 *   t('common.save') // returns translated string
 */
export function useI18n() {
  // Get nested value from object using dot notation
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  };

  // Translation function
  const t = (key, params = {}) => {
    const translation = getNestedValue(locales[currentLocale.value], key);
    
    if (translation === undefined) {
      // Fallback to default locale
      const fallback = getNestedValue(locales[defaultLocale], key);
      if (fallback === undefined) {
        console.warn(`Missing translation for key: ${key}`);
        return key;
      }
      return interpolate(fallback, params);
    }
    
    return interpolate(translation, params);
  };

  // Interpolate params into string (e.g., "Hello {name}" with {name: "John"})
  const interpolate = (str, params) => {
    if (typeof str !== 'string') return str;
    return str.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
  };

  // Set locale and persist to localStorage
  const setLocale = (locale) => {
    if (locales[locale]) {
      currentLocale.value = locale;
      localStorage.setItem('locale', locale);
    } else {
      console.warn(`Locale "${locale}" not found`);
    }
  };

  // Get current locale info
  const currentLocaleInfo = computed(() => {
    return availableLocales.find(l => l.code === currentLocale.value);
  });

  return {
    t,
    locale: currentLocale,
    setLocale,
    availableLocales,
    currentLocaleInfo
  };
}
