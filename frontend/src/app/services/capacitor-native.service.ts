import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  CameraDirection,
  Photo
} from '@capacitor/camera';
import {
  Filesystem,
  Directory,
  Encoding,
  WriteFileResult,
  ReadFileResult
} from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { FileTagType, FILE_TAGS, ManagedFile } from '../models/managed-file.model';

export interface CapturedDocumentPhoto {
  id: string;
  name: string;
  dataUrl: string;
  format: string;
  savedUri?: string;
  createdAt: string;
}

export interface SavedDeviceFileInfo {
  name: string;
  uri: string;
  size: number;
  directory: string;
  savedAt: string;
}

export interface ShareResultInfo {
  shared: boolean;
  method: 'web-share-files' | 'web-share-url' | 'whatsapp-intent' | 'download-fallback';
  message: string;
}

// =============================================================================
// [OMNIFILE STUDIO · SERVICIO NATIVO CAPACITOR 8 (WEB + ANDROID)]
// Centraliza e integra de forma tipada y limpia:
// 1. @capacitor/camera: Captura fotográfica de documentos en máxima calidad (95%).
// 2. @capacitor/filesystem: Lectura/escritura de PDFs e imágenes en el
//    almacenamiento interno del dispositivo (Directory.Data / Directory.Documents).
// 3. @capacitor/preferences: Persistencia offline segura de metadatos de archivos,
//    etiquetas personalizadas y estado de sincronización.
// 4. Web Share API Level 2 + WhatsApp Export: Compartir archivos PDF/imágenes
//    nativamente desde Android o navegador web.
// =============================================================================
@Injectable({
  providedIn: 'root'
})
export class CapacitorNativeService {
  private readonly REPO_PREF_KEY = 'filestudio_files_preferences_v1';
  private readonly TAGS_PREF_KEY = 'filestudio_custom_tags_v1';
  private readonly DEVICE_FILES_INDEX_KEY = 'filestudio_device_fs_index_v1';
  private readonly APP_FOLDER = 'omnifile_studio';

  readonly isNative = signal<boolean>(Capacitor.isNativePlatform());
  readonly platformName = signal<string>(Capacitor.getPlatform());
  readonly lastSavedUri = signal<string | null>(null);
  readonly savedDeviceFiles = signal<SavedDeviceFileInfo[]>([]);

  constructor() {
    this.ensureAppDirectory();
    this.loadDeviceFilesIndex();
  }

  // ===========================================================================
  // 1. CAPTURA DE DOCUMENTOS EN ALTA CALIDAD CON @capacitor/camera
  // ===========================================================================

  /**
   * Captura una fotografía en máxima calidad (95%) con corrección automática de
   * orientación para escaneo de documentos y la guarda en @capacitor/filesystem.
   */
  async captureHighResDocument(source: CameraSource = CameraSource.Camera): Promise<CapturedDocumentPhoto> {
    const photo: Photo = await Camera.getPhoto({
      quality: 95,
      allowEditing: false,
      correctOrientation: true,
      resultType: CameraResultType.DataUrl,
      source,
      direction: CameraDirection.Rear,
      promptLabelHeader: 'Escáner OmniFile Studio',
      promptLabelPhoto: 'Elegir de la Galería',
      promptLabelPicture: 'Tomar Fotografía HD'
    });

    const dataUrl = photo.dataUrl || '';
    const ext = photo.format || 'jpeg';
    const fileName = `Scan_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;

    // Persistimos inmediatamente la captura en @capacitor/filesystem
    const saved = await this.saveFileToDevice(fileName, dataUrl, 'image/jpeg');

    return {
      id: `cam-${Date.now()}`,
      name: fileName,
      dataUrl,
      format: ext,
      savedUri: saved.uri,
      createdAt: new Date().toISOString()
    };
  }

  // ===========================================================================
  // 2. ALMACENAMIENTO INTERNO EN DISPOSITIVO CON @capacitor/filesystem
  // ===========================================================================

  /**
   * Crea el directorio base `omnifile_studio` en `Directory.Data` si no existe.
   */
  private async ensureAppDirectory(): Promise<void> {
    try {
      await Filesystem.mkdir({
        path: this.APP_FOLDER,
        directory: Directory.Data,
        recursive: true
      });
    } catch {
      // El directorio ya existe o estamos en entorno sin permisos previos
    }
  }

  /**
   * Guarda un archivo generado (PDF convertido, comprimido, firmado o imagen)
   * directamente en el almacenamiento interno del dispositivo (`Directory.Data`).
   */
  async saveFileToDevice(
    fileName: string,
    dataUrlOrText: string,
    mimeType = 'application/pdf'
  ): Promise<SavedDeviceFileInfo> {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const relativePath = `${this.APP_FOLDER}/${safeName}`;

    try {
      await this.ensureAppDirectory();

      const isBase64DataUrl = dataUrlOrText.includes(';base64,') || dataUrlOrText.startsWith('data:');
      const payloadData = isBase64DataUrl
        ? dataUrlOrText.split(',')[1] || ''
        : btoa(unescape(encodeURIComponent(dataUrlOrText)));

      const writeRes: WriteFileResult = await Filesystem.writeFile({
        path: relativePath,
        data: payloadData,
        directory: Directory.Data,
        recursive: true
      });

      const info: SavedDeviceFileInfo = {
        name: safeName,
        uri: writeRes.uri || `file:///data/user/0/com.filestudio.app/files/${relativePath}`,
        size: Math.round((payloadData.length * 3) / 4),
        directory: 'Directory.Data',
        savedAt: new Date().toISOString()
      };

