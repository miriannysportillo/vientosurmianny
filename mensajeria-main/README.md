# Mensajería - Proyecto Vite + React + Supabase

## Descripción General
Este proyecto es una aplicación de mensajería en tiempo real construida con React, Vite y Supabase. Permite a los usuarios registrarse, iniciar sesión y comunicarse mediante mensajes instantáneos en conversaciones privadas.

## Características Principales
- **Frontend moderno:** Utiliza React 18 y Vite para un desarrollo rápido y eficiente.
- **Autenticación:** Registro e inicio de sesión de usuarios mediante Supabase Auth.
- **Mensajería en tiempo real:** Envío y recepción de mensajes instantáneos usando la base de datos en tiempo real de Supabase.
- **Gestión de conversaciones:** Creación y listado de conversaciones privadas.
- **Indicador de escritura:** Visualización en tiempo real cuando un usuario está escribiendo.
- **UI responsiva:** Interfaz adaptada a dispositivos móviles y de escritorio, usando Tailwind CSS.
- **Control de acceso:** Rutas protegidas para usuarios autenticados.

## Especificaciones Técnicas
- **Framework:** React 18
- **Bundler:** Vite
- **Lenguaje:** TypeScript
- **Estado global:** Zustand
- **Animaciones:** Framer Motion
- **Estilos:** Tailwind CSS, tailwind-merge, clsx
- **Ruteo:** React Router DOM
- **Gestión de fechas:** date-fns
- **Backend:** Supabase (Base de datos, Auth y Realtime)
- **Utilidades:** uuid, lucide-react (iconos)

## Estructura de Carpetas
- `src/components/` - Componentes reutilizables de UI y funcionalidad.
- `src/pages/` - Páginas principales de la app (Login, Register, Messenger, NotFound).
- `src/contexts/` - Contextos globales (ej. AuthContext).
- `src/hooks/` - Hooks personalizados.
- `src/lib/` - Librerías y utilidades (ej. configuración de Supabase).
- `src/store/` - Estado global con Zustand.
- `src/types/` - Definiciones de tipos TypeScript.
- `supabase/migrations/` - Migraciones SQL para la base de datos.

## Requisitos de Entorno
- Node.js >= 18
- Variables de entorno en `.env`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Instalación y Ejecución
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar el archivo `.env` con las claves de Supabase.
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

# Plan de Mejoras

1. **Notificaciones push:** Integrar notificaciones en tiempo real para nuevos mensajes.
2. **Soporte para grupos:** Permitir conversaciones grupales además de privadas.
3. **Carga y envío de archivos:** Habilitar el envío de imágenes y documentos.
4. **Mejoras de accesibilidad:** Optimizar la UI para usuarios con discapacidades.
5. **Internacionalización (i18n):** Soporte multilenguaje para la interfaz.
6. **Pruebas automatizadas:** Añadir tests unitarios y de integración.
7. **Despliegue automatizado:** Configurar CI/CD para despliegue en Vercel, Netlify u otra plataforma.
8. **Historial y búsqueda:** Implementar búsqueda de mensajes y conversaciones.
9. **Mejoras de seguridad:** Validaciones adicionales y protección contra XSS/CSRF.
10. **Optimización de rendimiento:** Lazy loading de componentes y optimización de recursos.
