# ARC-200 MICA Compliance Testing Guide

## Overview

This document describes the testing strategy and test cases for the ARC-200 token issuance with MICA compliance metadata feature.

## Test Coverage

### Unit Tests

**Location**: `src/components/__tests__/MicaComplianceForm.test.ts`

**Framework**: Vitest + Vue Test Utils

**Coverage**: 23 test cases covering:

1. **Component Rendering**
   - Renders with proper heading
   - Shows required badge when required
   - Shows enable/disable toggle when optional
   - Auto-enables when required

2. **Form Fields**
   - All required fields present
   - All optional fields present
   - Correct input types

3. **Validation Logic**
   - Required field validation
   - Email format validation
   - Token purpose minimum length (50 characters)
   - Success state when all fields valid

4. **Token Classification Guidance**
   - Utility token guidance
   - E-money token guidance
   - Asset-referenced token guidance

5. **Data Emission**
   - Emits modelValue updates
   - Emits enabled state changes
   - Emits valid state changes

6. **Restricted Jurisdictions**
   - Parses comma-separated codes
   - Converts to uppercase
   - Filters empty entries

7. **Prop Initialization**
   - Initializes with provided data

8. **UI Elements**
   - Jurisdiction dropdown options
   - KYC checkbox toggle

#### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run only MICA compliance tests
npm test -- src/components/__tests__/MicaComplianceForm.test.ts

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

#### Expected Results

All 23 tests should pass:
- ✅ Component rendering tests
- ✅ Form field tests
- ✅ Validation logic tests
- ✅ Data emission tests
- ✅ Jurisdiction handling tests

### E2E Tests

**Location**: `e2e/arc200-mica-compliance.spec.ts`

**Framework**: Playwright

**Coverage**: 8 test scenarios covering:

1. **MICA Compliance Form Display**
   - Form appears for ARC-200 tokens
   - Shows "Required for ARC-200" badge
   - All fields visible

2. **Required Field Validation**
   - Shows validation errors for empty required fields
   - Lists all missing required information

3. **Complete Token Creation Flow**
   - Fill basic token information
   - Fill all MICA compliance fields
   - Validation passes with success message

4. **Classification Guidance Display**
   - Utility token guidance shown
   - E-money token guidance shown
   - Asset-referenced token guidance shown

5. **Email Format Validation**
   - Rejects invalid email formats
   - Accepts valid email formats
   - Shows appropriate error messages

6. **Token Purpose Length Validation**
   - Rejects purposes under 50 characters
   - Accepts purposes 50+ characters
   - Shows validation error and success appropriately

7. **Optional Field Handling**
   - Regulatory license field
   - Restricted jurisdictions field
   - Whitepaper URL field
   - Terms & Conditions URL field
   - KYC checkbox

8. **Non-ARC-200 Token Behavior**
   - MICA compliance not required for other standards
   - Form remains optional for non-ARC-200

#### Running E2E Tests

```bash
# Install Playwright browsers (one-time setup)
npx playwright install --with-deps chromium

# Run all E2E tests
npm run test:e2e

# Run only ARC-200 MICA tests
npm run test:e2e -- e2e/arc200-mica-compliance.spec.ts

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

#### Expected Results

All 8 E2E tests should pass:
- ✅ MICA form displays for ARC-200
- ✅ Required field validation works
- ✅ Complete flow can be executed
- ✅ Classification guidance displays
- ✅ Email validation works
- ✅ Token purpose validation works
- ✅ Optional fields work correctly
- ✅ Non-ARC-200 tokens unaffected

### Integration Testing

The feature integrates with:

1. **Token Store** (`stores/tokens.ts`)
   - Token interface extended with `complianceMetadata`
   - Create token action accepts compliance data

2. **TokenCreator View** (`views/TokenCreator.vue`)
   - MicaComplianceForm component integrated
   - Validation before deployment
   - Form reset on successful creation

3. **TokenDetail View** (`views/TokenDetail.vue`)
   - Compliance metadata display section
   - Conditional rendering for ARC-200 tokens
   - External link handling

4. **API Types** (`types/api.ts`)
   - MicaComplianceMetadata interface
   - ARC200DeploymentRequest extended
   - Type guards for validation

## Manual Testing Checklist

### Prerequisites
- Local development server running
- No wallet connection required (validation only)

### Test Scenarios

#### Scenario 1: ARC-200 Token with Full MICA Compliance

1. Navigate to `/creator`
2. Select VOI or Aramid network
3. Select ARC-200 token standard
4. Verify MICA compliance form appears with "Required" badge
5. Fill all required fields:
   - Issuer Legal Name: "Test Company Ltd."
   - Registration Number: "12345678"
   - Jurisdiction: "European Union"
   - Token Classification: "Utility Token"
   - Token Purpose: (minimum 50 characters)
   - Compliance Email: "compliance@test.com"
6. Verify success message: "All required MICA compliance fields are complete"
7. Fill optional fields:
   - Regulatory License
   - Restricted Jurisdictions (e.g., "US, CN")
   - Whitepaper URL
   - Terms & Conditions URL
   - Check KYC checkbox
8. Verify form remains valid

**Expected**: Form validates successfully, ready for deployment

#### Scenario 2: Validation Error Handling

1. Navigate to `/creator`
2. Select ARC-200 standard
3. Leave all MICA fields empty
4. Verify validation errors appear:
   - "Issuer legal name is required"
   - "Registration number is required"
   - "Jurisdiction is required"
   - "Token purpose is required"
   - "Compliance contact email is required"
5. Enter invalid email (e.g., "not-an-email")
6. Verify "Invalid email format" error
7. Enter token purpose < 50 characters
8. Verify "Token purpose must be at least 50 characters" error

**Expected**: All validation errors display correctly

#### Scenario 3: Classification Guidance

1. Navigate to `/creator`
2. Select ARC-200 standard
3. Select "Utility Token" classification
4. Verify guidance: "Provides access to goods or services..."
5. Select "E-Money Token" classification
6. Verify guidance: "Requires e-money authorization..."
7. Select "Asset-Referenced Token" classification
8. Verify guidance: "Requires prospectus approval..."

**Expected**: Appropriate guidance displays for each classification

#### Scenario 4: Non-ARC-200 Token (No MICA Required)

1. Navigate to `/creator`
2. Select ASA or ARC-3 standard (not ARC-200)
3. Verify MICA compliance form shows "Disabled" toggle (not required)
4. Optionally enable MICA compliance
5. Verify form works but is not required

**Expected**: MICA compliance is optional for non-ARC-200 tokens

#### Scenario 5: Token Detail View with MICA Metadata

1. Create an ARC-200 token with MICA compliance (or use mock data)
2. Navigate to token detail page
3. Verify "MICA Compliance Metadata" section displays
4. Verify all fields display correctly:
   - Issuer information
   - Token classification with badge
   - Restricted jurisdictions (if any)
   - Contact & documentation links
5. Click external links (whitepaper, terms)
6. Verify links open in new tab

**Expected**: All MICA metadata displays correctly and links work

## Continuous Integration

### GitHub Actions

The CI pipeline should run:

1. **Lint**: Code style checks
2. **Build**: TypeScript compilation
3. **Unit Tests**: All Vitest tests
4. **E2E Tests**: Playwright tests
5. **Type Check**: TypeScript type checking

### CI Configuration

```yaml
- name: Run unit tests
  run: npm test

- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e
```

## Known Limitations

1. **E2E Browser Download**: Playwright browser downloads may be blocked in some CI environments
   - Workaround: Use pre-installed browsers or skip E2E in restricted environments

2. **Network Restrictions**: Some testing environments block external CDN access
   - Workaround: Cache Playwright browsers or use Docker with pre-installed browsers

3. **Wallet Integration**: Full deployment testing requires wallet connection
   - Current tests validate form completion only, not actual blockchain deployment

## Future Test Enhancements

1. **API Integration Tests**
   - Mock backend API responses
   - Test deployment request formatting
   - Verify error handling

2. **Accessibility Tests**
   - Screen reader compatibility
   - Keyboard navigation
   - ARIA labels

3. **Performance Tests**
   - Form rendering performance
   - Validation computation time
   - Large form data handling

4. **Cross-Browser Tests**
   - Firefox compatibility
   - Safari compatibility
   - Mobile browsers

5. **Visual Regression Tests**
   - Screenshot comparison
   - CSS consistency
   - Responsive design validation

## Debugging Tests

### Unit Test Debugging

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run single test file
npm test -- src/components/__tests__/MicaComplianceForm.test.ts

# Run with debugger
node --inspect-brk node_modules/.bin/vitest
```

### E2E Test Debugging

```bash
# Run in debug mode (pause on first test)
npm run test:e2e:debug

# Generate trace on failure
npm run test:e2e -- --trace on

# View test report
npm run test:e2e:report
```

## Test Data

### Valid MICA Compliance Data

```typescript
{
  issuerLegalName: "Acme Token Solutions Ltd.",
  issuerRegistrationNumber: "12345678",
  issuerJurisdiction: "EU",
  regulatoryLicense: "FCA-123456",
  micaTokenClassification: "utility",
  tokenPurpose: "This token provides access to premium features within the Acme platform ecosystem, including advanced analytics, priority support, and exclusive content.",
  kycRequired: true,
  restrictedJurisdictions: ["US", "CN", "KP"],
  complianceContactEmail: "compliance@acme.com",
  whitepaperUrl: "https://acme.com/whitepaper.pdf",
  termsAndConditionsUrl: "https://acme.com/terms"
}
```

### Invalid Test Cases

```typescript
// Missing required fields
{ issuerLegalName: "" } // Should fail

// Invalid email
{ complianceContactEmail: "not-an-email" } // Should fail

// Token purpose too short
{ tokenPurpose: "Too short" } // Should fail (< 50 chars)

// Invalid URL format
{ whitepaperUrl: "not-a-url" } // Should fail
```

## Conclusion

The ARC-200 MICA compliance feature has comprehensive test coverage across unit and E2E tests. All tests validate the core functionality, edge cases, and user workflows to ensure regulatory compliance requirements are properly enforced.

For questions or issues with testing, please refer to:
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [Vue Test Utils Documentation](https://test-utils.vuejs.org)
