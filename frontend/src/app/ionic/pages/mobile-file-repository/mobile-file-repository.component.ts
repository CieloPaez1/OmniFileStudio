import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  ToastController,
  AlertController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonList,
  IonItemSliding,
  IonItem,
  IonItemOptions,
  IonItemOption,
  IonLabel,
  IonChip,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonText
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  listOutline,
  gridOutline,
  archiveOutline,
  trashOutline,
  swapHorizontalOutline,
  downloadOutline,
  addOutline,
  cloudUploadOutline,
  pricetagOutline,
  shareSocialOutline,
  logoWhatsapp,
  saveOutline,
  flashOutline,
  eyeOutline,
  documentTextOutline,
  documentOutline,
  imageOutline,
  statsChartOutline,
  closeOutline,
  moonOutline,
  sunnyOutline,
  createOutline
} from 'ionicons/icons';
import { FileManagerService } from '../../../services/file-manager.service';
import { CapacitorNativeService } from '../../../services/capacitor-native.service';
import { ThemeService } from '../../../services/theme.service';
import { ManagedFile, FileTagType, FILE_TAGS } from '../../../models/managed-file.model';
import { ContextualQuickActionsComponent } from '../../components/contextual-quick-actions/contextual-quick-actions.component';
import { FilePreviewModalComponent } from '../../components/file-preview-modal/file-preview-modal.component';

// =============================================================================
// [OMNIFILE STUDIO - TAB 2: REPOSITORIO + BADGES SEMÁNTICOS + SELECTOR FLOTANTE]
// - Tarjetas redondeadas (rounded-2xl) sin bordes grises marcados
// - Badges e iconos estilizados: Rojo PDF, Azul Imagen, Verde CSV/Datos, Índigo Doc
// - Selector flotante minimalista de formatos (píldoras táctiles)
// - ABM Completo: Alta (Upload/FAB), Baja (Confirmación + FS), Modificación (Modal + Full Form)
// =============================================================================
@Component({
  selector: 'app-mobile-file-repository',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonList,
    IonItemSliding,
    IonItem,
    IonItemOptions,
    IonItemOption,
    IonLabel,
    IonChip,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
    IonModal,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonText,
    ContextualQuickActionsComponent,
    FilePreviewModalComponent
  ],
  templateUrl: './mobile-file-repository.component.html',
  styleUrls: ['./mobile-file-repository.component.css']
})
export class MobileFileRepositoryComponent implements OnInit {
  readonly fileService = inject(FileManagerService);
  readonly nativeService = inject(CapacitorNativeService);
  readonly themeService = inject(ThemeService);
  private readonly toastCtrl = inject(ToastController);
  private readonly alertCtrl = inject(AlertController);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  viewMode = signal<'list' | 'grid'>('list');
  searchQuery = signal<string>('');
  selectedTag = signal<string>('Todas');

  // Panel flotante para cambiar de formato un archivo seleccionado
  convertingFile = signal<ManagedFile | null>(null);
  targetFormat = signal<string>('pdf');

  // Archivo activo para el menú de Acciones Rápidas Contextuales (UX/UI Bottom Sheet)
  quickActionFile = signal<ManagedFile | null>(null);
  quickActionsOpen = signal<boolean>(false);

  // Archivo activo para el Visor / Vista Previa Multiformato
  previewFile = signal<ManagedFile | null>(null);
  previewOpen = signal<boolean>(false);

  // Estado del Modal de Modificación / Edición de Archivo (ABM)
  editingFile = signal<ManagedFile | null>(null);
  isEditModalOpen = signal<boolean>(false);
  readonly editTags: FileTagType[] = FILE_TAGS;

