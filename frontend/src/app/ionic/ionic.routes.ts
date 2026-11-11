import { Routes } from '@angular/router';

// =============================================================================
// [REQUISITO 1 TP: ARQUITECTURA Y NAVEGACIÓN CON 4 PANTALLAS EN TABS + MENÚ]
// - Tab 1 (/mobile/dashboard): Home / Dashboard (Resumen y accesos rápidos)
// - Tab 2 (/mobile/repository): Repositorio / Gestor de Archivos (Lista/Cuadrícula,
//   buscador, filtros por etiquetas, ion-item-sliding e ion-refresher)
// - Tab 3 (/mobile/scanner): Escáner de Cámara (@capacitor/camera -> PDF)
// - Tab 4 (/mobile/pdf-suite): Suite PDF (Unir, Dividir, Comprimir, Firmar y Convertir)
// - Ruta Formulario (/mobile/file-form): Formulario Reactivo + IA Contextual Local
// =============================================================================
export const ionicRoutes: Routes = [
  {
    path: 'mobile',
    loadComponent: () =>
      import('./components/mobile-tabs/mobile-tabs.component').then(m => m.MobileTabsComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/mobile-file-dashboard/mobile-file-dashboard.component').then(
            m => m.MobileFileDashboardComponent
          )
      },
      {
        path: 'repository',
        loadComponent: () =>
          import('./pages/mobile-file-repository/mobile-file-repository.component').then(
            m => m.MobileFileRepositoryComponent
          )
      },
      {
        path: 'scanner',
        loadComponent: () =>
          import('./pages/mobile-camera-scanner/mobile-camera-scanner.component').then(
            m => m.MobileCameraScannerComponent
          )
      },
      {
        path: 'pdf-suite',
        loadComponent: () =>
          import('./pages/mobile-pdf-suite/mobile-pdf-suite.component').then(
            m => m.MobilePdfSuiteComponent
          )
      },
      {
        path: 'file-form',
        loadComponent: () =>
          import('./pages/mobile-file-form/mobile-file-form.component').then(
            m => m.MobileFileFormComponent
          )
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/mobile-profile/mobile-profile.component').then(
            m => m.MobileProfileComponent
          )
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/mobile-profile/mobile-profile.component').then(
            m => m.MobileProfileComponent
          )
      },
      {
        path: 'tools',
        redirectTo: 'pdf-suite',
        pathMatch: 'full'
      },
      {
        path: 'files',
        redirectTo: 'repository',
        pathMatch: 'full'
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
