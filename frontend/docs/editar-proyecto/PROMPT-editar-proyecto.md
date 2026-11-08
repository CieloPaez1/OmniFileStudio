# Prompt: Feature Modificar Proyecto

**Rol:** Desarrollador Frontend Angular 17+ Senior experto en Standalone Components, Reactive Forms y Signals.

**Contexto:** Estamos creando un gestor de proyectos. Necesito implementar la pantalla para modificar un proyecto existente. Ya tienes el `ProjectService` base.

**Instrucciones paso a paso:**
1. Agrega los métodos `getById(id: number)` y `update(id: number, project: Project)` en el `ProjectService` usando `HttpClient` y `environment.apiUrl`. IMPORTANTE: en el `handleError` no utilices `console.error`.
2. Crea el componente standalone `EditProjectComponent` en `src/app/pages/edit-project/`.
3. El componente debe usar `ActivatedRoute` en el `ngOnInit` para capturar el parámetro `id` de la ruta.
4. Una vez obtenido el ID, llama a `ProjectService.getById` para cargar los datos en un formulario reactivo (usando `patchValue`).
5. El formulario debe tener: Name (required, max 100), Description (max 500), StartDate (required), EndDate, y Status (required).
6. Usa Signals para manejar los estados `loading` (para la carga inicial), `saving` (durante el PUT), `error` y `success`.
7. En el HTML, mientras `loading` sea true, muestra un spinner centrado.
8. El HTML debe contener campos estilizados con Bootstrap 5 y CSS custom para un diseño premium (bordes redondeados, inputs grises que se vuelven blancos al focus con sombra azul).
9. Muestra alertas condicionales para `error()` o `success()`. 
10. Si la petición PUT (`onSubmit`) es exitosa, establece `success` a true, oculta el `saving`, y usa un `setTimeout` de 2000ms para redirigir mediante `Router` a `/projects/list`.
11. Añade la ruta `{ path: 'projects/edit/:id', component: EditProjectComponent }` en `app.routes.ts`. Elimina componentes inexistentes del array de rutas para evitar errores de compilación.

**Diseño Premium:**
- Títulos llamativos y subtítulos grises descriptivos (`#6b7280`).
- Card contenedora con `border-radius: 24px` y sombras suaves.
- Botones modernos. El botón de Guardar debe tener un spinner al lado del texto cuando `saving()` sea true.

Por favor, genera el código del componente (TS, HTML, CSS) y los ajustes al servicio y rutas.


> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*

