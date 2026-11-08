import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';

// =============================================================================
// [IONIC 9 - CLASES 1 A 6] DASHBOARD MÓVIL COMPLETO:
// 1. Barra Superior + Saludo + Campana con Panel Flotante + Avatar Directo
// 2. Widget de Resumen de Productividad (Anillo Circular + Lineal + 3 Contadores)
// 3. Carrusel Horizontal de Proyectos en Curso (Categoría, Progreso, Equipo, Plazo)
// 4. Lista de Tareas de Hoy (Filtros Todas/Pendientes/Completadas, Checkbox animado,
//    Prioridad Alta/Media/Baja y Hora límite)
// =============================================================================
import {
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonFab,
  IonFabButton,
  IonFabList,
  IonButtons,
  IonMenuButton,
  IonSpinner,
  IonText
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  refreshOutline,
  addOutline,
  briefcaseOutline,
  checkboxOutline,
  trendingUpOutline,
  timeOutline,
  logOutOutline,
  desktopOutline,
  chevronForwardOutline,
  checkmarkCircleOutline,
  sparklesOutline,
  cloudOfflineOutline,
  flash,
  radioButtonOn,
  time,
  notificationsOutline,
  checkmarkDoneOutline,
  closeOutline,
  calendarOutline,
  colorWandOutline,
  alertCircleOutline,
  hourglassOutline,
  layersOutline,
  listOutline,
  checkmarkOutline,
  flagOutline,
  personOutline,
  moonOutline,
  sunnyOutline
} from 'ionicons/icons';

import { ProjectService } from '../../../services/project.service';
import { TaskService } from '../../../services/task.service';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { IonicStorageService } from '../../services/ionic-storage.service';
import { Project } from '../../../models/project.model';
import { Task } from '../../../models/task.model';

export interface DashboardNotification {
  id: number;
  title: string;
  message: string;
  timeAgo: string;
  icon: string;
  colorClass: string;
  read: boolean;
  route?: string;
}

export type TaskFilterTab = 'ALL' | 'TODO' | 'DONE';

export interface PriorityMeta {
  label: 'Alta' | 'Media' | 'Baja';
  cssClass: string;
}

export interface WeeklyBar {
  day: string;
  heightPercent: number;
  tasksCount: number;
  highlight?: boolean;
  dimmed?: boolean;
}

