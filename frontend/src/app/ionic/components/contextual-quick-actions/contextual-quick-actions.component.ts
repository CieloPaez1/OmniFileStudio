import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  ToastController,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonBadge
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  flashOutline,
  closeOutline,
  createOutline,
  contractOutline,
  cutOutline,
  gitMergeOutline,
  documentTextOutline,
  imageOutline,
  swapHorizontalOutline,
  sparklesOutline,
  shareSocialOutline,
  logoWhatsapp,
  saveOutline,
  archiveOutline,
  trashOutline,
  downloadOutline,
  ellipsisHorizontalCircleOutline,
  shieldCheckmarkOutline,
  languageOutline
} from 'ionicons/icons';

import { ManagedFile } from '../../../models/managed-file.model';
import { FileManagerService } from '../../../services/file-manager.service';
import { CapacitorNativeService } from '../../../services/capacitor-native.service';

export interface ContextualToolOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  accentColor: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger';
  badge?: string;
  handler: () => Promise<void> | void;
}

// =============================================================================
// [OMNIFILE STUDIO · COMPONENTE UX/UI DE ACCIONES RÁPIDAS CONTEXTUALES]
// Detecta automáticamente la categoría y extensión del archivo seleccionado
// (PDF, Imagen, Datos CSV/JSON, Documento de texto) y despliega tanto un
// Bottom Sheet interactivo (ion-modal con breakpoints) como un ion-action-sheet
// nativo con las herramientas específicas aplicables a ese formato.
// =============================================================================
@Component({
  selector: 'app-contextual-quick-actions',
  standalone: true,
  imports: [
    CommonModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonIcon,
    IonBadge
  ],
  templateUrl: './contextual-quick-actions.component.html',
  styleUrls: ['./contextual-quick-actions.component.css']
})
export class ContextualQuickActionsComponent {
  readonly fileService = inject(FileManagerService);
  readonly nativeService = inject(CapacitorNativeService);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly toastCtrl = inject(ToastController);
  private readonly router = inject(Router);

  private readonly _selectedFile = signal<ManagedFile | null>(null);

  @Input()
  set file(value: ManagedFile | null) {
    this._selectedFile.set(value);
  }
  get file(): ManagedFile | null {
    return this._selectedFile();
  }

  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() fileMutated = new EventEmitter<ManagedFile>();

  readonly processingAction = signal<string | null>(null);

  // Etiqueta descriptiva del motor de detección según el tipo de archivo
  readonly detectedTypeLabel = computed(() => {
    const f = this._selectedFile();
    if (!f) return '';
    if (f.ext === 'pdf' || f.category === 'PDF') {
      return 'Documento PDF detectado · Herramientas de Suite PDF habilitadas';
    }
    if (f.category === 'IMAGE') {
      return 'Imagen detectada · Conversión a PDF y optimización visual habilitadas';
    }
    if (f.category === 'DATA') {
      return ' Archivo de Datos detectado · Transformación CSV/JSON/PDF habilitada';
    }
    return 'Documento de Texto detectado · Exportación a PDF y conversión habilitadas';
  });

