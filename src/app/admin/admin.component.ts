import { Component, inject } from '@angular/core';
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

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  protected readonly api = inject(AdminService);
  protected readonly builder = inject(FormBuilder)
  protected readonly auth: AuthService = inject(AuthService)
  protected readonly http = inject(HttpClient);
  protected readonly router = inject(Router);
  protected readonly sportService = inject(SportService);
  protected readonly locService = inject(LocService);
  protected readonly fieldService = inject(FieldService);
  protected readonly availableDateService = inject(AvailabledateService);

  host = 'http://localhost:8000/api/'

  protected users: any
  protected sports: any
  protected locations: any
  protected fields: any
  protected availableDates: any
  protected showModal = false;
  protected activeView: 'users' | 'sports' | 'locations' | 'fields' | 'availableDates'  = 'users';

  protected userForm = this.builder.group({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    fullname: ''
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
    fieldsId: '',
  })


  ngOnInit() {
    this.getUsers();
    this.getSports();
    this.getLocations();
    this.getFields();
    this.getAvailableDates();
  }

  getUsers() {
    // console.log("lekérés...")
    const token = localStorage.getItem('token');
    // console.log("Token:", token);
    if (token) {
      try {

        this.api.getUsers().subscribe({
          next: (result: any) => {
            // console.log(result);
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
        // console.log('Sports:', result);
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
        // console.log('Locations:', result);
        this.locations = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching locations:', err);
      }
    })
  }

  getFields() {
    this.fieldService.getFields().subscribe({
      next: (result: any) => {
        // console.log('Fields:', result);
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
        // console.log('Available Dates:', result);
        this.availableDates = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching available dates:', err);
      }
    })
  }

  startShowModal() {
    this.showModal = true
  }
  startCloseModal() {
    this.showModal = false
  }

  setActiveView(view: 'users' | 'sports' | 'locations' | 'fields' | 'availableDates') {
    this.activeView = view;
  }

  //Új felhasználó létrehozása

  startSave() {
    // console.log("Mentés....")
    // console.log(this.userForm.value)
    
    const userData = {
      name: this.userForm.value.name,
      email: this.userForm.value.email,
      password: this.userForm.value.password,
      password_confirmation: this.userForm.value.password_confirmation,
      phone: this.userForm.value.phone,
      fullname: this.userForm.value.fullname
    };
    
    this.api.addUser(userData).subscribe({
      next: (result: any) => {
        // console.log(result)
        this.showModal = false
        this.userForm.reset();
        this.getUsers()
      },
      error: (err: any) => {
        console.error('Error saving user:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    })
  }


  //Új sport létrehozása

  startSaveSport() {
    // console.log("Mentés....")
    // console.log(this.sportForm.value)
    
    const sportData = {
      name: this.sportForm.value.name,
      duration: this.sportForm.value.duration,
    };
    
    this.sportService.addSport(sportData).subscribe({
      next: (result: any) => {
        // console.log(result)
        this.showModal = false
        this.sportForm.reset();
        this.getSports()
      },
      error: (err: any) => {
        console.error('Error saving sport:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    })
  }

  // Új helyszín létrehozása

  startSaveLocation() {
    // console.log("Mentés....")
    // console.log(this.locationForm.value)
    
    const locationData = {
      name: this.locationForm.value.name,
      address: this.locationForm.value.address,
      email: this.locationForm.value.email
    };
    
    this.locService.addLocation(locationData).subscribe({
      next: (result: any) => {
        // console.log(result)
        this.showModal = false
        this.locationForm.reset();
        this.getLocations()
      },
      error: (err: any) => {
        console.error('Error saving location:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    })
  }

  //Új pályák létrehozása

   startSaveField() {
    // console.log("Mentés....")
    // console.log(this.fieldForm.value)
    
    const fieldData = {
      name: this.fieldForm.value.name,
      locationId: this.fieldForm.value.locationId,
      sportId: this.fieldForm.value.sportId
    };
    
    this.fieldService.addField(fieldData).subscribe({
      next: (result: any) => {
        // console.log(result)
        this.showModal = false
        this.fieldForm.reset();
        this.getFields()
      },
      error: (err: any) => {
        console.error('Error saving field:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    })
  }

  //Új szabad időpont létrehozása
  startSaveAvailableDate() {
    // console.log("Mentés....")
    // console.log(this.availableDateForm.value)
    
    const availableDateData = {
      date: this.availableDateForm.value.date,
      startTime: this.availableDateForm.value.startTime,
      fieldsId: this.availableDateForm.value.fieldsId
    };
    
    this.availableDateService.addAvailableDate(availableDateData).subscribe({
      next: (result: any) => {
        // console.log(result)
        this.showModal = false
        this.availableDateForm.reset();
        this.getAvailableDates()
      },
      error: (err: any) => {
        console.error('Error saving available date:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    })
  }

  //Kijelentkezés
  onSubmit(): void {
    this.auth.logout();
    window.dispatchEvent(new Event('authStateChanged'));
    this.router.navigate(['/login']);
    console.log('Logout successful!');
  }
}
