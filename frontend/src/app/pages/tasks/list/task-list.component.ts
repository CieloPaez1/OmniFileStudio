import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../services/task.service';
import { ProjectService } from '../../../services/project.service';
import { Task } from '../../../models/task.model';
import { Project } from '../../../models/project.model';
import {
  LucideEdit,
  LucideTrash2,
  LucideSearch,
  LucideRotateCcw,
  LucideKanban,
  LucideList,
  LucideFilter,
  LucideX,
  LucideCheck,
  LucideClock,
  LucideCalendar,
  LucideChevronRight,
  LucideChevronLeft,
  LucideUser,
  LucideTag,
  LucideFolder
} from '@lucide/angular';
import { forkJoin } from 'rxjs';

export interface TaskSubtaskItem {
  id: string;
  text: string;
  done: boolean;
}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideEdit,
    LucideTrash2,
    LucideSearch,
    LucideRotateCcw,
    LucideKanban,
    LucideList,
    LucideFilter,
    LucideX,
    LucideCheck,
    LucideClock,
    LucideCalendar,
    LucideChevronRight,
    LucideChevronLeft,
    LucideUser,
    LucideTag,
    LucideFolder
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  filter = signal<string | null>(null);

  // 1. Selector de Vistas Asana ('LIST' o 'BOARD')
  viewMode = signal<'LIST' | 'BOARD'>('LIST');

  // 2. Filtros estilo Jira
  searchTerm = signal<string>('');
  statusFilter = signal<string>('ALL');
  priorityFilter = signal<string>('ALL');
  projectFilter = signal<string>('ALL');

  // 3. Notion-style Task Drawer
  selectedTask = signal<Task | null>(null);
  isDrawerOpen = signal<boolean>(false);
  taskSubtasks = signal<TaskSubtaskItem[]>([]);
  newSubtaskText = signal<string>('');
  taskNotes = signal<string>('');

  // Monday.com Progress Metrics
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
    return Math.max(0, 100 - this.progressPercentage() - this.inProgressPercentage());
  });

  filteredTasks = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    const prio = this.priorityFilter();
    const projId = this.projectFilter();
    let result = this.tasks();

    if (status !== 'ALL') {
      result = result.filter(t => t.status === status);
    }

    if (prio !== 'ALL') {
      result = result.filter(t => t.priority && t.priority.toLowerCase() === prio.toLowerCase());
    }

    if (projId !== 'ALL') {
      result = result.filter(t => t.projectId === Number(projId));
    }

    if (term) {
      result = result.filter(t => 
        (t.title && t.title.toLowerCase().includes(term)) || 
        (t.assignee && t.assignee.toLowerCase().includes(term)) ||
        (this.getProjectName(t.projectId).toLowerCase().includes(term)) ||
        (t.id && String(t.id).includes(term))
      );
    }

    return result;
  });

  // Columnas Kanban
  todoTasks = computed(() => this.filteredTasks().filter(t => t.status === 'TODO'));
  inProgressTasks = computed(() => this.filteredTasks().filter(t => t.status === 'IN_PROGRESS'));
  doneTasks = computed(() => this.filteredTasks().filter(t => t.status === 'DONE'));

  ngOnInit(): void {
    const routeFilter = this.route.snapshot.queryParamMap.get('filter');
    this.filter.set(routeFilter);
    if (routeFilter === 'todo') {
      this.statusFilter.set('TODO');
    }
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      projects: this.projectService.getAll(),
      tasks: this.taskService.getAll()
    }).subscribe({
      next: (result) => {
        this.projects.set(result.projects);
        
        let fetchedTasks = result.tasks.reverse();
        if (this.filter() === 'unassigned') {
          fetchedTasks = fetchedTasks.filter(t => !t.assignee || t.assignee.trim() === '');
        }
        this.tasks.set(fetchedTasks);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  getProjectName(projectId: number | undefined): string {
    if (!projectId) return 'Desconocido';
    return this.projects().find(p => p.id === projectId)?.name || 'Desconocido';
  }

  // ===========================================================================
  // KANBAN ACTIONS
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
      this.cambiarEstado(t, nuevoEstado);
    }
  }

  // ===========================================================================
  // NOTION-STYLE TASK DRAWER & CHECKLIST SUBTASKS
  // ===========================================================================
  openTaskDrawer(t: Task, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedTask.set({ ...t });
    
    // Cargar subtareas
    const saved = localStorage.getItem(`planix_subtasks_${t.id}`);
    this.taskSubtasks.set(saved ? JSON.parse(saved) : []);

    // Cargar notas
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

    const newItem: TaskSubtaskItem = {
      id: Date.now().toString(),
      text,
      done: false
    };

    const updated = [...this.taskSubtasks(), newItem];
    this.taskSubtasks.set(updated);
    localStorage.setItem(`planix_subtasks_${task.id}`, JSON.stringify(updated));
    this.newSubtaskText.set('');
  }

  toggleSubtask(item: TaskSubtaskItem): void {
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
    this.cambiarEstado(task, newStatus);
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

  reabrirTarea(t: Task): void {
    if (confirm(`¿Estás seguro de que quieres reabrir la tarea "${t.title}"?`)) {
      this.cambiarEstado(t, 'IN_PROGRESS');
    }
  }

  eliminarTarea(t: Task, event?: Event): void {
    if (event) event.stopPropagation();
    if (!t.id || !t.projectId) return;
    if (confirm(`¿Estás seguro de que quieres eliminar la tarea "${t.title}"?`)) {
      this.taskService.delete(t.projectId, t.id).subscribe({
        next: () => {
          this.tasks.update(ts => ts.filter(task => task.id !== t.id));
          if (this.selectedTask()?.id === t.id) {
            this.closeTaskDrawer();
          }
        },
        error: (err: Error) => alert('Error al eliminar la tarea: ' + err.message)
      });
    }
  }

  goToEdit(t: Task, event: Event): void {
    event.stopPropagation();
    if (t.projectId && t.id && t.status !== 'DONE') {
      this.router.navigate(['/projects', t.projectId, 'tasks', 'edit', t.id]);
    }
  }

  cambiarEstado(t: Task, nuevoEstado: string): void {
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
        console.error('Error cambiando estado', err);
        this.tasks.update(ts => ts.map(item => item.id === t.id ? { ...t, status: estadoAnterior } : item));
        alert('No se pudo cambiar el estado de la tarea');
      }
    });
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('ALL');
    this.priorityFilter.set('ALL');
    this.projectFilter.set('ALL');
  }
}
