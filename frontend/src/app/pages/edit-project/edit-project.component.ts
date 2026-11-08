import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { LucideSave, LucideX } from '@lucide/angular';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-edit-project',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LucideSave, LucideX],
  templateUrl: './edit-project.component.html',
  styleUrls: ['./edit-project.component.css']
})
export class EditProjectComponent implements OnInit {
  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form: FormGroup;
  projectId: number = 0;

  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<boolean>(false);
  initialLoadFailed = signal<boolean>(false);

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      startDate: ['', [Validators.required]],
      endDate: [''],
      status: ['PLANNED', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.projectId = parseInt(idParam, 10);
      if (isNaN(this.projectId)) {
        this.error.set('El ID proporcionado no es numérico.');
        this.initialLoadFailed.set(true);
        this.loading.set(false);
        return;
      }
      this.cargarProyecto(this.projectId);
    } else {
      this.error.set('No se proporcionó un ID de proyecto válido.');
      this.initialLoadFailed.set(true);
      this.loading.set(false);
    }
  }

  cargarProyecto(id: number): void {
    this.projectService.getById(id).subscribe({
      next: (project: Project) => {
        this.form.patchValue({
          name: project.name,
          description: project.description || '',
          startDate: project.startDate ? project.startDate.split('T')[0] : '',
          endDate: project.endDate ? project.endDate.split('T')[0] : '',
          status: project.status
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

    this.projectService.update(this.projectId, formValue).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        setTimeout(() => {
          this.router.navigate(['/projects']);
        }, 2000);
      },
      error: (err: Error) => {
        this.saving.set(false);
        this.error.set(err.message);
      }
    });
  }
}
