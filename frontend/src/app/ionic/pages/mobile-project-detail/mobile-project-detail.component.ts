import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

// =============================================================================
// [IONIC 9 - DETALLE DE PROYECTO MÓVIL CON TAREAS, SWIPE, ARCHIVOS Y COMPARTIR]
// Vista 100% móvil en Ionic 9 que reemplaza al detalle de escritorio cuando
// el usuario entra a un proyecto desde el celular (/mobile/projects/:id).
// =============================================================================
import {
  AlertController,
  ModalController,
  ToastController,
  createAnimation,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonCheckbox,
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  add,
  addOutline,
  createOutline,
  trashOutline,
  calendarOutline,
  timeOutline,
  checkboxOutline,
  cloudOfflineOutline,
  checkmarkCircleOutline,
  shareSocialOutline,
  documentAttachOutline,
  cloudUploadOutline,
  downloadOutline,
  documentTextOutline,
  documentOutline,
  gridOutline,
  easelOutline,
  imageOutline,
  attachOutline
} from 'ionicons/icons';

import { ProjectService } from '../../../services/project.service';
import { TaskService } from '../../../services/task.service';
import { IonicStorageService } from '../../services/ionic-storage.service';
import { Project } from '../../../models/project.model';
import { Task } from '../../../models/task.model';
import { MobileTaskDetailModalComponent } from '../../components/mobile-task-detail-modal/mobile-task-detail-modal.component';

export interface ProjectAttachment {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'excel' | 'powerpoint' | 'word' | 'image' | 'other';
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
}

