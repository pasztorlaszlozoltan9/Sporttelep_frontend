import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../shared/admin.service';
import { AuthService } from '../shared/auth.service';
import emailjs from '@emailjs/browser';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {
  private readonly defaultCardImage: string = 'pics/index_background.jpg';
  private readonly locationImageByKey: Record<string, string> = {
    'bme sporttelep': 'bme sporttelep.jpg',
    'pokorny jozsef sport es szabadidokozpont': 'Pokorny József Sport- és Szabadidőközpont.jpg',
    'varosligeti sportcentrum': 'városligeti sportcentrum.jpg',
    'ujbudai sportcentrum': 'Újbudai Sportcentrum.jpg',
    'ujpalotai uti sporttelep': 'Újpalotai úti Sporttelep.jpg'
  };

  private readonly emailJsServiceId: string = 'sporttelepek_0825';
  private readonly emailJsBookingUpdateTemplateId: string = 'template_pz3d5z8';
  private readonly emailJsBookingDeleteTemplateId: string = 'template_9cdc5ki';
  private readonly emailJsPublicKey: string = '__s7hNRM8XTSCfrSd';
  private readonly mainAdminEmail: string = 'admin@admin.com';

  user: any = null;
  host = 'http://localhost:8000/api/'

  protected readonly builder = inject(FormBuilder)
  protected readonly api = inject(AdminService)

  protected bookings: any = []
  protected sports: any = []
  protected locations: any = []
  protected fields: any = []
  protected prices: any = []
  protected availableDates: any = []
  

  protected editingUserId: number | null = null;
  protected showModal = false;
  protected showPasswordModal = false;
  protected showDeleteModal = false;
  protected showBookingModal = false;
  protected showBookingDeleteModal = false;
  protected isBookingActionInProgress = false;
  protected deletingUserId: number | null = null;
  protected editingBookingId: number | null = null;
  protected deletingBookingId: number | null = null;

  protected userForm = this.builder.group({
    email: '',
    password: '',
    currentPassword: '',
    phone: '',
    fullname: '',
    roleId: '',
    verified: ''
  })

  protected passwordForm = this.builder.group({
    password: '',
    password_confirmation: ''
  })

  protected deleteForm = this.builder.group({
    password: '',
    password_confirmation: ''
  })

  protected bookingForm = this.builder.group({
    sportId: '',
    locationId: '',
    fieldId: '',
    userId: '',
    date: '',
    startTime: '',
    availableDateId: '',
    priceId: '',
  })

  protected bookingDeleteForm = this.builder.group({
    password: ''
  })

  constructor(
    private router: Router,
    private http: HttpClient,
    private auth: AuthService
  ) { }

  startShowModal() {
    this.editingUserId = null;
    this.userForm.reset();
    this.showModal = true;
  }

  startCloseModal() {
    this.showModal = false;
    this.editingUserId = null;
    this.userForm.reset();
  }

  startShowPasswordModal() {
    this.passwordForm.reset();
    this.showPasswordModal = true;
  }

  startClosePasswordModal() {
    this.showPasswordModal = false;
    this.passwordForm.reset();
  }

  startCloseDeleteModal() {
    this.showDeleteModal = false;
    this.deletingUserId = null;
    this.deleteForm.reset();
  }

  startCloseBookingModal() {
    this.showBookingModal = false;
    this.editingBookingId = null;
    this.bookingForm.reset();
  }

  startCloseBookingDeleteModal() {
    this.showBookingDeleteModal = false;
    this.deletingBookingId = null;
    this.bookingDeleteForm.reset();
  }







  ngOnInit(): void {
    this.loadUserData();
    this.loadAllData();
  }

  loadAllData(): void {
    this.http.get(`${this.host}bookings`).subscribe({
      next: (res: any) => this.bookings = res.data ?? res ?? []
    });
    this.http.get(`${this.host}sports`).subscribe({
      next: (res: any) => this.sports = res.data ?? res ?? []
    });
    this.http.get(`${this.host}locations`).subscribe({
      next: (res: any) => this.locations = res.data ?? res ?? []
    });
    this.http.get(`${this.host}fields`).subscribe({
      next: (res: any) => this.fields = res.data ?? res ?? []
    });
    this.http.get(`${this.host}prices`).subscribe({
      next: (res: any) => this.prices = res.data ?? res ?? []
    });
    this.http.get(`${this.host}availableDates`).subscribe({
      next: (res: any) => this.availableDates = res.data ?? res ?? []
    });
  }

  loadUserData(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const userId = decodedToken.id;

        // Fetch full user data from backend
        this.http.get(`${this.host}users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).subscribe({
          next: (response: any) => {
            this.user = response.data; // Extract from 'data' property
            //console.log('User data:', this.user);
          },
          error: (error) => {
            console.error('Error fetching user data:', error);
            this.user = null;
          }
        });
      } catch (error) {
        console.error('Error decoding token:', error);
        this.user = null;
      }
    }
  }

  async startSave() {
    const confirmation = await Swal.fire({
      title: 'Biztosan mented a változtatásokat?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Mentés',
      cancelButtonText: 'Mégsem'
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    const phone = String(this.userForm.value.phone ?? '').trim();
    if (!this.isPhoneValid(phone)) {
      Swal.fire({
        title: 'Érvénytelen telefonszám',
        text: 'A telefonszámnak + jellel kell kezdődnie (pl. +36301234567).',
        icon: 'warning'
      });
      return;
    }

    if (this.editingUserId) {

      const currentPassword = this.userForm.value.currentPassword?.trim();
      const loginEmail = this.user?.email?.trim();

      if (!currentPassword) {
        Swal.fire({
          title: 'Add meg a jelenlegi jelszavad!',
          icon: 'error'
        });
        return;
      }

      if (!loginEmail) {
        Swal.fire({
          title: 'A felhasználói email nem elérhető a hitelesítéshez!',
          icon: 'error'
        });
        return;
      }

      // Update existing user - include roleId
      const userData: any = {
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        phone,
        fullname: this.userForm.value.fullname,
        roleId: this.userForm.value.roleId,
        verified: this.userForm.value.verified
      };


      this.auth.login({ email: loginEmail, password: currentPassword }).subscribe({
        next: () => {
          this.api.updateUser(this.editingUserId!, userData).subscribe({
            next: (result: any) => {
              this.showModal = false;
              this.editingUserId = null;
              this.userForm.reset();
              Swal.fire({
                title: "Sikeres módosítás!",
                icon: "success",
                draggable: true
              });
              this.loadUserData();
            },
            error: (err: any) => {
              Swal.fire({
                title: "Hiba történt a módosítás során!",
                icon: "error",
                draggable: true
              });
              console.error('Error updating user:', err);
              console.error('Status:', err.status);
              console.error('Error message:', err.message);
            }
          });
        },
        error: () => {
          Swal.fire({
            title: 'Hibás jelszó! A mentés megszakítva.',
            icon: 'error'
          });
        }
      });
    } else {
      // Create new user - don't include roleId
      const userData: any = {
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        // password_confirmation: this.userForm.value.password_confirmation,
        phone,
        fullname: this.userForm.value.fullname
      };

      this.api.addUser(userData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.userForm.reset();
          Swal.fire({
            title: "Sikeres létrehozás!",
            icon: "success",
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: "Hiba történt a létrehozás során!",
            icon: "error",
            draggable: true
          });
          console.error('Error saving user:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdateUser(user: any) {
    this.editingUserId = user.id;
    this.userForm.patchValue({
      email: user.email,
      currentPassword: '',
      phone: user.phone,
      fullname: user.fullname,
      roleId: user.roleId,
      verified: user.verified
    });
    this.showModal = true;
  }

  async startDeleteUser(userId: number) {
    const confirmation = await Swal.fire({
      title: 'Biztosan törölni szeretnéd ezt a felhasználót?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Törlés',
      cancelButtonText: 'Mégsem'
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    this.deletingUserId = userId;
    this.deleteForm.reset();
    this.showDeleteModal = true;
  }

  confirmDeleteUser() {
    const password = this.deleteForm.value.password?.trim();
    const passwordConfirmation = this.deleteForm.value.password_confirmation?.trim();
    const loginEmail = this.user?.email?.trim();

    if (!password || !passwordConfirmation) {
      Swal.fire({
        title: 'A törléshez add meg a jelszót és a megerősítést!',
        icon: 'error'
      });
      return;
    }

    if (password !== passwordConfirmation) {
      Swal.fire({
        title: 'A két jelszó nem egyezik!',
        icon: 'error'
      });
      return;
    }

    if (!loginEmail || !this.deletingUserId) {
      Swal.fire({
        title: 'Hiányzik felhasználói adat a törléshez!',
        icon: 'error'
      });
      return;
    }

    this.auth.login({ email: loginEmail, password }).subscribe({
      next: () => {
        this.api.deleteUser(this.deletingUserId!).subscribe({
          next: () => {
            this.startCloseDeleteModal();
            Swal.fire({
              title: 'Sikeres törlés!',
              icon: 'success',
              draggable: true
            });
            this.auth.logout();
            window.dispatchEvent(new Event('authStateChanged'));
            // this.checkLoginStatus();
          },
          error: (err: any) => {
            console.error('Error deleting user:', err);
            console.error('Status:', err.status);
            console.error('Error message:', err.message);
            Swal.fire({
              title: 'Hiba történt a törlés során!',
              icon: 'error'
            });
          }
        });
      },
      error: () => {
        Swal.fire({
          title: 'Hibás jelszó! A törlés megszakítva.',
          icon: 'error'
        });
      }
    });
  }

  async startSavePassword() {
    const confirmation = await Swal.fire({
      title: 'Biztosan mented az új jelszót?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Mentés',
      cancelButtonText: 'Mégsem'
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    const password = this.passwordForm.value.password?.trim();
    const passwordConfirmation = this.passwordForm.value.password_confirmation?.trim();

    if (!password || !passwordConfirmation) {
      console.error('Password and confirmation are required');
      return;
    }

    if (password !== passwordConfirmation) {
      console.error('Passwords do not match');
      return;
    }

    if (!this.user?.id) {
      console.error('User ID is missing');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    const payload = {
      password: password,
      password_confirmation: passwordConfirmation
    };

    this.http.put(`${this.host}users/${this.user.id}/password`, payload, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (response: any) => {
        this.showPasswordModal = false;
        Swal.fire({
          title: "Sikeres módosítás!",
          icon: "success",
          draggable: true
        });
        this.passwordForm.reset();
      },
      error: (err: any) => {
        console.error('Error updating password:', err);
      }
    });
  }

  getUserBookings(): any[] {
    if (!this.user?.id || !this.bookings) return [];
    return (this.bookings as any[])
      .filter((b: any) => b.userId === this.user.id)
      .sort((a: any, b: any) => {
        const firstDate = String(a?.date ?? '');
        const secondDate = String(b?.date ?? '');
        const dateCompare = firstDate.localeCompare(secondDate);
        if (dateCompare !== 0) {
          return dateCompare;
        }

        const firstStart = String(a?.startTime ?? '');
        const secondStart = String(b?.startTime ?? '');
        return firstStart.localeCompare(secondStart);
      });
  }

  getSportName(sportId: number): string {
    if (!this.sports) return 'N/A';
    const sport = (this.sports as any[]).find(s => s.id === sportId);
    return sport?.name || 'N/A';
  }

  getLocationName(locationId: number): string {
    if (!this.locations) return 'N/A';
    const location = (this.locations as any[]).find(l => l.id === locationId);
    return location?.name || 'N/A';
  }

  private normalizeNameKey(value: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private encodePathSegments(path: string): string {
    return path
      .split('/')
      .map((segment: string) => encodeURIComponent(segment))
      .join('/');
  }

  getLocationCardImage(locationId: number): string {
    if (!this.locations) {
      return this.defaultCardImage;
    }

    const location = (this.locations as any[]).find((l: any) => l.id === locationId);
    const locationName = String(location?.name ?? '').trim();
    if (!locationName) {
      return this.defaultCardImage;
    }

    const mapped = this.locationImageByKey[this.normalizeNameKey(locationName)] ?? `${locationName}.jpg`;
    return this.encodePathSegments(`pics/locations/${mapped}`);
  }

  getFieldName(fieldId: number): string {
    if (!this.fields) return 'N/A';
    const field = (this.fields as any[]).find(f => f.id === fieldId);
    return field?.name || 'N/A';
  }

  getAvailableDateInfo(availableDateId: number): string {
    if (!this.availableDates) return 'N/A';
    const availableDate = (this.availableDates as any[]).find(d => d.id === availableDateId);
    return availableDate ? `${availableDate.date} ${availableDate.startTime}` : 'N/A';
  }

  getPriceValue(priceId: number): string {
    if (!this.prices) return 'N/A';
    const price = (this.prices as any[]).find(p => p.id === priceId);
    return price?.price ? `${price.price} Ft` : 'N/A';
  }

  private parseId(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  onBookingSportChange() {
    this.bookingForm.patchValue({
      fieldId: '',
      availableDateId: '',
      priceId: '',
      date: '',
      startTime: ''
    });
  }

  onBookingLocationChange() {
    this.bookingForm.patchValue({
      fieldId: '',
      availableDateId: '',
      priceId: '',
      date: '',
      startTime: ''
    });
  }

  onBookingFieldChange() {
    this.bookingForm.patchValue({
      availableDateId: '',
      priceId: '',
      date: '',
      startTime: ''
    });
  }

  onBookingAvailableDateChange() {
    const availableDateId = this.parseId(this.bookingForm.value.availableDateId);
    if (!availableDateId || !this.availableDates) {
      this.bookingForm.patchValue({ date: '', startTime: '' });
      return;
    }

    const availableDate = (this.availableDates as any[]).find((d: any) => d.id === availableDateId);
    this.bookingForm.patchValue({
      date: availableDate?.date || '',
      startTime: availableDate?.startTime || ''
    });
  }

  getFilteredFields(): any[] {
    const sportId = this.parseId(this.bookingForm.value.sportId);
    const locationId = this.parseId(this.bookingForm.value.locationId);
    if (!this.fields || !sportId || !locationId) return [];

    return (this.fields as any[]).filter((field: any) => field.sportId === sportId && field.locationId === locationId);
  }

  getFilteredAvailableDates(): any[] {
    const fieldId = this.parseId(this.bookingForm.value.fieldId);
    if (!this.availableDates || !fieldId) return [];

    return (this.availableDates as any[]).filter((date: any) => {
      if (date.fieldId !== fieldId) return false;
      return !this.isAvailableDateBooked(date.id) || this.isEditingThisAvailableDate(date.id);
    });
  }

  getFilteredPrices(): any[] {
    const fieldId = this.parseId(this.bookingForm.value.fieldId);
    if (!this.prices || !fieldId) return [];

    return (this.prices as any[]).filter((price: any) => price.fieldId === fieldId);
  }

  private isAvailableDateBooked(availableDateId: number): boolean {
    if (!this.bookings) return false;
    return (this.bookings as any[]).some((booking: any) => booking.availableDateId === availableDateId);
  }

  private isEditingThisAvailableDate(availableDateId: number): boolean {
    if (!this.editingBookingId || !this.bookings) return false;
    const currentBooking = (this.bookings as any[]).find((b: any) => b.id === this.editingBookingId);
    return currentBooking?.availableDateId === availableDateId;
  }

  startUpdateBooking(booking: any) {
    this.editingBookingId = booking.id;
    this.bookingForm.patchValue({
      sportId: booking.sportId,
      locationId: booking.locationId,
      fieldId: booking.fieldId,
      userId: booking.userId,
      availableDateId: booking.availableDateId,
      priceId: booking.priceId,
      date: booking.date,
      startTime: booking.startTime
    });
    this.showBookingModal = true;
  }

  private buildBookingNotificationData(booking: any) {
    return {
      sportName: this.getSportName(Number(booking?.sportId)),
      locationName: this.getLocationName(Number(booking?.locationId)),
      fieldName: this.getFieldName(Number(booking?.fieldId)),
      bookingDate: booking?.date || 'N/A',
      bookingStartTime: booking?.startTime || 'N/A',
      bookingPrice: this.getPriceValue(Number(booking?.priceId)),
      userEmail: this.user?.email || 'N/A'
    };
  }

  private async sendAdminBookingActionEmail(action: 'update' | 'delete', booking: any): Promise<string | null> {
    const templateId = action === 'update'
      ? this.emailJsBookingUpdateTemplateId
      : this.emailJsBookingDeleteTemplateId;
    const actionLabel = action === 'update' ? 'módosítás' : 'törlés';

    const data = this.buildBookingNotificationData(booking);
    const bookingSummary = [
      `Muvelet: Foglalas ${actionLabel}`,
      `Foglalo email: ${data.userEmail}`,
      `Sport: ${data.sportName}`,
      `Helyszin: ${data.locationName}`,
      `Palya: ${data.fieldName}`,
      `Datum: ${data.bookingDate}`,
      `Kezdesi ido: ${data.bookingStartTime}`,
      `Ar: ${data.bookingPrice}`
    ].join('\n');

    const templateParams = {
      to_email: this.mainAdminEmail,
      email: this.mainAdminEmail,
      from_email: data.userEmail || 'noreply@budapestsporttelepek.local',
      reply_to: data.userEmail || '',
      message: bookingSummary,
      action_type: actionLabel,
      user_email: data.userEmail,
      sport_name: data.sportName,
      location_name: data.locationName,
      field_name: data.fieldName,
      booking_date: data.bookingDate,
      booking_start_time: data.bookingStartTime,
      booking_price: data.bookingPrice
    };

    try {
      await emailjs.send(
        this.emailJsServiceId,
        templateId,
        templateParams,
        { publicKey: this.emailJsPublicKey }
      );
      return null;
    } catch (error: any) {
      console.error(`EmailJS admin booking ${actionLabel} notification error:`, error);
      const status = error?.status ? `status: ${error.status}` : 'status: unknown';
      const details = error?.text || error?.message || 'unknown error';
      return `${status}, details: ${details}`;
    }
  }

  async startSaveBooking() {
    if (this.isBookingActionInProgress) {
      return;
    }

    if (!this.editingBookingId || !this.user?.id) {
      return;
    }

    const confirmed = await Swal.fire({
      title: 'Biztosan mented a módosítást?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Mentés',
      cancelButtonText: 'Mégsem'
    });

    if (!confirmed.isConfirmed) {
      return;
    }

    const bookingData = {
      sportId: this.bookingForm.value.sportId,
      locationId: this.bookingForm.value.locationId,
      fieldId: this.bookingForm.value.fieldId,
      userId: this.user.id,
      availableDateId: this.bookingForm.value.availableDateId,
      priceId: this.bookingForm.value.priceId,
      date: this.bookingForm.value.date,
      startTime: this.bookingForm.value.startTime,
      email: this.user?.email || null
    };

    this.isBookingActionInProgress = true;
    this.showProcessingAlert('Foglalás módosítása folyamatban...');

    this.http.put(`${this.host}bookings/${this.editingBookingId}`, bookingData).subscribe({
      next: async (response: any) => {
        try {
          this.updateProcessingAlert('Foglalás módosítva, email küldése...');
          const adminEmailError = await this.sendAdminBookingActionEmail('update', bookingData);

          this.startCloseBookingModal();
          this.loadAllData();
          Swal.close();

          const emailWarning = response?.emailWarning ?? response?.data?.emailWarning ?? null;
          if (emailWarning) {
            await Swal.fire({
              title: 'Foglalás módosítva, de email figyelmeztetés',
              text: String(emailWarning),
              icon: 'warning'
            });
            return;
          }

          if (adminEmailError) {
            await Swal.fire({
              title: 'Foglalás módosítva, de admin email nem ment ki',
              text: `EmailJS hiba: ${adminEmailError}`,
              icon: 'warning'
            });
            return;
          }

          await Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success'
          });
        } finally {
          this.isBookingActionInProgress = false;
        }
      },
      error: async (err: any) => {
        console.error('Error updating booking:', err);
        this.isBookingActionInProgress = false;
        Swal.close();
        await Swal.fire({
          title: 'Hiba történt a módosítás során!',
          icon: 'error'
        });
      }
    });
  }

  async startDeleteBooking(bookingId: number) {
    if (this.isBookingActionInProgress) {
      return;
    }

    const confirmed = await Swal.fire({
      title: 'Biztosan törölni szeretnéd ezt a foglalást?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Törlés',
      cancelButtonText: 'Mégsem'
    });

    if (!confirmed.isConfirmed) {
      return;
    }

    this.deletingBookingId = bookingId;
    this.bookingDeleteForm.reset();
    this.isBookingActionInProgress = true;
    this.showProcessingAlert('Foglalás törlése folyamatban...');

    const bookingToDelete = (this.bookings as any[])?.find((b: any) => b.id === this.deletingBookingId);

    this.http.delete(`${this.host}bookings/${this.deletingBookingId}`).subscribe({
      next: async (response: any) => {
        try {
          this.updateProcessingAlert('Foglalás törölve, email küldése...');
          const adminEmailError = await this.sendAdminBookingActionEmail('delete', bookingToDelete);

          this.startCloseBookingDeleteModal();
          this.loadAllData();
          Swal.close();

          const emailWarning = response?.emailWarning ?? response?.data?.emailWarning ?? null;
          if (emailWarning) {
            await Swal.fire({
              title: 'Foglalás törölve, de email figyelmeztetés',
              text: String(emailWarning),
              icon: 'warning'
            });
            return;
          }

          if (adminEmailError) {
            await Swal.fire({
              title: 'Foglalás törölve, de admin email nem ment ki',
              text: `EmailJS hiba: ${adminEmailError}`,
              icon: 'warning'
            });
            return;
          }

          await Swal.fire({
            title: 'Sikeres törlés!',
            icon: 'success'
          });
        } finally {
          this.isBookingActionInProgress = false;
        }
      },
      error: async (err: any) => {
        console.error('Error deleting booking:', err);
        this.isBookingActionInProgress = false;
        Swal.close();
        await Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error'
        });
      }
    });
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

  private updateProcessingAlert(message: string): void {
    if (!Swal.isVisible()) {
      this.showProcessingAlert(message);
      return;
    }

    Swal.update({ text: message });
    Swal.showLoading();
  }

 //Jelszó ellenörzés
   protected isPasswordLongEnough(): boolean {
    const password = String(this.passwordForm?.value?.password ?? '');
    return password.length >= 8;
  }

   protected hasLowercaseInPassword(): boolean {
    const password = String(this.passwordForm?.value?.password ?? '');
    return /[a-z]/.test(password);
  }

   protected hasUppercaseInPassword(): boolean {
    const password = String(this.passwordForm?.value?.password ?? '');
    return /[A-Z]/.test(password);
  }

   protected hasSpecialCharInPassword(): boolean {
    const password = String(this.passwordForm?.value?.password ?? '');
    return /[^A-Za-z0-9]/.test(password);
  }

  protected isPasswordValid(password: string): boolean {
    const minLengthOk = password.length >= 8;
    const lowercaseOk = /[a-z]/.test(password);
    const uppercaseOk = /[A-Z]/.test(password);
    const specialOk = /[^A-Za-z0-9]/.test(password);

    return minLengthOk && lowercaseOk && uppercaseOk && specialOk;
  }

  private isPhoneValid(phone: string): boolean {
    return /^\+[0-9]{8,15}$/.test(String(phone ?? '').trim());
  }

  
}

