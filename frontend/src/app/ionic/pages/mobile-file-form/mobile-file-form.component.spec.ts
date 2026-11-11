import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { MobileFileFormComponent } from './mobile-file-form.component';

// =============================================================================
// [REQUISITO 7 TP: PRUEBA UNITARIA PARA EL COMPONENTE DE FORMULARIO REACTIVO
//  Y TARJETA DE PREVISUALIZACIÓN INTELIGENTE]
// =============================================================================
describe('MobileFileFormComponent (Tests Unitarios - Formulario Reactivo + IA Contextual Local)', () => {
  let component: MobileFileFormComponent;
  let fixture: ComponentFixture<MobileFileFormComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    if (typeof (globalThis as any).IntersectionObserver === 'undefined') {
      (globalThis as any).IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }

    await TestBed.configureTestingModule({
      imports: [MobileFileFormComponent],
      providers: [
        provideIonicAngular(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MobileFileFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('el formulario debería iniciar inválido cuando los campos obligatorios están vacíos', () => {
    expect(component.form.invalid).toBe(true);
    expect(component.name.errors?.['required']).toBeTruthy();
    expect(component.tag.errors?.['required']).toBeTruthy();
  });

  it('el campo nombre debería fallar con menos de 3 caracteres (minLength)', () => {
    component.form.patchValue({
      name: 'AB',
      tag: 'Trabajo'
    });

    expect(component.name.invalid).toBe(true);
    expect(component.name.errors?.['minlength']).toBeTruthy();
    expect(component.form.invalid).toBe(true);
  });

  it('debería generar la sugerencia inteligente y aplicarla al procesar "scan_2026_11_08_final.pdf"', async () => {
    const file = new File(['Factura IVA'], 'scan_2026_11_08_final.pdf', {
      type: 'application/pdf'
    });

    await component.processIncomingFileLocally(file);

    expect(component.smartSuggestion()?.suggestedFullName).toBe('Factura_2026-11-08.pdf');
    expect(component.name.value).toBe('Factura_2026-11-08');
    expect(component.tag.value).toBe('Facturas');
    expect(component.form.valid).toBe(true);
  });

  it('debería marcar todos los controles como touched al intentar enviar un formulario inválido', async () => {
    component.form.patchValue({ name: '', tag: '' });

    await component.submit();

    expect(component.name.touched).toBe(true);
    expect(component.tag.touched).toBe(true);
  });

  it('debería enviar la petición POST a json-server cuando el formulario es válido', async () => {
    component.form.patchValue({
      name: 'Resumen Quimica',
      tag: 'Estudio',
      targetFormat: 'pdf',
      description: 'Parcial 1'
    });

    const submitPromise = component.submit();

    const req = httpMock.expectOne(component.fileService.apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('Resumen Quimica.pdf');
    expect(req.request.body.tag).toBe('Estudio');
    req.flush({
      ...req.request.body,
      id: 123
    });

    await submitPromise;
  });
});
