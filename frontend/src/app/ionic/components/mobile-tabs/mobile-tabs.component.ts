import { Component, inject, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import {
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge,
  MenuController
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  homeOutline,
  gridOutline,
  folderOpenOutline,
  folderOutline,
  cameraOutline,
  constructOutline,
  documentTextOutline,
  addCircleOutline,
  cloudUploadOutline,
  moonOutline,
  desktopOutline,
  logOutOutline
} from 'ionicons/icons';

import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { FileManagerService } from '../../../services/file-manager.service';

@Component({
  selector: 'app-mobile-tabs',
  standalone: true,
  imports: [
    RouterModule,
    IonSplitPane,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
    IonBadge
  ],
  templateUrl: './mobile-tabs.component.html',
  styleUrls: ['./mobile-tabs.component.css']
})
export class MobileTabsComponent {
  private readonly menu = inject(MenuController);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly fileService = inject(FileManagerService);

  readonly isDarkMode = computed(() => this.themeService.isDark());

  constructor() {
    addIcons({
      homeOutline,
      gridOutline,
      folderOpenOutline,
      folderOutline,
      cameraOutline,
      constructOutline,
      documentTextOutline,
      addCircleOutline,
      cloudUploadOutline,
      moonOutline,
      desktopOutline,
      logOutOutline
    });
  }

  toggleDarkMode(event: CustomEvent): void {
    const checked = (event as any).detail.checked;
    this.themeService.setTheme(checked ? 'dark' : 'light');
  }

  async navegarDesdeMenu(ruta: string): Promise<void> {
    await this.menu.close();
    this.router.navigate([ruta]);
  }

  async cerrarSesion(): Promise<void> {
    await this.menu.close();
    this.authService.logout();
  }
}
