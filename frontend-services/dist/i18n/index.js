import en from './en';
import he from './he';
export const resources = {
    en: { translation: en },
    he: { translation: he },
};
export const supportedLanguages = Object.keys(resources);
export const defaultLanguage = 'en';
export function normalizeLanguage(lng) {
    const base = (lng ?? defaultLanguage).split('-')[0];
    return (supportedLanguages.includes(base)
        ? base
        : defaultLanguage);
}
export function isRtlLanguage(lng) {
    return normalizeLanguage(lng) === 'he';
}