@Component({
  selector: 'app-mobile-project-detail',
  standalone: true,
  imports: [
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonCheckbox,
    IonFab,
    IonFabButton,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonText
  ],
  templateUrl: './mobile-project-detail.component.html',
  styleUrls: ['./mobile-project-detail.component.css']
})
export class MobileProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private storage = inject(IonicStorageService);
  private alertCtrl = inject(AlertController);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  projectId = signal<number>(0);
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  statusFilter = signal<string>('ALL');
  attachments = signal<ProjectAttachment[]>([]);

  filteredTasks = computed(() => {
    const f = this.statusFilter();
    if (f === 'ALL') return this.tasks();
    return this.tasks().filter(t => t.status === f);
  });

  totalTasks = computed(() => this.tasks().length);
  completedTasks = computed(() => this.tasks().filter(t => t.status === 'DONE').length);
  totalHours = computed(() => this.tasks().reduce((acc, t) => acc + (t.estimateHours || 0), 0));

  progressPercentage = computed(() => {
    const total = this.totalTasks();
    if (total === 0) return 0;
    return Math.round((this.completedTasks() / total) * 100);
  });

  constructor() {
    addIcons({
      add,
      addOutline,
      createOutline,
      trashOutline,
      calendarOutline,
      timeOutline,
      checkboxOutline,
      cloudOfflineOutline,
      checkmarkCircleOutline,
      shareSocialOutline,
      documentAttachOutline,
      cloudUploadOutline,
      downloadOutline,
      documentTextOutline,
      documentOutline,
      gridOutline,
      easelOutline,
      imageOutline,
      attachOutline
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.projectId.set(id);
        this.cargarDetalle();
        this.cargarArchivos(id);
      }
    });
  }

  // ===========================================================================
  // GESTIÓN DE ARCHIVOS ADJUNTOS (PDF, EXCEL, PPTX, ETC.)
  // ===========================================================================
  private getStorageKey(id: number): string {
    return `project_attachments_${id}`;
  }

  async cargarArchivos(id: number): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.getStorageKey(id) });
      if (value) {
        this.attachments.set(JSON.parse(value));
      } else {
        this.attachments.set([]);
      }
    } catch {
      this.attachments.set([]);
    }
  }

  triggerFileInput(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  async onFileSelected(event: any): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target?.files?.[0];
    if (!file) return;

    // Validación de tamaño (máx 8 MB para almacenamiento local fluido)
    if (file.size > 8 * 1024 * 1024) {
      const alert = await this.alertCtrl.create({
        header: 'Archivo muy pesado',
        message: 'El archivo no puede superar los 8 MB para un guardado rápido en el dispositivo.',
        buttons: ['Entendido']
      });
      await alert.present();
      target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const fileType = this.detectFileType(file.name, file.type);
      const newAtt: ProjectAttachment = {
        id: Date.now().toString(),
        name: file.name,
        size: this.formatBytes(file.size),
        type: fileType,
        mimeType: file.type || 'application/octet-stream',
        dataUrl,
        uploadedAt: new Date().toLocaleDateString('es-AR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      const updated = [newAtt, ...this.attachments()];
      this.attachments.set(updated);
      await Preferences.set({
        key: this.getStorageKey(this.projectId()),
        value: JSON.stringify(updated)
      });

      const toast = await this.toastCtrl.create({
        message: `"${file.name}" adjuntado al proyecto con éxito.`,
        duration: 2500,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
      target.value = '';
    };

    reader.readAsDataURL(file);
  }

  abrirArchivo(att: ProjectAttachment): void {
    try {
      const link = document.createElement('a');
      link.href = att.dataUrl;
      link.download = att.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(att.dataUrl, '_blank');
    }
  }

  async eliminarArchivo(att: ProjectAttachment, event?: Event): Promise<void> {
    if (event) event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: '¿Eliminar archivo?',
      message: `Se quitará "${att.name}" de los documentos de este proyecto.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            const updated = this.attachments().filter(item => item.id !== att.id);
            this.attachments.set(updated);
            await Preferences.set({
              key: this.getStorageKey(this.projectId()),
              value: JSON.stringify(updated)
            });
            const toast = await this.toastCtrl.create({
              message: 'Archivo eliminado',
              duration: 2000,
              position: 'bottom'
            });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }

  private detectFileType(fileName: string, mimeType: string): ProjectAttachment['type'] {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf' || mimeType.includes('pdf')) return 'pdf';
    if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
    if (['ppt', 'pptx'].includes(ext) || mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'powerpoint';
    if (['doc', 'docx'].includes(ext) || mimeType.includes('word') || mimeType.includes('document')) return 'word';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext) || mimeType.startsWith('image/')) return 'image';
    return 'other';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // ===========================================================================
  // COMPARTIR RESUMEN DEL PROYECTO (Web Share API / Portapapeles)
  // ===========================================================================
  async compartirProyecto(): Promise<void> {
    const p = this.project();
    if (!p) return;

    const statusLabel =
      p.status === 'ACTIVE'
        ? 'En Progreso'
        : p.status === 'PLANNED'
        ? 'Planificado'
        : 'Cerrado';

    let msg = `*Planix - Resumen de Proyecto*\n`;
    msg += `• Proyecto: ${p.name}\n`;
    if (p.description) msg += `• Descripción: ${p.description}\n`;
    msg += `• Progreso: ${this.progressPercentage()}% (${this.completedTasks()}/${this.totalTasks()} tareas hechas)\n`;
    msg += `• Estimación Total: ${this.totalHours()} hs\n`;
    if (p.startDate && p.endDate) {
      msg += `• Período: ${p.startDate.split('T')[0]} al ${p.endDate.split('T')[0]}\n`;
    }
    msg += `• Estado: ${statusLabel}\n`;
    if (this.attachments().length > 0) {
      msg += `• Archivos Adjuntos: ${this.attachments().length} documento(s)\n`;
    }
    msg += `\nCompartido desde Planix Móvil`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Proyecto: ${p.name}`,
          text: msg
        });
        return;
      } catch {
        // Fallback al portapapeles si canceló o falló
      }
    }

    try {
      await navigator.clipboard.writeText(msg);
      const toast = await this.toastCtrl.create({
        message: 'Resumen del proyecto copiado al portapapeles',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
    } catch {
      // Ignorar si clipboard no está disponible
    }
  }

  async cargarDetalle(event?: any): Promise<void> {
    const id = this.projectId();
    if (!id) return;

    if (!event) {
      this.loading.set(true);
    }
    this.error.set(null);

    const cachedProjects = await this.storage.loadProjects();
    const cachedTasks = await this.storage.loadTasks();

    if (await this.storage.isOnline()) {
      forkJoin({
        project: this.projectService.getById(id),
        tasks: this.taskService.getByProject(id)
      }).pipe(
        catchError(() => {
          this.error.set('Modo Offline: mostrando datos del proyecto desde caché local.');
          return of(null);
        }),
        finalize(() => {
          this.loading.set(false);
          if (event) {
            (event.target as HTMLIonRefresherElement).complete();
          }
        })
      ).subscribe(async (res) => {
        if (res !== null) {
          this.project.set(res.project);
          const tasksWithProject = res.tasks.map(t => {
            const prev = cachedTasks.find(c => c.id === t.id || c.title === t.title);
            return {
              ...t,
              projectId: id,
              photo: t.photo ?? prev?.photo,
              photoPreview: t.photoPreview ?? prev?.photoPreview,
              lat: t.lat ?? prev?.lat,
              lng: t.lng ?? prev?.lng
            };
          });
          this.tasks.set(tasksWithProject);
        } else {
          this.project.set(cachedProjects.find(p => p.id === id) || null);
          this.tasks.set(cachedTasks.filter(t => t.projectId === id));
        }
      });
    } else {
      this.error.set('Sin conexión: proyecto cargado desde @capacitor/preferences.');
      this.project.set(cachedProjects.find(p => p.id === id) || null);
      this.tasks.set(cachedTasks.filter(t => t.projectId === id));
      this.loading.set(false);
      if (event) {
        (event.target as HTMLIonRefresherElement).complete();
      }
    }
  }

  onFilterChange(event: any): void {
    this.statusFilter.set(event.detail.value);
  }

  nuevaTareaEnProyecto(): void {
    this.router.navigate(['/mobile/task-form'], {
      queryParams: { projectId: this.projectId() }
    });
  }

  editarTarea(t: Task, event?: Event): void {
    if (event) event.stopPropagation();
    if (!t.id) return;
    this.router.navigate(['/mobile/task-form', this.projectId(), t.id]);
  }

  async abrirDetalleTarea(task: Task): Promise<void> {
    const enterAnimation = (baseEl: HTMLElement) => {
      const root = baseEl.shadowRoot!;
      const backdropEl = root.querySelector('ion-backdrop');
      const wrapperEl = root.querySelector('.modal-wrapper');

      const parentAnim = createAnimation()
        .addElement(baseEl)
        .easing('ease-out')
        .duration(300);

      if (backdropEl && wrapperEl) {
        const backdrop = createAnimation()
          .addElement(backdropEl)
          .fromTo('opacity', '0.01', 'var(--backdrop-opacity)');

        const wrapper = createAnimation()
          .addElement(wrapperEl)
          .keyframes([
            { offset: 0, opacity: '0', transform: 'translateY(100%)' },
            { offset: 1, opacity: '1', transform: 'translateY(0)' }
          ]);

        parentAnim.addAnimation([backdrop, wrapper]);
      }

      return parentAnim;
    };

    const modal = await this.modalCtrl.create({
      component: MobileTaskDetailModalComponent,
      componentProps: { task: { ...task, projectId: this.projectId() } },
      enterAnimation
    });
    await modal.present();
  }

  toggleCompletada(t: Task, event?: Event): void {
    if (event) event.stopPropagation();
    if (!t.id) return;

    const nuevoEstado = t.status === 'DONE' ? 'TODO' : 'DONE';
    const copia: Task = { ...t, status: nuevoEstado, projectId: this.projectId() };

    // Actualizamos la vista y el store central (así el Nivel/XP se sincroniza)
    this.tasks.update(ts => ts.map(item => item.id === t.id ? copia : item));
    this.storage.saveTasks(
      this.storage.tasks().map(item => item.id === t.id ? copia : item)
    );

    this.taskService.update(this.projectId(), t.id, copia).subscribe({
      error: () => {
        // Persistido localmente en Preferences (modo offline)
      }
    });
  }

  async eliminarTarea(t: Task, event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    if (!t.id) return;

    const alert = await this.alertCtrl.create({
      header: '¿Eliminar tarea?',
      message: `Se eliminará "${t.title}" de este proyecto.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.taskService.delete(this.projectId(), t.id!).subscribe({
              next: () => {
                this.tasks.update(ts => ts.filter(item => item.id !== t.id));
                this.storage.saveTasks(
                  this.storage.tasks().filter(item => item.id !== t.id)
                );
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
