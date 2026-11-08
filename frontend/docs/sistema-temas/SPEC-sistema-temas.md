# Feature: Sistema de Temas Dinámicos

## Descripción general
El usuario puede cambiar la apariencia visual de toda la aplicación eligiendo entre múltiples temas predefinidos (light, dark, minimal, cyberpunk, ocean, sunset, forest, crimson, cute). El sistema aplica las variables de color globales instantáneamente sin recargar la página e inyecta propiedades personalizadas en elementos interactivos como los gráficos.

## Endpoints involucrados
- *N/A (Lógica puramente en el cliente (Frontend))*

## Restricciones de negocio
- El tema elegido debe persistir en el `localStorage` del navegador del usuario.
- Debe existir un tema por defecto (`light`).
- La conmutación de temas debe cambiar dinámicamente las variables de color CSS a nivel raíz (`:root`).
- Los componentes, como los gráficos de Chart.js, deben suscribirse al cambio de tema y recalcular sus estilos de inmediato para mantener armonía visual.

## Lineamientos técnicos
- Uso de `ThemeService` (`@Injectable({ providedIn: 'root' })`).
- Uso de `Signals` (`currentTheme`) para notificar reactivamente a toda la aplicación el cambio.
- Mutación de atributos en el DOM (`document.documentElement.setAttribute('data-theme', theme)`).
- Definición exhaustiva de variables de CSS (`--bg-primary`, `--bg-secondary`, `--text-primary`, `--accent-color`, etc.) en el archivo `styles.css`.
- Soporte para fuentes personalizadas por tema importadas de Google Fonts (ej: `Orbitron` para cyberpunk, `Quicksand` para cute).

## Criterios de aceptación
- Dado que el usuario navega a la aplicación por primera vez, cuando carga, entonces se le asigna el tema `light` (o el que detecte su sistema) y se guardan sus colores.
- Dado que el usuario selecciona el tema "Cyberpunk", cuando hace clic en el selector, el fondo se torna oscuro, la tipografía cambia a un estilo tech y el cambio se percibe instantáneamente en toda la UI.
- Dado que el usuario cierra el navegador y lo vuelve a abrir, cuando ingresa a la aplicación, entonces se lee el `localStorage` y su tema seleccionado previamente se re-aplica.

## Agente IA
Antigravity — prompts documentados en PROMPT-sistema-temas.md

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*
