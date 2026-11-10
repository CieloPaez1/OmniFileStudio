import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSpinner
} from '@ionic/angular';
import { CameraSource } from '@capacitor/camera';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  imageOutline,
  documentTextOutline,
  trashOutline,
  refreshOutline,
  arrowUpOutline,
  arrowDownOutline,
  closeOutline,
  shareSocialOutline,
  logoWhatsapp,
  folderOpenOutline,
  moonOutline,
  sunnyOutline,
  scanOutline,
  copyOutline,
  checkmarkCircle
} from 'ionicons/icons';
import { FileManagerService } from '../../../services/file-manager.service';
import { CapacitorNativeService } from '../../../services/capacitor-native.service';
import { ThemeService } from '../../../services/theme.service';
import { OcrService } from '../../../services/ocr.service';
import {
  CameraPhotoItem,
  FileTagType,
  ManagedFile,
  OcrResult
} from '../../../models/managed-file.model';

// =============================================================================
// [OMNIFILE STUDIO - TAB 3: ESCÁNER DE CÁMARA HD + @capacitor/filesystem + SHARE]
// Captura fotografías en máxima calidad (95%) con @capacitor/camera, las persiste
// en @capacitor/filesystem (Directory.Data) y genera documentos PDF multipágina
// listos para compartir por Web Share API o WhatsApp.
// =============================================================================
@Component({
  selector: 'app-mobile-camera-scanner',
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
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonSpinner
  ],
  templateUrl: './mobile-camera-scanner.component.html',
  styleUrls: ['./mobile-camera-scanner.component.css']
})
export class MobileCameraScannerComponent {
  readonly fileService = inject(FileManagerService);
  readonly nativeService = inject(CapacitorNativeService);
  readonly themeService = inject(ThemeService);
  readonly ocrService = inject(OcrService);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly toastCtrl = inject(ToastController);
  private readonly router = inject(Router);

  photos = signal<CameraPhotoItem[]>([]);
  pdfTitle = signal<string>(`Documento_${new Date().toISOString().slice(0, 10)}`);
  selectedTag = signal<FileTagType>('Facturas');
  pageSize = signal<'A4' | 'LETTER' | 'FIT'>('A4');
  orientation = signal<'portrait' | 'landscape'>('portrait');
  generating = signal<boolean>(false);
  lastCreatedPdf = signal<ManagedFile | null>(null);

  // OCR sobre foto seleccionada
  activeOcrPhotoId = signal<string | null>(null);
  ocrExtracting = signal<boolean>(false);
  activeOcrResult = signal<OcrResult | null>(null);

  constructor() {
    addIcons({
      cameraOutline,
      imageOutline,
      documentTextOutline,
      trashOutline,
      refreshOutline,
      arrowUpOutline,
      arrowDownOutline,
      closeOutline,
      shareSocialOutline,
      logoWhatsapp,
      folderOpenOutline,
      moonOutline,
      sunnyOutline,
      scanOutline,
      copyOutline,
      checkmarkCircle
    });
  }

