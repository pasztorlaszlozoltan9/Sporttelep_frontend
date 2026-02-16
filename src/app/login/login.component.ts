import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from "@angular/router";
import { HttpClient } from '@angular/common/http';
import { AdminGuard } from '../shared/admin.guard';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink,],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {

  loginForm !: any;
  registerForm !: any;
  user: any = null;
  host = 'http://localhost:8000/api/'


  constructor(
    private auth: AuthService,
    private builder: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private adminGuard: AdminGuard
  ) { }


  ngOnInit() {
    this.loginForm = this.builder.group({
      name: [''],
      password: [''],
    });
    this.registerForm = this.builder.group({
      name: [''],
      email: [''],
      phone: [''],
      fullname: [''],
      password: [''],
      password_confirmation: ['']
    })

    this.loadUserData();
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
            this.user = response.data;// Extract from 'data' property
            // console.log('User data:', this.user);
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

  login() {
    //console.log('belépés...')
    if (!this.loginForm) { console.error('loginForm not initialized'); return }
    //console.log(this.loginForm.value)


    this.auth.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        // console.log('Login response:', response);
        localStorage.setItem('token', response.accessToken)
        window.dispatchEvent(new Event('authStateChanged'));
        this.loginForm.reset()
        
        // Fetch full user data including roleId
        this.loadUserData();
        
        // Wait for user data to load, then route based on roleId
        setTimeout(() => {
          // console.log('User after loading:', this.user);
          const roleId = this.user?.roleId;
          // console.log('roleId:', roleId, 'Type:', typeof roleId);
          if (roleId == 1) {
            // console.log('Routing to admin');
            this.router.navigate(['/admin']);
          } else {
            // console.log('Routing to profil');
            this.router.navigate(['/profil'])
          }
        },50);
      },
      error: () => {

        alert('Hibás felhasználónév vagy jelszó!')
      }
    })


  }

  register() {
    console.log('regisztráció...');
    if (!this.registerForm) {
      console.error('registerForm not initialized');
      return;
    }
    console.log(this.registerForm.value);

    this.auth.register(this.registerForm.value).subscribe({
      next: (response: any) => {
        console.log(response);
        localStorage.setItem('token', response.accessToken);
        this.registerForm.reset();
        alert('Sikeres regisztráció!');
        this.router.navigate(['/profil']);
      },
      error: (error: any) => {
        const nameControl = this.registerForm.get('name');
        const emailControl = this.registerForm.get('email');
        console.log('error:', error);
        if (error.error.message.includes('User already exists')) {
          console.log(nameControl.errors);
          alert('Felhasználó már létezik!');
        } else {
          alert('Hibás regisztrációs adatok!');
        }
      }
    });
  }

}
