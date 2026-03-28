import { Component, ElementRef, HostBinding, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AdminGuard } from '../shared/admin.guard';
import  Swal from  'sweetalert2';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly emailJsServiceId: string = 'sporttelepek_0825';
  private readonly emailJsRegisterTemplateId: string = 'template_8ghrwys';
  private readonly emailJsPublicKey: string = '__s7hNRM8XTSCfrSd';

  private readonly googleClientId = '201182991102-dc6nvg3uf9dvf30dp4bs6igmcrjcq4vh.apps.googleusercontent.com';
  private googleResizeTimeout: any = null;
  private readonly onResizeHandler = () => {
    this.scheduleGoogleButtonRender();
    this.syncBrandingCardHeight();
  };
  private cardResizeObserver: ResizeObserver | null = null;

  @ViewChild('brandingCard')
  brandingCardRef?: ElementRef<HTMLDivElement>;

  @ViewChild('authCard')
  authCardRef?: ElementRef<HTMLDivElement>;
  title = "Bejelentkezés";

  loginForm !: any;
  registerForm !: any;
  showRegisterForm: boolean = false;
  isRegisterProcessing: boolean = false;
  user: any = null;
  host = 'http://localhost:8000/api/'

  @HostBinding('class.register-open-host')
  get registerOpenHostClass(): boolean {
    return this.showRegisterForm;
  }


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
      phone: ['', [Validators.required, Validators.pattern(/^\+[0-9]{8,15}$/)]],
      fullname: ['', Validators.required],
      password: ['', [Validators.required]],
      password_confirmation: ['', [Validators.required]]
    })

    this.loadUserData();
    this.initializeGoogleSignIn();
    window.addEventListener('resize', this.onResizeHandler);
  }

  ngAfterViewInit(): void {
    this.syncBrandingCardHeight();

    if (typeof ResizeObserver !== 'undefined' && this.authCardRef?.nativeElement) {
      this.cardResizeObserver = new ResizeObserver(() => this.syncBrandingCardHeight());
      this.cardResizeObserver.observe(this.authCardRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResizeHandler);
    this.cardResizeObserver?.disconnect();
    this.cardResizeObserver = null;
    if (this.googleResizeTimeout) {
      clearTimeout(this.googleResizeTimeout);
      this.googleResizeTimeout = null;
    }
  }

  private syncBrandingCardHeight(): void {
    const brandingCard = this.brandingCardRef?.nativeElement;
    const authCard = this.authCardRef?.nativeElement;
    if (!brandingCard || !authCard) {
      return;
    }

    if (window.innerWidth <= 900) {
      brandingCard.style.height = '';
      return;
    }

    const authCardHeight = Math.ceil(authCard.getBoundingClientRect().height);
    if (authCardHeight <= 0) {
      return;
    }

    brandingCard.style.height = `${authCardHeight}px`;
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
        if (!/^\+[0-9]{8,15}$/.test(phone)) {
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

        if (Number(user?.active) !== 1) {
          localStorage.removeItem('token');
          window.dispatchEvent(new Event('authStateChanged'));
          Swal.fire({
            title: 'Profil inaktív',
            text: 'A profilod inaktív, kérjük lépj velünk kapcsolatba!',
            icon: 'error'
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
    if (this.isRegisterProcessing) {
      return;
    }

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
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isRegisterProcessing = true;
    this.showProcessingAlert('Regisztráció folyamatban...');

    const registrationEmail = String(this.registerForm.value.email ?? '').trim();
    const registrationFullname = String(this.registerForm.value.fullname ?? '').trim();
    const registrationPhone = String(this.registerForm.value.phone ?? '').trim();

    this.auth.register(this.registerForm.value).subscribe({
      next: async (_response: any) => {
        Swal.close();
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authStateChanged'));
        this.registerForm.reset();

        const registrationMessage = [
          `Új felhasználó regisztrált.`,
          `Email cím: ${registrationEmail}`,
          `Telefonszám: ${registrationPhone}`,
          `Teljes név: ${registrationFullname}`
        ].join('\n');

        try {
          await emailjs.send(
            this.emailJsServiceId,
            this.emailJsRegisterTemplateId,
            {
              to_email: registrationEmail,
              email: registrationEmail,
              user_email: registrationEmail,
              user_name: registrationFullname,
              user_fullname: registrationFullname,
              user_phone: registrationPhone,
              message: registrationMessage
            },
            { publicKey: this.emailJsPublicKey }
          );
        } catch (emailError: any) {
          console.error('EmailJS registration notification error:', emailError);
        }

        await Swal.fire({
          title: "Sikeres regisztráció, megerősítő email kiküldve!",
          icon: "success",
          draggable: true
        });
        this.router.navigate(['/login']);
        this.isRegisterProcessing = false;
      },
      error: async (error: any) => {
        Swal.close();
        if (error.error.message.includes('User already exists')) {
          await Swal.fire({
            title: "Felhasználó már létezik!",
            icon: "error"
          });
        } else {
          await Swal.fire({
            title:"Hiba a regisztráció során!",
            icon: "error"
          });
        }
        this.isRegisterProcessing = false;
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

  protected isHungarianPhoneValid(): boolean {
    const phone = String(this.registerForm?.value?.phone ?? '').trim();
    return /^\+[0-9]{8,15}$/.test(phone);
  }

  protected shouldShowPhoneWarning(): boolean {
    const phoneControl = this.registerForm?.get('phone');
    const phone = String(this.registerForm?.value?.phone ?? '').trim();
    if (!phone) {
      return false;
    }

    return Boolean(phoneControl?.touched || phoneControl?.dirty) && !this.isHungarianPhoneValid();
  }

}
