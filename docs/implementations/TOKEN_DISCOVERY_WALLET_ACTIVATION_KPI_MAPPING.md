# Token Discovery and Wallet Activation - KPI Instrumentation Mapping

**Date:** February 19, 2026  
**Issue:** Vision: Launch Token Discovery and Wallet Activation Journey with Measurable Conversion  
**Related Docs:** TOKEN_DISCOVERY_WALLET_ACTIVATION_IMPLEMENTATION_SUMMARY.md  
**Status:** Complete

---

## Executive Summary

This document defines the complete KPI instrumentation framework for measuring the business impact of the Token Discovery and Wallet Activation Journey. It provides exact event definitions, SQL queries for metric calculation, Grafana panel specifications, and success criteria aligned with product roadmap goals.

### Business Objectives

1. **Increase Discovery Engagement:** +40% users entering token discovery flow
2. **Improve Standards Understanding:** +60% completion rate for standards comparison
3. **Boost Wallet Activation:** +35% conversion rate for wallet connection
4. **Reduce Support Load:** -25% support tickets related to token creation confusion

---

## KPI Framework Overview

### North Star Metric

**Metric:** Token Creation Activation Rate  
**Definition:** Percentage of users who complete wallet activation and proceed to guided token creation within 7 days of discovery entry  
**Target:** 35% (up from baseline TBD)  
**Business Impact:** Direct indicator of user value realization and revenue potential

### Supporting Metrics (AARRR Framework)

| Category | Metric | Baseline | Target | Priority |
|----------|--------|----------|--------|----------|
| **Activation** | Discovery Entry Rate | TBD | +40% | P0 |
| **Activation** | Standards Comparison Completion | TBD | +60% | P0 |
| **Activation** | Wallet Activation Conversion | TBD | +35% | P0 |
| **Retention** | 7-Day Return Rate (post-activation) | TBD | 65% | P1 |
| **Revenue** | Free-to-Paid Conversion (activated users) | 25% | 40% | P1 |
| **Referral** | Support Ticket Reduction | TBD | -25% | P2 |

---

## Event Taxonomy

### Discovery Journey Events

#### 1. discovery_entry
**When:** User lands on `/discovery/journey` page  
**Purpose:** Track top-of-funnel engagement  
**Payload:**
```typescript
{
  event: 'discovery_entry',
  category: 'Discovery',
  action: 'Entry',
  label: 'journey_start',
  metadata: {
    referrer: string,           // Previous page URL
    authenticated: boolean,     // User auth status
    source: string             // Entry source (organic, campaign, etc.)
  },
  sessionId: string,
  timestamp: ISO8601
}
```

**SQL Query:**
```sql
SELECT 
  DATE_TRUNC('day', timestamp) AS date,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(*) AS total_entries,
  COUNT(DISTINCT CASE WHEN metadata->>'authenticated' = 'true' THEN session_id END) AS authenticated_sessions
FROM analytics_events
WHERE event = 'discovery_entry'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
```

**Grafana Panel:**
- Type: Time series
- Metric: Unique sessions per day
- Aggregation: SUM
- Breakdown: Authenticated vs Unauthenticated

---

#### 2. discovery_category_selected
**When:** User clicks on a category card (RWA, DeFi, NFT, Governance)  
**Purpose:** Measure category interest distribution  
**Payload:**
```typescript
{
  event: 'discovery_category_selected',
  category: 'Discovery',
  action: 'Category',
  label: string,              // Category ID (rwa, defi, nft, governance)
  metadata: {
    categoryId: string,
    categoryName: string,
    rwaRelevance: string      // high, medium, low
  },
  sessionId: string,
  timestamp: ISO8601
}
```

**SQL Query:**
```sql
SELECT 
  metadata->>'categoryId' AS category_id,
  metadata->>'categoryName' AS category_name,
  COUNT(DISTINCT session_id) AS unique_users,
  COUNT(*) AS total_selections,
  ROUND(100.0 * COUNT(DISTINCT session_id) / 
    (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE event = 'discovery_entry'), 2) AS selection_rate_pct
FROM analytics_events
WHERE event = 'discovery_category_selected'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY category_id, category_name
ORDER BY unique_users DESC;
```

**Grafana Panel:**
- Type: Pie chart
- Metric: Selection distribution by category
- Legend: Category name + percentage

