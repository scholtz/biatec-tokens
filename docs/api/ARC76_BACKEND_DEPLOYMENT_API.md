# ARC76 Backend-Only Token Deployment - API Documentation

## Overview

This document describes the API contracts for the ARC76 backend-only token deployment flow. This system enables users to create tokens using only email/password authentication without requiring wallet connectors or client-side key management.

## Key Features

- ✅ Email/password authentication via ARC76
- ✅ Backend-controlled transaction signing (no client-side keys)
- ✅ Automatic account provisioning
- ✅ Comprehensive audit trail for compliance
- ✅ Idempotent deployment requests
- ✅ Multi-network support (Algorand, VOI, Aramid, Ethereum, etc.)

## Authentication

All API requests must include an ARC14 authentication header:

```
Authorization: Bearer <ARC14_SESSION_TOKEN>
```

The session token is generated client-side using ARC76 account derivation and ARC14 signing.

## Core Endpoints

### 1. Account Provisioning

**POST /api/accounts/provision**

Provisions a blockchain account after ARC76 authentication.

**Request:**
```json
{
  "email": "user@example.com",
  "derivedAddress": "ALGORANDADDRESS...",
  "derivationIndex": 1
}
```

**Response (200 OK):**
```json
{
  "status": "active",
  "account": {
    "address": "ALGORANDADDRESS...",
    "email": "user@example.com",
    "entitlements": ["token_deployment", "compliance_reporting"]
  }
}
```

### 2. Token Deployment

**POST /api/tokens/deploy**

Deploys a token using backend signing.

**Request (ARC3):**
```json
{
  "standard": "ARC3",
  "name": "My Token",
  "symbol": "MTK",
  "totalSupply": 1000000,
  "network": "algorand-testnet"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "transactionId": "TXN123...",
  "assetId": "12345678",
  "status": "submitted"
}
```

### 3. Audit Trail

**GET /api/audit/deployments/{id}**

Retrieves audit trail for compliance reporting.

**Response (200 OK):**
```json
{
  "entries": [
    {
      "eventType": "deployment_initiated",
      "timestamp": "2026-02-12T12:00:00Z",
      "actor": { "email": "user@example.com" },
      "action": "Token deployment initiated"
    }
  ]
}
```

## Security

- **Backend Signing**: Private keys stored in HSM
- **ARC76 Derivation**: Deterministic, reproducible accounts
- **Audit Logging**: Every action tracked for compliance
- **Rate Limiting**: Prevents abuse

## Rate Limits

- Account Provisioning: 10/hour
- Token Deployment: 5/hour
- Audit Retrieval: 100/hour

## Support

- Email: support@biatec.io
- Docs: https://docs.biatec.io
