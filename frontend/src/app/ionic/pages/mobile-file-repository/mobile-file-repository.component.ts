import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  ToastController,
  AlertController,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButton,
  IonIcon,
  IonItemSliding,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  optionsOutline,
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
  createOutline,
  folder,
  folderOutline,
  folderOpenOutline,
  star,
  starOutline,
  layersOutline,
  ellipsisVerticalOutline,
   ellipsisHorizontalOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  chevronDownOutline,
  arrowUpOutline,
  arrowDownOutline
} from 'ionicons/icons';
import { FileManagerService } from '../../../services/file-manager.service';
import { CapacitorNativeService } from '../../../services/capacitor-native.service';
import { ThemeService } from '../../../services/theme.service';
import { ManagedFile, FileTagType, FILE_TAGS } from '../../../models/managed-file.model';
import { ContextualQuickActionsComponent } from '../../components/contextual-quick-actions/contextual-quick-actions.component';
import { FilePreviewModalComponent } from '../../components/file-preview-modal/file-preview-modal.component';

export interface ExplorerFolderItem {
  id: string;
  name: string;
  category: 'PDF' | 'IMAGE' | 'DOC' | 'ALL';
  modified: string;
  custom?: boolean;
}

const CUSTOM_FOLDERS_KEY = 'omnifile_custom_folders_v1';

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
    IonContent,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonModal,
    IonSelect,
    IonSelectOption,
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
  selectedCategory = signal<'ALL' | 'PDF' | 'IMAGE' | 'DOC' | 'FAV' | 'TRASH'>('ALL');
  showTagsFilterBar = signal<boolean>(false);

  sortField = signal<'name' | 'date'>('date');
  sortAsc = signal<boolean>(true);

  selectedIds = signal<string[]>(['folder-docs']);
  manageTab = signal<'info' | 'edit' | 'share'>('info');

  customFolders = signal<ExplorerFolderItem[]>(this.loadCustomFolders());

  readonly folderItems = computed<ExplorerFolderItem[]>(() => {
    const base: ExplorerFolderItem[] = [
      { id: 'docs', name: 'Documentos', category: 'DOC', modified: 'Hoy, 14:32' },
      { id: 'images', name: 'Imágenes', category: 'IMAGE', modified: 'Hoy, 13:20' },
      { id: 'projects', name: 'Proyectos', category: 'PDF', modified: 'Ayer, 18:45' }
    ];
    const q = this.searchQuery().toLowerCase().trim();
    const all = [...base, ...this.customFolders()];
    if (!q) return all;
    return all.filter(f => f.name.toLowerCase().includes(q));
  });

  // Panel flotante para cambiar de formato un archivo seleccionado
  convertingFile = signal<ManagedFile | null>(null);
  targetFormat = signal<string>('pdf');

  // Archivo activo para el menú de Acciones Rápidas Contextuales (UX/UI Bottom Sheet)
  quickActionFile = signal<ManagedFile | null>(null);
  quickActionsOpen = signal<boolean>(false);

  // Archivo activo para el Visor / Vista Previa Multiformato
  previewFile = signal<ManagedFile | null>(null);
  previewOpen = signal<boolean>(false);

  // Estado del Modal "Gestionar Archivo" (ABM)
  editingFile = signal<ManagedFile | null>(null);
  editingFolder = signal<ExplorerFolderItem | null>(null);
  isEditModalOpen = signal<boolean>(false);
  readonly editTags: FileTagType[] = FILE_TAGS;

  readonly editForm: FormGroup = this.fb.group({
    name: ['Documentos', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    tag: ['Trabajo', [Validators.required]],
    description: ['/Archivos/Documentos', [Validators.maxLength(250)]]
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

  readonly archivedCount = computed(() => this.fileService.files().filter(f => f.archived).length);
  readonly docAndDataCount = computed(() =>
    this.fileService
      .activeFiles()
      .filter(f => f.ext !== 'pdf' && f.category !== 'PDF' && f.category !== 'IMAGE').length
  );

  readonly filteredFiles = computed(() => {
    const tag = this.selectedTag();
    const cat = this.selectedCategory();
    const q = this.searchQuery().toLowerCase().trim();
    let favIds: string[] = [];
    try {
      const raw = localStorage.getItem('omnifile_dashboard_favorites_v1');
      if (raw) favIds = JSON.parse(raw).map(String);
    } catch {}

    const list = this.fileService.files().filter(f => {
      if (tag === 'Archivados' || cat === 'TRASH') {
        if (!f.archived) return false;
      } else {
        if (f.archived) return false;
        if (tag !== 'Todas' && (f.tag || 'Trabajo') !== tag) return false;
      }

      if (cat === 'PDF' && f.ext.toLowerCase() !== 'pdf' && f.category !== 'PDF') return false;
      if (
        cat === 'IMAGE' &&
        !['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(f.ext.toLowerCase()) &&
        f.category !== 'IMAGE'
      ) {
        return false;
      }
      if (
        cat === 'DOC' &&
        (f.ext.toLowerCase() === 'pdf' ||
          f.category === 'PDF' ||
          f.category === 'IMAGE' ||
          ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(f.ext.toLowerCase()))
      ) {
        return false;
      }
      if (cat === 'FAV' && favIds.length > 0 && !favIds.includes(String(f.id))) {
        return false;
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

    const field = this.sortField();
    const asc = this.sortAsc();
    return [...list].sort((a, b) => {
      if (field === 'name') {
        return asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      return asc ? 0 : -1;
    });
  });

  readonly selectedCount = computed(() => this.selectedIds().length);

  constructor() {
    addIcons({
      searchOutline,
      optionsOutline,
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
      createOutline,
      folder,
      folderOutline,
      folderOpenOutline,
      star,
      starOutline,
      layersOutline,
      ellipsisVerticalOutline,
      ellipsisHorizontalOutline,
      checkmarkCircleOutline,
      checkmarkOutline,
      chevronDownOutline,
      arrowUpOutline,
      arrowDownOutline
    });
  }

  ngOnInit(): void {
    if (this.fileService.files().length === 0) {
      this.fileService.getAll().subscribe();
    }
  }

  selectCategoryFolder(cat: 'ALL' | 'PDF' | 'IMAGE' | 'DOC' | 'FAV' | 'TRASH'): void {
    this.nativeService.triggerHapticImpact('light');
    if (this.selectedCategory() === cat && cat !== 'ALL') {
      this.selectedCategory.set('ALL');
      this.selectedTag.set('Todas');
      return;
    }
    this.selectedCategory.set(cat);
    if (cat === 'TRASH') {
      this.selectedTag.set('Archivados');
    } else if (this.selectedTag() === 'Archivados') {
      this.selectedTag.set('Todas');
    }
  }

  isSelected(id: string | number): boolean {
    return this.selectedIds().includes(String(id));
  }

  toggleSelection(id: string | number, event?: Event): void {
    event?.stopPropagation();
    const key = String(id);
    this.nativeService.triggerHapticImpact('light');
    this.selectedIds.update(curr =>
      curr.includes(key) ? curr.filter(x => x !== key) : [...curr, key]
    );
  }

  toggleSelectAll(): void {
    this.nativeService.triggerHapticImpact('light');
    const allFolderIds = this.folderItems().map(f => 'folder-' + f.id);
    const allFileIds = this.filteredFiles().map(f => String(f.id));
    const totalIds = [...allFolderIds, ...allFileIds];
    if (this.selectedIds().length === totalIds.length && totalIds.length > 0) {
      this.selectedIds.set([]);
    } else {
      this.selectedIds.set(totalIds);
    }
  }

  toggleSort(field: 'name' | 'date'): void {
    if (this.sortField() === field) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(true);
    }
  }

  async promptNewFolder(): Promise<void> {
    this.nativeService.triggerHapticImpact('light');
    const alert = await this.alertCtrl.create({
      header: 'Nueva carpeta',
      inputs: [
        {
          name: 'folderName',
          type: 'text',
          placeholder: 'Ej: Contratos 2026'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: data => {
            const clean = (data?.folderName || '').trim();
            if (clean) {
              const created: ExplorerFolderItem = {
                id: 'custom-' + Date.now(),
                name: clean,
                category: 'ALL',
                modified: 'Ahora',
                custom: true
              };
              this.customFolders.update(list => {
                const next = [...list, created];
                try {
                  localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(next));
                } catch {}
                return next;
              });
              this.presentToast(`Carpeta "${clean}" creada`, 'success');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  openManageFolderModal(folderItem: ExplorerFolderItem, event?: Event): void {
    event?.stopPropagation();
    this.nativeService.triggerHapticImpact('light');
    this.selectedIds.set(['folder-' + folderItem.id]);
    this.editingFile.set(null);
    this.editingFolder.set(folderItem);
    this.manageTab.set('info');
    this.editForm.patchValue({
      name: folderItem.name,
      tag: 'Trabajo',
      description: '/Archivos/' + folderItem.name
    });
    this.isEditModalOpen.set(true);
  }

  deleteFolder(folderItem: ExplorerFolderItem, event?: Event): void {
    event?.stopPropagation();
    if (folderItem.custom) {
      this.customFolders.update(list => {
        const next = list.filter(x => x.id !== folderItem.id);
        try {
          localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      this.presentToast(`Carpeta "${folderItem.name}" eliminada`, 'danger');
    } else {
      this.selectCategoryFolder('ALL');
      this.presentToast(`Filtro de carpeta "${folderItem.name}" restablecido`, 'dark');
    }
  }

  formatModifiedDate(index: number): string {
    const dates = ['Ayer, 16:12', 'Ayer, 15:30', 'Vie, 20:17', 'Vie, 19:50', 'Jue, 11:05'];
    return dates[index % dates.length];
  }

  async downloadSelected(): Promise<void> {
    const ids = this.selectedIds();
    const firstFile = this.filteredFiles().find(f => ids.includes(String(f.id))) || this.filteredFiles()[0];
    if (firstFile) {
      await this.downloadFile(firstFile);
    } else {
      await this.presentToast('Seleccioná al menos un archivo para descargar', 'dark');
    }
  }

  async deleteSelected(): Promise<void> {
    const ids = this.selectedIds();
    const firstFile = this.filteredFiles().find(f => ids.includes(String(f.id)));
    if (firstFile) {
      await this.confirmDelete(firstFile);
    } else {
      await this.presentToast('Seleccioná un archivo para eliminar', 'dark');
    }
  }

  getFormatBadgeClass(ext: string, category?: string): string {
    const clean = (ext || '').toLowerCase();
    const cat = (category || '').toLowerCase();
    if (clean === 'pdf' || cat === 'pdf') return 'fmt-pdf';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(clean) || cat === 'image') {
      return 'fmt-image';
    }
    if (['csv', 'xls', 'xlsx', 'json', 'zip', 'rar'].includes(clean) || cat === 'data') {
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

  handleRefresh(event: any): void {
    this.fileService.getAll().subscribe({
      next: () => event.target.complete(),
      error: () => event.target.complete()
    });
  }

  onSearchInput(event: any): void {
    const val = event?.detail?.value !== undefined ? event.detail.value : (event?.target?.value || '');
    this.searchQuery.set(val);
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

  async openEditModal(file: ManagedFile, slidingItem?: IonItemSliding, event?: Event): Promise<void> {
    event?.stopPropagation();
    if (slidingItem) await slidingItem.close();
    this.nativeService.triggerHapticImpact('light');
    this.selectedIds.set([String(file.id)]);
    this.editingFolder.set(null);
    this.editingFile.set(file);
    this.manageTab.set('info');
    this.editForm.patchValue({
      name: file.name,
      tag: file.tag || 'Trabajo',
      description: file.description || '/Archivos/Documentos'
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.editingFile.set(null);
    this.editingFolder.set(null);
  }

  saveFileChanges(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const folderTarget = this.editingFolder();
    if (folderTarget) {
      const cleanFolder = (this.editForm.value.name || '').trim();
      if (folderTarget.custom && cleanFolder) {
        this.customFolders.update(list => {
          const next = list.map(f => (f.id === folderTarget.id ? { ...f, name: cleanFolder } : f));
          try {
            localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });
      }
      this.closeEditModal();
      this.presentToast(`Carpeta "${cleanFolder}" actualizada`, 'success');
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

  async confirmDelete(file: ManagedFile, slidingItem?: IonItemSliding, event?: Event): Promise<void> {
    event?.stopPropagation();
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
            this.closeEditModal();
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

  async shareFileNatively(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    await this.nativeService.presentShareOptions(file);
  }

  async shareFileViaWhatsApp(file: ManagedFile, slidingItem?: IonItemSliding): Promise<void> {
    if (slidingItem) await slidingItem.close();
    const res = this.nativeService.shareViaWhatsApp(file);
    await this.presentToast(res.message, 'success');
  }

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

  private loadCustomFolders(): ExplorerFolderItem[] {
    try {
      const raw = localStorage.getItem(CUSTOM_FOLDERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'dark' = 'dark'
  ): Promise<void> {
    const t = await this.toastCtrl.create({
      message,
      duration: 2100,
      color,
      position: 'bottom'
    });
    await t.present();
  }
}
