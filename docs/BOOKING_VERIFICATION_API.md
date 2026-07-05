# Booking Verification — Backend API Requirements

This document describes the API endpoints and data shapes needed to support the **Booking Criteria & Verification Flow** on the frontend.

## 1. Create Booking (extended)

**Endpoint:** `POST /api/v1/stays/bookings`

**Request body:** The frontend sends `occupants` with extended fields:

```json
{
  "listing_id": "uuid",
  "checkin_date": "YYYY-MM-DD",
  "checkout_date": "YYYY-MM-DD",
  "guest_count": 2,
  "occupants": [
    {
      "full_name": "John Doe",
      "id_number": "AB123456",
      "is_primary": true,
      "phone": "+212612345678",
      "email": "john@example.com",
      "gender": "MALE",
      "id_document_front_asset_id": "asset-uuid-optional",
      "id_document_back_asset_id": "asset-uuid-optional"
    },
    {
      "full_name": "Jane Doe",
      "id_number": "CD789012",
      "is_primary": false,
      "gender": "FEMALE"
    }
  ]
}
```

**Validation rules:**
- Primary guest and male guests: require `full_name`, `phone`, `email`, `id_number`
- Female guests: require `full_name`, `id_number` only
- `guest_count` must match `occupants.length`
- Platform approval: both client (guest) and host must be approved before booking can be confirmed

## 2. Upload Occupant ID Document

**Endpoint:** `POST /api/v1/stays/bookings/occupants/upload-id`

**Content-Type:** `multipart/form-data`

**Body:**
- `file` — image file (JPEG, PNG, WebP, max 5MB)
- `side` — `"front"` or `"back"`

**Response:**
```json
{
  "asset_id": "uuid"
}
```

**Security:**
- Requires JWT
- Store securely; access control for who can view IDs
- Audit logging for uploads

## 3. Verification Status

The frontend expects the following status values for booking/client/host:

- `PENDING_VERIFICATION` — not yet submitted
- `UNDER_REVIEW` — submitted, awaiting review
- `APPROVED` — approved
- `REJECTED` — rejected
- `BLOCKED` — booking blocked due to missing verification

## 4. Host Visibility

When returning a listing or booking, include host verification info:

- `host.id`
- `host.full_name`
- Host phone/contact: only expose after booking is confirmed (API should mask until then)
- Host identity verified badge
- Host profile photo URL (if available)
- Listing walkthrough video (already supported)
