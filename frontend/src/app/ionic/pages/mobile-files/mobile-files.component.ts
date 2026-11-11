import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// =============================================================================
// [IONIC 9 + CAPACITOR 8] GESTOR Y CONVERSOR DE ARCHIVOS MÓVIL
// Usa @capacitor/camera, @capacitor/filesystem, ActionSheetController,
// IonSegment, IonRefresher y el motor hexagonal en Java 21 + iText 8.
// =============================================================================
import {
  ActionSheetController,
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
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
  IonBadge,
  IonChip,
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/angular';

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  cameraOutline,
  imageOutline,
  documentTextOutline,
  swapHorizontalOutline,
  gitMergeOutline,
  cutOutline,
  trashOutline,
  downloadOutline,
  eyeOutline,
  refreshOutline,
  addOutline,
  closeOutline,
  desktopOutline
} from 'ionicons/icons';

import { FileManagerService } from '../../../services/file-manager.service';
import { CapacitorNativeService } from '../../../services/capacitor-native.service';
import { ManagedFile, CameraPhotoItem } from '../../../models/managed-file.model';

export type MobileFilesSegment = 'library' | 'convert' | 'camera' | 'pdf-tools';

@Component({
  selector: 'app-mobile-files',
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
    IonSegment,
    IonSegmentButton,
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
    IonBadge,
    IonChip,
    IonRefresher,
    IonRefresherContent,
    IonSpinner
  ],
  templateUrl: './mobile-files.component.html',
  styleUrls: ['./mobile-files.component.css']
})
export class MobileFilesComponent implements OnInit {
  readonly fileService = inject(FileManagerService);
  readonly nativeService = inject(CapacitorNativeService);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly toastCtrl = inject(ToastController);

  activeSegment = signal<MobileFilesSegment>('library');

  // Conversión móvil
  selectedFileIdForConvert = signal<number | null>(null);
  selectedTargetFormat = signal<string>('pdf');
  converting = signal<boolean>(false);

  // Cámara móvil a PDF (@capacitor/camera)
  capturedPhotos = signal<CameraPhotoItem[]>([]);
  cameraPdfTitle = signal<string>('Escaneo_Movil');
  cameraPageSize = signal<'A4' | 'LETTER' | 'FIT'>('A4');
  generatingPdf = signal<boolean>(false);

  // Herramientas PDF (Unir y Dividir)
  mergeSelectedIds = signal<number[]>([]);
  mergeTitle = signal<string>('PDF_Unido_Movil');
  splitFileId = signal<number | null>(null);
  splitRanges = signal<string>('1');
  splitMode = signal<'extract-single' | 'split-multiple'>('extract-single');
  processingPdf = signal<boolean>(false);

  readonly files = this.fileService.files;
  readonly pdfFiles = this.fileService.pdfFiles;

  readonly availableTargetsForSelected = computed(() => {
    const id = Number(this.selectedFileIdForConvert());
    const found = this.files().find(f => f.id === id);
    return found ? found.availableTargets : ['pdf', 'png', 'jpg', 'txt', 'html'];
  });

  constructor() {
    addIcons({
      cloudUploadOutline,
      cameraOutline,
      imageOutline,
      documentTextOutline,
      swapHorizontalOutline,
      gitMergeOutline,
      cutOutline,
      trashOutline,
      downloadOutline,
      eyeOutline,
      refreshOutline,
      addOutline,
      closeOutline,
      desktopOutline
    });
  }

  ngOnInit(): void {
    this.fileService.getAll().subscribe();
  }

  handleRefresh(event: any): void {
    this.fileService.getAll().subscribe({
      next: () => event.target.complete(),
      error: () => event.target.complete()
    });
  }

  onSegmentChange(event: any): void {
    const val = event?.detail?.value as MobileFilesSegment;
    if (val) this.activeSegment.set(val);
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'dark' = 'dark'): Promise<void> {
    const t = await this.toastCtrl.create({
      message,
      duration: 2300,
      position: 'top',
      color
    });
    await t.present();
  }

  // ==================== SUBIDA DE ARCHIVOS ====================

  onMobileFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.fileService.upload(input.files).subscribe({
      next: list => this.showToast(`Subidos ${list.length} archivo(s) con éxito`, 'success'),
      error: () => this.showToast('Error al subir archivo al backend', 'danger')
    });
    input.value = '';
  }

  prepareConvert(file: ManagedFile): void {
    this.selectedFileIdForConvert.set(file.id);
    if (file.availableTargets.length > 0) {
      this.selectedTargetFormat.set(file.availableTargets[0]);
    }
    this.activeSegment.set('convert');
  }

  deleteFile(file: ManagedFile): void {
    this.fileService.delete(file.id).subscribe({
      next: () => this.showToast(`"${file.name}" eliminado`, 'dark')
    });
  }

  // ==================== CONVERSIÓN DE FORMATO ====================

  runMobileConversion(): void {
    const fileId = Number(this.selectedFileIdForConvert());
    if (!fileId) {
      this.showToast('Seleccioná un archivo primero', 'danger');
      return;
    }
    this.converting.set(true);
    this.fileService
      .convert({
        fileId,
        targetFormat: this.selectedTargetFormat()
      })
      .subscribe({
        next: created => {
          this.converting.set(false);
          this.showToast(`Convertido a ${created.name}`, 'success');
          this.activeSegment.set('library');
        },
        error: () => {
          this.converting.set(false);
          this.showToast('No se pudo convertir el archivo', 'danger');
        }
      });
  }

  // ==================== CÁMARA NATIVA CAPACITOR A PDF ====================

  async openCameraSheet(): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Escanear página para PDF',
      buttons: [
        {
          text: 'Sacar foto con la Cámara',
          icon: 'camera-outline',
          handler: () => this.capturePhoto(CameraSource.Camera)
        },
        {
          text: 'Elegir imagen de la Galería',
          icon: 'image-outline',
          handler: () => this.capturePhoto(CameraSource.Photos)
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

  async capturePhoto(source: CameraSource): Promise<void> {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source,
        quality: 88
      });

      if (!photo.dataUrl) return;

      const fileName = `scan-${Date.now()}.jpeg`;
      if (Capacitor.isNativePlatform()) {
        const cleanBase64 = photo.base64String || photo.dataUrl.split(',')[1] || '';
        if (cleanBase64) {
          await Filesystem.writeFile({
            path: fileName,
            data: cleanBase64,
            directory: Directory.Data
          });
        }
      }

      this.capturedPhotos.update(list => [
        ...list,
        {
          id: crypto.randomUUID(),
          name: fileName,
          dataUrl: photo.dataUrl!,
          rotation: 0
        }
      ]);
      this.showToast('Página agregada al documento PDF', 'success');
    } catch {
      // Cancelado por el usuario
    }
  }

  rotateCapturedPhoto(index: number): void {
    this.capturedPhotos.update(list =>
      list.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  }

  removeCapturedPhoto(index: number): void {
    this.capturedPhotos.update(list => list.filter((_, i) => i !== index));
  }

  generateMobileCameraPdf(): void {
    const photos = this.capturedPhotos();
    if (photos.length === 0) {
      this.showToast('Sacá o agregá al menos una foto primero', 'danger');
      return;
    }

    this.generatingPdf.set(true);
    this.fileService
      .createPdfFromPhotos({
        title: this.cameraPdfTitle() || 'Escaneo_Movil',
        pageSize: this.cameraPageSize(),
        orientation: 'portrait',
        margin: 20,
        photos: photos.map(p => ({ dataUrl: p.dataUrl, rotation: p.rotation }))
      })
      .subscribe({
        next: pdf => {
          this.generatingPdf.set(false);
          this.capturedPhotos.set([]);
          this.showToast(`PDF creado: ${pdf.name}`, 'success');
          this.activeSegment.set('library');
        },
        error: () => {
          this.generatingPdf.set(false);
          this.showToast('Error al crear el PDF', 'danger');
        }
      });
  }

  // ==================== UNIR Y DIVIDIR PDFs ====================

  toggleMergePdfSelection(id: number): void {
    this.mergeSelectedIds.update(curr =>
      curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]
    );
  }

  runMobileMergePdfs(): void {
    const ids = this.mergeSelectedIds();
    if (ids.length < 2) {
      this.showToast('Seleccioná al menos 2 PDFs para unir', 'danger');
      return;
    }
    this.processingPdf.set(true);
    this.fileService
      .mergePdfs({
        fileIds: ids,
        title: this.mergeTitle() || 'PDF_Unido_Movil'
      })
      .subscribe({
        next: merged => {
          this.processingPdf.set(false);
          this.mergeSelectedIds.set([]);
          this.showToast(`PDF Unido creado (${merged.pageCount} págs.)`, 'success');
          this.activeSegment.set('library');
        },
        error: () => {
          this.processingPdf.set(false);
          this.showToast('Error al unir PDFs', 'danger');
        }
      });
  }

  runMobileSplitPdf(): void {
    const fileId = Number(this.splitFileId());
    if (!fileId) {
      this.showToast('Elegí el PDF que querés dividir', 'danger');
      return;
    }
    this.processingPdf.set(true);
    this.fileService
      .splitPdf({
        fileId,
        ranges: this.splitRanges() || '1',
        mode: this.splitMode(),
        title: 'PDF_Dividido_Movil'
      })
      .subscribe({
        next: res => {
          this.processingPdf.set(false);
          this.showToast(`Se generaron ${res.files.length} archivo(s) PDF`, 'success');
          this.activeSegment.set('library');
        },
        error: () => {
          this.processingPdf.set(false);
          this.showToast('Error al dividir el PDF', 'danger');
        }
      });
  }

  downloadFile(file: ManagedFile): void {
    this.nativeService.downloadFileToDevice(file);
  }
}
