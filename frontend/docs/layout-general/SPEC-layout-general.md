# Feature: Layout General (Navegación y Barra Lateral)

## Descripción general
La estructura maestro de la aplicación define el marco en el que residen todas las demás pantallas. Está conformada por un Sidebar (barra lateral) colapsable para la navegación de secciones principales, un Navbar superior con herramientas globales (selector de temas y buscador) y un contenedor central donde se rutean los diferentes componentes.

## Endpoints involucrados
- *N/A (Lógica puramente Frontend y enrutamiento).*

## Restricciones de negocio
- El diseño debe adaptarse a todo el alto de la pantalla (100vh).
- El Sidebar puede ser minimizado (colapsado) por el usuario. El estado (colapsado o expandido) debe preservarse mediante Signals o un servicio especializado (`LayoutService`).
- El contenedor central (router-outlet) debe ajustarse dinámicamente ocupando el resto de la pantalla según el ancho actual del Sidebar.
- El Navbar superior se mantendrá fijo sobre el contenido y hospedará la identidad (branding), el buscador ficticio para desencadenar el Global Search, el nombre del usuario y el selector de Temas visuales.

## Lineamientos técnicos
- Angular Standalone Components para `SidebarComponent` y `NavbarComponent`.
- El Sidebar debe tener una transición en CSS (transition) cuando cambie su propiedad de anchura de, por ejemplo, 280px a 80px (modo colapsado).
- Utilización de `LayoutService` para compartir el Signal `collapsed` entre el Navbar (donde está el botón de menú hamburguesa para togglear) y el Sidebar.
- Inyección de iconos interactivos y atractivos del paquete `lucide-angular`.
- CSS Grid o Flexbox para estructurar el contenedor padre (`app.component`).

## Criterios de aceptación
- Dado que un usuario ingresa a la aplicación, cuando visualiza la interfaz, entonces ve un menú lateral de navegación y una barra superior en todo momento sin importar hacia qué página navegue internamente.
- Dado que el usuario hace clic en el ícono de "Menú" (Hamburguesa) en la parte superior izquierda, cuando finaliza el clic, entonces el Sidebar reduce su ancho ocultando el texto y mostrando solo los iconos, y todo el contenido central se ajusta suavemente al nuevo espacio disponible.

## Agente IA
Antigravity — prompts documentados en PROMPT-layout-general.md

> *Nota: Este documento de especificación y su respectivo código fueron generados íntegramente por **Antigravity** (Asistente de IA).*
