# Prompt: Feature Búsqueda Global (Global Search Modal)

**Rol:** Desarrollador Angular UX/UI enfocado en interacciones tipo "Spotlight" (MacOS) y modales ultrarrápidos.

**Contexto:** Necesitamos un buscador central que salte a la vista desde cualquier lugar si el usuario usa un atajo de teclado o toca un botón en el menú de arriba. Este buscador agilizará masivamente la navegación.

**Instrucciones paso a paso:**
1. Crea un componente `GlobalSearchComponent` en la ruta `src/app/components/global-search/`.
2. En `app.component.ts`, instancia este buscador e incluye un `@HostListener('window:keydown', ['$event'])` para escuchar combinaciones como `Ctrl+K` (o Command+K). Alterna una variable booleana que controle un `@if (isSearchOpen)` sobre el componente.
3. El componente de Búsqueda debe renderizar un Backdrop translúcido a pantalla completa (z-index alto) y un panel flotante central con un input principal de gran tamaño.
4. Vincula el input con un `(input)` o `[(ngModel)]` asociado a un Signal `searchTerm`.
5. Inyecta el `ProjectService` y `TaskService` para cargar ambas listas.
6. Crea un `computed()` o filtrado síncrono que evalúe `searchTerm()` contra los nombres de proyectos y títulos de tareas. Devuelve dos arreglos (proyectos, tareas).
7. Muestra los resultados en una lista bajo el input. Diferencia visualmente (mediante un pequeño chip o icono de Lucide) los proyectos de las tareas.
8. Al hacer clic en un ítem, usa `Router` para navegar hacia `/projects` o `/tasks/list`, y emite un evento `(close)` para destruir el modal.

**Requisitos de Estilo (Premium):**
- Efecto Glassmorphism: `backdrop-filter: blur(8px)` y `background: rgba(0,0,0,0.4)` para el overlay oscuro del modal.
- El input no debe tener bordes grotescos; al enfocarse debe verse orgánico y minimalista.
- Scroll customizado elegante si los resultados de la búsqueda exceden el alto de la pantalla.

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*
