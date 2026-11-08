import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ModalController,
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonIcon,
  IonItem,
  IonLabel
} from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  createOutline,
  timeOutline,
  personOutline,
  calendarOutline,
  locationOutline,
  mapOutline,
  imageOutline,
  shareSocialOutline
} from 'ionicons/icons';
import { Task } from '../../../models/task.model';

@Component({
  selector: 'app-mobile-task-detail-modal',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonIcon,
    IonItem,
    IonLabel
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Detalle de Tarea</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()">
            <ion-icon slot="icon-only" name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (task) {
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>
              Tarea #{{ task.id || 'Local' }}
            </ion-card-subtitle>
            <ion-card-title>{{ task.title }}</ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <ion-item lines="full">
              <ion-icon name="person-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Responsable</h3>
                <p>{{ task.assignee || 'Sin asignar' }}</p>
              </ion-label>
            </ion-item>

            <ion-item lines="full">
              <ion-icon name="time-outline" slot="start" color="warning"></ion-icon>
              <ion-label>
                <h3>Estimación</h3>
                <p>{{ task.estimateHours }} horas</p>
              </ion-label>
              <ion-badge
                slot="end"
                [color]="task.status === 'DONE' ? 'success' : (task.status === 'IN_PROGRESS' ? 'primary' : 'warning')">
                {{ task.status === 'DONE' ? 'Completada' : (task.status === 'IN_PROGRESS' ? 'En Curso' : 'Pendiente') }}
              </ion-badge>
            </ion-item>

            @if (task.dueDate) {
              <ion-item lines="full">
                <ion-icon name="calendar-outline" slot="start" color="tertiary"></ion-icon>
                <ion-label>
                  <h3>Fecha de Vencimiento</h3>
                  <p>{{ task.dueDate }}</p>
                </ion-label>
              </ion-item>
            }

            <!-- [CLASE 8 - PRÁCTICA EXTRA] Reconstrucción de foto desde Directory.Data -->
            @if (photoUrl()) {
              <div style="margin-top: 14px; text-align: center;">
                <img
                  [src]="photoUrl()"
                  alt="Foto adjunta a la tarea"
                  style="width: 100%; max-height: 220px; object-fit: cover; border-radius: 12px;" />
                <p style="font-size: 0.78rem; margin-top: 4px; opacity: 0.75;">
                  Archivo nativo: {{ task.photo }}
                </p>
              </div>
            }

            <!-- [CLASE 9 - PRÁCTICA EXTRA] Coordenadas GPS y botón "Abrir en mapas" -->
            @if (task.lat !== undefined && task.lng !== undefined) {
              <ion-item lines="none" style="margin-top: 10px;">
                <ion-icon name="location-outline" slot="start" color="tertiary"></ion-icon>
                <ion-label>
                  <h3>Ubicación GPS</h3>
                  <p>{{ task.lat }}, {{ task.lng }}</p>
                </ion-label>
              </ion-item>
              <ion-button
                expand="block"
                fill="outline"
                color="tertiary"
                (click)="abrirEnMapas(task)">
                <ion-icon name="map-outline" slot="start"></ion-icon>
                Abrir en Mapas
              </ion-button>
            }
          </ion-card-content>
        </ion-card>

        <ion-button
          expand="block"
          fill="outline"
          color="success"
          (click)="agendarEnGoogleCalendar()"
          style="margin-bottom: 8px;">
          <ion-icon name="calendar-outline" slot="start"></ion-icon>
          Agendar en Google Calendar
        </ion-button>

        <ion-button
          expand="block"
          fill="outline"
          color="secondary"
          (click)="compartirTarea()"
          style="margin-bottom: 8px;">
          <ion-icon name="share-social-outline" slot="start"></ion-icon>
          Compartir Tarea
        </ion-button>

        @if (task.id && task.projectId) {
          <ion-button expand="block" fill="outline" color="primary" (click)="editarTarea()" style="margin-bottom: 8px;">
            <ion-icon name="create-outline" slot="start"></ion-icon>
            Editar Tarea en Móvil
          </ion-button>
        }

        <ion-button expand="block" color="primary" (click)="cerrar()">
          Cerrar Detalle
        </ion-button>
      }
    </ion-content>
  `
})
export class MobileTaskDetailModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  @Input() task!: Task;
  photoUrl = signal<string | null>(null);

  constructor() {
    addIcons({
      closeOutline,
      createOutline,
      timeOutline,
      personOutline,
      calendarOutline,
      locationOutline,
      mapOutline,
      imageOutline,
      shareSocialOutline
    });
  }

  ngOnInit(): void {
    if (this.task) {
      this.cargarFoto(this.task);
    }
  }

  async compartirTarea(): Promise<void> {
    if (!this.task) return;
    const t = this.task;
    const statusLabel =
      t.status === 'DONE'
        ? 'Completada'
        : t.status === 'IN_PROGRESS'
        ? 'En Curso'
        : 'Pendiente';

    let msg = `*Planix - Tarea*\n`;
    msg += `• Título: ${t.title}\n`;
    msg += `• Estado: ${statusLabel}\n`;
    msg += `• Responsable: ${t.assignee || 'Sin asignar'}\n`;
    msg += `• Estimación: ${t.estimateHours} hs\n`;
    if (t.dueDate) msg += `• Vence: ${t.dueDate}\n`;
    if (t.lat !== undefined && t.lng !== undefined) {
      msg += `• Ubicación GPS: https://www.google.com/maps?q=${t.lat},${t.lng}\n`;
    }
    msg += `\nCompartido desde Planix Móvil`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Tarea: ${t.title}`,
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
        message: 'Resumen de la tarea copiado al portapapeles',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
    } catch {
      // Ignorar si clipboard no está disponible
    }
  }

  agendarEnGoogleCalendar(): void {
    if (!this.task) return;
    const t = this.task;
    const title = encodeURIComponent(`Planix: ${t.title}`);
    let detailsText = `Tarea de Planix\n• Responsable: ${t.assignee || 'Sin asignar'}\n• Estimación: ${t.estimateHours} hs\n• Estado: ${t.status}`;
    if (t.lat !== undefined && t.lng !== undefined) {
      detailsText += `\n• Ubicación GPS: https://www.google.com/maps?q=${t.lat},${t.lng}`;
    }
    const details = encodeURIComponent(detailsText);

    let datesParam = '';
    if (t.dueDate) {
      const d = new Date(t.dueDate);
      if (!isNaN(d.getTime())) {
        const startIso = d.toISOString().replace(/-|:|\.\d\d\d/g, '');
        const endDate = new Date(d.getTime() + (t.estimateHours || 1) * 3600000);
        const endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '');
        datesParam = `&dates=${startIso}/${endIso}`;
      }
    }

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}${datesParam}`;
    window.open(url, '_system');
  }

  async cargarFoto(task: Task): Promise<void> {
    if (task.photoPreview) {
      this.photoUrl.set(task.photoPreview);
      return;
    }
    if (!task.photo) return;
    try {
      const uri = await Filesystem.getUri({
        path: task.photo,
        directory: Directory.Data
      });
      this.photoUrl.set(Capacitor.convertFileSrc(uri.uri));
    } catch {
      // Archivo no disponible en este entorno
    }
  }

  abrirEnMapas(task: Task): void {
    const url = `https://www.google.com/maps?q=${task.lat},${task.lng}`;
    window.open(url, '_system');
  }

  editarTarea(): void {
    this.modalCtrl.dismiss();
    if (this.task.projectId && this.task.id) {
      this.router.navigate(['/mobile/task-form', this.task.projectId, this.task.id]);
    }
  }

  cerrar(): void {
    this.modalCtrl.dismiss();
  }
}
