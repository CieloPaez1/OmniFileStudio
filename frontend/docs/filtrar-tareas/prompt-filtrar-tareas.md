# Prompts — Feature: Filtrar Tareas

## Agente utilizado
Antigravity

## Prompt principal

Soy estudiante de Programación Avanzada II, cursada 2026.
Estoy desarrollando el frontend de una app de gestión de proyectos y tareas.
El backend es una API REST en Java con Spring Boot.
El frontend usa Angular con standalone components, Bootstrap 5 y Reactive Forms.

Feature a implementar: Filtrar Tareas

Endpoint: GET /tasks?minEstimate=8&assignee=alice
Parámetros opcionales: minEstimate (Integer), assignee (String)
Response 200: lista de TaskResponse
Sin parámetros devuelve todas las tareas.

Restricciones de negocio:
- Ambos parámetros son opcionales
- minEstimate debe ser mayor a 0 si se envía
- Se pueden combinar ambos filtros

Restricciones técnicas:
- Standalone component con selector app-filter-tasks
- Bootstrap 5 para estilos
- Reactive Forms para el formulario de filtros
- Servicio TaskService en src/app/services/
- Signals para manejo de estado

Generar: componente y template.

## Iteraciones relevantes

1. Se reutilizó TaskService agregando método filter()
2. Se manejan parámetros opcionales con HttpParams

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*