---

#### 3. discovery_opportunity_selected
**When:** User clicks on an opportunity recommendation card  
**Purpose:** Measure telemetry-driven recommendation effectiveness  
**Payload:**
```typescript
{
  event: 'discovery_opportunity_selected',
  category: 'Discovery',
  action: 'Opportunity',
  label: string,              // Opportunity ID
  metadata: {
    opportunityId: string,
    standard: string,         // ARC1400, ARC200, etc.
    rwaScore: number,         // 0-100
    complianceScore: number   // 0-100
  },
  sessionId: string,
  timestamp: ISO8601
}
```

**SQL Query:**
```sql
SELECT 
  metadata->>'standard' AS standard,
  COUNT(DISTINCT session_id) AS unique_users,
  AVG((metadata->>'rwaScore')::numeric) AS avg_rwa_score,
  AVG((metadata->>'complianceScore')::numeric) AS avg_compliance_score
FROM analytics_events
WHERE event = 'discovery_opportunity_selected'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY standard
ORDER BY unique_users DESC;
```

**Grafana Panel:**
- Type: Bar chart
- Metric: Selections by standard
- Color: By RWA score (gradient)

---

#### 4. discovery_compare_cta
**When:** User clicks "Compare Standards" button  
**Purpose:** Measure discovery → comparison funnel progression  
**Payload:**
```typescript
{
  event: 'discovery_compare_cta',
  category: 'Discovery',
  action: 'CTA',
  label: 'compare_standards',
  metadata: {
    selectedCategory: string | null  // Category selected before CTA
  },
  sessionId: string,
  timestamp: ISO8601
}
```

**SQL Query:**
```sql
WITH discovery_entries AS (
  SELECT DISTINCT session_id, MIN(timestamp) AS entry_time
  FROM analytics_events
  WHERE event = 'discovery_entry'
    AND timestamp >= NOW() - INTERVAL '30 days'
  GROUP BY session_id
),
compare_cta_clicks AS (
  SELECT DISTINCT session_id, MIN(timestamp) AS click_time
  FROM analytics_events
  WHERE event = 'discovery_compare_cta'
    AND timestamp >= NOW() - INTERVAL '30 days'
  GROUP BY session_id
)
SELECT 
  COUNT(DISTINCT de.session_id) AS total_entries,
  COUNT(DISTINCT cc.session_id) AS compare_cta_clicks,
  ROUND(100.0 * COUNT(DISTINCT cc.session_id) / COUNT(DISTINCT de.session_id), 2) AS conversion_rate_pct,
  ROUND(AVG(EXTRACT(EPOCH FROM (cc.click_time - de.entry_time))), 2) AS avg_time_to_click_sec
FROM discovery_entries de
LEFT JOIN compare_cta_clicks cc ON de.session_id = cc.session_id;
```

**Grafana Panel:**
- Type: Stat
- Metric: Conversion rate (%)
- Threshold: Warning < 50%, Critical < 30%

---

#### 5. discovery_activation_cta
**When:** User clicks "Start Activation" button  
**Purpose:** Measure discovery → activation funnel progression  
**Payload:**
```typescript
{
  event: 'discovery_activation_cta',
  category: 'Discovery',
  action: 'CTA',
  label: 'start_activation',
  metadata: {
    selectedCategory: string | null,
    authenticated: boolean
  },
  sessionId: string,
  timestamp: ISO8601
}
```

**SQL Query:**
```sql
WITH discovery_entries AS (
  SELECT DISTINCT session_id, MIN(timestamp) AS entry_time
  FROM analytics_events
  WHERE event = 'discovery_entry'
    AND timestamp >= NOW() - INTERVAL '30 days'
  GROUP BY session_id
),
activation_cta_clicks AS (
  SELECT DISTINCT session_id, MIN(timestamp) AS click_time
  FROM analytics_events
  WHERE event = 'discovery_activation_cta'
    AND timestamp >= NOW() - INTERVAL '30 days'
  GROUP BY session_id
)
SELECT 
  COUNT(DISTINCT de.session_id) AS total_entries,
  COUNT(DISTINCT ac.session_id) AS activation_cta_clicks,
  ROUND(100.0 * COUNT(DISTINCT ac.session_id) / COUNT(DISTINCT de.session_id), 2) AS conversion_rate_pct
FROM discovery_entries de
LEFT JOIN activation_cta_clicks ac ON de.session_id = ac.session_id;
```

