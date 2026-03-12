import { AfterViewInit, Component, ElementRef, inject, OnDestroy, ViewChild } from '@angular/core';
import { AdminService } from '../shared/admin.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../shared/auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SportService } from '../shared/sport.service';
import { LocService } from '../shared/loc.service';
import { FieldService } from '../shared/field.service';
import { CommonModule } from '@angular/common';
import { AvailabledateService } from '../shared/availabledate.service';
import { PriceService } from '../shared/price.service';
import { BookingService } from '../shared/booking.service';
import Swal from 'sweetalert2';
import flatpickr from 'flatpickr';
import { Hungarian } from 'flatpickr/dist/l10n/hu.js';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements AfterViewInit, OnDestroy {
  protected readonly api = inject(AdminService);
  protected readonly builder = inject(FormBuilder)
  protected readonly auth: AuthService = inject(AuthService)
  protected readonly http = inject(HttpClient);
  protected readonly router = inject(Router);
  protected readonly sportService = inject(SportService);
  protected readonly locService = inject(LocService);
  protected readonly fieldService = inject(FieldService);
  protected readonly availableDateService = inject(AvailabledateService);
  protected readonly priceService = inject(PriceService);
  protected readonly bookingService = inject(BookingService);

  private datePickerInstance: any = null;
  private timePickerInstance: any = null;

  @ViewChild('availableDatePicker')
  availableDatePicker?: ElementRef<HTMLInputElement>;

  @ViewChild('availableTimePicker')
  availableTimePicker?: ElementRef<HTMLInputElement>;

  ngAfterViewInit(): void {
    this.initializeAvailableDatePicker();
    this.initializeAvailableTimePicker();
  }

  ngOnDestroy(): void {
    this.datePickerInstance?.destroy();
    this.timePickerInstance?.destroy();
  }

  private initializeAvailableDatePicker(): void {
    const input = this.availableDatePicker?.nativeElement;
    if (!input) {
      return;
    }

    this.datePickerInstance?.destroy();

    this.datePickerInstance = flatpickr(input, {
      locale: Hungarian,
      dateFormat: 'Y-m-d',
      disableMobile: true,
      static: true,
      defaultDate: this.availableDateForm.value.date || undefined,
      onChange: (_selectedDates, dateStr) => {
        this.availableDateForm.patchValue({ date: dateStr });
      }

    });
  }

  private initializeAvailableTimePicker(): void {
    const input = this.availableTimePicker?.nativeElement;
    if (!input) {
      return;
    }

    this.timePickerInstance?.destroy();

    this.timePickerInstance = flatpickr(input, {
      locale: Hungarian,
      enableTime: true,
      noCalendar: true,
      time_24hr: true,
      dateFormat: 'H:i',
      disableMobile: true,
      static: true,
      defaultDate: this.normalizeTimeForPicker(this.availableDateForm.value.startTime),
      onChange: (_selectedDates, timeStr) => {
        this.availableDateForm.patchValue({ startTime: timeStr });
      }
    });
  }

  private normalizeTimeForPicker(value: string | null | undefined): string {
    const v = String(value ?? '').trim();
    if (!v) {
      return '';
    }

    const parts = v.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }

    return v;
  }

  private openAvailableDatePickerWhenReady(): void {
    setTimeout(() => {
      this.initializeAvailableDatePicker();
      this.initializeAvailableTimePicker();
    });
  }

  host = 'http://localhost:8000/api/'

  protected users: any
  protected sports: any
  protected locations: any
  protected fields: any
  protected availableDates: any
  protected prices: any
  protected bookings: any
  protected showModal = false;
  protected showDeleteModal = false;
  protected editingUserPassword: string | null = null;
  protected editingUserVerified: boolean = false;
  protected deletingUserId: number | null = null;
  protected editingUserId: number | null = null;
  protected editingSportId: number | null = null;
  protected editingLocationId: number | null = null;
  protected editingFieldId: number | null = null;
  protected editingAvailableDateId: number | null = null;
  protected editingPriceId: number | null = null;
  protected editingBookingId: number | null = null;
  protected activeView: 'users' | 'sports' | 'locations' | 'fields' | 'availableDates' | 'prices' | 'bookings' = 'users';

  protected userForm = this.builder.group({
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    fullname: '',
    roleId: ''
  })

  protected sportForm = this.builder.group({
    name: '',
    duration: '',
  })

  protected locationForm = this.builder.group({
    name: '',
    address: '',
    email: ''
  })

  protected fieldForm = this.builder.group({
    name: '',
    locationId: '',
    sportId: '',
  })

  protected availableDateForm = this.builder.group({
    date: '',
    startTime: '',
    fieldId: '',
  })

  protected priceForm = this.builder.group({
    price: '',
    fieldId: '',
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

  protected deleteForm = this.builder.group({
    password: '',
    password_confirmation: ''
  })


  ngOnInit() {
    this.getUsers();
    this.getSports();
    this.getLocations();
    this.getFields();
    this.getAvailableDates();
    this.getPrices();
    this.getBookings();
  }

  getUsers() {
    const token = localStorage.getItem('token');
    if (token) {
      try {

        this.api.getUsers().subscribe({
          next: (result: any) => {
            this.users = result.data || result
          },
          error: (err: any) => {
            console.error('Error fetching users:', err);
          }
        })
      } catch (error) {
        console.error('Error decoding token:', error);
        this.users = [];
      }
    } else {
      console.warn('No token found');
      this.users = [];
    }
  }

  getSports() {
    this.sportService.getSport().subscribe({
      next: (result: any) => {
        this.sports = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching sports:', err);
      }
    })
  }

  getLocations() {
    this.locService.getLocation().subscribe({
      next: (result: any) => {
        this.locations = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching locations:', err);
      }
    })
  }

  getFields() {
    this.fieldService.getField().subscribe({
      next: (result: any) => {
        this.fields = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching fields:', err);
      }
    })
  }

  getAvailableDates() {
    this.availableDateService.getAvailableDates().subscribe({
      next: (result: any) => {
        this.availableDates = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching available dates:', err);
      }
    })
  }

  getPrices() {
    this.priceService.getPrices().subscribe({
      next: (result: any) => {
        this.prices = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching prices:', err);
      }
    })
  }

  getBookings() {
    this.bookingService.getBookings().subscribe({
      next: (result: any) => {
        this.bookings = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching bookings:', err);
      }
    })
  }

  startShowModal() {
    if (this.activeView === 'users') {
      this.editingUserId = null;
      this.editingUserPassword = null;
      this.editingUserVerified = false;
      this.userForm.reset();
    }
    if (this.activeView === 'sports') {
      this.editingSportId = null;
      this.sportForm.reset();
    }
    if (this.activeView === 'locations') {
      this.editingLocationId = null;
      this.locationForm.reset();
    }
    if (this.activeView === 'fields') {
      this.editingFieldId = null;
      this.fieldForm.reset();
    }
    if (this.activeView === 'availableDates') {
      this.editingAvailableDateId = null;
      this.availableDateForm.reset();
    }
    if (this.activeView === 'prices') {
      this.editingPriceId = null;
      this.priceForm.reset();
    }
    if (this.activeView === 'bookings') {
      this.editingBookingId = null;
      this.bookingForm.reset();
    }
    this.showModal = true

    if (this.activeView === 'availableDates') {
      this.openAvailableDatePickerWhenReady();
    }
  }
  startCloseModal() {
    if (this.activeView === 'availableDates') {
      this.datePickerInstance?.destroy();
      this.datePickerInstance = null;
      this.timePickerInstance?.destroy();
      this.timePickerInstance = null;
    }

    this.showModal = false;
    if (this.activeView === 'users') {
      this.editingUserId = null;
      this.editingUserPassword = null;
      this.editingUserVerified = false;
      this.userForm.reset();
    }
    if (this.activeView === 'sports') {
      this.editingSportId = null;
      this.sportForm.reset();
    }
    if (this.activeView === 'locations') {
      this.editingLocationId = null;
      this.locationForm.reset();
    }
    if (this.activeView === 'fields') {
      this.editingFieldId = null;
      this.fieldForm.reset();
    }
    if (this.activeView === 'availableDates') {
      this.editingAvailableDateId = null;
      this.availableDateForm.reset();
    }
    if (this.activeView === 'prices') {
      this.editingPriceId = null;
      this.priceForm.reset();
    }
    if (this.activeView === 'bookings') {
      this.editingBookingId = null;
      this.bookingForm.reset();
    }
  }

  startCloseDeleteModal() {
    this.showDeleteModal = false;
    this.deletingUserId = null;
    this.deleteForm.reset();
  }

  setActiveView(view: 'users' | 'sports' | 'locations' | 'fields' | 'availableDates' | 'prices' | 'bookings') {
    this.activeView = view;
  }

  private async confirmAction(
    title: string,
    icon: 'question' | 'warning' = 'question',
    confirmButtonText: string = 'Mentés'
  ): Promise<boolean> {
    const confirmation = await Swal.fire({
      title,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Mégsem'
    });

    return confirmation.isConfirmed;
  }

  //Új felhasználó létrehozása vagy módosítása

  private isPhoneValid(phone: string): boolean {
    return /^\+[0-9]{8,15}$/.test(String(phone ?? '').trim());
  }

  private showPhoneValidationError(): void {
    Swal.fire({
      title: 'Érvénytelen telefonszám',
      text: 'A telefonszámnak + jellel kell kezdődnie (pl. +36301234567).',
      icon: 'warning'
    });
  }

  async startSave() {
    // const confirmation = await Swal.fire({
    //   title: 'Biztosan mented a változtatásokat?',
    //   icon: 'question',
    //   showCancelButton: true,
    //   confirmButtonText: 'Mentés',
    //   cancelButtonText: 'Mégsem'
    // });

    // if (!confirmation.isConfirmed) {
    //   return;
    // }

    if (this.editingUserId) {
      const phone = String(this.userForm.value.phone ?? '').trim();
      if (!this.isPhoneValid(phone)) {
        this.showPhoneValidationError();
        return;
      }

      if (!this.editingUserPassword) {
        Swal.fire({
          title: 'Nem található a felhasználó aktuális jelszava a mentéshez!',
          icon: 'error'
        });
        return;
      }

      // Admin oldalon nem változtatunk más felhasználó jelszaván.
      // A backend által elvárt payloadhoz a meglévő user jelszót küldjük tovább.
      const userData: any = {
        email: this.userForm.value.email,
        password: this.editingUserPassword,
        phone,
        fullname: this.userForm.value.fullname,
        roleId: Number(this.userForm.value.roleId),
        verified: this.editingUserVerified
      };

      this.api.updateUser(this.editingUserId, userData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingUserId = null;
          this.editingUserPassword = null;
          this.editingUserVerified = false;
          this.userForm.reset();
          this.getUsers();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating user:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      const phone = String(this.userForm.value.phone ?? '').trim();
      if (!this.isPhoneValid(phone)) {
        this.showPhoneValidationError();
        return;
      }

      // Create new user - don't include roleId
      const userData: any = {
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        password_confirmation: this.userForm.value.password_confirmation,
        phone,
        fullname: this.userForm.value.fullname
      };

      this.api.addUser(userData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.userForm.reset();
          this.getUsers();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
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
    this.editingUserPassword = user.password ?? null;
    this.editingUserVerified = Boolean(user.verified);
    this.userForm.patchValue({
      email: user.email,
      password: '',
      password_confirmation: '',
      phone: user.phone,
      fullname: user.fullname,
      roleId: user.roleId
    });
    this.showModal = true;
  }

  async startDeleteUser(userId: number) {
    // const confirmation = await Swal.fire({
    //   title: 'Biztosan törölni szeretnéd ezt a felhasználót?',
    //   icon: 'warning',
    //   showCancelButton: true,
    //   confirmButtonText: 'Törlés',
    //   cancelButtonText: 'Mégsem'
    // });

    // if (!confirmation.isConfirmed) {
    //   return;
    // }

    this.deletingUserId = userId;
    this.deleteForm.reset();
    this.showDeleteModal = true;
  }

  confirmDeleteUser() {
    const password = this.deleteForm.value.password?.trim();
    const passwordConfirmation = this.deleteForm.value.password_confirmation?.trim();
    const adminEmail = this.getLoggedInUserEmail();

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

    if (!adminEmail || !this.deletingUserId) {
      Swal.fire({
        title: 'Hiányzik hitelesítési adat a törléshez!',
        icon: 'error'
      });
      return;
    }

    this.auth.login({ email: adminEmail, password }).subscribe({
      next: () => {
        this.api.deleteUser(this.deletingUserId!).subscribe({
          next: () => {
            this.startCloseDeleteModal();
            this.getUsers();
            Swal.fire({
              title: 'Sikeres törlés!',
              icon: 'success',
              draggable: true
            });
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


  //Új sport létrehozása vagy módosítása vagy törlése

  async startSaveSport() {
    // const confirmed = await this.confirmAction('Biztosan mented a változtatásokat?', 'question', 'Mentés');
    // if (!confirmed) {
    //   return;
    // }

    const sportData = {
      name: this.sportForm.value.name,
      duration: this.sportForm.value.duration,
    };

    if (this.editingSportId) {
      // Update existing sport
      this.sportService.updateSport(this.editingSportId, sportData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingSportId = null;
          this.sportForm.reset();
          this.getSports();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating sport:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      // Create new sport
      this.sportService.addSport(sportData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.sportForm.reset();
          this.getSports();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving sport:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdateSport(sport: any) {
    this.editingSportId = sport.id;
    this.sportForm.patchValue({
      name: sport.name,
      duration: sport.duration
    });
    this.showModal = true;
  }

  async startDeleteSport(sportId: number) {
    const confirmed = await this.confirmAction('Biztosan törölni szeretnéd ezt a sportágat?', 'warning', 'Törlés');
    if (!confirmed) {
      return;
    }

    this.sportService.deleteSport(sportId).subscribe({
      next: (result: any) => {
        this.getSports();
        Swal.fire({
          title: 'Sikeres törlés!',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error',
          draggable: true
        });
        console.error('Error deleting sport:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    });
  }

  // Új helyszín létrehozása vagy módosítása vagy törlése

  async startSaveLocation() {
    // const confirmed = await this.confirmAction('Biztosan mented a változtatásokat?', 'question', 'Mentés');
    // if (!confirmed) {
    //   return;
    // }

    const locationData = {
      name: this.locationForm.value.name,
      address: this.locationForm.value.address,
      email: this.locationForm.value.email
    };

    if (this.editingLocationId) {
      // Update existing location
      this.locService.updateLocation(this.editingLocationId, locationData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingLocationId = null;
          this.locationForm.reset();
          this.getLocations();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating location:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      // Create new location
      this.locService.addLocation(locationData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.locationForm.reset();
          this.getLocations();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving location:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdateLocation(location: any) {
    this.editingLocationId = location.id;
    this.locationForm.patchValue({
      name: location.name,
      address: location.address,
      email: location.email
    });
    this.showModal = true;
  }

  async startDeleteLocation(locationId: number) {
    const confirmed = await this.confirmAction('Biztosan törölni szeretnéd ezt a helyszínt?', 'warning', 'Törlés');
    if (!confirmed) {
      return;
    }

    this.locService.deleteLocation(locationId).subscribe({
      next: (result: any) => {
        this.getLocations();
        Swal.fire({
          title: 'Sikeres törlés!',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error',
          draggable: true
        });
        console.error('Error deleting location:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    });
  }



  //Új pályák létrehozása vagy módosítása vagy törlése

  async startSaveField() {
    // const confirmed = await this.confirmAction('Biztosan mented a változtatásokat?', 'question', 'Mentés');
    // if (!confirmed) {
    //   return;
    // }

    const fieldData = {
      name: this.fieldForm.value.name,
      locationId: this.fieldForm.value.locationId,
      sportId: this.fieldForm.value.sportId
    };

    if (this.editingFieldId) {
      // Update existing field
      this.fieldService.updateField(this.editingFieldId, fieldData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingFieldId = null;
          this.fieldForm.reset();
          this.getFields();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating field:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      // Create new field
      this.fieldService.addField(fieldData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.fieldForm.reset();
          this.getFields();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving field:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdateField(field: any) {
    // Set the editing state
    this.editingFieldId = field.id;
    // Populate the form with the selected field's data
    this.fieldForm.patchValue({
      name: field.name,
      locationId: field.locationId,
      sportId: field.sportId
    });
    // Open the modal
    this.showModal = true;
  }

  async startDeleteField(fieldId: number) {
    const confirmed = await this.confirmAction('Biztosan törölni szeretnéd ezt a pályát?', 'warning', 'Törlés');
    if (!confirmed) {
      return;
    }

    this.fieldService.deleteField(fieldId).subscribe({
      next: (result: any) => {
        this.getFields();
        Swal.fire({
          title: 'Sikeres törlés!',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error',
          draggable: true
        });
        console.error('Error deleting field:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    });
  }



  //Új szabad időpont létrehozása vagy módosítása vagy törlése
  async startSaveAvailableDate() {
    // const confirmed = await this.confirmAction('Biztosan mented a változtatásokat?', 'question', 'Mentés');
    // if (!confirmed) {
    //   return;
    // }

    const availableDateData = {
      date: this.availableDateForm.value.date,
      startTime: this.availableDateForm.value.startTime,
      fieldId: this.availableDateForm.value.fieldId
    };

    if (this.editingAvailableDateId) {
      // Update existing date
      this.availableDateService.updateAvailableDate(this.editingAvailableDateId, availableDateData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingAvailableDateId = null;
          this.availableDateForm.reset();
          this.getAvailableDates();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating available date:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      // Create new date
      this.availableDateService.addAvailableDate(availableDateData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.availableDateForm.reset();
          this.getAvailableDates();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving available date:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdateAvailableDate(availableDate: any) {
    // Set the editing state
    this.editingAvailableDateId = availableDate.id;
    // Populate the form with the selected date's data
    this.availableDateForm.patchValue({
      date: availableDate.date,
      startTime: availableDate.startTime,
      fieldId: availableDate.fieldId
    });
    // Open the modal
    this.showModal = true;
    this.openAvailableDatePickerWhenReady();
  }

  async startDeleteAvailableDate(availableDateId: number) {
    const confirmed = await this.confirmAction('Biztosan törölni szeretnéd ezt az időpontot?', 'warning', 'Törlés');
    if (!confirmed) {
      return;
    }

    this.availableDateService.deleteAvailableDate(availableDateId).subscribe({
      next: (result: any) => {
        this.getAvailableDates();
        Swal.fire({
          title: 'Sikeres törlés!',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error',
          draggable: true
        });
        console.error('Error deleting available date:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    });
  }

  //Új ár létrehozása vagy módosítása vagy törlése

  async startSavePrice() {
    // const confirmed = await this.confirmAction('Biztosan mented a változtatásokat?', 'question', 'Mentés');
    // if (!confirmed) {
    //   return;
    // }

    const priceData = {
      price: this.priceForm.value.price,
      fieldId: this.priceForm.value.fieldId
    };

    if (this.editingPriceId) {
      // Update existing price
      this.priceService.updatePrice(this.editingPriceId, priceData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingPriceId = null;
          this.priceForm.reset();
          this.getPrices();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating price:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      // Create new price
      this.priceService.addPrice(priceData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.priceForm.reset();
          this.getPrices();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving price:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdatePrice(price: any) {
    this.editingPriceId = price.id;
    this.priceForm.patchValue({
      price: price.price,
      fieldId: price.fieldId
    });
    this.showModal = true;
  }

  async startDeletePrice(priceId: number) {
    const confirmed = await this.confirmAction('Biztosan törölni szeretnéd ezt az árat?', 'warning', 'Törlés');
    if (!confirmed) {
      return;
    }

    this.priceService.deletePrice(priceId).subscribe({
      next: (result: any) => {
        this.getPrices();
        Swal.fire({
          title: 'Sikeres törlés!',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error',
          draggable: true
        });
        console.error('Error deleting price:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    });
  }

  //Új foglalás létrehozása vagy módosítása vagy törlése
  async startSaveBooking() {
    // const confirmed = await this.confirmAction('Biztosan mented a változtatásokat?', 'question', 'Mentés');
    // if (!confirmed) {
    //   return;
    // }

    const bookingData = {
      sportId: this.bookingForm.value.sportId,
      locationId: this.bookingForm.value.locationId,
      fieldId: this.bookingForm.value.fieldId,
      userId: this.bookingForm.value.userId,
      availableDateId: this.bookingForm.value.availableDateId,
      priceId: this.bookingForm.value.priceId,
      date: this.bookingForm.value.date,
      startTime: this.bookingForm.value.startTime
    };

    if (this.editingBookingId) {
      // Update existing booking
      this.bookingService.updateBooking(this.editingBookingId, bookingData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingBookingId = null;
          this.bookingForm.reset();
          this.getBookings();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating booking:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      // Create new booking
      this.bookingService.addBooking(bookingData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.bookingForm.reset();
          this.getBookings();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving booking:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
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
    this.showModal = true;
  }

  async startDeleteBooking(bookingId: number) {
    const confirmed = await this.confirmAction('Biztosan törölni szeretnéd ezt a foglalást?', 'warning', 'Törlés');
    if (!confirmed) {
      return;
    }

    this.bookingService.deleteBooking(bookingId).subscribe({
      next: (result: any) => {
        this.getBookings();
        Swal.fire({
          title: 'Sikeres törlés!',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error',
          draggable: true
        });
        console.error('Error deleting booking:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    });
  }


  //Kijelentkezés
  onSubmit(): void {
    this.auth.logout();
    window.dispatchEvent(new Event('authStateChanged'));
    this.router.navigate(['/login']);
  }

  private getLoggedInUserEmail(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));

      if (decodedToken?.email) {
        return decodedToken.email;
      }

      const userId = decodedToken?.id;
      if (!userId || !this.users) {
        return null;
      }

      const currentUser = (this.users as any[]).find((u: any) => u.id === userId);
      return currentUser?.email || null;
    } catch (error) {
      return null;
    }
  }

  private parseId(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  onBookingSportChange() {
    this.bookingForm.patchValue({
      fieldId: '',
      availableDateId: '',
      priceId: ''
    });
  }

  onBookingLocationChange() {
    this.bookingForm.patchValue({
      fieldId: '',
      availableDateId: '',
      priceId: ''
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
    const availableDate = (this.availableDates as any[]).find(d => d.id === availableDateId);
    this.bookingForm.patchValue({
      date: availableDate?.date || '',
      startTime: availableDate?.startTime || ''
    });
  }

  getFilteredFields(): any[] {
    const sportId = this.parseId(this.bookingForm.value.sportId);
    const locationId = this.parseId(this.bookingForm.value.locationId);
    if (!this.fields || !sportId || !locationId) return [];
    return (this.fields as any[]).filter(
      field => field.sportId === sportId && field.locationId === locationId
    );
  }

  getFilteredAvailableDates(): any[] {
    const fieldId = this.parseId(this.bookingForm.value.fieldId);
    if (!this.availableDates || !fieldId) return [];
    return (this.availableDates as any[]).filter(date => {
      if (date.fieldId !== fieldId) return false;
      return !this.isAvailableDateBooked(date.id) || this.isEditingThisAvailableDate(date.id);
    });
  }

  getFilteredPrices(): any[] {
    const fieldId = this.parseId(this.bookingForm.value.fieldId);
    if (!this.prices || !fieldId) return [];
    return (this.prices as any[]).filter(price => price.fieldId === fieldId);
  }

  private isAvailableDateBooked(availableDateId: number): boolean {
    if (!this.bookings) return false;
    return (this.bookings as any[]).some(booking => booking.availableDateId === availableDateId);
  }

  private isEditingThisAvailableDate(availableDateId: number): boolean {
    if (!this.editingBookingId || !this.bookings) return false;
    const currentBooking = (this.bookings as any[]).find(b => b.id === this.editingBookingId);
    return currentBooking?.availableDateId === availableDateId;
  }

  // Helper methods for booking display
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

  getFieldName(fieldId: number): string {
    if (!this.fields) return 'N/A';
    const field = (this.fields as any[]).find(f => f.id === fieldId);
    return field?.name || 'N/A';
  }

  getUserName(userId: number): string {
    if (!this.users) return 'N/A';
    const user = (this.users as any[]).find(u => u.id === userId);
    return user?.email || 'N/A';
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
}
