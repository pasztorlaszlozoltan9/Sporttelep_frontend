import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  loading = false;
  success = false;
  error = false;
  token: string | null = null;

  resetForm = this.fb.group({
    password: ['', [Validators.required]],
    password_confirmation: ['', [Validators.required]],
  });

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token');
    if (!this.token) {
      this.error = true;
    }
  }

  protected isPasswordLongEnough(): boolean {
    return String(this.resetForm?.value?.password ?? '').length >= 8;
  }

  protected hasLowercaseInPassword(): boolean {
    return /[a-z]/.test(String(this.resetForm?.value?.password ?? ''));
  }

  protected hasUppercaseInPassword(): boolean {
    return /[A-Z]/.test(String(this.resetForm?.value?.password ?? ''));
  }

  protected hasSpecialCharInPassword(): boolean {
    return /[^A-Za-z0-9]/.test(String(this.resetForm?.value?.password ?? ''));
  }

  private isPasswordValid(password: string): boolean {
    return (
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }

  submit() {
    const password = String(this.resetForm.value.password ?? '').trim();
    const passwordConfirmation = String(this.resetForm.value.password_confirmation ?? '').trim();

    if (!password || !passwordConfirmation) {
      Swal.fire({ title: 'Töltsd ki mindkét mezőt!', icon: 'warning' });
      return;
    }

    if (!this.isPasswordValid(password)) {
      Swal.fire({
        title: 'Gyenge jelszó',
        text: 'A jelszónak legalább 8 karakterből kell állnia, és tartalmaznia kell kisbetűt, nagybetűt, valamint speciális karaktert.',
        icon: 'warning',
      });
      return;
    }

    if (password !== passwordConfirmation) {
      Swal.fire({ title: 'A két jelszó nem egyezik!', icon: 'error' });
      return;
    }

    if (!this.token) {
      this.error = true;
      return;
    }

    this.loading = true;

    this.auth.resetPassword(this.token, password, passwordConfirmation).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
