import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { LucideSave, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-edit-task',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideSave, LucideX],
  templateUrl: './edit-task.component.html',
  styleUrls: ['./edit-task.component.css']
})
export class EditTaskComponent implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form: FormGroup;
  projectId: number = 0;
  taskId: number = 0;

  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<boolean>(false);
  initialLoadFailed = signal<boolean>(false);

  constructor() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      estimateHours: [0, [Validators.required, Validators.min(1)]],
      assignee: ['', [Validators.maxLength(100)]],
      status: ['TODO', [Validators.required]],
      dueDate: ['']
    });
  }

  ngOnInit(): void {
    const projParam = this.route.snapshot.paramMap.get('projectId');
    const taskParam = this.route.snapshot.paramMap.get('taskId');
    
    if (projParam && taskParam) {
      this.projectId = parseInt(projParam, 10);
      this.taskId = parseInt(taskParam, 10);
      this.cargarTarea(this.projectId, this.taskId);
    } else {
      this.error.set('No se proporcionaron IDs válidos en la ruta.');
      this.initialLoadFailed.set(true);
      this.loading.set(false);
    }
  }

  cargarTarea(projectId: number, taskId: number): void {
    this.taskService.getById(projectId, taskId).subscribe({
      next: (task) => {
        this.form.patchValue({
          title: task.title,
          estimateHours: task.estimateHours,
          assignee: task.assignee || '',
          status: task.status,
          dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
        });
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.initialLoadFailed.set(true);
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);

    const formValue = this.form.value;

    this.taskService.update(this.projectId, this.taskId, formValue).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        setTimeout(() => {
          this.router.navigate(['/projects', this.projectId]);
        }, 2000);
      },
      error: (err: Error) => {
        this.saving.set(false);
        this.error.set(err.message);
      }
    });
  }
}
