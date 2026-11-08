import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideBarChart3,
  LucideCheckSquare,
  LucideChevronDown,
  LucideChevronRight,
  LucideFolderKanban,
  LucideHome,
  LucideList,
  LucidePlus,
  LucideSettings
} from '@lucide/angular';
import { LayoutService } from '../../services/layout.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideHome,
    LucideFolderKanban,
    LucideCheckSquare,
    LucideBarChart3,
    LucideChevronDown,
    LucideChevronRight,
    LucideList,
    LucidePlus,
    LucideSettings
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private layoutService = inject(LayoutService);

  collapsed = this.layoutService.collapsed;

  projectsOpen = signal<boolean>(false);

  tasksOpen = signal<boolean>(false);

  reportsOpen = signal<boolean>(false);

  toggle(): void {
    this.layoutService.toggleSidebar();
  }

  toggleProjects(): void {
    this.projectsOpen.update(v => !v);
  }

  toggleTasks(): void {
    this.tasksOpen.update(v => !v);
  }

  toggleReports(): void {
    this.reportsOpen.update(v => !v);
  }
}
