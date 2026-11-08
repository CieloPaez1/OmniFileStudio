# Feature: Crear Tarea dentro de un Proyecto

## Descripción general
El usuario puede crear una nueva tarea dentro de un proyecto existente.
El sistema verifica que el proyecto exista y no esté en estado CLOSED antes de crear la tarea.
Si la creación es exitosa, la tarea aparece en la tabla inferior.
Si hay error, muestra un mensaje descriptivo.

## Endpoints involucrados
- `POST /projects/{projectId}/tasks`
  - Body: `{ title, estimateHours, assignee, status }`
  - Response 201: TaskResponse
  - Response 400: validación fallida
  - Response 404: proyecto no encontrado
  - Response 409: el proyecto está CLOSED y no acepta nuevas tareas

## Restricciones de negocio
- `title` es obligatorio
- `estimateHours` debe ser mayor a 0
- `assignee` es opcional
- `status` debe ser TODO, IN_PROGRESS o DONE
- No se puede crear una tarea en un proyecto con estado CLOSED
- Si se crea una tarea con status DONE, el backend setea `finishedAt = now`

## Lineamientos técnicos
- Standalone component con selector `app-create-task`
- Bootstrap 5 para estilos
- Reactive Forms con validaciones
- HttpClient con servicio dedicado `TaskService` en `src/app/services/`
- Signals para manejo de estado: `loading`, `error`, `success`, `tasks`
- El dropdown de proyectos se carga dinámicamente desde la base de datos usando `ProjectService`

## Criterios de aceptación

### Escenario: Creación exitosa de una tarea
- **Given** que el usuario completó todos los campos requeridos con datos válidos
- **When** hace click en el botón Guardar
- **Then** la tarea se crea exitosamente
- **And** la nueva tarea se muestra en la tabla inferior

### Escenario: Error de validación (título vacío)
- **Given** que el usuario dejó el título de la tarea vacío
- **When** hace click en el botón Guardar
- **Then** el formulario no se envía
- **And** se muestra un mensaje de error indicando "El título es obligatorio"

### Escenario: Error de validación (horas inválidas)
- **Given** que el usuario ingresó un valor menor o igual a 0 en las horas estimadas
- **When** hace click en el botón Guardar
- **Then** el formulario no se envía
- **And** se muestra un mensaje de error indicando "Las horas deben ser mayor a 0"

### Escenario: Error de negocio (proyecto cerrado)
- **Given** que el proyecto seleccionado se encuentra en estado CLOSED
- **When** el usuario intenta crear la tarea
- **Then** el sistema recibe un error 409 del backend
- **And** se muestra un mensaje de error con el detalle provisto por el servidor

### Escenario: Error de negocio (proyecto inexistente)
- **Given** que el proyecto seleccionado no existe en la base de datos
- **When** el usuario intenta crear la tarea
- **Then** el sistema recibe un error 404 del backend
- **And** se muestra un mensaje de error indicando "Proyecto no encontrado"

### Escenario: Error de conectividad
- **Given** que el backend no está disponible
- **When** el usuario intenta crear una tarea o cargar proyectos
- **Then** la petición falla
- **And** se muestra un mensaje de error indicando problemas de conexión

## Agente IA
Antigravity — prompts documentados en prompt-crear-tarea.md

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*

