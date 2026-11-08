# Prompt Original

**Feature:** Calendario de Vencimientos de Proyectos

**Interacción con el usuario:**
> **CieloPaez1:** "Calendario de vencimientos
> Mostrar tareas próximas a vencer:
> Hoy:
> - Entrega documentación
> Mañana:
> - Implementar API
> Próxima semana:
> - Testing
> Notificaciones visuales
> Ejemplos:
> 🔴 Vencida
> 🟡 Vence hoy
> 🟢 Completada"

*(Posteriormente aclarado)*:
> **CieloPaez1:** "vuelvamos al tema del calendario ,prefiero ese de calendario de vencimineto de proyectos... pero las tareas no se vencen ,sino los proyectos ,por que esos tienen un inicio y fin"

**Resolución técnica:**
El agente (Antigravity) resolvió la solicitud implementando una sección de 4 columnas en el componente principal (`HomeComponent`). Utilizando Angular Signals (`computed`), se filtró la lista global de proyectos calculando dinámicamente si la fecha límite (`endDate`) ya había pasado, era hoy, mañana, o en la próxima semana en comparación con la fecha local del navegador, logrando la funcionalidad solicitada sin necesidad de crear endpoints adicionales ni campos nuevos en la base de datos de tareas.
