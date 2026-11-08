# Especificación Técnica: Filtrar Tareas

## Descripción General
Esta feature permite a los usuarios filtrar la lista de tareas en base a criterios específicos, como la estimación mínima de horas (`minEstimate`) y el asignado (`assignee`). Los filtros se envían al backend mediante query parameters.

## Criterios de Aceptación (Given/When/Then)

### 1. Filtrar por asignado
**Given** que el usuario se encuentra en la vista de lista de tareas
**When** el usuario selecciona o escribe un nombre en el filtro de asignado y busca
**Then** la aplicación llama a `TaskService.filter(undefined, assignee)`
**And** se muestran únicamente las tareas cuyo `assignee` coincida con la búsqueda.

### 2. Filtrar por estimación mínima
**Given** que el usuario se encuentra en la vista de lista de tareas
**When** el usuario ingresa un valor numérico (incluyendo 0) en el filtro de estimación mínima
**Then** la aplicación llama a `TaskService.filter(minEstimate, undefined)`
**And** se envían correctamente los parámetros al backend, permitiendo que `0` sea un valor válido
**And** se muestran las tareas que tengan al menos esa cantidad de horas estimadas.

### 3. Filtros combinados
**Given** que el usuario ingresó valores en ambos filtros
**When** ejecuta la búsqueda
**Then** ambos query parameters (`minEstimate` y `assignee`) se envían en la petición HTTP GET
**And** la tabla muestra los resultados que cumplen ambas condiciones.

## Lineamientos Técnicos
- **Servicio:** `TaskService.filter(minEstimate?: number, assignee?: string)`
- La validación `if (minEstimate != null)` asegura que el valor `0` sea enviado correctamente como query param (`?minEstimate=0`).
- Si no se proveen filtros, no se envían los parámetros correspondientes en la URL.

> *Nota: Este documento de especificación fue generado íntegramente por **Antigravity** (Asistente de IA).*
