import { Component, OnInit, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonChip
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
  sunnyOutline
} from 'ionicons/icons';
import { FileManagerService } from '../../../services/file-manager.service';
import { CapacitorNativeService } from '../../../services/capacitor-native.service';
import { ThemeService } from '../../../services/theme.service';

export type PdfSuiteTool = 'merge' | 'split' | 'compress' | 'sign' | 'convert';

export interface HeroToolCard {
  id: PdfSuiteTool;
  title: string;
  subtitle: string;
  icon: string;
  accentClass: string;
}

// =============================================================================
// [OMNIFILE STUDIO - TAB 4: SUITE PDF CON NAVEGACIÓN "HERO CARDS" + SELECTORES]
// - [MEJORA UX #4] Navegación Superior Tipo "Hero Cards" táctiles e intuitivas
// - [MEJORA UX #5] Selectores flotantes estilizados (píldoras y tarjetas) sin menús nativos
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
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonChip
  ],
  templateUrl: './mobile-pdf-suite.component.html',
  styleUrls: ['./mobile-pdf-suite.component.css']
})
export class MobilePdfSuiteComponent implements OnInit {
  readonly fileService = inject(FileManagerService);
  readonly nativeService = inject(CapacitorNativeService);
  readonly themeService = inject(ThemeService);
  private readonly toastCtrl = inject(ToastController);
  private readonly router = inject(Router);

  @ViewChild('signatureCanvas') signatureCanvas?: ElementRef<HTMLCanvasElement>;

  activeTool = signal<PdfSuiteTool>('merge');
  processing = signal<boolean>(false);
  successFeedback = signal<{ title: string; subtitle: string } | null>(null);

  // [MEJORA UX #4] Definición de las Hero Cards de navegación superior
  readonly heroTools: HeroToolCard[] = [
    {
      id: 'merge',
      title: 'Unir PDF',
      subtitle: 'Combinar varios',
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
      id: 'compress',
      title: 'Comprimir',
      subtitle: 'Reducir peso',
      icon: 'contract-outline',
      accentClass: 'hero-emerald'
    },
    {
      id: 'sign',
      title: 'Firmar PDF',
      subtitle: 'Trazo digital',
      icon: 'create-outline',
      accentClass: 'hero-violet'
    },
    {
      id: 'convert',
      title: 'Conversor',
      subtitle: 'Multiformato',
      icon: 'swap-horizontal-outline',
      accentClass: 'hero-blue'
    }
  ];

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

  readonly pdfFiles = this.fileService.pdfFiles;
  readonly allFiles = this.fileService.files;

  readonly availableTargetsForSelected = computed(() => {
    const id = Number(this.convertFileId());
    const found = this.allFiles().find(f => f.id === id);
    return found ? found.availableTargets : ['pdf', 'png', 'jpg', 'txt', 'html', 'json'];
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
      sunnyOutline
    });
  }

  private triggerSuccessAnimation(title: string, subtitle: string): void {
    this.nativeService.triggerHapticSuccess();
    this.successFeedback.set({ title, subtitle });
    setTimeout(() => {
      this.successFeedback.set(null);
    }, 3600);
  }

  ngOnInit(): void {
    if (this.allFiles().length === 0) {
      this.fileService.getAll().subscribe();
    }
  }

  selectHeroTool(tool: PdfSuiteTool): void {
    this.nativeService.triggerHapticSelection();
    this.activeTool.set(tool);
    if (tool === 'sign') {
      setTimeout(() => this.initSignatureCanvas(), 80);
    }
  }

  onToolChange(event: any): void {
    const val = event?.detail?.value as PdfSuiteTool;
    if (val) {
      this.selectHeroTool(val);
    }
  }

  // ==================== 1. UNIR PDFs ====================
  toggleMergeId(id: number): void {
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