  // Herramientas contextuales dinámicas según el tipo de archivo
  readonly contextualTools = computed<ContextualToolOption[]>(() => {
    const f = this._selectedFile();
    if (!f) return [];

    const tools: ContextualToolOption[] = [];

    // 0. HERRAMIENTA TRANSVERSAL DE MODIFICACIÓN / EDICIÓN (ABM)
    tools.push({
      id: 'edit-file-meta',
      title: 'Modificar Archivo',
      subtitle: 'Editar nombre, etiqueta y descripción del documento',
      icon: 'create-outline',
      accentColor: 'primary',
      badge: 'ABM',
      handler: () => {
        this.closeModal();
        this.router.navigate(['/mobile/file-form'], {
          queryParams: { id: f.id }
        });
      }
    });

    // 1. HERRAMIENTAS EXCLUSIVAS PARA ARCHIVOS PDF
    if (f.ext === 'pdf' || f.category === 'PDF') {
      tools.push(
        {
          id: 'sign-pdf',
          title: 'Firmar PDF Digitalmente',
          subtitle: 'Estampar firma manuscrita o sello legal en cliente',
          icon: 'create-outline',
          accentColor: 'primary',
          badge: f.signed ? 'Firmado' : 'Suite PDF',
          handler: () => this.quickSignPdf(f)
        },
        {
          id: 'compress-pdf',
          title: 'Comprimir PDF (Reducir Peso)',
          subtitle: 'Optimización local sin pérdida de legibilidad (-42%)',
          icon: 'contract-outline',
          accentColor: 'success',
          badge: f.compressed ? 'Optimizado' : 'Rápido',
          handler: () => this.quickCompressPdf(f)
        },
        {
          id: 'split-pdf',
          title: 'Dividir o Extraer Páginas',
          subtitle: 'Separar primera página o abrir divisor por rangos',
          icon: 'cut-outline',
          accentColor: 'tertiary',
          badge: `${f.pageCount || 1} pág.`,
          handler: () => this.quickSplitFirstPage(f)
        },
        {
          id: 'open-pdf-suite',
          title: 'Abrir en Suite PDF Completa',
          subtitle: 'Unir con otros PDFs, rotar o dibujar firma en lienzo',
          icon: 'git-merge-outline',
          accentColor: 'secondary',
          handler: () => this.navigateToPdfSuite(f)
        },
        {
          id: 'pdf-to-txt',
          title: 'Extraer Texto Plano (.TXT)',
          subtitle: 'Convertir contenido del PDF a archivo de texto',
          icon: 'document-text-outline',
          accentColor: 'warning',
          handler: () => this.quickConvertTo(f, 'txt')
        }
      );
    }

    // 2. HERRAMIENTAS EXCLUSIVAS PARA IMÁGENES (JPG, PNG, WEBP, BMP)
    if (f.category === 'IMAGE') {
      tools.push(
        {
          id: 'img-to-pdf',
          title: 'Convertir Imagen a PDF (A4)',
          subtitle: 'Genera un documento PDF listo para imprimir o firmar',
          icon: 'document-text-outline',
          accentColor: 'primary',
          badge: 'Recomendado',
          handler: () => this.quickConvertTo(f, 'pdf')
        },
        {
          id: 'img-to-webp',
          title: f.ext === 'webp' ? 'Convertir a PNG sin pérdida' : 'Optimizar a formato .WEBP',
          subtitle: 'Conversión en cliente mediante HTML5 Canvas',
          icon: 'image-outline',
          accentColor: 'tertiary',
          handler: () => this.quickConvertTo(f, f.ext === 'webp' ? 'png' : 'webp')
        },
        {
          id: 'img-to-jpg',
          title: f.ext === 'jpg' ? 'Convertir a .PNG' : 'Convertir a .JPG Estándar',
          subtitle: 'Máxima compatibilidad entre dispositivos móviles',
          icon: 'swap-horizontal-outline',
          accentColor: 'secondary',
          handler: () => this.quickConvertTo(f, f.ext === 'jpg' ? 'png' : 'jpg')
        }
      );
    }

    // 3. HERRAMIENTAS EXCLUSIVAS PARA DATOS Y DOCUMENTOS (CSV, JSON, TXT, MD, HTML)
    if (f.category === 'DATA' || f.category === 'DOCUMENT') {
      tools.push(
        {
          id: 'doc-to-pdf',
          title: 'Exportar a Documento PDF',
          subtitle: 'Maquetación automática a PDF 100% en tu dispositivo',
          icon: 'document-text-outline',
          accentColor: 'primary',
          badge: 'PDF',
          handler: () => this.quickConvertTo(f, 'pdf')
        }
      );

      for (const target of f.availableTargets.filter(t => t !== 'pdf').slice(0, 3)) {
        tools.push({
          id: `convert-${target}`,
          title: `Transformar a formato .${target.toUpperCase()}`,
          subtitle: `Conversión estructural directa desde .${f.ext.toUpperCase()}`,
          icon: 'swap-horizontal-outline',
          accentColor: 'tertiary',
          handler: () => this.quickConvertTo(f, target)
        });
      }
    }

    // 4. TRADUCTOR UNIVERSAL DE DOCUMENTOS MULTIFORMATO (PDF, DOCX, XLSX, PPTX, CSV, TXT, HTML, MD)
    if (f.category !== 'IMAGE') {
      tools.unshift({
        id: 'translate-doc',
        title: 'Traducir Documento (8 Idiomas)',
        subtitle: 'Español, Inglés, Portugués, Francés, Alemán, Italiano y Chino',
        icon: 'language-outline',
        accentColor: 'warning',
        badge: 'Traductor',
        handler: () => this.navigateToTranslator(f)
      });
    }

    // 5. HERRAMIENTA TRANSVERSAL DE IA CONTEXTUAL (AUTO-NORMALIZAR NOMBRE)
    tools.push({
      id: 'smart-normalize',
      title: 'Normalizar Nombre con IA Contextual',
      subtitle: 'Estandariza prefijo semántico, categoría y fecha ISO',
      icon: 'sparkles-outline',
      accentColor: 'secondary',
      badge: 'IA Local',
      handler: () => this.smartNormalizeExistingFile(f)
    });

    return tools;
  });

