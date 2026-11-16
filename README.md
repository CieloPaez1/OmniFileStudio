# FileManager - Gestor Universal de Archivos, Escaner a PDF y Suite PDF

FileManager es una aplicacion hibrida multiplataforma (Web de Escritorio + App Movil Android) construida con Angular 21 Standalone, Ionic 9, Capacitor 8 y un backend en Java 21 + Spring Boot 3.3.8 bajo Arquitectura Hexagonal (Core y Adapter).

---

## Caracteristicas Principales

### 1. Arquitectura Dual (frontend/ + backend/)
- Frontend (frontend/):
  - Angular 21 Standalone + Signals (signal, computed) + Formularios Reactivos (FormGroup, FormControl, Validators).
  - Ionic 9 Standalone UI con navegacion movil de 4 Pestanas (ion-tabs) + Menu Lateral (ion-menu):
    1. Inicio / Dashboard (/mobile/dashboard): KPIs interactivos, estado online/offline en vivo, accesos rapidos y actividad reciente con vista previa.
    2. Repositorio (/mobile/repository): Busqueda instantanea (ion-searchbar), filtros por etiquetas, vista Lista/Cuadricula, deslizamiento tactil (ion-item-sliding), ion-refresher y selector flotante de conversion.
    3. Escaner a PDF (/mobile/scanner): Captura multi-pagina con @capacitor/camera o galeria y generacion de PDF multi-hoja 100% en cliente con jsPDF.
    4. Suite PDF (/mobile/pdf-suite): Navegacion superior para Unir PDF, Dividir PDF, Comprimir PDF, Firmar PDF digitalmente (lienzo HTML5 canvas), OCR con tesseract.js, Traductor y Conversor Multiformato.
  - Soporte de Modo Oscuro y Modo Claro mediante ThemeService con persistencia local.
  - Version Web de Escritorio (/files): Interfaz completa para pantallas grandes.
- Backend (backend/):
  - Java 21 + Spring Boot 3.3.8 + iText 8 con Arquitectura Hexagonal (Core y Adapter) y persistencia en PostgreSQL.
  - API REST Mock (json-server en puerto 3000) + Fallback Offline automatico con @capacitor/preferences.

### 2. Inteligencia Contextual Local y Procesamiento en Cliente
- Motor de Auto-Clasificacion y Renombrado Inteligente (analyzeMetadataSync): Detecta patrones como "scan_2026_11_08_final.pdf" y sugiere automaticamente "Factura_2026-11-08.pdf" asignando la etiqueta Facturas.
- Procesamiento Local: La conversion de imagenes, compresion, firma digital y ensamblaje de PDFs se ejecutan en el dispositivo usando jsPDF y HTML5 canvas.

### 3. Integracion Nativa con Capacitor 8 (CapacitorNativeService)
- @capacitor/camera: Captura de documentos en alta resolucion y seleccion de galeria.
- @capacitor/filesystem: Guardado y lectura directa en el almacenamiento interno privado del dispositivo.
- @capacitor/haptics: Feedback tactil en acciones y botones clave.
- @capacitor/preferences: Persistencia offline de metadatos, etiquetas y preferencias de tema.

### 4. Experiencia de Usuario (UX/UI)
- Interfaz moderna con temas Obsidian Dark y Marfil Claro.
- Badges e Iconos Semanticos por Formato: PDF, Imagenes (PNG, JPG, WEBP), Datos (CSV, JSON) y Documentos (TXT, HTML).
- Vista Previa Multiformato (FilePreviewModalComponent): Visor interactivo de PDFs, imagenes con zoom y rotacion, tablas CSV y codigo.
- Acciones Rapidas Contextuales (ContextualQuickActionsComponent): Bottom Sheet e ion-action-sheet que detecta el formato del archivo y ofrece herramientas directas.

---

## Estructura del Proyecto

```text
OmniFileStudio/
├── backend/                  # API REST Java 21 + Spring Boot (Arquitectura Hexagonal)
│   ├── Core/                 # Dominio puro Java 21, Casos de Uso, Puertos y Tests JUnit 5
│   └── Adapter/              # Infraestructura Spring Boot + JPA + iText 8 + Controladores REST
├── frontend/                 # Aplicacion Angular 21 + Ionic 9 + Capacitor 8
│   ├── src/app/ionic/        # App Movil (4 Tabs, Formulario Reactivo, Visor y Acciones Rapidas)
│   ├── src/app/pages/files/  # App Web de Escritorio (/files)
│   ├── src/app/services/     # FileManagerService + CapacitorNativeService + ThemeService
│   └── db.json               # Base de datos JSON para json-server
└── package.json              # Scripts unificados de ejecucion desde la raiz
```

---

## Instalacion y Ejecucion

### 1. Instalar dependencias del Frontend
```bash
cd frontend
npm install
```

### 2. Levantar el Backend (Spring Boot en puerto 8080)
```bash
java -jar backend/Adapter/target/adapter-1.0.0.jar
```

### 3. Levantar la App Ionic 9 + Angular 21 (Puerto 8100)
```bash
cd frontend
npm run ionic
```
- App Movil (Ionic 9 Tabs): http://localhost:8100/mobile/dashboard
- Version Web Escritorio: http://localhost:8100/files

### 4. Ejecutar las Pruebas Unitarias (Vitest)
```bash
cd frontend
npx ng test --watch=false
```
*(15 tests unitarios verificando servicios, fallback offline y formularios reactivos).*
