import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'minimal' | 'cyberpunk' | 'ocean' | 'sunset' | 'forest' | 'crimson' | 'cute';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public readonly currentTheme = signal<AppTheme>('light');
  public readonly isDarkMode = signal<boolean>(false);

  public readonly availableThemes: { id: AppTheme, name: string, color: string }[] = [
    { id: 'light', name: '☀️ Claro', color: '#4f46e5' },
    { id: 'dark', name: '🌙 Oscuro', color: '#6366f1' },
    { id: 'ocean', name: '🌊 Océano', color: '#0284c7' },
    { id: 'forest', name: '🌲 Esmeralda', color: '#059669' },
    { id: 'sunset', name: '🟣 Violeta', color: '#7c3aed' }
  ];

  constructor() {
    this.initTheme();
  }

  private initTheme() {
    const allowedThemes: AppTheme[] = ['light', 'dark', 'ocean', 'forest', 'sunset'];
    const rawTheme = localStorage.getItem('app-theme') as AppTheme;
    const savedTheme = allowedThemes.includes(rawTheme) ? rawTheme : 'light';
    const savedDark = localStorage.getItem('planix_dark_mode') || localStorage.getItem('taskgo_dark_mode');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Temas que nacen oscuros por diseño
    const isDarkInherently = savedTheme === 'dark';
    let shouldBeDark = false;

    if (savedDark !== null) {
      shouldBeDark = savedDark === 'true';
    } else if (isDarkInherently || prefersDark) {
      shouldBeDark = true;
    }

    this.currentTheme.set(savedTheme);
    this.isDarkMode.set(shouldBeDark);
    this.applyTheme(savedTheme, shouldBeDark);
  }

  public setTheme(theme: AppTheme) {
    this.currentTheme.set(theme);

    // Si el usuario elige temas de naturaleza oscura, activamos dark mode
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

  public toggleDarkLight(): void {
    const nextDark = !this.isDarkMode();
    this.isDarkMode.set(nextDark);

    // Si estábamos en tema 'dark' puro y pasamos a claro, pasamos al base light
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

  private applyTheme(theme: AppTheme, isDark: boolean) {
    if (typeof document !== 'undefined') {
      // 1. Aplicar data-theme tanto en html como en body
      document.documentElement.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');

      if (theme !== 'light') {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
      }

      // 2. Aplicar modificador de modo oscuro (data-mode y class .dark)
      document.documentElement.setAttribute('data-mode', isDark ? 'dark' : 'light');
      document.body.setAttribute('data-mode', isDark ? 'dark' : 'light');
      document.body.classList.toggle('dark', isDark);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app-theme', theme);
      localStorage.setItem('planix_dark_mode', isDark ? 'true' : 'false');
      localStorage.setItem('taskgo_dark_mode', isDark ? 'true' : 'false');
    }
  }

  public isDark(): boolean {
    return this.isDarkMode();
  }
}
