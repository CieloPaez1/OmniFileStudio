# 🚀 OmniFile Studio — Gestor Universal de Archivos, Escáner a PDF y Suite PDF

**OmniFile Studio** es una aplicación híbrida multiplataforma (**Web de Escritorio + App Móvil Android**) construida con **Angular 21 Standalone**, **Ionic 9**, **Capacitor 8** y un backend en **Java 21 + Spring Boot 3.3.8** bajo **Arquitectura Hexagonal (`Core` y `Adapter`)**.

---

## ✨ Características Principales

### 1. Arquitectura Dual (`frontend/` + `backend/`)
- **Frontend (`frontend/`)**:
  - **Angular 21 Standalone + Signals** (`signal`, `computed`) + **Formularios Reactivos (`FormGroup`, `FormControl`, `Validators`)**.
  - **Ionic 9 Standalone UI** con navegación móvil de **4 Pestañas (`ion-tabs`)** + Menú Lateral (`ion-menu`):
    1. **Inicio / Dashboard (`/mobile/dashboard`)**: KPIs interactivos, estado online/offline en vivo, accesos rápidos y actividad reciente con vista previa.
    2. **Repositorio (`/mobile/repository`)**: Búsqueda instantánea (`ion-searchbar`), filtros por etiquetas, vista Lista/Cuadrícula, deslizamiento táctil (`ion-item-sliding`), `ion-refresher` y selector flotante de conversión.
    3. **Escáner a PDF (`/mobile/scanner`)**: Captura multi-página con `@capacitor/camera` o galería y generación de PDF multi-hoja 100% en cliente con `jsPDF`.
    4. **Suite PDF (`/mobile/pdf-suite`)**: Navegación superior tipo **Hero Cards** para **Unir PDF**, **Dividir PDF**, **Comprimir PDF**, **Firmar PDF digitalmente** (lienzo HTML5 `<canvas>`) y **Conversor Multiformato**.
  - **Versión Web de Escritorio (`/files`)**: Interfaz completa para pantallas grandes.
- **Backend (`backend/`)**:
  - **Java 21 + Spring Boot 3.3.8 + iText 8** con **Arquitectura Hexagonal (`Core` y `Adapter`)**.
  - **API REST Mock (`json-server` en puerto `3000`)** + **Fallback Offline automático** con `@capacitor/preferences`.

### 2. Inteligencia Contextual Local & Privacy-First (100% Client-Side)
- **Motor de Auto-Clasificación y Renombrado Inteligente (`analyzeMetadataSync`)**: Detecta patrones crudos como `"scan_2026_11_08_final.pdf"` y sugiere automáticamente `"Factura_2026-11-08.pdf"` asignando la etiqueta **`Facturas`**.
- **Procesamiento 100% Local**: La conversión de imágenes, compresión, firma digital y ensamblaje de PDFs se ejecutan en el navegador/dispositivo usando `jsPDF` y HTML5 `<canvas>` sin enviar documentos privados a servidores externos.

### 3. Integración Nativa con Capacitor 8 (`CapacitorNativeService`)
- `@capacitor/camera`: Captura de documentos en alta resolución.
- `@capacitor/filesystem`: Guardado y lectura directa en el almacenamiento interno del dispositivo (`OmniFileStudio/`).
- `@capacitor/preferences`: Persistencia offline de metadatos, etiquetas y estado del repositorio.
- **Web Share API + WhatsApp**: Exportación y envío nativo de archivos generados.

### 4. Experiencia de Usuario (UX/UI) Moderna
- **Paleta Slate & Índigo Vibrante (`#6366f1`)** con tarjetas `rounded-2xl` (`20px`) y sombras suaves (`shadow-sm` / `shadow-md`).
- **Badges e Iconos Semánticos por Formato**: Rojo suave para **PDF**, Azul suave para **Imágenes (`PNG`, `JPG`, `WEBP`)**, Verde suave para **Datos/Hojas de cálculo (`CSV`, `JSON`)** e Índigo para **Documentos (`TXT`, `HTML`)**.
- **Vista Previa Multiformato (`FilePreviewModalComponent`)**: Visor interactivo de PDFs, imágenes con zoom/rotación/filtros, tablas CSV y código JSON/TXT.
- **Acciones Rápidas Contextuales (`ContextualQuickActionsComponent`)**: Bottom Sheet + `ion-action-sheet` que detecta automáticamente el formato del archivo y ofrece las herramientas específicas.

---

## 📂 Estructura del Proyecto

```text
OmniFileStudio/
├── backend/                  # API REST Java 21 + Spring Boot (Arquitectura Hexagonal)
│   ├── Core/                 # Dominio puro Java 21, Casos de Uso, Puertos y Tests JUnit 5
│   └── Adapter/              # Infraestructura Spring Boot + JPA + iText 8 + Controladores REST
├── frontend/                 # Aplicación Angular 21 + Ionic 9 + Capacitor 8
│   ├── src/app/ionic/        # App Móvil (4 Tabs, Formulario Reactivo, Visor y Acciones Rápidas)
│   ├── src/app/pages/files/  # App Web de Escritorio (/files)
│   ├── src/app/services/     # FileManagerService + CapacitorNativeService
│   └── db.json               # Base de datos JSON para json-server
└── package.json              # Scripts unificados de ejecución desde la raíz
```

---

## ▶️ Instalación y Ejecución Rápida

### 1. Instalar dependencias del Frontend
```bash
cd frontend
npm install
```

### 2. Levantar la API REST Mock (`json-server` en puerto `3000`)
```bash
cd frontend
npm run api
```
Disponible en: `http://localhost:3000/files`

### 3. Levantar la App Ionic 9 + Angular 21 (Puerto `8100`)
```bash
cd frontend
npm run ionic
```
- **App Móvil (Ionic 9 Tabs):** `http://localhost:8100/mobile/dashboard`
- **Versión Web Escritorio:** `http://localhost:8100/files`

### 4. Ejecutar las Pruebas Unitarias (Vitest)
```bash
cd frontend
npx ng test --watch=false
```
*(15 tests unitarios verificando servicios y formularios reactivos).*
