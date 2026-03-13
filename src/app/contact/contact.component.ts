import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import emailjs from '@emailjs/browser';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  private readonly missingTemplatePlaceholder = 'YOUR_TEMPLATE_ID';
  private readonly missingPublicKeyPlaceholder = 'YOUR_PUBLIC_KEY';
  private readonly emailJsServiceId = 'sporttelepek_0825';
  private readonly emailJsTemplateId = 'template_fhn9jml';
  private readonly emailJsPublicKey = '__s7hNRM8XTSCfrSd';
  protected isSending = false;
  protected contactForm;

  constructor(private builder: FormBuilder) {
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

    const templateParams = {
      from_email: email,
      message,
      reply_to: email
    };

    this.isSending = true;
    this.showProcessingAlert('Üzenet küldése folyamatban...');

    try {
      await emailjs.send(
        this.emailJsServiceId,
        this.emailJsTemplateId,
        templateParams,
        { publicKey: this.emailJsPublicKey }
      );

      Swal.close();
      await Swal.fire({
        title: 'Üzenet elküldve!',
        icon: 'success'
      });
      this.contactForm.reset();
    } catch (error: any) {
      const status = error?.status ?? 'unknown';
      const details = error?.text ?? error?.message ?? 'Ismeretlen hiba';

      Swal.close();
      await Swal.fire({
        title: 'Küldés sikertelen',
        text: `EmailJS hiba (${status}): ${details}`,
        icon: 'error'
      });
      console.error('EmailJS send error:', error);
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