**Grafana Panel:**
- Type: Stat
- Metric: Activation CTA click rate (%)
- Target: ≥35%

---

### Wallet Activation Events

#### 6. wallet_activation_started
**When:** User lands on `/activation/wallet` page  
**Purpose:** Track activation funnel entry  
**Payload:**
```typescript
{
  event: 'wallet_activation_started',
  category: 'WalletActivation',
  action: 'Start',
  label: 'journey_entry',
  metadata: {
    authenticated: boolean,
    referrer: string
  },
  sessionId: string,
  timestamp: ISO8601
}
```

**SQL Query:**
```sql
SELECT 
  DATE_TRUNC('day', timestamp) AS date,
  COUNT(DISTINCT session_id) AS unique_sessions,
  COUNT(DISTINCT CASE WHEN metadata->>'authenticated' = 'true' THEN session_id END) AS authenticated_sessions
FROM analytics_events
WHERE event = 'wallet_activation_started'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;
```

**Grafana Panel:**
- Type: Time series
- Metric: Activation journey starts per day
- Breakdown: Authenticated vs Unauthenticated

---

#### 7. wallet_activation_step
**When:** User progresses to a new step in the activation flow (1-4)  
**Purpose:** Identify drop-off points in activation funnel  
**Payload:**
```typescript
{
  event: 'wallet_activation_step',
  category: 'WalletActivation',
  action: 'Step',
  label: string,              // step_1, step_2, step_3, step_4
  metadata: {
    step: number              // 1-4
  },
  sessionId: string,
  timestamp: ISO8601
}
```

**SQL Query (Funnel Analysis):**
```sql
WITH step_progression AS (
  SELECT 
    session_id,
    (metadata->>'step')::integer AS step,
    MIN(timestamp) AS step_time
  FROM analytics_events
  WHERE event = 'wallet_activation_step'
    AND timestamp >= NOW() - INTERVAL '30 days'
  GROUP BY session_id, step
)
SELECT 
  step,
  COUNT(DISTINCT session_id) AS users_at_step,
  LAG(COUNT(DISTINCT session_id)) OVER (ORDER BY step) AS users_at_previous_step,
  ROUND(100.0 * COUNT(DISTINCT session_id) / 
    FIRST_VALUE(COUNT(DISTINCT session_id)) OVER (ORDER BY step), 2) AS retention_rate_pct,
  ROUND(100.0 * (LAG(COUNT(DISTINCT session_id)) OVER (ORDER BY step) - COUNT(DISTINCT session_id)) / 
    LAG(COUNT(DISTINCT session_id)) OVER (ORDER BY step), 2) AS drop_off_rate_pct
FROM step_progression
GROUP BY step
ORDER BY step;
```

**Grafana Panel:**
- Type: Funnel chart
- Metric: User progression through steps
- Highlight: Drop-off rates between steps

---

#### 8. wallet_readiness_checked
**When:** User's account readiness is validated in Step 2  
**Purpose:** Track provisioning success rate  
**Payload:**
```typescript
{
  event: 'wallet_readiness_checked',
  category: 'WalletActivation',
  action: 'Check',
  label: 'readiness',
  metadata: {
    isReady: boolean,
    authenticated: boolean,
    provisioned: boolean,
    canDeploy: boolean
  },
  sessionId: string,
  timestamp: ISO8601
}
```

**SQL Query:**
```sql
SELECT 
  COUNT(DISTINCT session_id) AS total_checks,
  COUNT(DISTINCT CASE WHEN metadata->>'isReady' = 'true' THEN session_id END) AS ready_users,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN metadata->>'isReady' = 'true' THEN session_id END) / 
    COUNT(DISTINCT session_id), 2) AS readiness_rate_pct,
  COUNT(DISTINCT CASE WHEN metadata->>'provisioned' = 'false' THEN session_id END) AS provisioning_failures
FROM analytics_events
WHERE event = 'wallet_readiness_checked'
  AND timestamp >= NOW() - INTERVAL '30 days';
```

**Grafana Panel:**
- Type: Stat
- Metric: Readiness rate (%)
- Threshold: Warning < 90%, Critical < 80%

---

