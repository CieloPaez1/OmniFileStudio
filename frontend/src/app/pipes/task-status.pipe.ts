import { Pipe, PipeTransform } from '@angular/core';
import { Task } from '../models/task.model';

@Pipe({
  name: 'taskStatus',
  standalone: true
})
export class TaskStatusPipe implements PipeTransform {
  transform(status: Task['status'] | string | undefined): string {
    const labels: Record<string, string> = {
      TODO: 'Por hacer',
      IN_PROGRESS: 'En proceso',
      DONE: 'Hecha'
    };

    return labels[status ?? ''] ?? status ?? '';
  }
}
