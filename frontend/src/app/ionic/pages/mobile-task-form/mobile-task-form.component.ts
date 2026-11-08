import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// =============================================================================
// [IONIC 9 - CLASES 4, 8 Y 9: FORMULARIO REACTIVO + PLUGINS NATIVOS CAPACITOR]
// Soporta tanto Crear Tarea (/mobile/task-form o /mobile/task-form?projectId=X)
// como Editar Tarea (/mobile/task-form/:projectId/:taskId) sin salir de Ionic.
// =============================================================================
import {
  ActionSheetController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonToggle,
  IonButton,
  IonNote,
  IonIcon,
  IonSpinner,
  IonChip
} from '@ionic/angular';

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';

import { addIcons } from 'ionicons';
import {
  saveOutline,
  arrowBackOutline,
  cameraOutline,
  imageOutline,
  locationOutline,
  notificationsOutline,
  closeOutline
} from 'ionicons/icons';

import { TaskService } from '../../../services/task.service';
import { ProjectService } from '../../../services/project.service';
import { IonicStorageService } from '../../services/ionic-storage.service';
import { Project } from '../../../models/project.model';
import { Task } from '../../../models/task.model';

@Component({
  selector: 'app-mobile-task-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonToggle,
    IonButton,
    IonNote,
    IonIcon,
    IonSpinner,
    IonChip
  ],
  templateUrl: './mobile-task-form.component.html',
  styleUrls: ['./mobile-task-form.component.css']
})
export class MobileTaskFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private storageService = inject(IonicStorageService);
  private actionSheetCtrl = inject(ActionSheetController);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  projects = signal<Project[]>([]);
  saving = signal<boolean>(false);
  editTaskId = signal<number | null>(null);
  returnProjectId = signal<number | null>(null);

  // [CLASE 8] URL segura para previsualizar la foto en <img>
  photoUrl = signal<string | null>(null);
  // [CLASE 9] Estado informativo de ubicación y notificación
  locationStatus = signal<string | null>(null);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    projectId: [1, [Validators.required]],
    assignee: [''],
    estimateHours: [2, [Validators.required, Validators.min(1)]],
    dueDate: [new Date(Date.now() + 60_000).toISOString(), Validators.required],
    priority: ['media', Validators.required],
    done: [false],
    photo: [''],
    lat: [null as number | null],
    lng: [null as number | null]
  });

  constructor() {
    addIcons({
      saveOutline,
      arrowBackOutline,
      cameraOutline,
      imageOutline,
      locationOutline,
      notificationsOutline,
      closeOutline
    });
  }

  ngOnInit(): void {
    const paramProjectId = this.route.snapshot.paramMap.get('projectId');
    const paramTaskId = this.route.snapshot.paramMap.get('taskId');
    const queryProjectId = this.route.snapshot.queryParamMap.get('projectId');

    const preselectedProjectId = paramProjectId
      ? Number(paramProjectId)
      : (queryProjectId ? Number(queryProjectId) : null);

    if (preselectedProjectId) {
      this.returnProjectId.set(preselectedProjectId);
      this.form.patchValue({ projectId: preselectedProjectId });
    }

    if (paramProjectId && paramTaskId) {
      const pId = Number(paramProjectId);
      const tId = Number(paramTaskId);
      this.editTaskId.set(tId);
      this.taskService.getById(pId, tId).subscribe({
        next: (t) => {
          this.form.patchValue({
            title: t.title,
            projectId: pId,
            assignee: t.assignee || '',
            estimateHours: t.estimateHours || 1,
            dueDate: t.dueDate || new Date().toISOString(),
            priority: t.priority || 'media',
            done: t.status === 'DONE'
          });
        }
      });
    }

    this.projectService.getAll().subscribe({
      next: (projs) => {
        this.projects.set(projs);
        if (!preselectedProjectId && projs.length > 0 && projs[0].id) {
          this.form.patchValue({ projectId: projs[0].id });
        }
      },
      error: async () => {
        const cached = await this.storageService.loadProjects();
        this.projects.set(cached);
      }
    });
  }

  get title() {
    return this.form.controls.title;
  }

  get estimateHours() {
    return this.form.controls.estimateHours;
  }

  async elegirOrigenFoto(): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Adjuntar foto a la tarea',
      buttons: [
        {
          text: 'Tomar foto con la Cámara',
          icon: 'camera-outline',
          handler: () => {
            this.takePhoto(CameraSource.Camera);
          }
        },
        {
          text: 'Elegir desde la Galería',
          icon: 'image-outline',
          handler: () => {
            this.takePhoto(CameraSource.Photos);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });
    await sheet.present();
  }

  async takePhoto(source: CameraSource = CameraSource.Camera): Promise<void> {
    try {
      let dataUrl: string | null = null;
      let base64Data: string | undefined;

      try {
        const photo = await Camera.getPhoto({
          resultType: CameraResultType.DataUrl,
          source,
          quality: 80
        });
        dataUrl = photo.dataUrl || null;
        base64Data = photo.base64String;
      } catch (cameraErr: any) {
        if (!Capacitor.isNativePlatform()) {
          dataUrl = await this.abrirSelectorArchivoWeb();
        } else {
          throw cameraErr;
        }
      }

      if (!dataUrl) return;

      const fileName = `task-${Date.now()}.jpeg`;
      if (Capacitor.isNativePlatform()) {
        try {
          const cleanBase64 = base64Data || dataUrl.split(',')[1] || '';
          if (cleanBase64) {
            await Filesystem.writeFile({
              path: fileName,
              data: cleanBase64,
              directory: Directory.Data
            });
            const savedFile = await Filesystem.getUri({
              path: fileName,
              directory: Directory.Data
            });
            this.photoUrl.set(Capacitor.convertFileSrc(savedFile.uri));
          }
        } catch {
          this.photoUrl.set(dataUrl);
        }
      } else {
        this.photoUrl.set(dataUrl);
      }

      this.form.patchValue({ photo: fileName });
    } catch {
      // Cancelado por el usuario
    }
  }

  private abrirSelectorArchivoWeb(): Promise<string | null> {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }

  async guardarUbicacion(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        const permiso = await Geolocation.requestPermissions();
        if (permiso.location !== 'granted') {
          this.locationStatus.set('Permiso de ubicación denegado por el usuario.');
          return;
        }
      }

      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
      const lat = Number(pos.coords.latitude.toFixed(5));
      const lng = Number(pos.coords.longitude.toFixed(5));
      this.form.patchValue({ lat, lng });
      this.locationStatus.set(`Ubicación registrada: ${lat}, ${lng}`);
    } catch {
      this.locationStatus.set('No se pudo obtener el GPS (verificá permisos o ubicación simulada).');
    }
  }

  async programarNotificacion(task: Task): Promise<void> {
    try {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return;

      const rawDate = task.dueDate ? new Date(task.dueDate).getTime() : Date.now() + 60_000;
      const targetTime = rawDate > Date.now() ? new Date(rawDate) : new Date(Date.now() + 60_000);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: task.id ?? Math.floor(Date.now() % 2147483647),
            title: 'Tarea próxima a vencer',
            body: task.title,
            schedule: { at: targetTime }
          }
        ]
      });
    } catch {
      // Sin soporte nativo en navegador web
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const val = this.form.getRawValue();
    const projectId = Number(val.projectId) || 1;
    const dueDateStr = val.dueDate ? val.dueDate.split('T')[0] : undefined;

    const nuevaTarea: Task = {
      title: val.title || '',
      assignee: val.assignee || 'Sin asignar',
      estimateHours: Number(val.estimateHours) || 1,
      status: val.done ? 'DONE' : 'TODO',
      dueDate: dueDateStr,
      priority: (val.priority as 'baja' | 'media' | 'alta') || 'media',
      photo: val.photo || undefined,
      photoPreview: this.photoUrl() || undefined,
      lat: val.lat ?? undefined,
      lng: val.lng ?? undefined,
      projectId
    };

    const targetRoute = this.returnProjectId()
      ? [`/mobile/projects/${this.returnProjectId()}`]
      : ['/mobile/tasks'];

    const taskId = this.editTaskId();
    const request$ = taskId
      ? this.taskService.update(projectId, taskId, nuevaTarea)
      : this.taskService.create(projectId, nuevaTarea);

    request$.subscribe({
      next: async (creada) => {
        const tareaFinal: Task = {
          ...nuevaTarea,
          ...creada,
          photo: nuevaTarea.photo,
          photoPreview: nuevaTarea.photoPreview,
          lat: nuevaTarea.lat,
          lng: nuevaTarea.lng
        };
        const actuales = await this.storageService.loadTasks();
        const filtradas = actuales.filter(t => t.id !== tareaFinal.id);
        filtradas.unshift(tareaFinal);
        await this.storageService.saveTasks(filtradas);

        await this.programarNotificacion(tareaFinal);

        this.saving.set(false);
        this.router.navigate(targetRoute);
      },
      error: async () => {
        const tareaOffline: Task = { ...nuevaTarea, id: taskId ?? Math.floor(Date.now() % 1000000) };
        const actuales = await this.storageService.loadTasks();
        const filtradas = actuales.filter(t => t.id !== tareaOffline.id);
        filtradas.unshift(tareaOffline);
        await this.storageService.saveTasks(filtradas);
        await this.programarNotificacion(tareaOffline);

        this.saving.set(false);
        this.router.navigate(targetRoute);
      }
    });
  }
}
