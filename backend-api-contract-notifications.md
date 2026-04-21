# Backend API Contract Handoff

Date: 2026-04-21
Scope: Booking notification recipient resolution for third notification method.
Goal: Keep existing email behavior unchanged while exposing deterministic data for frontend notification routing to admins (roleId=1) and booking location email.

## 1) Required Existing Contracts (must be guaranteed)

### 1.1 Users list endpoint
Endpoint: GET /api/users

Required fields per user item:
- id: number
- email: string (valid email format)
- roleId: number

Example response:
{
  "data": [
    {
      "id": 1,
      "email": "admin1@example.com",
      "roleId": 1,
      "fullname": "Admin One"
    },
    {
      "id": 23,
      "email": "player@example.com",
      "roleId": 2,
      "fullname": "Regular User"
    }
  ]
}

### 1.2 Locations list endpoint
Endpoint: GET /api/locations

Required fields per location item:
- id: number
- name: string
- email: string (valid email format, required for notification target)

Example response:
{
  "data": [
    {
      "id": 10,
      "name": "Budapest Sport Center",
      "email": "location10@example.com",
      "address": "..."
    }
  ]
}

### 1.3 Booking write/read payload consistency
Endpoints:
- POST /api/bookings
- PUT /api/bookings/{id}
- GET /api/bookings
- GET /api/bookings/{id}

Required booking fields for notification payload construction:
- id: number
- userId: number
- locationId: number
- sportId: number
- fieldId: number
- priceId: number
- date: string (YYYY-MM-DD)
- startTime: string (HH:mm or HH:mm:ss)
- endTime: string (HH:mm or HH:mm:ss)

## 2) Recommended New Convenience Endpoint (optional but preferred)

### 2.1 Admin recipients endpoint
Endpoint: GET /api/users/admin-recipients

Purpose:
- Return only active admins with valid emails.
- Avoid sending full users list to frontend.

Response:
{
  "data": [
    {
      "id": 1,
      "email": "admin1@example.com",
      "roleId": 1
    },
    {
      "id": 2,
      "email": "admin2@example.com",
      "roleId": 1
    }
  ]
}

Rules:
- Include only users where roleId == 1.
- Exclude null/empty/invalid emails.
- Exclude inactive users if inactive state exists in schema.

## 3) Optional Recipient Resolution Endpoint (future-proof)

### 3.1 Resolve recipients for booking action
Endpoint: GET /api/bookings/{id}/notification-recipients

Purpose:
- Backend returns final deduplicated recipient set for action notifications.
- Frontend does not need to understand role rules or location lookup.

Response:
{
  "data": {
    "bookingId": 555,
    "locationEmail": "location10@example.com",
    "adminEmails": ["admin1@example.com", "admin2@example.com"],
    "recipients": ["location10@example.com", "admin1@example.com", "admin2@example.com"]
  }
}

Rules:
- recipients must be deduplicated, lowercase-normalized.
- recipients must contain all valid roleId=1 admin emails plus booking location email.
- If location email missing, still return admin emails and include warning metadata.

## 4) Error and Warning Contract

For booking create/update/delete endpoints, keep current success behavior and provide optional warning metadata.

Example success with warning:
{
  "data": {
    "id": 555,
    "...": "..."
  },
  "emailWarning": "Location email is missing; admin notifications only."
}

Rules:
- Booking operation must not fail solely due to notification channel issues.
- Notification problems should be returned as warning, not hard error, when booking persistence is successful.

## 5) Validation Rules (backend)

- email must pass RFC-like basic format validation.
- date must be strict YYYY-MM-DD.
- startTime/endTime must be valid time format and endTime > startTime for same-day booking.
- locationId in booking must reference an existing location.
- roleId must be numeric and stable (admin = 1).

## 6) Compatibility and Non-breaking Requirements

- Do not remove current registration verification email flow.
- Do not remove current booking email flow.
- Any new endpoints are additive.
- Existing response envelope style should stay consistent (data object/array as currently used).

## 7) Minimal Backend Tasks Checklist

- Guarantee users payload includes roleId and email.
- Guarantee locations payload includes email.
- Guarantee booking payload includes locationId/date/startTime/endTime consistently.
- Add optional admin recipients endpoint.
- Add optional booking notification recipients endpoint.
- Return emailWarning for notification-side non-blocking issues.

## 8) Acceptance Criteria

- Frontend can reliably build recipient set: all admins (roleId=1) + booking location email.
- Missing location email does not break booking create/update/delete.
- Recipient source fields are present and stable in all relevant responses.
- Existing clients remain unaffected by additive changes.
