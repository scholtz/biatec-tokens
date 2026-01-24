# Compliance Dashboard Filters - UI Mockup Description

## Overview Layout

The compliance dashboard filters feature adds two new sections to the Wallet Dashboard, positioned between the "Network Status / Compliance Status" section and the "Wallet Info / Token Balance" section.

## Section 1: Compliance Dashboard Filters Panel

### Visual Appearance:
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔵 Compliance Filters                          [1 active] [▲]   │
│    Filter tokens by regulatory requirements                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ℹ️ Regulatory Impact: These filters help you identify tokens  │
│     that comply with MiCA (Markets in Crypto-Assets)           │
│     regulations and other jurisdiction requirements.           │
│     Whitelist-required tokens may restrict transfers to        │
│     approved addresses only.                                   │
│                                                                 │
│  🌐 Network                                                     │
│  [All Networks ▼]                                              │
│                                                                 │
│  🛡️ MICA Ready                          [All] [Yes] [No]       │
│     Meets EU MiCA regulatory standards                         │
│                                                                 │
│  🔒 Whitelist Required                  [All] [Required] [Not] │
│     Transfers restricted to approved addresses                 │
│                                                                 │
│  ✓ KYC Required                         [All] [Required] [Not] │
│     Know Your Customer verification needed                     │
│                                                                 │
│  📍 Jurisdiction Restricted             [All] [Restricted] [...] │
│     Geographic or regulatory restrictions                      │
│                                                                 │
│  🚫 Transfer Controls                   [All] [Controlled] [...] │
│     Freeze or clawback controls enabled                        │
│                                                                 │
│  [Clear All Filters]                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Color Scheme:
- **Panel Background**: Glass-effect with subtle transparency
- **Info Box**: Light blue background with blue border
- **MICA Ready**: Green icon and green "Yes" button when active
- **Whitelist Required**: Yellow icon and yellow "Required" button when active
- **KYC Required**: Blue icon and blue "Required" button when active
- **Jurisdiction Restricted**: Orange icon and orange "Restricted" button when active
- **Transfer Controls**: Red icon and red "Controlled" button when active
- **Active Filters Badge**: Blue badge showing count

### Interactive Elements:
- Each filter row has three button states:
  - **Gray (inactive)**: Not selected, shows "All"
  - **Colored (active)**: Selected, highlights in respective color
  - **Hover**: Slightly lighter shade
- Network dropdown: Standard select dropdown
- Collapse/Expand button (▲/▼): Toggles panel visibility
- Clear All Filters: Text button, only visible when filters are active

## Section 2: Compliance Metrics Summary

### Visual Appearance:
```
┌──────────┬──────────┬──────────┬──────────┐
│ 💼       │ ✅       │ 🛡️       │ 🔒       │
│ Total    │ Compliant│ MICA     │Restricted│
│ Assets   │ Assets   │ Ready    │ Assets   │
│          │          │          │          │
│   24     │    18    │    12    │     6    │
│          │  75% of  │ EU comp- │ Transfer │
│          │  total   │ liant    │ controls │
└──────────┴──────────┴──────────┴──────────┘

Network Breakdown                              🔗
┌───────────────────────────────────────────────┐
│ • VOI Network                     [14 assets] │
│                                               │
│   Compliant: 10        MICA Ready: 8         │
│   Whitelisted: 4       Restricted: 4         │
│                                               │
│   ████████████████░░░░ 71%                   │
└───────────────────────────────────────────────┘
┌───────────────────────────────────────────────┐
│ • Aramid Network                  [10 assets] │
│                                               │
│   Compliant: 8         MICA Ready: 4         │
│   Whitelisted: 3       Restricted: 2         │
│                                               │
│   ████████████████████ 80%                   │
└───────────────────────────────────────────────┘

⚠️  Transfer Impact: 6 asset(s) have whitelist 
   requirements or jurisdiction restrictions. 
   Transfers may be blocked for non-whitelisted 
   addresses. Ensure recipients are verified 
   before initiating transfers.
```

### Color Scheme:
- **Total Assets Card**: Blue icon/accent
- **Compliant Assets Card**: Green icon/number
- **MICA Ready Card**: Purple icon/number
- **Restricted Assets Card**: Orange icon/number
- **Network Indicators**: 
  - VOI: Blue dot
  - Aramid: Purple dot
- **Progress Bars**: Gradient from green to blue
- **Transfer Impact Warning**: Yellow background with orange icon

