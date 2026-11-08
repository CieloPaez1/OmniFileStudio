import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Project } from '../models/project.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/projects`;

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  create(project: Project): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project).pipe(
      catchError(this.handleError)
    );
  }

  update(id: number, project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/${id}`, project).pipe(
      catchError(this.handleError)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Error desconocido';
    const serverMessage = typeof error.error === 'string' ? error.error : error.error?.message;
    
    if (error.status === 0) message = 'No se pudo conectar al servidor.';
    else if (error.status === 400) message = serverMessage ?? 'Datos inválidos.';
    else if (error.status === 404) message = 'Proyecto no encontrado.';
    else if (error.status === 409) message = serverMessage ?? 'Conflicto: nombre duplicado o regla de negocio.';
    else if (error.status === 500) message = serverMessage ?? 'Error interno del servidor.';
    
    return throwError(() => new Error(message));
  }
}
