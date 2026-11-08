import { Injectable, signal, computed, effect, inject, untracked } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { ConfettiService } from './confetti.service';
import { Task } from '../../models/task.model';
import { Project } from '../../models/project.model';

export interface LevelRankTier {
  minLevel: number;
  maxLevel: number;
  title: string;
  badgeIcon: string;
  rewardText: string;
}

// =============================================================================
// [CAPACITOR 8 - CLASE 6 Y CLASE 8: STORE REACTIVO CENTRAL + NIVELES Y XP]
// Sincroniza en tiempo real Inicio, Proyectos, Tareas y Perfil usando Signals
// compartidos y persistencia en @capacitor/preferences.
// =============================================================================
@Injectable({
  providedIn: 'root'
})
export class IonicStorageService {
  private readonly TASKS_KEY = 'tasks_cache';
  private readonly PROJECTS_KEY = 'projects_cache';
  private readonly AVATAR_PREFIX = 'user_avatar_';
  private readonly AVATAR_XP_KEY = 'planix_avatar_xp_v2';
  private readonly LAST_LEVEL_KEY = 'planix_last_level_seen';
  private readonly toastCtrl = inject(ToastController);
  private readonly confettiService = inject(ConfettiService);

  readonly usingOfflineCache = signal<boolean>(false);
  readonly networkConnected = signal<boolean>(true);

