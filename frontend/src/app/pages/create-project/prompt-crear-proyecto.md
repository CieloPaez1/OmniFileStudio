# Prompts — Feature: Crear Proyecto

## Agente utilizado
Antigravity

## Prompt principal

Soy estudiante de Programación Avanzada, cursada 2026.
Estoy desarrollando el frontend de una app de gestión de proyectos y tareas.
El backend es una API REST en Java con Spring Boot.
El frontend usa Angular con standalone components, Bootstrap 5 y Reactive Forms.

Feature a implementar: Crear Proyecto

Endpoint: POST /projects
Body: { name, startDate, endDate, status, description }
Response 201: ProjectResponse
Response 400: validación fallida
Response 409: nombre duplicado

Restricciones de negocio:
- name obligatorio y único
- endDate >= startDate
- endDate >= hoy
- status: PLANNED | ACTIVE | CLOSED
- description opcional

Restricciones técnicas:
- Standalone component
- Bootstrap 5 para estilos
- Reactive Forms con validaciones
- Servicio ProjectService en src/app/services/
- Signals para manejo de estado

Generar: componente, servicio, modelo y template.

## Iteraciones relevantes

1. El componente tenía nombre incorrecto (ProjectsComponent) → se corrigió a CreateProjectComponent
2. El templateUrl apuntaba a una ruta incorrecta → se corrigió
3. El backend no tenía CORS configurado → se agregó CorsConfig.java en el backend
4. El backend no tiene GET /projects → se implementó persistencia con localStorage
5. Se agregaron validaciones de fechas con validador de grupo personalizado (AbstractControl)
6. Se ajustó el diseño visual con estilo profesional usando Bootstrap y estilos inline

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*

