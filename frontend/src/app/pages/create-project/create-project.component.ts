import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { Project, ProjectStatus } from '../../models/project.model';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import {
  LucideCheckCircle,
  LucideXCircle,
  LucideX,
  LucidePlus,
  LucideArrowRight,
  LucideArrowLeft,
  LucideCheck,
  LucideSparkles,
  LucideTable,
  LucideKanban,
  LucideCalendar,
  LucideLayoutGrid,
  LucideBarChart2,
  LucideClock,
  LucideCheckSquare,
  LucideUser,
  LucideAlertTriangle,
  LucideTimer,
  LucideHistory,
  LucideFileText,
  LucidePaperclip,
  LucideCoins,
  LucideTriangle,
  LucideMail
} from '@lucide/angular';

export interface SpaceTemplate {
  id: 'kanban' | 'project' | 'scrum';
  name: string;
  category: string;
  description: string;
  defaultStatus: ProjectStatus;
  defaultStates: string[];
  suggestedTasks: { title: string; hours: number; assignee: string; status: 'TODO' | 'IN_PROGRESS' | 'DONE' }[];
}

export interface BoardColumnOption {
  id: string;
  label: string;
  color: string;
  iconBg: string;
}

export interface ViewDesignOption {
  id: 'table' | 'kanban' | 'calendar' | 'cards' | 'gantt' | 'timeline';
  label: string;
  color: string;
  iconBg: string;
  bannerText: string;
}

export interface DashboardWidgetOption {
  id: 'overview' | 'by-status' | 'by-assignee' | 'overdue' | 'by-due-date';
  label: string;
  color: string;
  iconBg: string;
  description: string;
}

export interface TeamInviteMember {
  email: string;
  role: 'Administrador' | 'Miembro' | 'Observador';
}

