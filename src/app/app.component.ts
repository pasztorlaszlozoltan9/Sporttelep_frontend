import { Component, OnInit, ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './shared/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Budapest Sporttelepek';
  isLoggedIn: boolean = false;
  isAdminLoggedIn: boolean = false;
  private readonly host = 'http://localhost:8000/api/';

  constructor(private auth: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    this.checkLoginStatus();

    // Listen for storage changes (when logout happens in other tabs/windows)
    window.addEventListener('storage', () => {
      this.checkLoginStatus();
    });
     window.addEventListener('authStateChanged', () => {
    this.checkLoginStatus();
  });


    const showNavbarBtn = document.getElementById('showNavbarBtn') as HTMLButtonElement;
    const navUl = document.getElementById('navUl') as HTMLUListElement;

    // Add event listener to the showNavbarBtn
    showNavbarBtn.addEventListener('click', () => {
      navUl.classList.toggle('show-navbar');
    });

    // Add event listener to each navbar link
    const navbarLinks = document.querySelectorAll('#navUl li a');
    navbarLinks.forEach(link => {
      link.addEventListener('click', () => {
        navUl.classList.remove('show-navbar');
      });
    });
  }

  checkLoginStatus(): void {
    const token = localStorage.getItem('token');
    this.isLoggedIn = !!token;
    if (!token) {
      this.isAdminLoggedIn = false;
      return;
    }
    const localIsAdmin = this.checkAdminStatus();
    if (localIsAdmin) {
      this.isAdminLoggedIn = true;
      return;
    }
    const userId = this.getUserIdFromToken(token);
    if (userId) {
      this.fetchAdminStatus(userId, token);
    } else {
      this.isAdminLoggedIn = false;
    }
  }

  checkAdminStatus(): boolean {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const roleId = Number(payload.roleId ?? payload.role_id ?? payload.role);
        if (Number.isFinite(roleId)) {
          return roleId === 1;
        }
        return payload.role === 'admin' || payload.isAdmin === true;
      } catch (error) {
        console.error('Error decoding token:', error);
        return false;
      }
    }
    return false;
  }

  private getUserIdFromToken(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = Number(payload.id ?? payload.sub);
      return Number.isFinite(userId) ? userId : null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  private fetchAdminStatus(userId: number, token: string): void {
    this.http.get(`${this.host}users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (response: any) => {
        const user = response?.data ?? response;
        this.isAdminLoggedIn = Number(user?.roleId) === 1;
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
        this.isAdminLoggedIn = false;
      }
    });
  }

  logout(): void {
    this.auth.logout();
    window.dispatchEvent(new Event('authStateChanged'));
    this.checkLoginStatus();
  }
}
