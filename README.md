Sporttelep Frontend
Angular alapú webes felület sportpálya foglaló rendszerhez.  
A dokumentáció a projekt struktúrája és a backend API alapján készült.

Telepítés
A projekt klónozása után:

bash
npm install
▶️ Az alkalmazás futtatása
Fejlesztői mód
bash
ng serve
Alapértelmezett URL:

Code
http://localhost:4200
Production build
bash
ng build
🌐 Backend kapcsolat
A frontend a következő környezeti változóval kapcsolódik a backendhez:

src/environments/environment.ts:

ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:4200/api'
};
Minden védett API‑hívás automatikusan tartalmazza a JWT tokent az Authorization fejlécben, a TokenInterceptor segítségével.

🔐 Hitelesítés
A rendszer kétféle bejelentkezést támogat:

✔️ Email + jelszó
/api/login végpont

JWT token tárolása localStorage‑ben

AuthGuard védi a védett oldalakat

✔️ Google Sign‑In
Google Identity Services integráció

Backend ellenőrzi a Google ID tokent

Siker esetén JWT‑t kap a felhasználó

🧩 Fő funkciók
👤 Felhasználók
Regisztráció

Bejelentkezés

Google Sign‑In

Profiladatok megjelenítése

🏟️ Foglalások
Sportág kiválasztása

Helyszín kiválasztása

Pálya kiválasztása

Szabad időpontok listázása

Foglalás létrehozása

Foglalások listázása

🛠️ Admin funkciók
(roleId = 1 esetén)

Sportágak kezelése

Helyszínek kezelése

Pályák kezelése

Árak kezelése

Foglalások kezelése

📁 Projekt felépítése
Code
src/
 ├── app/
 │    ├── components/
 │    │    ├── auth/
 │    │    ├── bookings/
 │    │    ├── fields/
 │    │    ├── locations/
 │    │    ├── sports/
 │    │    └── prices/
 │    ├── services/
 │    ├── guards/
 │    ├── interceptors/
 │    ├── app-routing.module.ts
 │    └── app.component.ts
 ├── assets/
 ├── environments/
 └── index.html
🛡️ Guardok és Interceptorok
✔️ AuthGuard
Védi a bejelentkezést igénylő oldalakat.
Ha nincs token → átirányítás a login oldalra.

✔️ TokenInterceptor
Minden API‑híváshoz automatikusan hozzáadja:

Code
Authorization: Bearer <jwt_token>
🖥️ Oldalak és komponensek
🔑 Auth modul
LoginComponent

RegisterComponent

GoogleLoginComponent

🏟️ Foglalási modul
BookingListComponent

BookingCreateComponent

📍 Helyszínek
LocationListComponent

LocationFormComponent

🏅 Sportágak
SportListComponent

SportFormComponent

🏟️ Pályák
FieldListComponent

FieldFormComponent

💰 Árak
PriceListComponent

PriceFormComponent

🎨 UI és Design
Bootstrap alapú reszponzív felület

Táblázatos listák

Validált űrlapok

Egyszerű admin‑szerű elrendezés

🧪 Tesztelés
bash
ng test
📜 License
ISC

###Felhasználói dokumentáció:
A Sporttelep frontend egy Angular alapú SPA (Single Page Application), amely a Sporttelep backend REST API‑ját használja.
A cél egy moduláris, könnyen bővíthető, admin‑képes sportpálya foglalási felület biztosítása.

A projekt támogatja:

JWT alapú hitelesítést

Google Sign‑In integrációt

CRUD műveleteket minden entitáson

Admin funkciókat

Reszponzív Bootstrap alapú UI‑t

📁 2. Projekt struktúra
Code
src/
 ├── app/
 │    ├── components/
 │    │    ├── auth/
 │    │    ├── bookings/
 │    │    ├── fields/
 │    │    ├── locations/
 │    │    ├── sports/
 │    │    └── prices/
 │    ├── services/
 │    ├── guards/
 │    ├── interceptors/
 │    ├── app-routing.module.ts
 │    └── app.module.ts
 ├── assets/
 ├── environments/
 │    ├── environment.ts
 │    └── environment.prod.ts
 └── index.html
