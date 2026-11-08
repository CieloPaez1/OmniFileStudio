import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

// =============================================================================
// [IONIC 9 - CLASES 2, 3, 5, 6, 9 Y 10: LISTADO DE TAREAS E INTERACCIONES AVANZADAS]
// Marco Teórico de Cátedra:
// - Clase 2: Importación selectiva de IonCheckbox, IonBadge, IonFab, IonFabButton.
// - Clase 3: IonMenuButton en slot="start" del toolbar para desplegar el ion-menu.
// - Clase 5: Ciclo de vida de petición con 3 estados de UI (tasks, loading, error)
//   y operadores RxJS catchError + finalize.
// - Clase 6: Estrategia Network-First con @capacitor/preferences y @capacitor/network.
// - Clase 9 (Desafío Opcional): Al marcar una tarea como completada ('DONE'),
//   cancelamos su notificación local programada con LocalNotifications.cancel().
// - Clase 10 (Gestos, Refresher, Modal y Animations API):
//   * ion-item-sliding envuelve cada ion-item y expone ion-item-options al deslizar.
//   * ion-refresher dispara doRefresh($event) y exige llamar a
//     (event.target as HTMLIonRefresherElement).complete() para apagar el spinner.
//   * AlertController pide confirmación bloqueante (role: 'destructive') antes de borrar.
//   * ModalController + createAnimation() abre el detalle de la tarea animando
//     transform y opacity a 60fps en el compositor del navegador a través de
//     baseEl.shadowRoot (ion-backdrop y .modal-wrapper).
// =============================================================================
import {
  AlertController,
  ModalController,
  createAnimation,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonCheckbox,
  IonIcon,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonBadge,
  IonFab,
  IonFabButton,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular';

import { LocalNotifications } from '@capacitor/local-notifications';

import { addIcons } from 'ionicons';
import {
  add,
  addOutline,
  trashOutline,
  checkmarkOutline,
  checkboxOutline,
  cloudOfflineOutline,
  cameraOutline,
  locationOutline
} from 'ionicons/icons';

import { TaskService } from '../../../services/task.service';
import { IonicStorageService } from '../../services/ionic-storage.service';
import { Task } from '../../../models/task.model';
import { MobileTaskDetailModalComponent } from '../../components/mobile-task-detail-modal/mobile-task-detail-modal.component';

@Component({
  selector: 'app-mobile-tasks',
  standalone: true,
  imports: [
    RouterModule,
    // [CLASE 2, 3, 5 y 10] Componentes standalone de Ionic
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonCheckbox,
    IonIcon,
    IonButton,
    IonButtons,
    IonMenuButton,
    IonBadge,
    IonFab,
    IonFabButton,
    IonSpinner,
    IonText,
    IonRefresher,
    IonRefresherContent
  ],
  templateUrl: './mobile-tasks.component.html',
  styleUrls: ['./mobile-tasks.component.css']
})
export class MobileTasksComponent implements OnInit {
  private taskService = inject(TaskService);
  readonly storage = inject(IonicStorageService);
  private alertCtrl = inject(AlertController);
  private modalCtrl = inject(ModalController);

  // [CLASE 5] Los 3 estados de la UI modelados con Signals
  // Leídos directamente del store central para sincronización inmediata
  tasks = this.storage.tasks;
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  statusFilter = signal<string>('ALL');
  priorityFilter = signal<'ALL' | 'ALTA' | 'MEDIA' | 'BAJA' | 'TODAY'>('ALL');

  // Contadores para los chips de filtro
  highPriorityCount = computed(() =>
    this.tasks().filter(t => (t.priority || '').toLowerCase() === 'alta').length
  );
  medPriorityCount = computed(() =>
    this.tasks().filter(t => (t.priority || '').toLowerCase() === 'media').length
  );
  lowPriorityCount = computed(() =>
    this.tasks().filter(t => (t.priority || '').toLowerCase() === 'baja').length
  );
  dueTodayCount = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.tasks().filter(t => !!t.dueDate && t.dueDate.startsWith(today)).length;
  });

  // [SIGNALS] Filtrado reactivo combinado por estado + prioridad/vencimiento
  filteredTasks = computed(() => {
    let list = this.tasks();

    const status = this.statusFilter();
    if (status !== 'ALL') {
      list = list.filter(t => t.status === status);
    }

    const prio = this.priorityFilter();
    if (prio === 'ALTA') {
      list = list.filter(t => (t.priority || '').toLowerCase() === 'alta');
    } else if (prio === 'MEDIA') {
      list = list.filter(t => (t.priority || '').toLowerCase() === 'media');
    } else if (prio === 'BAJA') {
      list = list.filter(t => (t.priority || '').toLowerCase() === 'baja');
    } else if (prio === 'TODAY') {
      const today = new Date().toISOString().split('T')[0];
      list = list.filter(t => !!t.dueDate && t.dueDate.startsWith(today));
    }

    return list;
  });

  setPriorityFilter(filter: 'ALL' | 'ALTA' | 'MEDIA' | 'BAJA' | 'TODAY'): void {
    this.priorityFilter.set(filter);
  }

  constructor() {
    // [CLASE 2] Registro selectivo de íconos con addIcons (tree-shaking)
    addIcons({
      add,
      addOutline,
      trashOutline,
      checkmarkOutline,
      checkboxOutline,
      cloudOfflineOutline,
      cameraOutline,
      locationOutline
    });
  }

  ngOnInit(): void {
    this.cargarTareas();
  }

  // ===========================================================================
  // [CLASE 10 - EJERCICIO GUIADO] PULL-TO-REFRESH CON ION-REFRESHER
  // Es obligatorio invocar complete() en el HTMLIonRefresherElement al terminar.
  // ===========================================================================
  doRefresh(event: CustomEvent): void {
    this.cargarTareas(event);
  }

  // ===========================================================================
  // [CLASES 5 Y 6 - EJERCICIO 17 Y 20] COMBINAR SERVICIO REMOTO Y CACHÉ LOCAL
  // ===========================================================================
  async cargarTareas(event?: any): Promise<void> {
    if (!event) {
      this.loading.set(true);
    }
    this.error.set(null);

    const cachedLocal = await this.storage.loadTasks();

    if (await this.storage.isOnline()) {
      this.taskService.getAll().pipe(
        catchError(() => {
          this.error.set('Modo Offline: Mostrando últimas tareas guardadas en el dispositivo.');
          return of(null);
        }),
        finalize(() => {
          this.loading.set(false);
          if (event) {
            (event.target as HTMLIonRefresherElement).complete();
          }
        })
      ).subscribe(async (remoteTasks) => {
        if (remoteTasks !== null) {
          // Preservamos metadatos nativos locales (photo, lat, lng) si existen en caché
          const merged = remoteTasks.map(rt => {
            const prev = cachedLocal.find(c => c.id === rt.id || c.title === rt.title);
            return prev
              ? { ...rt, photo: rt.photo ?? prev.photo, photoPreview: rt.photoPreview ?? prev.photoPreview, lat: rt.lat ?? prev.lat, lng: rt.lng ?? prev.lng }
              : rt;
          });
          this.tasks.set(merged);
          await this.storage.saveTasks(merged);
        } else {
          this.tasks.set(cachedLocal);
        }
      });
    } else {
      this.error.set('Sin conexión a internet: mostrando tareas desde @capacitor/preferences.');
      this.tasks.set(cachedLocal);
      this.loading.set(false);
      if (event) {
        (event.target as HTMLIonRefresherElement).complete();
      }
    }
  }

  onFilterChange(event: any): void {
    this.statusFilter.set(event.detail.value);
  }

  // ===========================================================================
  // [CLASE 10 - EJERCICIO GUIADO] MODAL DE DETALLE CON ANIMATIONS API (SHADOW DOM)
  // Animación acelerada por hardware (transform y opacity a 60fps) sobre
  // ion-backdrop y .modal-wrapper dentro del baseEl.shadowRoot.
  // ===========================================================================
  async abrirDetalle(task: Task): Promise<void> {
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
      componentProps: { task },
      enterAnimation
    });
    await modal.present();
  }

  // ===========================================================================
  // [CLASE 9 (DESAFÍO OPCIONAL) Y CLASE 10] COMPLETAR TAREA + CANCELAR NOTIFICACIÓN
  // ===========================================================================
  async toggleCompletada(t: Task, event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    if (!t.id || !t.projectId) return;

    const nuevoEstado = t.status === 'DONE' ? 'TODO' : 'DONE';
    const copia: Task = { ...t, status: nuevoEstado };

    // [CLASE 9 - DESAFÍO OPCIONAL] Si se marca como completada, cancelamos su notificación local
    if (nuevoEstado === 'DONE' && t.id) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: t.id }] });
      } catch {
        // Ignorar si se ejecuta en navegador sin soporte nativo
      }
    }

    this.taskService.update(t.projectId, t.id, copia).subscribe({
      next: async () => {
        this.tasks.update(ts => ts.map(item => item.id === t.id ? copia : item));
        await this.storage.saveTasks(this.tasks());
      },
      error: async () => {
        this.tasks.update(ts => ts.map(item => item.id === t.id ? copia : item));
        await this.storage.saveTasks(this.tasks());
      }
    });
  }

  // ===========================================================================
  // [CLASE 10 - PRÁCTICA GUIADA EXTRA] SWIPE CON CONFIRMACIÓN (ALERTCONTROLLER)
  // ===========================================================================
  async eliminarTarea(t: Task, event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    if (!t.id || !t.projectId) return;

    const alert = await this.alertCtrl.create({
      header: '¿Eliminar tarea?',
      message: t.title,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.confirmarEliminar(t)
        }
      ]
    });
    await alert.present();
  }

  private confirmarEliminar(t: Task): void {
    if (!t.id || !t.projectId) return;
    this.taskService.delete(t.projectId, t.id).subscribe({
      next: async () => {
        this.tasks.update(ts => ts.filter(item => item.id !== t.id));
        await this.storage.saveTasks(this.tasks());
      },
      error: async () => {
        this.tasks.update(ts => ts.filter(item => item.id !== t.id));
        await this.storage.saveTasks(this.tasks());
      }
    });
  }
}
