import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserStatusType } from '../models/user.model';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

const TOKEN_KEY = 'app_auth_token';
const USER_KEY = 'app_auth_user';

export interface StatusMeta {
  id: UserStatusType;
  text: string;
  colorClass: string;
  icon: string;
}

export const USER_STATUS_LIST: StatusMeta[] = [
  { id: 'focus', text: 'En Foco', colorClass: 'status-emerald', icon: 'flash' },
  { id: 'online', text: 'En Línea', colorClass: 'status-blue', icon: 'radio-button-on' },
  { id: 'meeting', text: 'En Reunión', colorClass: 'status-amber', icon: 'time' }
];

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Signals para estado reactivo de la sesión
  readonly currentUser = signal<User | null>(this.loadStoredUser());
  readonly token = signal<string | null>(this.loadStoredToken());
  readonly isAuthenticated = computed(() => !!this.token());

  readonly currentStatusMeta = computed<StatusMeta>(() => {
    const status = this.currentUser()?.status || 'focus';
    return USER_STATUS_LIST.find(s => s.id === status) || USER_STATUS_LIST[0];
  });

  private loadStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private saveSession(response: AuthResponse): void {
    const existing = this.loadStoredUser();
    const mergedUser: User = {
      ...response.user,
      avatarUrl: response.user.avatarUrl || existing?.avatarUrl,
      status: response.user.status || existing?.status || 'focus'
    };
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
    this.token.set(response.token);
    this.currentUser.set(mergedUser);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.saveSession(res)),
      catchError((error: HttpErrorResponse) => throwError(() => this.formatError(error)))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.saveSession(res)),
      catchError((error: HttpErrorResponse) => throwError(() => this.formatError(error)))
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token();
  }

  updateAvatar(avatarUrl: string): void {
    const user = this.currentUser();
    if (!user) return;
    const updated: User = { ...user, avatarUrl };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  updateProfile(changes: Partial<Pick<User, 'name' | 'role' | 'status' | 'avatarUrl'>>): void {
    const user = this.currentUser();
    if (!user) return;
    const updated: User = { ...user, ...changes };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  cycleUserStatus(): StatusMeta {
    const current = this.currentUser()?.status || 'focus';
    const idx = USER_STATUS_LIST.findIndex(s => s.id === current);
    const next = USER_STATUS_LIST[(idx + 1) % USER_STATUS_LIST.length];
    this.updateProfile({ status: next.id });
    return next;
  }

  private formatError(error: HttpErrorResponse): Error {
    if (error.status === 0) {
      return new Error('No se pudo conectar con el servidor Backend (http://localhost:8080). Verificá que esté corriendo con npm.cmd run back.');
    }
    if (error.status === 401) {
      const msg = typeof error.error === 'string' && error.error ? error.error : 'Email o contraseña incorrectos.';
      return new Error(msg);
    }
    if (error.status === 409) {
      const msg = typeof error.error === 'string' && error.error ? error.error : 'El correo electrónico ya está registrado.';
      return new Error(msg);
    }
    const msg = typeof error.error === 'string' ? error.error : error.error?.message;
    return new Error(msg || 'Ocurrió un error en la autenticación.');
  }
}
