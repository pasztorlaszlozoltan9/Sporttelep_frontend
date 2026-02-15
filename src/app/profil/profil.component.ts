import { Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.css']
})
export class ProfilComponent implements OnInit {

  user: any = null;
  host = 'http://localhost:8000/api/'
  
  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}
  
  ngOnInit(): void {
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

  onSubmit(): void {
    this.auth.logout();
    window.dispatchEvent(new Event('authStateChanged'));
    this.router.navigate(['/login']);
    console.log('Logout successful!');
  }
}