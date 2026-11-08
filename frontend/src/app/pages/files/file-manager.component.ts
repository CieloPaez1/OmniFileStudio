import { Component, OnInit, OnDestroy, inject, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FileManagerService } from '../../services/file-manager.service';
import { ManagedFile, CameraPhotoItem } from '../../models/managed-file.model';

export type FileWorkspaceTab = 'library' | 'converter' | 'camera' | 'merge' | 'split';

@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.css']
})
export class FileManagerComponent implements OnInit, OnDestroy {
  readonly fileService = inject(FileManagerService);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  // Pestaña activa del espacio de trabajo
  activeTab = signal<FileWorkspaceTab>('library');

  // Filtros de Biblioteca
  selectedCategory = signal<string>('ALL');
  searchQuery = signal<string>('');
  statusMessage = signal<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal de Vista Previa
  previewFile = signal<ManagedFile | null>(null);
  previewSafeUrl = signal<SafeResourceUrl | null>(null);

  // Estado Conversor Universal
  convSourceFile = signal<File | null>(null);
  convSourceRecordId = signal<number | null>(null);
  convTargetFormat = signal<string>('pdf');
  convQuality = signal<number>(90);
  convWidth = signal<number | null>(null);
  convHeight = signal<number | null>(null);
  convLoading = signal<boolean>(false);
  convResult = signal<ManagedFile | null>(null);

  // Estado Cámara y Fotos a PDF
  cameraActive = signal<boolean>(false);
  private mediaStream: MediaStream | null = null;
  photoQueue = signal<CameraPhotoItem[]>([]);
  cameraSelectedLibraryId = signal<number | null>(null);
  cameraPdfTitle = signal<string>('Escaneo_Documento');
  cameraPageSize = signal<'A4' | 'LETTER' | 'FIT'>('A4');
  cameraOrientation = signal<'portrait' | 'landscape'>('portrait');
  cameraMargin = signal<number>(24);
  cameraGenerating = signal<boolean>(false);
  cameraResult = signal<ManagedFile | null>(null);

  // Estado Unir PDFs
  mergeQueueIds = signal<number[]>([]);
  mergeSelectedId = signal<number | null>(null);
  mergeOutputTitle = signal<string>('PDF_Unido');
  mergeLoading = signal<boolean>(false);
  mergeResult = signal<ManagedFile | null>(null);

  // Estado Dividir / Extraer PDF
  splitSourceId = signal<number | null>(null);
  splitRanges = signal<string>('1');
  splitMode = signal<'extract-single' | 'split-multiple'>('extract-single');
  splitOutputTitle = signal<string>('PDF_Extraido');
  splitPageRotationPage = signal<number>(1);
  splitPageRotationDeg = signal<number>(90);
  splitRotations = signal<Record<number, number>>({});
  splitLoading = signal<boolean>(false);
  splitResultFiles = signal<ManagedFile[]>([]);
  splitResultZip = signal<ManagedFile | null>(null);

  // Computed signals
  readonly files = this.fileService.files;
  readonly pdfFiles = this.fileService.pdfFiles;
  readonly imageFiles = this.fileService.imageFiles;

