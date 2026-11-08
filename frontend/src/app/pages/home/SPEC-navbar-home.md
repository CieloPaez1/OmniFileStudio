# Especificación Técnica: Navbar y Home Dashboard

## Descripción General
Esta feature implementa el Navbar superior con un buscador global, el Sidebar de navegación, y el Dashboard principal (Home) que muestra estadísticas globales mediante gráficos (Chart.js) y métricas en tiempo real.

## Criterios de Aceptación (Given/When/Then)

### 1. Búsqueda y Navegación desde el Navbar
**Given** que el usuario se encuentra en cualquier vista de la aplicación
**When** el usuario ingresa un ID o término válido en el buscador del Navbar y hace una búsqueda
**Then** la aplicación navega correctamente hacia la ruta de detalles correspondiente (`/projects/:id` o `/tasks/:id`)

### 2. Visualización del Dashboard (Home)
**Given** que el backend responde exitosamente con la lista de proyectos y tareas
**When** el usuario navega a la ruta principal (`/`)
**Then** se renderizan gráficos de dona mostrando las estadísticas consolidadas y listas de métricas en tiempo real.

### 3. Escenario de Error: Backend sin respuesta
**Given** que el servidor backend (json-server) se encuentra apagado o inaccesible (HTTP error)
**When** el usuario navega al Home Dashboard
**Then** el servicio silencia la excepción evitando crashes (`console.error`), inicializando las listas en vacío (`projects.set([])`) de forma que la vista muestre un diseño limpio de "sin datos" o 0 estadísticas en lugar de una pantalla rota.

## Tech Stack
- **Framework:** Angular 17+ (Signals, Standalone Components, ChangeDetectionStrategy.OnPush)
- **Styling:** CSS puro, diseño Grid y Flexbox.
- **Icons:** `@lucide/angular`.
- **Charts:** `chart.js`
- **PDF Export:** `jspdf`, `html2canvas`

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*
