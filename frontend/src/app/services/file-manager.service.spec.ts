import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FileManagerService } from './file-manager.service';
import { ManagedFile } from '../models/managed-file.model';

// =============================================================================
// [REQUISITO 7 TP + MOTOR DE INTELIGENCIA CONTEXTUAL LOCAL]
// Verifica:
// 1. Consumo de API REST simulada (json-server en http://localhost:3000/files)
// 2. Manejo de estado de carga (loading) y actualización de signals
// 3. Estrategia de respaldo offline (fallback local) con catchError
// 4. Motor de Inteligencia Contextual Local: auto-clasificación y renombrado
//    de "scan_2026_11_08_final.pdf" a "Factura_2026-11-08.pdf" ("Facturas")
// =============================================================================
describe('FileManagerService (Tests Unitarios - API REST, Fallback Offline e IA Contextual Local)', () => {
  let service: FileManagerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        FileManagerService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(FileManagerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debería obtener la lista de archivos desde json-server (GET) y actualizar el estado', () => {
    // 1. Arrange
    const mockFiles: ManagedFile[] = [
      {
        id: 101,
        name: 'Contrato_Alquiler.pdf',
        ext: 'pdf',
        category: 'PDF',
        origin: 'UPLOADED',
        mimeType: 'application/pdf',
        size: 512000,
        createdAt: '2026-11-08T10:00:00.000Z',
        tag: 'Legal',
        availableTargets: ['txt', 'png'],
        viewUrl: '',
        downloadUrl: '',
        archived: false
      }
    ];

    // 2. Act
    service.getAll().subscribe((files: ManagedFile[]) => {
      // 3. Assert
      expect(files.length).toBe(1);
      expect(files[0].name).toBe('Contrato_Alquiler.pdf');
      expect(files[0].tag).toBe('Legal');
    });

    expect(service.loading()).toBe(true);

    const req = httpMock.expectOne(service.apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockFiles);

    expect(service.loading()).toBe(false);
    expect(service.usingOfflineFallback()).toBe(false);
    expect(service.files().length).toBe(1);
  });

  it('debería activar el fallback offline (localStorage/Preferences) si la API REST falla (catchError)', () => {
    // 1. Arrange
    const cachedFiles: ManagedFile[] = [
      {
        id: 202,
        name: 'Apuntes_Offline.pdf',
        ext: 'pdf',
        category: 'PDF',
        origin: 'UPLOADED',
        mimeType: 'application/pdf',
        size: 128000,
        createdAt: '2026-11-08T12:00:00.000Z',
        tag: 'Estudio',
        availableTargets: ['txt'],
        viewUrl: '',
        downloadUrl: '',
        archived: false
      }
    ];
    localStorage.setItem('filestudio_files_preferences_v1', JSON.stringify(cachedFiles));

    // 2. Act
    let resultFiles: ManagedFile[] = [];
    service.getAll().subscribe((files: ManagedFile[]) => {
      resultFiles = files;
    });

    const req = httpMock.expectOne(service.apiUrl);
    req.error(new ProgressEvent('Network error'), { status: 0, statusText: 'Unknown Error' });

    // 3. Assert
    expect(service.usingOfflineFallback()).toBe(true);
    expect(service.loading()).toBe(false);
    expect(resultFiles.length).toBe(1);
    expect(resultFiles[0].name).toBe('Apuntes_Offline.pdf');
  });

  it('debería normalizar "scan_2026_11_08_final.pdf" a "Factura_2026-11-08.pdf" y clasificarlo como "Facturas" de forma local', () => {
    // 1. Arrange & Act
    const analysis = service.analyzeMetadataSync('scan_2026_11_08_final.pdf', 'application/pdf');

    // 2. Assert
    expect(analysis.suggestedFullName).toBe('Factura_2026-11-08.pdf');
    expect(analysis.suggestedName).toBe('Factura_2026-11-08');
    expect(analysis.suggestedTag).toBe('Facturas');
    expect(analysis.detectedDate).toBe('2026-11-08');
    expect(analysis.isLocalPrivacyVerified).toBe(true);
  });

  it('debería registrar un nuevo archivo mediante POST en json-server', () => {
    // 1. Arrange
    const payload = {
      name: 'Factura_Internet.pdf',
      ext: 'pdf',
      category: 'PDF' as const,
      size: 204800,
      tag: 'Facturas' as const
    };

    // 2. Act
    service.createFileRecord(payload).subscribe((created: ManagedFile) => {
      expect(created.name).toBe('Factura_Internet.pdf');
      expect(created.tag).toBe('Facturas');
    });

    // 3. Assert HTTP
    const req = httpMock.expectOne(service.apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('Factura_Internet.pdf');
    expect(req.request.body.tag).toBe('Facturas');
    req.flush({
      ...req.request.body,
      id: 999
    });
  });
});
