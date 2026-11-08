import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// =============================================================================
// [IONIC 9 - CLASES 4 Y 8: FORMULARIO REACTIVO DE PROYECTO + FOTO DE PERFIL/PORTADA]
// Permite crear o editar un proyecto e incluye captura de foto de perfil/portada
// del proyecto mediante @capacitor/camera y @capacitor/filesystem (Directory.Data).
// =============================================================================
import {
  ActionSheetController,
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonButton,
  IonNote,
  IonIcon,
  IonSpinner
} from '@ionic/angular';

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

import { addIcons } from 'ionicons';
import {
  saveOutline,
  briefcaseOutline,
  cameraOutline,
  imageOutline,
  closeOutline
} from 'ionicons/icons';

import { ProjectService } from '../../../services/project.service';
import { IonicStorageService } from '../../services/ionic-storage.service';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-mobile-project-form',
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
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonDatetime,
    IonButton,
    IonNote,
    IonIcon,
    IonSpinner
  ],
  templateUrl: './mobile-project-form.component.html',
  styleUrls: ['./mobile-project-form.component.css']
})
export class MobileProjectFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private storageService = inject(IonicStorageService);
  private actionSheetCtrl = inject(ActionSheetController);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  editId = signal<number | null>(null);
  saving = signal<boolean>(false);
  serverError = signal<string | null>(null);
  photoUrl = signal<string | null>(null);

  private todayIso = new Date().toISOString().split('T')[0];
  private nextMonthIso = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    status: ['ACTIVE' as 'PLANNED' | 'ACTIVE' | 'CLOSED', [Validators.required]],
    startDate: [this.todayIso, [Validators.required]],
    endDate: [this.nextMonthIso, [Validators.required]],
    photo: ['']
  });

  constructor() {
    addIcons({
      saveOutline,
      briefcaseOutline,
      cameraOutline,
      imageOutline,
      closeOutline
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.editId.set(id);
      this.cargarProyectoParaEditar(id);
    }
  }

  get name() {
    return this.form.controls.name;
  }

  private async cargarProyectoParaEditar(id: number): Promise<void> {
    const cached = await this.storageService.loadProjects();
    const cachedProj = cached.find(p => p.id === id);
    if (cachedProj?.photoPreview) {
      this.photoUrl.set(cachedProj.photoPreview);
    }

    this.projectService.getById(id).subscribe({
      next: (proj) => {
        this.form.patchValue({
          name: proj.name,
          description: proj.description || '',
          status: proj.status,
          startDate: proj.startDate ? proj.startDate.split('T')[0] : this.todayIso,
          endDate: proj.endDate ? proj.endDate.split('T')[0] : this.nextMonthIso,
          photo: cachedProj?.photo || ''
        });
      },
      error: () => {
        if (cachedProj) {
          this.form.patchValue({
            name: cachedProj.name,
            description: cachedProj.description || '',
            status: cachedProj.status,
            startDate: cachedProj.startDate ? cachedProj.startDate.split('T')[0] : this.todayIso,
            endDate: cachedProj.endDate ? cachedProj.endDate.split('T')[0] : this.nextMonthIso,
            photo: cachedProj.photo || ''
          });
        }
      }
    });
  }

  async elegirFotoProyecto(): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Foto de Perfil / Portada del Proyecto',
      buttons: [
        {
          text: 'Tomar foto con la Cámara',
          icon: 'camera-outline',
          handler: () => {
            this.takeProjectPhoto(CameraSource.Camera);
          }
        },
        {
          text: 'Elegir imagen de la Galería',
          icon: 'image-outline',
          handler: () => {
            this.takeProjectPhoto(CameraSource.Photos);
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

  private async takeProjectPhoto(source: CameraSource): Promise<void> {
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

      const fileName = `project-${Date.now()}.jpeg`;
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

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const startStr = (val.startDate || this.todayIso).split('T')[0];
    const endStr = (val.endDate || this.nextMonthIso).split('T')[0];

    if (endStr < startStr) {
      this.serverError.set('La fecha de finalización no puede ser anterior a la fecha de inicio.');
      return;
    }

    this.saving.set(true);
    this.serverError.set(null);

    const payload: Project = {
      id: (this.editId() ?? null) as any,
      name: (val.name || '').trim(),
      description: (val.description || '').trim(),
      status: (val.status as 'PLANNED' | 'ACTIVE' | 'CLOSED') || 'ACTIVE',
      startDate: startStr,
      endDate: endStr,
      photo: val.photo || undefined,
      photoPreview: this.photoUrl() || undefined
    };

    const id = this.editId();
    const request$ = id
      ? this.projectService.update(id, payload)
      : this.projectService.create(payload);

    request$.subscribe({
      next: async (saved) => {
        const proyectoConFoto: Project = {
          ...payload,
          ...saved,
          photo: payload.photo,
          photoPreview: payload.photoPreview
        };

        const actuales = await this.storageService.loadProjects();
        const filtrados = actuales.filter(p => p.id !== proyectoConFoto.id);
        filtrados.unshift(proyectoConFoto);
        await this.storageService.saveProjects(filtrados);

        const toast = await this.toastCtrl.create({
          message: id ? 'Proyecto actualizado con éxito' : 'Proyecto creado con éxito',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
        this.saving.set(false);
        this.router.navigate([id ? `/mobile/projects/${id}` : '/mobile/projects']);
      },
      error: async (err: Error) => {
        this.saving.set(false);
        this.serverError.set(err.message || 'No se pudo guardar el proyecto.');
      }
    });
  }
}
