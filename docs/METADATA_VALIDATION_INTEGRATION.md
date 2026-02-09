# Token Metadata Validation System - Integration Guide

## Overview

This guide explains how to integrate the token metadata validation system into your token display views. The system provides:

1. **Metadata Validation**: Validates token metadata against ARC3, ARC69, and ARC19 standards
2. **Quality Scoring**: Assigns a 0-100 quality score based on metadata completeness
3. **UI Components**: Pre-built components for displaying validation status and details
4. **Normalized Display**: Consistent metadata display with proper fallbacks

## Quick Start

### 1. Basic Integration in Token Detail View

```vue
<template>
  <div>
    <!-- Display validation status badge -->
    <MetadataStatusBadge 
      :validation-result="validationResult"
      :loading="loading"
      :show-score="true"
    />

    <!-- Display detailed validation panel -->
    <MetadataValidationPanel 
      :validation-result="validationResult"
      :loading="loading"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTokenMetadata } from '@/composables/useTokenMetadata'
import { validateTokenMetadata, normalizeMetadata, determineTokenStandard } from '@/utils/metadataValidation'
import MetadataStatusBadge from '@/components/MetadataStatusBadge.vue'
import MetadataValidationPanel from '@/components/MetadataValidationPanel.vue'

const props = defineProps<{ assetId: number }>()

const loading = ref(true)
const validationResult = ref(null)
const normalizedMetadata = ref(null)

onMounted(async () => {
  const { fetchMetadata } = useTokenMetadata()
  
  try {
    // Fetch asset metadata
    const assetMetadata = await fetchMetadata(props.assetId)
    
    // Determine standard
    const standard = determineTokenStandard(assetMetadata.url, !!assetMetadata.arc3)
    
    // Validate metadata
    validationResult.value = validateTokenMetadata(
      standard,
      assetMetadata.url,
      assetMetadata.arc3
    )
    
    // Normalize for display
    normalizedMetadata.value = normalizeMetadata(
      standard,
      assetMetadata,
      assetMetadata.arc3
    )
  } finally {
    loading.value = false
  }
})
</script>
```

### 2. Using the Validated Token Metadata Composable

For a more structured approach, use the `useValidatedTokenMetadata` composable:

```vue
<script setup lang="ts">
import { useValidatedTokenMetadata } from '@/composables/useValidatedTokenMetadata'
import { useTokenMetadata } from '@/composables/useTokenMetadata'

const { fetchMetadata } = useTokenMetadata()
const { getValidatedMetadata, hasCriticalIssues, getIssueCounts } = useValidatedTokenMetadata()

const assetId = 123456

// Fetch and validate
const assetMetadata = await fetchMetadata(assetId)
const validated = getValidatedMetadata(assetMetadata)

// Check validation status
if (hasCriticalIssues(validated?.validation)) {
  console.warn('Token has critical metadata issues')
}

// Get issue counts
const counts = getIssueCounts(validated?.validation)
console.log(`Errors: ${counts.errors}, Warnings: ${counts.warnings}, Info: ${counts.info}`)
</script>
```

## Component Reference

### MetadataStatusBadge

Displays a compact badge showing validation status with color-coded quality indicator.

**Props:**
- `validationResult: MetadataValidationResult | null` - The validation result
- `loading?: boolean` - Show loading state (default: false)
- `showScore?: boolean` - Display quality score (default: true)
- `size?: 'sm' | 'md' | 'lg'` - Badge size (default: 'md')

**Features:**
- Color-coded by quality score (green ≥90, yellow ≥70, orange ≥50, red <50)
- Displays standard (ARC3, ARC69, ARC19, ASA)
- Shows validation status (Valid, Good, Fair, Poor, Issues)
- Includes tooltip with validation summary
- Animated loading state

**Usage:**
```vue
<MetadataStatusBadge 
  :validation-result="result"
  :show-score="true"
  size="md"
/>
```

### MetadataValidationPanel

Displays detailed validation results with passed checks and issues.

**Props:**
- `validationResult: MetadataValidationResult | null` - The validation result
- `loading?: boolean` - Show loading state (default: false)

**Features:**
- Overall status with quality score
- List of passed checks with green styling
- List of issues categorized by severity (error, warning, info)
- Color-coded issue borders (red for errors, yellow for warnings, blue for info)
- Standard information with documentation links
- Responsive layout

**Usage:**
```vue
<MetadataValidationPanel 
  :validation-result="result"
  :loading="false"
/>
```

## Validation API Reference

### validateTokenMetadata()

Validates token metadata based on detected standard.

```typescript
function validateTokenMetadata(
  standard: MetadataStandard,
  assetUrl: string | undefined,
  arc3Metadata: ARC3Metadata | null | undefined,
  arc69Metadata?: any
): MetadataValidationResult
```

**Returns:**
```typescript
interface MetadataValidationResult {
  isValid: boolean        // No errors
  standard: MetadataStandard  // ARC3, ARC69, ARC19, or ASA
  score: number          // 0-100 quality score
  issues: ValidationIssue[]  // Array of issues found
  passedChecks: string[] // Array of passed check descriptions
  summary: string        // Human-readable summary
}
```

**Quality Score Calculation:**
- Base score: 100
- Each error: -20 points
- Each warning: -10 points
- Each info: -5 points
- Minimum: 0, Maximum: 100

### normalizeMetadata()

Normalizes metadata fields for consistent display with proper fallbacks.

```typescript
function normalizeMetadata(
  standard: MetadataStandard,
  assetParams: any,
  arc3Metadata: ARC3Metadata | null | undefined
): NormalizedMetadata
```

