import { ApplicationConfig } from '@angular/core';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

// =============================================================================
// [IONIC 9 - CLASES 3 Y 5] IMPORTACIÓN DEL MOTOR Y ESTRATEGIA DE RUTAS
// - provideIonicAngular: Inicializa los Web Components, animaciones y gestos.
// - IonicRouteStrategy: Buena práctica verificada de cátedra; reemplaza la
//   RouteReuseStrategy de Angular para administrar la pila de navegación móvil
//   (navigation stack), animaciones de transición y reuso de vistas en ion-tabs.
// =============================================================================
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    // [CLASE 5] Estrategia de reutilización de rutas propia de Ionic
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // [CLASE 1 y 2] Inicialización de Ionic 9 Standalone
    provideIonicAngular(),

    // [CLASE 3] Enrutador de Angular (envuelto luego por IonRouterOutlet en móvil)
    provideRouter(routes),

    // [CLASE 5] Proveedor de HttpClient con interceptor de autenticación JWT
    provideHttpClient(withInterceptors([authInterceptor])),

    provideAnimationsAsync()
  ]
};

