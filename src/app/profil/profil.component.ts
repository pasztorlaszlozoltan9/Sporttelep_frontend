import { Component, ElementRef, HostListener, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../shared/admin.service';
import { AuthService } from '../shared/auth.service';
import { BookingService } from '../shared/booking.service';
import emailjs from '@emailjs/browser';
import Swal from 'sweetalert2';
import flatpickr from 'flatpickr';
import { Hungarian } from 'flatpickr/dist/l10n/hu.js';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit, OnDestroy {
  private readonly emailJsServiceId: string = 'sporttelepek_0825';
  private readonly emailJsBookingUpdateTemplateId: string = 'template_pz3d5z8';
  private readonly emailJsBookingDeleteTemplateId: string = 'template_9cdc5ki';
  private readonly emailJsUserDeleteTemplateId: string = 'template_os8a0gg';
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
  protected fieldBookingWindows: any = []
  

  protected editingUserId: number | null = null;
  protected showModal = false;
  protected showPasswordModal = false;
  protected showDeleteModal = false;
  protected showBookingModal = false;
  protected showBookingDeleteModal = false;
  protected isBookingActionInProgress = false;
  protected isUserDeleteInProgress = false;
  protected deletingUserId: number | null = null;
  protected editingBookingId: number | null = null;
  protected deletingBookingId: number | null = null;
  protected openBookingDropdown: 'sport' | 'location' | 'field' | 'price' | null = null;

  private bookingDatePickerInstance: any = null;
  private bookingStartTimePickerInstance: any = null;
  private bookingEndTimePickerInstance: any = null;

  @ViewChild('bookingDatePicker')
  bookingDatePicker?: ElementRef<HTMLInputElement>;

  @ViewChild('bookingStartTimePicker')
  bookingStartTimePicker?: ElementRef<HTMLInputElement>;

  @ViewChild('bookingEndTimePicker')
  bookingEndTimePicker?: ElementRef<HTMLInputElement>;

  protected userForm = this.builder.group({
    email: '',

    //jelszó kérés megszüntetése módosításnál és törlésnél
    password: '',
    phone: '',
    fullname: '',
    roleId: '',
    verified: '',
    active: ''
  })

  protected passwordForm = this.builder.group({
    password: '',
    password_confirmation: ''
  })

  protected deleteForm = this.builder.group({
    password: ['', Validators.required],
    password_confirmation: ['', Validators.required]
  })

  protected bookingForm = this.builder.group({
    sportId: '',
    locationId: '',
    fieldId: '',
    userId: '',
    date: '',
    startTime: '',
    endTime: '',
    priceId: '',
  })

  protected bookingDeleteForm = this.builder.group({
    password: ''
  })

  constructor(
    private router: Router,
    private http: HttpClient,
    private auth: AuthService,
    private bookingService: BookingService
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
    this.isUserDeleteInProgress = false;
    this.deletingUserId = null;
    this.deleteForm.reset();
  }

  startCloseBookingModal() {
    this.destroyBookingModalPickers();
    this.closeBookingDropdown();
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

  ngOnDestroy(): void {
    this.destroyBookingModalPickers();
  }

  private initializeBookingModalPickersWhenReady(): void {
    setTimeout(() => {
      const dateInput = this.bookingDatePicker?.nativeElement;
      const startInput = this.bookingStartTimePicker?.nativeElement;
      const endInput = this.bookingEndTimePicker?.nativeElement;

      if (dateInput) {
        this.bookingDatePickerInstance?.destroy();
        this.bookingDatePickerInstance = flatpickr(dateInput, {
          locale: Hungarian,
          dateFormat: 'Y-m-d',
          disableMobile: true,
          static: true,
          defaultDate: String(this.bookingForm.value.date ?? '') || undefined,
          onChange: (_selectedDates, dateStr) => this.bookingForm.patchValue({ date: dateStr })
        });
      }

      if (startInput) {
        const startPickerState = {
          confirmed: false,
          initialValue: this.normalizeTimeForInput(this.bookingForm.value.startTime),
          pendingValue: this.normalizeTimeForInput(this.bookingForm.value.startTime)
        };

        this.bookingStartTimePickerInstance?.destroy();
        this.bookingStartTimePickerInstance = flatpickr(startInput, {
          locale: Hungarian,
          enableTime: true,
          noCalendar: true,
          time_24hr: true,
          dateFormat: 'H:i',
          minuteIncrement: 15,
          disableMobile: true,
          static: true,
          defaultDate: this.normalizeTimeForInput(this.bookingForm.value.startTime),
          onReady: (_selectedDates, _timeStr, instance) => {
            this.ensureTimePickerConfirmButton(
              instance,
              (value) => this.bookingForm.patchValue({ startTime: value }),
              startPickerState
            );
          },
          onOpen: (_selectedDates, _timeStr, instance) => {
            startPickerState.confirmed = false;
            startPickerState.initialValue = this.normalizeTimeForInput(this.bookingForm.value.startTime);
            startPickerState.pendingValue = startPickerState.initialValue;
            this.ensureTimePickerConfirmButton(
              instance,
              (value) => this.bookingForm.patchValue({ startTime: value }),
              startPickerState
            );
          },
          onChange: (_selectedDates, timeStr) => {
            startPickerState.pendingValue = this.normalizeTimeForInput(timeStr);
          },
          onValueUpdate: (_selectedDates, timeStr) => {
            startPickerState.pendingValue = this.normalizeTimeForInput(timeStr);
          },
          onClose: (_selectedDates, _timeStr, instance) => {
            if (startPickerState.confirmed) {
              startPickerState.confirmed = false;
              return;
            }

            this.bookingForm.patchValue({ startTime: startPickerState.initialValue });

            if (startPickerState.initialValue) {
              instance.setDate(startPickerState.initialValue, false, 'H:i');
            } else {
              instance.clear(false);
              (instance.input as HTMLInputElement).value = '';
            }
          }
        });
      }

      if (endInput) {
        const endPickerState = {
          confirmed: false,
          initialValue: this.normalizeTimeForInput(this.bookingForm.value.endTime),
          pendingValue: this.normalizeTimeForInput(this.bookingForm.value.endTime)
        };

        this.bookingEndTimePickerInstance?.destroy();
        this.bookingEndTimePickerInstance = flatpickr(endInput, {
          locale: Hungarian,
          enableTime: true,
          noCalendar: true,
          time_24hr: true,
          dateFormat: 'H:i',
          minuteIncrement: 15,
          disableMobile: true,
          static: true,
          defaultDate: this.normalizeTimeForInput(this.bookingForm.value.endTime),
          onReady: (_selectedDates, _timeStr, instance) => {
            this.ensureTimePickerConfirmButton(
              instance,
              (value) => this.bookingForm.patchValue({ endTime: value }),
              endPickerState
            );
          },
          onOpen: (_selectedDates, _timeStr, instance) => {
            endPickerState.confirmed = false;
            endPickerState.initialValue = this.normalizeTimeForInput(this.bookingForm.value.endTime);
            endPickerState.pendingValue = endPickerState.initialValue;
            this.ensureTimePickerConfirmButton(
              instance,
              (value) => this.bookingForm.patchValue({ endTime: value }),
              endPickerState
            );
          },
          onChange: (_selectedDates, timeStr) => {
            endPickerState.pendingValue = this.normalizeTimeForInput(timeStr);
          },
          onValueUpdate: (_selectedDates, timeStr) => {
            endPickerState.pendingValue = this.normalizeTimeForInput(timeStr);
          },
          onClose: (_selectedDates, _timeStr, instance) => {
            if (endPickerState.confirmed) {
              endPickerState.confirmed = false;
              return;
            }

            this.bookingForm.patchValue({ endTime: endPickerState.initialValue });

            if (endPickerState.initialValue) {
              instance.setDate(endPickerState.initialValue, false, 'H:i');
            } else {
              instance.clear(false);
              (instance.input as HTMLInputElement).value = '';
            }
          }
        });
      }
    });
  }

  private ensureTimePickerConfirmButton(
    instance: any,
    onConfirm: (value: string) => void,
    pickerState: { confirmed: boolean; initialValue: string; pendingValue: string }
  ): void {
    const calendar = instance?.calendarContainer as HTMLElement | undefined;
    if (!calendar || calendar.querySelector('.fp-confirm-btn')) {
      return;
    }

    const timeContainer = calendar.querySelector('.flatpickr-time') as HTMLElement | null;
    if (!timeContainer) {
      return;
    }

    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = 'fp-confirm-btn';
    confirmButton.textContent = '✓';
    confirmButton.setAttribute('aria-label', 'Idopont valasztas kesz');
    confirmButton.addEventListener('click', () => {
      const liveValue = this.normalizeTimeForInput((instance?.input as HTMLInputElement | undefined)?.value);
      const committedValue = liveValue || pickerState.pendingValue || pickerState.initialValue || '';
      pickerState.pendingValue = committedValue;
      pickerState.initialValue = committedValue;
      pickerState.confirmed = true;
      onConfirm(committedValue);
      instance.close();
    });

    timeContainer.appendChild(confirmButton);
  }

  private destroyBookingModalPickers(): void {
    this.bookingDatePickerInstance?.destroy();
    this.bookingDatePickerInstance = null;
    this.bookingStartTimePickerInstance?.destroy();
    this.bookingStartTimePickerInstance = null;
    this.bookingEndTimePickerInstance?.destroy();
    this.bookingEndTimePickerInstance = null;
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
    this.http.get(`${this.host}field-booking-windows`).subscribe({
      next: (res: any) => this.fieldBookingWindows = res.data ?? res ?? []
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

      // Update existing user - include roleId
      const userData: any = {
        email: this.userForm.value.email,
        phone,
        fullname: this.userForm.value.fullname,
        roleId: this.userForm.value.roleId,
        verified: this.userForm.value.verified,
        active: this.userForm.value.active
      };

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
      phone: user.phone,
      fullname: user.fullname,
      roleId: user.roleId,
      verified: user.verified,
      active: user.active
    });
    this.showModal = true;
  }

  async startDeleteUser(userId: number) {
    const confirmation = await Swal.fire({
      title: 'Biztosan inaktiválni szeretnéd a profilodat?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Inaktiválás',
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
    if (this.isUserDeleteInProgress) {
      return;
    }

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
        this.isUserDeleteInProgress = true;
        this.showProcessingAlert('Fiók inaktiválása folyamatban...');

        this.api.deleteUser(this.deletingUserId!).subscribe({
          next: async (response: any) => {
            try {
              this.updateProcessingAlert('Inaktiválás sikeres, email küldése...');
              const userDeleteEmailError = await this.sendUserDeletionEmailNotification(
                loginEmail,
                String(this.user?.fullname ?? '').trim() || 'Felhasználó',
                String(this.user?.phone ?? '').trim() || 'N/A'
              );

              this.updateProcessingAlert('Inaktiválás sikeres, kijelentkeztetés...');
              const emailWarning = response?.emailWarning ?? response?.data?.emailWarning ?? null;

              this.startCloseDeleteModal();
              Swal.close();

              if (emailWarning) {
                await Swal.fire({
                  title: 'Sikeres inaktiválás, de email figyelmeztetés',
                  text: String(emailWarning),
                  icon: 'warning'
                });
              } else if (userDeleteEmailError) {
                await Swal.fire({
                  title: 'Sikeres inaktiválás, de a felhasználói email nem ment ki',
                  text: `EmailJS hiba: ${userDeleteEmailError}`,
                  icon: 'warning'
                });
              } else {
                await Swal.fire({
                  title: 'Sikeres inaktiválás! Email elküldve.',
                  icon: 'success',
                  draggable: true
                });
              }

              this.auth.logout();
              window.dispatchEvent(new Event('authStateChanged'));
            } finally {
              this.isUserDeleteInProgress = false;
            }
          },
          error: (err: any) => {
            console.error('Error deactivating user:', err);
            console.error('Status:', err.status);
            console.error('Error message:', err.message);
            this.isUserDeleteInProgress = false;
            Swal.close();
            Swal.fire({
              title: 'Hiba történt az inaktiválás során!',
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

  private normalizeImageUrl(value: unknown): string | null {
    const imageUrl = String(value ?? '').trim();
    return imageUrl ? imageUrl : null;
  }

  getLocationCardImage(locationId: number): string | null {
    if (!this.locations) {
      return null;
    }

    const location = (this.locations as any[]).find((l: any) => l.id === locationId);
    return this.normalizeImageUrl(location?.imageUrl);
  }

  getBookingCardBackgroundImage(booking: any): string {
    const gradient = 'linear-gradient(180deg, rgba(8, 16, 30, 0.18) 15%, rgba(8, 16, 30, 0.82) 100%)';
    const imageUrl = this.getLocationCardImage(Number(booking?.locationId));
    return imageUrl ? `${gradient}, url('${imageUrl}')` : gradient;
  }

  getFieldName(fieldId: number): string {
    if (!this.fields) return 'N/A';
    const field = (this.fields as any[]).find(f => f.id === fieldId);
    return field?.name || 'N/A';
  }

  getBookingTimeInfo(booking: any): string {
    if (!booking) return 'N/A';
    const date = booking?.date || '-';
    const start = this.normalizeTimeForInput(booking?.startTime) || '-';
    const end = this.normalizeTimeForInput(booking?.endTime) || '-';
    return `${date} ${start} - ${end}`;
  }

  getPriceValue(priceId: number): string {
    if (!this.prices) return 'N/A';
    const price = (this.prices as any[]).find(p => p.id === priceId);
    return price?.price ? `${price.price} Ft` : 'N/A';
  }

  private getPriceAmountById(priceId: unknown): number | null {
    const parsedPriceId = Number(priceId);
    if (!Number.isFinite(parsedPriceId) || !this.prices) {
      return null;
    }
    const price = (this.prices as any[]).find((p: any) => Number(p?.id) === parsedPriceId);
    const amount = Number(price?.price ?? NaN);
    return Number.isFinite(amount) ? amount : null;
  }

  private calculateBookingTotalAmount(priceId: unknown, startTime: unknown, endTime: unknown): number | null {
    const pricePerHour = this.getPriceAmountById(priceId);
    const startMinutes = this.parseTimeToMinutes(startTime);
    const endMinutes = this.parseTimeToMinutes(endTime);

    if (pricePerHour === null || startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return null;
    }

    const durationMinutes = endMinutes - startMinutes;
    const total = (pricePerHour * durationMinutes) / 60;
    return Number(total.toFixed(2));
  }

  getTotalPriceValue(booking: any): string {
    const totalFromBooking = Number(booking?.totalPrice ?? NaN);
    if (Number.isFinite(totalFromBooking)) {
      return `${Number(totalFromBooking.toFixed(2))} Ft`;
    }

    const pricePerHour = Number((this.prices as any[] | undefined)?.find((p: any) => p.id === booking?.priceId)?.price ?? NaN);
    if (!Number.isFinite(pricePerHour)) {
      return 'N/A';
    }

    const start = this.parseTimeToMinutes(booking?.startTime);
    const end = this.parseTimeToMinutes(booking?.endTime);
    const durationMinutes = (start !== null && end !== null && end > start) ? (end - start) : 60;

    const amount = (pricePerHour * durationMinutes) / 60;
    return `${Number(amount.toFixed(2))} Ft`;
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.fp-select-shell')) {
      this.openBookingDropdown = null;
    }
  }

  @HostListener('window:resize')
  handleWindowResize(): void {
    this.closeBookingDropdown();
  }

  toggleBookingDropdown(dropdown: 'sport' | 'location' | 'field' | 'price', event: Event): void {
    event.stopPropagation();
    this.openBookingDropdown = this.openBookingDropdown === dropdown ? null : dropdown;
  }

  closeBookingDropdown(): void {
    this.openBookingDropdown = null;
  }

  selectBookingSport(sportId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.bookingForm.patchValue({ sportId: sportId === null ? '' : String(sportId ?? '') });
    this.onBookingSportChange();
    this.closeBookingDropdown();
  }

  selectBookingLocation(locationId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.bookingForm.patchValue({ locationId: locationId === null ? '' : String(locationId ?? '') });
    this.onBookingLocationChange();
    this.closeBookingDropdown();
  }

  selectBookingField(fieldId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.bookingForm.patchValue({ fieldId: fieldId === null ? '' : String(fieldId ?? '') });
    this.onBookingFieldChange();
    this.closeBookingDropdown();
  }

  selectBookingPrice(priceId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.bookingForm.patchValue({ priceId: priceId === null ? '' : String(priceId ?? '') });
    this.closeBookingDropdown();
  }

  getBookingSportLabel(): string {
    const sportId = this.parseId(this.bookingForm.value.sportId);
    if (!sportId || !this.sports) {
      return '-- Válassz sportot --';
    }
    const sport = (this.sports as any[]).find((item: any) => Number(item?.id) === sportId);
    return sport?.name || '-- Válassz sportot --';
  }

  getBookingLocationLabel(): string {
    const locationId = this.parseId(this.bookingForm.value.locationId);
    if (!locationId || !this.locations) {
      return '-- Válassz helyszínt --';
    }
    const location = (this.locations as any[]).find((item: any) => Number(item?.id) === locationId);
    return location?.name || '-- Válassz helyszínt --';
  }

  getBookingFieldLabel(): string {
    const fieldId = this.parseId(this.bookingForm.value.fieldId);
    if (!fieldId) {
      return '-- Válassz pályát --';
    }
    const field = this.getFilteredFields().find((item: any) => Number(item?.id) === fieldId);
    return field?.name || '-- Válassz pályát --';
  }

  getBookingPriceLabel(): string {
    const priceId = this.parseId(this.bookingForm.value.priceId);
    if (!priceId) {
      return '-- Válassz árat --';
    }
    const price = this.getFilteredPrices().find((item: any) => Number(item?.id) === priceId);
    return price ? `${price.price} Ft` : '-- Válassz árat --';
  }

  private parseId(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  protected toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  onBookingSportChange() {
    this.bookingForm.patchValue({
      fieldId: '',
      priceId: '',
      date: '',
      startTime: '',
      endTime: ''
    });
  }

  onBookingLocationChange() {
    this.bookingForm.patchValue({
      fieldId: '',
      priceId: '',
      date: '',
      startTime: '',
      endTime: ''
    });
  }

  onBookingFieldChange() {
    this.bookingForm.patchValue({
      priceId: '',
      date: '',
      startTime: '',
      endTime: ''
    });
  }

  getFilteredFields(): any[] {
    const sportId = this.parseId(this.bookingForm.value.sportId);
    const locationId = this.parseId(this.bookingForm.value.locationId);
    if (!this.fields || !sportId || !locationId) return [];

    return (this.fields as any[]).filter((field: any) => field.sportId === sportId && field.locationId === locationId);
  }

  getFilteredPrices(): any[] {
    const fieldId = this.parseId(this.bookingForm.value.fieldId);
    if (!this.prices || !fieldId) return [];

    return (this.prices as any[]).filter((price: any) => price.fieldId === fieldId);
  }

  private normalizeTimeForInput(value: string | null | undefined): string {
    const text = String(value ?? '').trim();
    if (!text) {
      return '';
    }
    const parts = text.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : text;
  }

  private parseTimeToMinutes(timeValue: unknown): number | null {
    const text = String(timeValue ?? '').trim();
    const parts = text.split(':');
    if (parts.length < 2) {
      return null;
    }

    const hour = Number(parts[0]);
    const minute = Number(parts[1]);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
      return null;
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    return (hour * 60) + minute;
  }

  private getWeekdayFromDate(dateValue: unknown): number | null {
    const value = String(dateValue ?? '').trim();
    if (!value) {
      return null;
    }

    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.getDay();
  }

  private getFieldWindowsForDate(fieldId: number, dateValue: unknown): any[] {
    const weekday = this.getWeekdayFromDate(dateValue);
    if (!this.fieldBookingWindows || weekday === null) {
      return [];
    }

    return (this.fieldBookingWindows as any[]).filter((windowData: any) => {
      return Number(windowData.fieldId) === fieldId
        && Number(windowData.weekday) === weekday
        && Number(windowData.isActive) === 1;
    });
  }

  isBookingInsideWindow(): boolean {
    const fieldId = this.parseId(this.bookingForm.value.fieldId);
    const date = this.bookingForm.value.date;
    const startMinutes = this.parseTimeToMinutes(this.bookingForm.value.startTime);
    const endMinutes = this.parseTimeToMinutes(this.bookingForm.value.endTime);

    if (!fieldId || !date || startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return false;
    }

    const windows = this.getFieldWindowsForDate(fieldId, date);
    return windows.some((windowData: any) => {
      const openMinutes = this.parseTimeToMinutes(windowData.openTime);
      const closeMinutes = this.parseTimeToMinutes(windowData.closeTime);
      return openMinutes !== null && closeMinutes !== null && startMinutes >= openMinutes && endMinutes <= closeMinutes;
    });
  }

  getBookingWindowHint(): string {
    const fieldId = this.parseId(this.bookingForm.value.fieldId);
    const date = this.bookingForm.value.date;

    if (!fieldId || !date) {
      return 'Válassz pályát és dátumot a nyitvatartás megjelenítéséhez.';
    }

    const windows = this.getFieldWindowsForDate(fieldId, date);
    if (windows.length === 0) {
      return 'Ehhez a pályához ezen a napon nincs aktív nyitvatartás.';
    }

    const ranges = windows
      .map((w: any) => `${this.normalizeTimeForInput(w.openTime)} - ${this.normalizeTimeForInput(w.closeTime)}`)
      .join(', ');
    return `Elérhető nyitvatartás: ${ranges}`;
  }

  startUpdateBooking(booking: any) {
    this.closeBookingDropdown();
    this.editingBookingId = booking.id;
    this.bookingForm.patchValue({
      sportId: booking.sportId,
      locationId: booking.locationId,
      fieldId: booking.fieldId,
      userId: booking.userId,
      priceId: booking.priceId,
      date: booking.date,
      startTime: this.normalizeTimeForInput(booking.startTime),
      endTime: this.normalizeTimeForInput(booking.endTime)
    });
    this.showBookingModal = true;
    this.initializeBookingModalPickersWhenReady();
  }

  private buildBookingNotificationData(booking: any) {
    return {
      sportName: this.getSportName(Number(booking?.sportId)),
      locationName: this.getLocationName(Number(booking?.locationId)),
      fieldName: this.getFieldName(Number(booking?.fieldId)),
      bookingDate: booking?.date || 'N/A',
      bookingStartTime: booking?.startTime || 'N/A',
      bookingPrice: this.getTotalPriceValue(booking),
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
      `Művelet: Foglalás ${actionLabel}`,
      `Foglaló email: ${data.userEmail}`,
      `Sport: ${data.sportName}`,
      `Helyszín: ${data.locationName}`,
      `Pálya: ${data.fieldName}`,
      `Dátum: ${data.bookingDate}`,
      `Kezdés: ${data.bookingStartTime}`,
      `Befejezés: ${this.normalizeTimeForInput(booking?.endTime) || 'N/A'}`,
      `Ár: ${data.bookingPrice}`
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
      booking_end_time: this.normalizeTimeForInput(booking?.endTime) || 'N/A',
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

  private async sendUserDeletionEmailNotification(userEmail: string, fullName: string, phone: string): Promise<string | null> {
    const deletedAt = new Date().toLocaleString('hu-HU');
    const message = [
      `Kedves ${fullName}!`,
      'A fiókod inaktiválása sikeresen megtörtént.',
      `Inaktiválás ideje: ${deletedAt}`
    ].join('\n');

    const templateParams = {
      to_email: userEmail,
      email: userEmail,
      user_email: userEmail,
      user_name: fullName,
      user_fullname: fullName,
      user_phone: phone,
      deleted_at: deletedAt,
      message
    };

    try {
      await emailjs.send(
        this.emailJsServiceId,
        this.emailJsUserDeleteTemplateId,
        templateParams,
        { publicKey: this.emailJsPublicKey }
      );
      return null;
    } catch (error: any) {
      console.error('EmailJS user deletion notification error:', error);
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

    if (!this.isBookingInsideWindow()) {
      await Swal.fire({
        title: 'Időpont nyitvatartáson kívül',
        text: 'A kiválasztott időpont nincs benne a pálya nyitvatartásában.',
        icon: 'warning'
      });
      return;
    }

    const bookingData = {
      sportId: this.bookingForm.value.sportId,
      locationId: this.bookingForm.value.locationId,
      fieldId: this.bookingForm.value.fieldId,
      userId: this.user.id,
      priceId: this.bookingForm.value.priceId,
      date: this.bookingForm.value.date,
      startTime: this.bookingForm.value.startTime,
      endTime: this.bookingForm.value.endTime,
      email: this.user?.email || null
    };

    const originalBooking = (this.bookings as any[]).find((booking: any) => Number(booking?.id) === Number(this.editingBookingId));
    const originalTotalAmount = this.calculateBookingTotalAmount(
      originalBooking?.priceId,
      this.normalizeTimeForInput(originalBooking?.startTime),
      this.normalizeTimeForInput(originalBooking?.endTime)
    );
    const newTotalAmount = this.calculateBookingTotalAmount(
      this.bookingForm.value.priceId,
      this.bookingForm.value.startTime,
      this.bookingForm.value.endTime
    );
    const hasComparablePrices = originalTotalAmount !== null && newTotalAmount !== null;

    if (hasComparablePrices && newTotalAmount! > originalTotalAmount!) {
      const difference = Number((newTotalAmount! - originalTotalAmount!).toFixed(2));
      const proceedToPayment = await Swal.fire({
        title: 'Árkülönbözet fizetése szükséges',
        text: `A módosított foglalás drágább lett. Fizetendő különbözet: ${difference} Ft. A folytatáshoz fizetned kell.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Tovább a fizetéshez',
        cancelButtonText: 'Mégsem'
      });

      if (!proceedToPayment.isConfirmed) {
        return;
      }

      this.bookingService.setBookingData({
        ...bookingData,
        mode: 'update-difference',
        updateBookingId: this.editingBookingId,
        paymentAmount: difference,
        oldPriceAmount: originalTotalAmount,
        newPriceAmount: newTotalAmount
      });

      this.startCloseBookingModal();
      this.router.navigate(['/payment']);
      return;
    }

    if (hasComparablePrices && newTotalAmount! < originalTotalAmount!) {
      const refundDifference = Number((originalTotalAmount! - newTotalAmount!).toFixed(2));
      await Swal.fire({
        title: 'Árkülönbözet visszatérítés',
        text: `A módosított foglalás olcsóbb lett (${refundDifference} Ft különbözet). A tulajdonosok felveszik veled a kapcsolatot, és 8-10 munkanapon belül visszautalják a különbözetet.`,
        icon: 'info',
        confirmButtonText: 'Rendben'
      });
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

    this.isBookingActionInProgress = true;
    this.showProcessingAlert('Foglalás módosítása folyamatban...');

    this.bookingService.updateBooking(this.editingBookingId, bookingData).subscribe({
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

    this.bookingService.deleteBooking(this.deletingBookingId).subscribe({
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

