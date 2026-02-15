import { Component, inject } from '@angular/core';
import { AdminService } from '../shared/admin.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../shared/auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  protected readonly api = inject(AdminService);
  protected readonly builder = inject(FormBuilder)
  protected readonly auth: AuthService = inject(AuthService)
  protected readonly http = inject(HttpClient);
  protected readonly router = inject(Router);

  host = 'http://localhost:8000/api/'

  protected user: any
  protected showModal = false;

  protected userForm = this.builder.group({
    name: '',
    email: '',
    password: '',
    phone: '',
    fullname: '',
    roleId: ''
  })

  ngOnInit() {
    this.getUsers();
  }

  getUsers() {
    console.log("lekérés...")
    const token = localStorage.getItem('token');
    // console.log("Token:", token);
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const userId = decodedToken.id;
        this.api.getUsers().subscribe({
          next: (result: any) => {
            console.log(result);
            this.user = result.data
          },
          error: (err: any) => { }
        })
      } catch (error) {
        console.error('Error decoding token:', error);
        this.user = null;
      }
    }
  }

  startShowModal() {
    this.showModal = true
  }
  startCloseModal() {
    this.showModal = false
  }

  startSave() {
    console.log("Mentés....")
    console.log(this.userForm.value)
    this.api.addUser(this.userForm.value).subscribe({
      next: (result: any) => {
        console.log(result)
        this.showModal = false
        this.getUsers()
      },
      error: (err: any) => {

      }
    })
  }


  onSubmit(): void {
    this.auth.logout();
    window.dispatchEvent(new Event('authStateChanged'));
    this.router.navigate(['/login']);
    console.log('Logout successful!');
  }
}
