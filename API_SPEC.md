# API Specification: Cashier Monitoring System (v1.0)

## 1. Authentication
All requests must include a Bearer token in the `Authorization` header.
`Authorization: Bearer <token>`

---

## 2. Incidents API

### GET `/api/v1/incidents`
Returns a list of recorded incidents.
**Query Params:**
- `status`: `new`, `in_progress`, `closed`, `false_positive`
- `level`: `critical`, `high`, `medium`
- `limit`: int (default 50)

### GET `/api/v1/incidents/{id}`
Returns detailed information about a specific incident, including video snippet metadata.

### PATCH `/api/v1/incidents/{id}`
Updates incident status or adds comments.
**Body:**
```json
{
  "status": "closed",
  "comment": "Verified by manager. Transaction voided."
}
```

---

## 3. Models & Configuration API

### GET `/api/v1/models`
Returns all available models grouped by type.

### POST `/api/v1/models/{id}/activate`
Sets a specific model version as the active one for the production pipeline.

---

## 4. Real-time Alerts (WebSocket)
**Endpoint:** `ws://api.cashierwatch.ai/ws/alerts`

**Message Format (Server to Client):**
```json
{
  "type": "NEW_ALERT",
  "data": {
    "id": "uuid",
    "level": "critical",
    "event_type": "unverified_item_pass",
    "cashier_id": "cam_04",
    "timestamp": "2026-03-13T06:52:00Z"
  }
}
```

---

## 5. Video Stream API

### GET `/api/v1/streams/{camera_id}`
Returns the HLS/WebRTC stream URL for a specific camera.
