# Especificación: Calendario de Vencimientos de Proyectos

## Descripción
Se requiere una sección en el Dashboard principal que actúe como un calendario de alertas para los proyectos próximos a vencer. El sistema agrupará los proyectos registrados basándose en su fecha de finalización (`endDate`) y los categorizará en diferentes columnas temporales.

## Reglas de Negocio y Criterios de Aceptación
1. **Columna "Vencidos" (🔴):** Mostrar proyectos cuya `endDate` sea anterior al día actual y su estado NO sea `CLOSED`.
2. **Columna "Vence Hoy" (🟡):** Mostrar proyectos cuya `endDate` sea exactamente igual a la fecha actual y su estado NO sea `CLOSED`.
3. **Columna "Mañana" (🔵):** Mostrar proyectos cuya `endDate` corresponda al día siguiente y su estado NO sea `CLOSED`.
4. **Columna "Próxima Semana" (🔵):** Mostrar proyectos cuya `endDate` esté dentro de los próximos 7 días (excluyendo "hoy" y "mañana") y su estado NO sea `CLOSED`.
5. **Columna "Completados" (🟢):** Mostrar los últimos 5 proyectos que hayan alcanzado el estado `CLOSED`, indicando que ya están finalizados.
6. **Optimización y Arquitectura:** La lógica de agrupación temporal se ejecutará íntegramente en el Frontend utilizando Signals de Angular (`computed`), evaluando las fechas de los proyectos cacheados contra la fecha actual del sistema, sin requerir carga adicional al Backend.

## Diseño Visual
- Se implementarán tarjetas para cada proyecto dentro de las columnas, indicando el nombre del proyecto, la fecha de inicio (`startDate`) y la fecha límite (`endDate`).
- Se utilizarán bordes cromáticos a la izquierda de cada tarjeta para distinguir el nivel de urgencia o estado.
