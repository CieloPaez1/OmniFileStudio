import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  showPassword = signal<boolean>(false);
  rememberSession = signal<boolean>(true);

  form: FormGroup = this.fb.group({
    email: ['admin@proyectos.com', [Validators.required]],
    password: ['admin123', [Validators.required, Validators.minLength(4)]]
  });

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleRemember(): void {
    this.rememberSession.update(v => !v);
  }

  fillDemoCredentials(): void {
    this.form.patchValue({
      email: 'admin@proyectos.com',
      password: 'admin123'
    });
    this.error.set(null);
  }

  onSubmit(targetRoute = '/mobile/dashboard'): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate([targetRoute]);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message || 'Credenciales inválidas. Probá con admin@proyectos.com / admin123');
      }
    });
  }
}
