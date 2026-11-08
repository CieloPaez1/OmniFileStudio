import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { LucideSearch, LucideX, LucideLogOut, LucidePalette, LucideCheck, LucideSmartphone } from '@lucide/angular';
import { ThemeService, AppTheme } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { SearchService } from '../../services/search.service';
import { Task } from '../../models/task.model';
import { Project } from '../../models/project.model';
import { TaskStatusPipe } from '../../pipes/task-status.pipe';
import { ProjectStatusPipe } from '../../pipes/project-status.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideSearch, LucideX, LucideLogOut, LucidePalette, LucideCheck, LucideSmartphone, TaskStatusPipe, ProjectStatusPipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  public readonly themeService = inject(ThemeService);
  public readonly authService = inject(AuthService);

  get currentUser() {
    return this.authService.currentUser();
  }

  searchQuery = '';
  results: { projects: Project[]; tasks: Task[] } = { projects: [], tasks: [] };
  showDropdown = false;
  isLoading = false;
  
  showUserMenu = false;
  showThemeMenu = false;

  private searchSubject = new Subject<string>();
  private destroyed$ = new Subject<void>();


  get hasResults(): boolean {
    return this.results.projects.length > 0 || this.results.tasks.length > 0;
  }

  get totalResults(): number {
    return this.results.projects.length + this.results.tasks.length;
  }

  get hasSearchTerm(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    private searchService: SearchService,
    private router: Router,
    private elRef: ElementRef
  ) {}

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      switchMap(query => {
        const q = query.trim();

        if (!q) {
          this.results = { projects: [], tasks: [] };
          this.showDropdown = false;
          this.isLoading = false;
          return of({ projects: [], tasks: [] });
        }

        this.isLoading = true;
        this.showDropdown = true;
        return this.searchService.search(q);
      }),
      takeUntil(this.destroyed$)
    ).subscribe({
      next: results => {
        this.results = results;
        this.isLoading = false;
        this.showDropdown = true;
      },
      error: () => {
        this.isLoading = false;
        this.showDropdown = false;
      }
    });
  }

  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }

  goToProject(id?: number) {
    if (id === undefined) return;
    this.closeDropdown();
    this.router.navigate(['/projects', id]);
  }

  goToTask(id?: number) {
    if (id === undefined) return;
    this.closeDropdown();
    this.router.navigate(['/tasks', id]);
  }

  closeDropdown() {
    this.showDropdown = false;
    this.searchQuery = '';
    this.results = { projects: [], tasks: [] };
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.closeDropdown();
      this.showThemeMenu = false;
    }
  }

  toggleThemeMenu(event: Event) {
    event.stopPropagation();
    this.showThemeMenu = !this.showThemeMenu;
    if (this.showThemeMenu) {
      this.closeDropdown();
      this.showUserMenu = false;
    }
  }

  selectTheme(themeId: string) {
    this.themeService.setTheme(themeId as AppTheme);
    this.showThemeMenu = false;
  }

  onLogout(): void {
    this.showUserMenu = false;
    this.authService.logout();
  }


  statusClass(status: string): string {
    const map: Record<string, string> = {
      TODO: 'status-todo',
      IN_PROGRESS: 'status-progress',
      DONE: 'status-done',
      PLANNED: 'status-todo',
      ACTIVE: 'status-active',
      CLOSED: 'status-done'
    };

    return map[status] ?? 'status-todo';
  }
  trackById(index: number, item: Project | Task): number {
    return item.id ?? index;
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
      this.showUserMenu = false;
      this.showThemeMenu = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeDropdown();
    this.showThemeMenu = false;
    this.showUserMenu = false;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Escuchar Ctrl+K o Cmd+K
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault(); // Previene la barra de busqueda nativa del navegador
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }
  }

  ngOnDestroy() {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
