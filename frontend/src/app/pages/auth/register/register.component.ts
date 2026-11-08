import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import {
  LucideUser,
  LucideMail,
  LucideLock,
  LucideEye,
  LucideEyeOff,
  LucideArrowRight,
  LucideAlertCircle,
  LucideSparkles
} from '@lucide/angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideUser,
    LucideMail,
    LucideLock,
    LucideEye,
    LucideEyeOff,
    LucideArrowRight,
    LucideAlertCircle,
    LucideSparkles
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

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.register(this.form.value).subscribe({
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
