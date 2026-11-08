import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import {
  LucideArrowLeft,
  LucideEdit,
  LucideTrash2,
  LucidePlus,
  LucideSave,
  LucideRotateCcw,
  LucideKanban,
  LucideList,
  LucideSearch,
  LucideFilter,
  LucideX,
  LucideCheck,
  LucideClock,
  LucideUser,
  LucideCalendar,
  LucideChevronRight,
  LucideChevronLeft,
  LucideChevronDown,
  LucideTag,
  LucideSparkles,
  LucideTable,
  LucideMessageSquare,
  LucideArrowUpDown,
  LucideEye,
  LucideLayers,
  LucideMoreHorizontal,
  LucideBot,
  LucideZap
} from '@lucide/angular';

export interface SubtaskItem {
  id: string;
  text: string;
  done: boolean;
}

export interface MondayGroup {
  id: string;
  name: string;
  color: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    LucideArrowLeft,
    LucideEdit,
    LucideTrash2,
    LucidePlus,
    LucideSave,
    LucideRotateCcw,
    LucideKanban,
    LucideList,
    LucideSearch,
    LucideFilter,
    LucideX,
    LucideCheck,
    LucideClock,
    LucideUser,
    LucideCalendar,
    LucideChevronRight,
    LucideChevronLeft,
    LucideChevronDown,
    LucideTag,
    LucideSparkles,
    LucideTable,
    LucideMessageSquare,
    LucideArrowUpDown,
    LucideEye,
    LucideLayers,
    LucideMoreHorizontal,
    LucideBot,
    LucideZap
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css'
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private fb = inject(FormBuilder);
  
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  
  // Selector de Vistas estilo Monday.com ('TABLE' por defecto, 'BOARD', 'TIMELINE', 'LIST')
  viewMode = signal<'TABLE' | 'BOARD' | 'TIMELINE' | 'LIST'>('TABLE');

  // Grupos de la Tabla Principal (Monday.com - captura de referencia)
  groups = signal<MondayGroup[]>([
    { id: 'pendientes', name: 'Pendientes', color: '#0073ea', status: 'TODO' },
    { id: 'completado', name: 'Completado', color: '#00c875', status: 'DONE' },
    { id: 'grupo_nuevo', name: 'Grupo nuevo', color: '#cab641', status: 'IN_PROGRESS' }
  ]);

  collapsedGroups = signal<Record<string, boolean>>({});
  quickTaskTitles = signal<Record<string, string>>({});
  selectedTaskIds = signal<Set<number>>(new Set());

  // Menús desplegables en línea en la celda
  activeStatusMenuTaskId = signal<number | null>(null);
  activePriorityMenuTaskId = signal<number | null>(null);

  // Sugerencias IA Modal
  isAiModalOpen = signal<boolean>(false);

  // Filtros Rápidos estilo Jira / Monday
  searchTerm = signal<string>('');
  priorityFilter = signal<string>('ALL');
  assigneeFilter = signal<string>('ALL');

  // Modal / Formulario Nueva Tarea
  isAddingTask = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  // Panel Lateral / Modal de Tarea estilo Notion
  selectedTask = signal<Task | null>(null);
  isDrawerOpen = signal<boolean>(false);
  taskSubtasks = signal<SubtaskItem[]>([]);
  newSubtaskText = signal<string>('');
  taskNotes = signal<string>('');

  taskForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    estimateHours: [1, [Validators.required, Validators.min(1)]],
    assignee: [''],
    priority: ['media'],
    status: ['TODO', Validators.required],
    dueDate: ['']
  });

  // ===========================================================================
  // COMPUTED: Métricas de Avance estilo Monday.com
  // ===========================================================================
  totalTasksCount = computed(() => this.tasks().length);
  completedTasksCount = computed(() => this.tasks().filter(t => t.status === 'DONE').length);
  inProgressTasksCount = computed(() => this.tasks().filter(t => t.status === 'IN_PROGRESS').length);
  todoTasksCount = computed(() => this.tasks().filter(t => t.status === 'TODO').length);

  progressPercentage = computed(() => {
    const total = this.totalTasksCount();
    if (total === 0) return 0;
    return Math.round((this.completedTasksCount() / total) * 100);
  });

  inProgressPercentage = computed(() => {
    const total = this.totalTasksCount();
    if (total === 0) return 0;
    return Math.round((this.inProgressTasksCount() / total) * 100);
  });

  todoPercentage = computed(() => {
    const total = this.totalTasksCount();
    if (total === 0) return 0;
    return Math.round((this.todoTasksCount() / total) * 100);
  });

  uniqueAssignees = computed(() => {
    const set = new Set<string>();
    this.tasks().forEach(t => {
      if (t.assignee && t.assignee.trim()) set.add(t.assignee.trim());
    });
    return Array.from(set).sort();
  });

  // Tareas filtradas para la vista activa
  filteredTasks = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const prio = this.priorityFilter();
    const ass = this.assigneeFilter();

    return this.tasks().filter(t => {
      const matchTerm = !term ||
        (t.title && t.title.toLowerCase().includes(term)) ||
        (t.assignee && t.assignee.toLowerCase().includes(term)) ||
        (t.id && String(t.id).includes(term));

      const matchPrio = prio === 'ALL' || (t.priority && t.priority.toLowerCase() === prio.toLowerCase());
      const matchAss = ass === 'ALL' || (t.assignee && t.assignee.trim() === ass);

      return matchTerm && matchPrio && matchAss;
    });
  });

  // Columnas Kanban estilo Trello / Jira
  todoTasks = computed(() => this.filteredTasks().filter(t => t.status === 'TODO'));
  inProgressTasks = computed(() => this.filteredTasks().filter(t => t.status === 'IN_PROGRESS'));
  doneTasks = computed(() => this.filteredTasks().filter(t => t.status === 'DONE'));

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.projectService.getAll().subscribe(projects => {
        const p = projects.find(x => x.id === id);
        this.project.set(p || null);
      });
      this.taskService.getAll().subscribe(allTasks => {
        this.tasks.set(allTasks.filter(t => t.projectId === id).reverse());
      });
    }
  }

  // ===========================================================================
  // MONDAY.COM TABLE HELPERS & ACTIONS
  // ===========================================================================
  toggleGroup(groupId: string): void {
    this.collapsedGroups.update(map => ({
      ...map,
      [groupId]: !map[groupId]
    }));
  }

  isGroupCollapsed(groupId: string): boolean {
    return !!this.collapsedGroups()[groupId];
  }

  getTasksByGroup(group: MondayGroup): Task[] {
    const all = this.filteredTasks();
    if (group.id === 'pendientes') {
      return all.filter(t => t.status === 'TODO');
    }
    if (group.id === 'completado') {
      return all.filter(t => t.status === 'DONE');
    }
    if (group.id === 'grupo_nuevo') {
      return all.filter(t => t.status === 'IN_PROGRESS');
    }
    return all.filter(t => t.status === group.status);
  }

  updateQuickTaskTitle(groupId: string, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.quickTaskTitles.update(m => ({ ...m, [groupId]: val }));
  }

  submitQuickTask(group: MondayGroup): void {
    const title = (this.quickTaskTitles()[group.id] || '').trim();
    if (!title || !this.project() || !this.project()!.id) return;

    const newTaskData: Partial<Task> = {
      title,
      estimateHours: 2,
      priority: 'media',
      status: group.status,
      projectId: this.project()!.id
    };

    this.taskService.create(this.project()!.id, newTaskData as Task).subscribe({
      next: () => {
        this.quickTaskTitles.update(m => ({ ...m, [group.id]: '' }));
        this.cargarDatos();
      },
      error: (err) => alert('Error al crear tarea: ' + err.message)
    });
  }

  addCustomGroup(): void {
    const name = prompt('Nombre del nuevo grupo:', 'Grupo nuevo');
    if (!name || !name.trim()) return;
    const colors = ['#e2445c', '#00c875', '#fdab3d', '#579bfc', '#a25ddc', '#0073ea', '#784bd1', '#ff5ac4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newGroup: MondayGroup = {
      id: 'grp_' + Date.now(),
      name: name.trim(),
      color: randomColor,
      status: 'TODO'
    };
    this.groups.update(list => [...list, newGroup]);
  }

  toggleTaskSelection(taskId: number, event: Event): void {
    event.stopPropagation();
    this.selectedTaskIds.update(set => {
      const next = new Set(set);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  isTaskSelected(taskId: number): boolean {
    return this.selectedTaskIds().has(taskId);
  }

  toggleGroupSelection(groupTasks: Task[], event: Event): void {
    event.stopPropagation();
    const ids = groupTasks.filter(t => t.id).map(t => t.id!);
    const allSelected = ids.every(id => this.selectedTaskIds().has(id));
    this.selectedTaskIds.update(set => {
      const next = new Set(set);
      if (allSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  }

  isGroupAllSelected(groupTasks: Task[]): boolean {
    const ids = groupTasks.filter(t => t.id).map(t => t.id!);
    if (ids.length === 0) return false;
    return ids.every(id => this.selectedTaskIds().has(id));
  }

  openStatusPicker(taskId: number, event: Event): void {
    event.stopPropagation();
    this.activeStatusMenuTaskId.set(this.activeStatusMenuTaskId() === taskId ? null : taskId);
    this.activePriorityMenuTaskId.set(null);
  }

  setQuickStatus(t: Task, status: 'TODO' | 'IN_PROGRESS' | 'DONE', event: Event): void {
    event.stopPropagation();
    this.activeStatusMenuTaskId.set(null);
    this.cambiarEstadoTarea(t, status);
  }

  openPriorityPicker(taskId: number, event: Event): void {
    event.stopPropagation();
    this.activePriorityMenuTaskId.set(this.activePriorityMenuTaskId() === taskId ? null : taskId);
    this.activeStatusMenuTaskId.set(null);
  }

  setQuickPriority(t: Task, priority: 'baja' | 'media' | 'alta', event: Event): void {
    event.stopPropagation();
    this.activePriorityMenuTaskId.set(null);
    if (!t.id || !t.projectId) return;
    const updated = { ...t, priority };
    this.tasks.update(list => list.map(item => item.id === t.id ? updated : item));
    this.taskService.update(t.projectId, t.id, updated).subscribe();
  }

  getGroupBudget(tasks: Task[]): string {
    const total = tasks.reduce((sum, t) => sum + ((t.estimateHours || 1) * 50), 0);
    return '$' + total.toLocaleString();
  }

  getGroupFilesCount(tasks: Task[]): number {
    return tasks.filter(t => !!t.photo || !!t.photoPreview).length;
  }

  getGroupDateRange(tasks: Task[]): string {
    const dates = tasks.filter(t => !!t.dueDate).map(t => new Date(t.dueDate!).getTime()).sort((a,b) => a - b);
    if (dates.length === 0) return '-';
    const first = new Date(dates[0]);
    const last = new Date(dates[dates.length - 1]);
    const fStr = first.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    const lStr = last.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    if (fStr === lStr) return fStr;
    return `${fStr} - ${last.getDate()}`;
  }

  getGroupStatusSegments(tasks: Task[]): { color: string, pct: number, label: string }[] {
    const total = tasks.length;
    if (total === 0) return [];
    const done = tasks.filter(t => t.status === 'DONE').length;
    const prog = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todo = tasks.filter(t => t.status === 'TODO').length;
    return [
      { color: '#00c875', pct: (done / total) * 100, label: `${done} Listo` },
      { color: '#fdab3d', pct: (prog / total) * 100, label: `${prog} En curso` },
      { color: '#e2445c', pct: (todo / total) * 100, label: `${todo} Detenido/Pendiente` }
    ].filter(s => s.pct > 0);
  }

  getGroupPrioritySegments(tasks: Task[]): { color: string, pct: number, label: string }[] {
    const total = tasks.length;
    if (total === 0) return [];
    const alta = tasks.filter(t => t.priority === 'alta').length;
    const media = tasks.filter(t => t.priority === 'media' || !t.priority).length;
    const baja = tasks.filter(t => t.priority === 'baja').length;
    return [
      { color: '#579bfc', pct: (baja / total) * 100, label: `${baja} Baja` },
      { color: '#a25ddc', pct: (media / total) * 100, label: `${media} Media` },
      { color: '#401694', pct: (alta / total) * 100, label: `${alta} Alta` }
    ].filter(s => s.pct > 0);
  }

  toggleAiModal(): void {
    this.isAiModalOpen.set(!this.isAiModalOpen());
  }

  // ===========================================================================
  // KANBAN ACTIONS (Mover tarjetas entre columnas)
  // ===========================================================================
  moverColumna(t: Task, direccion: 'next' | 'prev', event?: Event): void {
    if (event) event.stopPropagation();
    if (!t.id || !t.projectId) return;

    let nuevoEstado: 'TODO' | 'IN_PROGRESS' | 'DONE' | null = null;
    if (direccion === 'next') {
      if (t.status === 'TODO') nuevoEstado = 'IN_PROGRESS';
      else if (t.status === 'IN_PROGRESS') nuevoEstado = 'DONE';
    } else {
      if (t.status === 'DONE') nuevoEstado = 'IN_PROGRESS';
      else if (t.status === 'IN_PROGRESS') nuevoEstado = 'TODO';
    }

    if (nuevoEstado) {
      this.cambiarEstadoTarea(t, nuevoEstado);
    }
  }

  openQuickAddTask(status: 'TODO' | 'IN_PROGRESS' | 'DONE'): void {
    this.taskForm.patchValue({ status, estimateHours: 1, priority: 'media' });
    this.isAddingTask.set(true);
  }

  // ===========================================================================
  // NOTION-STYLE TASK DRAWER & CHECKLIST SUBTASKS
  // ===========================================================================
  openTaskDrawer(t: Task, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedTask.set({ ...t });
    
    // Cargar subtareas cacheadas de localStorage
    const saved = localStorage.getItem(`planix_subtasks_${t.id}`);
    this.taskSubtasks.set(saved ? JSON.parse(saved) : []);

    // Cargar notas cacheadas de localStorage
    const savedNotes = localStorage.getItem(`planix_task_notes_${t.id}`) || '';
    this.taskNotes.set(savedNotes);

    this.isDrawerOpen.set(true);
  }

  closeTaskDrawer(): void {
    this.isDrawerOpen.set(false);
    this.selectedTask.set(null);
  }

  addSubtask(): void {
    const text = this.newSubtaskText().trim();
    const task = this.selectedTask();
    if (!text || !task || !task.id) return;

    const newItem: SubtaskItem = {
      id: Date.now().toString(),
      text,
      done: false
    };

    const updated = [...this.taskSubtasks(), newItem];
    this.taskSubtasks.set(updated);
    localStorage.setItem(`planix_subtasks_${task.id}`, JSON.stringify(updated));
    this.newSubtaskText.set('');
  }

  toggleSubtask(item: SubtaskItem): void {
    const task = this.selectedTask();
    if (!task || !task.id) return;

    const updated = this.taskSubtasks().map(s => s.id === item.id ? { ...s, done: !s.done } : s);
    this.taskSubtasks.set(updated);
    localStorage.setItem(`planix_subtasks_${task.id}`, JSON.stringify(updated));
  }

  deleteSubtask(itemId: string): void {
    const task = this.selectedTask();
    if (!task || !task.id) return;

    const updated = this.taskSubtasks().filter(s => s.id !== itemId);
    this.taskSubtasks.set(updated);
    localStorage.setItem(`planix_subtasks_${task.id}`, JSON.stringify(updated));
  }

  saveDrawerNotes(): void {
    const task = this.selectedTask();
    if (!task || !task.id) return;
    localStorage.setItem(`planix_task_notes_${task.id}`, this.taskNotes());
  }

  updateDrawerTaskStatus(newStatus: string): void {
    const task = this.selectedTask();
    if (!task) return;
    this.cambiarEstadoTarea(task, newStatus);
    this.selectedTask.set({ ...task, status: newStatus as any });
  }

  updateDrawerPriority(newPriority: 'alta' | 'media' | 'baja'): void {
    const task = this.selectedTask();
    if (!task || !task.projectId || !task.id) return;

    const updated = { ...task, priority: newPriority };
    this.taskService.update(task.projectId, task.id, updated).subscribe({
      next: (res) => {
        this.selectedTask.set({ ...res });
        this.tasks.update(list => list.map(t => t.id === res.id ? res : t));
      }
    });
  }

  completedSubtasksCount = computed(() => this.taskSubtasks().filter(s => s.done).length);
  subtaskProgressPct = computed(() => {
    const total = this.taskSubtasks().length;
    if (total === 0) return 0;
    return Math.round((this.completedSubtasksCount() / total) * 100);
  });

  // ===========================================================================
  // CRUD EXISTENTE (Sin romper ninguna funcionalidad)
  // ===========================================================================
  deleteProject(): void {
    const p = this.project();
    if (!p) return;
    if (confirm(`¿Estás seguro de eliminar el proyecto "${p.name}"?`)) {
      this.isLoading.set(true);
      this.projectService.delete(p.id!).subscribe({
        next: () => {
          this.router.navigate(['/projects']);
        },
        error: (err) => {
          alert('Error al eliminar el proyecto: ' + err.message);
          this.isLoading.set(false);
        }
      });
    }
  }

  toggleAddTask(): void {
    this.isAddingTask.set(!this.isAddingTask());
    if (!this.isAddingTask()) {
      this.taskForm.reset({ status: 'TODO', estimateHours: 1, priority: 'media' });
    }
  }

  saveTask(): void {
    if (this.taskForm.invalid || !this.project()) return;
    this.isLoading.set(true);
    this.taskService.create(this.project()!.id!, this.taskForm.value).subscribe({
      next: () => {
        this.cargarDatos();
        this.toggleAddTask();
        this.isLoading.set(false);
      },
      error: (err) => {
        alert('Error al agregar tarea: ' + err.message);
        this.isLoading.set(false);
      }
    });
  }

  deleteTask(t: Task, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Eliminar la tarea "${t.title}"?`)) {
      if (!t.projectId || !t.id) return;
      this.taskService.delete(t.projectId, t.id).subscribe({
        next: () => {
          this.tasks.update(ts => ts.filter(task => task.id !== t.id));
          if (this.selectedTask()?.id === t.id) {
            this.closeTaskDrawer();
          }
        },
        error: (err) => alert('Error al eliminar tarea: ' + err.message)
      });
    }
  }

  cambiarEstadoProyecto(nuevoEstado: string): void {
    const p = this.project();
    if (!p || !p.id) return;
    
    if (nuevoEstado === 'CLOSED' && p.status !== 'CLOSED') {
      const ok = window.confirm('¿Seguro que querés marcar este proyecto como Completado? Se bloqueará su edición.');
      if (!ok) {
        this.project.set({ ...p });
        return;
      }
    }

    const estadoAnterior = p.status;
    p.status = nuevoEstado as any;

    this.projectService.update(p.id, p).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Error', err);
        p.status = estadoAnterior;
        alert('No se pudo cambiar el estado del proyecto');
      }
    });
  }

  reabrirProyecto(): void {
    const p = this.project();
    if (!p) return;
    if (confirm(`¿Estás seguro de que quieres reabrir el proyecto "${p.name}"?`)) {
      this.cambiarEstadoProyecto('ACTIVE');
    }
  }

  cambiarEstadoTarea(t: Task, nuevoEstado: string): void {
    if (!t.id || !t.projectId) return;

    if (nuevoEstado === 'DONE' && t.status !== 'DONE') {
      const ok = window.confirm('¿Seguro que querés marcar esta tarea como Hecha? Se bloqueará su edición.');
      if (!ok) {
        this.tasks.update(ts => [...ts]);
        return;
      }
    }

    const estadoAnterior = t.status;
    const updatedTask = { ...t, status: nuevoEstado as any };
    
    // Optimistic update
    this.tasks.update(ts => ts.map(item => item.id === t.id ? updatedTask : item));
    if (this.selectedTask()?.id === t.id) {
      this.selectedTask.set(updatedTask);
    }

    this.taskService.update(t.projectId, t.id, updatedTask).subscribe({
      next: () => {},
      error: (err) => {
        console.error('Error', err);
        this.tasks.update(ts => ts.map(item => item.id === t.id ? { ...t, status: estadoAnterior } : item));
        alert('No se pudo cambiar el estado de la tarea');
      }
    });
  }

  reabrirTarea(t: Task): void {
    if (confirm(`¿Estás seguro de que quieres reabrir la tarea "${t.title}"?`)) {
      this.cambiarEstadoTarea(t, 'IN_PROGRESS');
    }
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.priorityFilter.set('ALL');
    this.assigneeFilter.set('ALL');
  }
}