  async openCaptureMenu(): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Capturar página HD (@capacitor/camera + @capacitor/filesystem)',
      buttons: [
        {
          text: 'Tomar foto HD con la Cámara',
          icon: 'camera-outline',
          handler: () => this.capturePhoto(CameraSource.Camera)
        },
        {
          text: 'Seleccionar desde la Galería',
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

  async capturePhoto(source: CameraSource = CameraSource.Camera): Promise<void> {
    try {
      let dataUrl: string | null = null;
      let fileName = `Scan_${Date.now()}.jpeg`;

      try {
        const captured = await this.nativeService.captureHighResDocument(source);
        dataUrl = captured.dataUrl;
        fileName = captured.name;
      } catch {
        dataUrl = await this.pickFileFallback();
        if (dataUrl) {
          await this.nativeService.saveFileToDevice(fileName, dataUrl, 'image/jpeg');
        }
      }

      if (!dataUrl) return;

      // Auto-clasificación contextual si es la primera foto
      if (this.photos().length === 0) {
        const analysis = this.fileService.analyzeMetadataSync(fileName, 'image/jpeg');
        this.pdfTitle.set(analysis.suggestedName);
        this.selectedTag.set(analysis.suggestedTag);
      }

      this.photos.update(list => [
        ...list,
        {
          id: `photo-${Date.now()}-${list.length}`,
          name: fileName,
          dataUrl: dataUrl!,
          rotation: 0
        }
      ]);
      await this.presentToast(
        '📸 Foto HD capturada y guardada en @capacitor/filesystem',
        'success'
      );
    } catch {
      // Cancelado por el usuario
    }
  }

  private pickFileFallback(): Promise<string | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }

  rotatePhoto(index: number): void {
    this.photos.update(list =>
      list.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  }

  movePhoto(index: number, dir: -1 | 1): void {
    const arr = [...this.photos()];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    this.photos.set(arr);
  }

  removePhoto(index: number): void {
    this.photos.update(list => list.filter((_, i) => i !== index));
  }

  // ==================== OCR SOBRE FOTO INDIVIDUAL ====================
  async runOcrOnPhoto(photo: CameraPhotoItem): Promise<void> {
    this.nativeService.triggerHapticImpact('medium');
    this.activeOcrPhotoId.set(photo.id);
    this.ocrExtracting.set(true);
    this.activeOcrResult.set(null);

    try {
      const res = await this.ocrService.recognize(photo.dataUrl, 'spa', {
        enhanceContrast: true
      });
      this.activeOcrResult.set(res);
      this.presentToast(`¡OCR: ${res.wordsCount} palabras extraídas!`, 'success');
    } catch {
      this.presentToast('No se pudo extraer el texto de la foto', 'danger');
    } finally {
      this.ocrExtracting.set(false);
    }
  }

  async copyExtractedOcrText(): Promise<void> {
    const res = this.activeOcrResult();
    if (!res) return;
    await this.ocrService.copyToClipboard(res.text);
    this.presentToast('📋 ¡Texto copiado al portapapeles!', 'success');
  }

  saveOcrPhotoAsTxt(): void {
    const res = this.activeOcrResult();
    if (!res || !res.text.trim()) return;
    const title = `${this.pdfTitle() || 'Scan'}_OCR`;
    this.ocrService.saveAsTxtFile(res.text, title, this.selectedTag()).subscribe({
      next: file => {
        this.presentToast(`Archivo ${file.name} guardado en el repositorio`, 'success');
      }
    });
  }

  closeOcrModal(): void {
    this.activeOcrPhotoId.set(null);
    this.activeOcrResult.set(null);
  }

  generatePdf(): void {
    this.nativeService.triggerHapticImpact('medium');
    if (this.photos().length === 0) {
      this.presentToast('Capturá al menos una foto primero', 'danger');
      return;
    }

    this.generating.set(true);
    this.fileService
      .createPdfFromPhotos({
        title: this.pdfTitle() || 'Escaneo_Camara',
        tag: this.selectedTag(),
        pageSize: this.pageSize(),
        orientation: this.orientation(),
        margin: 20,
        photos: this.photos().map(p => ({ dataUrl: p.dataUrl, rotation: p.rotation }))
      })
      .subscribe({
        next: async created => {
          await this.nativeService.saveFileToDevice(
            created.name,
            created.dataUrl || '',
            'application/pdf'
          );
          await this.nativeService.triggerHapticSuccess();
          this.generating.set(false);
          this.lastCreatedPdf.set(created);
          this.photos.set([]);
          this.presentToast(
            `¡PDF "${created.name}" guardado en @capacitor/filesystem y Preferences!`,
            'success'
          );
        },
        error: () => {
          this.generating.set(false);
          this.presentToast('No se pudo generar el PDF', 'danger');
        }
      });
  }

  async shareLastPdf(): Promise<void> {
    const pdf = this.lastCreatedPdf();
    if (!pdf) return;
    const res = await this.nativeService.shareManagedFile(pdf);
    await this.presentToast(res.message, 'success');
  }

  shareLastPdfWhatsApp(): void {
    const pdf = this.lastCreatedPdf();
    if (!pdf) return;
    const res = this.nativeService.shareViaWhatsApp(pdf);
    this.presentToast(res.message, 'success');
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
