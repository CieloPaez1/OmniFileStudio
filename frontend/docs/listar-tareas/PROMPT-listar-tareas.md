# Prompt: Feature Listar Tareas

**Rol:** Eres un experto desarrollador Frontend en Angular 17+ usando Standalone Components, Signals y TypeScript estricto. Destacas por crear interfaces hermosas, "premium" y modernas utilizando CSS puro sobre la grilla de Bootstrap.

**Contexto:** Estamos construyendo un gestor de proyectos. Ya existe el backend en `environment.apiUrl`. Necesito crear la pantalla principal para listar todas las tareas del sistema.

**Instrucciones paso a paso:**
1. Crea un modelo `Task` en `src/app/models/task.model.ts` si no existe.
2. Crea o actualiza `TaskService` (`src/app/services/task.service.ts`) para incluir el método `getAll(): Observable<Task[]>` apuntando a `environment.apiUrl + '/tasks'`. No uses `console.error` en el `handleError`, solo devuelve el mensaje de error procesado.
3. Crea un componente standalone `TaskListComponent` en `src/app/pages/tasks/list/`.
4. El componente debe usar `forkJoin` para llamar tanto a `TaskService.getAll()` como a `ProjectService.getAll()` concurrentemente en el `ngOnInit`.
5. Usa `Signals` para almacenar `tasks`, `projects`, `loading` y `error`.
6. En el HTML, implementa tres estados condicionales (`@if` de Angular 17):
   - Cargando: Un spinner moderno centrado.
   - Error: Un recuadro rojo estilizado que muestre el error del Signal.
   - Vacío: Un mensaje amigable si la lista de tareas tiene length === 0 ("No hay tareas aún").
   - Lleno: Una tabla que liste: ID, Título, Proyecto (cruzando los datos con el signal de projects mediante una función `getProjectName(id)`), Horas, Asignado y Estado, y una columna de Acciones.
7. Para el Estado, usa badges condicionales: 'TODO' (Por hacer, amarillo), 'IN_PROGRESS' (En progreso, azul), 'DONE' (Hecho, verde).
8. Agrega iconos de Lucide-Angular (`ListTodo`, `Edit`, `Trash2`) en los botones de "Acciones". Implementa la lógica para eliminar una tarea usando el `TaskService.delete(projectId, taskId)` y actualizando la lista de forma reactiva si el usuario confirma el cuadro de diálogo. El botón de editar debe navegar a `/projects/:projectId/tasks/edit/:taskId` y estar deshabilitado si el estado es 'DONE'.
9. Asegúrate de añadir el componente en `app.routes.ts` bajo la ruta `tasks/list`. El título de la vista (h1) debe ser "Lista de tareas".

**Requisitos de Estilo (Premium):**
- Usa bordes muy redondeados (`border-radius: 24px` para cards, 16px para alertas).
- Usa un sombreado suave (`box-shadow: 0 4px 12px rgba(0,0,0,0.05)` o `shadow-sm` de Bootstrap con retoques).
- La tabla debe tener un hover effect (`tbody tr:hover`) suave que cambie el background.
- La cabecera de la tabla debe tener un fondo sutil (`#f9fafb`) y color de texto gris oscuro (`#374151`) en negrita.

Por favor, entrégame el código de TypeScript, HTML y CSS del componente, además de las actualizaciones necesarias al servicio y las rutas.


> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*

