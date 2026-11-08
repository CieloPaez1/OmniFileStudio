# Feature: Búsqueda Global (Global Search Modal)

## Descripción general
El usuario puede buscar cualquier proyecto o tarea desde cualquier parte de la aplicación utilizando un atajo de teclado (`Ctrl+K` o `Cmd+K`) o haciendo clic en el buscador falso del Navbar. Esto abre un modal centralizado que cruza datos instantáneamente con el backend y ofrece navegación rápida a los detalles de cada entidad.

## Endpoints involucrados
- `GET /projects`
- `GET /tasks`
*(Nota: Para optimización, se recuperan las listas en el cliente para filtrado dinámico o se pueden llamar bajo demanda).*

## Restricciones de negocio
- El modal debe poder cerrarse con la tecla `Escape` o haciendo clic fuera de él.
- El filtrado debe ser "en vivo" (Type-ahead search).
- Debe poder distinguir visualmente qué resultado es un "Proyecto" y qué resultado es una "Tarea".
- Al hacer clic en un resultado, debe redirigir al usuario al listado correspondiente filtrado, o a la vista de detalle.
- El atajo global de teclado debe prevenir el comportamiento por defecto del navegador (como abrir la barra de búsqueda del navegador con Ctrl+K).

## Lineamientos técnicos
- Componente Standalone `app-global-search`.
- Uso de decoradores `@HostListener('window:keydown', ['$event'])` para atrapar el atajo de teclado globalmente en `app.component` o en un servicio que despierte al componente.
- Uso de `forkJoin` para obtener simultáneamente las listas maestras de datos cuando se abre el buscador.
- Signals para almacenar los resultados (`filteredProjects`, `filteredTasks`, `searchTerm`).
- Se debe inyectar CSS avanzado para lograr el efecto cristal (`backdrop-filter: blur()`) que desenfoque el fondo de la página mientras el usuario está concentrado en la búsqueda.

## Criterios de aceptación
- Dado que un usuario presiona `Ctrl+K` en cualquier pantalla, cuando el evento es capturado, entonces aparece un modal flotante centrado con foco automático en un campo de texto de búsqueda.
- Dado que el usuario empieza a escribir "Integrador", cuando tipeo cada letra, entonces la lista de resultados filtra instantáneamente los Proyectos y las Tareas mostrando solo aquellos que incluyan ese texto en su nombre o título.
- Dado que el usuario selecciona un resultado tipo "Tarea", cuando hace clic, entonces el modal se cierra y el usuario es redirigido a `/tasks/list`.

## Agente IA
Antigravity — prompts documentados en PROMPT-busqueda-global.md

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*
