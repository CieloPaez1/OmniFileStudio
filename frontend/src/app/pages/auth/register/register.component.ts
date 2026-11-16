import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  acceptTerms = signal<boolean>(true);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['']
  });

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  toggleAcceptTerms(): void {
    this.acceptTerms.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password, confirmPassword } = this.form.value;
    if (confirmPassword && password !== confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    if (!this.acceptTerms()) {
      this.error.set('Debés aceptar los términos y condiciones');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.register({ name, email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/mobile/dashboard']);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.error.set(err.message || 'Error al registrar usuario');
      }
    });
  }
}
