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
  documentOutline
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
  | 'compress'
  | 'convert'
  | 'ocr'
  | 'merge'
  | 'split'
  | 'rotate'
  | 'watermark'
  | 'sign'
  | 'protect'
  | 'ai-tools'
  | 'translate';

export interface HeroToolCard {
  id: PdfSuiteTool;
  title: string;
  subtitle: string;
  icon: string;
  accentClass: string;
}

export interface SmallPdfToolItem {
  id: PdfSuiteTool | 'scanner';
  name: string;
  desc: string;
  colorClass: string;
  icon: string;
  badge?: string;
}

export interface SmallPdfCategoryGroup {
  name: string;
  tools: SmallPdfToolItem[];
}

// =============================================================================
// [OMNIFILE STUDIO - SUITE SMALLPDF + TRADUCTOR + OCR + IA + EDICIÓN]
// - Megamenú interactivo desplegable idéntico a Smallpdf.com con todas las
//   categorías visuales: Comprimir, Convertir, Organizar, Editar, Proteger, IA y Escáner.
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
  processing = signal<boolean>(false);
  successFeedback = signal<{ title: string; subtitle: string } | null>(null);

  // Modal del Mega-Menú Smallpdf de Todas las Herramientas
  isMegaMenuOpen = signal<boolean>(false);
  megaMenuSearch = signal<string>('');

  // Modal de Vista Previa Rápida (Quick Preview)
  previewFile = signal<ManagedFile | null>(null);
  previewOpen = signal<boolean>(false);

  // Categorías completas del Megamenú tipo Smallpdf.com
  readonly smallPdfCategories: SmallPdfCategoryGroup[] = [
    {
      name: 'Comprimir',
      tools: [
        {
          id: 'compress',
          name: 'Comprimir PDF',
          desc: 'Reduce el peso de tu archivo optimizando la calidad',
          colorClass: 'sp-red',
          icon: 'contract-outline',
          badge: 'Rápido'
        }
      ]
    },
    {
      name: 'Convertir',
      tools: [
        {
          id: 'convert',
          name: 'Conversor de PDF',
          desc: 'Convierte archivos a y desde PDF en cliente',
          colorClass: 'sp-red',
          icon: 'swap-horizontal-outline'
        },
        {
          id: 'ocr',
          name: 'OCR en PDF',
          desc: 'Convierte fotos, recibos y escaneos en texto editable',
          colorClass: 'sp-red',
          icon: 'scan-outline',
          badge: 'WASM'
        },
        {
          id: 'convert',
          name: 'PDF a Imagen (JPG / PNG)',
          desc: 'Extrae páginas en imágenes de alta resolución',
          colorClass: 'sp-yellow',
          icon: 'image-outline'
        },
        {
          id: 'convert',
          name: 'Imagen a PDF (JPG / PNG)',
          desc: 'Crea documentos PDF a partir de tus fotos',
          colorClass: 'sp-yellow',
          icon: 'document-text-outline'
        },
        {
          id: 'convert',
          name: 'PDF a Word / Excel',
          desc: 'Exporta tus documentos a formatos de Office',
          colorClass: 'sp-blue',
          icon: 'document-outline'
        },
        {
          id: 'convert',
          name: 'Office a PDF (Word, Excel, PPT)',
          desc: 'Transforma hojas de cálculo y presentaciones a PDF',
          colorClass: 'sp-green',
          icon: 'stats-chart-outline'
        }
      ]
    },
    {
      name: 'Organizar',
      tools: [
        {
          id: 'merge',
          name: 'Unir PDF (Fusionar)',
          desc: 'Combina varios PDFs en un solo documento ordenado',
          colorClass: 'sp-purple',
          icon: 'git-merge-outline'
        },
        {
          id: 'split',
          name: 'Dividir PDF',
          desc: 'Separa páginas o extrae rangos individuales',
          colorClass: 'sp-purple',
          icon: 'cut-outline'
        },
        {
          id: 'rotate',
          name: 'Girar PDF',
          desc: 'Rota las páginas 90°, 180° o 270° según necesites',
          colorClass: 'sp-purple',
          icon: 'refresh-outline'
        }
      ]
    },
    {
      name: 'Editar y Proteger',
      tools: [
        {
          id: 'watermark',
          name: 'Marca de agua PDF',
          desc: 'Estampa texto confidencial o borrador diagonal',
          colorClass: 'sp-cyan',
          icon: 'water-outline'
        },
        {
          id: 'sign',
          name: 'Firmar PDF',
          desc: 'Firma manuscrita en lienzo HTML5 Canvas y sello',
          colorClass: 'sp-pink',
          icon: 'create-outline',
          badge: 'Legal'
        },
        {
          id: 'protect',
          name: 'Proteger PDF',
          desc: 'Cifra con contraseña y restringe apertura no autorizada',
          colorClass: 'sp-rose',
          icon: 'lock-closed-outline'
        }
      ]
    },
    {
      name: 'PDF con IA',
      tools: [
        {
          id: 'ai-tools',
          name: 'Resumen con IA',
          desc: 'Genera síntesis ejecutiva y puntos clave al instante',
          colorClass: 'sp-indigo',
          icon: 'sparkles-outline',
          badge: 'IA'
        },
        {
          id: 'ai-tools',
          name: 'Chatear con un PDF',
          desc: 'Pregúntale datos, fechas o importes al documento',
          colorClass: 'sp-indigo',
          icon: 'chatbubbles-outline',
          badge: 'Chat'
        },
        {
          id: 'translate',
          name: 'Traducir PDF',
          desc: 'Traduce a 8 idiomas preservando el formato original',
          colorClass: 'sp-amber',
          icon: 'language-outline'
        }
      ]
    },
    {
      name: 'Escanear',
      tools: [
        {
          id: 'scanner',
          name: 'Escáner de PDF',
          desc: 'Digitaliza con la cámara del dispositivo móvil',
          colorClass: 'sp-blue',
          icon: 'camera-outline',
          badge: 'Cámara'
        }
      ]
    }
  ];

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
      documentOutline
    });
  }

  ngOnInit(): void {
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
      if (requestedTool && this.heroTools.some(h => h.id === requestedTool)) {
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

  // ==================== 1. UNIR PDFs ====================
  toggleMergeId(id: number): void {
    this.nativeService.triggerHapticSelection();
    this.mergeIds.update(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );
  }

  runMerge(): void {
    this.nativeService.triggerHapticImpact('medium');
    if (this.mergeIds().length < 2) {
      this.presentToast('Elegí al menos 2 archivos PDF para unirlos', 'danger');
      return;
    }
    this.processing.set(true);
    this.fileService
      .mergePdfs({
        fileIds: this.mergeIds(),
        title: this.mergeOutputTitle() || 'PDF_Unido'
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
        title: this.splitOutputTitle() || 'PDF_Dividido'
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
        outputTitle: this.compressOutputTitle() || 'PDF_Comprimido'
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
    const fileId = Number(this.convertFileId());
    if (!fileId) {
      this.presentToast('Elegí un archivo para cambiarle el formato', 'danger');
      return;
    }
    this.processing.set(true);
    this.fileService
      .convert({
        fileId,
        targetFormat: this.convertTargetFormat()
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

  selectSmallPdfTool(toolId: PdfSuiteTool | 'scanner'): void {
    this.isMegaMenuOpen.set(false);
    if (toolId === 'scanner') {
      this.router.navigate(['/mobile/camera-scanner']);
      return;
    }
    this.activeTool.set(toolId);
    this.nativeService.triggerHapticSelection();
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

  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'dark' = 'dark'
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
