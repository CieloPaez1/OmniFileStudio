import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonModal,
  IonTitle,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  folder,
  folderOutline,
  folderOpenOutline,
  notificationsOutline,
  searchOutline,
  optionsOutline,
  documentTextOutline,
  documentOutline,
  imageOutline,
  layersOutline,
  flashOutline,
  scanOutline,
  swapHorizontalOutline,
  languageOutline,
  cloudUploadOutline,
  star,
  starOutline,
  addOutline,
  arrowForwardOutline,
  timeOutline,
  ellipsisVerticalOutline,
  closeOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  sunnyOutline,
  moonOutline
} from 'ionicons/icons';
import { FileManagerService } from '../../../services/file-manager.service';
import { ThemeService } from '../../../services/theme.service';
import { ActivityLogService } from '../../../services/activity-log.service';
import { AuthService } from '../../../services/auth.service';
import { CapacitorNativeService } from '../../../services/capacitor-native.service';
import { ManagedFile } from '../../../models/managed-file.model';
import { FilePreviewModalComponent } from '../../components/file-preview-modal/file-preview-modal.component';
import { ContextualQuickActionsComponent } from '../../components/contextual-quick-actions/contextual-quick-actions.component';

export interface QuickShortcutItem {
  id: string;
  label: string;
  icon: string;
  tone: 'red' | 'orange' | 'amber';
  route: string;
  queryParams?: Record<string, string>;
  enabled: boolean;
}

const SHORTCUTS_STORAGE_KEY = 'omnifile_dashboard_shortcuts_v1';
const FAVORITES_STORAGE_KEY = 'omnifile_dashboard_favorites_v1';

@Component({
  selector: 'app-mobile-file-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonModal,
    IonTitle,
    IonButtons,
    IonList,
    IonItem,
    IonLabel,
    IonCheckbox,
    FilePreviewModalComponent,
    ContextualQuickActionsComponent
  ],
  templateUrl: './mobile-file-dashboard.component.html',
  styleUrls: ['./mobile-file-dashboard.component.css']
})
export class MobileFileDashboardComponent implements OnInit {
  readonly fileService = inject(FileManagerService);
  readonly themeService = inject(ThemeService);
  readonly activityLog = inject(ActivityLogService);
  readonly authService = inject(AuthService);
  readonly nativeService = inject(CapacitorNativeService);
  private readonly router = inject(Router);

  readonly searchTerm = signal<string>('');
  readonly previewFile = signal<ManagedFile | null>(null);
  readonly previewOpen = signal<boolean>(false);
  readonly quickActionsFile = signal<ManagedFile | null>(null);
  readonly quickActionsOpen = signal<boolean>(false);

  readonly customizeOpen = signal<boolean>(false);
  readonly favoritesPickerOpen = signal<boolean>(false);
  readonly notificationsOpen = signal<boolean>(false);

  readonly batchProgress = signal<number>(68);
  readonly batchActiveCount = computed(() => Math.max(1, Math.min(3, this.fileService.pdfFiles().length)));

  readonly userName = computed(() => {
    const raw = this.authService.currentUser()?.name || 'Cielo';
    return raw.split(' ')[0];
  });

  readonly userInitials = computed(() => {
    const raw = (this.authService.currentUser()?.name || 'CP').trim();
    const parts = raw.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return raw.slice(0, 2).toUpperCase();
  });

  readonly otherFilesCount = computed(() => {
    const total = this.fileService.totalFiles();
    const pdfs = this.fileService.pdfFiles().length;
    const imgs = this.fileService.imageFiles().length;
    return Math.max(0, total - pdfs - imgs);
  });

  readonly shortcuts = signal<QuickShortcutItem[]>(this.loadShortcuts());
  readonly visibleShortcuts = computed(() => this.shortcuts().filter(s => s.enabled));

  readonly favoriteIds = signal<string[]>(this.loadFavoriteIds());

  readonly favoriteFiles = computed(() => {
    const all = this.fileService.activeFiles();
    const ids = this.favoriteIds();
    if (ids.length === 0) {
      return all.slice(0, 3);
    }
    const matched = all.filter(f => ids.includes(String(f.id)));
    return matched.length > 0 ? matched : all.slice(0, 3);
  });

