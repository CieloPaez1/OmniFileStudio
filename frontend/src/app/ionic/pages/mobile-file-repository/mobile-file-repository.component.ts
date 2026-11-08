import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
  IonFabButton
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
  sunnyOutline
} from 'ionicons/icons';
import { FileManagerService } from '../../../services/file-manager.service';
import { CapacitorNativeService } from '../../../services/capacitor-native.service';
import { ThemeService } from '../../../services/theme.service';
import { ManagedFile } from '../../../models/managed-file.model';
import { ContextualQuickActionsComponent } from '../../components/contextual-quick-actions/contextual-quick-actions.component';
import { FilePreviewModalComponent } from '../../components/file-preview-modal/file-preview-modal.component';

// =============================================================================
// [OMNIFILE STUDIO - TAB 2: REPOSITORIO + BADGES SEMÁNTICOS + SELECTOR FLOTANTE]
// - Tarjetas redondeadas (rounded-2xl) sin bordes grises marcados
// - Badges e iconos estilizados: Rojo PDF, Azul Imagen, Verde CSV/Datos, Índigo Doc
// - Selector flotante minimalista de formatos (píldoras táctiles)
// =============================================================================
@Component({
  selector: 'app-mobile-file-repository',
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

  async deleteFromSliding(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    await this.nativeService.deleteFileFromDevice(file.name);
    this.fileService.delete(file.id).subscribe({
      next: () => this.presentToast(`"${file.name}" eliminado`, 'danger')
    });
  }

  // [CAPACITOR 8 + WEB SHARE API] Compartir archivo nativamente o por WhatsApp
  async shareFileNatively(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    const res = await this.nativeService.shareManagedFile(file);
    await this.presentToast(res.message, res.shared ? 'success' : 'dark');
  }

  async shareFileViaWhatsApp(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    const res = this.nativeService.shareViaWhatsApp(file);
    await this.presentToast(res.message, 'success');
  }

  // [@capacitor/filesystem] Guardar explícitamente en almacenamiento interno del dispositivo
  async saveToDeviceStorage(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    const saved = await this.nativeService.saveFileToDevice(
      file.name,
      file.dataUrl || file.downloadUrl || file.name,
      file.mimeType
    );
    await this.presentToast(`Guardado en dispositivo: ${saved.uri}`, 'success');
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
