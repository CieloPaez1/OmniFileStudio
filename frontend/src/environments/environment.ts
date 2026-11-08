// =============================================================================
// [IONIC 9 - ANEXO 9.1 Y 12.2: ENTORNOS Y PRUEBA EN TELÉFONO VÍA WI-FI]
// Al usar `window.location.hostname`, si abrís la app en la PC apunta a
// `http://localhost:8080`, y si la abrís desde tu celular conectado al mismo
// Wi-Fi (`http://192.168.x.x:8100`), apunta automáticamente al Backend de tu PC
// (`http://192.168.x.x:8080`).
// =============================================================================
const currentHost =
  typeof window !== 'undefined' && window.location?.hostname
    ? window.location.hostname
    : 'localhost';

export const environment = {
  production: false,
  apiUrl: `http://${currentHost}:8080`
};
