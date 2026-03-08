import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AdminGuard } from '../shared/admin.guard';
import  Swal from  'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly googleClientId = '201182991102-dc6nvg3uf9dvf30dp4bs6igmcrjcq4vh.apps.googleusercontent.com';
  private googleResizeTimeout: any = null;
  private readonly onResizeHandler = () => this.scheduleGoogleButtonRender();
  title = "Bejelentkezés";

  loginForm !: any;
  registerForm !: any;
  showRegisterForm: boolean = false;
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
      email: [''],
      password: [''],
    });
    this.registerForm = this.builder.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      fullname: ['', Validators.required],
      password: ['', [Validators.required]],
      password_confirmation: ['', [Validators.required]]
    })

    this.loadUserData();
    this.initializeGoogleSignIn();
    window.addEventListener('resize', this.onResizeHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResizeHandler);
    if (this.googleResizeTimeout) {
      clearTimeout(this.googleResizeTimeout);
      this.googleResizeTimeout = null;
    }
  }

  toggleRegisterForm(): void {
    this.showRegisterForm = !this.showRegisterForm;
  }

  loadUserData(): void {
    const token = localStorage.getItem('token');
    if (token) {
      const userId = this.getUserIdFromToken(token);
      if (!userId) {
        console.error('Error decoding token');
        this.user = null;
        return;
      }

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
    }
  }

  private getUserIdFromToken(token: string): number | null {
    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      const userId = Number(decodedToken?.id ?? decodedToken?.sub);
      return Number.isFinite(userId) ? userId : null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  private isUserVerified(user: any): boolean {
    if (!user) return false;
    if (user.email_verified_at) return true;
    if (user.emailVerifiedAt) return true;
    if (user.is_verified === true || user.is_verified === 1) return true;
    if (user.verified === true || user.verified === 1) return true;
    return false;
  }

  private initializeGoogleSignIn(): void {
    const win = window as any;
    if (!win.google?.accounts?.id) {
      setTimeout(() => this.initializeGoogleSignIn(), 300);
      return;
    }

    win.google.accounts.id.initialize({
      client_id: this.googleClientId,
      callback: (response: any) => this.handleGoogleCredential(response)
    });

    const googleButtonContainer = document.getElementById('googleSignInButton');
    if (googleButtonContainer) {
      googleButtonContainer.innerHTML = '';
      const containerWidth =
        googleButtonContainer.clientWidth ||
        googleButtonContainer.parentElement?.clientWidth ||
        320;
      const responsiveWidth = Math.min(
        Math.max(containerWidth - 8, 180),
        420
      );

      win.google.accounts.id.renderButton(googleButtonContainer, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: responsiveWidth,
        logo_alignment: 'left'
      });
    }
  }

  private scheduleGoogleButtonRender(): void {
    if (this.googleResizeTimeout) {
      clearTimeout(this.googleResizeTimeout);
    }

    this.googleResizeTimeout = setTimeout(() => {
      this.initializeGoogleSignIn();
    }, 120);
  }

  private handleGoogleCredential(response: any): void {
    const credential = response?.credential;
    if (!credential) {
      Swal.fire({
        title: 'Google belépés sikertelen!',
        text: 'Hiányzó Google hitelesítési adat.',
        icon: 'error'
      });
      return;
    }

    // First try without phone number. If backend requires it, we prompt and retry.
    this.tryGoogleLogin(credential, '', false);
  }

  private tryGoogleLogin(credential: string, phoneNumber: string, withPhonePrompt: boolean): void {
    this.auth.googleLogin(credential, phoneNumber).subscribe({
      next: (googleResponse: any) => {
        const token = googleResponse?.accessToken;
        const responseMessage = String(
          googleResponse?.message ?? googleResponse?.error ?? ''
        ).toLowerCase();

        const phoneMissingInSuccessResponse =
          !withPhonePrompt &&
          (googleResponse?.requiresPhone === true ||
            googleResponse?.phoneRequired === true ||
            responseMessage.includes('phone') ||
            responseMessage.includes('telef'));

        if (phoneMissingInSuccessResponse) {
          this.promptPhoneAndGoogleLogin(credential);
          return;
        }

        if (!token) {
          if (!withPhonePrompt) {
            this.promptPhoneAndGoogleLogin(credential);
            return;
          }

          Swal.fire({
            title: 'Google belépés sikertelen!',
            text: 'Hiányzó hozzáférési token.',
            icon: 'error'
          });
          return;
        }

        if (!withPhonePrompt) {
          const userId = this.getUserIdFromToken(token);
          if (!userId) {
            this.completeLoginWithToken(token);
            return;
          }

          this.http.get(`${this.host}users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).subscribe({
            next: (userResponse: any) => {
              const user = userResponse?.data ?? userResponse;
              const normalizedPhone = String(user?.phone ?? '').trim();
              const hasPhone = normalizedPhone.length > 0 && normalizedPhone !== '0';

              if (!hasPhone) {
                this.promptPhoneAndGoogleLogin(credential);
                return;
              }

              this.completeLoginWithToken(token);
            },
            error: () => {
              this.completeLoginWithToken(token);
            }
          });
          return;
        }

        this.completeLoginWithToken(token);
      },
      error: (err: any) => {
        const backendMessage = String(
          err?.error?.message ?? err?.error?.error ?? ''
        ).toLowerCase();

        const phoneMissing =
          !withPhonePrompt &&
          (backendMessage.includes('phone') ||
            backendMessage.includes('telef') ||
            backendMessage.includes('phonenumber') ||
            err?.status === 422 ||
            err?.status === 400);

        if (phoneMissing) {
          this.promptPhoneAndGoogleLogin(credential);
          return;
        }

        Swal.fire({
          title: 'Google belépés sikertelen!',
          text: 'A backend nem fogadta el a Google tokent.',
          icon: 'error'
        });
      }
    });
  }

  private promptPhoneAndGoogleLogin(credential: string): void {

    Swal.fire({
      title: 'Telefonszám megerősítése',
      text: 'Add meg a telefonszámodat nemzetközi formátumban (pl. +36301234567).',
      input: 'text',
      inputPlaceholder: '+36301234567',
      showCancelButton: true,
      confirmButtonText: 'Folytatás',
      cancelButtonText: 'Mégsem',
      inputValidator: (value) => {
        const phone = (value ?? '').trim();
        if (!phone) {
          return 'A telefonszám megadása kötelező.';
        }
        if (!/^\+?[0-9]{8,15}$/.test(phone)) {
          return 'Érvénytelen telefonszám formátum.';
        }
        return null;
      }
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const phoneNumber = String(result.value).trim();

      this.tryGoogleLogin(credential, phoneNumber, true);
    });
  }

  private completeLoginWithToken(token: string): void {
    const userId = this.getUserIdFromToken(token);
    if (!userId) {
      Swal.fire({
        title: 'Sikertelen belépés!',
        text: 'Érvénytelen token.',
        icon: 'error'
      });
      return;
    }

    localStorage.setItem('token', token);

    this.http.get(`${this.host}users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (userResponse: any) => {
        const user = userResponse?.data ?? userResponse;

        if (!this.isUserVerified(user)) {
          localStorage.removeItem('token');
          window.dispatchEvent(new Event('authStateChanged'));
          Swal.fire({
            title: 'Email megerősítés szükséges',
            text: 'Belépés előtt erősítsd meg az email címedet!',
            icon: 'warning'
          });
          return;
        }

        this.user = user;
        window.dispatchEvent(new Event('authStateChanged'));
        this.loginForm.reset();

        const roleId = this.user?.roleId;
        if (roleId == 1) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/profil']);
        }
      },
      error: () => {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authStateChanged'));
        Swal.fire({
          title: 'Sikertelen belépés!',
          text: 'Nem sikerült lekérni a felhasználói adatokat.',
          icon: 'error'
        });
      }
    });
  }

  login() {
    //console.log('belépés...')
    if (!this.loginForm) { console.error('loginForm not initialized'); return }
    //console.log(this.loginForm.value)


    this.auth.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        const token = response?.accessToken;
        if (!token) {
          Swal.fire({
            title: 'Sikertelen belépés!',
            text: 'Hiányzó hozzáférési token.',
            icon: 'error'
          });
          return;
        }

        this.completeLoginWithToken(token);
      },
      error: () => {
        Swal.fire({
          title: "Hibás felhasználónév vagy jelszó",
          icon: "error"
        });
      }
    })


  }

  register() {
    if (!this.registerForm) {
      console.error('registerForm not initialized');
      return;
    }

    const password = String(this.registerForm.value.password ?? '');
    const passwordConfirmation = String(this.registerForm.value.password_confirmation ?? '');

    if (!this.isPasswordValid(password)) {
      Swal.fire({
        title: 'Gyenge jelszó',
        text: 'A jelszónak legalább 8 karakterből kell állnia, és tartalmaznia kell kisbetűt, nagybetűt, valamint speciális karaktert.',
        icon: 'warning'
      });
      return;
    }

    if (password !== passwordConfirmation) {
      Swal.fire({
        title: 'A két jelszó nem egyezik',
        icon: 'warning'
      });
      return;
    }

    if (this.registerForm.invalid) {
      Swal.fire({
        title: 'Hiányzó adatok',
        text: 'Tölts ki minden kötelező mezőt helyesen.',
        icon: 'warning'
      });
      return;
    }

    this.auth.register(this.registerForm.value).subscribe({
      next: (response: any) => {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authStateChanged'));
        this.registerForm.reset();
        Swal.fire({
          title: "Sikeres regisztráció, megerősítő email kiküldve!",
          icon: "success",
          draggable: true
        });
        this.router.navigate(['/login']);
      },
      error: (error: any) => {
        const emailControl = this.registerForm.get('email');
        if (error.error.message.includes('User already exists')) {
          Swal.fire({
            title: "Felhasználó már létezik!",
            icon: "error"
          });
        } else {
          Swal.fire({
            title:"Hiba a regisztráció során!",
            icon: "error"
          })
        }
      }
    });
  }

  protected isPasswordLongEnough(): boolean {
    const password = String(this.registerForm?.value?.password ?? '');
    return password.length >= 8;
  }

  protected hasLowercaseInPassword(): boolean {
    const password = String(this.registerForm?.value?.password ?? '');
    return /[a-z]/.test(password);
  }

  protected hasUppercaseInPassword(): boolean {
    const password = String(this.registerForm?.value?.password ?? '');
    return /[A-Z]/.test(password);
  }

  protected hasSpecialCharInPassword(): boolean {
    const password = String(this.registerForm?.value?.password ?? '');
    return /[^A-Za-z0-9]/.test(password);
  }

  protected isPasswordValid(password: string): boolean {
    const minLengthOk = password.length >= 8;
    const lowercaseOk = /[a-z]/.test(password);
    const uppercaseOk = /[A-Z]/.test(password);
    const specialOk = /[^A-Za-z0-9]/.test(password);

    return minLengthOk && lowercaseOk && uppercaseOk && specialOk;
  }

}
