# Feature: Modificar Tarea

## Descripción general
El usuario puede modificar la información de una tarea existente (por ejemplo, cambiar su estado o asignado). El formulario se pre-puebla con los datos actuales de la tarea.

## Endpoints involucrados
- `GET /projects/{projectId}/tasks/{taskId}`
  - Response 200: Devuelve los datos actuales de la tarea.
  - Response 404: Proyecto o tarea no encontrados.
- `PUT /projects/{projectId}/tasks/{taskId}`
  - Response 200: Tarea actualizada correctamente.
  - Response 400: Datos inválidos.
  - Response 404: Proyecto o tarea no encontrados.
  - Response 409: Conflicto de negocio.

## Restricciones de negocio
- Se necesita el `projectId` y el `taskId` en la URL.
- El título de la tarea es obligatorio y tiene un máximo de 100 caracteres.
- Las horas estimadas deben ser como mínimo 1.
- El responsable (assignee) es opcional.
- El estado (`status`) no puede estar vacío y debe ser TODO, IN_PROGRESS o DONE.
- La fecha de vencimiento (dueDate) es un campo opcional para establecer una fecha límite.

## Lineamientos técnicos
- Standalone component con selector `app-edit-task`
- Formularios reactivos (ReactiveFormsModule)
- Validaciones síncronas de Angular
- Uso de `ActivatedRoute` para obtener `projectId` y `taskId` desde la ruta (`/projects/:projectId/tasks/edit/:taskId`).
- Uso de Signals para manejo de estado (`loading`, `saving`, `error`, `success`)
- `HttpClient` con uso exclusivo de `environment.apiUrl` (sin strings harcodeados, sin `console.error`) en `TaskService`.
- Navegación automática hacia `/projects/:projectId` 2 segundos después de un guardado exitoso usando `Router`.

## Criterios de aceptación

- Dado que ingreso a la ruta de edición con IDs válidos,
  cuando se carga el componente,
  entonces el formulario se pre-puebla con los datos traídos del backend.

- Dado que el usuario borra el título de la tarea,
  cuando intenta guardar los cambios,
  entonces el botón se deshabilita y se muestra un mensaje de error "El título es requerido".

- Dado que el usuario pone 0 en las horas,
  cuando intenta guardar,
  entonces se muestra el error "Debe ingresar al menos 1 hora".

- Dado que el usuario edita datos y envía el formulario exitosamente,
  cuando el backend devuelve status 200,
  entonces se muestra un mensaje de éxito y tras 2 segundos redirige al detalle del proyecto.

- Dado que la conexión falla al intentar obtener los datos,
  cuando se carga la página,
  entonces se oculta el formulario y se muestra un cartel de error de conexión.

- Dado que la tarea ya no existe (404),
  cuando el usuario intenta guardar los cambios,
  entonces se muestra un mensaje indicando que la tarea no fue encontrada.

- Dado que hay una regla de negocio no cumplida (409),
  cuando el usuario intenta guardar los cambios,
  entonces se muestra el error devuelto por el backend.

- Dado que el usuario supera los 100 caracteres en el título,
  cuando intenta guardar,
  entonces el botón se deshabilita y el formulario muestra el error de validación visualmente.

## Agente IA
Antigravity — prompts documentados en prompt-editar-tarea.md


> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*