  readonly recentFiles = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const all = this.fileService.activeFiles();
    if (!term) return all.slice(0, 5);
    return all
      .filter(f => f.name.toLowerCase().includes(term) || (f.ext || '').toLowerCase().includes(term))
      .slice(0, 5);
  });

  constructor() {
    addIcons({
      folder,
      folderOutline,
      folderOpenOutline,
      notificationsOutline,
      searchOutline,
      optionsOutline,
      documentTextOutline,
      documentOutline,
      imageOutline,
      layersOutline,
      flashOutline,
      scanOutline,
      swapHorizontalOutline,
      languageOutline,
      cloudUploadOutline,
      star,
      starOutline,
      addOutline,
      arrowForwardOutline,
      timeOutline,
      ellipsisVerticalOutline,
      closeOutline,
      checkmarkCircleOutline,
      chevronDownOutline,
      sunnyOutline,
      moonOutline
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

  onSearchSubmit(): void {
    this.nativeService.triggerHapticImpact('light');
    this.router.navigate(['/mobile/repository']);
  }

  goTo(route: string, queryParams?: Record<string, string>): void {
    this.nativeService.triggerHapticImpact('medium');
    if (queryParams) {
      this.router.navigate([route], { queryParams });
    } else {
      this.router.navigate([route]);
    }
  }

  openPreview(file: ManagedFile): void {
    this.nativeService.triggerHapticImpact('light');
    this.previewFile.set(file);
    this.previewOpen.set(true);
  }

  closePreview(): void {
    this.previewOpen.set(false);
  }

  openQuickActions(file: ManagedFile, ev?: Event): void {
    ev?.stopPropagation();
    this.nativeService.triggerHapticImpact('light');
    this.quickActionsFile.set(file);
    this.quickActionsOpen.set(true);
  }

  closeQuickActions(): void {
    this.quickActionsOpen.set(false);
  }

  downloadFile(file: ManagedFile): void {
    this.nativeService.downloadFileToDevice(file);
  }

  toggleShortcut(id: string): void {
    this.shortcuts.update(list => {
      const next = list.map(item => (item.id === id ? { ...item, enabled: !item.enabled } : item));
      try {
        localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  isFavorite(fileId: string | number): boolean {
    const idStr = String(fileId);
    const ids = this.favoriteIds();
    if (ids.length === 0) {
      return this.favoriteFiles().some(f => String(f.id) === idStr);
    }
    return ids.includes(idStr);
  }

  toggleFavorite(file: ManagedFile): void {
    const idStr = String(file.id);
    this.favoriteIds.update(curr => {
      const base = curr.length > 0 ? curr : this.favoriteFiles().map(f => String(f.id));
      const next = base.includes(idStr) ? base.filter(x => x !== idStr) : [...base, idStr];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  getFormatBadgeClass(ext: string, category?: string): string {
    const clean = (ext || '').toLowerCase();
    const cat = (category || '').toLowerCase();
    if (clean === 'pdf' || cat === 'pdf') return 'fmt-pdf';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(clean) || cat === 'image') {
      return 'fmt-image';
    }
    if (['csv', 'xls', 'xlsx', 'json'].includes(clean) || cat === 'data') {
      return 'fmt-data';
    }
    return 'fmt-doc';
  }

  getFormatIcon(ext: string, category?: string): string {
    const badgeClass = this.getFormatBadgeClass(ext, category);
    if (badgeClass === 'fmt-pdf') return 'document-text-outline';
    if (badgeClass === 'fmt-image') return 'image-outline';
    if (badgeClass === 'fmt-data') return 'layers-outline';
    return 'document-outline';
  }

  formatRelativeTime(index: number): string {
    const labels = ['Hace 2 min', 'Hace 5 min', 'Hace 12 min', 'Hace 28 min', 'Hace 1 h'];
    return labels[index] || 'Reciente';
  }

  private loadShortcuts(): QuickShortcutItem[] {
    const defaults: QuickShortcutItem[] = [
      { id: 'pdf-suite', label: 'Suite PDF', icon: 'document-text-outline', tone: 'red', route: '/mobile/pdf-suite', enabled: true },
      { id: 'scan', label: 'Escanear', icon: 'scan-outline', tone: 'orange', route: '/mobile/scanner', enabled: true },
      { id: 'convert', label: 'Convertir archivos', icon: 'swap-horizontal-outline', tone: 'orange', route: '/mobile/pdf-suite', queryParams: { tool: 'convert' }, enabled: true },
      { id: 'translate', label: 'Traductor', icon: 'language-outline', tone: 'orange', route: '/mobile/pdf-suite', queryParams: { tool: 'translate' }, enabled: true },
      { id: 'upload', label: 'Subir archivos', icon: 'cloud-upload-outline', tone: 'orange', route: '/mobile/file-form', enabled: true }
    ];
    try {
      const raw = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as QuickShortcutItem[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return defaults;
  }

  private loadFavoriteIds(): string[] {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch {}
    return [];
  }
}