#### 9. wallet_activation_complete
**When:** User successfully completes the activation journey (Step 4)  
**Purpose:** Measure activation funnel conversion  
**Payload:**
```typescript
{
  event: 'wallet_activation_complete',
  category: 'WalletActivation',
  action: 'Complete',
  label: string,              // selected_action (guided | compare)
  metadata: {
    selectedAction: string    // guided | compare
  },
  sessionId: string,
  timestamp: ISO8601
}
```

**SQL Query:**
```sql
WITH activation_starts AS (
  SELECT DISTINCT session_id, MIN(timestamp) AS start_time
  FROM analytics_events
  WHERE event = 'wallet_activation_started'
    AND timestamp >= NOW() - INTERVAL '30 days'
  GROUP BY session_id
),
activation_completions AS (
  SELECT DISTINCT session_id, MIN(timestamp) AS complete_time,
    MAX(metadata->>'selectedAction') AS selected_action
  FROM analytics_events
  WHERE event = 'wallet_activation_complete'
    AND timestamp >= NOW() - INTERVAL '30 days'
  GROUP BY session_id
)
SELECT 
  COUNT(DISTINCT ats.session_id) AS total_starts,
  COUNT(DISTINCT ac.session_id) AS total_completions,
  ROUND(100.0 * COUNT(DISTINCT ac.session_id) / COUNT(DISTINCT ats.session_id), 2) AS completion_rate_pct,
  ROUND(AVG(EXTRACT(EPOCH FROM (ac.complete_time - ats.start_time)) / 60), 2) AS avg_time_to_complete_min,
  COUNT(DISTINCT CASE WHEN ac.selected_action = 'guided' THEN ac.session_id END) AS guided_selections,
  COUNT(DISTINCT CASE WHEN ac.selected_action = 'compare' THEN ac.session_id END) AS compare_selections
FROM activation_starts ats
LEFT JOIN activation_completions ac ON ats.session_id = ac.session_id;
```

**Grafana Panel:**
- Type: Multi-stat
- Metrics: 
  - Completion rate (%)
  - Avg time to complete (min)
  - Action selection distribution

---

### Standards Comparison Events

#### 10. standards_comparison
**When:** User interacts with the standards comparison view  
**Purpose:** Measure comparison engagement and standard selection patterns  
**Payload:**
```typescript
{
  event: 'standards_comparison',
  category: 'Conversion',
  action: 'Comparison',
  label: string,              // view | compare | select
  metadata: {
    standards: string[],      // Standards being compared
    standardCount: number
  },
  sessionId: string,
  timestamp: ISO8601
}
```

**SQL Query:**
```sql
SELECT 
  label AS interaction_type,
  COUNT(DISTINCT session_id) AS unique_users,
  COUNT(*) AS total_interactions,
  ROUND(AVG((metadata->>'standardCount')::numeric), 2) AS avg_standards_compared
FROM analytics_events
WHERE event = 'standards_comparison'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY label
ORDER BY unique_users DESC;
```

**Grafana Panel:**
- Type: Bar chart
- Metric: Interactions by type (view, compare, select)
- Aggregation: Unique users

---

## Derived KPIs & Calculations

### 1. Overall Activation Funnel Conversion

**Definition:** Percentage of discovery entries that result in completed wallet activation  
**Calculation:**
```sql
WITH funnel_data AS (
  SELECT 
    COUNT(DISTINCT CASE WHEN event = 'discovery_entry' THEN session_id END) AS discovery_entries,
    COUNT(DISTINCT CASE WHEN event = 'wallet_activation_complete' THEN session_id END) AS activations_complete
  FROM analytics_events
  WHERE timestamp >= NOW() - INTERVAL '30 days'
)
SELECT 
  discovery_entries,
  activations_complete,
  ROUND(100.0 * activations_complete / NULLIF(discovery_entries, 0), 2) AS overall_conversion_rate_pct
FROM funnel_data;
```

**Target:** ≥35% (North Star Metric)  
**Grafana Panel:** Large stat with trend line

---

### 2. Average Time to Activation

