# Prompt: Feature Dashboard Principal (Home)

**Rol:** Eres un experto desarrollador Frontend en Angular 17+ usando Standalone Components, Signals y TypeScript estricto. Destacas por crear interfaces dinámicas y métricas visuales utilizando Chart.js.

**Contexto:** Estamos construyendo la página de inicio (Dashboard) de un gestor de proyectos. El dashboard debe mostrar métricas globales y listas de acceso rápido, conectándose con un `ThemeService` para adaptar el estilo visual y los gráficos al instante.

**Instrucciones paso a paso:**
1. Crea un componente standalone `HomeComponent` en `src/app/pages/home/`.
2. Utiliza `ProjectService` y `TaskService` inyectados para obtener los datos de `/projects` y `/tasks` concurrentemente usando `forkJoin`.
3. Calcula `Signals` (o `computed`) para métricas clave: totalProyectos, proyectosActivos, totalTareas, tareasCompletadas, tasaFinalizacion.
4. Diseña una interfaz CSS Grid responsiva con tarjetas superiores para las métricas (usando íconos de Lucide como `LucideBriefcase`, `LucideCheckCircle`).
5. En el medio del layout, incrusta dos elementos `<canvas>` para renderizar gráficos de dona con `Chart.js`: uno para proyectos y otro para tareas.
6. Crea un `effect()` de Angular que dependa del `themeService.currentTheme()`. Cuando cambie el tema, el efecto debe destruir las instancias de `Chart` anteriores y volver a instanciarlas con configuraciones visuales exclusivas para cada tema (por ejemplo, el tema `cute` debe renderizar un degradé en un círculo completo de 360 grados, el tema `ocean` burbujas separadas, etc).
7. Abajo de los gráficos, incluye dos secciones: "Proyectos Activos" (con botón para finalizar) y "Últimas tareas pendientes" (con botón para completarlas). Asegúrate de que las acciones llamen al backend y recarguen los datos.
8. Todo el diseño debe basarse en variables CSS (`var(--bg-primary)`, `var(--text-primary)`, `var(--card-bg)`) sin usar colores hardcodeados para garantizar compatibilidad con los temas.

**Requisitos de Estilo (Premium):**
- Layout de grilla adaptable.
- Gráficos fluidos que mantienen la legibilidad y el contraste.
- Hover effects en tarjetas de resumen y botones de acción.

Por favor, entrégame el código de TypeScript, HTML y CSS del componente.

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*
