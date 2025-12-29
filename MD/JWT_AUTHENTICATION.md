# JWT Authentication Guide

## Overview

FunnyFy now supports JWT (JSON Web Token) authentication for secure API access. This replaces the simple `x-user-id` header method with a more secure token-based system.

---

## Endpoints

### 1. Generate Token
**POST** `/api/auth/token`

Generates a new JWT token for authentication.

#### Request Body
```json
{
  "userId": "uuid-optional",           // Optional: existing user UUID
  "revenuecatUserId": "string-optional" // Optional: RevenueCat appUserID
}
```

**Note**: If neither `userId` nor `revenuecatUserId` is provided, a new anonymous user will be created.

#### Response
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "uuid",
  "expiresIn": "30d",
  "message": "Token generated successfully"
}
```

#### Example (cURL)
```bash
curl -X POST https://funnyfyapp.vercel.app/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"revenuecatUserId": "test-user-123"}'
```

---

### 2. Refresh Token
**POST** `/api/auth/refresh`

Refreshes an existing JWT token (extends expiration).

#### Headers
```
Authorization: Bearer <your-jwt-token>
```

#### Response
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "uuid",
  "expiresIn": "30d",
  "message": "Token refreshed successfully"
}
```

#### Example (cURL)
```bash
curl -X POST https://funnyfyapp.vercel.app/api/auth/refresh \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Mobile App Integration

### Step 1: Generate Token on App Start

```javascript
// In your mobile app (React Native)
const generateToken = async (revenuecatUserId) => {
  try {
    const response = await fetch(`${API_BASE}/api/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        revenuecatUserId: revenuecatUserId, // From RevenueCat
      }),
    });

    const data = await response.json();
    
    if (data.ok) {
      // Store token securely (e.g., SecureStore in Expo)
      await SecureStore.setItemAsync('auth_token', data.token);
      return data.token;
    }
  } catch (error) {
    console.error('Failed to generate token:', error);
  }
};
```

### Step 2: Use Token in API Requests

```javascript
// Replace x-user-id header with Authorization header
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = await SecureStore.getItemAsync('auth_token');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

// Example: Generate caricature
const generateCaricature = async (styleId, imageUrl) => {
  return makeAuthenticatedRequest(`${API_BASE}/api/enqueue`, {
    method: 'POST',
    body: JSON.stringify({
      payload: {
        styleId,
        imageUrl,
      },
    }),
  });
};
```

### Step 3: Handle Token Expiration

```javascript
// Refresh token if expired
const refreshTokenIfNeeded = async () => {
  const token = await SecureStore.getItemAsync('auth_token');
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (data.ok) {
      await SecureStore.setItemAsync('auth_token', data.token);
      return data.token;
    }
  } catch (error) {
    // Token expired or invalid - generate new one
    console.log('Token expired, generating new token...');
    return await generateToken(revenuecatUserId);
  }
};
```

---

## Backend Configuration

### Environment Variables

Add to your Vercel environment variables:

```bash
JWT_SECRET=your-secret-key-here-min-32-chars
# OR
AUTH_SECRET=your-secret-key-here-min-32-chars
```

**Important**: 
- Use a strong, random secret (at least 32 characters)
- Never commit this to git
- Use different secrets for dev/staging/production

### Generate a Secure Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

---

## Migration from x-user-id

### Current Method (Deprecated)
```javascript
headers: {
  'x-user-id': 'test-user-123'
}
```

### New Method (Recommended)
```javascript
headers: {
  'Authorization': 'Bearer <jwt-token>'
}
```

### Backward Compatibility

The backend still supports `x-user-id` header for backward compatibility, but JWT tokens are recommended for:
- ✅ Better security
- ✅ Token expiration
- ✅ Standard authentication method
- ✅ Future-proofing

---

## Token Details

- **Expiration**: 30 days
- **Algorithm**: HS256 (HMAC SHA-256)
- **Claims**:
  - `userId`: User UUID
  - `sub`: Standard JWT subject claim (same as userId)
  - `iat`: Issued at timestamp

---

## Security Best Practices

1. **Store tokens securely**: Use `SecureStore` (Expo) or `Keychain` (iOS/Android)
2. **Refresh before expiration**: Refresh tokens a few days before they expire
3. **Handle token errors**: If token is invalid, generate a new one
4. **Never log tokens**: Don't log or expose tokens in error messages
5. **Use HTTPS**: Always use HTTPS in production

---

## Troubleshooting

### Error: "AUTH_CONFIG_ERROR"
- **Cause**: `JWT_SECRET` not set in environment variables
- **Fix**: Add `JWT_SECRET` to Vercel environment variables

### Error: "INVALID_TOKEN"
- **Cause**: Token expired or invalid
- **Fix**: Generate a new token using `/api/auth/token`

### Error: "USER_NOT_FOUND"
- **Cause**: Provided `userId` doesn't exist
- **Fix**: Use `revenuecatUserId` instead, or omit both to create new user

---

## Testing

### Test Token Generation
```bash
# Generate token with RevenueCat user ID
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"revenuecatUserId": "test-user-123"}'
```

### Test Token Usage
```bash
# Use token in API request
curl -X GET http://localhost:3000/api/usage \
  -H "Authorization: Bearer <your-token>"
```

### Test Token Refresh
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer <your-token>"
```

---

**Next Steps**: Update mobile app to use JWT tokens instead of `x-user-id` header.

