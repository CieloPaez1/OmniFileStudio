import { Injectable, inject, signal } from '@angular/core';
import { ActionSheetController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  shareSocialOutline,
  logoWhatsapp,
  mailOutline,
  paperPlaneOutline,
  linkOutline,
  downloadOutline,
  closeOutline
} from 'ionicons/icons';
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
  WriteFileResult,
  ReadFileResult
} from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
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
//    almacenamiento interno del dispositivo (Directory.Data).
// 3. @capacitor/preferences: Persistencia offline segura de metadatos de archivos,
//    etiquetas personalizadas y estado de sincronización.
// 4. @capacitor/haptics: Feedback háptico y vibración táctil en botones CTA,
//    capturas de escáner y confirmaciones de éxito.
// 5. Web Share API Level 2 + WhatsApp Export: Compartir archivos PDF/imágenes
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

  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly toastCtrl = inject(ToastController);

  constructor() {
    addIcons({
      shareSocialOutline,
      logoWhatsapp,
      mailOutline,
      paperPlaneOutline,
      linkOutline,
      downloadOutline,
      closeOutline
    });
    this.ensureAppDirectory();
    this.loadDeviceFilesIndex();
  }

  // ===========================================================================
  // 0. FEEDBACK HÁPTICO CON @capacitor/haptics (BOTONES CTA, ESCÁNER Y ÉXITO)
  // ===========================================================================

  /**
   * Ejecuta un impacto háptico físico (@capacitor/haptics + fallback navigator.vibrate)
   * al presionar botones de acción principal (CTA) o capturar documentos.
   */
  async triggerHapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    try {
      const impactStyle =
        style === 'light'
          ? ImpactStyle.Light
          : style === 'heavy'
            ? ImpactStyle.Heavy
            : ImpactStyle.Medium;
      await Haptics.impact({ style: impactStyle });
    } catch {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate(style === 'light' ? 12 : style === 'heavy' ? 35 : 22);
        } catch {}
      }
    }
  }

  /**
   * Ejecuta una notificación háptica de confirmación al finalizar tareas
   * de unión, división, compresión o firma de PDFs.
   */
  async triggerHapticSuccess(): Promise<void> {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        try {
          navigator.vibrate([18, 40, 28]);
        } catch {}
      }
    }
  }

  /**
   * Vibración sutil al cambiar de herramienta o pestaña.
   */
  async triggerHapticSelection(): Promise<void> {
    try {
      await Haptics.selectionChanged();
    } catch {}
  }

  // ===========================================================================
  // 1. CAPTURA DE DOCUMENTOS EN ALTA CALIDAD CON @capacitor/camera
  // ===========================================================================

  /**
   * Captura una fotografía en máxima calidad (95%) con corrección automática de
   * orientación para escaneo de documentos, emite vibración háptica y la guarda
   * en @capacitor/filesystem.
   */
  async captureHighResDocument(source: CameraSource = CameraSource.Camera): Promise<CapturedDocumentPhoto> {
    await this.triggerHapticImpact('medium');

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
    await this.triggerHapticSuccess();

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

  private async ensureAppDirectory(): Promise<void> {
    try {
      await Filesystem.mkdir({
        path: this.APP_FOLDER,
        directory: Directory.Data,
        recursive: true
      });
    } catch {}
  }

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
  // 4. COMPARTIR ARCHIVOS NATIVAMENTE (ACTION SHEET + WEB SHARE + WHATSAPP + EMAIL)
  // ===========================================================================

  /**
   * Muestra un menú de opciones nativo / Action Sheet interactivo para compartir
   * mediante múltiples canales: Sistema, WhatsApp, Correo, Telegram, Copiar Enlace y Descarga.
   */
  async presentShareOptions(file: ManagedFile): Promise<void> {
    await this.triggerHapticImpact('medium');
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    const canNativeShare = Boolean(nav && typeof nav.share === 'function');

    const buttons: any[] = [];

    if (canNativeShare) {
      buttons.push({
        text: 'Compartir con el Sistema (Android / Menú)',
        icon: 'share-social-outline',
        handler: async () => {
          const res = await this.shareManagedFile(file);
          if (res.message) {
            await this.showToast(res.message);
          }
        }
      });
    }

    buttons.push(
      {
        text: 'Compartir por WhatsApp',
        icon: 'logo-whatsapp',
        handler: async () => {
          const res = this.shareViaWhatsApp(file);
          await this.showToast(res.message);
        }
      },
      {
        text: 'Enviar por Correo Electrónico',
        icon: 'mail-outline',
        handler: async () => {
          const res = this.shareViaEmail(file);
          await this.showToast(res.message);
        }
      },
      {
        text: 'Compartir por Telegram',
        icon: 'paper-plane-outline',
        handler: async () => {
          const res = this.shareViaTelegram(file);
          await this.showToast(res.message);
        }
      },
      {
        text: 'Copiar Enlace de Descarga',
        icon: 'link-outline',
        handler: async () => {
          const res = await this.copyShareLink(file);
          await this.showToast(res.message);
        }
      },
      {
        text: 'Descargar Archivo al Dispositivo',
        icon: 'download-outline',
        handler: async () => {
          this.triggerBrowserDownload(file);
          await this.showToast(`Descargando "${file.name}"...`);
        }
      },
      {
        text: 'Cancelar',
        icon: 'close-outline',
        role: 'cancel'
      }
    );

    const actionSheet = await this.actionSheetCtrl.create({
      header: `Compartir: ${file.name}`,
      subHeader: `Formato .${(file.ext || '').toUpperCase()} · ${file.tag || 'General'}`,
      buttons
    });

    await actionSheet.present();
  }

  async shareManagedFile(file: ManagedFile): Promise<ShareResultInfo> {
    await this.triggerHapticImpact('light');
    if (file.dataUrl && file.dataUrl.startsWith('data:')) {
      await this.saveFileToDevice(file.name, file.dataUrl, file.mimeType);
    }

    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;

    if (nav && typeof nav.share === 'function') {
      try {
        const physicalFile = await this.dataUrlToFile(
          file.dataUrl || file.downloadUrl || file.viewUrl,
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
            text: `Documento "${file.name}" (${file.tag || 'General'}) desde OmniFile Studio.`,
            files: [physicalFile]
          });
          return {
            shared: true,
            method: 'web-share-files',
            message: `"${file.name}" compartido nativamente.`
          };
        }

        const downloadUrl = file.downloadUrl || file.viewUrl || '';
        await nav.share({
          title: file.name,
          text: `Te comparto el documento "${file.name}" [${file.tag || 'General'}] desde OmniFile Studio.`,
          url: downloadUrl || undefined
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
            message: 'Envío cancelado.'
          };
        }
      }
    }

    return this.shareViaWhatsApp(file);
  }

  shareViaWhatsApp(file: ManagedFile): ShareResultInfo {
    this.triggerBrowserDownload(file);
    const downloadLink = file.downloadUrl || file.viewUrl || '';
    const linkText = downloadLink ? `\n🔗 Enlace de descarga: ${downloadLink}` : '';
    const text = encodeURIComponent(
      `📄 *OmniFile Studio* — Te comparto el archivo *${file.name}* (Categoría: ${
        file.tag || 'General'
      }).${linkText}`
    );
    if (typeof window !== 'undefined') {
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
    }
    return {
      shared: true,
      method: 'whatsapp-intent',
      message: `Abriendo WhatsApp para compartir "${file.name}".`
    };
  }

  shareViaEmail(file: ManagedFile): ShareResultInfo {
    this.triggerBrowserDownload(file);
    const downloadLink = file.downloadUrl || file.viewUrl || '';
    const subject = encodeURIComponent(`[OmniFile Studio] ${file.name}`);
    const body = encodeURIComponent(
      `Hola,\n\nTe comparto el archivo "${file.name}" (${file.tag || 'General'}).\n` +
      (downloadLink ? `Puedes descargarlo o visualizarlo aquí:\n${downloadLink}\n\n` : '') +
      `Generado con OmniFile Studio.`
    );
    if (typeof window !== 'undefined') {
      window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
    }
    return {
      shared: true,
      method: 'web-share-url',
      message: `Abriendo cliente de correo para "${file.name}".`
    };
  }

  shareViaTelegram(file: ManagedFile): ShareResultInfo {
    this.triggerBrowserDownload(file);
    const downloadLink = file.downloadUrl || file.viewUrl || '';
    const text = encodeURIComponent(
      `📄 *OmniFile Studio* — Te comparto el archivo *${file.name}* (${file.tag || 'General'})`
    );
    const url = encodeURIComponent(downloadLink || (typeof window !== 'undefined' ? window.location.href : ''));
    if (typeof window !== 'undefined') {
      window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
    }
    return {
      shared: true,
      method: 'web-share-url',
      message: `Abriendo Telegram para compartir "${file.name}".`
    };
  }

  async copyShareLink(file: ManagedFile): Promise<ShareResultInfo> {
    const url = file.downloadUrl || file.viewUrl || (typeof window !== 'undefined' ? window.location.href : '');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      return {
        shared: true,
        method: 'web-share-url',
        message: 'Enlace de descarga copiado al portapapeles.'
      };
    } catch {
      return {
        shared: false,
        method: 'web-share-url',
        message: 'No se pudo copiar el enlace al portapapeles.'
      };
    }
  }

  triggerBrowserDownload(file: ManagedFile): void {
    if (typeof document === 'undefined') return;
    const url = file.downloadUrl || file.viewUrl || file.dataUrl;
    if (!url) return;

    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async showToast(message: string, color: 'success' | 'dark' | 'primary' = 'success'): Promise<void> {
    try {
      const toast = await this.toastCtrl.create({
        message,
        duration: 2500,
        position: 'bottom',
        color,
        buttons: [{ text: 'OK', role: 'cancel' }]
      });
      await toast.present();
    } catch {}
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
        return new File([blob], fileName, { type: mimeType || blob.type || 'application/octet-stream' });
      }
      if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
        const res = await fetch(dataUrl);
        if (res.ok) {
          const blob = await res.blob();
          return new File([blob], fileName, { type: mimeType || blob.type || 'application/octet-stream' });
        }
      }
      const blob = new Blob([dataUrl], { type: mimeType || 'text/plain' });
      return new File([blob], fileName, { type: mimeType || 'text/plain' });
    } catch {
      return null;
    }
  }
}
