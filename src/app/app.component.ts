import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
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

  constructor(private auth: AuthService, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.checkLoginStatus();

    // Listen for storage changes (when logout happens in other tabs/windows)
    window.addEventListener('storage', () => {
      this.checkLoginStatus();
    });
     window.addEventListener('authStateChanged', () => {
    this.checkLoginStatus();
  });
  }

  toggleNavbar(): void {
    const showNavbarBtn = document.getElementById('showNavbarBtn') as HTMLButtonElement | null;
    const navUl = document.getElementById('navUl') as HTMLUListElement | null;
    if (!showNavbarBtn || !navUl) {
      return;
    }

    const isOpen = navUl.classList.toggle('show-navbar');
    showNavbarBtn.setAttribute('aria-expanded', String(isOpen));
  }

  closeNavbar(): void {
    const showNavbarBtn = document.getElementById('showNavbarBtn') as HTMLButtonElement | null;
    const navUl = document.getElementById('navUl') as HTMLUListElement | null;
    if (!showNavbarBtn || !navUl) {
      return;
    }

    navUl.classList.remove('show-navbar');
    showNavbarBtn.setAttribute('aria-expanded', 'false');
  }

  onNavLinkClick(targetRoute: string, event: MouseEvent): void {
    this.closeNavbar();

    const currentRoute = this.normalizeRoute(this.router.url);
    const target = this.normalizeRoute(targetRoute);

    if (currentRoute === target) {
      event.preventDefault();
      window.location.reload();
    }
  }

  private normalizeRoute(route: string): string {
    const clean = String(route ?? '').split('?')[0].split('#')[0].trim();
    if (!clean || clean === '/') {
      return '/main';
    }
    return clean.endsWith('/') && clean.length > 1 ? clean.slice(0, -1) : clean;
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
