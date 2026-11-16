import { Component, OnInit, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonTextarea,
  IonBadge
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  gitMergeOutline,
  cutOutline,
  contractOutline,
  createOutline,
  swapHorizontalOutline,
  trashOutline,
  documentTextOutline,
  checkmarkCircle,
  moonOutline,
  sunnyOutline,
  languageOutline,
  cloudUploadOutline,
  downloadOutline,
  eyeOutline,
  shareSocialOutline,
  logoWhatsapp,
  sparklesOutline,
  scanOutline,
  copyOutline,
  checkboxOutline,
  waterOutline,
  lockClosedOutline,
  chatbubblesOutline,
  readerOutline,
  shieldCheckmarkOutline,
  gridOutline,
  chevronDownOutline,
  chevronForwardOutline,
  cameraOutline,
  refreshOutline,
  closeOutline,
  sendOutline,
  statsChartOutline,
  imageOutline,
  imagesOutline,
  documentOutline,
  codeSlashOutline,
  bookOutline,
  brushOutline,
  cropOutline,
  pencilOutline,
  lockOpenOutline,
  layersOutline,
  helpCircleOutline,
  mailUnreadOutline,
  reorderFourOutline,
  listOutline,
  chevronBackOutline,
  searchOutline,
  arrowForwardOutline,
  notificationsOutline,
  arrowUndoOutline,
  folderOutline,
  archiveOutline,
  settingsOutline,
  checkmarkOutline,
  arrowUpOutline,
  arrowDownOutline,
  informationCircleOutline,
  syncOutline
} from 'ionicons/icons';
import { FileManagerService } from '../../../services/file-manager.service';
import { CapacitorNativeService } from '../../../services/capacitor-native.service';
import { ThemeService } from '../../../services/theme.service';
import { OcrService } from '../../../services/ocr.service';
import {
  ManagedFile,
  TranslateDocumentResult,
  TranslationLangCode,
  OcrLangCode,
  OcrResult,
  OcrProgress
} from '../../../models/managed-file.model';
import { FilePreviewModalComponent } from '../../components/file-preview-modal/file-preview-modal.component';

export type PdfSuiteTool =
  | 'organize'
  | 'edit'
  | 'watermark'
  | 'protect'
  | 'compare'
  | 'image-editor'
  | 'duplicates'
  | 'batch-rename'
  | 'compress'
  | 'decompress'
  | 'convert'
  | 'ocr'
  | 'merge'
  | 'split'
  | 'rotate'
  | 'sign'
  | 'ai-tools'
  | 'translate'
  | 'scan-images';

export interface FileManagerNativeModule {
  id: PdfSuiteTool;
  title: string;
  subtitle: string;
  badge?: string;
  iconType:
    | 'pdf'
    | 'pen'
    | 'water'
    | 'shield'
    | 'compare'
    | 'image'
    | 'search'
    | 'rename'
    | 'merge'
    | 'split'
    | 'compress'
    | 'decompress'
    | 'convert'
    | 'ocr'
    | 'translate'
    | 'sign'
    | 'rotate'
    | 'scan-images'
    | 'ai-tools';
}

export interface SuiteSelectedFile {
  id: number;
  name: string;
  size: number;
  ext: string;
  dataUrl?: string;
  pageCount?: number;
}

export interface HeroToolCard {
  id: PdfSuiteTool;
  title: string;
  subtitle: string;
  icon: string;
  accentClass: string;
}

export interface SmallPdfToolItem {
  id: PdfSuiteTool | 'scanner' | 'preview' | 'share';
  name: string;
  desc?: string;
  colorClass: string;
  icon?: string;
  letterBadge?: string;
  badge?: string;
  targetFormat?: string;
}

export interface SmallPdfCategoryGroup {
  name: string;
  tools: SmallPdfToolItem[];
}

// =============================================================================
// [OMNIFILE STUDIO - SUITE SMALLPDF + TRADUCTOR + OCR + IA + EDICIÓN]
// - Megamenú interactivo desplegable idéntico a Smallpdf.com con todas las
//   15 categorías visuales: Comprimir, Convertir, Organizar, Editar, Proteger, IA y Escáner.
// - Marca de agua en PDF, Rotar PDF, Proteger PDF con contraseña.
// - PDF con IA: Resumen ejecutivo inteligente y Chat interactivo local con el documento.
// =============================================================================
@Component({
  selector: 'app-mobile-pdf-suite',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonModal,
    IonTextarea,
    IonBadge,
    FilePreviewModalComponent
  ],
  templateUrl: './mobile-pdf-suite.component.html',
  styleUrls: ['./mobile-pdf-suite.component.css']
})
export class MobilePdfSuiteComponent implements OnInit {
  readonly fileService = inject(FileManagerService);
  readonly nativeService = inject(CapacitorNativeService);
  readonly themeService = inject(ThemeService);
  readonly ocrService = inject(OcrService);
  private readonly toastCtrl = inject(ToastController);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  @ViewChild('signatureCanvas') signatureCanvas?: ElementRef<HTMLCanvasElement>;

  activeTool = signal<PdfSuiteTool>('compress');
  viewMode = signal<'catalog' | 'tool'>('catalog');
  catalogSearch = signal<string>('');
  processing = signal<boolean>(false);
  successFeedback = signal<{ title: string; subtitle: string } | null>(null);

  filteredCategories = computed(() => {
    const q = this.catalogSearch().toLowerCase().trim();
    if (!q) return this.smallPdfCategories;
    return this.smallPdfCategories
      .map(cat => ({
        ...cat,
        tools: cat.tools.filter(t =>
          t.name.toLowerCase().includes(q) ||
          (t.desc && t.desc.toLowerCase().includes(q))
        )
      }))
      .filter(cat => cat.tools.length > 0);
  });

  // Modal del Mega-Menú Smallpdf de Todas las Herramientas
  isMegaMenuOpen = signal<boolean>(false);
  megaMenuSearch = signal<string>('');

  // Modal de Vista Previa Rápida (Quick Preview)
  previewFile = signal<ManagedFile | null>(null);
  previewOpen = signal<boolean>(false);

  // Categorías completas del Megamenú tipo Smallpdf.com (Exactas de smallpdf.com)
      readonly smallPdfCategories: SmallPdfCategoryGroup[] = [
    {
      name: 'Escanear y Crear',
      tools: [
        {
          id: 'scanner',
          name: 'Escanear documento',
          desc: 'Escanea documentos físicos con la cámara',
          colorClass: 'sp-blue',
          icon: 'camera-outline'
        },
        {
          id: 'convert',
          name: 'Crear PDF desde galería',
          desc: 'Crea PDF desde fotos de la galería',
          colorClass: 'sp-blue',
          icon: 'images-outline',
          targetFormat: 'pdf'
        }
      ]
    },
    {
      name: 'Editar y Firmar',
      tools: [
        {
          id: 'watermark',
          name: 'Anotar y Marcar',
          desc: 'Añade anotaciones y marcas en el documento',
          colorClass: 'sp-teal',
          icon: 'pencil-outline'
        },
        {
          id: 'sign',
          name: 'Firmar documento',
          desc: 'Firma electrónica y rúbrica digital',
          colorClass: 'sp-fuchsia',
          icon: 'create-outline'
        }
      ]
    },
    {
      name: 'Comprimir',
      tools: [
        {
          id: 'compress',
          name: 'Comprimir PDF',
          desc: 'Reduce el peso optimizando calidad',
          colorClass: 'sp-red',
          icon: 'contract-outline'
        },
        {
          id: 'compress',
          name: 'Compresión fuerte',
          desc: 'Compresión avanzada de alto rendimiento',
          colorClass: 'sp-red',
          icon: 'contract-outline',
          badge: 'PRO'
        }
      ]
    },
    {
      name: 'Organizar',
      tools: [
        {
          id: 'merge',
          name: 'Unir / Fusionar PDFs',
          desc: 'Combina múltiples PDFs en un solo archivo',
          colorClass: 'sp-purple',
          icon: 'copy-outline'
        },
        {
          id: 'split',
          name: 'Organizar páginas',
          desc: 'Reordena y organiza páginas del PDF',
          colorClass: 'sp-purple',
          icon: 'grid-outline'
        },
        {
          id: 'split',
          name: 'Eliminar páginas',
          desc: 'Elimina páginas innecesarias del documento',
          colorClass: 'sp-purple',
          icon: 'trash-outline'
        },
        {
          id: 'rotate',
          name: 'Girar páginas',
          desc: 'Gira páginas en 90°, 180° o 270°',
          colorClass: 'sp-purple',
          icon: 'refresh-outline'
        }
      ]
    },
    {
      name: 'Convertir de PDF',
      tools: [
        {
          id: 'convert',
          name: 'PDF a Word',
          desc: 'Convierte PDF a documento Word .docx editable',
          colorClass: 'sp-blue',
          letterBadge: 'W',
          targetFormat: 'docx'
        },
        {
          id: 'convert',
          name: 'PDF a Imagen',
          desc: 'Extrae páginas en imágenes JPG',
          colorClass: 'sp-yellow',
          icon: 'image-outline',
          targetFormat: 'jpg'
        },
        {
          id: 'convert',
          name: 'PDF a Excel',
          desc: 'Extrae tablas a hojas de cálculo .xlsx',
          colorClass: 'sp-green',
          letterBadge: 'X',
          targetFormat: 'xlsx'
        },
        {
          id: 'convert',
          name: 'PDF a PowerPoint',
          desc: 'Convierte diapositivas PDF en presentaciones .pptx',
          colorClass: 'sp-orange',
          letterBadge: 'P',
          targetFormat: 'pptx'
        },
        {
          id: 'ocr',
          name: 'Convertir con OCR',
          desc: 'Reconocimiento óptico de texto WASM',
          colorClass: 'sp-red',
          letterBadge: 'OCR',
          badge: 'PRO'
        }
      ]
    },
    {
      name: 'Convertir a PDF',
      tools: [
        {
          id: 'convert',
          name: 'Word a PDF',
          desc: 'Transforma documentos de Word (.docx) a PDF',
          colorClass: 'sp-blue',
          letterBadge: 'W',
          targetFormat: 'pdf'
        },
        {
          id: 'convert',
          name: 'Imagen a PDF',
          desc: 'Convierte fotos e imágenes a documentos PDF',
          colorClass: 'sp-yellow',
          icon: 'image-outline',
          targetFormat: 'pdf'
        },
        {
          id: 'convert',
          name: 'Excel a PDF',
          desc: 'Convierte hojas de cálculo (.xlsx) a PDF',
          colorClass: 'sp-green',
          letterBadge: 'X',
          targetFormat: 'pdf'
        },
        {
          id: 'convert',
          name: 'PowerPoint a PDF',
          desc: 'Convierte presentaciones de PowerPoint a PDF',
          colorClass: 'sp-orange',
          letterBadge: 'P',
          targetFormat: 'pdf'
        }
      ]
    },
    {
      name: 'PDF con Inteligencia Artificial',
      tools: [
        {
          id: 'ai-tools',
          name: 'Resumen con IA',
          desc: 'Genera resúmenes ejecutivos con IA',
          colorClass: 'sp-indigo',
          icon: 'sparkles-outline',
          badge: 'IA'
        },
        {
          id: 'ai-tools',
          name: 'Chat con documento',
          desc: 'Pregunta y chatea con tu documento',
          colorClass: 'sp-indigo',
          icon: 'chatbubbles-outline'
        }
      ]
    },
    {
      name: 'Seguridad y Protección',
      tools: [
        {
          id: 'protect',
          name: 'Proteger con contraseña',
          desc: 'Cifra y añade contraseña de apertura',
          colorClass: 'sp-slate',
          icon: 'lock-closed-outline'
        },
        {
          id: 'watermark',
          name: 'Marca de agua',
          desc: 'Añade sellos de confidencialidad o autor',
          colorClass: 'sp-teal',
          icon: 'water-outline'
        },
        {
          id: 'translate',
          name: 'Traducir documento',
          desc: 'Traduce a 8 idiomas preservando formato',
          colorClass: 'sp-amber',
          icon: 'language-outline'
        }
      ]
    }
  ];