      this.lastSavedUri.set(info.uri);
      await this.registerSavedDeviceFile(info);
      return info;
    } catch {
      // Fallback limpio cuando el navegador restringe Filesystem Web
      const fallbackInfo: SavedDeviceFileInfo = {
        name: safeName,
        uri: `indexeddb://${this.APP_FOLDER}/${safeName}`,
        size: dataUrlOrText.length,
        directory: 'WebStorage.Data',
        savedAt: new Date().toISOString()
      };
      this.lastSavedUri.set(fallbackInfo.uri);
      await this.registerSavedDeviceFile(fallbackInfo);
      return fallbackInfo;
    }
  }

  /**
   * Lee un archivo almacenado en `@capacitor/filesystem` y lo devuelve como DataURL
   * listo para previsualizar, abrir o compartir.
   */
  async readFileFromDevice(
    fileName: string,
    mimeType = 'application/pdf'
  ): Promise<string | null> {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const relativePath = `${this.APP_FOLDER}/${safeName}`;

    try {
      const readRes: ReadFileResult = await Filesystem.readFile({
        path: relativePath,
        directory: Directory.Data
      });

      if (typeof readRes.data === 'string') {
        return readRes.data.startsWith('data:')
          ? readRes.data
          : `data:${mimeType};base64,${readRes.data}`;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Elimina un archivo del almacenamiento físico `@capacitor/filesystem`.
   */
  async deleteFileFromDevice(fileName: string): Promise<boolean> {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const relativePath = `${this.APP_FOLDER}/${safeName}`;
    try {
      await Filesystem.deleteFile({
        path: relativePath,
        directory: Directory.Data
      });
      const updated = this.savedDeviceFiles().filter(f => f.name !== safeName);
      this.savedDeviceFiles.set(updated);
      await Preferences.set({
        key: this.DEVICE_FILES_INDEX_KEY,
        value: JSON.stringify(updated)
      });
      return true;
    } catch {
      return false;
    }
  }

  private async registerSavedDeviceFile(entry: SavedDeviceFileInfo): Promise<void> {
    const current = this.savedDeviceFiles().filter(i => i.name !== entry.name);
    const updated = [entry, ...current].slice(0, 50);
    this.savedDeviceFiles.set(updated);
    try {
      await Preferences.set({
        key: this.DEVICE_FILES_INDEX_KEY,
        value: JSON.stringify(updated)
      });
    } catch {}
  }

  private async loadDeviceFilesIndex(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: this.DEVICE_FILES_INDEX_KEY });
      if (value) {
        this.savedDeviceFiles.set(JSON.parse(value));
      }
    } catch {}
  }

  // ===========================================================================
  // 3. PERSISTENCIA OFFLINE CON @capacitor/preferences
  // ===========================================================================

  /**
   * Guarda el repositorio completo de archivos y metadatos en `@capacitor/preferences`
   * (con espejo en `localStorage` para acceso síncrono inmediato).
   */
  async saveRepositoryToPreferences(files: ManagedFile[]): Promise<void> {
    const serialized = JSON.stringify(files);
    try {
      localStorage.setItem(this.REPO_PREF_KEY, serialized);
    } catch {}

    try {
      await Preferences.set({
        key: this.REPO_PREF_KEY,
        value: serialized
      });
    } catch {}
  }

  /**
   * Recupera el repositorio de archivos desde `@capacitor/preferences` cuando
   * no hay conexión a internet o `json-server` no está disponible.
   */
  async loadRepositoryFromPreferences(): Promise<ManagedFile[]> {
    try {
      const { value } = await Preferences.get({ key: this.REPO_PREF_KEY });
      const raw = value || localStorage.getItem(this.REPO_PREF_KEY);
      return raw ? (JSON.parse(raw) as ManagedFile[]) : [];
    } catch {
      const fallback = localStorage.getItem(this.REPO_PREF_KEY);
      return fallback ? (JSON.parse(fallback) as ManagedFile[]) : [];
    }
  }

  /**
   * Guarda las etiquetas activas y personalizadas en `@capacitor/preferences`.
   */
  async saveTagsToPreferences(tags: (FileTagType | string)[]): Promise<void> {
    try {
      await Preferences.set({
        key: this.TAGS_PREF_KEY,
        value: JSON.stringify(tags)
      });
    } catch {}
  }

  async loadTagsFromPreferences(): Promise<string[]> {
    try {
      const { value } = await Preferences.get({ key: this.TAGS_PREF_KEY });
      return value ? JSON.parse(value) : [...FILE_TAGS];
    } catch {
      return [...FILE_TAGS];
    }
  }

  // ===========================================================================
  // 4. COMPARTIR ARCHIVOS NATIVAMENTE (WEB SHARE API LEVEL 2 + WHATSAPP)
  // ===========================================================================

  /**
   * Comparte cualquier archivo gestionado (PDF, imagen, documento) utilizando
   * el menú nativo del sistema operativo (`navigator.share` con soporte de `File`)
   * o abre el envío directo por WhatsApp / descarga si el navegador no soporta File Share.
   */
  async shareManagedFile(file: ManagedFile): Promise<ShareResultInfo> {
    // 1. Aseguramos que el archivo también quede guardado en @capacitor/filesystem
    if (file.dataUrl) {
      await this.saveFileToDevice(file.name, file.dataUrl, file.mimeType);
    }

    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;

    // 2. Intentamos compartir el binario real (PDF/Imagen) con Web Share API Level 2
    if (nav && typeof nav.share === 'function') {
      try {
        const physicalFile = await this.dataUrlToFile(
          file.dataUrl || file.downloadUrl,
          file.name,
          file.mimeType || 'application/pdf'
        );

        if (
          physicalFile &&
          typeof nav.canShare === 'function' &&
          nav.canShare({ files: [physicalFile] })
        ) {
          await nav.share({
            title: file.name,
            text: `Documento "${file.name}" (${file.tag || 'General'}) procesado en OmniFile Studio.`,
            files: [physicalFile]
          });
          return {
            shared: true,
            method: 'web-share-files',
            message: `"${file.name}" compartido nativamente.`
          };
        }

        // Si el navegador soporta navigator.share pero no archivos binarios directos
        await nav.share({
          title: file.name,
          text: `Te comparto el documento "${file.name}" [${file.tag || 'General'}] desde OmniFile Studio.`
        });
        return {
          shared: true,
          method: 'web-share-url',
          message: `"${file.name}" compartido con el menú del sistema.`
        };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return {
            shared: false,
            method: 'web-share-files',
            message: 'Envío cancelado por el usuario.'
          };
        }
      }
    }

    // 3. Fallback directo a WhatsApp Web / App + descarga local
    return this.shareViaWhatsApp(file);
  }

  /**
   * Permite exportar/compartir directamente hacia WhatsApp y descarga una copia local.
   */
  shareViaWhatsApp(file: ManagedFile): ShareResultInfo {
    this.triggerBrowserDownload(file);
    const text = encodeURIComponent(
      `📄 *OmniFile Studio* — Te comparto el archivo *${file.name}* (Categoría: ${
        file.tag || 'General'
      }).`
    );
    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    }
    return {
      shared: true,
      method: 'whatsapp-intent',
      message: `Abriendo WhatsApp y descargando "${file.name}" para adjuntar.`
    };
  }

  triggerBrowserDownload(file: ManagedFile): void {
    if (typeof document === 'undefined') return;
    const url = file.downloadUrl || file.dataUrl;
    if (!url) return;

    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  private async dataUrlToFile(
    dataUrl: string | undefined,
    fileName: string,
    mimeType: string
  ): Promise<File | null> {
    if (!dataUrl) return null;
    try {
      if (dataUrl.startsWith('data:')) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], fileName, { type: mimeType || blob.type });
      }
      const blob = new Blob([dataUrl], { type: mimeType });
      return new File([blob], fileName, { type: mimeType });
    } catch {
      return null;
    }
  }
}