  constructor() {
    addIcons({
      flashOutline,
      closeOutline,
      createOutline,
      contractOutline,
      cutOutline,
      gitMergeOutline,
      documentTextOutline,
      imageOutline,
      swapHorizontalOutline,
      sparklesOutline,
      shareSocialOutline,
      logoWhatsapp,
      saveOutline,
      archiveOutline,
      trashOutline,
      downloadOutline,
      ellipsisHorizontalCircleOutline,
      shieldCheckmarkOutline,
      languageOutline
    });
  }

  navigateToTranslator(file: ManagedFile): void {
    this.closeModal();
    this.router.navigate(['/mobile/pdf-suite'], {
      queryParams: { tool: 'translate', fileId: file.id }
    });
  }

  closeModal(): void {
    this.closed.emit();
  }

  /**
   * Despliega también un `ion-action-sheet` nativo de Ionic 9 con las acciones
   * detectadas dinámicamente para el archivo actual.
   */
  async presentNativeActionSheet(targetFile?: ManagedFile): Promise<void> {
    const f = targetFile || this._selectedFile();
    if (!f) return;

    this._selectedFile.set(f);
    const dynamicButtons = this.contextualTools().map(tool => ({
      text: tool.title,
      icon: tool.icon,
      handler: () => {
        tool.handler();
      }
    }));

    const sheet = await this.actionSheetCtrl.create({
      header: `⚡ Acciones Contextuales · ${f.name}`,
      subHeader: this.detectedTypeLabel(),
      buttons: [
        ...dynamicButtons,
        {
          text: 'Compartir Nativamente (Sistema / WhatsApp)',
          icon: 'share-social-outline',
          handler: () => {
            this.shareNatively();
          }
        },
        {
          text: 'Guardar en @capacitor/filesystem',
          icon: 'save-outline',
          handler: () => {
            this.saveInFilesystem();
          }
        },
        {
          text: f.archived ? 'Restaurar del Archivo' : 'Archivar Documento',
          icon: 'archive-outline',
          handler: () => {
            this.toggleArchive();
          }
        },
        {
          text: 'Eliminar Archivo',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.deleteFile();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await sheet.present();
  }

  // ===========================================================================
  // EJECUCIÓN DE ACCIONES CONTEXTUALES 100% EN EL CLIENTE
  // ===========================================================================
  private quickSignPdf(file: ManagedFile): void {
    this.processingAction.set('Firmando PDF localmente...');
    this.fileService
      .signPdf({
        fileId: file.id,
        signerName: 'Firma Digital OmniFile',
        position: 'bottom-right'
      })
      .subscribe({
        next: async signed => {
          await this.nativeService.saveFileToDevice(
            signed.name,
            signed.dataUrl || '',
            'application/pdf'
          );
          this.processingAction.set(null);
          this.fileMutated.emit(signed);
          this.presentToast(`✍️ "${signed.name}" firmado digitalmente en tu dispositivo`, 'success');
          this.closeModal();
        },
        error: () => this.processingAction.set(null)
      });
  }

  private quickCompressPdf(file: ManagedFile): void {
    this.processingAction.set('Comprimiendo PDF en cliente...');
    this.fileService
      .compressPdf({
        fileId: file.id,
        level: 'medium'
      })
      .subscribe({
        next: async compressed => {
          await this.nativeService.saveFileToDevice(
            compressed.name,
            compressed.dataUrl || '',
            'application/pdf'
          );
          this.processingAction.set(null);
          this.fileMutated.emit(compressed);
          this.presentToast(
            `🗜️ "${compressed.name}" comprimido (${this.fileService.formatBytes(compressed.size)})`,
            'success'
          );
          this.closeModal();
        },
        error: () => this.processingAction.set(null)
      });
  }

  private quickSplitFirstPage(file: ManagedFile): void {
    this.processingAction.set('Extrayendo página en cliente...');
    this.fileService
      .splitPdf({
        fileId: file.id,
        ranges: '1',
        mode: 'extract-single',
        title: `${file.name.replace(/\.pdf$/i, '')}_pag1`
      })
      .subscribe({
        next: res => {
          this.processingAction.set(null);
          if (res.files[0]) {
            this.fileMutated.emit(res.files[0]);
            this.presentToast(`✂️ Extraído "${res.files[0].name}"`, 'success');
          }
          this.closeModal();
        },
        error: () => this.processingAction.set(null)
      });
  }

  private quickConvertTo(file: ManagedFile, targetFormat: string): void {
    this.processingAction.set(`Convirtiendo a .${targetFormat.toUpperCase()}...`);
    this.fileService
      .convert({
        fileId: file.id,
        targetFormat,
        tag: file.tag
      })
      .subscribe({
        next: async converted => {
          await this.nativeService.saveFileToDevice(
            converted.name,
            converted.dataUrl || '',
            converted.mimeType
          );
          this.processingAction.set(null);
          this.fileMutated.emit(converted);
          this.presentToast(
            `🔄 Convertido localmente a "${converted.name}"`,
            'success'
          );
          this.closeModal();
        },
        error: () => this.processingAction.set(null)
      });
  }

  private smartNormalizeExistingFile(file: ManagedFile): void {
    const analysis = this.fileService.analyzeMetadataSync(
      file.name,
      file.mimeType,
      file.description || ''
    );
    this.fileService
      .updateFile(file.id, {
        name: analysis.suggestedFullName,
        tag: analysis.suggestedTag,
        description: analysis.suggestedDescription
      })
      .subscribe({
        next: updated => {
          this._selectedFile.set(updated);
          this.fileMutated.emit(updated);
          this.presentToast(
            `✨ Renombrado a "${updated.name}" [${updated.tag}]`,
            'success'
          );
          this.closeModal();
        }
      });
  }

  navigateToPdfSuite(file: ManagedFile): void {
    this.closeModal();
    this.router.navigate(['/mobile/pdf-suite'], {
      queryParams: { fileId: file.id }
    });
  }

  async shareNatively(): Promise<void> {
    const f = this._selectedFile();
    if (!f) return;
    await this.nativeService.presentShareOptions(f);
  }

  shareWhatsApp(): void {
    const f = this._selectedFile();
    if (!f) return;
    const res = this.nativeService.shareViaWhatsApp(f);
    this.presentToast(res.message, 'success');
  }

  async downloadFile(): Promise<void> {
    const f = this._selectedFile();
    if (!f) return;
    await this.nativeService.downloadFileToDevice(f);
  }

  async saveInFilesystem(): Promise<void> {
    const f = this._selectedFile();
    if (!f) return;
    const saved = await this.nativeService.saveFileToDevice(
      f.name,
      f.dataUrl || f.downloadUrl || f.name,
      f.mimeType
    );
    await this.presentToast(`💾 Guardado en ${saved.uri}`, 'success');
  }

  toggleArchive(): void {
    const f = this._selectedFile();
    if (!f) return;
    this.fileService.toggleArchive(f).subscribe({
      next: updated => {
        this.presentToast(
          updated.archived ? `"${f.name}" archivado` : `"${f.name}" restaurado`,
          'dark'
        );
        this.closeModal();
      }
    });
  }

  deleteFile(): void {
    const f = this._selectedFile();
    if (!f) return;
    this.fileService.delete(f.id).subscribe({
      next: () => {
        this.presentToast(`"${f.name}" eliminado`, 'danger');
        this.closeModal();
      }
    });
  }

  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'dark' = 'dark'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2300,
      position: 'top',
      color
    });
    await toast.present();
  }
}