**Definition:** Time from discovery entry to wallet activation completion  
**Calculation:**
```sql
WITH entry_times AS (
  SELECT session_id, MIN(timestamp) AS entry_time
  FROM analytics_events
  WHERE event = 'discovery_entry'
  GROUP BY session_id
),
completion_times AS (
  SELECT session_id, MIN(timestamp) AS complete_time
  FROM analytics_events
  WHERE event = 'wallet_activation_complete'
  GROUP BY session_id
)
SELECT 
  ROUND(AVG(EXTRACT(EPOCH FROM (ct.complete_time - et.entry_time)) / 60), 2) AS avg_time_to_activation_min,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ct.complete_time - et.entry_time)) / 60), 2) AS median_time_to_activation_min,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (ct.complete_time - et.entry_time)) / 60), 2) AS p95_time_to_activation_min
FROM entry_times et
JOIN completion_times ct ON et.session_id = ct.session_id
WHERE ct.complete_time >= NOW() - INTERVAL '30 days';
```

**Target:** ≤15 minutes  
**Grafana Panel:** Histogram with percentile markers

---

### 3. Category → Activation Correlation

**Definition:** Activation rates by initial category selection  
**Calculation:**
```sql
WITH category_selections AS (
  SELECT session_id, MIN(metadata->>'categoryId') AS first_category
  FROM analytics_events
  WHERE event = 'discovery_category_selected'
  GROUP BY session_id
),
activations AS (
  SELECT DISTINCT session_id
  FROM analytics_events
  WHERE event = 'wallet_activation_complete'
)
SELECT 
  cs.first_category,
  COUNT(DISTINCT cs.session_id) AS category_selections,
  COUNT(DISTINCT a.session_id) AS activations,
  ROUND(100.0 * COUNT(DISTINCT a.session_id) / COUNT(DISTINCT cs.session_id), 2) AS activation_rate_pct
FROM category_selections cs
LEFT JOIN activations a ON cs.session_id = a.session_id
WHERE cs.first_category IS NOT NULL
GROUP BY cs.first_category
ORDER BY activation_rate_pct DESC;
```

**Insight:** Identify highest-converting categories for optimization  
**Grafana Panel:** Table with sparklines

---

### 4. Abandonment Point Analysis

**Definition:** Where users drop off in the activation funnel  
**Calculation:**
```sql
WITH user_journey AS (
  SELECT 
    session_id,
    MAX(CASE WHEN event = 'discovery_entry' THEN 1 ELSE 0 END) AS reached_discovery,
    MAX(CASE WHEN event = 'discovery_category_selected' THEN 1 ELSE 0 END) AS reached_category,
    MAX(CASE WHEN event = 'discovery_compare_cta' OR event = 'discovery_activation_cta' THEN 1 ELSE 0 END) AS reached_cta,
    MAX(CASE WHEN event = 'wallet_activation_started' THEN 1 ELSE 0 END) AS reached_activation,
    MAX(CASE WHEN event = 'wallet_activation_complete' THEN 1 ELSE 0 END) AS completed_activation
  FROM analytics_events
  WHERE timestamp >= NOW() - INTERVAL '30 days'
  GROUP BY session_id
)
SELECT 
  SUM(reached_discovery) AS discovery_entries,
  SUM(reached_category) AS category_selections,
  SUM(reached_cta) AS cta_clicks,
  SUM(reached_activation) AS activation_starts,
  SUM(completed_activation) AS activation_completions,
  ROUND(100.0 * (SUM(reached_discovery) - SUM(reached_category)) / SUM(reached_discovery), 2) AS drop_at_category_pct,
  ROUND(100.0 * (SUM(reached_category) - SUM(reached_cta)) / SUM(reached_category), 2) AS drop_at_cta_pct,
  ROUND(100.0 * (SUM(reached_cta) - SUM(reached_activation)) / SUM(reached_cta), 2) AS drop_at_activation_start_pct,
  ROUND(100.0 * (SUM(reached_activation) - SUM(completed_activation)) / SUM(reached_activation), 2) AS drop_in_activation_pct
FROM user_journey;
```

**Insight:** Identify optimization priorities  
**Grafana Panel:** Funnel visualization with drop-off highlights

---

## Success Metrics Summary

### Primary Success Criteria (P0)

