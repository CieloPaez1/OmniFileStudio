import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonMenuButton,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonNote,
  IonChip,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  ToastController
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  cameraOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  documentTextOutline,
  pricetagOutline,
  swapHorizontalOutline,
  arrowBackOutline,
  trashOutline,
  sparklesOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  flashOutline,
  refreshOutline
} from 'ionicons/icons';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FileManagerService } from '../../../services/file-manager.service';
import {
  ContextualFileAnalysis,
  FILE_TAGS,
  FileCategoryType,
  FileTagType
} from '../../../models/managed-file.model';

// =============================================================================
// [OMNIFILE STUDIO · FORMULARIO REACTIVO + DROPZONE + IA CONTEXTUAL LOCAL]
// 1. Motor de Inteligencia Contextual Local:
//    - Analiza nombre, extensión y contenido preliminar al arrastrar/subir un
//      archivo o al simular un escaneo (ej. "scan_2026_11_08_final.pdf").
//    - Sugiere y aplica etiqueta ("Facturas", "Trabajo", "Personal", "Urgente",
//      "Legal", "Estudio") y nombre normalizado ("Factura_2026-11-08.pdf").
//    - Muestra la Tarjeta de Previsualización Inteligente antes de guardar.
// 2. Procesamiento 100% Local (Privacy-First Client-Side):
//    - Ejecuta conversiones de imagen/PDF en el cliente con HTML5 Canvas y jsPDF.
//    - Muestra el aviso de seguridad: "Tus archivos nunca abandonan tu dispositivo
//      ni se envían a servidores externos".
// =============================================================================
@Component({
  selector: 'app-mobile-file-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonMenuButton,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonNote,
    IonChip,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge
  ],
  templateUrl: './mobile-file-form.component.html',
  styleUrls: ['./mobile-file-form.component.css']
})
export class MobileFileFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  readonly fileService = inject(FileManagerService);

  readonly availableTags: FileTagType[] = FILE_TAGS;

  readonly selectedFile = signal<File | null>(null);
  readonly capturedPhotoPreview = signal<string | null>(null);
  readonly isDragging = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);

  // Estado de la Tarjeta de Previsualización Inteligente (Motor Contextual Local)
  readonly smartSuggestion = signal<ContextualFileAnalysis | null>(null);
  readonly suggestionApplied = signal<boolean>(false);

  // Formulario Reactivo con validaciones estrictas (Requisito 2 TP):
  // - name: obligatorio y longitud mínima de 3 caracteres
  // - tag: selección obligatoria de etiqueta/categoría
  // - targetFormat: formato de destino o mantener original
  // - description: opcional con máximo de 200 caracteres
  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    tag: ['', [Validators.required]],
    targetFormat: ['original', [Validators.required]],
    description: ['', [Validators.maxLength(200)]]
  });

  constructor() {
    addIcons({
      cloudUploadOutline,
      cameraOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      documentTextOutline,
      pricetagOutline,
      swapHorizontalOutline,
      arrowBackOutline,
      trashOutline,
      sparklesOutline,
      shieldCheckmarkOutline,
      lockClosedOutline,
      flashOutline,
      refreshOutline
    });
  }

  // Getters tipados para acceso limpio en la plantilla y en los tests unitarios
  get name() {
    return this.form.controls['name'];
  }

  get tag() {
    return this.form.controls['tag'];
  }

  get targetFormat() {
    return this.form.controls['targetFormat'];
  }

  get description() {
    return this.form.controls['description'];
  }

  // ===========================================================================
  // EVENTOS DE DRAG & DROP Y SELECCIÓN DE ARCHIVOS (PROCESAMIENTO LOCAL)
  // ===========================================================================
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await this.processIncomingFileLocally(files[0]);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    await this.processIncomingFileLocally(input.files[0]);
  }

  /**
   * Analiza el archivo de forma 100% local en el cliente, genera la Tarjeta de
   * Previsualización Inteligente y pre-rellena las sugerencias.
   */
  async processIncomingFileLocally(file: File): Promise<void> {
    this.selectedFile.set(file);
    const analysis = await this.fileService.analyzeFileLocally(file);
    this.smartSuggestion.set(analysis);
    this.applySmartSuggestion();
  }

  /**
   * Permite probar en un clic el motor contextual con un ejemplo real como
   * "scan_2026_11_08_final.pdf" -> "Factura_2026-11-08.pdf" ("Facturas").
   */
  async simulateSmartScanSample(
    rawSampleName = 'scan_2026_11_08_final.pdf',
    sampleContent = 'Comprobante de pago Factura A - Total IVA incluido - Vencimiento 2026-11-08'
  ): Promise<void> {
    const dummyBlob = new Blob([sampleContent], { type: 'application/pdf' });
    const sampleFile = new File([dummyBlob], rawSampleName, { type: 'application/pdf' });
    await this.processIncomingFileLocally(sampleFile);
    await this.presentToast(
      `Motor local analizó "${rawSampleName}" → "${this.smartSuggestion()?.suggestedFullName}"`,
      'success'
    );
  }

  /**
   * Analiza manualmente el nombre escrito por el usuario si aún no adjuntó archivo.
   */
  analyzeCurrentInputName(): void {
    const raw = (this.name.value || '').trim() || 'scan_2026_11_08_final.pdf';
    const analysis = this.fileService.analyzeMetadataSync(
      raw.includes('.') ? raw : `${raw}.pdf`,
      'application/pdf',
      this.description.value || ''
    );
    this.smartSuggestion.set(analysis);
    this.applySmartSuggestion();
  }

  /**
   * Aplica las sugerencias de la Tarjeta Inteligente al Formulario Reactivo.
   */
  applySmartSuggestion(): void {
    const suggestion = this.smartSuggestion();
    if (!suggestion) return;

    this.form.patchValue({
      name: suggestion.suggestedName,
      tag: suggestion.suggestedTag,
      targetFormat: suggestion.suggestedTargetFormat,
      description: suggestion.suggestedDescription
    });
    this.name.markAsTouched();
    this.tag.markAsTouched();
    this.suggestionApplied.set(true);
  }

  /**
   * Permite restaurar el nombre original sin normalizar si el usuario lo prefiere.
   */
  keepOriginalFileName(): void {
    const suggestion = this.smartSuggestion();
    if (!suggestion) return;

    const rawWithoutExt = suggestion.originalRawName.replace(/\.[^/.]+$/, '');
    this.form.patchValue({
      name: rawWithoutExt
    });
    this.suggestionApplied.set(false);
  }

  selectQuickTag(tagValue: FileTagType): void {
    this.form.patchValue({ tag: tagValue });
    this.tag.markAsTouched();
  }

  async capturePhotoForForm(): Promise<void> {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt
      });

      if (photo.dataUrl) {
        this.capturedPhotoPreview.set(photo.dataUrl);
        const res = await fetch(photo.dataUrl);
        const blob = await res.blob();
        const todayRaw = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
        const file = new File([blob], `scan_${todayRaw}_camara.jpg`, { type: 'image/jpeg' });
        await this.processIncomingFileLocally(file);
      }
    } catch {
      await this.presentToast('Captura cancelada', 'warning');
    }
  }

  clearAttachment(): void {
    this.selectedFile.set(null);
    this.capturedPhotoPreview.set(null);
    this.smartSuggestion.set(null);
    this.suggestionApplied.set(false);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.presentToast('Revisá los campos obligatorios del formulario', 'danger');
      return;
    }

    this.submitting.set(true);
    const { name, tag, targetFormat, description } = this.form.value;
    const attached = this.selectedFile();

    const ext = attached
      ? (attached.name.split('.').pop()?.toLowerCase() || 'pdf')
      : (targetFormat !== 'original' ? targetFormat : 'pdf');

    const finalExtension = targetFormat !== 'original' ? targetFormat : ext;
    const cleanName = (name || '').trim();
    const fullName = cleanName.toLowerCase().endsWith(`.${finalExtension}`)
      ? cleanName
      : `${cleanName}.${finalExtension}`;

    const category: FileCategoryType = this.fileService.getCategory(finalExtension);

    // Procesamiento 100% Client-Side si hay archivo adjunto
    let localDataUrl = '';
    let localSize = attached?.size || 245760;
    if (attached) {
      const processed = await this.fileService.processClientSideFileConversion(
        attached,
        finalExtension
      );
      localDataUrl = processed.dataUrl;
      localSize = processed.size || localSize;
    }

    this.fileService
      .createFileRecord({
        name: fullName,
        ext: finalExtension,
        category,
        mimeType: this.fileService.getMimeType(finalExtension),
        size: localSize,
        tag: tag as FileTagType,
        description:
          description ||
          `Procesado localmente (Privacy-First) · Categoría ${tag}`,
        origin: targetFormat !== 'original' ? 'CONVERTED' : 'UPLOADED',
        dataUrl: localDataUrl,
        archived: false
      })
      .subscribe({
        next: async created => {
          this.submitting.set(false);
          await this.presentToast(
            `Archivo "${created.name}" guardado localmente en ${tag}`,
            'success'
          );
          this.form.reset({ name: '', tag: '', targetFormat: 'original', description: '' });
          this.clearAttachment();
          this.router.navigate(['/mobile/repository']);
        },
        error: async () => {
          this.submitting.set(false);
          await this.presentToast('No se pudo registrar el archivo', 'danger');
        }
      });
  }

  private async presentToast(
    message: string,
    color: 'success' | 'warning' | 'danger'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2400,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
