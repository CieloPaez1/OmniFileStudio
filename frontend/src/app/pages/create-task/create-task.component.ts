import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { Task } from '../../models/task.model';
import { Project } from '../../models/project.model';
import { LucideSave, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideSave, LucideX],
  templateUrl: './create-task.component.html',
  styleUrl: './create-task.component.css'
})
export class CreateTaskComponent implements OnInit {

  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private fb = inject(FormBuilder);

  projects = signal<Project[]>([]);
  activeProjects = computed(() => this.projects().filter(p => p.status !== 'CLOSED'));
  tasks = signal<Task[]>([]);
  recentTasks = computed(() => [...this.tasks()].reverse().slice(0, 5));
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    projectId: ['', [Validators.required]],
    title: ['', [Validators.required]],
    estimateHours: [null, [Validators.required, Validators.min(1)]],
    assignee: [''],
    status: ['', [Validators.required]],
    dueDate: ['']
  });

  ngOnInit(): void {
    this.cargarProyectos();
    this.cargarTareas();
  }

  cargarProyectos(): void {
    this.projectService.getAll().subscribe({
      next: (data) => this.projects.set(data),
      error: () => this.projects.set([])
    });
  }

  cargarTareas(): void {
    this.taskService.getAll().subscribe({
      next: (data) => this.tasks.set(data),
      error: () => this.tasks.set([])
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const { projectId, ...taskData } = this.form.value;

    this.taskService.create(projectId, taskData as Task).subscribe({
      next: (created) => {
        this.tasks.update(list => [...list, created]);
        this.form.reset({ status: '', projectId: '', assignee: '', dueDate: '' });
        this.success.set('Tarea creada correctamente.');
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  cancelar(): void {
    this.form.reset({ status: '', projectId: '', assignee: '', dueDate: '' });
    this.error.set(null);
    this.success.set(null);
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }
}