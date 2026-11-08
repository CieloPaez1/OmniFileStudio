# Prompt: Feature Sistema de Temas Dinámicos

**Rol:** Eres un arquitecto Frontend especializado en Sistemas de Diseño (Design Systems) en Angular y CSS moderno.

**Contexto:** La aplicación requiere un sistema de "Themes" avanzado que no solo cambie modo claro y oscuro, sino que soporte múltiples paletas cromáticas con tipografías y efectos visuales particulares para cada uno, logrando que la aplicación cambie de estado de ánimo completo según la elección del usuario.

**Instrucciones paso a paso:**
1. En `src/styles.css`, establece una arquitectura de variables en `:root`. Define paletas completas usando el atributo `[data-theme="nombre"]`. Las variables deben incluir backgrounds, superficies de tarjetas, textos, colores semánticos (success, warning, danger), sombras (glow) y familias tipográficas.
2. Crea los siguientes temas en CSS: `light`, `dark`, `minimal`, `cyberpunk`, `ocean`, `sunset`, `forest`, `crimson`, `cute`. Cada uno debe importar y usar una tipografía adecuada de Google Fonts (Inter, Orbitron, Nunito, Quicksand, etc).
3. Crea un servicio global `ThemeService` en Angular. Utiliza un Signal `currentTheme` para rastrear el tema activo.
4. En el servicio, lee `localStorage` al inicializar para mantener la persistencia.
5. Crea un método `setTheme(theme: string)` que actualice el Signal, guarde en `localStorage` y mute el DOM usando `document.documentElement.setAttribute('data-theme', theme)`.
6. Enlaza este servicio con el selector de temas del componente de navegación (Navbar), para que el usuario pueda conmutar a demanda.

**Requisitos de Estilo (Premium):**
- Variables de transición fluida: `* { transition: background-color 0.3s ease, color 0.3s ease; }` (aplicado de forma segura).
- Los colores semánticos deben ajustarse en brillo o saturación para que contrasten bien contra el fondo de cada tema.
- El tema "Cute" debe usar tonos pastel muy suaves con formas redondeadas, mientras que "Cyberpunk" debe usar neones sobre fondos grises oscuros.

Por favor, entrégame el código de TypeScript para el servicio y el extenso CSS necesario.

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*
