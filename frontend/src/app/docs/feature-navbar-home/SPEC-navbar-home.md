# SPEC - Navbar, Home y Reportes

## Rama
`feature/navbar-home`

## Objetivo
Mejorar la experiencia principal de la aplicacion agregando una navegacion lateral mas clara, un navbar con busqueda util, un Home tipo dashboard y pantallas de reportes para consultar el avance general y por proyecto.

## Alcance
- Sidebar con secciones principales: Inicio, Proyectos, Tareas y Reportes.
- Navbar con buscador de proyectos y tareas.
- Home dividido en resumen de proyectos y resumen de tareas.
- Acciones rapidas para crear proyectos y tareas.
- Reporte general con avance global, horas, distribucion de estados y alertas.
- Reporte por proyecto con selector, tareas asociadas, avance y horas.
- Layout adaptable cuando el sidebar se colapsa.

## Requisitos funcionales
- El usuario puede buscar proyectos por nombre, descripcion o estado.
- El usuario puede buscar tareas por titulo, responsable, proyecto o estado.
- La busqueda debe aceptar estados en espanol, por ejemplo `hecho`, `por hacer`, `en progreso`, `activo`, `cerrado`.
- Los resultados de busqueda deben aparecer desde la primera letra y limitarse para no generar un dropdown demasiado largo.
- El Home debe mostrar:
  - total de proyectos
  - proyectos planificados, en proceso y terminados
  - porcentaje de proyectos terminados
  - total de tareas
  - tareas por hacer, en proceso y hechas
  - porcentaje de tareas hechas
  - ultimos proyectos y tareas
- El sidebar debe permitir colapsarse y el contenido principal debe ocupar el espacio liberado.
- Reportes debe incluir:
  - resumen general del trabajo
  - reporte por proyecto

## Requisitos no funcionales
- Mantener componentes standalone de Angular.
- Usar `environment.apiUrl` para URLs del backend.
- Evitar caracteres rotos en textos visibles.
- Mantener estilos responsivos para pantallas chicas.
- Usar iconos consistentes mediante Lucide.

## Archivos principales modificados
- `src/app/components/navbar/*`
- `src/app/components/sidebar/*`
- `src/app/pages/home/*`
- `src/app/pages/reports/*`
- `src/app/services/search.service.ts`
- `src/app/services/layout.service.ts`
- `src/app/services/project.service.ts`
- `src/app/services/task.service.ts`
- `src/app/app.routes.ts`
- `src/app/app.*`
- `src/app/models/task.model.ts`

## Criterios de aceptacion

**Escenario: Compilación exitosa**
- **Given** el repositorio clonado con las dependencias instaladas,
- **When** se ejecuta `npm run build`,
- **Then** el proyecto compila correctamente sin errores bloqueantes.

**Escenario: Funcionalidad del Sidebar y Layout**
- **Given** que el usuario está en la aplicación,
- **When** abre el sidebar,
- **Then** este muestra los iconos y textos sin duplicaciones visuales.
- **When** colapsa el sidebar,
- **Then** el navbar y el contenido principal se expanden ocupando el espacio restante.

**Escenario: Buscador dinámico y Caché**
- **Given** que el usuario interactúa con el buscador del navbar,
- **When** escribe una palabra por primera vez,
- **Then** el sistema descarga los proyectos y tareas y los guarda en memoria.
- **When** el usuario escribe otra palabra,
- **Then** el buscador filtra sobre los datos en caché de forma inmediata sin realizar peticiones HTTP adicionales.

**Escenario: Visualización del Home Dashboard**
- **Given** que el usuario navega a la ruta `/home`,
- **When** la página carga exitosamente,
- **Then** se muestran dos paneles principales: Resumen de Proyectos y Resumen de Tareas.

**Escenario: Fallo de conexión al backend en vistas principales**
- **Given** que el usuario navega a `/home` o `/reports` (o usa el buscador),
- **When** el backend no responde o devuelve un error,
- **Then** los proyectos y tareas se asumen como listas vacías (catchError) y la interfaz se muestra sin romperse, sin registrar `console.error` brutos en la consola de producción.

**Escenario: Navegación de Reportes**
- **Given** que el usuario quiere consultar métricas,
- **When** ingresa a `/reports`,
- **Then** ve una vista enfocada en el progreso global.
- **When** ingresa a `/reports/project` y selecciona un proyecto,
- **Then** ve el avance, tareas y horas específicas de dicho proyecto.

**Escenario: Componentes optimizados y desacoplados**
- **Given** que se renderiza el Home o un Reporte,
- **When** se calculan los totales y porcentajes,
- **Then** el sistema emplea Angular Signals (`computed()`) en lugar de getters para mejorar el rendimiento.
- **And** las etiquetas de los estados se traducen eficientemente utilizando Pipes Standalone.

**Escenario: Experiencia de Usuario Moderna (Filtros, Gráficos y Alertas)**
- **Given** que el usuario navega por la aplicación,
- **When** interactúa con el menú superior o el panel central,
- **Then** visualiza un dropdown interactivo para su perfil, y un panel principal con gráficos de dona (`Chart.js`) para el estado de Proyectos y Tareas.
- **And** al alternar entre la vista global y "Mis Tareas", los gráficos se animan y recalculan instantáneamente con la información filtrada usando Signals, y el sistema muestra un panel superior rojo de "Atención Requerida" si hay tareas pesadas pendientes.

## Verificacion realizada
Se ejecuto:

```bash
npm.cmd run build
```

Resultado: build exitoso. Permanece un warning de presupuesto del bundle inicial, no bloqueante.
