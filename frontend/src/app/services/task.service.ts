import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Task } from '../models/task.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/projects`;
  private tasksUrl = `${environment.apiUrl}/tasks`;

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(this.tasksUrl).pipe(
      catchError(this.handleError)
    );
  }

  getByProject(projectId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/${projectId}/tasks`).pipe(
      catchError(this.handleError)
    );
  }

  filter(minEstimate?: number, assignee?: string): Observable<Task[]> {
    let params = new HttpParams();
    if (minEstimate != null) params = params.set('minEstimate', minEstimate.toString());
    if (assignee) params = params.set('assignee', assignee);

    return this.http.get<Task[]>(this.tasksUrl, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getById(projectId: number, taskId: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${projectId}/tasks/${taskId}`).pipe(
      catchError(this.handleError)
    );
  }

  create(projectId: number, task: Task): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/${projectId}/tasks`, task).pipe(
      catchError(this.handleError)
    );
  }

  update(projectId: number, taskId: number, task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${projectId}/tasks/${taskId}`, task).pipe(
      catchError(this.handleError)
    );
  }

  delete(projectId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${projectId}/tasks/${taskId}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Error desconocido';
    const serverMessage = typeof error.error === 'string' ? error.error : error.error?.message;

    if (error.status === 0) message = 'No se pudo conectar al servidor.';
    else if (error.status === 400) message = serverMessage ?? 'Datos inválidos.';
    else if (error.status === 404) message = 'Proyecto/Tarea no encontrado.';
    else if (error.status === 409) message = serverMessage ?? 'Conflicto de negocio.';
    else if (error.status === 500) message = serverMessage ?? 'Error interno del servidor.';

    return throwError(() => new Error(message));
  }
}