**Returns:**
```typescript
interface NormalizedMetadata {
  title: string              // Name with fallback
  description: string        // Description with fallback to empty
  imageUrl: string | null    // Resolved IPFS/HTTP URL or null
  imageResolved: boolean     // Whether image URL was successfully resolved
  externalUrl: string | null // Resolved external URL or null
  properties: Record<string, any>  // Metadata properties
  creator: string            // Creator address
  supply: string             // Total supply as string
  decimals: number           // Number of decimals
  unitName: string           // Asset unit name
  standard: MetadataStandard // Detected standard
}
```

### URL Utilities

**validateUrl()** - Validates URL format
```typescript
function validateUrl(url: string): boolean
```

**resolveIpfsUrl()** - Resolves IPFS URLs to HTTP gateway
```typescript
function resolveIpfsUrl(url: string, gateway?: string): string
```

**normalizeMetadataUrl()** - Normalizes various URL formats
```typescript
function normalizeMetadataUrl(url: string | undefined): string | null
```

## Display Patterns

### 1. Token Card with Status Badge

```vue
<div class="token-card">
  <div class="flex justify-between items-start mb-4">
    <h3>{{ token.name }}</h3>
    <MetadataStatusBadge 
      :validation-result="validation" 
      :show-score="false"
      size="sm"
    />
  </div>
  <!-- Rest of card content -->
</div>
```

### 2. Token Detail with Full Validation

```vue
<div class="token-detail">
  <!-- Header with status -->
  <div class="header">
    <h1>{{ normalizedMetadata.title }}</h1>
    <MetadataStatusBadge 
      :validation-result="validation"
      :show-score="true"
    />
  </div>

  <!-- Validation details -->
  <MetadataValidationPanel 
    :validation-result="validation"
  />

  <!-- Metadata display -->
  <div class="metadata-grid">
    <div class="image-section">
      <img 
        v-if="normalizedMetadata.imageUrl && normalizedMetadata.imageResolved"
        :src="normalizedMetadata.imageUrl"
        @error="handleImageError"
      />
      <div v-else class="fallback-image">
        <i class="pi pi-image"></i>
      </div>
    </div>
    <!-- More metadata fields -->
  </div>
</div>
```

### 3. Image Handling with Fallback

```vue
<template>
  <div class="image-container">
    <img 
      v-if="imageUrl && !imageError"
      :src="imageUrl"
      @error="imageError = true"
    />
    <div v-else class="fallback">
      <i class="pi pi-image"></i>
      <p>Image not available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const imageError = ref(false)
</script>
```

## Validation Standards

### ARC3 (Algorand Request for Comments #3)

**Required Fields:**
- `name` - Token name

**Recommended Fields:**
- `description` - Token description
- `image` - Image URL (must be valid http://, https://, or ipfs://)
- `image_integrity` - Image integrity hash for verification
- `image_mimetype` - Image MIME type (e.g., image/png)
- `external_url` - External project URL
- `decimals` - Number of decimals (0-19)

**URL Format:**
- Must end with `#arc3`
- Example: `ipfs://Qm...#arc3`

### ARC69 (Algorand Request for Comments #69)

**Characteristics:**
- Metadata stored in transaction note field
- Fully on-chain

**Recommended Fields:**
- `standard: "arc69"` - Standard identifier
- `description` - Token description
- `external_url` - External project URL
- `media_url` - Media URL
- `properties` - Object with token properties

### ARC19 (Algorand Request for Comments #19)

**Characteristics:**
- Dynamic NFT metadata with templated URLs
- Uses `{id}` placeholder for asset ID

**Required Fields:**
- URL must start with `template-ipfs://`
- URL should contain `{id}` placeholder

**Example:**
- `template-ipfs://QmAbc.../{id}/metadata.json`

### ASA (Standard Algorand Standard Asset)

**Characteristics:**
- Basic on-chain properties only
- No extended metadata standard
- Minimal validation requirements

## Best Practices

1. **Always check validation result before displaying metadata**
   ```typescript
   if (validation?.isValid) {
     // Display with confidence
   } else {
     // Show warnings or errors
   }
   ```

2. **Use normalized metadata for display**
   - Provides consistent field names
   - Includes proper fallbacks
   - Resolves IPFS URLs automatically

3. **Handle image loading errors**
   ```vue
   <img 
     :src="imageUrl" 
     @error="handleImageError"
   />
   ```

4. **Show validation status prominently**
   - Use MetadataStatusBadge in token cards
   - Include full validation panel in detail views

5. **Provide context about standards**
   - Link to official documentation
   - Explain what each standard means

6. **Cache validation results**
   - Validation is synchronous but normalization may trigger fetches
   - Use composable caching for performance

## Testing

See test files for comprehensive examples:
- `src/utils/__tests__/metadataValidation.test.ts` - 61 validation tests
- `src/components/__tests__/MetadataStatusBadge.test.ts` - 24 component tests
- `src/components/__tests__/MetadataValidationPanel.test.ts` - 28 component tests

## Example Implementation

See `src/components/TokenMetadataDisplayExample.vue` for a complete working example showing:
- Metadata validation integration
- Normalized metadata display
- Image fallback handling
- Standard compliance display
- Properties/attributes display

## Support

For questions or issues:
1. Review the test files for usage examples
2. Check the example component
3. Refer to official ARC documentation:
   - [ARC3](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md)
   - [ARC69](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0069.md)
   - [ARC19](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0019.md)
