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
  eyeOutline
} from 'ionicons/icons';
import { FileManagerService } from '../../../services/file-manager.service';
import { ThemeService } from '../../../services/theme.service';
import { ManagedFile } from '../../../models/managed-file.model';
import { FilePreviewModalComponent } from '../../components/file-preview-modal/file-preview-modal.component';

// =============================================================================
// [OMNIFILE STUDIO - TAB 1: HOME / DASHBOARD CON DISEÑO SLATE & INDIGO (#6366f1)]
// - Eliminación de cajas grises pesadas: tarjetas rounded-2xl (20px) + shadow-sm/md
// - Badges e Iconos de Archivo Estilizados por formato (Rojo PDF, Azul Imagen, Verde CSV)
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
      eyeOutline
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

  openPreview(file: ManagedFile): void {
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
    this.router.navigate([route]);
  }
}
