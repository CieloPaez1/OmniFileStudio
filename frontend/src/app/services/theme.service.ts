import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export type AppTheme = 'light' | 'dark' | 'minimal' | 'cyberpunk' | 'ocean' | 'sunset' | 'forest' | 'crimson' | 'cute';

// =============================================================================
// [OMNIFILE STUDIO · REQUISITO 3: SERVICIO DE MODO OSCURO NATIVO (DARK MODE)]
// Gestiona la alternancia limpia entre el Modo Claro Minimalista y el Modo
// Oscuro Slate/Zinc Profundo, aplicando las variables CSS de Ionic y
// persistiendo la preferencia en @capacitor/preferences y localStorage.
// =============================================================================
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly DARK_PREF_KEY = 'omnifile_dark_mode_v1';

  public readonly currentTheme = signal<AppTheme>('light');
  public readonly isDarkMode = signal<boolean>(false);

  public readonly availableThemes: { id: AppTheme; name: string; color: string }[] = [
    { id: 'light', name: '☀️ Claro', color: '#6366f1' },
    { id: 'dark', name: '🌙 Oscuro', color: '#6366f1' },
    { id: 'ocean', name: '🌊 Océano', color: '#0284c7' },
    { id: 'forest', name: '🌲 Esmeralda', color: '#059669' },
    { id: 'sunset', name: '🟣 Violeta', color: '#7c3aed' }
  ];

  constructor() {
    this.initTheme();
  }

  private async initTheme(): Promise<void> {
    const allowedThemes: AppTheme[] = ['light', 'dark', 'ocean', 'forest', 'sunset'];
    const rawTheme = (typeof localStorage !== 'undefined' ? localStorage.getItem('app-theme') : 'light') as AppTheme;
    const savedTheme = allowedThemes.includes(rawTheme) ? rawTheme : 'light';

    let savedDark: string | null =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(this.DARK_PREF_KEY) ||
          localStorage.getItem('planix_dark_mode') ||
          localStorage.getItem('taskgo_dark_mode')
        : null;

    if (savedDark === null) {
      try {
        const { value } = await Preferences.get({ key: this.DARK_PREF_KEY });
        if (value !== null) savedDark = value;
      } catch {}
    }

    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const isDarkInherently = savedTheme === 'dark';
    let shouldBeDark = false;

    if (savedDark !== null) {
      shouldBeDark = savedDark === 'true';
    } else if (isDarkInherently || prefersDark) {
      shouldBeDark = true;
    }

    this.currentTheme.set(shouldBeDark ? 'dark' : savedTheme);
    this.isDarkMode.set(shouldBeDark);
    this.applyTheme(shouldBeDark ? 'dark' : savedTheme, shouldBeDark);
  }

  public setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);

    let darkState = this.isDarkMode();
    if (theme === 'dark' || theme === 'cyberpunk' || theme === 'crimson') {
      darkState = true;
      this.isDarkMode.set(true);
    } else if (theme === 'light') {
      darkState = false;
      this.isDarkMode.set(false);
    }

    this.applyTheme(theme, darkState);
  }

  /**
   * Alterna limpiamente entre Modo Claro Minimalista y Modo Oscuro Nativo Slate/Zinc
   * con feedback háptico sutil (@capacitor/haptics).
   */
  public toggleDarkLight(): void {
    const nextDark = !this.isDarkMode();
    this.isDarkMode.set(nextDark);

    try {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch {}

    let theme = this.currentTheme();
    if (!nextDark && theme === 'dark') {
      theme = 'light';
      this.currentTheme.set('light');
    } else if (nextDark && theme === 'light') {
      theme = 'dark';
      this.currentTheme.set('dark');
    }

    this.applyTheme(theme, nextDark);
  }

  private applyTheme(theme: AppTheme, isDark: boolean): void {
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');

      if (theme !== 'light') {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
      }

      document.documentElement.setAttribute('data-mode', isDark ? 'dark' : 'light');
      document.body.setAttribute('data-mode', isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('ion-palette-dark', isDark);
      document.body.classList.toggle('dark', isDark);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app-theme', theme);
      localStorage.setItem(this.DARK_PREF_KEY, isDark ? 'true' : 'false');
      localStorage.setItem('planix_dark_mode', isDark ? 'true' : 'false');
      localStorage.setItem('taskgo_dark_mode', isDark ? 'true' : 'false');
    }

    Preferences.set({
      key: this.DARK_PREF_KEY,
      value: isDark ? 'true' : 'false'
    }).catch(() => {});
  }

  public isDark(): boolean {
    return this.isDarkMode();
  }
}
