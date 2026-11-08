import { Pipe, PipeTransform } from '@angular/core';
import { Project } from '../models/project.model';

@Pipe({
  name: 'projectStatus',
  standalone: true
})
export class ProjectStatusPipe implements PipeTransform {
  transform(status: Project['status'] | string | undefined): string {
    const labels: Record<string, string> = {
      PLANNED: 'Planificado',
      ACTIVE: 'En proceso',
      CLOSED: 'Terminado'
    };

    return labels[status ?? ''] ?? status ?? '';
  }
}
