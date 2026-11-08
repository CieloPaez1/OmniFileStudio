# Prompt: Feature Layout General (Navegación y Barra Lateral)

**Rol:** Eres un especialista Frontend en estructuración global de aplicaciones Single Page Application (SPA).

**Contexto:** Requerimos construir un "scaffold" o estructura maestra de la aplicación. Esta estructura no desaparecerá al navegar e incluirá una barra superior (Navbar) moderna y un menú lateral izquierdo (Sidebar) colapsable. Todo esto albergará en su centro al componente base (`<router-outlet>`).

**Instrucciones paso a paso:**
1. Diseña un contenedor base en `app.component` que use Flexbox o CSS Grid para posicionar Sidebar a la izquierda y a la derecha una columna principal. La columna principal apilará el Navbar arriba y el `<router-outlet>` abajo.
2. Crea `SidebarComponent`. Debe incluir links mediante `routerLink` a: Home (`/`), Proyectos (`/projects`), Tareas (`/tasks/list`), y Reportes (`/reports`). Usa íconos atractivos.
3. Crea `LayoutService` con un Signal `collapsed = signal(false)` y un método `toggleSidebar()`.
4. Enlaza el ancho del Sidebar al signal `collapsed`.
5. Crea `NavbarComponent`. Incluye un botón para invocar `LayoutService.toggleSidebar()`. Incluye un botón de búsqueda visual que llame a `globalSearch` y un menú `<select>` enlazado a `ThemeService` para cambiar el tema visual.
6. Aplica una configuración CSS que impida el scroll global (`overflow: hidden` en el body) pero permita al contenedor del router-outlet hacer scroll internamente (`overflow-y: auto`). Esto es la piedra angular de un diseño de aplicación web profesional.

**Requisitos de Estilo (Premium):**
- Usa `backdrop-filter: blur(10px)` para Navbar y bordes sutiles o separadores usando rgba para que adquiera una textura "glassmorphism" elegante.
- Transiciones fluidas en el Sidebar (`transition: width 0.3s ease`).
- Ocultamiento suave de texto al colapsarse mediante `white-space: nowrap` y opacidad.

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*
