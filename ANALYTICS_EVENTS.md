# Analytics Events Documentation

This document describes all analytics events tracked in the unified onboarding and discovery features.

## Event Tracking Service

All events are tracked through the `TelemetryService` singleton, which provides centralized event tracking with consistent formatting and logging.

### Usage

```typescript
import { telemetryService } from '../services/TelemetryService'

// Track an event
telemetryService.trackOnboardingStarted({ source: 'landing' })
```

## Onboarding Events

### `onboarding_started`
Emitted when user first lands and sees the onboarding wizard.

**Properties:**
- `source` (string): Where the onboarding was initiated from
  - `'landing'`: From landing page
  - `'email_path'`: From email signup option
  - `'wallet_path'`: From wallet connect option

**Example:**
```typescript
telemetryService.trackOnboardingStarted({ source: 'landing' })
```

### `onboarding_step_completed`
Emitted when user completes each step in the onboarding checklist.

**Properties:**
- `step_id` (string): Unique identifier for the step
- `step_title` (string): Human-readable title
- `step_number` (number): Step index (1-based)
- `total_steps` (number): Total number of steps
- `progress_percentage` (number): Calculated progress percentage

**Example:**
```typescript
telemetryService.trackOnboardingStepCompleted({
  stepId: 'connect-wallet',
  stepTitle: 'Connect Your Wallet',
  stepNumber: 2,
  totalSteps: 5
})
```

### `onboarding_completed`
Emitted when user finishes all required onboarding steps.

**Properties:**
- `duration_ms` (number, optional): Time taken to complete onboarding

**Example:**
```typescript
telemetryService.trackOnboardingCompleted({ durationMs: 120000 })
```

## Discovery Dashboard Events

### `discovery_dashboard_viewed`
Emitted when user navigates to the token discovery page.

**Properties:**
- `source` (string): How the user arrived
  - `'direct'`: Direct navigation
  - `'onboarding'`: From onboarding flow
  - `'home'`: From home page

**Example:**
```typescript
telemetryService.trackDiscoveryDashboardViewed({ source: 'direct' })
```

### `discovery_filter_applied`
Emitted when user applies any filter in the discovery dashboard.

**Properties:**
- `filter_type` (string): Type of filter applied
  - `'standard'`: Token standard filter
  - `'compliance'`: Compliance status filter
  - `'liquidity'`: Liquidity filter
  - `'chain'`: Blockchain network filter
  - `'issuer'`: Issuer type filter
- `filter_value` (string): The value(s) selected (comma-separated if multiple)
- `filter_count` (number): Number of values selected

**Example:**
```typescript
telemetryService.trackDiscoveryFilterApplied({
  filterType: 'standard',
  filterValue: 'ARC200,ERC20',
  filterCount: 2
})
```

### `discovery_filter_saved`
Emitted when user saves their filter preferences.

**Properties:**
- `filter_count` (number): Total number of active filters
- `has_standards` (boolean): Whether standards filter is active
- `has_compliance` (boolean): Whether compliance filter is active
- `has_chains` (boolean): Whether chains filter is active

**Example:**
```typescript
telemetryService.trackDiscoveryFilterSaved({
  filterCount: 3,
  hasStandards: true,
  hasCompliance: true,
  hasChains: false
})
```

## Token Interaction Events

### `token_detail_viewed`
Emitted when user opens a token detail page/drawer.

**Properties:**
- `token_id` (string): Unique token identifier
- `token_standard` (string): Token standard (e.g., 'ARC200', 'ERC20')
- `token_chain` (string): Blockchain network
- `source` (string): Where the view was initiated from
  - `'discovery'`: From discovery dashboard
  - `'dashboard'`: From user's dashboard
  - `'marketplace'`: From marketplace
  - `'direct'`: Direct link

**Example:**
```typescript
telemetryService.trackTokenDetailViewed({
  tokenId: 'token-123',
  tokenStandard: 'ARC200',
  tokenChain: 'voi-mainnet',
  source: 'discovery'
})
```

### `watchlist_add`
Emitted when user adds a token to their watchlist.

**Properties:**
- `token_id` (string): Unique token identifier
- `token_standard` (string): Token standard
- `source` (string): Where the add was initiated from
  - `'detail'`: From token detail page
  - `'card'`: From token card
  - `'discovery'`: From discovery dashboard

**Example:**
```typescript
telemetryService.trackWatchlistAdd({
  tokenId: 'token-123',
  tokenStandard: 'ARC200',
  source: 'card'
})
```

### `watchlist_remove`
Emitted when user removes a token from their watchlist.

**Properties:**
- `token_id` (string): Unique token identifier
- `token_standard` (string): Token standard

**Example:**
```typescript
telemetryService.trackWatchlistRemove({
  tokenId: 'token-123',
  tokenStandard: 'ARC200'
})
```

### `compliance_badge_clicked`
Emitted when user clicks on a compliance badge to view details.

**Properties:**
- `token_id` (string): Unique token identifier
- `badge_type` (string): Type of badge clicked
- `compliance_status` (string): Current compliance status

**Example:**
```typescript
telemetryService.trackComplianceBadgeClicked({
  tokenId: 'token-123',
  badgeType: 'Compliant',
  complianceStatus: 'compliant'
})
```

## Email Signup Events

### `email_signup_started`
Emitted when user initiates email-based signup flow.

**Properties:**
- `source` (string): Where the signup was initiated from
  - `'landing'`: From landing page
  - `'landing_entry_module'`: From the landing entry component
  - `'home'`: From home page

**Example:**
```typescript
telemetryService.trackEmailSignupStarted({ source: 'landing_entry_module' })
```

### `email_signup_completed`
Emitted when user successfully completes email signup.

**Properties:**
- `duration_ms` (number, optional): Time taken to complete signup

**Example:**
```typescript
telemetryService.trackEmailSignupCompleted({ durationMs: 45000 })
```

## Implementation Locations

### Components That Emit Events

1. **LandingEntryModule.vue**
   - `email_signup_started`
   - `onboarding_started`

2. **OnboardingChecklist.vue**
   - `onboarding_step_completed`
   - `onboarding_completed`

3. **DiscoveryDashboard.vue**
   - `discovery_dashboard_viewed`
   - `discovery_filter_applied`
   - `discovery_filter_saved`

4. **DiscoveryTokenCard.vue**
   - `token_detail_viewed`
   - `watchlist_add`
   - `watchlist_remove`
   - `compliance_badge_clicked`

5. **Home.vue**
   - `email_signup_started`

## Best Practices

1. **Always include source**: When an event can be triggered from multiple places, include a `source` parameter
2. **Be specific**: Use descriptive values that make it easy to understand user behavior
3. **Include context**: Add relevant metadata that helps analyze the event later
4. **Consistent naming**: Use snake_case for event names and properties
5. **Document changes**: Update this file when adding new events

## Future Enhancements

Consider adding these events in future iterations:

- `filter_preset_created`: When user saves a custom filter preset
- `token_comparison_started`: When user compares multiple tokens
- `compliance_report_downloaded`: When user exports compliance data
- `onboarding_abandoned`: Track where users drop off in onboarding
- `feature_discovery`: Track which features users discover and use
