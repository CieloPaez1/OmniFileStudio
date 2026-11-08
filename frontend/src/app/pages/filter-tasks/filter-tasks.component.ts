import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { LucideSearch, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-filter-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideSearch, LucideX],
  templateUrl: './filter-tasks.component.html'
})
export class FilterTasksComponent {

  private taskService = inject(TaskService);
  private fb = inject(FormBuilder);

  tasks = signal<Task[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  searched = signal<boolean>(false);

  form: FormGroup = this.fb.group({
    minEstimate: [null, [Validators.min(1)]],
    assignee: ['']
  });

  buscar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.searched.set(false);

    const { minEstimate, assignee } = this.form.value;

    this.taskService.filter(minEstimate, assignee).subscribe({
      next: (data) => {
        this.tasks.set(data);
        this.searched.set(true);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  limpiar(): void {
    this.form.reset();
    this.tasks.set([]);
    this.searched.set(false);
    this.error.set(null);
  }
}