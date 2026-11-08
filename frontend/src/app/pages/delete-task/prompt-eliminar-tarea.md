# Prompts — Feature: Eliminar Tarea

## Agente utilizado
Antigravity

## Prompt principal

Soy estudiante de Programación Avanzada II, cursada 2026.
Estoy desarrollando el frontend de una app de gestión de proyectos y tareas.
El backend es una API REST en Java con Spring Boot.
El frontend usa Angular con standalone components, Bootstrap 5.

Feature a implementar: Eliminar Tarea

Endpoint: DELETE /projects/{projectId}/tasks/{taskId}
Response 200: tarea eliminada
Response 404: tarea o proyecto no encontrado

Restricciones de negocio:
- Se necesita projectId y taskId para eliminar
- Confirmación antes de eliminar con confirm()

Restricciones técnicas:
- Standalone component con selector app-delete-task
- Bootstrap 5 para estilos
- TaskService en src/app/services/
- Signals para manejo de estado
- Tareas cargadas desde GET /tasks

Generar: componente y template.

## Iteraciones relevantes

1. Se reutilizó TaskService agregando método delete()
2. Las tareas se cargan desde el backend al iniciar el componente
3. Se muestra projectId en la tabla para facilitar la eliminación

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*

