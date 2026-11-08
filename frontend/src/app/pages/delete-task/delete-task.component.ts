import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { Task } from '../../models/task.model';
import { Project } from '../../models/project.model';
import { LucideTrash2 } from '@lucide/angular';

@Component({
  selector: 'app-delete-task',
  standalone: true,
  imports: [CommonModule, LucideTrash2],
  templateUrl: './delete-task.component.html'
})
export class DeleteTaskComponent implements OnInit {

  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);

  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarTareas();
    this.cargarProyectos();
  }

  cargarTareas(): void {
    this.taskService.getAll().subscribe({
      next: (data) => this.tasks.set(data),
      error: () => this.tasks.set([])
    });
  }

  cargarProyectos(): void {
    this.projectService.getAll().subscribe({
      next: (data) => this.projects.set(data),
      error: () => this.projects.set([])
    });
  }

  getNombreProyecto(projectId: number): string {
    return this.projects().find(p => p.id === projectId)?.name ?? '-';
  }

  eliminar(projectId: number, taskId: number): void {
    const confirmado = confirm('¿Estás segura de que querés eliminar esta tarea?');
    if (!confirmado) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.taskService.delete(projectId, taskId).subscribe({
      next: () => {
        this.tasks.update(list => list.filter(t => t.id !== taskId));
        this.success.set('Tarea eliminada correctamente.');
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}