import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  es: {
    translation: {
      welcome: 'Bienvenido a la mensajería',
      login: 'Iniciar sesión',
      register: 'Registrarse',
      messenger: 'Mensajería',
      'Cargando...': 'Cargando...',
      'Credenciales inválidas. Por favor, intenta nuevamente.': 'Credenciales inválidas. Por favor, intenta nuevamente.',
      'Ocurrió un error inesperado. Por favor, intenta nuevamente.': 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
    },
  },
  en: {
    translation: {
      welcome: 'Welcome to messaging',
      login: 'Login',
      register: 'Register',
      messenger: 'Messenger',
      'Cargando...': 'Loading...',
      'Credenciales inválidas. Por favor, intenta nuevamente.': 'Invalid credentials. Please try again.',
      'Ocurrió un error inesperado. Por favor, intenta nuevamente.': 'An unexpected error occurred. Please try again.',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'es',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
