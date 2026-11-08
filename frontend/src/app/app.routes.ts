import { Routes } from '@angular/router';
import { FileManagerComponent } from './pages/files/file-manager.component';
import { ionicRoutes } from './ionic/ionic.routes';

export const routes: Routes = [
  // Redirección principal hacia las 4 pestañas de OmniFile Studio (Ionic 9)
  { path: '', redirectTo: 'mobile/dashboard', pathMatch: 'full' },

  // Suite Gestor y Conversor de Archivos (Vista Escritorio Web)
  { path: 'files', component: FileManagerComponent },

  // Rutas de las 4 Pestañas + Formulario Reactivo con Ionic 9 + Capacitor 8
  ...ionicRoutes,

  { path: '**', redirectTo: 'mobile/dashboard' }
];