| KPI | Baseline | Target | Measurement Period | Success Threshold |
|-----|----------|--------|-------------------|-------------------|
| Overall Activation Conversion | TBD | ≥35% | 30 days | ✅ >30%, ⚠️ 25-30%, ❌ <25% |
| Discovery Entry Rate (WAU) | TBD | +40% MoM | Weekly | ✅ >40%, ⚠️ 30-40%, ❌ <30% |
| Wallet Readiness Success Rate | TBD | ≥90% | 30 days | ✅ >90%, ⚠️ 85-90%, ❌ <85% |
| Time to Activation (Median) | TBD | ≤15 min | 30 days | ✅ <15m, ⚠️ 15-20m, ❌ >20m |

### Secondary Success Criteria (P1)

| KPI | Baseline | Target | Measurement Period | Success Threshold |
|-----|----------|--------|-------------------|-------------------|
| Category Selection Rate | TBD | ≥70% | 30 days | ✅ >70%, ⚠️ 60-70%, ❌ <60% |
| Comparison Navigation Rate | TBD | ≥60% | 30 days | ✅ >60%, ⚠️ 50-60%, ❌ <50% |
| RWA Category Preference | TBD | ≥40% | 30 days | Insight (no threshold) |
| 7-Day Return Rate | TBD | ≥65% | Weekly | ✅ >65%, ⚠️ 55-65%, ❌ <55% |

### Business Impact Metrics (P2)

| KPI | Baseline | Target | Measurement Period | Success Threshold |
|-----|----------|--------|-------------------|-------------------|
| Free-to-Paid Conversion | 25% | 40% | 90 days | ✅ >35%, ⚠️ 30-35%, ❌ <30% |
| Support Ticket Reduction | TBD | -25% | 30 days | ✅ >-20%, ⚠️ -10 to -20%, ❌ <-10% |
| NPS Impact (Activated Users) | TBD | +15 pts | 90 days | ✅ >+10, ⚠️ +5 to +10, ❌ <+5 |

---

## Monitoring & Alerting

### Real-Time Alerts

**Critical Alerts (PagerDuty):**
1. Activation conversion rate drops below 20% for 2+ hours
2. Wallet readiness success rate < 75% for 1+ hours
3. Error rate > 10% for any event type

**Warning Alerts (Slack):**
1. Activation conversion rate 20-25% for 4+ hours
2. Discovery entry rate drops > 30% day-over-day
3. Abandonment rate at any funnel step > 50%

### Dashboard Configuration

**Primary Dashboard: "Token Activation Funnel"**

**Row 1: North Star Metric**
- Panel 1: Overall Activation Conversion (large stat with trend)

**Row 2: Funnel Overview**
- Panel 2: Discovery → Activation Funnel (funnel chart)
- Panel 3: Time to Activation Distribution (histogram)

**Row 3: Discovery Metrics**
- Panel 4: Discovery Entry Rate (time series)
- Panel 5: Category Selection Distribution (pie chart)
- Panel 6: Opportunity Recommendation CTR (bar chart)

**Row 4: Activation Metrics**
- Panel 7: Wallet Activation Steps (funnel)
- Panel 8: Readiness Check Success Rate (stat)
- Panel 9: Activation Completion Rate (stat with trend)

**Row 5: Abandonment Analysis**
- Panel 10: Drop-off Points (table)
- Panel 11: Category → Activation Correlation (table)

---

## Rollout & Measurement Plan

### Week 1: Baseline Establishment
- Deploy to 10% of users
- Collect initial event data
- Validate instrumentation accuracy
- Establish baseline metrics

### Week 2-3: Gradual Rollout
- Increase to 50% of users
- Monitor funnel metrics daily
- A/B test opportunity recommendations
- Iterate based on early signals

### Week 4: Full Production
- 100% rollout
- Formal baseline vs target comparison
- Generate initial business impact report
- Present findings to stakeholders

### Ongoing: Weekly Reviews
- Monitor primary success criteria
- Identify optimization opportunities
- Track trend lines (weekly, monthly)
- Adjust targets based on performance

---

## Conclusion

This KPI instrumentation framework provides complete visibility into the Token Discovery and Wallet Activation Journey performance. The 10 core events, 4 derived KPIs, and comprehensive SQL queries enable data-driven optimization and clear business impact measurement aligned with $29/$99/$299 tier customer acquisition goals.

**Next Steps:**
1. Deploy instrumentation to staging
2. Validate event capture accuracy
3. Create Grafana dashboards
4. Configure alerting thresholds
5. Establish baseline metrics in production
