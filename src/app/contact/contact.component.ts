import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  private readonly host = 'http://localhost:8000/api/';
  protected isSending = false;
  protected contactForm;

  constructor(private builder: FormBuilder, private http: HttpClient) {
    this.contactForm = this.builder.group({
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  async sendMessage() {
    if (this.isSending) {
      return;
    }

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const email = String(this.contactForm.value.email ?? '').trim();
    const message = String(this.contactForm.value.message ?? '').trim();

    this.isSending = true;
    this.showProcessingAlert('Üzenet küldése folyamatban...');

    try {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Content-Type': 'application/json'
      });

      await firstValueFrom(
        this.http.post(`${this.host}contact`, { email, message }, { headers })
      );

      Swal.close();
      await Swal.fire({
        title: 'Üzenet elküldve!',
        icon: 'success'
      });
      this.contactForm.reset();
    } catch (error: any) {
      Swal.close();
      const status = error?.status ?? 'unknown';
      const detail = error?.error?.message ?? error?.message ?? 'Ismeretlen hiba';
      await Swal.fire({
        title: 'Küldés sikertelen',
        text: `Hiba (${status}): ${detail}`,
        icon: 'error'
      });
      console.error('Contact send error:', error);
    } finally {
      this.isSending = false;
    }
  }

  private showProcessingAlert(message: string): void {
    void Swal.fire({
      title: 'Folyamatban',
      text: message,
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }
}
