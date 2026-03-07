import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../shared/admin.service';
import { AuthService } from '../shared/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {

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
  protected deletingUserId: number | null = null;

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
        phone: this.userForm.value.phone,
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
        phone: this.userForm.value.phone,
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
    return this.bookings.filter((b: any) => b.userId === this.user.id);
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
}