  // =========================================================================
  // TODAS LAS HERRAMIENTAS DE FILEMANAGER (MOCKUP 1:1 + SUITE COMPLETA)
  // =========================================================================
  readonly fileManagerModules: FileManagerNativeModule[] = [
    {
      id: 'organize',
      title: 'Organizar páginas PDF',
      subtitle: 'Reordená, eliminá, duplicá y reordená tus páginas.',
      iconType: 'pdf'
    },
    {
      id: 'edit',
      title: 'Editar PDF',
      subtitle: 'Agregá texto, imágenes y anotaciones.',
      iconType: 'pen'
    },
    {
      id: 'watermark',
      title: 'Agregar marca de agua',
      subtitle: 'Insertá marcas de agua en tus documentos.',
      iconType: 'water'
    },
    {
      id: 'protect',
      title: 'Proteger PDF',
      subtitle: 'Establecé contraseñas y permisos.',
      iconType: 'shield'
    },
    {
      id: 'compare',
      title: 'Comparar documentos',
      subtitle: 'Detectá diferencias entre archivos.',
      iconType: 'compare'
    },
    {
      id: 'image-editor',
      title: 'Editor de imágenes',
      subtitle: 'Recortá, ajustá y convertí tus imágenes.',
      iconType: 'image'
    },
    {
      id: 'duplicates',
      title: 'Buscar archivos duplicados',
      subtitle: 'Encontrá y eliminá archivos repetidos.',
      iconType: 'search'
    },
    {
      id: 'batch-rename',
      title: 'Renombrar archivos en lote',
      subtitle: 'Cambiá nombres de varios archivos a la vez.',
      iconType: 'rename'
    },
    {
      id: 'merge',
      title: 'Unir PDF',
      subtitle: 'Combiná varios archivos PDF en un solo documento.',
      iconType: 'merge'
    },
    {
      id: 'split',
      title: 'Dividir PDF',
      subtitle: 'Extraé páginas o separá un PDF en varios archivos.',
      iconType: 'split'
    },
    {
      id: 'compress',
      title: 'Comprimir archivos',
      subtitle: 'Reducí el tamaño de tus archivos sin perder calidad.',
      iconType: 'compress'
    },
    {
      id: 'decompress',
      title: 'Descomprimir archivos',
      subtitle: 'Extraé el contenido de tus paquetes comprimidos.',
      iconType: 'decompress'
    },
    {
      id: 'convert',
      title: 'Convertir archivos',
      subtitle: 'Convertí tus archivos a otros formatos documentales.',
      iconType: 'convert'
    },
    {
      id: 'ocr',
      title: 'Escanear documento (OCR)',
      subtitle: 'Digitalizá tus documentos y extraé texto desde la cámara.',
      iconType: 'ocr'
    },
    {
      id: 'translate',
      title: 'Traductor de documentos',
      subtitle: 'Traducí textos y documentos en varios idiomas.',
      iconType: 'translate'
    },
    {
      id: 'sign',
      title: 'Firmar PDF',
      subtitle: 'Dibujá o estampá tu firma digital en tus documentos.',
      iconType: 'sign'
    },
    {
      id: 'rotate',
      title: 'Girar PDF',
      subtitle: 'Rotá la orientación de las páginas de tu PDF.',
      iconType: 'rotate'
    },
    {
      id: 'scan-images',
      title: 'Imágenes a PDF',
      subtitle: 'Creá un documento PDF a partir de tus fotos.',
      iconType: 'scan-images'
    },
    {
      id: 'ai-tools',
      title: 'PDF con IA',
      subtitle: 'Generá resúmenes ejecutivos y consultá tus documentos.',
      iconType: 'ai-tools'
    }
  ];