  // ===========================================================================
  // ESTADO REACTIVO COMPARTIDO ENTRE TODAS LAS PANTALLAS MÓVILES
  // ===========================================================================
  readonly projects = signal<Project[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly avatarPhotoXp = signal<number>(0);

  // ===========================================================================
  // SISTEMA DE NIVELES Y PUNTOS XP CENTRALIZADO (Inicia en 0 XP · Nivel 1)
  // ===========================================================================
  readonly xpPerLevel = 500;

  readonly rankTiers: LevelRankTier[] = [
    { minLevel: 1, maxLevel: 2, title: 'Nivel Inicial', badgeIcon: 'L1', rewardText: 'Organización básica' },
    { minLevel: 3, maxLevel: 4, title: 'Nivel Intermedio', badgeIcon: 'L2', rewardText: 'Enfoque ágil' },
    { minLevel: 5, maxLevel: 7, title: 'Nivel Avanzado', badgeIcon: 'L3', rewardText: 'Gestión de proyectos' },
    { minLevel: 8, maxLevel: 11, title: 'Nivel Senior', badgeIcon: 'L4', rewardText: 'Optimización de flujo' },
    { minLevel: 12, maxLevel: 99, title: 'Nivel Experto', badgeIcon: 'L5', rewardText: 'Gestión integral' }
  ];

  // +250 XP por cada proyecto creado
  readonly xpFromProjects = computed(() => this.projects().length * 250);

  // +150 XP por cada tarea completada (DONE)
  readonly xpFromCompletedTasks = computed(
    () => this.tasks().filter(t => t.status === 'DONE').length * 150
  );

  // +50 XP por cada tarea en curso / pendiente (TODO)
  readonly xpFromPendingTasks = computed(
    () => this.tasks().filter(t => t.status !== 'DONE').length * 50
  );

  // +300 XP extra por cada proyecto finalizado (CLOSED)
  readonly xpFromClosedProjects = computed(
    () => this.projects().filter(p => p.status === 'CLOSED').length * 300
  );

  // +100 XP por cada foto capturada con @capacitor/camera (proyectos, tareas o perfil)
  readonly xpFromPhotos = computed(() => {
    const projPhotos = this.projects().filter(p => !!(p.photo || p.photoPreview)).length;
    const taskPhotos = this.tasks().filter(t => !!(t.photo || t.photoPreview)).length;
    return (projPhotos + taskPhotos) * 100 + this.avatarPhotoXp();
  });

  // Total acumulado de XP: se calcula 100% AUTOMÁTICO a partir de la actividad real
  readonly totalXp = computed(() => {
    return (
      this.xpFromProjects() +
      this.xpFromCompletedTasks() +
      this.xpFromPendingTasks() +
      this.xpFromClosedProjects() +
      this.xpFromPhotos()
    );
  });

  // Nivel actual: Nivel 1 de 0 a 499 XP, Nivel 2 de 500 a 999 XP, etc.
  readonly currentLevel = computed(() => Math.floor(this.totalXp() / this.xpPerLevel) + 1);

  // Meta de XP del nivel actual (Nivel 1 -> 500 XP, Nivel 2 -> 1000 XP, etc.)
  readonly nextLevelTargetXp = computed(() => this.currentLevel() * this.xpPerLevel);

  // Porcentaje de avance dentro del nivel actual (0% a 100%)
  readonly xpPercentage = computed(() => {
    const xpInCurrentLevel = this.totalXp() % this.xpPerLevel;
    return Math.round((xpInCurrentLevel / this.xpPerLevel) * 100);
  });

  // XP restante para subir al próximo nivel
  readonly xpRemaining = computed(() => {
    const xpInCurrentLevel = this.totalXp() % this.xpPerLevel;
    return this.xpPerLevel - xpInCurrentLevel;
  });

  // Rango actual según el nivel
  readonly currentRank = computed<LevelRankTier>(() => {
    const lvl = this.currentLevel();
    return (
      this.rankTiers.find(r => lvl >= r.minLevel && lvl <= r.maxLevel) ||
      this.rankTiers[this.rankTiers.length - 1]
    );
  });

  constructor() {
    // Limpiar claves viejas del XP manual (ya no se usa: el nivel es automático)
    localStorage.removeItem('app_user_bonus_xp');
    localStorage.removeItem('taskgo_bonus_xp_v2');

    const rawAvatarXp = localStorage.getItem(this.AVATAR_XP_KEY) || localStorage.getItem('taskgo_avatar_xp_v2') || '0';
    const savedAvatarXp = parseInt(rawAvatarXp, 10);
    this.avatarPhotoXp.set(Number.isNaN(savedAvatarXp) ? 0 : savedAvatarXp);

    Network.addListener('networkStatusChange', status => {
      this.networkConnected.set(status.connected);
    });

    // Aviso AUTOMÁTICO de subida de nivel: cada vez que el XP cruza un múltiplo
    // de 500 (al completar tareas, crear/cerrar proyectos o sacar fotos) se
    // muestra un toast, sin que el usuario tenga que hacer nada.
    effect(() => {
      const lvl = this.currentLevel();
      const rank = this.currentRank();
      untracked(() => {
        const rawLastSeen = localStorage.getItem(this.LAST_LEVEL_KEY) || localStorage.getItem('taskgo_last_level_seen') || '1';
        const lastSeen = parseInt(rawLastSeen, 10);
        if (lvl > lastSeen) {
          this.notifyLevelUp(lvl, rank);
        }
        if (lvl !== lastSeen) {
          localStorage.setItem(this.LAST_LEVEL_KEY, String(lvl));
          localStorage.setItem('taskgo_last_level_seen', String(lvl));
        }
      });
    });
  }

  private async notifyLevelUp(level: number, rank: LevelRankTier): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: `Subiste a Nivel ${level} · ${rank.title}`,
      duration: 3000,
      position: 'top',
      color: 'dark'
    });
    await toast.present();
  }

  registerAvatarPhotoCapture(): void {
    this.avatarPhotoXp.set(100);
    localStorage.setItem(this.AVATAR_XP_KEY, '100');
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    // Preservar metadatos nativos locales (photo, photoPreview, lat, lng) si ya existían
    const current = this.tasks();
    const merged = tasks.map(t => {
      const prev = current.find(c => (c.id && c.id === t.id) || c.title === t.title);
      if (!prev) return t;
      return {
        ...t,
        photo: t.photo || prev.photo,
        photoPreview: t.photoPreview || prev.photoPreview,
        lat: t.lat ?? prev.lat,
        lng: t.lng ?? prev.lng
      };
    });

    this.tasks.set(merged);
    await Preferences.set({
      key: this.TASKS_KEY,
      value: JSON.stringify(merged)
    });
    this.usingOfflineCache.set(false);
  }

  async loadTasks(): Promise<Task[]> {
    const { value } = await Preferences.get({ key: this.TASKS_KEY });
    this.usingOfflineCache.set(true);
    const parsed: Task[] = value ? JSON.parse(value) : [];
    this.tasks.set(parsed);
    return parsed;
  }

  async saveProjects(projects: Project[]): Promise<void> {
    // Preservar foto de portada local del proyecto si ya existía
    const current = this.projects();
    const merged = projects.map(p => {
      const prev = current.find(c => (c.id && c.id === p.id) || c.name === p.name);
      if (!prev) return p;
      return {
        ...p,
        photo: p.photo || prev.photo,
        photoPreview: p.photoPreview || prev.photoPreview
      };
    });

    this.projects.set(merged);
    await Preferences.set({
      key: this.PROJECTS_KEY,
      value: JSON.stringify(merged)
    });
  }

  async loadProjects(): Promise<Project[]> {
    const { value } = await Preferences.get({ key: this.PROJECTS_KEY });
    this.usingOfflineCache.set(true);
    const parsed: Project[] = value ? JSON.parse(value) : [];
    this.projects.set(parsed);
    return parsed;
  }

  // [CLASE 8] Guardar y recuperar la foto de perfil del administrador / usuario
  async saveUserAvatar(email: string, avatarDataUrl: string): Promise<void> {
    if (!email) return;
    await Preferences.set({
      key: `${this.AVATAR_PREFIX}${email.toLowerCase()}`,
      value: avatarDataUrl
    });
  }

  async loadUserAvatar(email: string): Promise<string | null> {
    if (!email) return null;
    const { value } = await Preferences.get({
      key: `${this.AVATAR_PREFIX}${email.toLowerCase()}`
    });
    return value;
  }

  async isOnline(): Promise<boolean> {
    try {
      const status = await Network.getStatus();
      this.networkConnected.set(status.connected);
      return status.connected;
    } catch {
      return navigator.onLine;
    }
  }
}
