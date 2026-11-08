import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LayoutService } from './services/layout.service';
import { AuthService } from './services/auth.service';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, IonApp, IonRouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('OmniFile Studio');
  protected readonly layoutService = inject(LayoutService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isMobileView = signal<boolean>(this.determineIfMobile());

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url || '';
        this.updateMobileView(url);
      });
  }

  ngOnInit(): void {
    const currentUrl =
      this.router.url || (typeof window !== 'undefined' ? window.location.pathname : '');
    this.updateMobileView(currentUrl);
  }

  @HostListener('window:resize')
  onResize(): void {
    const currentUrl =
      this.router.url || (typeof window !== 'undefined' ? window.location.pathname : '');
    this.updateMobileView(currentUrl);
  }

  private determineIfMobile(currentUrl?: string): boolean {
    if (typeof window === 'undefined') return true;
    const url = currentUrl || (this.router ? this.router.url : '') || window.location.pathname || '';
    const isDesktopExplicitUrl = url.startsWith('/files');
    if (isDesktopExplicitUrl) {
      return window.innerWidth <= 768;
    }
    return true;
  }

  private updateMobileView(currentUrl: string): void {
    const isMobile = this.determineIfMobile(currentUrl);
    this.isMobileView.set(isMobile);
  }
}
