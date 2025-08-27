// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from "react-native-localize";

// Language files (en and fr for example)
import enTranslation from '../enums/en.json';
import esTranslation from '../enums/es.json';


const getLang = async () => {
    const storedLanguage = await AsyncStorage.getItem('language');

    i18n.use(initReactI18next).init({
        resources: {

            en: {
                translation: enTranslation,
            },
            es: {
                translation: esTranslation,
            },

        },
        lng: storedLanguage ? storedLanguage : 'en', // default language
        fallbackLng: 'en', // language to use if the translation for the current language is not available
        interpolation: {
            escapeValue: false, // React already does escaping
        },
    });
}

getLang()

export default i18n;
