import { Injectable, signal, computed } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type ActivityActionType =
  | 'scan'
  | 'merge'
  | 'split'
  | 'compress'
  | 'sign'
  | 'convert'
  | 'translate'
  | 'ocr'
  | 'upload'
  | 'share'
  | 'archive'
  | 'delete';


export interface ActivityLogEntry {
  id: string;
  title: string;
  detail: string;
  type: ActivityActionType;
  icon: string;
  badgeClass: 'fmt-pdf' | 'fmt-image' | 'fmt-data' | 'fmt-doc';
  timestamp: string;
}

// =============================================================================
// [OMNIFILE STUDIO · HISTORIAL DE ACCIONES / AUDITORÍA LOCAL ("LOG DE ACTIVIDAD")]
// Registra cronológicamente las últimas acciones de productividad realizadas
// en la aplicación (ej: "Se unieron 3 PDFs", "Se escaneó un documento con la cámara")
// y las persiste de forma segura en el dispositivo usando @capacitor/preferences.
// =============================================================================
@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private readonly STORAGE_KEY = 'omnifile_activity_audit_log_v1';
  private readonly MAX_ENTRIES = 40;

  readonly entries = signal<ActivityLogEntry[]>([]);
  readonly recentEntries = computed(() => this.entries().slice(0, 8));
  readonly totalActions = computed(() => this.entries().length);

  constructor() {
    this.loadFromPreferences();
  }

  /**
   * Registra una nueva acción en el historial cronológico y la persiste en @capacitor/preferences.
   */
  async recordAction(
    title: string,
    detail: string,
    type: ActivityActionType,
    customIcon?: string
  ): Promise<ActivityLogEntry> {
    const entry: ActivityLogEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      detail,
      type,
      icon: customIcon || this.getDefaultIconForType(type),
      badgeClass: this.getBadgeClassForType(type),
      timestamp: new Date().toISOString()
    };

    const updated = [entry, ...this.entries()].slice(0, this.MAX_ENTRIES);
    this.entries.set(updated);
    await this.saveToPreferences(updated);
    return entry;
  }

  /**
   * Limpia el historial de auditoría y persiste el estado vacío o reiniciado.
   */
  async clearHistory(): Promise<void> {
    this.entries.set([]);
    await this.saveToPreferences([]);
  }

  /**
   * Carga el historial desde @capacitor/preferences (con respaldo en localStorage).
   */
  async loadFromPreferences(): Promise<ActivityLogEntry[]> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      const raw = value || (typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null);
      if (raw) {
        const parsed = JSON.parse(raw) as ActivityLogEntry[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.entries.set(parsed);
          return parsed;
        }
      }
    } catch {
      // Fallback a entradas iniciales de demostración
    }

    const seed = this.getInitialSeedEntries();
    this.entries.set(seed);
    await this.saveToPreferences(seed);
    return seed;
  }

  private async saveToPreferences(list: ActivityLogEntry[]): Promise<void> {
    const serialized = JSON.stringify(list);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, serialized);
      }
    } catch {}

    try {
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: serialized
      });
    } catch {}
  }

  private getDefaultIconForType(type: ActivityActionType): string {
    switch (type) {
      case 'scan':
        return 'camera-outline';
      case 'merge':
        return 'git-merge-outline';
      case 'split':
        return 'cut-outline';
      case 'compress':
        return 'contract-outline';
      case 'sign':
        return 'create-outline';
      case 'convert':
        return 'swap-horizontal-outline';
      case 'translate':
        return 'language-outline';
      case 'ocr':
        return 'scan-outline';
      case 'share':
        return 'share-social-outline';
      case 'archive':
        return 'archive-outline';
      case 'delete':
        return 'trash-outline';
      default:
        return 'document-text-outline';
    }
  }

  private getBadgeClassForType(type: ActivityActionType): 'fmt-pdf' | 'fmt-image' | 'fmt-data' | 'fmt-doc' {
    switch (type) {
      case 'merge':
      case 'split':
      case 'compress':
      case 'sign':
        return 'fmt-pdf';
      case 'scan':
        return 'fmt-image';
      case 'convert':
      case 'translate':
      case 'share':
        return 'fmt-data';
      default:
        return 'fmt-doc';
    }
  }

  private getInitialSeedEntries(): ActivityLogEntry[] {
    const now = Date.now();
    return [
      {
        id: 'seed-1',
        title: 'Se escaneó un documento con la cámara',
        detail: 'Factura_Luz_Edesur.pdf · Guardado en @capacitor/filesystem',
        type: 'scan',
        icon: 'camera-outline',
        badgeClass: 'fmt-image',
        timestamp: new Date(now - 1000 * 60 * 12).toISOString()
      },
      {
        id: 'seed-2',
        title: 'Se unieron 3 PDFs en un único documento',
        detail: 'Legajo_Unificado_2026.pdf · Procesado 100% en cliente (jsPDF)',
        type: 'merge',
        icon: 'git-merge-outline',
        badgeClass: 'fmt-pdf',
        timestamp: new Date(now - 1000 * 60 * 38).toISOString()
      },
      {
        id: 'seed-3',
        title: 'Se firmó digitalmente Contrato_Alquiler_2026.pdf',
        detail: 'Trazo electrónico estampado en lienzo HTML5 Canvas',
        type: 'sign',
        icon: 'create-outline',
        badgeClass: 'fmt-pdf',
        timestamp: new Date(now - 1000 * 60 * 95).toISOString()
      },
      {
        id: 'seed-4',
        title: 'Se comprimió Presupuesto_Anual.pdf (-42% peso)',
        detail: 'Nivel Medio · Sincronizado en @capacitor/preferences',
        type: 'compress',
        icon: 'contract-outline',
        badgeClass: 'fmt-data',
        timestamp: new Date(now - 1000 * 60 * 180).toISOString()
      }
    ];
  }
}
