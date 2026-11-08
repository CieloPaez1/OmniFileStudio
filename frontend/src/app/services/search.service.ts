import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private cachedData$: Observable<[Project[], Task[]]> | null = null;

  private getData(): Observable<[Project[], Task[]]> {
    if (!this.cachedData$) {
      this.cachedData$ = combineLatest([
        this.http.get<Project[]>(`${this.apiUrl}/projects`).pipe(catchError(() => of([]))),
        this.http.get<Task[]>(`${this.apiUrl}/tasks`).pipe(catchError(() => of([])))
      ]).pipe(shareReplay(1));
    }
    return this.cachedData$;
  }

  search(query: string): Observable<{ projects: Project[]; tasks: Task[] }> {
    if (!query.trim()) return of({ projects: [], tasks: [] });

    const q = this.normalize(query);

    return this.getData().pipe(
      map(([projects, tasks]) => ({
        projects: projects
          .filter(p => this.projectMatches(p, q))
          .sort((a, b) => this.projectScore(b, q) - this.projectScore(a, q))
          .slice(0, 3),
        tasks: tasks
          .filter(t => this.taskMatches(t, q))
          .sort((a, b) => this.taskScore(b, q) - this.taskScore(a, q))
          .slice(0, 3)
      }))
    );
  }

  private projectMatches(project: Project, query: string): boolean {
    return [
      project.name,
      project.status,
      project.description,
      this.statusLabel(project.status)
    ].some(value => this.includes(value, query));
  }

  private taskMatches(task: Task, query: string): boolean {
    return [
      task.title,
      task.assignee,
      task.status,
      task.projectName,
      this.statusLabel(task.status)
    ].some(value => this.includes(value, query));
  }

  private projectScore(project: Project, query: string): number {
    return this.score(project.name, query, 3) +
      this.score(project.description, query, 2) +
      this.score(project.status, query, 1) +
      this.score(this.statusLabel(project.status), query, 1);
  }

  private taskScore(task: Task, query: string): number {
    return this.score(task.title, query, 3) +
      this.score(task.projectName, query, 2) +
      this.score(task.assignee, query, 2) +
      this.score(task.status, query, 1) +
      this.score(this.statusLabel(task.status), query, 1);
  }

  private score(value: string | undefined, query: string, weight: number): number {
    const text = this.normalize(value);
    if (!text) return 0;
    if (text === query) return weight * 100;
    if (text.startsWith(query)) return weight * 50;
    if (text.includes(query)) return weight * 10;
    return 0;
  }

  private includes(value: string | undefined, query: string): boolean {
    return this.normalize(value).includes(query);
  }

  private normalize(value: string | undefined): string {
    return (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private statusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      TODO: 'por hacer pendiente',
      IN_PROGRESS: 'en progreso progreso',
      DONE: 'hecho hecha terminado finalizado',
      PLANNED: 'planificado pendiente',
      ACTIVE: 'activo en progreso',
      CLOSED: 'cerrado terminado finalizado'
    };

    return labels[status ?? ''] ?? '';
  }
}
