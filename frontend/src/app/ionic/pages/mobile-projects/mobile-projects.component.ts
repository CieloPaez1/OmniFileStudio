import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

// =============================================================================
// [IONIC 9 - CLASES 2, 3, 5, 6 Y 10] LISTADO DE PROYECTOS 100% MÓVIL
// =============================================================================
import {
  AlertController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonRefresher,
  IonRefresherContent,
  IonButtons,
  IonMenuButton,
  IonSpinner,
  IonText,
  IonFab,
  IonFabButton
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  add,
  addOutline,
  trashOutline,
  createOutline,
  folderOpenOutline,
  chevronForwardOutline,
  cloudOfflineOutline
} from 'ionicons/icons';

import { ProjectService } from '../../../services/project.service';
import { IonicStorageService } from '../../services/ionic-storage.service';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-mobile-projects',
  standalone: true,
  imports: [
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonRefresher,
    IonRefresherContent,
    IonButtons,
    IonMenuButton,
    IonSpinner,
    IonText,
    IonFab,
    IonFabButton
  ],
  templateUrl: './mobile-projects.component.html',
  styleUrls: ['./mobile-projects.component.css']
})
export class MobileProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  readonly storage = inject(IonicStorageService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  // [CLASE 5] Los 3 estados de la UI modelados con Signals
  projects = signal<Project[]>([]);
  searchTerm = signal<string>('');
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  filteredProjects = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.projects();
    return this.projects().filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term))
    );
  });

  constructor() {
    addIcons({
      add,
      addOutline,
      trashOutline,
      createOutline,
      folderOpenOutline,
      chevronForwardOutline,
      cloudOfflineOutline
    });
  }

  ngOnInit(): void {
    this.cargarProyectos();
  }

  // [CLASES 5 Y 6] Petición con catchError + finalize + persistencia en Preferences
  async cargarProyectos(event?: any): Promise<void> {
    if (!event) {
      this.loading.set(true);
    }
    this.error.set(null);

    if (await this.storage.isOnline()) {
      this.projectService.getAll().pipe(
        catchError(() => {
          this.error.set('Modo Offline: Mostrando proyectos guardados en @capacitor/preferences.');
          return of(null);
        }),
        finalize(() => {
          this.loading.set(false);
          if (event) event.target.complete();
        })
      ).subscribe(async (data) => {
        const cached = await this.storage.loadProjects();
        if (data !== null) {
          const merged = data.map(p => {
            const prev = cached.find(c => c.id === p.id || c.name === p.name);
            return prev ? { ...p, photo: p.photo ?? prev.photo, photoPreview: p.photoPreview ?? prev.photoPreview } : p;
          });
          this.projects.set(merged);
          await this.storage.saveProjects(merged);
        } else {
          this.projects.set(cached);
        }
      });
    } else {
      this.error.set('Sin conexión: proyectos recuperados desde almacenamiento nativo.');
      this.projects.set(await this.storage.loadProjects());
      this.loading.set(false);
      if (event) event.target.complete();
    }
  }

  onSearch(event: any): void {
    this.searchTerm.set(event.target.value || '');
  }

  abrirProyecto(p: Project): void {
    if (!p.id) return;
    this.router.navigate(['/mobile/projects', p.id]);
  }

  editarProyecto(p: Project, event: Event): void {
    event.stopPropagation();
    if (!p.id) return;
    this.router.navigate(['/mobile/project-form', p.id]);
  }

  // [CLASE 10] Confirmación con AlertController nativo de Ionic
  async eliminarProyecto(p: Project, event: Event): Promise<void> {
    event.stopPropagation();
    if (!p.id) return;

    const alert = await this.alertCtrl.create({
      header: '¿Eliminar proyecto?',
      message: `¿Querés eliminar el proyecto "${p.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.projectService.delete(p.id!).subscribe({
              next: async () => {
                this.projects.update(ps => ps.filter(proj => proj.id !== p.id));
                await this.storage.saveProjects(this.projects());
              },
              error: async (err: Error) => {
                const errAlert = await this.alertCtrl.create({
                  header: 'No se puede eliminar',
                  message: err.message || 'El proyecto tiene tareas asociadas. Eliminá primero sus tareas.',
                  buttons: ['Entendido']
                });
                await errAlert.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
}
