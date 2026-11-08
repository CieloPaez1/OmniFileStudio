import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../services/project.service';
import { TaskService } from '../../../services/task.service';
import { Project } from '../../../models/project.model';
import { LucideFolderKanban, LucideEdit, LucideTrash2, LucidePlus, LucideSearch, LucideRotateCcw } from '@lucide/angular';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideFolderKanban, LucideEdit, LucideTrash2, LucidePlus, LucideSearch, LucideRotateCcw],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectListComponent implements OnInit {

  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  projects = signal<Project[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  filter = signal<string | null>(null);
  searchTerm = signal<string>('');
  statusFilter = signal<string>('ALL');

  filteredProjects = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.statusFilter();
    let result = this.projects();

    if (status !== 'ALL') {
      result = result.filter(p => p.status === status);
    }

    if (term) {
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(term)) || 
        (p.description && p.description.toLowerCase().includes(term))
      );
    }

    return result;
  });

  ngOnInit(): void {
    this.filter.set(this.route.snapshot.queryParamMap.get('filter'));
    this.cargarProyectos();
  }

  cargarProyectos(): void {
    this.loading.set(true);
    forkJoin({
      projects: this.projectService.getAll(),
      tasks: this.taskService.getAll()
    }).subscribe({
      next: (res) => {
        let filteredProjects = res.projects;
        const filter = this.route.snapshot.queryParamMap.get('filter');
        
        if (filter === 'empty') {
          const projectIdsWithTasks = new Set(res.tasks.map(t => t.projectId));
          filteredProjects = filteredProjects.filter(p => p.id && !projectIdsWithTasks.has(p.id));
        }

        this.projects.set(filteredProjects.reverse());
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  reabrirProyecto(p: Project): void {
    if (confirm(`¿Estás seguro de que quieres reabrir el proyecto "${p.name}"?`)) {
      this.cambiarEstado(p, 'ACTIVE');
    }
  }

  eliminarProyecto(p: Project): void {
    if (!p.id) return;
    if (confirm(`¿Estás seguro de que quieres eliminar el proyecto "${p.name}"?`)) {
      this.projectService.delete(p.id).subscribe({
        next: () => {
          this.projects.update(ps => ps.filter(proj => proj.id !== p.id));
        },
        error: (err: Error) => alert('Error al eliminar el proyecto: ' + err.message)
      });
    }
  }

  goToEdit(p: Project, event: Event): void {
    event.stopPropagation();
    if (p.id && p.status !== 'CLOSED') {
      this.router.navigate(['/projects/edit', p.id]);
    }
  }

  cambiarEstado(p: Project, nuevoEstado: string): void {
    if (!p.id) return;
    
    if (nuevoEstado === 'CLOSED' && p.status !== 'CLOSED') {
      const ok = window.confirm('¿Seguro que querés marcar este proyecto como Completado? Se bloqueará su edición.');
      if (!ok) {
        this.projects.update(ps => [...ps]);
        return;
      }
    }

    // Optimistic UI update
    const estadoAnterior = p.status;
    p.status = nuevoEstado as any;

    this.projectService.update(p.id, p).subscribe({
      next: () => {
        // Al actualizar, se podrían recargar los proyectos si es necesario, 
        // pero la vista optimista ya actualizó la fila.
      },
      error: (err) => {
        console.error('Error cambiando estado', err);
        p.status = estadoAnterior; // rollback
        alert('No se pudo cambiar el estado');
      }
    });
  }

}