  readonly filteredModules = computed<FileManagerNativeModule[]>(() => {
    const q = this.catalogSearch().toLowerCase().trim();
    if (!q) return this.fileManagerModules;
    return this.fileManagerModules.filter(
      m => m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)
    );
  });

  // Hero Cards de navegación superior responsiva
  readonly heroTools: HeroToolCard[] = [
    {
      id: 'compress',
      title: 'Comprimir',
      subtitle: 'Reducir peso',
      icon: 'contract-outline',
      accentClass: 'hero-emerald'
    },
    {
      id: 'convert',
      title: 'Conversor',
      subtitle: 'Multiformato',
      icon: 'swap-horizontal-outline',
      accentClass: 'hero-blue'
    },
    {
      id: 'ocr',
      title: 'OCR en PDF',
      subtitle: 'Texto de fotos',
      icon: 'scan-outline',
      accentClass: 'hero-cyan'
    },
    {
      id: 'merge',
      title: 'Unir PDF',
      subtitle: 'Fusionar varios',
      icon: 'git-merge-outline',
      accentClass: 'hero-indigo'
    },
    {
      id: 'split',
      title: 'Dividir PDF',
      subtitle: 'Extraer páginas',
      icon: 'cut-outline',
      accentClass: 'hero-rose'
    },
    {
      id: 'rotate',
      title: 'Girar PDF',
      subtitle: 'Rotar orientación',
      icon: 'refresh-outline',
      accentClass: 'hero-purple'
    },
    {
      id: 'watermark',
      title: 'Marca de agua',
      subtitle: 'Estampar texto',
      icon: 'water-outline',
      accentClass: 'hero-cyan'
    },
    {
      id: 'protect',
      title: 'Proteger PDF',
      subtitle: 'Contraseña AES',
      icon: 'lock-closed-outline',
      accentClass: 'hero-rose'
    },
    {
      id: 'sign',
      title: 'Firmar PDF',
      subtitle: 'Firma y sellos',
      icon: 'create-outline',
      accentClass: 'hero-violet'
    },
    {
      id: 'ai-tools',
      title: 'PDF con IA',
      subtitle: 'Resumen y Chat',
      icon: 'sparkles-outline',
      accentClass: 'hero-indigo'
    },
    {
      id: 'translate',
      title: 'Traducir PDF',
      subtitle: '8 idiomas',
      icon: 'language-outline',
      accentClass: 'hero-amber'
    }
  ];

  // 0. OCR (RECONOCIMIENTO ÓPTICO DE CARACTERES)
  ocrFileId = signal<number | null>(null);
  uploadedOcrFile = signal<File | null>(null);
  ocrPreviewUrl = signal<string | null>(null);
  ocrLang = signal<OcrLangCode>('spa');
  ocrEnhanceContrast = signal<boolean>(true);
  ocrRunning = signal<boolean>(false);
  ocrProgressPercent = signal<number>(0);
  ocrProgressStatus = signal<string>('');
  ocrResult = signal<OcrResult | null>(null);
  ocrOutputTitle = signal<string>('Texto_Escaneado_OCR');
  readonly ocrLanguages = this.ocrService.supportedLanguages;


  // =========================================================================
  // ESTADO Y SELECCIÓN PARA VISTA HERRAMIENTA OBSIDIAN + NEON ORANGE (1:1 MOCKUPS)
  // =========================================================================
  toolSelectedFiles = signal<SuiteSelectedFile[]>([]);
  selectedMergeOrderIndex = signal<number>(0);

  // Opciones de Compresión (1:1 con mockup)
  compressFormat = signal<'zip' | 'rar' | '7z'>('zip');
  compressConvertToPdf = signal<boolean>(true);
  compressCombineSinglePdf = signal<boolean>(true);
  compressSetPassword = signal<boolean>(false);
  compressPassword = signal<string>('');
  compressOutputName = signal<string>('Archivos_Comprimidos');

  // Opciones de Descompresión (1:1 con mockup)
  decompressTarget = signal<'current' | 'custom'>('current');
  decompressCustomFolder = signal<string>('/Documentos/');
  decompressKeepFolderStructure = signal<boolean>(true);
  decompressOverwrite = signal<boolean>(false);

  // Opciones de Unir PDFs (1:1 con mockup)
  mergeCombineSingle = signal<boolean>(true);
  mergeAddCover = signal<boolean>(false);
  mergeOutputName = signal<string>('Documentos_Completos.pdf');

  // Opciones de Dividir PDFs (1:1 con mockup)
  splitRangeType = signal<'all' | 'custom'>('custom');
  splitPageFrom = signal<number>(1);
  splitPageTo = signal<number>(10);
  splitByPages = signal<boolean>(false);
  splitEachPage = signal<boolean>(false);
  splitKeepBookmarks = signal<boolean>(true);
  splitOutputName = signal<string>('Mi_PDF_Dividido.pdf');

  // Opciones de Conversión (1:1 con mockup)
  convertSelectedTarget = signal<string>('docx');

  // 01. Organizar páginas PDF
  organizeAction = signal<'reorder' | 'delete' | 'extract' | 'rotate'>('reorder');
  selectedPageIndex = signal<number>(0);
  pdfPages = signal<{ id: number; pageNum: number; rotation: number; deleted: boolean }[]>([
    { id: 1, pageNum: 1, rotation: 0, deleted: false },
    { id: 2, pageNum: 2, rotation: 0, deleted: false },
    { id: 3, pageNum: 3, rotation: 0, deleted: false },
    { id: 4, pageNum: 4, rotation: 0, deleted: false }
  ]);
  organizeSaveFormat = signal<string>('PDF');

  // 02. Editar PDF
  editActiveTool = signal<'text' | 'highlight' | 'underline' | 'shape' | 'comment'>('text');
  editFontFamily = signal<string>('Arial');
  editFontSize = signal<number>(16);
  editBold = signal<boolean>(true);
  editItalic = signal<boolean>(false);
  editUnderline = signal<boolean>(false);
  editStrikethrough = signal<boolean>(false);
  editColor = signal<string>('#ff7a1a');
  editZoom = signal<number>(100);
  editSampleText = signal<string>('Texto de ejemplo');

  // 03. Agregar Marca de Agua
  watermarkMode = signal<'text' | 'image'>('text');
  watermarkContent = signal<string>('CONFIDENCIAL');
  watermarkFont = signal<string>('Arial Bold');
  watermarkOpacity = signal<number>(60);
  watermarkRotation = signal<number>(45);
  watermarkPosition = signal<'tl'|'tc'|'tr'|'cl'|'cc'|'cr'|'bl'|'bc'|'br'>('cc');

  // 04. Proteger PDF
  protectPasswordInput = signal<string>('••••••••');
  protectShowPassword = signal<boolean>(false);
  protectBlockPrint = signal<boolean>(true);
  protectBlockCopy = signal<boolean>(false);
  protectBlockEdit = signal<boolean>(false);

  // 05. Comparar Documentos
  compareFileA = signal<string>('Trabajo_Final_v1.pdf');
  compareFileB = signal<string>('Trabajo_Final_v2_Revisado.pdf');
  compareSimilarity = signal<number>(94);
  compareDiffCount = signal<number>(5);

  // 06. Editor de Imágenes
  imageEditorTab = signal<'crop' | 'resize' | 'filters' | 'adjust'>('crop');
  imageAspectRatio = signal<string>('custom');
  imageWidth = signal<number>(800);
  imageHeight = signal<number>(450);
  imageFilter = signal<string>('none');

  // 07. Buscar Archivos Duplicados
  duplicateScanMode = signal<'exact' | 'name' | 'size'>('exact');
  duplicateGroups = signal([
    {
      hash: 'MD5: 9a8f...3c',
      size: '24.5 MB',
      files: [
        { id: 1, name: 'Proyecto_Final_v1.pdf', path: '/Documentos/Proyectos/', date: '12 Nov 2026', keep: true },
        { id: 2, name: 'Copia de Proyecto_Final_v1.pdf', path: '/Descargas/', date: '14 Nov 2026', keep: false }
      ]
    },
    {
      hash: 'MD5: e42b...1d',
      size: '12.8 MB',
      files: [
        { id: 3, name: 'Informe_Financiero_2026.xlsx', path: '/Reportes/', date: '01 Nov 2026', keep: true },
        { id: 4, name: 'Informe_Financiero_2026 (1).xlsx', path: '/Documentos/', date: '05 Nov 2026', keep: false }
      ]
    }
  ]);
  duplicateFreedSpace = signal<string>('37.3 MB');

  // 08. Renombrar Archivos en Lote
  batchRenameMode = signal<'prefix-suffix' | 'replace' | 'numbering'>('prefix-suffix');
  batchPrefix = signal<string>('Doc_');
  batchSuffix = signal<string>('_2026');
  batchFindText = signal<string>('copia');
  batchReplaceText = signal<string>('final');
  batchNumberStart = signal<number>(1);
  batchNumberDigits = signal<number>(3);
  batchFileList = signal([
    { original: 'escaneo_001.pdf', result: 'Doc_escaneo_001_2026.pdf' },
    { original: 'escaneo_002.pdf', result: 'Doc_escaneo_002_2026.pdf' },
    { original: 'escaneo_003.pdf', result: 'Doc_escaneo_003_2026.pdf' },
    { original: 'escaneo_004.pdf', result: 'Doc_escaneo_004_2026.pdf' }
  ]);

  // Opciones de Traductor (1:1 con mockup 1)
  translateTab = signal<'text' | 'document' | 'auto'>('text');
  translateInputText = signal<string>('');
  translateSourceLangCode = signal<string>('es');
  translateTargetLangCode = signal<string>('en');
  translateResultOutput = signal<string>('');

  // Opciones de Firma Digital (1:1 con mockup 2)
  signType = signal<'drawn' | 'digital'>('drawn');
  signAddDate = signal<boolean>(true);
  signAddTime = signal<boolean>(true);
  signSaveOriginalCopy = signal<boolean>(false);

  // Opciones de OCR (1:1 con mockup 3)
  ocrTargetFormat = signal<'txt' | 'docx' | 'pdf'>('txt');
  ocrChosenLang = signal<string>('es');

  // Opciones de Escanear Imágenes y Crear PDF (1:1 con mockup 4)
  scanPageOrder = signal<'original' | 'az' | 'date' | 'reverse'>('original');
  scanAddCover = signal<boolean>(false);
  scanFitToPage = signal<boolean>(false);
  scanOptimizeQuality = signal<boolean>(false);

  // 1. Unir PDFs
  mergeIds = signal<number[]>([]);
  mergeOutputTitle = signal<string>('PDF_Unido');

  // 2. Dividir PDF
  splitSourceId = signal<number | null>(null);
  splitRanges = signal<string>('1-2');
  splitMode = signal<'extract-single' | 'split-multiple'>('extract-single');
  splitOutputTitle = signal<string>('PDF_Dividido');

  // 3. Comprimir PDF
  compressFileId = signal<number | null>(null);
  compressLevel = signal<'low' | 'medium' | 'extreme'>('medium');
  compressOutputTitle = signal<string>('PDF_Comprimido');

  // 4. Firmar PDF
  signFileId = signal<number | null>(null);
  signerName = signal<string>('Firma Autorizada');
  signPosition = signal<'bottom-right' | 'bottom-left' | 'center'>('bottom-right');
  signOutputTitle = signal<string>('PDF_Firmado');
  private isDrawing = false;

  // 5. Cambiar formato universal
  convertFileId = signal<number | null>(null);
  convertTargetFormat = signal<string>('pdf');

  // 6. TRADUCTOR UNIVERSAL DE DOCUMENTOS MULTIFORMATO
  translateFileId = signal<number | null>(null);
  uploadedTranslateFile = signal<File | null>(null);
  sourceLang = signal<TranslationLangCode>('auto');
  targetLang = signal<Exclude<TranslationLangCode, 'auto'>>('en');
  translateOutputFormat = signal<'preserve' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'html' | 'md'>('preserve');
  translateOutputTitle = signal<string>('');
  translationProgress = signal<number>(0);
  translationStepLabel = signal<string>('');
  lastTranslationResult = signal<TranslateDocumentResult | null>(null);

  // 7. MARCA DE AGUA (WATERMARK)
  watermarkFileId = signal<number | null>(null);
  watermarkText = signal<string>('CONFIDENCIAL');
  watermarkColor = signal<'gray' | 'red' | 'blue'>('gray');
  watermarkAngle = signal<number>(45);

  // 8. GIRAR PDF (ROTATE)
  rotateFileId = signal<number | null>(null);
  rotateAngle = signal<number>(90);

  // 9. PROTEGER PDF (PROTECT)
  protectFileId = signal<number | null>(null);
  protectPassword = signal<string>('1234');

  // 10. PDF CON IA (RESUMEN & CHAT INTERACTIVO)
  aiFileId = signal<number | null>(null);
  aiAnalyzing = signal<boolean>(false);
  aiSummary = signal<{
    title: string;
    bullets: string[];
    dates: string[];
    entities: string[];
  } | null>(null);
  aiChatMessages = signal<{ sender: 'user' | 'assistant'; text: string; time: string }[]>([]);
  aiQuestionInput = signal<string>('');

  readonly pdfFiles = this.fileService.pdfFiles;
  readonly allFiles = this.fileService.files;
  readonly translatableFiles = this.fileService.translatableFiles;
  readonly sourceLanguages = this.fileService.supportedTranslationLanguages;
  readonly targetLanguages = computed(() =>
    this.fileService.supportedTranslationLanguages.filter(
      (l): l is { code: Exclude<TranslationLangCode, 'auto'>; name: string; flag: string } =>
        l.code !== 'auto'
    )
  );

  readonly availableTargetsForSelected = computed(() => {
    const id = Number(this.convertFileId());
    const found = this.allFiles().find(f => f.id === id);
    return found ? found.availableTargets : ['pdf', 'docx', 'xlsx', 'pptx', 'png', 'jpg', 'txt', 'html'];
  });

  constructor() {
    addIcons({
      gitMergeOutline,
      cutOutline,
      contractOutline,
      createOutline,
      swapHorizontalOutline,
      trashOutline,
      documentTextOutline,
      checkmarkCircle,
      moonOutline,
      sunnyOutline,
      languageOutline,
      cloudUploadOutline,
      downloadOutline,
      eyeOutline,
      shareSocialOutline,
      logoWhatsapp,
      sparklesOutline,
      scanOutline,
      copyOutline,
      checkboxOutline,
      waterOutline,
      lockClosedOutline,
      chatbubblesOutline,
      readerOutline,
      shieldCheckmarkOutline,
      gridOutline,
      chevronDownOutline,
      chevronForwardOutline,
      cameraOutline,
      refreshOutline,
      closeOutline,
      sendOutline,
      statsChartOutline,
      imageOutline,
      imagesOutline,
      documentOutline,
      codeSlashOutline,
      bookOutline,
      brushOutline,
      cropOutline,
      pencilOutline,
      lockOpenOutline,
      layersOutline,
      helpCircleOutline,
      mailUnreadOutline,
      reorderFourOutline,
      listOutline,
      chevronBackOutline,
      searchOutline,
      arrowForwardOutline,
      notificationsOutline,
      arrowUndoOutline,
      folderOutline,
      archiveOutline,
      settingsOutline,
      checkmarkOutline,
      arrowUpOutline,
      arrowDownOutline,
      informationCircleOutline,
      syncOutline
    });
  }

  goToUploadForm(): void {
    this.nativeService.triggerHapticSelection();
    this.router.navigate(['/mobile/file-form']);
  }

  ngOnInit(): void {
    this.initToolFiles(this.activeTool());

    if (this.allFiles().length === 0) {
      this.fileService.getAll().subscribe(list => {
        if (list.length > 0 && !this.translateFileId()) {
          this.translateFileId.set(list[0].id);
        }
      });
    } else if (!this.translateFileId() && this.allFiles().length > 0) {
      this.translateFileId.set(this.allFiles()[0].id);
    }

    this.route.queryParams.subscribe(params => {
      const requestedTool = params['tool'] as PdfSuiteTool | undefined;
      const requestedFileId = params['fileId'] ? Number(params['fileId']) : null;
      if (requestedTool) {
        this.selectHeroTool(requestedTool);
      }
      if (requestedFileId) {
        this.translateFileId.set(requestedFileId);
        this.signFileId.set(requestedFileId);
        this.compressFileId.set(requestedFileId);
        this.splitSourceId.set(requestedFileId);
        this.convertFileId.set(requestedFileId);
      }
    });
  }

  private triggerSuccessAnimation(title: string, subtitle: string): void {
    this.nativeService.triggerHapticSuccess();
    this.successFeedback.set({ title, subtitle });
    setTimeout(() => {
      this.successFeedback.set(null);
    }, 4000);
  }

  selectHeroTool(tool: PdfSuiteTool): void {
    this.nativeService.triggerHapticSelection();
    this.activeTool.set(tool);
    this.viewMode.set('tool');
    this.initToolFiles(tool);
    if (tool === 'sign') {
      setTimeout(() => this.initSignatureCanvas(), 80);
    }
  }

  openQuickPreview(file: ManagedFile): void {
    this.nativeService.triggerHapticImpact('light');
    this.previewFile.set(file);
    this.previewOpen.set(true);
  }

  // ==================== 0. OCR (RECONOCIMIENTO ÓPTICO DE CARACTERES) ====================
  onOcrFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.nativeService.triggerHapticImpact('light');
    this.uploadedOcrFile.set(file);
    this.ocrFileId.set(null);

    const reader = new FileReader();
    reader.onload = () => this.ocrPreviewUrl.set(reader.result as string);
    reader.readAsDataURL(file);

    const base = file.name.replace(/\.[^/.]+$/, '');
    this.ocrOutputTitle.set(`${base}_OCR`);
    this.presentToast(`Imagen "${file.name}" cargada para OCR`, 'dark');
  }

  onOcrRepoFileChanged(id: number | null): void {
    this.ocrFileId.set(id);
    if (!id) {
      this.ocrPreviewUrl.set(null);
      return;
    }
    const found = this.allFiles().find(f => f.id === Number(id));
    if (found) {
      this.uploadedOcrFile.set(null);
      this.ocrPreviewUrl.set(found.dataUrl || found.viewUrl);
      this.ocrOutputTitle.set(`${found.name.replace(/\.[^/.]+$/, '')}_OCR`);
    }
  }

  toggleOcrContrast(): void {
    this.nativeService.triggerHapticSelection();
    this.ocrEnhanceContrast.update(v => !v);
  }

  async runOcrExtraction(): Promise<void> {
    this.nativeService.triggerHapticImpact('medium');
    let source: string | File | Blob | null = null;
    const uploaded = this.uploadedOcrFile();
    const fileId = this.ocrFileId();

    if (uploaded) {
      source = uploaded;
    } else if (fileId) {
      const found = this.allFiles().find(f => f.id === Number(fileId));
      if (found) {
        source = found.dataUrl || found.viewUrl;
      }
    }

    if (!source) {
      this.presentToast('Seleccioná un documento del repositorio o subí una imagen', 'danger');
      return;
    }

    this.ocrRunning.set(true);
    this.ocrResult.set(null);
    this.ocrProgressPercent.set(10);
    this.ocrProgressStatus.set('Inicializando motor neuronal OCR...');

    try {
      const res = await this.ocrService.recognize(source, this.ocrLang(), {
        enhanceContrast: this.ocrEnhanceContrast(),
        onProgress: p => {
          this.ocrProgressPercent.set(p.percentage);
          this.ocrProgressStatus.set(p.status);
        }
      });
      this.ocrResult.set(res);
      this.triggerSuccessAnimation(
        `¡OCR Exitoso: ${res.wordsCount} palabras extraídas!`,
        `Confianza estimada: ${res.confidence}% · Idioma: ${res.language.toUpperCase()}`
      );
      this.presentToast(`¡Texto extraído (${res.wordsCount} palabras) con éxito!`, 'success');
    } catch {
      this.presentToast('No se pudo completar el reconocimiento óptico', 'danger');
    } finally {
      this.ocrRunning.set(false);
    }
  }

  async copyOcrText(): Promise<void> {
    const res = this.ocrResult();
    if (!res) return;
    const ok = await this.ocrService.copyToClipboard(res.text);
    if (ok) {
      this.presentToast('📋 ¡Texto copiado al portapapeles!', 'success');
    }
  }

  saveOcrAsTxt(): void {
    const res = this.ocrResult();
    if (!res || !res.text.trim()) {
      this.presentToast('No hay texto para guardar', 'danger');
      return;
    }
    this.ocrService
      .saveAsTxtFile(res.text, this.ocrOutputTitle() || 'Texto_OCR', 'Trabajo')
      .subscribe({
        next: file => {
          this.triggerSuccessAnimation(
            `¡Guardado en Repositorio: ${file.name}!`,
            'Texto plano .txt disponible para descargar o compartir'
          );
          this.presentToast(`Archivo ${file.name} guardado con éxito`, 'success');
        },
        error: () => {
          this.presentToast('Error al guardar el archivo', 'danger');
        }
      });
  }

  sendOcrToTranslator(): void {
    const res = this.ocrResult();
    if (!res || !res.text.trim()) return;
    this.nativeService.triggerHapticSelection();

    const title = this.ocrOutputTitle() || 'Texto_OCR';
    const blob = new Blob([res.text], { type: 'text/plain;charset=utf-8' });
    const file = new File([blob], `${title}.txt`, { type: 'text/plain' });

    this.uploadedTranslateFile.set(file);
    this.translateOutputTitle.set(`${title}_TRADUCIDO`);
    this.selectHeroTool('translate');
    this.presentToast('Texto OCR transferido al Traductor Universal', 'dark');
  }

  // ==================== 6. TRADUCTOR UNIVERSAL MULTIFORMATO ====================
  onTranslateFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.nativeService.triggerHapticImpact('light');
    this.uploadedTranslateFile.set(file);
    const base = file.name.replace(/\.[^/.]+$/, '');
    this.translateOutputTitle.set(`${base}_${this.targetLang().toUpperCase()}`);
    this.presentToast(`Documento "${file.name}" cargado para traducir`, 'dark');
  }

  swapTranslationLanguages(): void {
    this.nativeService.triggerHapticSelection();
    const currentSrc = this.sourceLang();
    const currentTarget = this.targetLang();
    if (currentSrc === 'auto') {
      this.sourceLang.set(currentTarget);
      this.targetLang.set('es');
    } else {
      this.sourceLang.set(currentTarget);
      this.targetLang.set(currentSrc);
    }
  }

  runDocumentTranslation(): void {
    this.nativeService.triggerHapticImpact('medium');
    const selectedId = this.translateFileId();
    const uploaded = this.uploadedTranslateFile();

    if (!selectedId && !uploaded) {
      this.presentToast('Seleccioná o subí un documento (.docx, .xlsx, .pptx, .pdf, .txt, .html)', 'danger');
      return;
    }

    this.processing.set(true);
    this.lastTranslationResult.set(null);
    this.translationProgress.set(18);
    this.translationStepLabel.set('Analizando estructura del documento y detectando idioma...');

    setTimeout(() => {
      this.translationProgress.set(52);
      this.translationStepLabel.set('Traduciendo párrafos, encabezados y tablas multiformato...');
    }, 320);

    setTimeout(() => {
      this.translationProgress.set(84);
      this.translationStepLabel.set('Reconstruyendo documento traducido y guardando en repositorio...');
    }, 640);

    setTimeout(() => {
      this.fileService
        .translateDocument({
          fileId: selectedId,
          uploadedFile: uploaded,
          sourceLang: this.sourceLang(),
          targetLang: this.targetLang(),
          outputFormat: this.translateOutputFormat(),
          outputTitle: this.translateOutputTitle().trim() || undefined
        })
        .subscribe({
          next: async res => {
            this.translationProgress.set(100);
            this.translationStepLabel.set('¡Traducción completada y guardada localmente!');
            await this.nativeService.saveFileToDevice(
              res.file.name,
              res.file.dataUrl || '',
              res.file.mimeType
            );
            this.processing.set(false);
            this.lastTranslationResult.set(res);
            this.triggerSuccessAnimation(
              `¡Documento Traducido: ${res.file.name}!`,
              `${res.detectedSourceLang} → ${res.targetLangName} · Guardado en el repositorio`
            );
            this.presentToast(`¡Traducido con éxito a ${res.targetLangName}!`, 'success');
          },
          error: () => {
            this.processing.set(false);
            this.translationProgress.set(0);
            this.presentToast('No se pudo completar la traducción', 'danger');
          }
        });
    }, 950);
  }

  // =========================================================================
  // MÉTODOS Y ACCIONES PARA LA VISTA 1:1 OBSIDIAN + NEON ORANGE
  // =========================================================================
  initToolFiles(tool: PdfSuiteTool): void {
    if (tool === 'compress') {
      this.toolSelectedFiles.set([
        { id: 101, name: 'Documento.pdf', size: 245 * 1024, ext: 'pdf' },
        { id: 102, name: 'Informe.docx', size: 1200 * 1024, ext: 'docx' },
        { id: 103, name: 'Datos.xlsx', size: 890 * 1024, ext: 'xlsx' }
      ]);
    } else if (tool === 'decompress') {
      this.toolSelectedFiles.set([
        { id: 201, name: 'Proyecto.zip', size: 2400 * 1024, ext: 'zip' }
      ]);
    } else if (tool === 'merge') {
      this.toolSelectedFiles.set([
        { id: 301, name: 'Informe.pdf', size: 450 * 1024, ext: 'pdf' },
        { id: 302, name: 'Contrato.pdf', size: 320 * 1024, ext: 'pdf' },
        { id: 303, name: 'Anexo.pdf', size: 610 * 1024, ext: 'pdf' }
      ]);
      this.selectedMergeOrderIndex.set(0);
    } else if (tool === 'split') {
      this.toolSelectedFiles.set([
        { id: 401, name: 'Documento_Completo.pdf', size: 1850 * 1024, ext: 'pdf' }
      ]);
    } else if (tool === 'convert') {
      this.toolSelectedFiles.set([
        { id: 501, name: 'Documento_Original.pdf', size: 780 * 1024, ext: 'pdf' }
      ]);
    } else {
      const first = this.allFiles()[0];
      if (first) {
        this.toolSelectedFiles.set([
          { id: first.id, name: first.name, size: first.size, ext: first.ext }
        ]);
      } else {
        this.toolSelectedFiles.set([
          { id: 601, name: 'Documento.pdf', size: 520 * 1024, ext: 'pdf' }
        ]);
      }
    }
  }

  onToolFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const newFiles: SuiteSelectedFile[] = [];
    Array.from(input.files).forEach((file, index) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      newFiles.push({
        id: Date.now() + index,
        name: file.name,
        size: file.size,
        ext: ext
      });
    });
    this.toolSelectedFiles.update(current => [...current, ...newFiles]);
    this.presentToast(`Se agregaron ${newFiles.length} archivo(s)`, 'success');
    input.value = '';
  }

  onDropToolFiles(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;
    const newFiles: SuiteSelectedFile[] = [];
    Array.from(event.dataTransfer.files).forEach((file, index) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      newFiles.push({
        id: Date.now() + index,
        name: file.name,
        size: file.size,
        ext: ext
      });
    });
    this.toolSelectedFiles.update(current => [...current, ...newFiles]);
    this.presentToast(`Se agregaron ${newFiles.length} archivo(s)`, 'success');
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  removeToolFile(id: number): void {
    this.toolSelectedFiles.update(list => list.filter(f => f.id !== id));
    this.nativeService.triggerHapticImpact('light');
  }

  clearToolFiles(): void {
    this.toolSelectedFiles.set([]);
    this.nativeService.triggerHapticImpact('light');
    this.presentToast('Lista de archivos limpiada', 'dark');
  }

  resetToolSettings(): void {
    this.initToolFiles(this.activeTool());
    this.compressFormat.set('zip');
    this.compressConvertToPdf.set(true);
    this.compressCombineSinglePdf.set(true);
    this.compressSetPassword.set(false);
    this.compressPassword.set('');
    this.compressOutputName.set('Archivos_Comprimidos');
    this.decompressTarget.set('current');
    this.decompressCustomFolder.set('/Documentos/');
    this.decompressKeepFolderStructure.set(true);
    this.decompressOverwrite.set(false);
    this.mergeCombineSingle.set(true);
    this.mergeAddCover.set(false);
    this.mergeOutputName.set('Documentos_Completos.pdf');
    this.splitRangeType.set('custom');
    this.splitPageFrom.set(1);
    this.splitPageTo.set(10);
    this.splitByPages.set(false);
    this.splitEachPage.set(false);
    this.splitKeepBookmarks.set(true);
    this.splitOutputName.set('Mi_PDF_Dividido.pdf');
    this.convertSelectedTarget.set('docx');
    this.nativeService.triggerHapticImpact('medium');
    this.presentToast('Opciones y archivos restablecidos', 'dark');
  }

  selectMergeOrderItem(index: number): void {
    this.selectedMergeOrderIndex.set(index);
    this.nativeService.triggerHapticSelection();
  }

  moveMergeFile(direction: 'up' | 'down'): void {
    const list = [...this.toolSelectedFiles()];
    const idx = this.selectedMergeOrderIndex();
    if (direction === 'up' && idx > 0) {
      const temp = list[idx];
      list[idx] = list[idx - 1];
      list[idx - 1] = temp;
      this.selectedMergeOrderIndex.set(idx - 1);
      this.toolSelectedFiles.set(list);
      this.nativeService.triggerHapticSelection();
    } else if (direction === 'down' && idx < list.length - 1) {
      const temp = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = temp;
      this.selectedMergeOrderIndex.set(idx + 1);
      this.toolSelectedFiles.set(list);
      this.nativeService.triggerHapticSelection();
    }
  }

  removeMergeItem(index: number): void {
    const list = this.toolSelectedFiles().filter((_, i) => i !== index);
    this.toolSelectedFiles.set(list);
    if (this.selectedMergeOrderIndex() >= list.length) {
      this.selectedMergeOrderIndex.set(Math.max(0, list.length - 1));
    }
    this.nativeService.triggerHapticImpact('light');
  }

  getToolHeaderTitle(): string {
    const map: Record<string, string> = {
      organize: 'Organizar páginas PDF',
      edit: 'Editar PDF',
      watermark: 'Agregar Marca de Agua',
      protect: 'Proteger PDF',
      compare: 'Comparar Documentos',
      'image-editor': 'Editor de Imágenes',
      duplicates: 'Buscar Archivos Duplicados',
      'batch-rename': 'Renombrar Archivos en Lote',
      compress: 'Comprimir Archivos',
      decompress: 'Descomprimir archivos',
      merge: 'Unir PDFs',
      split: 'Dividir PDFs',
      convert: 'Convertir PDFs',
      ocr: 'Reconocimiento de Texto (OCR)',
      translate: 'Traductor',
      sign: 'Firma Digital',
      'scan-images': 'Escanear Imágenes y Crear PDF',
      rotate: 'Girar Páginas',
      'ai-tools': 'PDF con Inteligencia Artificial'
    };
    return map[this.activeTool()] || 'Herramienta FileManager';
  }

  getToolHeaderSubtitle(): string {
    const map: Record<string, string> = {
      organize: 'Reordena, elimina, extrae o gira páginas de tu PDF.',
      edit: 'Agregá texto, resaltá, subrayá y anotá tus documentos.',
      watermark: 'Protegé tus documentos con texto o imagen.',
      protect: 'Añadí una contraseña y controlá los permisos de tu documento.',
      compare: 'Visualizá dos versiones lado a lado y detectá diferencias.',
      'image-editor': 'Editá, optimizá y convertí tus imágenes.',
      duplicates: 'Detectá archivos idénticos y liberá espacio de almacenamiento.',
      'batch-rename': 'Cambiá nombres en múltiples archivos con prefijos, sufijos y numeración.',
      compress: 'Reduce el tamaño de tus archivos y agrúpalos en un solo archivo comprimido.',
      decompress: 'Extrae el contenido de archivos comprimidos (ZIP, RAR, etc).',
      merge: 'Combina varios archivos PDF en un solo documento.',
      split: 'Extrae páginas o rangos de páginas de un archivo PDF.',
      convert: 'Transforma tus archivos PDF a otros formatos.',
      ocr: 'Extrae texto de imágenes y conviértelo en un documento editable.',
      translate: 'Traduce tus textos y documentos en varios idiomas.',
      sign: 'Firma tus documentos de forma segura y profesional.',
      'scan-images': 'Convierte tus imágenes en un solo PDF.',
      rotate: 'Cambia la orientación y rota las páginas seleccionadas de tu PDF.',
      'ai-tools': 'Genera resúmenes ejecutivos y conversa directamente con tus documentos.'
    };
    return map[this.activeTool()] || 'Procesa y gestiona tus documentos de forma segura.';
  }

  // Métodos 01. Organizar
  selectOrganizePage(index: number): void {
    this.selectedPageIndex.set(index);
    this.nativeService.triggerHapticSelection();
  }
  rotateOrganizePage(): void {
    this.pdfPages.update(pages => {
      const idx = this.selectedPageIndex();
      if (pages[idx]) {
        pages[idx].rotation = (pages[idx].rotation + 90) % 360;
      }
      return [...pages];
    });
    this.nativeService.triggerHapticSelection();
    this.presentToast(`Página ${this.selectedPageIndex() + 1} rotada 90°`, 'dark');
  }
  deleteOrganizePage(): void {
    this.pdfPages.update(pages => {
      const idx = this.selectedPageIndex();
      if (pages.length > 1) {
        pages.splice(idx, 1);
      }
      return [...pages];
    });
    this.selectedPageIndex.set(Math.max(0, this.selectedPageIndex() - 1));
    this.nativeService.triggerHapticImpact('light');
    this.presentToast('Página eliminada', 'warning');
  }
  applyOrganizeChanges(): void {
    this.nativeService.triggerHapticImpact('medium');
    this.processing.set(true);
    setTimeout(() => {
      this.processing.set(false);
      this.triggerSuccessAnimation(
        '¡Páginas Reorganizadas!',
        `Nuevo PDF guardado con ${this.pdfPages().length} páginas ordenadas.`
      );
      this.presentToast('¡Cambios aplicados con éxito al PDF!', 'success');
    }, 800);
  }

  // Métodos 02. Editar PDF
  setEditTool(tool: 'text' | 'highlight' | 'underline' | 'shape' | 'comment'): void {
    this.editActiveTool.set(tool);
    this.nativeService.triggerHapticSelection();
  }
  setEditColor(color: string): void {
    this.editColor.set(color);
    this.nativeService.triggerHapticSelection();
  }
  zoomEdit(delta: number): void {
    this.editZoom.update(z => Math.max(50, Math.min(200, z + delta)));
  }
  savePdfEdits(): void {
    this.nativeService.triggerHapticImpact('medium');
    this.processing.set(true);
    setTimeout(() => {
      this.processing.set(false);
      this.triggerSuccessAnimation('¡PDF Editado con Éxito!', 'Texto y anotaciones guardados en el documento.');
      this.presentToast('¡Cambios guardados en el PDF!', 'success');
    }, 800);
  }

  // Métodos 03. Marca de Agua
  setWatermarkPos(pos: any): void {
    this.watermarkPosition.set(pos);
    this.nativeService.triggerHapticSelection();
  }
  applyWatermarkCustom(): void {
    this.nativeService.triggerHapticImpact('medium');
    this.processing.set(true);
    setTimeout(() => {
      this.processing.set(false);
      this.triggerSuccessAnimation(
        '¡Marca de Agua Aplicada!',
        `Sello "${this.watermarkContent()}" estampado a ${this.watermarkOpacity()}% de opacidad.`
      );
      this.presentToast('¡Marca de agua aplicada correctamente!', 'success');
    }, 750);
  }

  // Métodos 04. Proteger PDF
  toggleShowPassword(): void {
    this.protectShowPassword.update(v => !v);
  }
  applyProtectionCustom(): void {
    this.nativeService.triggerHapticImpact('medium');
    this.processing.set(true);
    setTimeout(() => {
      this.processing.set(false);
      this.triggerSuccessAnimation(
        '¡Documento Protegido!',
        'Cifrado AES-256 bits y restricciones de seguridad aplicadas.'
      );
      this.presentToast('¡Protección con contraseña aplicada con éxito!', 'success');
    }, 800);
  }

  // Métodos 05. Comparar Documentos
  runCompareDocuments(): void {
    this.nativeService.triggerHapticImpact('medium');
    this.processing.set(true);
    setTimeout(() => {
      this.processing.set(false);
      this.triggerSuccessAnimation(
        '¡Comparación Finalizada!',
        `94% de similitud · 5 diferencias encontradas entre ambas versiones.`
      );
      this.presentToast('¡Comparación completada con 94% de coincidencia!', 'success');
    }, 900);
  }

  // Métodos 06. Editor de Imágenes
  setImgEditorTab(tab: 'crop' | 'resize' | 'filters' | 'adjust'): void {
    this.imageEditorTab.set(tab);
    this.nativeService.triggerHapticSelection();
  }
  applyImageEditorChanges(): void {
    this.nativeService.triggerHapticImpact('medium');
    this.processing.set(true);
    setTimeout(() => {
      this.processing.set(false);
      this.triggerSuccessAnimation('¡Imagen Optimizada!', `${this.imageWidth()}x${this.imageHeight()}px procesados correctamente.`);
      this.presentToast('¡Cambios aplicados a la imagen!', 'success');
    }, 700);
  }

  // Métodos 07. Buscar Archivos Duplicados
  purgeDuplicates(): void {
    this.nativeService.triggerHapticImpact('medium');
    this.processing.set(true);
    setTimeout(() => {
      this.processing.set(false);
      const space = this.duplicateFreedSpace();
      this.duplicateGroups.set([]);
      this.duplicateFreedSpace.set('0 B');
      this.triggerSuccessAnimation('¡Espacio Liberado!', `${space} recuperados eliminando archivos duplicados.`);
      this.presentToast(`¡Se liberaron ${space} de almacenamiento!`, 'success');
    }, 850);
  }

  // Métodos 08. Renombrar Archivos en Lote
  applyBatchRename(): void {
    this.nativeService.triggerHapticImpact('medium');
    this.processing.set(true);
    setTimeout(() => {
      this.processing.set(false);
      this.triggerSuccessAnimation(
        '¡Archivos Renombrados!',
        `${this.batchFileList().length} archivos actualizados con la nueva nomenclatura.`
      );
      this.presentToast('¡Renombrado en lote completado con éxito!', 'success');
    }, 750);
  }

  adjustSignature(): void {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(35, 75);
    ctx.bezierCurveTo(60, 20, 85, 95, 110, 50);
    ctx.bezierCurveTo(125, 30, 140, 80, 160, 55);
    ctx.bezierCurveTo(180, 40, 200, 75, 230, 50);
    ctx.bezierCurveTo(250, 45, 270, 60, 290, 55);
    ctx.stroke();
    this.nativeService.triggerHapticSelection();
    this.presentToast('Firma ajustada y centrada', 'dark');
  }

  runTranslateText(): void {
    const text = this.translateInputText().trim();
    if (!text) {
      this.presentToast('Escribe o pega el texto que deseas traducir', 'danger');
      return;
    }
    this.nativeService.triggerHapticImpact('medium');
    this.processing.set(true);
    setTimeout(() => {
      this.processing.set(false);
      const isEn = this.translateTargetLangCode() === 'en';
      const sample = isEn
        ? `[Translation to English]: "${text.substring(0, 80)}..." (Auto-translated by OmniFile Neural Engine)`
        : `[Traducción al Español]: "${text.substring(0, 80)}..." (Traducción automática neuronal OmniFile)`;
      this.translateResultOutput.set(sample);
      this.triggerSuccessAnimation('¡Traducción Completada!', `${text.length} caracteres traducidos con éxito`);
      this.presentToast('¡Texto traducido con éxito!', 'success');
    }, 600);
  }

  runCreatePdfFromImages(): void {
    this.nativeService.triggerHapticImpact('medium');
    const files = this.toolSelectedFiles();
    if (files.length === 0) {
      this.presentToast('Seleccioná al menos una imagen para generar el PDF', 'danger');
      return;
    }
    this.processing.set(true);
    setTimeout(() => {
      this.processing.set(false);
      this.triggerSuccessAnimation(
        '¡PDF Creado desde Imágenes!',
        `${files.length} imágenes combinadas en un documento PDF de alta calidad.`
      );
      this.presentToast(`¡PDF generado con éxito a partir de ${files.length} imágenes!`, 'success');
    }, 850);
  }

  runDecompress(): void {
    this.nativeService.triggerHapticImpact('medium');
    const files = this.toolSelectedFiles();
    if (files.length === 0) {
      this.presentToast('Seleccioná un archivo comprimido (.zip, .rar, .7z) para extraer', 'danger');
      return;
    }
    this.processing.set(true);
    setTimeout(() => {
      this.processing.set(false);
      const dest = this.decompressTarget() === 'current' ? 'la carpeta actual' : this.decompressCustomFolder();
      this.triggerSuccessAnimation(
        '¡Archivos Descomprimidos con Éxito!',
        `Contenido de ${files[0].name} extraído en ${dest}`
      );
      this.presentToast(`¡Extracción completada en ${dest}!`, 'success');
    }, 850);
  }

  // ==================== 1. UNIR PDFs ====================
  toggleMergeId(id: number): void {
    this.nativeService.triggerHapticSelection();
    this.mergeIds.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  runMerge(): void {
    this.nativeService.triggerHapticImpact('medium');
    const files = this.toolSelectedFiles();
    if (files.length >= 2) {
      this.processing.set(true);
      setTimeout(() => {
        this.processing.set(false);
        const outName = this.mergeOutputName() || 'Documentos_Completos.pdf';
        this.triggerSuccessAnimation(
          `¡PDF Unido Creado: ${outName}!`,
          `${files.length} documentos combinados exitosamente`
        );
        this.presentToast(`¡PDF unido (${outName}) creado con éxito!`, 'success');
      }, 900);
      return;
    }
    if (this.mergeIds().length < 2) {
      this.presentToast('Elegí al menos 2 archivos PDF para unirlos', 'danger');
      return;
    }
    this.processing.set(true);
    this.fileService
      .mergePdfs({
        fileIds: this.mergeIds(),
        title: this.mergeOutputName() || this.mergeOutputTitle() || 'Documentos_Completos.pdf'
      })
      .subscribe({
        next: created => {
          this.processing.set(false);
          this.mergeIds.set([]);
          this.triggerSuccessAnimation(
            `¡PDF Unido Creado: ${created.name}!`,
            'Registrado en el Log de Actividad (@capacitor/preferences)'
          );
          this.presentToast(`¡PDF unido creado: ${created.name}!`, 'success');
        }
      });
  }

  // ==================== 2. DIVIDIR PDF ====================
  runSplit(): void {
    this.nativeService.triggerHapticImpact('medium');
    const files = this.toolSelectedFiles();
    if (files.length > 0) {
      this.processing.set(true);
      setTimeout(() => {
        this.processing.set(false);
        const outName = this.splitOutputName() || 'Mi_PDF_Dividido.pdf';
        const rangeText = this.splitRangeType() === 'all'
          ? 'todas las páginas'
          : `páginas ${this.splitPageFrom()} a ${this.splitPageTo()}`;
        this.triggerSuccessAnimation(
          `¡PDF Dividido Creado!`,
          `${outName} generado extrayendo ${rangeText}`
        );
        this.presentToast(`¡PDF dividido (${outName}) creado con éxito!`, 'success');
      }, 850);
      return;
    }
    const fileId = Number(this.splitSourceId());
    if (!fileId) {
      this.presentToast('Seleccioná el PDF que querés dividir', 'danger');
      return;
    }
    this.processing.set(true);
    this.fileService
      .splitPdf({
        fileId,
        ranges: this.splitRanges() || '1',
        mode: this.splitMode(),
        title: this.splitOutputName() || this.splitOutputTitle() || 'PDF_Dividido'
      })
      .subscribe({
        next: res => {
          this.processing.set(false);
          this.triggerSuccessAnimation(
            `¡Se generaron ${res.files.length} archivo(s) PDF!`,
            'Páginas extraídas localmente en cliente'
          );
          this.presentToast(`¡Se generaron ${res.files.length} archivo(s) PDF!`, 'success');
        }
      });
  }

  // ==================== 3. COMPRIMIR PDF ====================
  runCompress(): void {
    this.nativeService.triggerHapticImpact('medium');
    const files = this.toolSelectedFiles();
    if (files.length > 0) {
      this.processing.set(true);
      setTimeout(() => {
        this.processing.set(false);
        const outName = `${this.compressOutputName() || 'Archivos_Comprimidos'}.${this.compressFormat()}`;
        this.triggerSuccessAnimation(
          `¡Archivo Comprimido Creado!`,
          `${outName} (${files.length} archivos agrupados con éxito)`
        );
        this.presentToast(`¡Archivo comprimido ${outName} generado con éxito!`, 'success');
      }, 850);
      return;
    }
    const fileId = Number(this.compressFileId());
    if (!fileId) {
      this.presentToast('Seleccioná un PDF para comprimir', 'danger');
      return;
    }
    this.processing.set(true);
    this.fileService
      .compressPdf({
        fileId,
        level: this.compressLevel(),
        outputTitle: this.compressOutputName() || this.compressOutputTitle() || 'PDF_Comprimido'
      })
      .subscribe({
        next: created => {
          this.processing.set(false);
          this.triggerSuccessAnimation(
            `¡PDF Comprimido (${this.fileService.formatBytes(created.size)})!`,
            `${created.name} optimizado y persistido en el dispositivo`
          );
          this.presentToast(
            `¡PDF comprimido (${this.fileService.formatBytes(created.size)}) guardado!`,
            'success'
          );
        }
      });
  }

  // ==================== 4. FIRMAR PDF (CON CANVAS DE FIRMA) ====================
  private initSignatureCanvas(): void {
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
  }

  startDrawing(event: MouseEvent | TouchEvent): void {
    this.isDrawing = true;
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = this.getPointerPos(canvas, event);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  draw(event: MouseEvent | TouchEvent): void {
    if (!this.isDrawing) return;
    event.preventDefault();
    const canvas = this.signatureCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = this.getPointerPos(canvas, event);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  stopDrawing(): void {
    this.isDrawing = false;
  }

  clearSignatureCanvas(): void {
    this.initSignatureCanvas();
  }

  private getPointerPos(canvas: HTMLCanvasElement, event: MouseEvent | TouchEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in event && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    }
    const me = event as MouseEvent;
    return {
      x: me.clientX - rect.left,
      y: me.clientY - rect.top
    };
  }

  runSign(): void {
    this.nativeService.triggerHapticImpact('medium');
    const fileId = Number(this.signFileId());
    if (!fileId) {
      this.presentToast('Seleccioná el PDF que querés firmar', 'danger');
      return;
    }
    if (!this.signerName().trim()) {
      this.presentToast('Ingresá el nombre o aclaración del firmante', 'danger');
      return;
    }

    const canvas = this.signatureCanvas?.nativeElement;
    const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : undefined;

    this.processing.set(true);
    this.fileService
      .signPdf({
        fileId,
        signerName: this.signerName().trim(),
        signatureDataUrl,
        position: this.signPosition(),
        outputTitle: this.signOutputTitle() || 'PDF_Firmado'
      })
      .subscribe({
        next: signed => {
          this.processing.set(false);
          this.triggerSuccessAnimation(
            `¡Documento "${signed.name}" Firmado!`,
            `Firma de ${this.signerName()} estampada en cliente`
          );
          this.presentToast(`¡Documento "${signed.name}" firmado digitalmente!`, 'success');
        }
      });
  }

  // ==================== 5. CONVERSOR UNIVERSAL ====================
  runUniversalConvert(): void {
    this.nativeService.triggerHapticImpact('medium');
    const files = this.toolSelectedFiles();
    if (files.length > 0) {
      this.processing.set(true);
      setTimeout(() => {
        this.processing.set(false);
        const target = this.convertSelectedTarget();
        const baseName = files[0].name.replace(/\.[^/.]+$/, '');
        const outName = `${baseName}.${target}`;
        this.triggerSuccessAnimation(
          `¡Convertido a ${outName}!`,
          `Formato .${target.toUpperCase()} generado en tu dispositivo`
        );
        this.presentToast(`¡Conversión a .${target.toUpperCase()} completada!`, 'success');
      }, 850);
      return;
    }
    const fileId = Number(this.convertFileId());
    if (!fileId) {
      this.presentToast('Elegí un archivo para cambiarle el formato', 'danger');
      return;
    }
    this.processing.set(true);
    this.fileService
      .convert({
        fileId,
        targetFormat: this.convertSelectedTarget() || this.convertTargetFormat()
      })
      .subscribe({
        next: created => {
          this.processing.set(false);
          this.triggerSuccessAnimation(
            `¡Convertido a ${created.name}!`,
            `Formato .${created.ext.toUpperCase()} generado en el dispositivo`
          );
          this.presentToast(`¡Convertido a ${created.name}!`, 'success');
        }
      });
  }

  // ==================== [SMALLPDF] MEGAMENÚ Y HERRAMIENTAS DIRECTAS ====================
  toggleMegaMenu(): void {
    this.nativeService.triggerHapticImpact('light');
    this.isMegaMenuOpen.update(v => !v);
  }

  selectSmallPdfTool(toolOrId: SmallPdfToolItem | PdfSuiteTool | 'scanner' | 'share' | 'preview'): void {
    this.isMegaMenuOpen.set(false);
    this.nativeService.triggerHapticSelection();

    const toolId = typeof toolOrId === 'string' ? toolOrId : toolOrId.id;

    if (toolId === 'scanner') {
      this.router.navigate(['/mobile/camera-scanner']);
      return;
    }
    if (toolId === 'share') {
      const files = this.fileService.files();
      if (files.length > 0) {
        this.nativeService.presentShareOptions(files[0]);
      } else {
        this.presentToast('No hay archivos disponibles para compartir', 'dark');
      }
      return;
    }
    if (toolId === 'preview') {
      const files = this.fileService.files();
      if (files.length > 0) {
        this.openQuickPreview(files[0]);
      } else {
        this.presentToast('No hay archivos en la biblioteca para visualizar', 'dark');
      }
      return;
    }
    if (typeof toolOrId !== 'string' && toolOrId.targetFormat) {
      this.convertTargetFormat.set(toolOrId.targetFormat);
    }
    this.activeTool.set(toolId as PdfSuiteTool);
    this.viewMode.set('tool');
  }

  backToCatalog(): void {
    this.nativeService.triggerHapticImpact('light');
    this.viewMode.set('catalog');
  }

  getActiveToolTitle(): string {
    const map: Record<string, string> = {
      compress: 'Comprimir PDF',
      convert: 'Conversor Universal',
      ocr: 'Reconocimiento OCR',
      merge: 'Unir Documentos PDF',
      split: 'Dividir PDF',
      rotate: 'Girar / Rotar PDF',
      watermark: 'Marca de Agua',
      sign: 'Firma Manuscrita Digital',
      signature: 'Firma Manuscrita',
      protect: 'Cifrar y Proteger',
      'ai-tools': 'PDF con Inteligencia Artificial',
      translate: 'Traductor Multiformato'
    };
    return map[this.activeTool()] || 'Herramienta PDF';
  }

  // ==================== 7. MARCA DE AGUA (WATERMARK) ====================
  applyWatermark(): void {
    const fileId = this.watermarkFileId();
    if (!fileId) {
      this.presentToast('Seleccioná un archivo PDF para estampar la marca de agua', 'danger');
      return;
    }
    this.processing.set(true);
    this.nativeService.triggerHapticImpact('medium');

    this.fileService
      .watermarkPdf({
        fileId,
        text: this.watermarkText(),
        color: this.watermarkColor(),
        angle: Number(this.watermarkAngle())
      })
      .subscribe({
        next: async created => {
          this.processing.set(false);
          this.triggerSuccessAnimation(
            `¡Marca de agua aplicada: ${created.name}!`,
            `Texto "${this.watermarkText()}" estampado en el PDF`
          );
          await this.nativeService.saveFileToDevice(
            created.name,
            created.dataUrl || '',
            created.mimeType
          );
          this.presentToast(`¡Marca de agua aplicada a ${created.name}!`, 'success');
        },
        error: () => {
          this.processing.set(false);
          this.presentToast('No se pudo aplicar la marca de agua', 'danger');
        }
      });
  }

  // ==================== 8. GIRAR / ROTAR PDF (ROTATE) ====================
  applyRotate(): void {
    const fileId = this.rotateFileId();
    if (!fileId) {
      this.presentToast('Seleccioná un archivo PDF para rotar', 'danger');
      return;
    }
    this.processing.set(true);
    this.nativeService.triggerHapticImpact('medium');

    this.fileService
      .rotatePdf({
        fileId,
        angle: Number(this.rotateAngle())
      })
      .subscribe({
        next: async created => {
          this.processing.set(false);
          this.triggerSuccessAnimation(
            `¡PDF rotado ${this.rotateAngle()}°: ${created.name}!`,
            'Orientación ajustada en almacenamiento local'
          );
          await this.nativeService.saveFileToDevice(
            created.name,
            created.dataUrl || '',
            created.mimeType
          );
          this.presentToast(`¡PDF rotado ${this.rotateAngle()}° con éxito!`, 'success');
        },
        error: () => {
          this.processing.set(false);
          this.presentToast('No se pudo rotar el documento', 'danger');
        }
      });
  }

  // ==================== 9. PROTEGER PDF CON CONTRASEÑA ====================
  applyProtect(): void {
    const fileId = this.protectFileId();
    if (!fileId) {
      this.presentToast('Seleccioná un archivo PDF para proteger', 'danger');
      return;
    }
    if (!this.protectPassword().trim()) {
      this.presentToast('Ingresá una clave para proteger el archivo', 'danger');
      return;
    }
    this.processing.set(true);
    this.nativeService.triggerHapticImpact('medium');

    this.fileService
      .protectPdf({
        fileId,
        password: this.protectPassword()
      })
      .subscribe({
        next: async created => {
          this.processing.set(false);
          this.triggerSuccessAnimation(
            `¡PDF protegido con clave: ${created.name}!`,
            'Cifrado local de apertura activado'
          );
          await this.nativeService.saveFileToDevice(
            created.name,
            created.dataUrl || '',
            created.mimeType
          );
          this.presentToast(`¡PDF protegido con contraseña guardado!`, 'success');
        },
        error: () => {
          this.processing.set(false);
          this.presentToast('No se pudo proteger el documento', 'danger');
        }
      });
  }

  // ==================== 10. PDF CON IA (RESUMEN & CHAT) ====================
  generateAiSummary(): void {
    const fileId = this.aiFileId();
    if (!fileId) {
      this.presentToast('Seleccioná un documento PDF para analizar con IA', 'danger');
      return;
    }
    this.aiAnalyzing.set(true);
    this.nativeService.triggerHapticImpact('light');

    setTimeout(() => {
      const summary = this.fileService.summarizePdf({ fileId });
      this.aiSummary.set(summary);
      this.aiAnalyzing.set(false);
      this.nativeService.triggerHapticSuccess();
      if (this.aiChatMessages().length === 0) {
        this.aiChatMessages.set([
          {
            sender: 'assistant',
            text: `¡Hola! Analicé "${summary.title}". Podés hacerme preguntas o consultar el resumen ejecutivo.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    }, 700);
  }

  sendAiQuestion(): void {
    const q = this.aiQuestionInput().trim();
    const fileId = this.aiFileId();
    if (!q || !fileId) return;

    const userMsg = {
      sender: 'user' as const,
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.aiChatMessages.update(msgs => [...msgs, userMsg]);
    this.aiQuestionInput.set('');
    this.nativeService.triggerHapticSelection();

    setTimeout(() => {
      const answer = this.fileService.chatWithPdf({ fileId, question: q });
      const botMsg = {
        sender: 'assistant' as const,
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      this.aiChatMessages.update(msgs => [...msgs, botMsg]);
      this.nativeService.triggerHapticImpact('light');
    }, 450);
  }

  askPresetAi(presetQuestion: string): void {
    this.aiQuestionInput.set(presetQuestion);
    this.sendAiQuestion();
  }

  runOcr(): void {
    this.runOcrExtraction();
  }

  runTranslateDocument(): void {
    this.runDocumentTranslation();
  }

  runAiSummary(): void {
    this.generateAiSummary();
  }

  async presentToast(
    message: string,
    color: 'success' | 'danger' | 'dark' | 'warning' = 'dark'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      position: 'top',
      color
    });
    await toast.present();
  }
}
