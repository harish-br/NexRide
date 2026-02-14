import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import taTranslations from './locales/ta.json';
import hiTranslations from './locales/hi.json';
import teTranslations from './locales/te.json';
import arTranslations from './locales/ar.json';
import zhTranslations from './locales/zh.json';

const resources = {
    en: { translation: enTranslations },
    ta: { translation: taTranslations },
    hi: { translation: hiTranslations },
    te: { translation: teTranslations },
    ar: { translation: arTranslations },
    zh: { translation: zhTranslations },
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
    });

export default i18n;
