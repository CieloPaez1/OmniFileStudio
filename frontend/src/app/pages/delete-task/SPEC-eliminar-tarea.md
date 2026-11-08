# Feature: Eliminar Tarea

## Descripción general
El usuario puede eliminar una tarea existente desde una tabla que lista todas las tareas.
El sistema solicita confirmación antes de eliminar.
Si la eliminación es exitosa, la tarea desaparece de la tabla.

## Endpoints involucrados
- `DELETE /projects/{projectId}/tasks/{taskId}`
  - Response 200: tarea eliminada correctamente
  - Response 404: tarea o proyecto no encontrado

## Restricciones de negocio
- Se necesita tanto el projectId como el taskId para eliminar
- Se solicita confirmación antes de eliminar

## Lineamientos técnicos
- Standalone component con selector `app-delete-task`
- Bootstrap 5 para estilos
- HttpClient con servicio dedicado `TaskService`
- Signals para manejo de estado: `loading`, `error`, `success`, `tasks`
- Las tareas se cargan desde el backend con GET /tasks
- Los proyectos se cargan concurrentemente con GET /projects para resolver el nombre en la tabla visualmente
- Confirmación con confirm() antes de eliminar

## Criterios de aceptación

- Dado que la tarea existe,
  cuando el usuario hace click en Eliminar y confirma,
  entonces la tarea se elimina y desaparece de la tabla.

- Dado que el usuario hace click en Eliminar,
  cuando aparece la confirmación,
  entonces puede cancelar y la tarea no se elimina.

- Dado que la tarea no existe,
  cuando se intenta eliminar,
  entonces ve el mensaje "Tarea no encontrada".

- Dado que el backend no está corriendo,
  cuando se intenta eliminar,
  entonces ve el mensaje "No se pudo conectar al servidor".

- Dado que no hay tareas en el sistema,
  cuando el usuario carga la pantalla,
  entonces se muestra el mensaje "No hay tareas disponibles" en lugar de la tabla.

## Agente IA
Antigravity — prompts documentados en prompt-eliminar-tarea.md

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*

