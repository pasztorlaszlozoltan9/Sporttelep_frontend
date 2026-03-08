import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BookingService } from '../shared/booking.service';
import { PriceService } from '../shared/price.service';
import { SportService } from '../shared/sport.service';
import { LocService } from '../shared/loc.service';
import { FieldService } from '../shared/field.service';
import { UserService } from '../shared/user.service';
import emailjs from '@emailjs/browser';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  private readonly missingBookingTemplatePlaceholder: string = 'YOUR_BOOKING_TEMPLATE_ID';
  private readonly emailJsServiceId: string = 'sporttelepek_0825';
  private readonly emailJsTemplateId: string = 'template_tmtoa2g';
  private readonly emailJsPublicKey: string = '__s7hNRM8XTSCfrSd';
  private readonly mainAdminEmail: string = 'admin@admin.com';

  cardName: string = '';
  cardNumber: string = '';
  expiryMonth: string = '';
  expiryYear: string = '';
  cvc: string = '';
  billingEmail: string = '';
  amountLabel: string = 'N/A';
  private bookingData: any = null;

  constructor(
    private router: Router,
    private bookingService: BookingService,
    private priceService: PriceService,
    private sportService: SportService,
    private locService: LocService,
    private fieldService: FieldService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.bookingData = this.bookingService.getBookingData();

    if (!this.bookingData?.sportId || !this.bookingData?.locationId || !this.bookingData?.fieldId || !this.bookingData?.availableDateId) {
      Swal.fire({
        title: 'Nincs fizetendő foglalás',
        text: 'Először válassz ki egy foglalási időpontot.',
        icon: 'warning'
      });
      this.router.navigate(['/main']);
      return;
    }

    if (this.bookingData?.priceId) {
      this.priceService.getPrices().subscribe({
        next: (res: any) => {
          const prices = res.data ?? res;
          const selectedPrice = (prices as any[]).find((p: any) => Number(p.id) === Number(this.bookingData.priceId));
          this.amountLabel = selectedPrice?.price ? `${selectedPrice.price} Ft` : 'N/A';
        },
        error: () => {
          this.amountLabel = 'N/A';
        }
      });
    }
  }

  onCardNumberInput(value: string): void {
    const digitsOnly = (value || '').replace(/\D+/g, '');
    const capped = digitsOnly.slice(0, 16);
    const grouped = capped.match(/.{1,4}/g)?.join(' ') ?? '';
    this.cardNumber = grouped;
  }

  onExpiryMonthInput(value: string): void {
    const digitsOnly = (value || '').replace(/\D+/g, '');
    this.expiryMonth = digitsOnly.slice(0, 2);
  }

  onExpiryYearInput(value: string): void {
    const digitsOnly = (value || '').replace(/\D+/g, '');
    this.expiryYear = digitsOnly.slice(0, 2);
  }

  onCvcInput(value: string): void {
    const digitsOnly = (value || '').replace(/\D+/g, '');
    this.cvc = digitsOnly.slice(0, 3);
  }

  async submitPayment(): Promise<void> {
    const cardNumberDigits = this.cardNumber.replace(/\D+/g, '');
    const monthNumber = Number(this.expiryMonth);

    if (!this.cardName.trim() || !this.billingEmail.trim()) {
      await Swal.fire({
        title: 'Hiányzó adat',
        text: 'A kártyabirtokos neve és a számlázási email cím kötelező.',
        icon: 'error'
      });
      return;
    }

    if (cardNumberDigits.length !== 16) {
      await Swal.fire({
        title: 'Érvénytelen kártyaszám',
        text: 'A kártyaszámnak pontosan 16 számjegyből kell állnia.',
        icon: 'error'
      });
      return;
    }

    if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      await Swal.fire({
        title: 'Érvénytelen lejárati hónap',
        text: 'A hónapnak 1 és 12 között kell lennie.',
        icon: 'error'
      });
      return;
    }

    if (!/^\d{2}$/.test(this.expiryYear)) {
      await Swal.fire({
        title: 'Érvénytelen lejárati év',
        text: 'Az évnek pontosan 2 számjegyből kell állnia.',
        icon: 'error'
      });
      return;
    }

    if (!/^\d{3}$/.test(this.cvc)) {
      await Swal.fire({
        title: 'Érvénytelen CVC',
        text: 'A CVC-nek pontosan 3 számjegyből kell állnia.',
        icon: 'error'
      });
      return;
    }

    const bookingPayload = {
      ...this.bookingData,
      email: await this.resolveBookingEmailForBackend()
    };

    this.bookingService.addBooking(bookingPayload).subscribe({
      next: async (result: any) => {
        await this.sendBookingEmailNotification();

        const emailWarning = result?.emailWarning ?? result?.data?.emailWarning ?? null;
        if (emailWarning) {
          await Swal.fire({
            title: 'Foglalás sikeres, de email figyelmeztetés',
            text: String(emailWarning),
            icon: 'warning',
            confirmButtonText: 'Tovább'
          });
        } else {
          await Swal.fire({
            title: 'Sikeres fizetés',
            text: 'A fizetésed feldolgozásra került, a foglalásod elmentettük.',
            icon: 'success',
            confirmButtonText: 'Tovább'
          });
        }

        this.bookingService.clearBookingData();
        this.router.navigate(['/profil']);
      },
      error: async () => {
        await Swal.fire({
          title: 'Fizetés sikeres, de a foglalás sikertelen',
          text: 'Hiba történt a foglalás mentése közben.',
          icon: 'error'
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/booking']);
  }

  private async sendBookingEmailNotification(): Promise<void> {
    if (this.emailJsTemplateId === this.missingBookingTemplatePlaceholder) {
      console.warn('EmailJS booking template id is not configured.');
      return;
    }

    const details = await this.resolveBookingDetailsForEmail();

    const bookingSummary = [
      `Sport: ${details.sportName}`,
      `Helyszin: ${details.locationName}`,
      `Palya: ${details.fieldName}`,
      `Foglalo email: ${details.userEmail}`,
      `Datum: ${details.bookingDate}`,
      `Kezdesi ido: ${details.bookingStartTime}`,
      `Ar: ${details.bookingPrice}`,
      `Megjegyzes: ${details.bookingNote}`
    ].join('\n');

    const templateParams = {
      to_email: this.mainAdminEmail,
      email: this.mainAdminEmail,
      from_email: details.userEmail || 'noreply@budapestsporttelepek.local',
      reply_to: details.userEmail || '',
      message: bookingSummary,
      user_email: details.userEmail,
      sport_name: details.sportName,
      location_name: details.locationName,
      field_name: details.fieldName,
      booking_date: details.bookingDate,
      booking_start_time: details.bookingStartTime,
      booking_price: details.bookingPrice,
      booking_note: details.bookingNote
    };

    try {
      await emailjs.send(
        this.emailJsServiceId,
        this.emailJsTemplateId,
        templateParams,
        { publicKey: this.emailJsPublicKey }
      );
    } catch (error: any) {
      console.error('EmailJS admin booking notification error:', error);
      await Swal.fire({
        title: 'Foglalás mentve, de admin email nem ment ki',
        text: 'Kérlek ellenőrizd az EmailJS admin template beállításait.',
        icon: 'warning'
      });
    }
  }

  private async resolveBookingEmailForBackend(): Promise<string | null> {
    const fallbackEmail = this.billingEmail?.trim() || null;

    try {
      const usersRes = await firstValueFrom(this.userService.getUser());
      const users = (usersRes as any)?.data ?? usersRes ?? [];
      const user = (users as any[]).find((u: any) => Number(u.id) === Number(this.bookingData?.userId));
      return user?.email || fallbackEmail;
    } catch {
      return fallbackEmail;
    }
  }

  private async resolveBookingDetailsForEmail(): Promise<{
    sportName: string;
    locationName: string;
    fieldName: string;
    userEmail: string;
    bookingDate: string;
    bookingStartTime: string;
    bookingPrice: string;
    bookingNote: string;
  }> {
    const fallback = {
      sportName: 'N/A',
      locationName: 'N/A',
      fieldName: 'N/A',
      userEmail: this.billingEmail?.trim() || 'N/A',
      bookingDate: this.bookingData?.date || 'N/A',
      bookingStartTime: this.bookingData?.startTime || 'N/A',
      bookingPrice: this.amountLabel || 'N/A',
      bookingNote: this.bookingData?.note?.trim() || 'Nincs megjegyzes'
    };

    try {
      const [sportsRes, locationsRes, fieldsRes, usersRes, pricesRes] = await Promise.all([
        firstValueFrom(this.sportService.getSport()),
        firstValueFrom(this.locService.getLocation()),
        firstValueFrom(this.fieldService.getField()),
        firstValueFrom(this.userService.getUser()),
        firstValueFrom(this.priceService.getPrices())
      ]);

      const sports = (sportsRes as any)?.data ?? sportsRes ?? [];
      const locations = (locationsRes as any)?.data ?? locationsRes ?? [];
      const fields = (fieldsRes as any)?.data ?? fieldsRes ?? [];
      const users = (usersRes as any)?.data ?? usersRes ?? [];
      const prices = (pricesRes as any)?.data ?? pricesRes ?? [];

      const sport = (sports as any[]).find((s: any) => Number(s.id) === Number(this.bookingData?.sportId));
      const location = (locations as any[]).find((l: any) => Number(l.id) === Number(this.bookingData?.locationId));
      const field = (fields as any[]).find((f: any) => Number(f.id) === Number(this.bookingData?.fieldId));
      const user = (users as any[]).find((u: any) => Number(u.id) === Number(this.bookingData?.userId));
      const price = (prices as any[]).find((p: any) => Number(p.id) === Number(this.bookingData?.priceId));

      return {
        sportName: sport?.name || fallback.sportName,
        locationName: location?.name || fallback.locationName,
        fieldName: field?.name || fallback.fieldName,
        userEmail: user?.email || fallback.userEmail,
        bookingDate: fallback.bookingDate,
        bookingStartTime: fallback.bookingStartTime,
        bookingPrice: price?.price ? `${price.price} Ft` : fallback.bookingPrice,
        bookingNote: fallback.bookingNote
      };
    } catch (error) {
      console.error('Error resolving booking details for email:', error);
      return fallback;
    }
  }
}
