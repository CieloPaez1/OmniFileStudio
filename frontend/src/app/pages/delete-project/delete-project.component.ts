import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { LucideTrash2 } from '@lucide/angular';

@Component({
  selector: 'app-delete-project',
  standalone: true,
  imports: [CommonModule, LucideTrash2],
  templateUrl: './delete-project.component.html'
})
export class DeleteProjectComponent implements OnInit {

  private projectService = inject(ProjectService);

  projects = signal<Project[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarProyectos();
  }

  cargarProyectos(): void {
    this.projectService.getAll().subscribe({
      next: (data) => this.projects.set(data),
      error: () => this.projects.set([])
    });
  }

  eliminar(id: number): void {
    const confirmado = confirm('¿Estás segura de que querés eliminar este proyecto?');
    if (!confirmado) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.projectService.delete(id).subscribe({
      next: () => {
        this.projects.update(list => list.filter(p => p.id !== id));
        this.success.set('Proyecto eliminado correctamente.');
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}