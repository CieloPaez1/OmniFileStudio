import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

// =============================================================================
// [IONIC 9 - CLASES 2, 3, 6 Y 8: PERFIL INTERACTIVO CON SISTEMA DE NIVELES Y XP,
//  ESTADO DEL USUARIO, PROYECTOS DESTACADOS, RENDIMIENTO SEMANAL Y CÁMARA NATIVA]
// =============================================================================
import {
  ActionSheetController,
  AlertController,
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonIcon,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonToggle
} from '@ionic/angular';

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  mailOutline,
  shieldCheckmarkOutline,
  colorPaletteOutline,
  logOutOutline,
  sparklesOutline,
  moonOutline,
  cameraOutline,
  imageOutline,
  closeOutline,
  flash,
  radioButtonOn,
  time,
  checkmarkCircle,
  createOutline,
  shareSocialOutline,
  trophyOutline,
  checkmarkDoneOutline,
  folderOpenOutline,
  flameOutline,
  pieChartOutline,
  notificationsOutline,
  gitNetworkOutline,
  settingsOutline,
  chevronForwardOutline,
  logoSlack,
  calendarOutline,
  logoGithub,
  helpCircleOutline,
  addCircleOutline,
  starOutline
} from 'ionicons/icons';

import { AuthService, USER_STATUS_LIST, StatusMeta } from '../../../services/auth.service';
import { ThemeService, AppTheme } from '../../../services/theme.service';
import { ProjectService } from '../../../services/project.service';
import { TaskService } from '../../../services/task.service';
import { IonicStorageService } from '../../services/ionic-storage.service';
import { Project } from '../../../models/project.model';
import { Task } from '../../../models/task.model';
import { UserStatusType } from '../../../models/user.model';

export interface WeeklyBar {
  day: string;
  heightPercent: number;
  tasksCount: number;
  highlight?: boolean;
  dimmed?: boolean;
}

export interface IntegrationItem {
  id: string;
  name: string;
  icon: string;
  colorClass: string;
  connected: boolean;
  statusText: string;
  subtitle?: string;
  details?: {
    username?: string;
    avatarUrl?: string;
    publicRepos?: number;
    profileUrl?: string;
    lastSync?: string;
  };
}

export interface LevelRankTier {
  minLevel: number;
  maxLevel: number;
  title: string;
  badgeIcon: string;
  rewardText: string;
}


