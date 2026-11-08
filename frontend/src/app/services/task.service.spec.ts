import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { Task } from '../models/task.model';
import { environment } from '../../environments/environment';

// =============================================================================
// [IONIC 9 - CLASE 12: TESTING UNITARIO DE SERVICIO HTTP CON PATRÓN AAA]
// Marco Teórico de Cátedra:
// - Test doubles (HttpTestingController): Un test unitario no debe llamar a un
//   servidor real (sería lento e impredecible). HttpTestingController intercepta
//   las peticiones HTTP y nos permite simular la respuesta con `req.flush(...)`.
// - Sintaxis moderna (Angular 18-22): Usamos `provideHttpClient()` +
//   `provideHttpClientTesting()` en lugar del antiguo `HttpClientTestingModule`.
// - Patrón AAA (Arrange - Act - Assert):
//   1) Arrange: Preparar los datos simulados (mock).
//   2) Act: Ejecutar el método bajo prueba (`service.getAll()`, `create()`, `delete()`).
//   3) Assert: Verificar URL, verbo HTTP, body y respuesta con `expect(...)`.
// - `afterEach(() => httpMock.verify())`: Assert extra que confirma que no
//   quedaron peticiones HTTP colgadas sin atender.
// =============================================================================
describe('TaskService (Clase 12 - Tests Unitarios)', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // [CLASE 12] Verifica que no queden peticiones HTTP pendientes sin simular
    httpMock.verify();
  });

  it('debería obtener la lista de tareas (GET)', () => {
    // 1. Arrange
    const mockTasks: Task[] = [
      { id: 1, title: 'Test Tarea Ionic', estimateHours: 4, status: 'TODO', priority: 'alta', dueDate: '2026-11-01' }
    ];

    // 2. Act
    service.getAll().subscribe((tasks) => {
      // 3. Assert
      expect(tasks.length).toBe(1);
      expect(tasks[0].title).toBe('Test Tarea Ionic');
    });

    // 3. Assert del contrato HTTP
    const req = httpMock.expectOne(`${baseUrl}/tasks`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTasks);
  });

  it('debería enviar el body correcto al crear una tarea (POST)', () => {
    // 1. Arrange
    const nueva: Task = {
      title: 'Entregar TP Final Ionic 9',
      estimateHours: 6,
      status: 'TODO',
      priority: 'alta',
      dueDate: '2026-11-15'
    };

    // 2. Act
    service.create(1, nueva).subscribe((creada) => {
      // 3. Assert
      expect(creada.id).toBe(99);
      expect(creada.title).toBe('Entregar TP Final Ionic 9');
    });

    // 3. Assert del contrato HTTP
    const req = httpMock.expectOne(`${baseUrl}/projects/1/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('Entregar TP Final Ionic 9');
    req.flush({ id: 99, ...nueva });
  });

  it('debería eliminar una tarea por id (DELETE)', () => {
    // 1. Arrange
    const projectId = 1;
    const taskId = 5;

    // 2. Act
    service.delete(projectId, taskId).subscribe();

    // 3. Assert
    const req = httpMock.expectOne(`${baseUrl}/projects/1/tasks/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
