# Feature: Modificar Proyecto

## Descripción general
El usuario puede modificar la información de un proyecto existente mediante un formulario pre-poblado con los datos actuales del proyecto.

## Endpoints involucrados
- `GET /projects/{id}`
  - Response 200: Devuelve los datos actuales del proyecto.
  - Response 404: Proyecto no encontrado.
- `PUT /projects/{id}`
  - Response 200: Proyecto actualizado correctamente.
  - Response 400: Datos inválidos.
  - Response 404: Proyecto no encontrado.
  - Response 409: Conflicto (ej. nombre duplicado).

## Restricciones de negocio
- El nombre del proyecto es obligatorio y tiene un máximo de 100 caracteres.
- La fecha de inicio es obligatoria.
- La descripción tiene un máximo de 500 caracteres y es opcional.
- El estado (`status`) no puede estar vacío y debe ser PLANNED, ACTIVE o CLOSED.
- Se debe mostrar un indicador de carga mientras se obtienen los datos del backend y al guardar.

## Lineamientos técnicos
- Standalone component con selector `app-edit-project`
- Formularios reactivos (ReactiveFormsModule)
- Validaciones síncronas de Angular
- Uso de `ActivatedRoute` para obtener el ID desde la ruta (`/projects/edit/:id`)
- Uso de Signals para manejo de estado (`loading`, `saving`, `error`, `success`)
- `HttpClient` con uso exclusivo de `environment.apiUrl` (sin strings harcodeados, sin `console.error`) en `ProjectService`.
- Navegación automática hacia `/projects` 2 segundos después de un guardado exitoso usando `Router`.

## Criterios de aceptación

- Dado que ingreso a la ruta de edición con un ID válido,
  cuando se carga el componente,
  entonces el formulario se pre-puebla con los datos traídos del backend.

- Dado que el usuario borra el nombre del proyecto,
  cuando intenta guardar los cambios,
  entonces se muestra un mensaje de error "El nombre es requerido" y el formulario no se envía.

- Dado que el usuario edita datos y envía el formulario exitosamente,
  cuando el backend devuelve status 200,
  entonces se muestra un mensaje de éxito y tras 2 segundos redirige a la lista de proyectos.

- Dado que el usuario intenta guardar con un nombre de proyecto duplicado,
  cuando el backend devuelve status 409,
  entonces se muestra un mensaje indicando el conflicto ("Conflicto: nombre duplicado o regla de negocio.").

- Dado que la conexión falla al intentar guardar,
  cuando se envía el formulario,
  entonces se muestra un cartel de error "No se pudo conectar al servidor."

- Dado que ingreso a editar un proyecto inexistente,
  cuando el backend responde 404 al cargar,
  entonces se muestra un mensaje "Proyecto no encontrado." y no se permite interactuar con el formulario.

- Dado que el usuario ingresa un texto mayor al límite permitido (ej: 100 caracteres en el nombre),
  cuando intenta guardar,
  entonces el formulario no se envía y muestra el estilo de error visual en el campo correspondiente.

## Agente IA
Antigravity — prompts documentados en PROMPT-editar-proyecto.md


> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*

