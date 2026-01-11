import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import {
  resources,
  normalizeLanguage,
} from '@tasks-management/frontend-services/i18n';

const deviceLanguage = Localization.getLocales()?.[0]?.languageTag ?? 'en';
const initialLanguage = normalizeLanguage(deviceLanguage);

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;

