# Especificación: Listar Proyectos

## Lineamientos Técnicos
- **Componente esperado:** `ProjectListComponent` (Standalone)
- **Ruta esperada:** `/projects/list`
- **Servicio esperado:** `ProjectService.getAll()` interactuando con el endpoint `GET /projects`.
- **Modelo esperado:** `Project` (con soporte reactivo usando Signals).

Feature: Listado de Proyectos
  Como usuario del sistema
  Quiero ver una lista de todos los proyectos registrados
  Para poder gestionarlos visualmente (nota: la edición y eliminación se abordarán en ramas posteriores).

  Scenario: Visualizar proyectos exitosamente
    Given que existen proyectos registrados en el servidor
    When el componente consume el endpoint `GET /projects` mediante el servicio
    Then se debe renderizar la información estructurada en una tabla con las columnas: ID, Nombre, Fechas, Estado, Descripción y Acciones (placeholders).

  Scenario: Lista de proyectos vacía
    Given que el servidor responde al `GET /projects` con una lista vacía `[]`
    When el usuario navega a la pantalla de lista de proyectos
    Then se debe mostrar un "Empty State" amigable indicando "No hay proyectos creados aún."
    And debe aparecer un enlace visible hacia la ruta de creación de proyectos.

  Scenario: Error de red o servidor al cargar
    Given que hay un problema de red o el servidor responde con error
    When el componente intenta cargar la lista
    Then se debe atrapar el error mediante el servicio silenciando excepciones no controladas
    And se debe mostrar un texto en color rojo con el mensaje del error devuelto en la UI.

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*
