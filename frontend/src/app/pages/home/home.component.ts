import { Component, inject, signal, computed, OnInit, effect, ViewChild, ElementRef, AfterViewInit, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { Project } from '../../models/project.model';
import { Task } from '../../models/task.model';
import { ThemeService } from '../../services/theme.service';
import { IonicStorageService } from '../../ionic/services/ionic-storage.service';
import {
  LucideAlertTriangle,
  LucidePlus,
  LucideRotateCcw
} from '@lucide/angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAlertTriangle,
    LucidePlus,
    LucideRotateCcw
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, AfterViewInit {

  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private themeService = inject(ThemeService);
  readonly storage = inject(IonicStorageService);
  private router = inject(Router);

  isDarkMode = computed(() => this.themeService.isDarkMode());

  totalXp = this.storage.totalXp;
  currentLevel = this.storage.currentLevel;
  currentRank = this.storage.currentRank;
  nextLevelTargetXp = this.storage.nextLevelTargetXp;
  xpPercentage = this.storage.xpPercentage;
  xpRemaining = this.storage.xpRemaining;

  toggleDarkMode(): void {
    this.themeService.toggleDarkLight();
  }

  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);
  
  recentProjects = computed(() => [...this.projects()].reverse().slice(0, 4));
  recentTasks = computed(() => [...this.tasks()].reverse().slice(0, 4));
  
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  updateError = signal<string | null>(null);

  attentionRequiredTasks = computed(() => {
    return this.tasks().filter(t => t.status === 'TODO' && (t.estimateHours || 0) >= 10);
  });

  @ViewChild('projectChart') projectChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('taskChart') taskChartRef!: ElementRef<HTMLCanvasElement>;

  private projectChartInst: Chart | null = null;
  private taskChartInst: Chart | null = null;

  constructor() {
    effect(() => {
      // Registrar dependencias síncronamente para que el efecto se dispare
      this.themeService.currentTheme();
      this.proyectosPlanificados();
      this.proyectosEnProceso();
      this.proyectosTerminados();
      this.tareasPendientes();
      this.tareasEnProgreso();
      this.tareasCompletadas();
      
      this.initCharts();
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.router.navigate(['/mobile/dashboard']);
      return;
    }
    let projectsLoaded = false;
    let tasksLoaded = false;
    
    this.projectService.getAll().subscribe({
      next: (data) => {
        this.projects.set(data);
        projectsLoaded = true;
        if (tasksLoaded) {
          this.loading.set(false);
          this.initCharts();
        }
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar proyectos');
        this.projects.set([]);
        this.loading.set(false);
      }
    });

    this.taskService.getAll().subscribe({
      next: (data) => {
        this.tasks.set(data);
        tasksLoaded = true;
        if (projectsLoaded) {
          this.loading.set(false);
          this.initCharts();
        }
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar tareas');
        this.tasks.set([]);
        this.loading.set(false);
      }
    });
  }

  totalProyectos = computed(() => this.projects().length);
  proyectosPlanificados = computed(() => this.projects().filter(p => p.status === 'PLANNED').length);
  proyectosEnProceso = computed(() => this.projects().filter(p => p.status === 'ACTIVE').length);
  proyectosTerminados = computed(() => this.projects().filter(p => p.status === 'CLOSED').length);
  porcentajeProyectosTerminados = computed(() => this.percentage(this.proyectosTerminados(), this.totalProyectos()));

  totalTareas = computed(() => this.tasks().length);
  tareasEnProgreso = computed(() => this.tasks().filter(t => t.status === 'IN_PROGRESS').length);
  tareasCompletadas = computed(() => this.tasks().filter(t => t.status === 'DONE').length);
  tareasPendientes = computed(() => this.tasks().filter(t => t.status === 'TODO').length);

  // --- CALENDARIO DE VENCIMIENTOS DE PROYECTOS ---
  private getTodayStr(): string {
    return new Date().toISOString().split('T')[0];
  }
  private getTomorrowStr(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  private getNextWeekStr(): string {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }

  proyectosVencidos = computed(() => {
    const today = this.getTodayStr();
    return this.projects().filter(p => p.endDate < today && p.status !== 'CLOSED');
  });

  proyectosVenceHoy = computed(() => {
    const today = this.getTodayStr();
    return this.projects().filter(p => p.endDate === today && p.status !== 'CLOSED');
  });

  proyectosVenceManana = computed(() => {
    const tomorrow = this.getTomorrowStr();
    return this.projects().filter(p => p.endDate === tomorrow && p.status !== 'CLOSED');
  });

  proyectosProximaSemana = computed(() => {
    const tomorrow = this.getTomorrowStr();
    const nextWeek = this.getNextWeekStr();
    return this.projects().filter(p => p.endDate > tomorrow && p.endDate <= nextWeek && p.status !== 'CLOSED');
  });

  proyectosCompletadosRecientes = computed(() => {
    return [...this.projects()].reverse().filter(p => p.status === 'CLOSED').slice(0, 5);
  });
  // ----------------------------------

  porcentajeTareasCompletadas = computed(() => this.percentage(this.tareasCompletadas(), this.totalTareas()));

  ngAfterViewInit() {
    // Initialization is now handled after loading data completes to ensure canvas exists
  }

  private initCharts() {
    setTimeout(() => {
      if (this.projectChartInst) this.projectChartInst.destroy();
      if (this.taskChartInst) this.taskChartInst.destroy();

      const getThemeColor = (varName: string) => getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#000';
      let bgColors: any[] = [getThemeColor('--warning-color'), getThemeColor('--primary-color'), getThemeColor('--success-color')];
      const theme = this.themeService.currentTheme();
    
      let chartCutout = '75%';
      let chartBorderRadius = 0;
      let chartSpacing = 0;
      let chartBorderWidth = 0;
      let chartRotation = 0;
      let chartCircumference = 360;
      const themeBg = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#000';
      
      switch(theme) {
        case 'minimal': 
          chartCutout = '90%'; 
          chartSpacing = 4;
          break;
        case 'cyberpunk': 
          chartCutout = '70%'; 
          chartSpacing = 10;
          chartBorderWidth = 2;
          break;
        case 'ocean': 
          chartCutout = '60%'; 
          chartBorderRadius = 20;
          chartSpacing = 6;
          break;
        case 'sunset': 
          chartCutout = '50%'; 
          chartBorderRadius = 0;
          break;
        case 'forest': 
          chartCutout = '80%'; 
          chartSpacing = 5;
          chartBorderRadius = 10;
          break;
        case 'crimson': 
          chartCutout = '85%'; 
          chartSpacing = 2;
          chartBorderWidth = 4;
          break;
        case 'cute':
          chartCutout = '65%';
          chartBorderRadius = 0;
          chartSpacing = 0;
          chartBorderWidth = 4;
          chartRotation = 0;
          chartCircumference = 360;
          break;
        default:
          chartCutout = '75%';
          break;
      }

      const createGradient = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return bgColors;
        
        const h = canvas.offsetHeight || 200;
        
        // Coral gradient
        const g1 = ctx.createLinearGradient(0, 0, 0, h);
        g1.addColorStop(0, getThemeColor('--danger-color'));
        g1.addColorStop(1, '#ffe4e6'); // rosa clarito
        
        // Yellow gradient
        const g2 = ctx.createLinearGradient(0, 0, 0, h);
        g2.addColorStop(0, getThemeColor('--warning-color'));
        g2.addColorStop(1, '#fef9c3'); // amarillo clarito
        
        // Mint gradient
        const g3 = ctx.createLinearGradient(0, 0, 0, h);
        g3.addColorStop(0, getThemeColor('--success-color'));
        g3.addColorStop(1, '#d1fae5'); // menta clarito
        
        return [g2, g1, g3]; // Warning (Planificados), Danger (En proceso), Success (Terminados) -- Wait, the order is actually:
        // labels: ['Planificados', 'En proceso', 'Terminados']
        // Colors: bgColors is [warning, primary, success]. Actually, wait. bgColors defined as:
        // [getThemeColor('--warning-color'), getThemeColor('--primary-color'), getThemeColor('--success-color')]
      };

      if (this.projectChartRef?.nativeElement) {
        let pBgColors = bgColors;
        if (theme === 'cute') {
          const ctx = this.projectChartRef.nativeElement.getContext('2d');
          if (ctx) {
            const h = this.projectChartRef.nativeElement.offsetHeight || 200;
            const g1 = ctx.createLinearGradient(0, 0, 0, h); g1.addColorStop(0, getThemeColor('--warning-color')); g1.addColorStop(1, '#fef9c3');
            const g2 = ctx.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, getThemeColor('--primary-color')); g2.addColorStop(1, '#fbcfe8');
            const g3 = ctx.createLinearGradient(0, 0, 0, h); g3.addColorStop(0, getThemeColor('--success-color')); g3.addColorStop(1, '#d1fae5');
            pBgColors = [g1, g2, g3];
          }
        }

        this.projectChartInst = new Chart(this.projectChartRef.nativeElement, {
          type: 'doughnut',
          data: {
            labels: ['Planificados', 'En proceso', 'Terminados'],
            datasets: [{
              data: [this.proyectosPlanificados(), this.proyectosEnProceso(), this.proyectosTerminados()],
              backgroundColor: pBgColors,
              hoverBackgroundColor: pBgColors,
              borderWidth: chartBorderWidth,
              borderColor: themeBg,
              borderRadius: chartBorderRadius,
              spacing: chartSpacing
            }]
          },
          options: {
            cutout: chartCutout,
            rotation: chartRotation,
            circumference: chartCircumference,
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: {
              callbacks: {
                label: (context: any) => ` ${context.label}: ${context.raw}`
              }
            } }
          }
        });
      }

      if (this.taskChartRef?.nativeElement) {
        let tBgColors = bgColors;
        if (theme === 'cute') {
          const ctx = this.taskChartRef.nativeElement.getContext('2d');
          if (ctx) {
            const h = this.taskChartRef.nativeElement.offsetHeight || 200;
            const g1 = ctx.createLinearGradient(0, 0, 0, h); g1.addColorStop(0, getThemeColor('--warning-color')); g1.addColorStop(1, '#fef9c3');
            const g2 = ctx.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, getThemeColor('--primary-color')); g2.addColorStop(1, '#fbcfe8');
            const g3 = ctx.createLinearGradient(0, 0, 0, h); g3.addColorStop(0, getThemeColor('--success-color')); g3.addColorStop(1, '#d1fae5');
            tBgColors = [g1, g2, g3];
          }
        }

        this.taskChartInst = new Chart(this.taskChartRef.nativeElement, {
          type: 'doughnut',
          data: {
            labels: ['Por hacer', 'En proceso', 'Hechas'],
            datasets: [{
              data: [this.tareasPendientes(), this.tareasEnProgreso(), this.tareasCompletadas()],
              backgroundColor: tBgColors,
              hoverBackgroundColor: tBgColors,
              borderWidth: chartBorderWidth,
              borderColor: themeBg,
              borderRadius: chartBorderRadius,
              spacing: chartSpacing
            }]
          },
          options: {
            cutout: chartCutout,
            rotation: chartRotation,
            circumference: chartCircumference,
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: {
              callbacks: {
                label: (context: any) => ` ${context.label}: ${context.raw}`
              }
            } }
          }
        });
      }
    }, 100);
  }

  private percentage(value: number, total: number): number {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  }

  updateProjectStatus(project: Project, nextStatus: 'PLANNED' | 'ACTIVE' | 'CLOSED') {
    if (!project.id) return;
    
    if (nextStatus === 'CLOSED' && project.status !== 'CLOSED') {
      const ok = window.confirm('¿Seguro que querés marcar este proyecto como Completado? Se bloqueará su edición.');
      if (!ok) {
        this.projects.update(ps => [...ps]);
        return;
      }
    }

    // Guardamos estado anterior para rollback
    const oldProjects = [...this.projects()];
    const updatedProject = { ...project, status: nextStatus };
    
    // Optimistic Update
    this.projects.update(ps => ps.map(p => p.id === project.id ? updatedProject : p));

    this.projectService.update(project.id, updatedProject).subscribe({
      error: (err) => {
        this.updateError.set('No se pudo actualizar el estado del proyecto. Intentá de nuevo.');
        // Rollback on error
        this.projects.set(oldProjects);
        setTimeout(() => this.updateError.set(null), 3000);
      }
    });
  }

  reabrirProyecto(project: Project) {
    if (confirm(`¿Estás seguro de que quieres reabrir el proyecto "${project.name}"?`)) {
      this.updateProjectStatus(project, 'ACTIVE');
    }
  }

  updateTaskStatus(task: Task, nextStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') {
    if (!task.id || !task.projectId) return;

    if (nextStatus === 'DONE' && task.status !== 'DONE') {
      const ok = window.confirm('¿Seguro que querés marcar esta tarea como Hecha? Se bloqueará su edición.');
      if (!ok) {
        this.tasks.update(ts => [...ts]);
        return;
      }
    }

    // Guardamos estado anterior para rollback
    const oldTasks = [...this.tasks()];
    const updatedTask = { ...task, status: nextStatus };

    // Optimistic Update
    this.tasks.update(ts => ts.map(t => t.id === task.id ? updatedTask : t));

    this.taskService.update(task.projectId, task.id, updatedTask).subscribe({
      error: (err) => {
        this.updateError.set('No se pudo actualizar el estado de la tarea. Intentá de nuevo.');
        // Rollback on error
        this.tasks.set(oldTasks);
        setTimeout(() => this.updateError.set(null), 3000);
      }
    });
  }

  reabrirTarea(task: Task) {
    if (confirm(`¿Estás seguro de que quieres reabrir la tarea "${task.title}"?`)) {
      this.updateTaskStatus(task, 'IN_PROGRESS');
    }
  }
}
