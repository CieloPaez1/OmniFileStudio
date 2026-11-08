# Feature: Dashboard Principal (Home)

## Descripción general
El dashboard principal es la pantalla de inicio de la aplicación. Proporciona métricas clave resumidas de los proyectos y tareas, visualizaciones gráficas del estado actual de los mismos, y un listado de los proyectos de alta prioridad y las tareas pendientes más recientes. Se adapta dinámicamente al tema actual de la aplicación.

## Endpoints involucrados
- `GET /projects`
  - 200: Devuelve todos los proyectos para calcular estadísticas y mostrar recientes.
- `GET /tasks`
  - 200: Devuelve todas las tareas para calcular estadísticas y mostrar recientes.

## Restricciones de negocio
- El dashboard debe cargar tanto proyectos como tareas al unísono.
- Las estadísticas deben mostrar:
  - Total de proyectos y cuántos están activos.
  - Total de tareas, cuántas están completadas y la tasa de finalización (%).
- Debe mostrar gráficos de tipo dona (Chart.js) que se adaptan en forma y color dependiendo del Tema global seleccionado en la aplicación.
  - Para el tema "cute", el gráfico debe mutar a un arcoíris en degradé de 360 grados.
- En la tabla de "Proyectos Activos", debe permitir cambiar rápidamente el estado de un proyecto a ACTIVE o CLOSED y eliminar el proyecto.
- En la sección "Últimas Tareas", debe mostrar las tareas marcadas como TODO y permitir marcarlas como DONE directamente desde el dashboard.

## Lineamientos técnicos
- Standalone component con selector `app-home`
- Uso de `forkJoin` para carga concurrente.
- Manejo de estado con `Signals` (`metrics`, `loading`, `error`, etc.)
- Efectos (`effect()`) de Angular para reaccionar al cambio de tema (`ThemeService`) y reconstruir los gráficos dinámicamente.
- Integración con `Chart.js` para visualización de datos.
- Estructura responsiva de grillas CSS (`grid-template-columns`).
- Uso exclusivo de variables de CSS del `ThemeService` para fondos, textos y bordes.

## Criterios de aceptación
- Dado que el usuario ingresa a la aplicación, cuando carga la página principal, entonces ve los indicadores de resumen numéricos calculados correctamente.
- Dado que el usuario cambia el tema desde la barra de navegación, cuando se aplica el nuevo tema, entonces los gráficos de Chart.js se destruyen y se reconstruyen instantáneamente con los colores y formas exclusivas del nuevo tema.
- Dado que un usuario hace clic en el estado de una "Última tarea", cuando confirma la acción, el estado pasa a DONE y se actualizan los gráficos en tiempo real.

## Agente IA
Antigravity — prompts documentados en PROMPT-dashboard.md

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*