  readonly editForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    tag: ['Trabajo', [Validators.required]],
    description: ['', [Validators.maxLength(250)]]
  });

  readonly tags = [
    'Todas',
    'Trabajo',
    'Estudio',
    'Facturas',
    'Personal',
    'Legal',
    'Urgente',
    'Archivados'
  ];

  readonly filteredFiles = computed(() => {
    const tag = this.selectedTag();
    const q = this.searchQuery().toLowerCase().trim();
    return this.fileService.files().filter(f => {
      if (tag === 'Archivados') {
        if (!f.archived) return false;
      } else {
        if (f.archived) return false;
        if (tag !== 'Todas' && (f.tag || 'Trabajo') !== tag) return false;
      }
      if (
        q &&
        !f.name.toLowerCase().includes(q) &&
        !f.ext.toLowerCase().includes(q) &&
        !(f.description || '').toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  });

  constructor() {
    addIcons({
      searchOutline,
      listOutline,
      gridOutline,
      archiveOutline,
      trashOutline,
      swapHorizontalOutline,
      downloadOutline,
      addOutline,
      cloudUploadOutline,
      pricetagOutline,
      shareSocialOutline,
      logoWhatsapp,
      saveOutline,
      flashOutline,
      eyeOutline,
      documentTextOutline,
      documentOutline,
      imageOutline,
      statsChartOutline,
      closeOutline,
      moonOutline,
      sunnyOutline
    });
  }

  /**
   * [MEJORA UX #3] Distintivo visual de color semántico según formato:
   * - Rojo suave para PDF (.fmt-pdf)
   * - Azul suave para Imágenes PNG/JPG/WEBP (.fmt-image)
   * - Verde suave para Hojas de cálculo / Datos CSV/JSON (.fmt-data)
   * - Índigo suave para Documentos de texto (.fmt-doc)
   */
  getFormatBadgeClass(ext: string, category?: string): string {
    const clean = (ext || '').toLowerCase();
    if (clean === 'pdf' || category === 'pdf') return 'fmt-pdf';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(clean) || category === 'image') {
      return 'fmt-image';
    }
    if (['csv', 'xls', 'xlsx', 'json'].includes(clean) || category === 'data') {
      return 'fmt-data';
    }
    return 'fmt-doc';
  }

  getFormatIcon(ext: string, category?: string): string {
    const badgeClass = this.getFormatBadgeClass(ext, category);
    if (badgeClass === 'fmt-pdf') return 'document-text-outline';
    if (badgeClass === 'fmt-image') return 'image-outline';
    if (badgeClass === 'fmt-data') return 'stats-chart-outline';
    return 'document-outline';
  }

  openPreview(file: ManagedFile, slidingItem?: IonItemSliding): void {
    if (slidingItem) slidingItem.close();
    this.nativeService.triggerHapticImpact('light');
    this.previewFile.set(file);
    this.previewOpen.set(true);
  }

  closePreview(): void {
    this.previewOpen.set(false);
  }

  openActionsFromPreview(file: ManagedFile): void {
    this.previewOpen.set(false);
    setTimeout(() => {
      this.openContextualActions(file);
    }, 180);
  }

  openContextualActions(file: ManagedFile): void {
    this.quickActionFile.set(file);
    this.quickActionsOpen.set(true);
  }

  closeContextualActions(): void {
    this.quickActionsOpen.set(false);
  }

  ngOnInit(): void {
    if (this.fileService.files().length === 0) {
      this.fileService.getAll().subscribe();
    }
  }

  handleRefresh(event: any): void {
    this.fileService.getAll().subscribe({
      next: () => event.target.complete(),
      error: () => event.target.complete()
    });
  }

  onSearchInput(event: any): void {
    this.searchQuery.set(event?.detail?.value || '');
  }

  toggleViewMode(): void {
    this.viewMode.update(m => (m === 'list' ? 'grid' : 'list'));
  }

  onDirectUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const tag =
      this.selectedTag() !== 'Todas' && this.selectedTag() !== 'Archivados'
        ? (this.selectedTag() as any)
        : undefined;
    this.fileService.upload(input.files, tag, true).subscribe({
      next: list =>
        this.presentToast(
          `¡${list.length} archivo(s) auto-clasificados y guardados localmente!`,
          'success'
        )
    });
    input.value = '';
  }

  // [REQUISITO 6] Acciones al deslizar un ion-item-sliding
  async archiveFromSliding(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    this.fileService.toggleArchive(file).subscribe({
      next: updated => {
        this.presentToast(
          updated.archived ? `"${file.name}" archivado` : `"${file.name}" restaurado`,
          'dark'
        );
      }
    });
  }

  // ===========================================================================
  // [ABM - MODIFICACIÓN] MODAL DE EDICIÓN RÁPIDA DE METADATOS
  // ===========================================================================
  async openEditModal(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    this.nativeService.triggerHapticImpact('light');
    this.editingFile.set(file);
    this.editForm.patchValue({
      name: file.name,
      tag: file.tag || 'Trabajo',
      description: file.description || ''
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingFile.set(null);
  }

  saveFileChanges(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const current = this.editingFile();
    if (!current) return;

    const { name, tag, description } = this.editForm.value;
    const cleanName = (name || '').trim();
    const finalName = this.fileService.ensureExtension(cleanName, current.ext);

    this.fileService
      .updateFile(current.id, {
        name: finalName,
        tag: tag as FileTagType,
        description: description || ''
      })
      .subscribe({
        next: async updated => {
          this.nativeService.triggerHapticImpact('medium');
          this.closeEditModal();
          await this.presentToast(
            `Archivo "${updated.name}" actualizado con éxito`,
            'success'
          );
        },
        error: async () => {
          await this.presentToast('No se pudieron guardar las modificaciones', 'danger');
        }
      });
  }

  editInFullForm(file: ManagedFile): void {
    this.closeEditModal();
    this.router.navigate(['/mobile/file-form'], {
      queryParams: { id: file.id }
    });
  }

  // ===========================================================================
  // [ABM - BAJA] ELIMINACIÓN CON DIÁLOGO DE CONFIRMACIÓN
  // ===========================================================================
  async confirmDelete(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    this.nativeService.triggerHapticImpact('medium');

    const alert = await this.alertCtrl.create({
      header: '¿Eliminar archivo?',
      subHeader: file.name,
      message:
        'Esta acción eliminará el archivo permanentemente del repositorio y del almacenamiento del dispositivo. ¿Deseas continuar?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            this.nativeService.triggerHapticImpact('light');
          }
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.executeDelete(file);
          }
        }
      ]
    });

    await alert.present();
  }

  private async executeDelete(file: ManagedFile): Promise<void> {
    await this.nativeService.deleteFileFromDevice(file.name);
    this.fileService.delete(file.id).subscribe({
      next: () => {
        this.nativeService.triggerHapticImpact('heavy');
        this.presentToast(`"${file.name}" eliminado del repositorio`, 'danger');
      },
      error: () => {
        this.presentToast(`Error al intentar eliminar "${file.name}"`, 'danger');
      }
    });
  }

  async deleteFromSliding(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    return this.confirmDelete(file, slidingItem);
  }

  // [CAPACITOR 8 + WEB SHARE API] Compartir archivo nativamente o por canales digitales
  async shareFileNatively(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    await this.nativeService.presentShareOptions(file);
  }

  async shareFileViaWhatsApp(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    const res = this.nativeService.shareViaWhatsApp(file);
    await this.presentToast(res.message, 'success');
  }

  // [@capacitor/filesystem] Guardar explícitamente en almacenamiento interno del dispositivo
  async saveToDeviceStorage(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    await this.nativeService.downloadFileToDevice(file);
  }

  async downloadFile(file: ManagedFile, event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    await this.nativeService.downloadFileToDevice(file);
  }

  async openQuickConvert(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    this.convertingFile.set(file);
    if (file.availableTargets.length > 0) {
      this.targetFormat.set(file.availableTargets[0]);
    }
  }

  confirmQuickConvert(): void {
    const src = this.convertingFile();
    if (!src) return;
    this.fileService
      .convert({
        fileId: src.id,
        targetFormat: this.targetFormat(),
        tag: src.tag
      })
      .subscribe({
        next: async created => {
          this.convertingFile.set(null);
          await this.nativeService.saveFileToDevice(
            created.name,
            created.dataUrl || '',
            created.mimeType
          );
          this.presentToast(
            `¡Convertido localmente a ${created.name} (.${created.ext.toUpperCase()})!`,
            'success'
          );
        }
      });
  }

  goToReactiveForm(): void {
    this.router.navigate(['/mobile/file-form']);
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
