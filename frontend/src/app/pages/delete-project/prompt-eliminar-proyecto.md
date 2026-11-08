# Prompt Inicial: Eliminar Proyectos

**Objetivo:** Crear un componente standalone `DeleteProjectComponent` que liste proyectos y permita eliminarlos consumiendo el `ProjectService`.

**Requerimientos Técnicos:**
1. **Componente Standalone:** Configurar los imports (`CommonModule`) y usar Signals para el manejo del estado (`projects`, `loading`, `error`, `success`).
2. **Integración con Servicios:** Invocar `getAll()` en el `ngOnInit` para cargar la lista desde el backend.
3. **Lógica de Eliminación:** Proveer un método `delete(id)` que, previa confirmación del navegador (`window.confirm()`), invoque `ProjectService.delete(id)`.
4. **Manejo de Errores:** Reutilizar el interceptor o `handleError` del `ProjectService` para procesar códigos de estado (404, 409, 0). Actualizar la lista en el cliente al eliminar exitosamente.

**Requerimientos Visuales y UI/UX:**
1. **Layout Premium:** Usar CSS nativo consistente con el resto del proyecto. Mostrar una tabla `table-responsive`.
2. **Estados UI:** Manejar y mostrar visualmente los estados de `loading` (indicador de carga), `error` (banner rojo), `success` (banner verde), y lista vacía.
3. **Botones de Acción:** Incluir un botón de "Eliminar" de color rojo vibrante en la columna de acciones.
4. **Badges:** Renderizar el estado ("PLANNED", "ACTIVE", "CLOSED") en forma de badges coloreadas.


> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*

