import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { MobileTaskFormComponent } from './mobile-task-form.component';
import { environment } from '../../../../environments/environment';

// =============================================================================
// [IONIC 9 - CLASE 12: TESTING UNITARIO DE COMPONENTE STANDALONE Y FORMULARIO]
// Marco Teórico de Cátedra:
// - Testear componentes standalone es directo: como el componente ya declara
//   sus dependencias en `imports`, alcanza con importarlo en el `TestBed`.
// - Priorizamos testear la lógica de negocio: las reglas de validación del
//   formulario reactivo (inválido sin título, válido con datos completos) y
//   que `submit()` ejecute `markAllAsTouched()` cuando el formulario es inválido.
// =============================================================================
describe('MobileTaskFormComponent (Clase 12 - Validación de Formulario Reactivo)', () => {
  let component: MobileTaskFormComponent;
  let fixture: ComponentFixture<MobileTaskFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    if (typeof ( globalThis as any ).IntersectionObserver === 'undefined') {
      ( globalThis as any ).IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }

    await TestBed.configureTestingModule({
      imports: [MobileTaskFormComponent],
      providers: [
        provideIonicAngular(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MobileTaskFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    // Atendemos la petición inicial de proyectos que lanza ngOnInit()
    const req = httpMock.expectOne(`${environment.apiUrl}/projects`);
    req.flush([{ id: 1, name: 'Proyecto Demo', startDate: '2026-01-01', endDate: '2026-12-31', status: 'ACTIVE' }]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('el formulario debería ser inválido sin título', () => {
    // Arrange & Act
    component.form.patchValue({ title: '' });

    // Assert
    expect(component.form.invalid).toBe(true);
    expect(component.title.errors?.['required']).toBeTruthy();
  });

  it('el formulario debería ser válido con datos correctos', () => {
    // Arrange & Act
    component.form.patchValue({
      title: 'Entregar informe',
      projectId: 1,
      estimateHours: 4,
      dueDate: new Date().toISOString(),
      priority: 'alta'
    });

    // Assert
    expect(component.form.valid).toBe(true);
  });

  it('debería marcar todos los controles como touched al enviar datos inválidos (Desafío Clase 12)', () => {
    // Arrange
    component.form.patchValue({ title: '' });

    // Act
    component.submit();

    // Assert
    expect(component.title.touched).toBe(true);
  });
});