### Layout:
- **4-column grid** on desktop (lg breakpoints)
- **2-column grid** on tablet (md breakpoints)
- **1-column stack** on mobile
- Cards have subtle hover effect (slight lift)
- Network breakdown collapses on mobile

## Section 3: Token Balance Panel (Modified)

### Visual Appearance:
```
┌─────────────────────────────────────────────────────────────────┐
│ Token Holdings                                          [🔄]    │
│ 🔵 1 filter(s) active  |  Showing 18 of 24 assets             │
├─────────────────────────────────────────────────────────────────┤
│ [🔍 Search assets...                                          ] │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Real Estate Token (RET)                      [ARC3]  125.50 │ │
│ │ ID: 12345 • RET                                             │ │
│ │ 🛡️ MICA Ready  🔒 Whitelist  ✓ KYC                          │ │
│ │ Total Supply: 1,000,000  Decimals: 2                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Security Token (SEC)                         [ARC3]   50.00 │ │
│ │ ID: 67890 • SEC                                             │ │
│ │ 🛡️ MICA Ready  🔒 Whitelist  ✓ KYC  📍 Restricted          │ │
│ │ Total Supply: 500,000  Decimals: 2                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [... more filtered assets ...]                                │
└─────────────────────────────────────────────────────────────────┘
```

### Changes:
- **New**: Filter indicator badge at top showing count
- **New**: "Showing X of Y assets" counter
- **Enhanced**: Compliance badges more prominent
- **Interactive**: Clicking asset shows details (existing behavior)

## Responsive Behavior

### Desktop (lg: 1024px+):
- 4-column metrics grid
- Side-by-side network breakdown (2 columns)
- Full filter panel width
- All filters visible

### Tablet (md: 768px - 1023px):
- 2-column metrics grid
- Stacked network breakdown (1 column)
- Full filter panel width
- All filters visible

### Mobile (< 768px):
- 1-column metrics grid (stacked cards)
- Stacked network breakdown
- Filter panel may be collapsed by default
- Buttons wrap to multiple rows if needed

## Animation and Transitions

1. **Filter Panel Expand/Collapse**: Smooth height transition (0.3s)
2. **Metric Cards**: Fade in on load with slight slide up
3. **Token List Update**: Brief fade effect when filters change
4. **Button States**: Quick color transition (0.2s)
5. **Progress Bars**: Animated fill on load

## Accessibility Features

- **Icons + Text**: All filters have both icon and text labels
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Tab through all interactive elements
- **Focus Indicators**: Clear blue outline on focused elements
- **Color + Shape**: Not relying on color alone (icons + text)
- **High Contrast**: Dark mode support with appropriate contrasts

## Dark Mode Appearance

All components automatically adapt to dark mode:
- **Glass effect**: Darker with higher transparency
- **Text**: White/light gray instead of dark gray
- **Borders**: Subtle white/gray borders
- **Cards**: Dark background with slight transparency
- **Buttons**: Darker background, same accent colors
- **Icons**: Lighter/brighter versions

## User Interaction Flow Examples

### Example 1: Filter for MICA-compliant VOI tokens
1. User expands filter panel (if collapsed)
2. Clicks "VOI Network" in network dropdown
3. Clicks "Yes" in MICA Ready filter
4. Metrics update to show: "8 MICA Ready assets on VOI"
5. Token list filters to show only 8 matching assets
6. Badge shows "2 filter(s) active"

### Example 2: View all unrestricted tokens
1. User clicks "Not Required" in Whitelist filter
2. Clicks "Unrestricted" in Jurisdiction filter
3. Clicks "Unrestricted" in Transfer Controls
4. Metrics show only fully unrestricted tokens
5. Transfer impact warning disappears (no restricted assets)
6. Badge shows "3 filter(s) active"

### Example 3: Clear all filters
1. User has multiple filters active
2. Clicks "Clear All Filters" button
3. All filter buttons reset to "All"
4. Network dropdown resets to "All Networks"
5. Metrics and token list show all assets
6. Badge disappears

## Integration Points

The feature integrates with existing components:
- **WalletDashboard.vue**: Main container
- **TokenBalancePanel.vue**: Receives filtered list
- **ComplianceBadge.vue**: Displays per-token compliance flags
- **useWalletManager**: Gets network info
- **useTokenBalance**: Gets asset list
- **useTokenMetadata**: Gets compliance flags

## Technical Notes

- Filters update immediately (no "Apply" button needed)
- Filter state persists in localStorage
- Metrics recalculate reactively
- Token list uses Vue's computed properties for efficient filtering
- Network detection uses networkInfo.displayName
