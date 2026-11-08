import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// =============================================================================
// [IONIC 9 - CLASE OPCIONAL B: PROTEGER RUTAS Y PETICIONES (INTERCEPTOR FUNCIONAL)]
// Marco Teórico de Cátedra:
// - HttpInterceptorFn: Función que Angular ejecuta en cada petición HTTP antes
//   de enviarla al servidor. Permite inyectar el header `Authorization: Bearer <token>`
//   en un único lugar central (registrado con `withInterceptors([authInterceptor])`
//   en app.config.ts), sin repetirlo en cada servicio.
// - Práctica guiada extra (Manejo global de 401 Unauthorized):
//   Si el servidor responde 401 (token vencido o inválido) en una ruta privada,
//   el interceptor ejecuta automáticamente `authService.logout()` y redirige a
//   `/login` para no dejar al usuario atrapado con una sesión muerta.
// - Panorámica OAuth2 Nativo en producción (mención teórica de Clase Opcional B):
//   En apps nativas empresariales se delega el login a un proveedor OAuth2/OIDC
//   abriendo el navegador seguro del sistema con `@capacitor/browser`
//   (`await Browser.open({ url: authorizeUrl })`) y capturando el regreso a la
//   app mediante un deep link (`com.undec.gestorproyectos://callback`) con
//   `App.addListener('appUrlOpen', ...)` de `@capacitor/app`.
// =============================================================================
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // [CLASE OPCIONAL B - PRÁCTICA EXTRA] Si el backend devuelve 401 en una
      // petición que no sea el propio intento de login/registro, cerramos sesión
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