@Component({
  selector: 'app-mobile-profile',
  standalone: true,
  imports: [
    UpperCasePipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonIcon,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonToggle
  ],
  templateUrl: './mobile-profile.component.html',
  styleUrls: ['./mobile-profile.component.css']
})
export class MobileProfileComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private readonly projectService = inject(ProjectService);
  private readonly taskService = inject(TaskService);
  private readonly storageService = inject(IonicStorageService);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  private readonly router = inject(Router);

  isDarkMode = computed(() => this.themeService.isDark());
  avatarUrl = signal<string | null>(null);
  pushEnabled = signal<boolean>(true);

  // Datos reales de proyectos y tareas para KPIs, Nivel XP y Carrusel
  // (Compartidos con Inicio, Proyectos y Tareas a través de IonicStorageService)
  projects = this.storageService.projects;
  tasks = this.storageService.tasks;

  // Modales interactivos del perfil
  isEditModalOpen = signal<boolean>(false);
  isLevelModalOpen = signal<boolean>(false);
  isIntegrationsModalOpen = signal<boolean>(false);
  isSettingsModalOpen = signal<boolean>(false);

  // Campos de edición de perfil
  editName = signal<string>('');
  editRole = signal<string>('');
  editStatus = signal<UserStatusType>('focus');

  readonly statusOptions: StatusMeta[] = USER_STATUS_LIST;

  // ===========================================================================
  // SISTEMA DE NIVELES Y GAMIFICACIÓN (500 XP POR NIVEL)
  // Todo se lee del store central IonicStorageService, así Inicio, Proyectos,
  // Tareas y Perfil muestran SIEMPRE el mismo nivel y XP en tiempo real.
  // ===========================================================================
  readonly xpPerLevel = this.storageService.xpPerLevel;
  readonly rankTiers: LevelRankTier[] = this.storageService.rankTiers;

  xpFromProjects = this.storageService.xpFromProjects;
  xpFromCompletedTasks = this.storageService.xpFromCompletedTasks;
  xpFromPendingTasks = this.storageService.xpFromPendingTasks;
  xpFromClosedProjects = this.storageService.xpFromClosedProjects;
  xpFromPhotos = this.storageService.xpFromPhotos;
  totalXp = this.storageService.totalXp;
  currentLevel = this.storageService.currentLevel;
  nextLevelTargetXp = this.storageService.nextLevelTargetXp;
  xpPercentage = this.storageService.xpPercentage;
  xpRemaining = this.storageService.xpRemaining;
  currentRank = this.storageService.currentRank;

  // ===========================================================================
  // KPIs CALCULADOS REACTIVAMENTE CON SIGNALS (Inician en 0)
  // ===========================================================================
  completedTasksCount = computed(() => this.tasks().filter(t => t.status === 'DONE').length);
  activeProjectsCount = computed(() => this.projects().filter(p => p.status === 'ACTIVE').length);
  focusStreakDays = computed(() => (this.completedTasksCount() > 0 ? 1 : 0));

  efficiencyRate = computed(() => {
    const total = this.tasks().length;
    if (total === 0) return 0;
    const done = this.tasks().filter(t => t.status === 'DONE').length;
    return Math.round((done / total) * 100);
  });

  // Rendimiento Semanal (7 días)
  selectedDay = signal<string>('Jue');
  weeklyBars = signal<WeeklyBar[]>([
    { day: 'Lun', heightPercent: 40, tasksCount: 5 },
    { day: 'Mar', heightPercent: 65, tasksCount: 8 },
    { day: 'Mié', heightPercent: 50, tasksCount: 6 },
    { day: 'Jue', heightPercent: 90, tasksCount: 12, highlight: true },
    { day: 'Vie', heightPercent: 75, tasksCount: 9 },
    { day: 'Sáb', heightPercent: 30, tasksCount: 3, dimmed: true },
    { day: 'Dom', heightPercent: 20, tasksCount: 2, dimmed: true }
  ]);

  // Integraciones interactivas (Google Calendar y GitHub)
  integrations = signal<IntegrationItem[]>([
    {
      id: 'gcal',
      name: 'Google Calendar',
      icon: 'calendar-outline',
      colorClass: 'integ-blue',
      connected: true,
      statusText: 'Sincronizado',
      subtitle: 'Sincronización activa con Google Calendar'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: 'logo-github',
      colorClass: 'integ-dark',
      connected: false,
      statusText: 'Conectar',
      subtitle: 'Sin vincular'
    }
  ]);

  themes: { id: AppTheme; name: string }[] = [
    { id: 'light', name: 'Luz Minimal' },
    { id: 'dark', name: 'Oscuro Profundo' },
    { id: 'minimal', name: 'Editorial Blanco' },
    { id: 'cyberpunk', name: 'Cyberpunk Neón' },
    { id: 'ocean', name: 'Océano Cristal' },
    { id: 'sunset', name: 'Atardecer Dorado' },
    { id: 'forest', name: 'Bosque Esmeralda' },
    { id: 'crimson', name: 'Carmesí Nocturno' },
    { id: 'cute', name: 'Cute Kawaii' }
  ];

  constructor() {
    addIcons({
      personCircleOutline,
      mailOutline,
      shieldCheckmarkOutline,
      colorPaletteOutline,
      logOutOutline,
      sparklesOutline,
      moonOutline,
      cameraOutline,
      imageOutline,
      closeOutline,
      flash,
      radioButtonOn,
      time,
      checkmarkCircle,
      createOutline,
      shareSocialOutline,
      trophyOutline,
      checkmarkDoneOutline,
      folderOpenOutline,
      flameOutline,
      pieChartOutline,
      notificationsOutline,
      gitNetworkOutline,
      settingsOutline,
      chevronForwardOutline,
      logoSlack,
      calendarOutline,
      logoGithub,
      helpCircleOutline,
      addCircleOutline,
      starOutline
    });
  }

  async ngOnInit(): Promise<void> {
    const user = this.authService.currentUser();
    if (user?.avatarUrl) {
      this.avatarUrl.set(user.avatarUrl);
    } else if (user?.email) {
      const saved = await this.storageService.loadUserAvatar(user.email);
      if (saved) {
        this.avatarUrl.set(saved);
        this.authService.updateAvatar(saved);
      }
    }
    await this.cargarIntegraciones();
    await this.cargarMetricasReales();
  }

  private async cargarMetricasReales(): Promise<void> {
    if (await this.storageService.isOnline()) {
      forkJoin({
        projects: this.projectService.getAll(),
        tasks: this.taskService.getAll()
      }).pipe(
        catchError(() => of(null))
      ).subscribe(async (res) => {
        if (res) {
          // saveProjects/saveTasks actualizan el store central preservando fotos locales
          await this.storageService.saveProjects(res.projects);
          await this.storageService.saveTasks(res.tasks);
        } else {
          this.projects.set(await this.storageService.loadProjects());
          this.tasks.set(await this.storageService.loadTasks());
        }
      });
    } else {
      this.projects.set(await this.storageService.loadProjects());
      this.tasks.set(await this.storageService.loadTasks());
    }
  }

  // ===========================================================================
  // 1. ESTADO INTERACTIVO DEL USUARIO (En Foco / En Línea / En Reunión)
  // ===========================================================================
  async toggleUserStatus(event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    const next = this.authService.cycleUserStatus();
    await this.mostrarToast(`Estado cambiado a: ${next.text}`);
  }

  // ===========================================================================
  // 2. CÁMARA NATIVA (@capacitor/camera + @capacitor/filesystem)
  // ===========================================================================
  async cambiarFotoPerfil(): Promise<void> {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Foto de Perfil del Administrador',
      buttons: [
        {
          text: 'Tomar selfie con la Cámara',
          icon: 'camera-outline',
          handler: () => {
            this.capturarAvatar(CameraSource.Camera);
          }
        },
        {
          text: 'Elegir foto de la Galería',
          icon: 'image-outline',
          handler: () => {
            this.capturarAvatar(CameraSource.Photos);
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

  private async capturarAvatar(source: CameraSource): Promise<void> {
    try {
      let dataUrl: string | null = null;
      let base64Data: string | undefined;

      try {
        const photo = await Camera.getPhoto({
          resultType: CameraResultType.DataUrl,
          source,
          quality: 80,
          allowEditing: false
        });
        dataUrl = photo.dataUrl || null;
        base64Data = photo.base64String;
      } catch (cameraErr: any) {
        // Si falló por falta de webcam/PWA en navegador o error de hardware, fallback a input de archivo web
        if (!Capacitor.isNativePlatform()) {
          dataUrl = await this.abrirSelectorArchivoWeb();
        } else {
          throw cameraErr;
        }
      }

      if (!dataUrl) return;

      let displayUrl = dataUrl;

      // Persistencia en sistema de archivos sólo si es dispositivo nativo
      if (Capacitor.isNativePlatform()) {
        try {
          const fileName = `avatar-${Date.now()}.jpeg`;
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
            displayUrl = Capacitor.convertFileSrc(savedFile.uri);
          }
        } catch (fsErr) {
          console.warn('Filesystem fallback en nativo:', fsErr);
        }
      }

      this.avatarUrl.set(displayUrl);
      this.authService.updateAvatar(dataUrl);

      const email = this.authService.currentUser()?.email;
      if (email) {
        await this.storageService.saveUserAvatar(email, dataUrl);
      }
      this.storageService.registerAvatarPhotoCapture();
      await this.mostrarToast('¡Foto de perfil actualizada (+100 XP)!');
    } catch (err: any) {
      console.warn('Captura cancelada o error:', err);
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

  // ===========================================================================
  // 3. EDITAR PERFIL Y COMPARTIR PERFIL
  // ===========================================================================
  openEditModal(): void {
    const user = this.authService.currentUser();
    this.editName.set(user?.name || 'Administrador');
    this.editRole.set(user?.role || 'Gestor de Proyectos');
    this.editStatus.set(user?.status || 'focus');
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
  }

  async saveProfileChanges(): Promise<void> {
    const trimmedName = this.editName().trim();
    const trimmedRole = this.editRole().trim();
    if (!trimmedName) {
      await this.mostrarToast('El nombre no puede estar vacío');
      return;
    }

    this.authService.updateProfile({
      name: trimmedName,
      role: trimmedRole || 'Gestor de Proyectos',
      status: this.editStatus()
    });
    this.isEditModalOpen.set(false);
    await this.mostrarToast('¡Perfil actualizado con éxito!');
  }

  async shareProfile(): Promise<void> {
    const user = this.authService.currentUser();
    const statusText = this.authService.currentStatusMeta().text;
    const shareText = `${user?.name || 'Usuario'} (${user?.role || 'Admin'}) · Nivel ${this.currentLevel()} (${this.currentRank().title}) · Estado: ${statusText} · Planix`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
    } catch {
      // Fallback silencioso
    }
    await this.mostrarToast('Enlace de perfil copiado al portapapeles');
  }

  // ===========================================================================
  // 4. PROYECTOS DESTACADOS Y GRÁFICO SEMANAL
  // ===========================================================================
  getProjectProgress(projectId: number): number {
    const projectTasks = this.tasks().filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) {
      return projectId % 2 === 0 ? 75 : 45;
    }
    const done = projectTasks.filter(t => t.status === 'DONE').length;
    return Math.round((done / projectTasks.length) * 100);
  }

  irADetalleProyecto(projectId: number): void {
    this.router.navigate(['/mobile/projects', projectId]);
  }

  async seleccionarDiaSemanal(bar: WeeklyBar): Promise<void> {
    this.selectedDay.set(bar.day);
    this.weeklyBars.update(list =>
      list.map(item => ({
        ...item,
        highlight: item.day === bar.day
      }))
    );
    await this.mostrarToast(`${bar.day}: ${bar.tasksCount} tareas completadas (${bar.heightPercent}% eficiencia)`);
  }

  // ===========================================================================
  // 5. PREFERENCIAS, INTEGRACIONES Y CONFIGURACIÓN
  // ===========================================================================
  async toggleDarkMode(event: CustomEvent): Promise<void> {
    const checked = (event as any).detail.checked;
    this.themeService.setTheme(checked ? 'dark' : 'light');
    await this.mostrarToast(checked ? 'Modo Oscuro activado' : 'Modo Claro activado');
  }

  async onThemeChange(event: any): Promise<void> {
    const selected = event.detail.value as AppTheme;
    this.themeService.setTheme(selected);
    const found = this.themes.find(t => t.id === selected);
    if (found) {
      await this.mostrarToast(`Tema cambiado a: ${found.name}`);
    }
  }

  async togglePushNotifications(event: CustomEvent): Promise<void> {
    const checked = (event as any).detail.checked;
    this.pushEnabled.set(checked);
    await this.mostrarToast(checked ? 'Notificaciones Push activadas' : 'Notificaciones Push silenciadas');
  }

  // ===========================================================================
  // INTEGRACIONES FUNCIONALES (Google Calendar & GitHub)
  // ===========================================================================
  async cargarIntegraciones(): Promise<void> {
    try {
      let { value } = await Preferences.get({ key: 'planix_integrations_v2' });
      if (!value) {
        const legacy = await Preferences.get({ key: 'taskgo_integrations_v2' });
        value = legacy.value;
      }
      if (value) {
        const saved = JSON.parse(value) as IntegrationItem[];
        // Filtrar exclusivamente Google Calendar y GitHub (eliminando Slack)
        const valid = saved.filter(i => i.id === 'gcal' || i.id === 'github');
        if (valid.length > 0) {
          this.integrations.set(valid);
        }
      }
    } catch {
      // Usar defaults
    }
  }

  async guardarIntegraciones(): Promise<void> {
    const val = JSON.stringify(this.integrations());
    await Preferences.set({
      key: 'planix_integrations_v2',
      value: val
    });
    await Preferences.set({
      key: 'taskgo_integrations_v2',
      value: val
    });

    const gcal = this.integrations().find(i => i.id === 'gcal');
    const isGcalConnected = String(gcal?.connected ?? false);
    await Preferences.set({
      key: 'planix_gcal_active',
      value: isGcalConnected
    });
    await Preferences.set({
      key: 'taskgo_gcal_active',
      value: isGcalConnected
    });
  }

  async toggleIntegration(item: IntegrationItem): Promise<void> {
    if (item.id === 'github') {
      if (item.connected) {
        await this.mostrarMenuGitHub(item);
      } else {
        await this.solicitarUsuarioGitHub(item);
      }
    } else if (item.id === 'gcal') {
      if (item.connected) {
        await this.mostrarMenuGCal(item);
      } else {
        // Conectar Google Calendar
        this.integrations.update(list =>
          list.map(i =>
            i.id === 'gcal'
              ? {
                  ...i,
                  connected: true,
                  statusText: 'Sincronizado',
                  subtitle: 'Sincronización activa con Google Calendar'
                }
              : i
          )
        );
        await this.guardarIntegraciones();
        await this.mostrarToast('Google Calendar activado. Podés agendar tareas desde su detalle.');
      }
    }
  }

  private async solicitarUsuarioGitHub(item: IntegrationItem): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Vincular cuenta de GitHub',
      message: 'Ingresá tu usuario de GitHub para validar tu perfil, foto y repositorios:',
      inputs: [
        {
          name: 'username',
          type: 'text',
          placeholder: 'Ej: octocat o tu usuario',
          value: item.details?.username || ''
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Vincular',
          handler: (data) => {
            const user = (data.username || '').trim();
            if (!user) {
              this.mostrarToast('Por favor ingresá un usuario válido.');
              return false;
            }
            this.vincularGitHub(user);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async vincularGitHub(username: string): Promise<void> {
    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
      if (res.status === 404) {
        const notFoundAlert = await this.alertCtrl.create({
          header: 'Usuario no encontrado',
          message: `No existe la cuenta de GitHub "@${username}". Revisá si está bien escrita.`,
          buttons: ['Entendido']
        });
        await notFoundAlert.present();
        return;
      }
      if (!res.ok) {
        await this.mostrarToast('Error al conectar con la API de GitHub.');
        return;
      }

      const data = await res.json();
      this.integrations.update(list =>
        list.map(i => {
          if (i.id !== 'github') return i;
          return {
            ...i,
            connected: true,
            statusText: 'Conectado',
            subtitle: `@${data.login} · ${data.public_repos} repositorios`,
            details: {
              username: data.login,
              avatarUrl: data.avatar_url,
              publicRepos: data.public_repos,
              profileUrl: data.html_url,
              lastSync: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            }
          };
        })
      );
      await this.guardarIntegraciones();
      await this.mostrarToast(
        `Cuenta @${data.login} de GitHub vinculada (${data.public_repos} repositorios públicos)`
      );
    } catch {
      await this.mostrarToast('No se pudo conectar a GitHub. Revisá tu conexión a internet.');
    }
  }

  private async mostrarMenuGitHub(item: IntegrationItem): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: `GitHub: @${item.details?.username || 'Usuario'}`,
      message: `Cuenta vinculada con ${item.details?.publicRepos ?? 0} repositorios públicos.`,
      buttons: [
        {
          text: 'Ver perfil en GitHub',
          handler: () => {
            if (item.details?.profileUrl) {
              window.open(item.details.profileUrl, '_system');
            }
          }
        },
        {
          text: 'Cambiar de usuario',
          handler: () => {
            this.solicitarUsuarioGitHub(item);
          }
        },
        {
          text: 'Desvincular cuenta',
          role: 'destructive',
          handler: async () => {
            this.integrations.update(list =>
              list.map(i =>
                i.id === 'github'
                  ? {
                      ...i,
                      connected: false,
                      statusText: 'Conectar',
                      subtitle: 'Sin vincular',
                      details: undefined
                    }
                  : i
              )
            );
            await this.guardarIntegraciones();
            await this.mostrarToast('Cuenta de GitHub desvinculada');
          }
        },
        { text: 'Cerrar', role: 'cancel' }
      ]
    });
    await alert.present();
  }

  private async mostrarMenuGCal(item: IntegrationItem): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Google Calendar',
      message: 'La sincronización está activa. Podés agendar cualquier tarea con fecha directamente en tu Google Calendar.',
      buttons: [
        {
          text: 'Abrir Google Calendar',
          handler: () => {
            window.open('https://calendar.google.com', '_system');
          }
        },
        {
          text: 'Desactivar Sincronización',
          role: 'destructive',
          handler: async () => {
            this.integrations.update(list =>
              list.map(i =>
                i.id === 'gcal'
                  ? {
                      ...i,
                      connected: false,
                      statusText: 'Conectar',
                      subtitle: 'Sin vincular'
                    }
                  : i
              )
            );
            await this.guardarIntegraciones();
            await this.mostrarToast('Google Calendar desactivado');
          }
        },
        { text: 'Cerrar', role: 'cancel' }
      ]
    });
    await alert.present();
  }

  async cerrarSesion(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¿Cerrar sesión?',
      message: 'Vas a salir de tu cuenta actual.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar Sesión',
          role: 'destructive',
          handler: () => this.authService.logout()
        }
      ]
    });
    await alert.present();
  }

  private async mostrarToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      position: 'top',
      color: 'dark',
      icon: 'checkmark-circle'
    });
    await toast.present();
  }
}
