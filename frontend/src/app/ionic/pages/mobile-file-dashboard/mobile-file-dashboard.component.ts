import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
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
  IonRefresher,
  IonRefresherContent,
  IonSpinner
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  folderOpenOutline,
  cameraOutline,
  constructOutline,
  addCircleOutline,
  documentTextOutline,
  documentOutline,
  imageOutline,
  statsChartOutline,
  cloudOfflineOutline,
  checkmarkCircleOutline,
  swapHorizontalOutline,
  gitMergeOutline,
  cutOutline,
  contractOutline,
  createOutline,
  downloadOutline,
  desktopOutline,
  eyeOutline,
  moonOutline,
  sunnyOutline,
  timeOutline,
  trashOutline,
  shareSocialOutline,
  archiveOutline
} from 'ionicons/icons';
import { FileManagerService } from '../../../services/file-manager.service';
import { ThemeService } from '../../../services/theme.service';
import { ActivityLogService } from '../../../services/activity-log.service';
import { CapacitorNativeService } from '../../../services/capacitor-native.service';
import { ManagedFile } from '../../../models/managed-file.model';
import { FilePreviewModalComponent } from '../../components/file-preview-modal/file-preview-modal.component';

// =============================================================================
// [OMNIFILE STUDIO - TAB 1: DASHBOARD + LOG DE ACTIVIDAD + DARK MODE + HAPTICS]
// - Toggle de Modo Oscuro Nativo en el Header (ThemeService)
// - Panel visual de Historial de Acciones / Auditoría Local (@capacitor/preferences)
// - Vista Previa Real en Modal (Quick Preview) al hacer clic en archivos
// =============================================================================
@Component({
  selector: 'app-mobile-file-dashboard',
  standalone: true,
  imports: [
    CommonModule,
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
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    FilePreviewModalComponent
  ],
  templateUrl: './mobile-file-dashboard.component.html',
  styleUrls: ['./mobile-file-dashboard.component.css']
})
export class MobileFileDashboardComponent implements OnInit {
  readonly fileService = inject(FileManagerService);
  readonly themeService = inject(ThemeService);
  readonly activityLog = inject(ActivityLogService);
  readonly nativeService = inject(CapacitorNativeService);
  private readonly router = inject(Router);

  readonly recentFiles = computed(() => this.fileService.activeFiles().slice(0, 4));
  readonly previewFile = signal<ManagedFile | null>(null);
  readonly previewOpen = signal<boolean>(false);

  constructor() {
    addIcons({
      folderOpenOutline,
      cameraOutline,
      constructOutline,
      addCircleOutline,
      documentTextOutline,
      documentOutline,
      imageOutline,
      statsChartOutline,
      cloudOfflineOutline,
      checkmarkCircleOutline,
      swapHorizontalOutline,
      gitMergeOutline,
      cutOutline,
      contractOutline,
      createOutline,
      downloadOutline,
      desktopOutline,
      eyeOutline,
      moonOutline,
      sunnyOutline,
      timeOutline,
      trashOutline,
      shareSocialOutline,
      archiveOutline
    });
  }

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

  openPreview(file: ManagedFile): void {
    this.nativeService.triggerHapticImpact('light');
    this.previewFile.set(file);
    this.previewOpen.set(true);
  }

  closePreview(): void {
    this.previewOpen.set(false);
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

  goTo(route: string): void {
    this.nativeService.triggerHapticImpact('medium');
    this.router.navigate([route]);
  }
}