  readonly filteredFiles = computed(() => {
    const cat = this.selectedCategory();
    const q = this.searchQuery().toLowerCase().trim();
    return this.files().filter(f => {
      if (cat === 'CONVERTED') {
        if (f.origin === 'UPLOADED') return false;
      } else if (cat !== 'ALL' && f.category !== cat) {
        return false;
      }
      if (q && !f.name.toLowerCase().includes(q) && !f.ext.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  });

  readonly availableConverterTargets = computed<string[]>(() => {
    const uploaded = this.convSourceFile();
    if (uploaded) {
      const ext = uploaded.name.split('.').pop()?.toLowerCase() || '';
      return this.getTargetsForExt(ext);
    }
    const id = this.convSourceRecordId();
    if (id) {
      const rec = this.files().find(f => f.id === id);
      if (rec) return rec.availableTargets;
    }
    return ['pdf', 'png', 'jpg', 'csv', 'json', 'html', 'txt'];
  });

  readonly mergeQueueFiles = computed<ManagedFile[]>(() => {
    const all = this.files();
    return this.mergeQueueIds()
      .map(id => all.find(f => f.id === id))
      .filter((f): f is ManagedFile => !!f);
  });

  readonly selectedSplitFile = computed<ManagedFile | null>(() => {
    const id = this.splitSourceId();
    return this.files().find(f => f.id === id) || null;
  });

  ngOnInit(): void {
    this.fileService.getAll().subscribe();
  }

  ngOnDestroy(): void {
    this.stopWebcam();
  }

  setTab(tab: FileWorkspaceTab): void {
    this.activeTab.set(tab);
    if (tab !== 'camera') {
      this.stopWebcam();
    }
  }

  private notify(text: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.statusMessage.set({ text, type });
    setTimeout(() => {
      if (this.statusMessage()?.text === text) {
        this.statusMessage.set(null);
      }
    }, 4500);
  }

  // ==================== 1. BIBLIOTECA Y SUBIDA ====================

  onUploadFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.uploadFileList(input.files);
    input.value = '';
  }

  onDropFiles(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files?.length) {
      this.uploadFileList(event.dataTransfer.files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private uploadFileList(fileList: FileList): void {
    this.notify(`Subiendo ${fileList.length} archivo(s)...`, 'info');
    this.fileService.upload(fileList).subscribe({
      next: created => {
        this.notify(`¡${created.length} archivo(s) subidos al gestor!`, 'success');
      },
      error: () => {
        this.notify('Error al subir archivos. Verificá que el Backend (puerto 8080) esté activo.', 'error');
      }
    });
  }

  openPreview(file: ManagedFile): void {
    this.previewFile.set(file);
    this.previewSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(file.viewUrl));
  }

  closePreview(): void {
    this.previewFile.set(null);
    this.previewSafeUrl.set(null);
  }

  renameFilePrompt(file: ManagedFile): void {
    const nextName = window.prompt('Nuevo nombre para el archivo:', file.name);
    if (!nextName || !nextName.trim()) return;
    this.fileService.rename(file.id, nextName.trim()).subscribe({
      next: () => this.notify('Nombre actualizado correctamente.', 'success'),
      error: () => this.notify('No se pudo renombrar el archivo.', 'error')
    });
  }

  deleteFile(file: ManagedFile): void {
    this.fileService.delete(file.id).subscribe({
      next: () => this.notify(`"${file.name}" eliminado.`, 'info'),
      error: () => this.notify('No se pudo eliminar el archivo.', 'error')
    });
  }

  // ==================== 2. CONVERSOR UNIVERSAL ====================

  sendToConverter(file: ManagedFile): void {
    this.convSourceFile.set(null);
    this.convSourceRecordId.set(file.id);
    const targets = file.availableTargets;
    if (targets.length > 0) {
      this.convTargetFormat.set(targets[0]);
    }
    this.convResult.set(null);
    this.setTab('converter');
  }

  onConverterFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    this.convSourceFile.set(f);
    this.convSourceRecordId.set(null);
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    const targets = this.getTargetsForExt(ext);
    if (targets.length > 0) {
      this.convTargetFormat.set(targets[0]);
    }
  }

  onConverterRecordSelected(idValue: string): void {
    const id = Number(idValue);
    if (!id) {
      this.convSourceRecordId.set(null);
      return;
    }
    this.convSourceFile.set(null);
    this.convSourceRecordId.set(id);
    const rec = this.files().find(f => f.id === id);
    if (rec && rec.availableTargets.length > 0) {
      this.convTargetFormat.set(rec.availableTargets[0]);
    }
  }

  runConversion(): void {
    const file = this.convSourceFile();
    const fileId = this.convSourceRecordId();
    const targetFormat = this.convTargetFormat();

    if (!file && !fileId) {
      this.notify('Elegí o subí un archivo primero.', 'error');
      return;
    }

    this.convLoading.set(true);
    this.convResult.set(null);

    this.fileService
      .convert({
        file,
        fileId,
        targetFormat,
        quality: this.convQuality(),
        width: this.convWidth(),
        height: this.convHeight()
      })
      .subscribe({
        next: converted => {
          this.convLoading.set(false);
          this.convResult.set(converted);
          this.notify(`Archivo convertido a .${converted.ext.toUpperCase()} con éxito.`, 'success');
        },
        error: err => {
          this.convLoading.set(false);
          this.notify(err?.error || 'Error al convertir el archivo.', 'error');
        }
      });
  }

  private getTargetsForExt(ext: string): string[] {
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
      return ['pdf', 'png', 'jpg', 'bmp', 'gif'].filter(f => f !== ext);
    }
    if (['csv', 'json'].includes(ext)) {
      return ['pdf', 'csv', 'json', 'html', 'txt'].filter(f => f !== ext);
    }
    if (['txt', 'md', 'html', 'htm'].includes(ext)) {
      return ['pdf', 'html', 'txt', 'md'].filter(f => f !== ext);
    }
    if (ext === 'pdf') {
      return ['txt', 'html'];
    }
    return ['pdf', 'txt'];
  }

  // ==================== 3. CÁMARA Y FOTOS A PDF ====================

  async captureWithCapacitorCamera(): Promise<void> {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 88
      });
      if (photo.dataUrl) {
        this.photoQueue.update(list => [
          ...list,
          {
            id: crypto.randomUUID(),
            name: `Camara_${list.length + 1}.jpg`,
            dataUrl: photo.dataUrl!,
            rotation: 0
          }
        ]);
        this.notify('Foto capturada y agregada al PDF.', 'success');
      }
    } catch {
      // Fallback a cámara web en vivo si se cancela o no está disponible el modal de Capacitor
      this.startWebcam();
    }
  }

  async startWebcam(): Promise<void> {
    try {
      this.stopWebcam();
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      this.cameraActive.set(true);
      setTimeout(() => {
        if (this.videoElement?.nativeElement && this.mediaStream) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
        }
      }, 50);
    } catch {
      this.notify('No se pudo abrir la cámara web. Podés subir fotos desde tu dispositivo.', 'error');
    }
  }

  stopWebcam(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    this.cameraActive.set(false);
  }

  takeWebcamSnapshot(): void {
    const video = this.videoElement?.nativeElement;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    this.photoQueue.update(list => [
      ...list,
      {
        id: crypto.randomUUID(),
        name: `Foto_${list.length + 1}.jpg`,
        dataUrl,
        rotation: 0
      }
    ]);
    this.notify('📸 Foto capturada y sumada a la cola del PDF.', 'success');
  }

  onAddPhotosFromDisk(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          this.photoQueue.update(list => [
            ...list,
            {
              id: crypto.randomUUID(),
              name: file.name,
              dataUrl: reader.result as string,
              rotation: 0
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  rotatePhoto(index: number): void {
    this.photoQueue.update(list =>
      list.map((item, i) =>
        i === index ? { ...item, rotation: (item.rotation + 90) % 360 } : item
      )
    );
  }

  movePhoto(index: number, dir: -1 | 1): void {
    const list = [...this.photoQueue()];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    this.photoQueue.set(list);
  }

  removePhoto(index: number): void {
    this.photoQueue.update(list => list.filter((_, i) => i !== index));
  }

  generatePdfFromPhotos(): void {
    const photos = this.photoQueue();
    const libId = this.cameraSelectedLibraryId();
    if (photos.length === 0 && !libId) {
      this.notify('Agregá al menos una foto o imagen para generar el PDF.', 'error');
      return;
    }

    this.cameraGenerating.set(true);
    this.cameraResult.set(null);

    this.fileService
      .createPdfFromPhotos({
        title: this.cameraPdfTitle() || 'Escaneo_Documento',
        pageSize: this.cameraPageSize(),
        orientation: this.cameraOrientation(),
        margin: this.cameraMargin(),
        photos: photos.map(p => ({ dataUrl: p.dataUrl, rotation: p.rotation })),
        fileIds: libId ? [libId] : []
      })
      .subscribe({
        next: pdfFile => {
          this.cameraGenerating.set(false);
          this.cameraResult.set(pdfFile);
          this.notify(`PDF "${pdfFile.name}" creado con éxito.`, 'success');
        },
        error: err => {
          this.cameraGenerating.set(false);
          this.notify(err?.error || 'Error al generar el PDF desde las fotos.', 'error');
        }
      });
  }

  // ==================== 4. UNIR PDFs ====================

  sendToMerge(file: ManagedFile): void {
    if (file.ext !== 'pdf') return;
    this.mergeQueueIds.update(ids => [...ids, file.id]);
    this.setTab('merge');
  }

  addSelectedPdfToMerge(): void {
    const id = Number(this.mergeSelectedId());
    if (!id) return;
    this.mergeQueueIds.update(ids => [...ids, id]);
  }

  onUploadPdfsForMerge(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.fileService.upload(input.files).subscribe({
      next: created => {
        const pdfIds = created.filter(f => f.ext === 'pdf').map(f => f.id);
        this.mergeQueueIds.update(ids => [...ids, ...pdfIds]);
        this.notify(`${pdfIds.length} PDF(s) subidos y agregados a la cola de unión.`, 'success');
      }
    });
    input.value = '';
  }

  moveMergeItem(index: number, dir: -1 | 1): void {
    const ids = [...this.mergeQueueIds()];
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    this.mergeQueueIds.set(ids);
  }

  removeMergeItem(index: number): void {
    this.mergeQueueIds.update(ids => ids.filter((_, i) => i !== index));
  }

  runMergePdfs(): void {
    const ids = this.mergeQueueIds();
    if (ids.length < 2) {
      this.notify('Agregá al menos 2 archivos PDF para unirlos.', 'error');
      return;
    }

    this.mergeLoading.set(true);
    this.mergeResult.set(null);

    this.fileService
      .mergePdfs({
        fileIds: ids,
        title: this.mergeOutputTitle() || 'PDF_Unido'
      })
      .subscribe({
        next: merged => {
          this.mergeLoading.set(false);
          this.mergeResult.set(merged);
          this.notify(`¡PDF unido creado (${merged.pageCount} páginas)!`, 'success');
        },
        error: err => {
          this.mergeLoading.set(false);
          this.notify(err?.error || 'Error al unir los archivos PDF.', 'error');
        }
      });
  }

  // ==================== 5. DIVIDIR / EXTRAER Y ROTAR PDF ====================

  sendToSplit(file: ManagedFile): void {
    if (file.ext !== 'pdf') return;
    this.splitSourceId.set(file.id);
    this.splitRanges.set(file.pageCount && file.pageCount > 1 ? `1-${file.pageCount}` : '1');
    this.splitOutputTitle.set(file.name.replace(/\.pdf$/i, '') + '_extraido');
    this.splitRotations.set({});
    this.splitResultFiles.set([]);
    this.splitResultZip.set(null);
    this.setTab('split');
  }

  onUploadPdfForSplit(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.fileService.upload(input.files).subscribe({
      next: created => {
        const pdf = created.find(f => f.ext === 'pdf');
        if (pdf) {
          this.sendToSplit(pdf);
        }
      }
    });
    input.value = '';
  }

  addPageRotationRule(): void {
    const page = Number(this.splitPageRotationPage());
    const deg = Number(this.splitPageRotationDeg());
    if (!page || page < 1) return;
    this.splitRotations.update(prev => ({ ...prev, [page]: deg }));
  }

  clearPageRotations(): void {
    this.splitRotations.set({});
  }

  runSplitPdf(): void {
    const id = Number(this.splitSourceId());
    if (!id) {
      this.notify('Elegí un archivo PDF para dividir o extraer.', 'error');
      return;
    }

    this.splitLoading.set(true);
    this.splitResultFiles.set([]);
    this.splitResultZip.set(null);

    this.fileService
      .splitPdf({
        fileId: id,
        ranges: this.splitRanges(),
        mode: this.splitMode(),
        title: this.splitOutputTitle() || 'PDF_Extraido',
        rotations: this.splitRotations()
      })
      .subscribe({
        next: res => {
          this.splitLoading.set(false);
          this.splitResultFiles.set(res.files || []);
          this.splitResultZip.set(res.zipFile || null);
          this.notify(
            `¡Operación completada! Se generaron ${res.files.length} archivo(s) PDF.`,
            'success'
          );
        },
        error: err => {
          this.splitLoading.set(false);
          this.notify(err?.error || 'Error al dividir el documento PDF.', 'error');
        }
      });
  }
}
