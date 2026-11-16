import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export type AppTheme = 'light' | 'dark' | 'minimal' | 'cyberpunk' | 'ocean' | 'sunset' | 'forest' | 'crimson' | 'cute';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly DARK_PREF_KEY = 'omnifile_obsidian_dark_v2';

  public readonly currentTheme = signal<AppTheme>('dark');
  public readonly isDarkMode = signal<boolean>(true);

  public readonly availableThemes: { id: AppTheme; name: string; color: string }[] = [
    { id: 'dark', name: 'Obsidiana Naranja', color: '#ff6b00' },
    { id: 'sunset', name: 'Terracota Cálido', color: '#ea580c' },
    { id: 'ocean', name: 'Carbón Profundo', color: '#f97316' },
    { id: 'forest', name: 'Ámbar Estudio', color: '#f59e0b' },
    { id: 'light', name: 'Marfil Cálido', color: '#ea580c' }
  ];

  constructor() {
    this.initTheme();
  }

  private async initTheme(): Promise<void> {
    let savedDark: string | null =
      typeof localStorage !== 'undefined' ? localStorage.getItem(this.DARK_PREF_KEY) : null;

    if (savedDark === null) {
      try {
        const { value } = await Preferences.get({ key: this.DARK_PREF_KEY });
        if (value !== null) savedDark = value;
      } catch {}
    }

    const shouldBeDark = savedDark !== null ? savedDark === 'true' : true;
    const activeTheme: AppTheme = shouldBeDark ? 'dark' : 'light';

    this.currentTheme.set(activeTheme);
    this.isDarkMode.set(shouldBeDark);
    this.applyTheme(activeTheme, shouldBeDark);
  }

  public setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    const darkState = theme !== 'light';
    this.isDarkMode.set(darkState);
    this.applyTheme(theme, darkState);
  }

  public toggleDarkLight(): void {
    const nextDark = !this.isDarkMode();
    this.isDarkMode.set(nextDark);

    try {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch {}

    const theme: AppTheme = nextDark ? 'dark' : 'light';
    this.currentTheme.set(theme);
    this.applyTheme(theme, nextDark);
  }

  private applyTheme(theme: AppTheme, isDark: boolean): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
      document.documentElement.setAttribute('data-mode', isDark ? 'dark' : 'light');
      document.body.setAttribute('data-mode', isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('ion-palette-dark', isDark);
      document.body.classList.toggle('dark', isDark);
      document.documentElement.classList.toggle('light', !isDark);
      document.body.classList.toggle('light', !isDark);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app-theme', theme);
      localStorage.setItem(this.DARK_PREF_KEY, isDark ? 'true' : 'false');
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