@Component({
  selector: 'app-mobile-dashboard',
  standalone: true,
  imports: [
    UpperCasePipe,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
    IonFab,
    IonFabButton,
    IonFabList,
    IonButtons,
    IonMenuButton,
    IonSpinner,
    IonText
  ],
  templateUrl: './mobile-dashboard.component.html',
  styleUrls: ['./mobile-dashboard.component.css']
})
export class MobileDashboardComponent implements OnInit {
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly storage = inject(IonicStorageService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  // Modo Oscuro / Claro interactivo en Inicio conectado a ThemeService
  isDarkMode = computed(() => this.themeService.isDark());

  // [CLASE 5] Los 3 estados de la interfaz modelados con Signals
  // projects y tasks son los signals COMPARTIDOS del store central, así el
  // nivel y el XP quedan sincronizados con el Perfil en tiempo real.
  projects = this.storage.projects;
  tasks = this.storage.tasks;

  // Nivel y XP (leídos del store central)
  currentLevel = this.storage.currentLevel;
  currentRank = this.storage.currentRank;
  totalXp = this.storage.totalXp;
  nextLevelTargetXp = this.storage.nextLevelTargetXp;
  xpPercentage = this.storage.xpPercentage;
  xpRemaining = this.storage.xpRemaining;
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  avatarUrl = signal<string | null>(null);

  // Filtro activo de "Tareas de Hoy": Todas | Pendientes | Completadas
  selectedTaskFilter = signal<TaskFilterTab>('ALL');

  // Estado del Panel Flotante de Notificaciones
  isNotificationsOpen = signal<boolean>(false);
  notifications = signal<DashboardNotification[]>([
    {
      id: 1,
      title: 'Revisión de Diseño UI/UX',
      message: 'El prototipo móvil de Planix fue aprobado por el equipo.',
      timeAgo: 'Hace 5 min',
      icon: 'color-wand-outline',
      colorClass: 'notif-indigo',
      read: false,
      route: '/mobile/projects'
    },
    {
      id: 2,
      title: 'Reunión de Sincronización',
      message: 'Daily de seguimiento hoy a las 17:30 hs por Meet.',
      timeAgo: 'Hace 25 min',
      icon: 'calendar-outline',
      colorClass: 'notif-amber',
      read: false
    },
    {
      id: 3,
      title: 'Meta de Foco Alcanzada',
      message: '¡Completaste tu racha de 12 días seguidos en modo foco!',
      timeAgo: 'Hace 2 h',
      icon: 'sparkles-outline',
      colorClass: 'notif-emerald',
      read: false,
      route: '/mobile/profile'
    }
  ]);

  unreadNotificationsCount = computed(() =>
    this.notifications().filter(n => !n.read).length
  );

  // ===========================================================================
  // 2. MÉTRICAS DEL WIDGET DE PRODUCTIVIDAD (Todo inicia en 0 real)
  // ===========================================================================
  totalProjects = computed(() => this.projects().length);
  activeProjects = computed(() => this.projects().filter(p => p.status === 'ACTIVE').length);

  totalTasks = computed(() => this.tasks().length);
  completedTasks = computed(() => this.tasks().filter(t => t.status === 'DONE').length);
  pendingTodayCount = computed(() => this.tasks().filter(t => t.status !== 'DONE').length);

  completionPercentage = computed(() => {
    const total = this.totalTasks();
    if (total === 0) return 0;
    return Math.round((this.completedTasks() / total) * 100);
  });

  // Geometría del anillo circular SVG (radio = 36 -> circunferencia = 226.19)
  readonly circleCircumference = 2 * Math.PI * 36;
  circleDashOffset = computed(() => {
    const pct = this.completionPercentage();
    return this.circleCircumference - (pct / 100) * this.circleCircumference;
  });

  // Horas invertidas y estimadas calculadas dinámicamente desde 0
  investedHours = computed(() => {
    const doneTasks = this.tasks().filter(t => t.status === 'DONE');
    if (doneTasks.length === 0) return '0';
    const sum = doneTasks.reduce((acc, t) => acc + (t.estimateHours || 1), 0);
    return sum.toString();
  });

  estimatedHours = computed(() => {
    const all = this.tasks();
    if (all.length === 0) return '0';
    const sum = all.reduce((acc, t) => acc + (t.estimateHours || 1), 0);
    return sum.toString();
  });

  // ===========================================================================
  // 3. RENDIMIENTO SEMANAL (Inicia en 0 y sube con tus tareas completadas)
  // ===========================================================================
  private readonly dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  selectedDay = signal<string>(this.dayNames[new Date().getDay()] || 'Mié');

  weeklyBars = computed<WeeklyBar[]>(() => {
    const orderedDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const todayLabel = this.dayNames[new Date().getDay()] || 'Mié';
    const currentSelected = this.selectedDay();
    const doneToday = this.completedTasks();
    const pctToday = this.completionPercentage();

    return orderedDays.map(day => {
      const isToday = day === todayLabel;
      const tasksCount = isToday ? doneToday : 0;
      const heightPercent = isToday ? pctToday : 0;
      return {
        day,
        heightPercent,
        tasksCount,
        highlight: day === currentSelected,
        dimmed: day === 'Sáb' || day === 'Dom'
      };
    });
  });

  // ===========================================================================
  // 4. LISTA FILTRADA DE TAREAS DE HOY (Todas, Pendientes, Completadas)
  // ===========================================================================
  filteredTodayTasks = computed(() => {
    const filter = this.selectedTaskFilter();
    const list = this.tasks();
    if (filter === 'TODO') {
      return list.filter(t => t.status !== 'DONE');
    }
    if (filter === 'DONE') {
      return list.filter(t => t.status === 'DONE');
    }
    return list;
  });

  constructor() {
    addIcons({
      refreshOutline,
      addOutline,
      briefcaseOutline,
      checkboxOutline,
      trendingUpOutline,
      timeOutline,
      logOutOutline,
      desktopOutline,
      chevronForwardOutline,
      checkmarkCircleOutline,
      sparklesOutline,
      cloudOfflineOutline,
      flash,
      radioButtonOn,
      time,
      notificationsOutline,
      checkmarkDoneOutline,
      closeOutline,
      calendarOutline,
      colorWandOutline,
      alertCircleOutline,
      hourglassOutline,
      layersOutline,
      listOutline,
      checkmarkOutline,
      flagOutline,
      personOutline,
      moonOutline,
      sunnyOutline
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargarAvatarUsuario();
    this.cargarDatos();
  }

  async toggleDarkMode(event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    this.themeService.toggleDarkLight();
    const isNowDark = this.themeService.isDark();

    const toast = await this.toastCtrl.create({
      message: isNowDark ? 'Modo oscuro activado' : 'Modo claro activado',
      duration: 1800,
      position: 'bottom'
    });
    await toast.present();
  }

  private async cargarAvatarUsuario(): Promise<void> {
    const user = this.authService.currentUser();
    if (user?.avatarUrl) {
      this.avatarUrl.set(user.avatarUrl);
    } else if (user?.email) {
      const saved = await this.storage.loadUserAvatar(user.email);
      if (saved) {
        this.avatarUrl.set(saved);
        this.authService.updateAvatar(saved);
      }
    }
  }

  // ===========================================================================
  // HELPERS VISUALES PARA EL CARRUSEL DE PROYECTOS EN CURSO
  // ===========================================================================
  getProjectCategory(project: Project, index: number): string {
    const name = (project.name || '').toLowerCase();
    if (name.includes('app') || name.includes('móvil') || name.includes('movil') || name.includes('ui')) {
      return 'Diseño UI/UX';
    }
    if (name.includes('marketing') || name.includes('campaña')) {
      return 'Campaña Marketing';
    }
    if (name.includes('web') || name.includes('plataforma') || name.includes('api')) {
      return 'Plataforma Web';
    }
    const categories = ['Diseño UI/UX', 'Campaña Marketing', 'Plataforma Web', ' Producto Digital'];
    return categories[index % categories.length];
  }

  getProjectProgress(projectId: number, _index?: number): number {
    const projTasks = this.tasks().filter(t => t.projectId === projectId);
    if (projTasks.length === 0) {
      return 0;
    }
    const done = projTasks.filter(t => t.status === 'DONE').length;
    return Math.round((done / projTasks.length) * 100);
  }

  irADetalleProyecto(projectId: number): void {
    this.router.navigate(['/mobile/projects', projectId]);
  }

  async seleccionarDiaSemanal(bar: WeeklyBar): Promise<void> {
    this.selectedDay.set(bar.day);
    const toast = await this.toastCtrl.create({
      message: `${bar.day}: ${bar.tasksCount} tareas completadas (${bar.heightPercent}% progreso)`,
      duration: 2000,
      position: 'top',
      color: 'dark'
    });
    await toast.present();
  }

  getProjectDeadlineText(project: Project, index: number): string {
    if (project.endDate) {
      const end = new Date(project.endDate).getTime();
      const now = Date.now();
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      if (diffDays > 1) return `Vence en ${diffDays} días`;
      if (diffDays === 1) return 'Vence mañana';
      if (diffDays === 0) return 'Vence hoy';
    }
    const deadlines = ['Vence en 3 días', 'Vence en 5 días', 'Vence en 2 días', 'Vence esta semana'];
    return deadlines[index % deadlines.length];
  }

  getProjectTeamInitials(index: number): string[] {
    const teams = [
      ['C', 'M', 'L'],
      ['A', 'R', 'S'],
      ['J', 'V', 'C'],
      ['P', 'D', 'E']
    ];
    return teams[index % teams.length];
  }

  // ===========================================================================
  // HELPERS VISUALES PARA LA LISTA DE TAREAS DE HOY
  // ===========================================================================
  getTaskPriority(task: Task, index: number): PriorityMeta {
    const title = (task.title || '').toLowerCase();
    if (title.includes('urgente') || title.includes('presupuesto') || title.includes('wireframe') || index % 3 === 0) {
      return { label: 'Alta', cssClass: 'prio-high' };
    }
    if (index % 3 === 1) {
      return { label: 'Media', cssClass: 'prio-medium' };
    }
    return { label: 'Baja', cssClass: 'prio-low' };
  }

  getTaskTimeLabel(task: Task, index: number): string {
    if (task.dueDate) {
      return task.dueDate;
    }
    const slots = ['10:30 AM', '13:00 PM', '15:30 PM', '17:00 PM', '18:30 PM'];
    return slots[index % slots.length];
  }

  setTaskFilter(tab: TaskFilterTab): void {
    this.selectedTaskFilter.set(tab);
  }

  async toggleTaskCompletion(task: Task, event: Event): Promise<void> {
    event.stopPropagation();
    const nextStatus: 'TODO' | 'DONE' = task.status === 'DONE' ? 'TODO' : 'DONE';
    const updatedTask: Task = { ...task, status: nextStatus };
    const previousLevel = this.currentLevel();

    // Actualización optimista inmediata para animar el checkbox, el progreso y el XP
    await this.storage.saveTasks(
      this.tasks().map(t => (t.id === task.id ? updatedTask : t))
    );

    if (task.id && task.projectId) {
      this.taskService.update(task.projectId, task.id, updatedTask).subscribe({
        error: () => {
          // Ya quedó persistido en Preferences para modo offline
        }
      });
    }

    const newLevel = this.currentLevel();
    const toast = await this.toastCtrl.create({
      message:
        newLevel > previousLevel
          ? `Subiste a Nivel ${newLevel} (${this.currentRank().title})`
          : nextStatus === 'DONE'
            ? `Tarea completada (+100 XP) · "${task.title}"`
            : `Tarea marcada como pendiente: "${task.title}"`,
      duration: 1600,
      position: 'top',
      color: nextStatus === 'DONE' ? 'success' : 'dark'
    });
    await toast.present();
  }

  // ===========================================================================
  // NOTIFICACIONES Y PERFIL
  // ===========================================================================
  toggleNotificationsPanel(event?: Event): void {
    if (event) event.stopPropagation();
    this.isNotificationsOpen.update(open => !open);
  }

  closeNotificationsPanel(): void {
    this.isNotificationsOpen.set(false);
  }

  async markAllNotificationsAsRead(event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    this.notifications.update(list => list.map(n => ({ ...n, read: true })));
    const toast = await this.toastCtrl.create({
      message: 'Todas las notificaciones marcadas como leídas',
      duration: 1800,
      position: 'top',
      color: 'dark'
    });
    await toast.present();
  }

  async onNotificationClick(notif: DashboardNotification): Promise<void> {
    this.notifications.update(list =>
      list.map(n => (n.id === notif.id ? { ...n, read: true } : n))
    );
    this.isNotificationsOpen.set(false);
    if (notif.route) {
      this.router.navigate([notif.route]);
    } else {
      const toast = await this.toastCtrl.create({
        message: `${notif.title}: ${notif.message}`,
        duration: 2200,
        position: 'top',
        color: 'dark'
      });
      await toast.present();
    }
  }

  irAPerfil(): void {
    this.router.navigate(['/mobile/profile']);
  }

  async cambiarEstadoRapido(event?: Event): Promise<void> {
    if (event) event.stopPropagation();
    const next = this.authService.cycleUserStatus();
    const toast = await this.toastCtrl.create({
      message: `Estado cambiado a: ${next.text}`,
      duration: 2000,
      position: 'top',
      color: 'dark'
    });
    await toast.present();
  }

  // [CLASES 5 Y 6] Carga paralela con forkJoin + catchError + finalize + Preferences
  async cargarDatos(event?: any): Promise<void> {
    if (!event) {
      this.loading.set(true);
    }
    this.error.set(null);

    if (await this.storage.isOnline()) {
      forkJoin({
        projects: this.projectService.getAll(),
        tasks: this.taskService.getAll()
      }).pipe(
        catchError(() => {
          this.error.set('Modo Offline: Mostrando datos guardados en @capacitor/preferences.');
          return of(null);
        }),
        finalize(() => {
          this.loading.set(false);
          if (event) event.target.complete();
        })
      ).subscribe(async (res) => {
        if (res !== null) {
          await this.storage.saveProjects(res.projects);
          await this.storage.saveTasks(res.tasks);
        } else {
          await this.storage.loadProjects();
          await this.storage.loadTasks();
        }
      });
    } else {
      this.error.set('Sin conexión: datos cargados desde almacenamiento local (Preferences).');
      await this.storage.loadProjects();
      await this.storage.loadTasks();
      this.loading.set(false);
      if (event) event.target.complete();
    }
  }

  handleRefresh(event: any): void {
    this.cargarDatos(event);
  }
}
