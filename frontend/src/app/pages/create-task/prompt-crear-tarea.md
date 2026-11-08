# Prompts — Feature: Crear Tarea

## Agente utilizado
Antigravity

## Prompt principal

Soy estudiante de Programación Avanzada II, cursada 2026.
Estoy desarrollando el frontend de una app de gestión de proyectos y tareas.
El backend es una API REST en Java con Spring Boot.
El frontend usa Angular con standalone components, Bootstrap 5 y Reactive Forms.

Feature a implementar: Crear Tarea dentro de un Proyecto

Endpoint: POST /projects/{projectId}/tasks
Body: { title, estimateHours, assignee, status }
Response 201: TaskResponse
Response 400: validación fallida
Response 404: proyecto no encontrado
Response 409: proyecto CLOSED no acepta tareas

Restricciones de negocio:
- title obligatorio
- estimateHours > 0
- assignee opcional
- status: TODO | IN_PROGRESS | DONE
- No se puede crear tarea en proyecto CLOSED
- Si status es DONE el backend setea finishedAt = now

Restricciones técnicas:
- Standalone component con selector app-create-task
- Bootstrap 5 para estilos
- Servicio TaskService en src/app/services/
- Signals para manejo de estado
- El projectId se selecciona desde un dropdown con proyectos del localStorage

Generar: componente, servicio, modelo y template.

## Iteraciones relevantes

1. Se creó task.model.ts con la interfaz Task
2. Se creó TaskService con método create()
3. El dropdown de proyectos se carga desde localStorage
4. Se agregaron validaciones de título y estimateHours en el frontend

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*

