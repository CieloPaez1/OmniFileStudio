import type { CapacitorConfig } from '@capacitor/cli';

// =============================================================================
// [REQUISITO 8 TP: CONFIGURACIÓN CAPACITOR 8 PARA ANDROID]
// Configuración base lista para ejecutar `npx cap sync android`.
// Declara permisos y configuración de plugins nativos (@capacitor/camera,
// @capacitor/preferences y @capacitor/filesystem).
// =============================================================================
const config: CapacitorConfig = {
  appId: 'com.filestudio.app',
  appName: 'FileStudio PDF Manager',
  webDir: 'dist/IntegradorProgAvz2026Front/browser',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen'
    }
  }
};

export default config;
