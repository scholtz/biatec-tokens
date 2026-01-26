# ARC-200 MICA Compliance Feature

## Quick Overview

This feature enables ARC-200 token issuers to include comprehensive MICA (Markets in Crypto-Assets) compliance metadata at token deployment time, ensuring regulatory transparency and audit trail capabilities.

## Documentation Index

1. **[ARC200_MICA_COMPLIANCE.md](./ARC200_MICA_COMPLIANCE.md)** - Complete feature documentation
   - Business rationale and use cases
   - Implementation details
   - Risk considerations
   - Best practices
   - Future enhancements

2. **[ARC200_MICA_TESTING.md](./ARC200_MICA_TESTING.md)** - Testing guide
   - Unit test coverage (23 tests)
   - E2E test scenarios (8 tests)
   - Manual testing checklist
   - CI/CD integration
   - Debugging tips

## Quick Start

### For Token Issuers

1. Navigate to the Token Creator at `/creator`
2. Select **VOI** or **Aramid** network
3. Choose **ARC-200** token standard
4. Complete the MICA Compliance form (required):
   - Issuer information
   - Token classification
   - Compliance contacts
   - Optional: regulatory licenses, jurisdiction restrictions

### For Developers

```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Run E2E tests (requires Playwright setup)
npx playwright install --with-deps chromium
npm run test:e2e -- e2e/arc200-mica-compliance.spec.ts

# Start dev server
npm run dev
```

## Feature Highlights

### ✅ Comprehensive Compliance Metadata
- Issuer legal information
- Registration numbers and jurisdictions
- Regulatory licenses
- Token classification (utility, e-money, asset-referenced)
- KYC/AML requirements
- Jurisdiction restrictions

### ✅ Smart Validation
- Real-time field validation
- Email format checking
- Minimum character requirements
- Required field enforcement for ARC-200

### ✅ Classification Guidance
- Context-aware help text
- Regulatory requirement explanations
- Best practice recommendations

### ✅ Audit-Ready Display
- Dedicated compliance section in token details
- All metadata visible and verifiable
- External documentation links
- Professional presentation

## Key Files

### Components
- `src/components/MicaComplianceForm.vue` - Main compliance form
- `src/components/__tests__/MicaComplianceForm.test.ts` - Unit tests

### Views
- `src/views/TokenCreator.vue` - Token creation wizard (integrated)
- `src/views/TokenDetail.vue` - Token detail page (displays metadata)

### Types
- `src/types/api.ts` - MicaComplianceMetadata interface
- `src/stores/tokens.ts` - Token store with compliance support

### Tests
- `e2e/arc200-mica-compliance.spec.ts` - End-to-end tests

### Documentation
- `docs/ARC200_MICA_COMPLIANCE.md` - Feature documentation
- `docs/ARC200_MICA_TESTING.md` - Testing guide
- `docs/README_ARC200_MICA.md` - This file

## MICA Compliance Fields

### Required Fields
- **Issuer Legal Name**: Full legal entity name
- **Registration Number**: Company registration identifier
- **Jurisdiction**: Legal jurisdiction (EU, US, GB, SG, CH, JP, AE, etc.)
- **Token Classification**: Utility, e-money, asset-referenced, or other
- **Token Purpose**: Minimum 50 characters describing token utility
- **Compliance Email**: Valid email for regulatory inquiries

### Optional Fields
- **Regulatory License**: Financial services license number
- **Restricted Jurisdictions**: ISO country codes (e.g., US, CN, KP)
- **KYC Required**: Boolean flag for holder identity verification
- **Whitepaper URL**: Link to detailed token documentation
- **Terms & Conditions URL**: Link to legal terms

## Integration Points

### Token Creation Flow
1. Network selection → ARC-200 standard selection
2. MICA compliance form (required for ARC-200)
3. Validation before deployment
4. Metadata included in token creation request

### Token Detail View
- Compliance metadata section for ARC-200 tokens
- Issuer information display
- Classification badges
- Documentation links
- Contact information

## Testing Strategy

### Unit Tests (Vitest)
- 23 test cases
- Component rendering
- Validation logic
- Data emission
- Edge cases

### E2E Tests (Playwright)
- 8 test scenarios
- Full user workflows
- Form validation
- Error handling
- Cross-standard compatibility

### Manual Testing
- Network selection flow
- Complete form submission
- Validation error handling
- Token detail display
- External link navigation

## Validation Rules

1. **Issuer Legal Name**: Non-empty string
2. **Registration Number**: Non-empty string
3. **Jurisdiction**: Must select from dropdown
4. **Token Classification**: Must select valid option
5. **Token Purpose**: Minimum 50 characters
6. **Compliance Email**: Valid email format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
7. **URLs**: Optional but must be valid URL format if provided
8. **Restricted Jurisdictions**: ISO codes, comma-separated, auto-uppercase

## Security Considerations

- All data client-side validated
- No sensitive data stored in local storage
- External links open in new tab with `rel="noopener noreferrer"`
- Email addresses visible on-chain (not private)
- Consider data minimization principles

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ required
- Vue 3 with Composition API
- Tested with latest Playwright browsers

## Accessibility

- Semantic HTML structure
- ARIA labels on form inputs
- Keyboard navigation support
- Screen reader friendly
- High contrast text
- Focus indicators

## Performance

- Lazy validation (on input change)
- Efficient re-renders with Vue reactivity
- No heavy computations
- Minimal bundle size impact
- Optimized component imports

## Maintenance Notes

### Adding New Classification Types
1. Update `micaTokenClassification` type in `types/api.ts`
2. Add option to select dropdown in `MicaComplianceForm.vue`
3. Add guidance text in `getClassificationGuidance()` function
4. Update tests to cover new type

### Adding New Required Fields
1. Add field to `MicaComplianceMetadata` interface
2. Add input to `MicaComplianceForm.vue` template
3. Add validation in `validationErrors` computed
4. Update tests
5. Update documentation

### Updating Validation Rules
1. Modify `validationErrors` computed in `MicaComplianceForm.vue`
2. Update corresponding tests
3. Document changes in changelog

## Support & Resources

### External Resources
- [MICA Regulation (EUR-Lex)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1114)
- [ESMA Crypto-Assets Portal](https://www.esma.europa.eu/policy-activities/crypto-assets)
- [Algorand Developer Portal](https://developer.algorand.org)
- [VOI Network](https://voi.network)

### Internal Resources
- Product Owner: Reference product requirements
- Legal Team: Consult for classification guidance
- Compliance Team: Verify regulatory alignment
- Engineering Team: Technical implementation support

## Changelog

### Version 1.0.0 (2026-01-26)
- Initial release
- Full MICA compliance metadata support for ARC-200
- Comprehensive validation and guidance
- Unit and E2E test coverage
- Documentation complete

## Future Roadmap

- [ ] Multi-jurisdiction regulatory framework support
- [ ] Template library for common token types
- [ ] Automated regulatory reporting
- [ ] Smart contract enforcement of compliance rules
- [ ] Third-party audit API integration
- [ ] Compliance score calculation
- [ ] Historical metadata version tracking

## Contributing

For contributions to this feature:
1. Read [CONTRIBUTING.md](../CONTRIBUTING.md)
2. Review implementation details in feature docs
3. Add/update tests for any changes
4. Update documentation accordingly
5. Follow existing code patterns

## License

See [LICENSE](../LICENSE) for project licensing information.

## Disclaimer

This feature provides tools for regulatory compliance but does not constitute legal advice. Token issuers should consult qualified legal counsel to ensure compliance with applicable laws and regulations.
