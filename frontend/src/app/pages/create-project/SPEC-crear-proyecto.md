# Feature: Crear Proyecto

## Descripción general
El usuario puede crear un nuevo proyecto completando un formulario con los datos requeridos.
El sistema valida los datos en el frontend y los envía al backend. Si la creación es exitosa,
redirige al listado de proyectos. Si hay error, muestra un mensaje descriptivo.

## Endpoints involucrados
- POST /projects
  - Body: { name, startDate, endDate, status, description }
  - Response 201: ProjectResponse
  - Response 400: validación fallida
  - Response 409: nombre duplicado

## Restricciones de negocio
- name es obligatorio y debe ser único
- endDate >= startDate
- endDate >= hoy
- status debe ser PLANNED, ACTIVE o CLOSED
- description es opcional

## Lineamientos técnicos
- Standalone component
- Angular Material para el formulario
- Reactive Forms con validaciones
- HttpClient con servicio dedicado ProjectService
- ChangeDetectionStrategy.OnPush

## Criterios de aceptación
- Dado que el usuario completa todos los campos válidos,
  cuando hace click en Guardar,
  entonces el proyecto se crea y redirige al listado.

- Dado que el usuario deja el campo name vacío,
  cuando hace click en Guardar,
  entonces ve un mensaje "El nombre es obligatorio".

- Dado que el backend devuelve 409,
  cuando el nombre ya existe,
  entonces ve un mensaje "Ya existe un proyecto con ese nombre".

- Dado que endDate es anterior a startDate,
  cuando hace click en Guardar,
  entonces ve un mensaje de error de fechas.

- Dado que el backend devuelve 400,
  cuando los datos enviados son inválidos,
  entonces ve un mensaje "Datos inválidos.".

- Dado que no hay conexión al servidor (status 0),
  cuando se intenta realizar una petición,
  entonces ve un mensaje "No se pudo conectar al servidor. ".

## Agente IA
Antigravity — prompts documentados durante el desarrollo


> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*

