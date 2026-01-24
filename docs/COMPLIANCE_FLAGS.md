# Chain-Level Compliance Flags Implementation

## Overview
This feature adds visual compliance indicators to the wallet view, helping enterprise users quickly validate token compliance requirements across VOI and Aramid networks.

## Compliance Badges

### 1. MICA Ready Badge (Green)
- **Indicates**: Token meets EU Markets in Crypto-Assets regulations
- **Impact**: Suitable for European markets, regulatory compliant
- **Detection**: Explicit `micaCompliant` flag or comprehensive compliance controls

### 2. Whitelist Required Badge (Yellow/Warning)
- **Indicates**: Only whitelisted addresses can hold or transfer the token
- **Impact**: Requires issuer approval before receiving tokens
- **Detection**: Freeze address set or explicit `whitelistRequired` flag

### 3. KYC Required Badge (Blue/Info)
- **Indicates**: Know Your Customer verification required
- **Impact**: Identity verification needed to hold or trade
- **Detection**: KYC keywords in metadata or explicit `kycRequired` flag

### 4. Jurisdiction Restricted Badge (Yellow/Warning)
- **Indicates**: Geographic or regulatory restrictions apply
- **Impact**: Transfers may be blocked based on jurisdiction
- **Detection**: Clawback address with compliance keywords

### 5. Transfer Controlled Badge (Gray/Default)
- **Indicates**: Issuer has transfer control capabilities
- **Impact**: Issuer can freeze accounts or clawback tokens
- **Detection**: Freeze or clawback address set

### 6. Unrestricted Badge (Gray/Default)
- **Indicates**: No special compliance requirements
- **Impact**: Free transfer between any addresses
- **Detection**: No freeze/clawback addresses, no compliance keywords

## Network-Level Compliance

### VOI Mainnet
- **Status**: Enterprise Ready
- **Features**: MICA-compliant tokens, advanced whitelisting, KYC features
- **Best For**: Enterprise and regulated assets

### Aramid Mainnet
- **Status**: Enterprise Ready  
- **Features**: Compliance-ready infrastructure, transfer controls, audit trails
- **Best For**: Regulated digital assets

### Dockernet (Local Testing)
- **Status**: Test Network
- **Features**: All compliance features available for testing
- **Best For**: Development and testing only

## Technical Implementation

### Detection Logic
Compliance flags are determined using a heuristic approach:

1. **Freeze Address Check**: If set (not zero address), indicates whitelist/transfer restrictions
2. **Clawback Address Check**: If set, indicates jurisdiction/compliance controls
3. **Metadata Analysis**: Searches for keywords: MICA, KYC, whitelist, regulated, compliant
4. **Explicit Properties**: Checks ARC3 metadata for explicit compliance flags

### Code Location
- **Tooltip Component**: `src/components/ui/Tooltip.vue`
- **ComplianceBadge Component**: `src/components/ComplianceBadge.vue`
- **Metadata Extension**: `src/composables/useTokenMetadata.ts`
- **Display Integration**: `src/components/TokenBalancePanel.vue`, `src/components/WalletInfo.vue`

### Data Flow
```
Token On-Chain Data → determineComplianceFlags() → ComplianceFlags Interface → ComplianceBadge Component → User Tooltip
```

## Usage Example

When viewing wallet token holdings:
1. Each token displays relevant compliance badges
2. Hover over any badge to see detailed explanation
3. Network compliance status shown in WalletInfo panel
4. All information derived from on-chain token metadata

## Future Enhancements

### Short Term
- Add compliance filter to token list
- Show compliance summary statistics
- Export compliance report

### Long Term
- Real-time compliance data from oracle
- Integration with KYC providers
- Automated compliance checks before transfers
- Compliance dashboard with historical tracking

## Compliance Flag Interface

```typescript
interface ComplianceFlags {
  micaReady: boolean              // EU MICA regulation compliant
  whitelistRequired: boolean      // Requires address whitelisting
  kycRequired: boolean            // Requires KYC verification
  jurisdictionRestricted: boolean // Geographic restrictions apply
  transferRestricted: boolean     // Has transfer controls
  notes?: string                  // Additional compliance information
}
```

## Testing

To test compliance badges:
1. Connect wallet to VOI or Aramid network
2. View tokens with different compliance characteristics:
   - Tokens with freeze address → Whitelist badge
   - Tokens with clawback address → Jurisdiction/Transfer badges
   - Tokens with MICA keywords → MICA Ready badge
   - Standard tokens → Unrestricted badge
3. Hover over badges to see detailed tooltips
4. Check network compliance in WalletInfo panel
