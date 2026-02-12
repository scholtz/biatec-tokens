# Wallet Compatibility Matrix

## Overview

This document provides comprehensive information about how popular Algorand wallets display and interact with different token standards (ARC-3, ARC-19, ARC-69, and ASA). Understanding wallet behavior is crucial for token issuers to ensure their tokens display correctly and provide a good user experience across the ecosystem.

**Last Updated:** February 12, 2026

## Quick Reference

| Wallet | ARC-3 | ARC-19 | ARC-69 | ASA |
|--------|-------|--------|--------|-----|
| Pera Wallet | ✅ Excellent | ✅ Excellent | ✅ Good | ✅ Good |
| Defly Wallet | ✅ Excellent | ✅ Good | ✅ Good | ✅ Good |
| Lute Wallet | ✅ Good | ⚠️ Partial | ⚠️ Partial | ✅ Good |
| Exodus Wallet | ❌ Poor | ❌ Poor | ❌ Poor | ✅ Good |

## Token Standard Recommendations

### When to Use Each Standard

#### ARC-3 (Algorand Standard Asset with External Metadata)
**Best For:** NFTs with rich metadata, tokens requiring external images/media

**Wallet Support:** Excellent (Pera, Defly), Good (Lute)

**Key Requirements:**
- URL ending in #arc3
- Valid JSON metadata at URL
- HTTPS or IPFS URL scheme

#### ARC-19 (Mutable NFT Metadata)
**Best For:** Dynamic NFTs, game assets, membership tokens

**Wallet Support:** Excellent (Pera), Good (Defly), Partial (Lute)

**Key Requirements:**
- template-ipfs:// URL format
- Reserve address set

#### ARC-69 (On-Chain Metadata)
**Best For:** Simple tokens with limited metadata

**Wallet Support:** Good (Pera, Defly), Partial (Lute)

**Key Requirements:**
- Valid JSON in transaction note
- Maximum 1024 bytes

## Best Practices

1. **Use ARC-3 for Best Coverage** - Supported by all major wallets
2. **Host Metadata on HTTPS** - Faster loading than IPFS
3. **Keep Names Short** - Token name ≤50 chars, unit name ≤10 chars
4. **Test in Multiple Wallets** - Always test in Pera, Defly, and Lute

## Additional Resources

- **Algorand ARCs**: https://github.com/algorandfoundation/ARCs
- **Biatec Tokens Platform**: https://github.com/scholtz/biatec-tokens

For detailed information, see the full compatibility matrix in the Biatec Tokens wizard.