Főbb modulok:
Mappa	Tartalom
components/	UI komponensek (CRUD oldalak, auth, foglalások)
services/	API kommunikáció, adatkezelés
guards/	AuthGuard, admin guard
interceptors/	TokenInterceptor (JWT hozzáadása)
environments/	API URL és környezeti beállítások

🌐 3. Backend API kapcsolat
A frontend a backendhez az environment.ts fájlon keresztül kapcsolódik:

ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
Minden HTTP kérés a services/ mappában található szolgáltatásokon keresztül történik.

🔐 4. Hitelesítés
4.1 JWT alapú hitelesítés
A bejelentkezés után a backend JWT tokent ad vissza:

json
{
  "id": 1,
  "email": "user@example.com",
  "accessToken": "..."
}
A token a localStorage‑ben tárolódik:

Code
localStorage.setItem('token', accessToken)
4.2 TokenInterceptor
Minden API kéréshez automatikusan hozzáadja:

Code
Authorization: Bearer <token>
Interceptor helye:

Code
src/app/interceptors/token.interceptor.ts
4.3 AuthGuard
A védett oldalakhoz csak bejelentkezett felhasználó fér hozzá.

Guard helye:

Code
src/app/guards/auth.guard.ts
🔧 5. Szolgáltatások (Services)
Minden entitáshoz külön service tartozik:

Service	Feladat
auth.service.ts	Login, register, Google Sign‑In
user.service.ts	Felhasználók kezelése
location.service.ts	Helyszínek CRUD
sport.service.ts	Sportágak CRUD
field.service.ts	Pályák CRUD
available-date.service.ts	Elérhető időpontok CRUD
booking.service.ts	Foglalások kezelése
price.service.ts	Árak kezelése

Példa service metódus:
ts
getLocations() {
  return this.http.get(`${environment.apiUrl}/locations`);
}
🧩 6. Komponensek
A komponensek modulárisan vannak felépítve, minden entitáshoz tartozik:

lista oldal

űrlap oldal (create/update)

Példa:

Code
components/
 ├── locations/
 │    ├── location-list/
 │    └── location-form/
Minden komponens:

Angular formokat használ

validációt tartalmaz

a megfelelő service‑t hívja

🧭 7. Routing
A routing modul:

Code
src/app/app-routing.module.ts
Példa útvonalak:

ts
{ path: 'login', component: LoginComponent },
{ path: 'locations', component: LocationListComponent, canActivate: [AuthGuard] },
{ path: 'admin/sports', component: SportListComponent, canActivate: [AdminGuard] }
🛠️ 8. Admin funkciók
Az admin jogosultságot a backend roleId mezője határozza meg.

Admin jogosultság esetén elérhető:

sportágak kezelése

helyszínek kezelése

pályák kezelése

árak kezelése

foglalások listázása

AdminGuard:

Code
src/app/guards/admin.guard.ts
🎨 9. UI és design
A projekt Bootstrap alapú:

reszponzív táblázatok

validált űrlapok

egyszerű admin felület

Angular formok

🧪 10. Fejlesztési workflow
10.1 Projekt indítása
bash
npm install
ng serve
10.2 Build készítése
bash
ng build --prod
10.3 Kódstílus
Angular best practice

komponens alapú felépítés

szolgáltatás alapú adatkezelés

environment használata API URL‑hez

🧱 11. Hibakezelés
A backend egységes hibastruktúrát ad vissza:

Code
{
  "success": false,
  "message": "...",
  "error": "..."
}
A frontend ezt:

snackbarban

alertben

vagy form hibaüzenetben

jeleníti meg.

📦 12. Verziókezelés
A projekt Git alapú.