@Component({
  selector: 'app-create-project',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideCheckCircle,
    LucideXCircle,
    LucideX,
    LucidePlus,
    LucideArrowRight,
    LucideArrowLeft,
    LucideCheck,
    LucideSparkles,
    LucideTable,
    LucideKanban,
    LucideCalendar,
    LucideLayoutGrid,
    LucideBarChart2,
    LucideClock,
    LucideCheckSquare,
    LucideUser,
    LucideAlertTriangle,
    LucideTimer,
    LucideHistory,
    LucideFileText,
    LucidePaperclip,
    LucideCoins,
    LucideTriangle,
    LucideMail
  ],
  templateUrl: './create-project.component.html',
  styleUrl: './create-project.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateProjectComponent implements OnInit {

  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Modo de visualización: Asistente interactivo vs Formulario tradicional
  isWizardMode = signal<boolean>(true);
  currentStep = signal<number>(1); // 1: Plantilla, 2: Nombre, 3: Columnas, 4: Flujo, 5: Vistas, 6: Paneles, 7: Equipo, 8: Confirmación

  // ===========================================================================
  // 1. PLANTILLAS DE ESPACIOS (PASO 1)
  // ===========================================================================
  readonly templates: SpaceTemplate[] = [
    {
      id: 'kanban',
      name: 'Kanban',
      category: 'Gestión de proyectos',
      description: 'Administre y realice un seguimiento del trabajo ágil e integre herramientas para desarrolladores como GitHub',
      defaultStatus: 'ACTIVE',
      defaultStates: ['Idea', 'To Do', 'In Progress', 'In Review', 'Done'],
      suggestedTasks: [
        { title: 'Relevamiento de requerimientos iniciales', hours: 6, assignee: 'Cielo', status: 'DONE' },
        { title: 'Configurar repositorio e integración continua', hours: 4, assignee: 'Admin', status: 'IN_PROGRESS' },
        { title: 'Implementar tablero visual de tarjetas', hours: 10, assignee: 'Equipo', status: 'TODO' }
      ]
    },
    {
      id: 'project',
      name: 'Gestión de proyectos',
      category: 'Gestión de proyectos',
      description: 'Diseñado para ayudar a los equipos empresariales a gestionar el trabajo con vistas de listas y calendarios',
      defaultStatus: 'PLANNED',
      defaultStates: ['Planificado', 'En curso', 'Revisión', 'Completado'],
      suggestedTasks: [
        { title: 'Definir cronograma e hitos clave', hours: 8, assignee: 'Líder de Proyecto', status: 'IN_PROGRESS' },
        { title: 'Reunión de kickoff con stakeholders', hours: 3, assignee: 'Cielo', status: 'TODO' },
        { title: 'Elaborar informe de avance semanal', hours: 5, assignee: 'Admin', status: 'TODO' }
      ]
    },
    {
      id: 'scrum',
      name: 'Scrum',
      category: 'Gestión de proyectos',
      description: 'Planifique, priorice y programe sprints utilizando el marco Scrum con backlogs y entregas',
      defaultStatus: 'ACTIVE',
      defaultStates: ['Backlog', 'Sprint activo', 'En desarrollo', 'QA / Test', 'Finalizado'],
      suggestedTasks: [
        { title: 'Sprint Planning y estimación de puntos de historia', hours: 4, assignee: 'Scrum Master', status: 'DONE' },
        { title: 'Desarrollo de User Stories del Sprint 1', hours: 16, assignee: 'Desarrollador', status: 'IN_PROGRESS' },
        { title: 'Sprint Review y Retrospectiva', hours: 4, assignee: 'Equipo Scrum', status: 'TODO' }
      ]
    }
  ];

  selectedTemplate = signal<SpaceTemplate>(this.templates[0]);
  workflowStates = signal<string[]>([...this.templates[0].defaultStates]);
  includeSuggestedTasks = signal<boolean>(true);

  // Sugerencias de nombres tipo chips (Paso 2)
  readonly nameSuggestions = [
    'Mi equipo de gestión de proyectos',
    'Equipo Lyra',
    'Centro de hitos',
    'Planificación de iniciativas',
    'Proyectos entre equipos'
  ];

  // ===========================================================================
  // 3. COLUMNAS RELEVANTES PARA EL TABLERO (PASO 3 - NUEVO)
  // ===========================================================================
  readonly availableColumns: BoardColumnOption[] = [
    { id: 'assignee', label: 'Responsable', color: '#0284c7', iconBg: '#e0f2fe' },
    { id: 'status', label: 'Estado', color: '#10b981', iconBg: '#dcfce7' },
    { id: 'dueDate', label: 'Vencimiento', color: '#8b5cf6', iconBg: '#f3e8ff' },
    { id: 'timeline', label: 'Cronograma', color: '#d946ef', iconBg: '#fae8ff' },
    { id: 'lastUpdated', label: 'Última actualización', color: '#a78bfa', iconBg: '#ede9fe' },
    { id: 'notes', label: 'Notas', color: '#eab308', iconBg: '#fef9c3' },
    { id: 'files', label: 'Archivos', color: '#ef4444', iconBg: '#fee2e2' },
    { id: 'budget', label: 'Presupuesto', color: '#f59e0b', iconBg: '#fef3c7' },
    { id: 'priority', label: 'Prioridad', color: '#14b8a6', iconBg: '#ccfbf1' }
  ];

  // Columnas activas por defecto (las 3 primeras seleccionadas con borde azul como en captura 2)
  selectedColumns = signal<string[]>(['assignee', 'status', 'dueDate']);

  // ===========================================================================
  // 5. DISEÑOS DE VISTAS (PASO 5)
  // ===========================================================================
  readonly viewOptions: ViewDesignOption[] = [
    {
      id: 'table',
      label: 'Tabla',
      color: '#8b5cf6',
      iconBg: '#f3e8ff',
      bannerText: 'Visualiza todas tus tareas y campos en formato de filas y columnas para editar rápidamente'
    },
    {
      id: 'kanban',
      label: 'Kanban',
      color: '#0052cc',
      iconBg: '#eff6ff',
      bannerText: 'Mueve tarjetas entre columnas visuales para un seguimiento ágil y continuo del progreso'
    },
    {
      id: 'calendar',
      label: 'Calendario',
      color: '#ec4899',
      iconBg: '#fdf2f8',
      bannerText: 'Planifica entregas según fechas clave en un calendario mensual y semanal interactivo'
    },
    {
      id: 'cards',
      label: 'Fichas',
      color: '#ea580c',
      iconBg: '#fff7ed',
      bannerText: 'Revisa información visual y detallada de cada tarea en tarjetas destacadas con vista en cuadrícula'
    },
    {
      id: 'gantt',
      label: 'Gantt',
      color: '#10b981',
      iconBg: '#ecfdf5',
      bannerText: 'Monitorea dependencias, rutas críticas y la duración estimada de cada fase de tu proyecto'
    },
    {
      id: 'timeline',
      label: 'Cronograma',
      color: '#f59e0b',
      iconBg: '#fffbeb',
      bannerText: 'Usa los vencimientos y cronogramas visuales para que nada se pase por alto'
    }
  ];

  selectedView = signal<ViewDesignOption>(this.viewOptions[5]); // Default: Cronograma

  // ===========================================================================
  // 6. WIDGETS DE PANELES EN TIEMPO REAL (PASO 6)
  // ===========================================================================
  readonly widgetOptions: DashboardWidgetOption[] = [
    {
      id: 'overview',
      label: 'Vista general de tareas',
      color: '#8b5cf6',
      iconBg: '#f3e8ff',
      description: 'Muestra el progreso global, total de tareas asignadas y completadas.'
    },
    {
      id: 'by-status',
      label: 'Tareas por estado',
      color: '#10b981',
      iconBg: '#ecfdf5',
      description: 'Gráfico de barras y distribución de tareas pendientes, en curso y terminadas.'
    },
    {
      id: 'by-assignee',
      label: 'Tareas por responsable',
      color: '#0284c7',
      iconBg: '#f0f9ff',
      description: 'Visualiza la carga de trabajo y distribución entre los integrantes del equipo.'
    },
    {
      id: 'overdue',
      label: 'Tareas vencidas',
      color: '#8b5cf6',
      iconBg: '#f3e8ff',
      description: 'Alertas inmediatas de tareas que superaron su fecha límite de entrega.'
    },
    {
      id: 'by-due-date',
      label: 'Tareas por vencimiento',
      color: '#14b8a6',
      iconBg: '#f0fdfa',
      description: 'Línea de tiempo con las próximas entregas programadas para esta semana.'
    }
  ];

  selectedWidgets = signal<string[]>(['overview', 'by-status', 'by-assignee']);

  // ===========================================================================
  // 7. INVITACIONES AL EQUIPO (PASO 7 - NUEVO)
  // ===========================================================================
  teamInvites = signal<TeamInviteMember[]>([
    { email: '', role: 'Administrador' },
    { email: '', role: 'Administrador' }
  ]);

  projects = signal<Project[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Fechas inteligentes por defecto
  private readonly defaultStart = new Date().toISOString().split('T')[0];
  private readonly defaultEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    startDate: [this.defaultStart, [Validators.required]],
    endDate: [this.defaultEnd, [Validators.required]],
    status: ['ACTIVE', [Validators.required]],
    description: [''],
    includeTasks: [false],
    tasks: this.fb.array([])
  }, { validators: this.validarFechas });

  get tasks(): import('@angular/forms').FormArray {
    return this.form.get('tasks') as import('@angular/forms').FormArray;
  }

  spaceNamePreview = computed(() => {
    const val = this.form.get('name')?.value;
    return val && val.trim().length > 0 ? val : 'My Project Management Team';
  });

  ngOnInit(): void {
    this.cargarProyectos();
  }

  cargarProyectos(): void {
    this.projectService.getAll().subscribe({
      next: (data) => this.projects.set(data),
      error: () => this.projects.set([])
    });
  }

  // ===========================================================================
  // MÉTODOS DEL WIZARD
  // ===========================================================================
  selectTemplate(tmpl: SpaceTemplate): void {
    this.selectedTemplate.set(tmpl);
    this.workflowStates.set([...tmpl.defaultStates]);
    this.form.patchValue({ status: tmpl.defaultStatus });
  }

  applyNameSuggestion(suggestion: string): void {
    this.form.patchValue({ name: suggestion });
    this.form.get('name')?.markAsTouched();
  }

  // Toggle de columnas del tablero (Paso 3)
  toggleColumn(columnId: string): void {
    this.selectedColumns.update(cols => {
      if (cols.includes(columnId)) {
        if (cols.length <= 1) return cols;
        return cols.filter(id => id !== columnId);
      } else {
        return [...cols, columnId];
      }
    });
  }

  isColumnSelected(columnId: string): boolean {
    return this.selectedColumns().includes(columnId);
  }

  selectView(view: ViewDesignOption): void {
    this.selectedView.set(view);
  }

  toggleWidget(widgetId: string): void {
    this.selectedWidgets.update(current => {
      if (current.includes(widgetId)) {
        if (current.length <= 1) return current;
        return current.filter(id => id !== widgetId);
      } else {
        return [...current, widgetId];
      }
    });
  }

  isWidgetSelected(widgetId: string): boolean {
    return this.selectedWidgets().includes(widgetId);
  }

  // Gestión de miembros del equipo (Paso 7)
  addTeamMember(): void {
    this.teamInvites.update(list => [...list, { email: '', role: 'Miembro' }]);
  }

  removeTeamMember(index: number): void {
    if (this.teamInvites().length <= 1) return;
    this.teamInvites.update(list => list.filter((_, i) => i !== index));
  }

  updateTeamMemberEmail(index: number, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.teamInvites.update(list => {
      const copy = [...list];
      copy[index] = { ...copy[index], email: val };
      return copy;
    });
  }

  updateTeamMemberRole(index: number, event: Event): void {
    const val = (event.target as HTMLSelectElement).value as any;
    this.teamInvites.update(list => {
      const copy = [...list];
      copy[index] = { ...copy[index], role: val };
      return copy;
    });
  }

  goToStep(step: number): void {
    if (step >= 3 && this.currentStep() === 2) {
      if (!this.form.get('name')?.value || this.form.get('name')?.invalid) {
        this.form.get('name')?.markAsTouched();
        return;
      }
    }
    this.currentStep.set(step);
  }

  nextStep(): void {
    const current = this.currentStep();
    if (current === 2) {
      if (!this.form.get('name')?.value || this.form.get('name')?.invalid) {
        this.form.get('name')?.markAsTouched();
        return;
      }
    }
    if (current < 8) {
      this.currentStep.set(current + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  // Manipulación de estados / columnas (Paso 4)
  updateWorkflowState(index: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value.trim();
    if (!val) return;
    this.workflowStates.update(states => {
      const copy = [...states];
      copy[index] = val;
      return copy;
    });
  }

  removeWorkflowState(index: number): void {
    if (this.workflowStates().length <= 2) {
      return;
    }
    this.workflowStates.update(states => states.filter((_, i) => i !== index));
  }

  addWorkflowState(): void {
    this.workflowStates.update(states => [...states, `Nuevo Estado ${states.length + 1}`]);
  }

  toggleWizardMode(): void {
    this.isWizardMode.update(v => !v);
  }

  // ===========================================================================
  // SUBMIT DEL PROYECTO (WIZARD O CLÁSICO)
  // ===========================================================================
  submitFromWizard(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor completá los campos obligatorios del proyecto.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const tmpl = this.selectedTemplate();
    const projectData: Partial<Project> = {
      name: this.form.value.name,
      startDate: this.form.value.startDate || this.defaultStart,
      endDate: this.form.value.endDate || this.defaultEnd,
      status: (this.form.value.status || tmpl.defaultStatus) as ProjectStatus,
      description: this.form.value.description || `Espacio [${tmpl.name}] · Vista: ${this.selectedView().label} · ${this.selectedColumns().length} columnas activas`
    };

    this.projectService.create(projectData as Project).pipe(
      switchMap((createdProject) => {
        if (this.includeSuggestedTasks() && tmpl.suggestedTasks.length > 0 && createdProject.id) {
          const taskObservables = tmpl.suggestedTasks.map(t =>
            this.taskService.create(createdProject.id!, {
              title: t.title,
              estimateHours: t.hours,
              assignee: t.assignee,
              status: t.status,
              dueDate: projectData.endDate
            } as Task)
          );
          return forkJoin(taskObservables).pipe(
            switchMap(() => of({ project: createdProject, tasksCount: tmpl.suggestedTasks.length }))
          );
        }
        return of({ project: createdProject, tasksCount: 0 });
      })
    ).subscribe({
      next: (result) => {
        this.projects.update(list => [...list, result.project]);
        this.loading.set(false);
        this.success.set(`¡Espacio "${result.project.name}" creado con éxito con ${result.tasksCount} tareas iniciales!`);
        setTimeout(() => {
          this.router.navigate(['/projects', result.project.id]);
        }, 1200);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Error al crear el espacio');
        this.loading.set(false);
      }
    });
  }

  // Modo clásico (soporte retrocompatible)
  toggleIncludeTasks(value: boolean): void {
    this.form.patchValue({ includeTasks: value });
    if (value && this.tasks.length === 0) {
      this.addTask();
    } else if (!value) {
      this.tasks.clear();
    }
  }

  addTask(): void {
    const taskGroup = this.fb.group({
      title: ['', Validators.required],
      estimateHours: [0, [Validators.required, Validators.min(1)]],
      assignee: [''],
      status: ['TODO', Validators.required],
      dueDate: ['']
    });
    this.tasks.push(taskGroup);
  }

  removeTask(index: number): void {
    this.tasks.removeAt(index);
    if (this.tasks.length === 0) {
      this.toggleIncludeTasks(false);
    }
  }

  validarFechas(group: AbstractControl) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    const hoy = new Date().toISOString().split('T')[0];

    if (end && end < hoy) {
      return { endDatePasada: true };
    }
    if (start && end && end < start) {
      return { endDateMenorQueStart: true };
    }
    return null;
  }

  submitClassic(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const projectData = { ...this.form.value };
    delete projectData.includeTasks;
    delete projectData.tasks;

    this.projectService.create(projectData as Project).pipe(
      switchMap((createdProject) => {
        const includeTasks = this.form.value.includeTasks;
        const tasksData: Task[] = this.form.value.tasks;

        if (includeTasks && tasksData.length > 0 && createdProject.id) {
          const taskObservables = tasksData.map(t => this.taskService.create(createdProject.id!, t));
          return forkJoin(taskObservables).pipe(
            switchMap(() => of({ project: createdProject, tasksCount: tasksData.length }))
          );
        }
        return of({ project: createdProject, tasksCount: 0 });
      })
    ).subscribe({
      next: (result) => {
        this.projects.update(list => [...list, result.project]);
        this.form.reset({
          startDate: this.defaultStart,
          endDate: this.defaultEnd,
          status: 'ACTIVE',
          includeTasks: false
        });
        this.tasks.clear();
        this.loading.set(false);
        this.success.set('Proyecto creado correctamente.');
        setTimeout(() => {
          this.router.navigate(['/projects', result.project.id]);
        }, 1000);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.form.reset({
      startDate: this.defaultStart,
      endDate: this.defaultEnd,
      status: 'ACTIVE',
      includeTasks: false
    });
    this.tasks.clear();
    this.error.set(null);
    this.success.set(null);
    this.currentStep.set(1);
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }
}
