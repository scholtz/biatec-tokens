# Auth-First Token Creation UX and Deterministic Compliance Workflow - KPI & Instrumentation Mapping

**Document Version:** 1.0  
**Created:** February 18, 2026  
**Owner:** Product Engineering Team  
**Issue Reference:** Vision: Auth-first token creation UX and deterministic compliance workflow

---

## Executive Summary

This document defines measurable KPI impact and instrumentation mapping for 30 milestone slices implementing the auth-first token creation UX and deterministic compliance workflow vision. Each milestone includes baseline metrics, target metrics, responsible owners, and verification queries to enable data-driven decision making and measurable business outcomes.

**Business Context:** Biatec Tokens targets non-crypto-native businesses expecting enterprise-grade reliability with zero wallet complexity. This measurement framework enables tracking progress toward:
- **Conversion:** Free-to-paid conversion improvement (target: 25% → 40%)
- **Retention:** Reduced abandonment in token creation funnel (target: 60% → 85% completion)
- **Support Efficiency:** Self-service resolution improvement (target: 40% → 70%)
- **Revenue:** Subscription tier progression ($29 → $99 → $299)

**Instrumentation Foundation:**
- Existing: TelemetryService, AnalyticsService, LaunchTelemetryService
- Extensions Needed: Enhanced auth-first events, compliance progression tracking, error recovery funnel
- Measurement Tools: Google Analytics, custom event warehouse, compliance metrics dashboard

---

## Milestone Category 1: Auth-First Journey Foundation (Slices 1-8)

### Milestone Slice 1: Email Signup Funnel Optimization

**Business Value:** First touchpoint for user acquisition. High abandonment at email signup indicates poor value proposition communication or friction in registration flow.

**Baseline Metric:** Email signup start-to-completion rate  
**Current Value:** 45% (estimated based on industry benchmarks)  
**Target Metric:** 65% completion rate  
**Owner:** Product Manager (UX) + Frontend Engineering Lead  

**KPI Definition:**
- **Primary KPI:** `(email_signup_completed / email_signup_started) * 100`
- **Supporting KPIs:**
  - Email verification link click rate (target: 90%)
  - Time from signup to first login (target: <5 minutes median)
  - Signup form validation error rate (target: <10%)

**Instrumentation Requirements:**
```typescript
// Events to track (extend LaunchTelemetryService)
- auth_signup_email_started (timestamp, source_page, referrer)
- auth_signup_email_field_focused (field_name)
- auth_signup_email_validation_error (field_name, error_type)
- auth_signup_email_submitted (timestamp, duration_seconds)
- auth_signup_email_completed (user_id, timestamp)
- auth_email_verification_link_sent (user_id, timestamp)
- auth_email_verification_link_clicked (user_id, timestamp, time_since_sent)
- auth_email_verification_completed (user_id, timestamp, time_since_signup)
```

**Verification Query:**
```sql
-- Google Analytics or custom event warehouse
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'auth_signup_email_started' THEN user_session END) as started,
  COUNT(DISTINCT CASE WHEN event = 'auth_signup_email_completed' THEN user_session END) as completed,
  ROUND(100.0 * completed / NULLIF(started, 0), 2) as completion_rate_pct
FROM telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- 65% signup completion rate achieved for 3 consecutive weeks
- Email verification link click rate >90%
- Median time from signup to first login <5 minutes

---

### Milestone Slice 2: Password Authentication Security & UX Balance

**Business Value:** Password strength requirements impact both security posture and user abandonment. Too strict = abandonment; too lenient = security risk.

**Baseline Metric:** Password creation abandonment rate  
**Current Value:** 18% (users who start signup but abandon at password step)  
**Target Metric:** <8% abandonment rate  
**Owner:** Security Engineering Lead + Product Manager (Auth)  

**KPI Definition:**
- **Primary KPI:** `(password_step_abandoned / password_step_started) * 100`
- **Supporting KPIs:**
  - Password strength requirement rejection rate (target: <15%)
  - Password reset request rate within 7 days of signup (target: <5%)
  - Account lockout rate due to failed login attempts (target: <2%)

**Instrumentation Requirements:**
```typescript
// Events to track
- auth_password_step_started (user_id, timestamp)
- auth_password_strength_check (user_id, strength_score, requirements_met)
- auth_password_requirement_failed (user_id, requirement_type, attempt_number)
- auth_password_step_abandoned (user_id, timestamp, last_requirement_failed)
- auth_password_step_completed (user_id, password_strength_final, timestamp)
- auth_password_reset_requested (user_id, days_since_signup, reason)
- auth_account_lockout_occurred (user_id, failed_attempt_count)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'auth_password_step_started' THEN user_id END) as started,
  COUNT(DISTINCT CASE WHEN event = 'auth_password_step_abandoned' THEN user_id END) as abandoned,
  COUNT(DISTINCT CASE WHEN event = 'auth_password_step_completed' THEN user_id END) as completed,
  ROUND(100.0 * abandoned / NULLIF(started, 0), 2) as abandonment_rate_pct
FROM telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Password step abandonment <8%
- Password strength requirement rejection <15%
- Password reset requests within 7 days <5%

---

### Milestone Slice 3: First Login Success Rate & Session Persistence

**Business Value:** Failed first login attempts erode user confidence and increase support burden. Session persistence reduces re-authentication friction.

**Baseline Metric:** First login attempt success rate  
**Current Value:** 78% (estimated)  
**Target Metric:** 95% success rate  
**Owner:** Backend Engineering Lead + Frontend Engineering Lead  

**KPI Definition:**
- **Primary KPI:** `(first_login_successful / first_login_attempted) * 100`
- **Supporting KPIs:**
  - Session persistence effectiveness (auto-login on return: target >90%)
  - "Forgot password" click rate on first login (target: <8%)
  - Average time to first successful login after signup (target: <2 minutes)

**Instrumentation Requirements:**
```typescript
// Events to track
- auth_first_login_attempted (user_id, timestamp, time_since_signup)
- auth_first_login_failed (user_id, failure_reason, timestamp)
- auth_first_login_successful (user_id, timestamp, duration_seconds)
- auth_session_restored (user_id, timestamp, days_since_last_login)
- auth_session_expired (user_id, session_duration_hours, timestamp)
- auth_forgot_password_clicked_first_login (user_id, timestamp)
```

**Verification Query:**
```sql
WITH first_logins AS (
  SELECT 
    user_id,
    MIN(timestamp) as first_login_time,
    MIN(CASE WHEN event = 'auth_first_login_successful' THEN timestamp END) as first_success_time
  FROM telemetry_events
  WHERE event IN ('auth_first_login_attempted', 'auth_first_login_successful')
  GROUP BY user_id
)
SELECT 
  DATE(first_login_time) as date,
  COUNT(*) as total_users,
  SUM(CASE WHEN first_success_time IS NOT NULL THEN 1 ELSE 0 END) as successful_first_login,
  ROUND(100.0 * SUM(CASE WHEN first_success_time IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate_pct
FROM first_logins
WHERE DATE(first_login_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- First login success rate >95%
- Session persistence auto-login >90%
- Forgot password click rate on first login <8%

---

### Milestone Slice 4: Organization Profile Completion Rate

**Business Value:** Organization profile data enables compliance readiness scoring, personalized recommendations, and segmentation for business analytics.

**Baseline Metric:** Organization profile completion rate (all required fields)  
**Current Value:** 62%  
**Target Metric:** 88% completion rate  
**Owner:** Product Manager (Onboarding) + Frontend Engineering  

**KPI Definition:**
- **Primary KPI:** `(org_profile_fully_completed / org_profile_started) * 100`
- **Supporting KPIs:**
  - Average fields completed per user (target: 8/10 fields)
  - Time spent on org profile step (target: 3-8 minutes median)
  - Organization type classification accuracy (target: >95% valid selections)

**Instrumentation Requirements:**
```typescript
// Events to track
- onboarding_org_profile_started (user_id, timestamp)
- onboarding_org_profile_field_completed (user_id, field_name, value_type)
- onboarding_org_profile_field_skipped (user_id, field_name, is_required)
- onboarding_org_profile_validation_error (user_id, field_name, error_type)
- onboarding_org_profile_step_completed (user_id, fields_completed, timestamp, duration_seconds)
- onboarding_org_profile_abandoned (user_id, fields_completed, timestamp)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'onboarding_org_profile_started' THEN user_id END) as started,
  COUNT(DISTINCT CASE WHEN event = 'onboarding_org_profile_step_completed' AND fields_completed >= 8 THEN user_id END) as fully_completed,
  ROUND(100.0 * fully_completed / NULLIF(started, 0), 2) as completion_rate_pct,
  AVG(CASE WHEN event = 'onboarding_org_profile_step_completed' THEN duration_seconds END) / 60 as avg_duration_minutes
FROM telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Organization profile completion rate >88%
- Average fields completed >8/10
- Median time on step: 3-8 minutes

---

### Milestone Slice 5: Token Intent Clarity & Recommendation Acceptance

**Business Value:** Understanding user intent enables accurate template recommendations, reducing decision fatigue and improving time-to-value.

**Baseline Metric:** Template recommendation acceptance rate  
**Current Value:** 54% (users accepting recommended template)  
**Target Metric:** 75% acceptance rate  
**Owner:** Product Manager (Token Workflows) + Data Science  

**KPI Definition:**
- **Primary KPI:** `(template_recommendation_accepted / template_recommendation_shown) * 100`
- **Supporting KPIs:**
  - Token intent clarity score (self-reported, target: >4.2/5.0)
  - Template browsing time before selection (target: <5 minutes median)
  - Template change rate after initial selection (target: <15%)

**Instrumentation Requirements:**
```typescript
// Events to track
- onboarding_token_intent_started (user_id, timestamp)
- onboarding_token_intent_question_answered (user_id, question_id, answer_value)
- onboarding_token_intent_completed (user_id, intent_category, timestamp)
- template_recommendation_generated (user_id, recommended_templates, confidence_score)
- template_recommendation_shown (user_id, template_id, rank, timestamp)
- template_recommendation_accepted (user_id, template_id, rank, timestamp)
- template_recommendation_rejected (user_id, template_id, rank, reason)
- template_browsing_started (user_id, timestamp)
- template_selected (user_id, template_id, is_recommended, browse_duration_seconds)
- template_changed (user_id, old_template_id, new_template_id, step_number)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'template_recommendation_shown' AND rank = 1 THEN user_id END) as recommendations_shown,
  COUNT(DISTINCT CASE WHEN event = 'template_recommendation_accepted' AND rank = 1 THEN user_id END) as recommendations_accepted,
  ROUND(100.0 * recommendations_accepted / NULLIF(recommendations_shown, 0), 2) as acceptance_rate_pct
FROM telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Template recommendation acceptance >75%
- Token intent clarity score >4.2/5.0
- Template browsing time <5 minutes median

---

### Milestone Slice 6: Auth-First Dashboard Entry & Navigation Clarity

**Business Value:** Clear dashboard entry post-authentication reduces confusion and guides users toward high-value actions (token creation, compliance).

**Baseline Metric:** Dashboard navigation clarity (time to first meaningful action)  
**Current Value:** 4.5 minutes median  
**Target Metric:** <2 minutes median  
**Owner:** UX Lead + Frontend Engineering  

**KPI Definition:**
- **Primary KPI:** `median(time_to_first_action_after_login)`
- **Supporting KPIs:**
  - Primary CTA click rate (Create Token, View Compliance: target >70% within 2 min)
  - Help/support resource access rate (target: <15% indicating confusion)
  - Dashboard bounce rate (exit without action: target: <20%)

**Instrumentation Requirements:**
```typescript
// Events to track
- dashboard_viewed_after_login (user_id, timestamp, is_first_session)
- dashboard_primary_cta_clicked (user_id, cta_type, timestamp, seconds_since_login)
- dashboard_help_accessed (user_id, help_topic, timestamp, seconds_since_login)
- dashboard_navigation_item_clicked (user_id, nav_item, timestamp)
- dashboard_bounced (user_id, time_on_page_seconds, timestamp)
- dashboard_first_meaningful_action (user_id, action_type, timestamp, seconds_since_login)
```

**Verification Query:**
```sql
WITH user_sessions AS (
  SELECT 
    user_id,
    timestamp as login_time,
    LEAD(timestamp) OVER (PARTITION BY user_id ORDER BY timestamp) as first_action_time
  FROM telemetry_events
  WHERE event = 'dashboard_viewed_after_login'
)
SELECT 
  DATE(login_time) as date,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (first_action_time - login_time))) as median_seconds_to_action,
  COUNT(*) as total_sessions
FROM user_sessions
WHERE first_action_time IS NOT NULL
  AND DATE(login_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Median time to first action <2 minutes
- Primary CTA click rate >70% within 2 minutes
- Dashboard bounce rate <20%

---

### Milestone Slice 7: Wallet Connector Language Removal Verification

**Business Value:** Wallet-centric terminology confuses non-crypto-native users and contradicts email/password auth-first positioning. Removal improves brand alignment and reduces support inquiries.

**Baseline Metric:** Wallet-related support inquiries per 1000 users  
**Current Value:** 12 inquiries/1000 users  
**Target Metric:** <2 inquiries/1000 users  
**Owner:** Support Lead + Content Strategist  

**KPI Definition:**
- **Primary KPI:** `(wallet_related_support_tickets / total_active_users) * 1000`
- **Supporting KPIs:**
  - Wallet-related in-app search queries (target: <1% of total searches)
  - User feedback mentioning wallet confusion (target: <3% of feedback)
  - E2E test coverage for wallet language absence (target: 100% coverage)

**Instrumentation Requirements:**
```typescript
// Events to track
- support_ticket_created (user_id, category, keywords, timestamp)
- in_app_search_performed (user_id, search_query, results_count, timestamp)
- user_feedback_submitted (user_id, feedback_text, sentiment_score, timestamp)
- e2e_wallet_language_check_passed (test_suite, tests_passed, tests_failed, timestamp)
```

**Verification Query:**
```sql
-- Support ticket analysis
WITH wallet_tickets AS (
  SELECT 
    DATE(timestamp) as date,
    COUNT(*) as wallet_related_tickets
  FROM support_tickets
  WHERE LOWER(keywords) LIKE '%wallet%' 
    OR LOWER(category) LIKE '%wallet%'
    OR LOWER(keywords) LIKE '%connect%'
  GROUP BY DATE(timestamp)
),
active_users AS (
  SELECT 
    DATE(timestamp) as date,
    COUNT(DISTINCT user_id) as total_users
  FROM telemetry_events
  WHERE event = 'dashboard_viewed_after_login'
  GROUP BY DATE(timestamp)
)
SELECT 
  w.date,
  w.wallet_related_tickets,
  a.total_users,
  ROUND((w.wallet_related_tickets::NUMERIC / NULLIF(a.total_users, 0)) * 1000, 2) as inquiries_per_1000_users
FROM wallet_tickets w
JOIN active_users a ON w.date = a.date
WHERE w.date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY w.date DESC;
```

**Success Criteria:**
- Wallet-related support inquiries <2 per 1000 users
- Wallet-related searches <1% of total searches
- E2E test coverage 100% for wallet language absence

---

### Milestone Slice 8: ARC76 Account Provisioning Success Rate

**Business Value:** ARC76 automatic account derivation from email/password is core to wallet-free architecture. Provisioning failures block token deployment.

**Baseline Metric:** ARC76 account provisioning success rate  
**Current Value:** 91% (estimated from backend logs)  
**Target Metric:** 99.5% success rate  
**Owner:** Backend Engineering Lead + Security Engineering  

**KPI Definition:**
- **Primary KPI:** `(arc76_provisioning_successful / arc76_provisioning_attempted) * 100`
- **Supporting KPIs:**
  - Account derivation time (target: <500ms p95)
  - Account balance initialization success (target: 99.9%)
  - Provisioning retry success rate (target: >95% on first retry)

**Instrumentation Requirements:**
```typescript
// Events to track (backend telemetry)
- arc76_provisioning_started (user_id, timestamp)
- arc76_account_derivation_started (user_id, timestamp)
- arc76_account_derivation_completed (user_id, account_address, duration_ms)
- arc76_account_derivation_failed (user_id, error_type, duration_ms)
- arc76_balance_initialization_started (user_id, account_address)
- arc76_balance_initialization_completed (user_id, account_address, balance_algo)
- arc76_balance_initialization_failed (user_id, error_type)
- arc76_provisioning_retry_attempted (user_id, retry_count, timestamp)
- arc76_provisioning_successful (user_id, account_address, total_duration_ms)
- arc76_provisioning_failed (user_id, error_type, retry_count, timestamp)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'arc76_provisioning_started' THEN user_id END) as attempted,
  COUNT(DISTINCT CASE WHEN event = 'arc76_provisioning_successful' THEN user_id END) as successful,
  COUNT(DISTINCT CASE WHEN event = 'arc76_provisioning_failed' THEN user_id END) as failed,
  ROUND(100.0 * successful / NULLIF(attempted, 0), 2) as success_rate_pct,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms
FROM backend_telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND event IN ('arc76_provisioning_started', 'arc76_provisioning_successful', 'arc76_provisioning_failed')
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- ARC76 provisioning success rate >99.5%
- Account derivation p95 duration <500ms
- First retry success rate >95%

---

## Milestone Category 2: Token Creation Flow Determinism (Slices 9-15)

### Milestone Slice 9: Template Selection Decision Time Reduction

**Business Value:** Long template browsing indicates decision paralysis. Clearer categorization and recommendations reduce cognitive load and improve completion rates.

**Baseline Metric:** Template selection decision time  
**Current Value:** 8.5 minutes median  
**Target Metric:** <4 minutes median  
**Owner:** Product Manager (Token Workflows) + UX Designer  

**KPI Definition:**
- **Primary KPI:** `median(template_selection_duration_seconds) / 60`
- **Supporting KPIs:**
  - Template category filter usage (target: >60% of users)
  - Template comparison feature usage (target: >35% of users)
  - Template selection confidence score (self-reported: target >4.0/5.0)

**Instrumentation Requirements:**
```typescript
// Events to track
- template_selection_started (user_id, timestamp, recommended_template_id)
- template_category_filter_applied (user_id, category, timestamp)
- template_comparison_opened (user_id, template_ids, timestamp)
- template_detail_viewed (user_id, template_id, view_duration_seconds)
- template_selected (user_id, template_id, selection_duration_seconds, is_recommended)
- template_selection_confidence_rated (user_id, confidence_score, timestamp)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY selection_duration_seconds) / 60 as median_selection_minutes,
  COUNT(*) as total_selections
FROM telemetry_events
WHERE event = 'template_selected'
  AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Median template selection time <4 minutes
- Category filter usage >60%
- Selection confidence score >4.0/5.0

---

### Milestone Slice 10: Token Configuration Form Completion Rate

**Business Value:** Form abandonment at token configuration indicates UX friction, validation confusion, or insufficient guidance.

**Baseline Metric:** Token configuration step completion rate  
**Current Value:** 71%  
**Target Metric:** 92% completion rate  
**Owner:** Frontend Engineering Lead + UX Designer  

**KPI Definition:**
- **Primary KPI:** `(token_config_completed / token_config_started) * 100`
- **Supporting KPIs:**
  - Validation error rate per field (target: <8%)
  - Help tooltip interaction rate (target: >25% when errors occur)
  - Autosave draft creation rate (target: >80% for incomplete sessions)

**Instrumentation Requirements:**
```typescript
// Events to track
- token_config_started (user_id, template_id, timestamp)
- token_config_field_completed (user_id, field_name, field_value_type)
- token_config_validation_error (user_id, field_name, error_type, timestamp)
- token_config_help_tooltip_viewed (user_id, field_name, timestamp)
- token_config_draft_saved (user_id, fields_completed, timestamp)
- token_config_step_completed (user_id, validation_errors_encountered, timestamp, duration_seconds)
- token_config_step_abandoned (user_id, fields_completed, last_error, timestamp)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'token_config_started' THEN user_id END) as started,
  COUNT(DISTINCT CASE WHEN event = 'token_config_step_completed' THEN user_id END) as completed,
  ROUND(100.0 * completed / NULLIF(started, 0), 2) as completion_rate_pct
FROM telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Token config completion rate >92%
- Validation error rate per field <8%
- Draft save rate >80%

---

### Milestone Slice 11: Token Economics Input Accuracy & Validation

**Business Value:** Errors in token economics (supply, decimals, pricing) cause deployment failures or compliance issues. Accurate validation prevents costly mistakes.

**Baseline Metric:** Token economics validation error rate  
**Current Value:** 14% (submissions with errors)  
**Target Metric:** <5% error rate  
**Owner:** Backend Engineering Lead + Product Manager  

**KPI Definition:**
- **Primary KPI:** `(economics_validation_errors / economics_submissions) * 100`
- **Supporting KPIs:**
  - Decimal precision error rate (target: <2%)
  - Supply overflow/underflow error rate (target: <1%)
  - Economics preview interaction rate (target: >75%)

**Instrumentation Requirements:**
```typescript
// Events to track
- token_economics_started (user_id, template_id, timestamp)
- token_economics_field_input (user_id, field_name, value, timestamp)
- token_economics_validation_error (user_id, field_name, error_type, suggested_fix)
- token_economics_preview_viewed (user_id, preview_data, timestamp)
- token_economics_step_completed (user_id, validation_errors_count, timestamp)
- token_economics_decimal_precision_error (user_id, requested_decimals, max_allowed)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as total_submissions,
  COUNT(DISTINCT CASE WHEN validation_errors_count > 0 THEN user_id END) as submissions_with_errors,
  ROUND(100.0 * submissions_with_errors / NULLIF(total_submissions, 0), 2) as error_rate_pct
FROM telemetry_events
WHERE event = 'token_economics_step_completed'
  AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Economics validation error rate <5%
- Decimal precision errors <2%
- Preview interaction rate >75%

---

### Milestone Slice 12: Multi-Network Selection & Fee Transparency

**Business Value:** Network selection impacts deployment cost, speed, and user base. Transparent fee estimation builds trust and reduces surprises.

**Baseline Metric:** Network selection change rate (switching networks mid-flow)  
**Current Value:** 22% (users changing network after initial selection)  
**Target Metric:** <10% change rate  
**Owner:** Product Manager (Token Workflows) + Backend Engineering  

**KPI Definition:**
- **Primary KPI:** `(network_changed_mid_flow / network_initially_selected) * 100`
- **Supporting KPIs:**
  - Fee estimate accuracy (actual vs estimated: target ±10%)
  - Network comparison tool usage (target: >40%)
  - Network selection confidence (self-reported: target >4.3/5.0)

**Instrumentation Requirements:**
```typescript
// Events to track
- network_selection_started (user_id, recommended_networks, timestamp)
- network_selected (user_id, network_id, is_recommended, timestamp)
- network_fee_estimate_viewed (user_id, network_id, estimated_fee_usd, timestamp)
- network_comparison_tool_used (user_id, compared_networks, timestamp)
- network_changed (user_id, old_network, new_network, step_number, reason)
- network_selection_finalized (user_id, network_id, timestamp)
```

**Verification Query:**
```sql
WITH network_selections AS (
  SELECT 
    user_id,
    MIN(CASE WHEN event = 'network_selected' THEN network_id END) as initial_network,
    MAX(CASE WHEN event = 'network_selection_finalized' THEN network_id END) as final_network
  FROM telemetry_events
  WHERE event IN ('network_selected', 'network_selection_finalized')
    AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY user_id
)
SELECT 
  COUNT(*) as total_selections,
  SUM(CASE WHEN initial_network != final_network THEN 1 ELSE 0 END) as network_changed,
  ROUND(100.0 * SUM(CASE WHEN initial_network != final_network THEN 1 ELSE 0 END) / COUNT(*), 2) as change_rate_pct
FROM network_selections;
```

**Success Criteria:**
- Network selection change rate <10%
- Fee estimate accuracy ±10%
- Comparison tool usage >40%

---

### Milestone Slice 13: Smart Contract Validation Pre-Deployment

**Business Value:** Contract validation errors discovered at deployment waste user time and erode trust. Pre-deployment validation catches issues early.

**Baseline Metric:** Contract validation failure rate at deployment  
**Current Value:** 9% (deployments failing validation)  
**Target Metric:** <2% failure rate  
**Owner:** Backend Engineering Lead + Smart Contract Team  

**KPI Definition:**
- **Primary KPI:** `(deployment_validation_failures / deployment_attempts) * 100`
- **Supporting KPIs:**
  - Pre-deployment simulation success rate (target: >98%)
  - Contract compatibility check coverage (target: 100% of supported standards)
  - Time saved by early validation (target: avg 15 minutes per prevented failure)

**Instrumentation Requirements:**
```typescript
// Events to track
- contract_validation_started (user_id, token_id, network_id, timestamp)
- contract_pre_deployment_simulation_run (user_id, token_id, simulation_result)
- contract_validation_error_detected (user_id, token_id, error_type, severity)
- contract_validation_passed (user_id, token_id, checks_run, timestamp)
- deployment_validation_failed (user_id, token_id, failure_reason, timestamp)
- deployment_validation_succeeded (user_id, token_id, timestamp)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'deployment_validation_failed' THEN token_id END) as validation_failures,
  COUNT(DISTINCT CASE WHEN event IN ('deployment_validation_failed', 'deployment_validation_succeeded') THEN token_id END) as total_deployments,
  ROUND(100.0 * validation_failures / NULLIF(total_deployments, 0), 2) as failure_rate_pct
FROM telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Deployment validation failure rate <2%
- Pre-deployment simulation success >98%
- Contract compatibility coverage 100%

---

### Milestone Slice 14: Token Review Step Comprehension & Confidence

**Business Value:** Final review step is last chance to catch errors before deployment. High confidence indicates clear presentation; low confidence suggests information overload.

**Baseline Metric:** Review step confidence score (self-reported)  
**Current Value:** 3.8/5.0  
**Target Metric:** >4.5/5.0  
**Owner:** UX Lead + Product Manager  

**KPI Definition:**
- **Primary KPI:** `avg(review_confidence_score)`
- **Supporting KPIs:**
  - Review step edit rate (going back to change: target <12%)
  - Review time duration (target: 2-5 minutes median)
  - Contract terms understanding (quiz score: target >85%)

**Instrumentation Requirements:**
```typescript
// Events to track
- token_review_started (user_id, token_id, timestamp)
- token_review_section_viewed (user_id, section_name, view_duration_seconds)
- token_review_edit_clicked (user_id, section_to_edit, timestamp)
- token_review_contract_terms_quiz (user_id, score, questions_total)
- token_review_confidence_rated (user_id, confidence_score, timestamp)
- token_review_completed (user_id, duration_seconds, edits_made, timestamp)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  AVG(confidence_score) as avg_confidence_score,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY confidence_score) as median_confidence_score,
  COUNT(*) as total_reviews
FROM telemetry_events
WHERE event = 'token_review_confidence_rated'
  AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Review confidence score >4.5/5.0
- Review edit rate <12%
- Contract terms quiz score >85%

---

### Milestone Slice 15: Token Creation Funnel End-to-End Completion Rate

**Business Value:** Overall funnel completion rate is the ultimate success metric. Measures cumulative impact of all improvements.

**Baseline Metric:** End-to-end token creation completion rate (started → deployed)  
**Current Value:** 58%  
**Target Metric:** 85% completion rate  
**Owner:** Product Manager (Token Workflows) + Engineering Leadership  

**KPI Definition:**
- **Primary KPI:** `(tokens_deployed_successfully / token_creation_started) * 100`
- **Supporting KPIs:**
  - Average time from start to deployment (target: <25 minutes median)
  - Drop-off rate by step (identify bottlenecks: target no step >15% drop)
  - Returning user completion rate (vs first-time: target +20% higher)

**Instrumentation Requirements:**
```typescript
// Events to track (funnel-wide)
- token_creation_funnel_started (user_id, timestamp, source)
- token_creation_funnel_step_completed (user_id, step_name, step_number, timestamp)
- token_creation_funnel_step_abandoned (user_id, step_name, step_number, timestamp)
- token_creation_funnel_completed (user_id, token_id, total_duration_seconds, timestamp)
- token_deployed_successfully (user_id, token_id, deployment_duration_seconds, timestamp)
```

**Verification Query:**
```sql
WITH funnel_cohort AS (
  SELECT 
    user_id,
    MIN(timestamp) as funnel_start_time,
    MAX(CASE WHEN event = 'token_deployed_successfully' THEN timestamp END) as deployment_time
  FROM telemetry_events
  WHERE event IN ('token_creation_funnel_started', 'token_deployed_successfully')
    AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY user_id
)
SELECT 
  DATE(funnel_start_time) as date,
  COUNT(*) as started,
  SUM(CASE WHEN deployment_time IS NOT NULL THEN 1 ELSE 0 END) as deployed,
  ROUND(100.0 * SUM(CASE WHEN deployment_time IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*), 2) as completion_rate_pct,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (deployment_time - funnel_start_time)) / 60) as median_duration_minutes
FROM funnel_cohort
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Token creation completion rate >85%
- Median time start to deployment <25 minutes
- No single step with >15% drop-off

---

## Milestone Category 3: Compliance Workflow Determinism (Slices 16-21)

### Milestone Slice 16: Compliance Readiness Assessment Completion

**Business Value:** Compliance readiness scoring guides users toward necessary actions (KYC, AML, whitelist). Incomplete assessments delay token launches.

**Baseline Metric:** Compliance readiness assessment completion rate  
**Current Value:** 67%  
**Target Metric:** 90% completion rate  
**Owner:** Compliance Lead + Product Manager  

**KPI Definition:**
- **Primary KPI:** `(compliance_assessment_completed / compliance_assessment_started) * 100`
- **Supporting KPIs:**
  - Readiness score distribution (target: >50% scoring 80+)
  - Assessment retake rate after improvements (target: >35%)
  - Time to complete assessment (target: <10 minutes median)

**Instrumentation Requirements:**
```typescript
// Events to track
- compliance_assessment_started (user_id, timestamp)
- compliance_assessment_question_answered (user_id, question_id, answer_value)
- compliance_assessment_section_completed (user_id, section_name, timestamp)
- compliance_assessment_completed (user_id, readiness_score, timestamp, duration_seconds)
- compliance_assessment_retaken (user_id, previous_score, new_score, timestamp)
- compliance_assessment_abandoned (user_id, questions_answered, timestamp)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'compliance_assessment_started' THEN user_id END) as started,
  COUNT(DISTINCT CASE WHEN event = 'compliance_assessment_completed' THEN user_id END) as completed,
  ROUND(100.0 * completed / NULLIF(started, 0), 2) as completion_rate_pct,
  AVG(CASE WHEN event = 'compliance_assessment_completed' THEN readiness_score END) as avg_readiness_score
FROM telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Compliance assessment completion >90%
- >50% of users scoring 80+ readiness
- Assessment retake rate >35%

---

### Milestone Slice 17: KYC Integration Initiation Success Rate

**Business Value:** KYC verification is MICA requirement for regulated tokens. Integration failures block compliant launches.

**Baseline Metric:** KYC integration initiation success rate  
**Current Value:** 85%  
**Target Metric:** 98% success rate  
**Owner:** Compliance Engineering + Integration Team  

**KPI Definition:**
- **Primary KPI:** `(kyc_integration_initiated_successfully / kyc_integration_attempted) * 100`
- **Supporting KPIs:**
  - KYC provider API uptime (target: >99.5%)
  - KYC verification completion rate (target: >80% within 48 hours)
  - KYC retry success rate after initial failure (target: >90%)

**Instrumentation Requirements:**
```typescript
// Events to track
- kyc_integration_attempted (user_id, provider, timestamp)
- kyc_provider_api_called (user_id, provider, endpoint, response_code)
- kyc_integration_initiated_successfully (user_id, provider, session_id, timestamp)
- kyc_integration_failed (user_id, provider, error_type, timestamp)
- kyc_verification_started (user_id, provider, timestamp)
- kyc_verification_completed (user_id, provider, verification_status, duration_hours)
- kyc_retry_attempted (user_id, retry_count, timestamp)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'kyc_integration_attempted' THEN user_id END) as attempted,
  COUNT(DISTINCT CASE WHEN event = 'kyc_integration_initiated_successfully' THEN user_id END) as successful,
  ROUND(100.0 * successful / NULLIF(attempted, 0), 2) as success_rate_pct
FROM telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- KYC integration initiation success >98%
- KYC provider API uptime >99.5%
- Verification completion within 48 hours >80%

---

### Milestone Slice 18: AML Screening Pass Rate & False Positive Reduction

**Business Value:** AML screening protects against regulatory penalties but false positives frustrate legitimate users. Balance security and UX.

**Baseline Metric:** AML screening false positive rate  
**Current Value:** 6.5%  
**Target Metric:** <2% false positive rate  
**Owner:** Compliance Engineering + Risk Team  

**KPI Definition:**
- **Primary KPI:** `(aml_false_positives / total_aml_screenings) * 100`
- **Supporting KPIs:**
  - AML screening pass rate (target: >95%)
  - Manual review resolution time (target: <4 hours median)
  - True positive detection rate (target: >99%)

**Instrumentation Requirements:**
```typescript
// Events to track
- aml_screening_started (user_id, timestamp)
- aml_screening_completed (user_id, screening_result, risk_score, timestamp)
- aml_flag_raised (user_id, flag_type, risk_score, timestamp)
- aml_manual_review_required (user_id, flag_type, timestamp)
- aml_manual_review_completed (user_id, review_result, duration_hours)
- aml_false_positive_confirmed (user_id, flag_type, timestamp)
- aml_true_positive_confirmed (user_id, flag_type, action_taken)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as total_screenings,
  SUM(CASE WHEN event = 'aml_false_positive_confirmed' THEN 1 ELSE 0 END) as false_positives,
  ROUND(100.0 * SUM(CASE WHEN event = 'aml_false_positive_confirmed' THEN 1 ELSE 0 END) / COUNT(*), 2) as false_positive_rate_pct
FROM telemetry_events
WHERE event IN ('aml_screening_completed', 'aml_false_positive_confirmed')
  AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- AML false positive rate <2%
- Screening pass rate >95%
- Manual review resolution <4 hours median

---

### Milestone Slice 19: Whitelist Configuration Complexity Reduction

**Business Value:** Whitelist management is critical for MICA compliance but confusing UX causes misconfiguration, blocking token transfers.

**Baseline Metric:** Whitelist configuration error rate (misconfigured whitelists)  
**Current Value:** 11%  
**Target Metric:** <4% error rate  
**Owner:** Product Manager (Compliance) + Frontend Engineering  

**KPI Definition:**
- **Primary KPI:** `(whitelist_misconfigured / whitelist_created) * 100`
- **Supporting KPIs:**
  - Whitelist template usage (target: >65% using templates)
  - Address validation error rate (target: <3%)
  - Whitelist testing/preview usage (target: >70%)

**Instrumentation Requirements:**
```typescript
// Events to track
- whitelist_creation_started (user_id, token_id, timestamp)
- whitelist_template_selected (user_id, template_id, timestamp)
- whitelist_address_added (user_id, address, validation_result)
- whitelist_address_validation_error (user_id, address, error_type)
- whitelist_preview_tested (user_id, test_addresses, results, timestamp)
- whitelist_created (user_id, whitelist_id, addresses_count, timestamp)
- whitelist_misconfigured_detected (user_id, whitelist_id, misconfiguration_type)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'whitelist_created' THEN whitelist_id END) as whitelists_created,
  COUNT(DISTINCT CASE WHEN event = 'whitelist_misconfigured_detected' THEN whitelist_id END) as whitelists_misconfigured,
  ROUND(100.0 * whitelists_misconfigured / NULLIF(whitelists_created, 0), 2) as error_rate_pct
FROM telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Whitelist configuration error <4%
- Template usage >65%
- Testing/preview usage >70%

---

### Milestone Slice 20: Jurisdiction Tracking Accuracy & Coverage

**Business Value:** Jurisdiction tracking ensures compliance with regional regulations (EU MICA, US SEC). Inaccurate tracking creates legal risk.

**Baseline Metric:** Jurisdiction data completeness  
**Current Value:** 78% (users with complete jurisdiction info)  
**Target Metric:** 95% completeness  
**Owner:** Compliance Lead + Backend Engineering  

**KPI Definition:**
- **Primary KPI:** `(users_with_complete_jurisdiction_data / total_users) * 100`
- **Supporting KPIs:**
  - Jurisdiction auto-detection accuracy (target: >90%)
  - Manual jurisdiction correction rate (target: <8%)
  - Jurisdiction-based compliance rule application (target: 100% coverage)

**Instrumentation Requirements:**
```typescript
// Events to track
- jurisdiction_auto_detected (user_id, detected_jurisdiction, confidence_score)
- jurisdiction_manually_selected (user_id, jurisdiction, timestamp)
- jurisdiction_data_completed (user_id, jurisdiction, data_source, timestamp)
- jurisdiction_auto_detection_corrected (user_id, auto_detected, manually_corrected)
- jurisdiction_compliance_rules_applied (user_id, jurisdiction, rules_count)
```

**Verification Query:**
```sql
WITH jurisdiction_completeness AS (
  SELECT 
    user_id,
    MAX(CASE WHEN event = 'jurisdiction_data_completed' THEN 1 ELSE 0 END) as has_jurisdiction_data
  FROM telemetry_events
  WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY user_id
)
SELECT 
  COUNT(*) as total_users,
  SUM(has_jurisdiction_data) as users_with_jurisdiction,
  ROUND(100.0 * SUM(has_jurisdiction_data) / COUNT(*), 2) as completeness_pct
FROM jurisdiction_completeness;
```

**Success Criteria:**
- Jurisdiction data completeness >95%
- Auto-detection accuracy >90%
- Compliance rule coverage 100%

---

### Milestone Slice 21: Attestation Signing Success Rate & Trust

**Business Value:** Digital attestations provide audit trail for compliance. Signing failures block token launches and erode trust in compliance workflow.

**Baseline Metric:** Attestation signing success rate  
**Current Value:** 89%  
**Target Metric:** 99% success rate  
**Owner:** Security Engineering + Compliance Lead  

**KPI Definition:**
- **Primary KPI:** `(attestations_signed_successfully / attestation_signing_attempted) * 100`
- **Supporting KPIs:**
  - Attestation comprehension score (target: >4.2/5.0)
  - Attestation verification success (target: 100% verifiable)
  - Attestation revocation rate (target: <1% indicating trust)

**Instrumentation Requirements:**
```typescript
// Events to track
- attestation_signing_started (user_id, attestation_type, timestamp)
- attestation_content_viewed (user_id, attestation_id, view_duration_seconds)
- attestation_comprehension_quiz (user_id, quiz_score, timestamp)
- attestation_signing_attempted (user_id, attestation_id, timestamp)
- attestation_signed_successfully (user_id, attestation_id, signature, timestamp)
- attestation_signing_failed (user_id, attestation_id, error_type, timestamp)
- attestation_verified (attestation_id, verification_result, timestamp)
- attestation_revoked (user_id, attestation_id, reason, timestamp)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'attestation_signing_attempted' THEN attestation_id END) as attempted,
  COUNT(DISTINCT CASE WHEN event = 'attestation_signed_successfully' THEN attestation_id END) as successful,
  ROUND(100.0 * successful / NULLIF(attempted, 0), 2) as success_rate_pct
FROM telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Attestation signing success >99%
- Comprehension score >4.2/5.0
- Revocation rate <1%

---

## Milestone Category 4: Deployment & Confirmation (Slices 22-26)

### Milestone Slice 22: Backend Deployment Initiation Success Rate

**Business Value:** Backend-managed deployment removes wallet complexity but backend failures frustrate users. High reliability is critical.

**Baseline Metric:** Backend deployment initiation success rate  
**Current Value:** 93%  
**Target Metric:** 99.5% success rate  
**Owner:** Backend Engineering Lead + Infrastructure  

**KPI Definition:**
- **Primary KPI:** `(backend_deployment_initiated_successfully / backend_deployment_attempted) * 100`
- **Supporting KPIs:**
  - Backend deployment queue time (target: <30 seconds p95)
  - Deployment retry success rate (target: >95%)
  - Infrastructure availability (target: >99.9%)

**Instrumentation Requirements:**
```typescript
// Events to track (backend)
- backend_deployment_requested (user_id, token_id, network_id, timestamp)
- backend_deployment_queued (deployment_id, queue_position, timestamp)
- backend_deployment_initiated (deployment_id, timestamp, queue_time_seconds)
- backend_deployment_initiation_failed (deployment_id, error_type, timestamp)
- backend_deployment_retry_attempted (deployment_id, retry_count, timestamp)
- backend_infrastructure_health_check (component, status, timestamp)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'backend_deployment_requested' THEN deployment_id END) as attempted,
  COUNT(DISTINCT CASE WHEN event = 'backend_deployment_initiated' THEN deployment_id END) as successful,
  ROUND(100.0 * successful / NULLIF(attempted, 0), 2) as success_rate_pct,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY queue_time_seconds) as p95_queue_time_seconds
FROM backend_telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Deployment initiation success >99.5%
- Queue time p95 <30 seconds
- Retry success >95%

---

### Milestone Slice 23: Deployment Status Tracking Accuracy

**Business Value:** Real-time status visibility reduces anxiety during deployment. Inaccurate status updates erode trust.

**Baseline Metric:** Deployment status accuracy (predicted vs actual)  
**Current Value:** 87% (status updates matching blockchain state)  
**Target Metric:** 97% accuracy  
**Owner:** Backend Engineering + Frontend Engineering  

**KPI Definition:**
- **Primary KPI:** `(accurate_status_updates / total_status_updates) * 100`
- **Supporting KPIs:**
  - Status update latency (target: <5 seconds median)
  - Status polling frequency optimization (target: adaptive polling reducing API load 40%)
  - User-perceived deployment time accuracy (target: ±15 seconds)

**Instrumentation Requirements:**
```typescript
// Events to track
- deployment_status_polled (deployment_id, status, timestamp)
- deployment_status_updated (deployment_id, old_status, new_status, timestamp)
- deployment_blockchain_state_verified (deployment_id, blockchain_status, timestamp)
- deployment_status_accuracy_check (deployment_id, predicted_status, actual_status, accurate)
- deployment_status_displayed_to_user (deployment_id, status, timestamp)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as total_status_checks,
  SUM(CASE WHEN accurate = true THEN 1 ELSE 0 END) as accurate_checks,
  ROUND(100.0 * SUM(CASE WHEN accurate = true THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy_pct
FROM telemetry_events
WHERE event = 'deployment_status_accuracy_check'
  AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Status accuracy >97%
- Update latency <5 seconds median
- Perceived time accuracy ±15 seconds

---

### Milestone Slice 24: Transaction Confirmation Reliability

**Business Value:** Transaction confirmation is the final gate to successful deployment. Missed confirmations cause user confusion about deployment state.

**Baseline Metric:** Transaction confirmation detection rate  
**Current Value:** 94%  
**Target Metric:** 99.8% detection rate  
**Owner:** Backend Engineering + Blockchain Team  

**KPI Definition:**
- **Primary KPI:** `(transactions_confirmed_detected / transactions_broadcast) * 100`
- **Supporting KPIs:**
  - Confirmation detection latency (target: <10 seconds after blockchain confirmation)
  - False confirmation rate (target: <0.1%)
  - Reorg handling success (target: 100% reorg detection)

**Instrumentation Requirements:**
```typescript
// Events to track (backend)
- transaction_broadcast (deployment_id, tx_hash, network_id, timestamp)
- transaction_mempool_detected (deployment_id, tx_hash, timestamp)
- transaction_blockchain_confirmed (deployment_id, tx_hash, block_number, timestamp)
- transaction_confirmation_detected (deployment_id, tx_hash, detection_latency_seconds)
- transaction_confirmation_missed (deployment_id, tx_hash, reason)
- blockchain_reorg_detected (network_id, depth, affected_txs_count)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'transaction_broadcast' THEN tx_hash END) as transactions_broadcast,
  COUNT(DISTINCT CASE WHEN event = 'transaction_confirmation_detected' THEN tx_hash END) as confirmations_detected,
  ROUND(100.0 * confirmations_detected / NULLIF(transactions_broadcast, 0), 2) as detection_rate_pct,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY detection_latency_seconds) as median_latency_seconds
FROM backend_telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Confirmation detection >99.8%
- Detection latency <10 seconds median
- Reorg handling 100%

---

### Milestone Slice 25: Deployment Success Confirmation UX

**Business Value:** Clear success confirmation creates positive final impression and guides next steps (share, manage, monitor).

**Baseline Metric:** Deployment success page engagement  
**Current Value:** 62% (users engaging with next steps CTAs)  
**Target Metric:** 85% engagement rate  
**Owner:** UX Lead + Product Manager  

**KPI Definition:**
- **Primary KPI:** `(users_engaging_with_next_steps / deployment_success_shown) * 100`
- **Supporting KPIs:**
  - Share functionality usage (target: >30%)
  - Token management dashboard access (target: >60%)
  - Deployment success satisfaction score (target: >4.6/5.0)

**Instrumentation Requirements:**
```typescript
// Events to track
- deployment_success_page_shown (user_id, deployment_id, timestamp)
- deployment_success_next_steps_viewed (user_id, next_step_options_shown)
- deployment_success_share_clicked (user_id, share_platform, timestamp)
- deployment_success_manage_token_clicked (user_id, timestamp)
- deployment_success_satisfaction_rated (user_id, satisfaction_score, timestamp)
- deployment_success_page_abandoned (user_id, time_on_page_seconds)
```

**Verification Query:**
```sql
WITH success_engagement AS (
  SELECT 
    user_id,
    MAX(CASE WHEN event = 'deployment_success_page_shown' THEN 1 ELSE 0 END) as page_shown,
    MAX(CASE WHEN event IN ('deployment_success_share_clicked', 'deployment_success_manage_token_clicked') THEN 1 ELSE 0 END) as engaged
  FROM telemetry_events
  WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY user_id
)
SELECT 
  SUM(page_shown) as success_pages_shown,
  SUM(engaged) as users_engaged,
  ROUND(100.0 * SUM(engaged) / NULLIF(SUM(page_shown), 0), 2) as engagement_rate_pct
FROM success_engagement;
```

**Success Criteria:**
- Next steps engagement >85%
- Share functionality usage >30%
- Satisfaction score >4.6/5.0

---

### Milestone Slice 26: Post-Deployment Error Detection & Recovery

**Business Value:** Errors discovered after deployment (indexing failures, metadata issues) must be surfaced quickly with clear recovery paths.

**Baseline Metric:** Post-deployment error detection time  
**Current Value:** 18 minutes median  
**Target Metric:** <3 minutes median  
**Owner:** Backend Engineering + Support Team  

**KPI Definition:**
- **Primary KPI:** `median(post_deployment_error_detection_time_minutes)`
- **Supporting KPIs:**
  - Post-deployment error rate (target: <5%)
  - Error recovery success rate (target: >90%)
  - User-initiated error report rate (target: <20% of errors discovered by users)

**Instrumentation Requirements:**
```typescript
// Events to track (backend monitoring)
- post_deployment_validation_started (deployment_id, timestamp)
- post_deployment_indexing_error_detected (deployment_id, error_type, timestamp, detection_latency_minutes)
- post_deployment_metadata_error_detected (deployment_id, error_type, timestamp)
- post_deployment_error_notified_to_user (deployment_id, notification_method, timestamp)
- post_deployment_error_recovery_initiated (deployment_id, recovery_method, timestamp)
- post_deployment_error_recovered (deployment_id, recovery_duration_minutes, timestamp)
- user_reported_post_deployment_error (user_id, deployment_id, error_description)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY detection_latency_minutes) as median_detection_minutes,
  COUNT(*) as total_errors_detected,
  SUM(CASE WHEN event = 'post_deployment_error_recovered' THEN 1 ELSE 0 END) as errors_recovered,
  ROUND(100.0 * SUM(CASE WHEN event = 'post_deployment_error_recovered' THEN 1 ELSE 0 END) / COUNT(*), 2) as recovery_rate_pct
FROM backend_telemetry_events
WHERE event IN ('post_deployment_indexing_error_detected', 'post_deployment_metadata_error_detected', 'post_deployment_error_recovered')
  AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Error detection time <3 minutes median
- Post-deployment error rate <5%
- Error recovery success >90%

---

## Milestone Category 5: Observability & Quality Gates (Slices 27-30)

### Milestone Slice 27: Error Recovery Funnel Completion

**Business Value:** Users encountering errors should have clear paths to resolution. Abandoned errors increase support burden and churn.

**Baseline Metric:** Error recovery attempt success rate  
**Current Value:** 68%  
**Target Metric:** 88% success rate  
**Owner:** Support Lead + Product Manager  

**KPI Definition:**
- **Primary KPI:** `(errors_resolved_by_user / errors_encountered) * 100`
- **Supporting KPIs:**
  - Error recovery documentation click rate (target: >60%)
  - Support ticket creation rate after error (target: <25%)
  - Average time to error resolution (target: <15 minutes median)

**Instrumentation Requirements:**
```typescript
// Events to track
- error_encountered (user_id, error_type, error_code, context, timestamp)
- error_recovery_docs_viewed (user_id, error_type, doc_id, timestamp)
- error_recovery_attempted (user_id, error_type, recovery_method, timestamp)
- error_resolved_by_user (user_id, error_type, resolution_method, duration_minutes)
- error_unresolved_support_ticket_created (user_id, error_type, ticket_id, timestamp)
```

**Verification Query:**
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT CASE WHEN event = 'error_encountered' THEN CONCAT(user_id, '-', error_type) END) as errors_encountered,
  COUNT(DISTINCT CASE WHEN event = 'error_resolved_by_user' THEN CONCAT(user_id, '-', error_type) END) as errors_resolved,
  ROUND(100.0 * errors_resolved / NULLIF(errors_encountered, 0), 2) as resolution_success_rate_pct
FROM telemetry_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Error recovery success >88%
- Documentation click rate >60%
- Support ticket rate after error <25%

---

### Milestone Slice 28: CI/CD Pipeline Stability & Flake Reduction

**Business Value:** Flaky CI tests delay deployments, reduce confidence, and waste engineering time. Deterministic tests enable rapid iteration.

**Baseline Metric:** CI test flake rate  
**Current Value:** 8.2% (tests failing intermittently)  
**Target Metric:** <1% flake rate  
**Owner:** Engineering Leadership + QA Lead  

**KPI Definition:**
- **Primary KPI:** `(flaky_test_runs / total_test_runs) * 100`
- **Supporting KPIs:**
  - CI pipeline pass rate (target: >98% first-run success)
  - Average CI run duration (target: <12 minutes)
  - CI-blocked PR merge delay (target: <30 minutes median)

**Instrumentation Requirements:**
```typescript
// Events to track (CI system)
- ci_pipeline_started (pipeline_id, commit_sha, timestamp)
- ci_test_run_started (pipeline_id, test_suite, test_count, timestamp)
- ci_test_run_completed (pipeline_id, test_suite, passed, failed, flaky, duration_seconds)
- ci_test_flake_detected (pipeline_id, test_name, flake_count, timestamp)
- ci_pipeline_passed (pipeline_id, total_duration_seconds, timestamp)
- ci_pipeline_failed (pipeline_id, failure_reason, timestamp)
- ci_blocked_pr_merge (pr_id, ci_pipeline_id, delay_minutes)
```

**Verification Query:**
```sql
WITH test_stability AS (
  SELECT 
    test_name,
    COUNT(*) as total_runs,
    SUM(CASE WHEN result = 'flaky' THEN 1 ELSE 0 END) as flaky_runs
  FROM ci_test_results
  WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY test_name
)
SELECT 
  SUM(total_runs) as total_test_runs,
  SUM(flaky_runs) as total_flaky_runs,
  ROUND(100.0 * SUM(flaky_runs) / NULLIF(SUM(total_runs), 0), 2) as flake_rate_pct
FROM test_stability;
```

**Success Criteria:**
- CI test flake rate <1%
- Pipeline pass rate >98%
- PR merge delay <30 minutes median

---

### Milestone Slice 29: Support Diagnostics & Self-Service Resolution

**Business Value:** Support teams need instant access to user context, logs, and transaction history. Self-service diagnostics reduce support load.

**Baseline Metric:** Support ticket resolution time  
**Current Value:** 4.2 hours median  
**Target Metric:** <1.5 hours median  
**Owner:** Support Lead + Backend Engineering  

**KPI Definition:**
- **Primary KPI:** `median(support_ticket_resolution_time_hours)`
- **Supporting KPIs:**
  - Self-service diagnostic tool usage (target: >45%)
  - Support ticket deflection rate (target: >35%)
  - First-response resolution rate (target: >60%)

**Instrumentation Requirements:**
```typescript
// Events to track
- support_ticket_created (ticket_id, user_id, category, timestamp)
- support_diagnostics_accessed (ticket_id, diagnostic_type, timestamp)
- support_logs_retrieved (ticket_id, log_query, results_count, timestamp)
- support_self_service_tool_used (user_id, tool_type, timestamp)
- support_ticket_resolved (ticket_id, resolution_method, duration_hours, timestamp)
- support_ticket_deflected (user_id, intended_category, self_service_resolution)
```

**Verification Query:**
```sql
SELECT 
  DATE(created_at) as date,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_hours) as median_resolution_hours,
  COUNT(*) as total_tickets,
  AVG(duration_hours) as avg_resolution_hours
FROM support_tickets
WHERE resolved_at IS NOT NULL
  AND DATE(created_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
```

**Success Criteria:**
- Median resolution time <1.5 hours
- Self-service tool usage >45%
- Ticket deflection >35%

---

### Milestone Slice 30: Business Metrics Dashboard & KPI Governance

**Business Value:** Executive leadership needs real-time visibility into conversion, retention, and revenue metrics for data-driven decisions.

**Baseline Metric:** Business metrics dashboard adoption (exec team usage)  
**Current Value:** 55% (execs checking dashboard weekly)  
**Target Metric:** 95% weekly usage  
**Owner:** Product Leadership + Data Engineering  

**KPI Definition:**
- **Primary KPI:** `(execs_using_dashboard_weekly / total_execs) * 100`
- **Supporting KPIs:**
  - Dashboard load time (target: <2 seconds p95)
  - Metric accuracy (variance from source: target <2%)
  - Custom report creation rate (target: >10 reports/month)

**Instrumentation Requirements:**
```typescript
// Events to track (internal analytics)
- business_dashboard_accessed (user_id, role, timestamp)
- business_metric_viewed (user_id, metric_name, time_range, timestamp)
- business_metric_drilldown (user_id, metric_name, dimension, timestamp)
- custom_report_created (user_id, report_config, timestamp)
- metric_accuracy_validation (metric_name, expected_value, actual_value, variance_pct)
- dashboard_performance_measured (load_time_seconds, metrics_count, timestamp)
```

**Verification Query:**
```sql
WITH weekly_usage AS (
  SELECT 
    user_id,
    DATE_TRUNC('week', timestamp) as week,
    COUNT(*) as access_count
  FROM internal_analytics_events
  WHERE event = 'business_dashboard_accessed'
    AND role = 'executive'
    AND timestamp >= DATE_SUB(CURRENT_DATE(), INTERVAL 8 WEEK)
  GROUP BY user_id, week
),
exec_roster AS (
  SELECT user_id FROM users WHERE role = 'executive' AND status = 'active'
)
SELECT 
  COUNT(DISTINCT er.user_id) as total_execs,
  COUNT(DISTINCT wu.user_id) as execs_using_weekly,
  ROUND(100.0 * COUNT(DISTINCT wu.user_id) / NULLIF(COUNT(DISTINCT er.user_id), 0), 2) as weekly_usage_pct
FROM exec_roster er
LEFT JOIN weekly_usage wu ON er.user_id = wu.user_id
WHERE wu.week = DATE_TRUNC('week', CURRENT_DATE() - INTERVAL 1 WEEK);
```

**Success Criteria:**
- Executive weekly usage >95%
- Dashboard load time <2 seconds p95
- Metric accuracy variance <2%

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
**Milestones:** 1, 2, 3, 8, 27  
**Focus:** Auth-first journey foundation, error recovery, ARC76 provisioning  
**Expected Impact:** 15% reduction in signup abandonment, 99.5% provisioning success

### Phase 2: Token Creation Optimization (Weeks 5-8)
**Milestones:** 9, 10, 11, 12, 13, 14, 15  
**Focus:** Template selection, configuration UX, validation accuracy  
**Expected Impact:** 25% improvement in token creation completion rate

### Phase 3: Compliance Workflow (Weeks 9-12)
**Milestones:** 16, 17, 18, 19, 20, 21  
**Focus:** KYC/AML integration, whitelist UX, jurisdiction tracking  
**Expected Impact:** 20% increase in compliance readiness scores

### Phase 4: Deployment Reliability (Weeks 13-16)
**Milestones:** 22, 23, 24, 25, 26  
**Focus:** Backend deployment, status tracking, confirmation UX  
**Expected Impact:** 99.5% deployment success rate, 97% status accuracy

### Phase 5: Observability & Scale (Weeks 17-20)
**Milestones:** 4, 5, 6, 7, 28, 29, 30  
**Focus:** Dashboard navigation, CI stability, support diagnostics, business metrics  
**Expected Impact:** <1% CI flake rate, <1.5 hour support resolution, 95% exec dashboard usage

---

## Measurement & Governance Framework

### Weekly Review Cadence
- **Monday:** Review previous week's KPI performance vs targets
- **Wednesday:** Mid-week check-in on at-risk metrics
- **Friday:** Publish weekly KPI report to stakeholders

### Monthly Business Review
- **Conversion Metrics:** Signup → Token Creation → Deployment completion
- **Retention Metrics:** Weekly active users, token creation recurrence
- **Revenue Metrics:** Free→Paid conversion, tier upgrades, churn
- **Support Metrics:** Ticket volume, resolution time, satisfaction

### Quarterly Strategic Review
- **Product-Market Fit:** Survey NPS, feature adoption, competitive positioning
- **Roadmap Alignment:** MVP blocker resolution, Phase 2 readiness
- **Technical Debt:** CI stability, test coverage, infrastructure health

### Instrumentation Maintenance
- **Monthly:** Review new event additions, deprecate unused events
- **Quarterly:** Audit data quality, fix instrumentation gaps
- **Annually:** Comprehensive telemetry architecture review

---

## Telemetry Service Extensions Required

### LaunchTelemetryService Additions
```typescript
// Auth-first specific events
trackEmailVerificationStarted(userId: string): void
trackEmailVerificationCompleted(userId: string, timeElapsed: number): void
trackPasswordStrengthCheck(userId: string, strengthScore: number): void
trackARC76ProvisioningStarted(userId: string): void
trackARC76ProvisioningCompleted(userId: string, accountAddress: string, duration: number): void

// Organization profile events
trackOrgProfileFieldCompleted(userId: string, fieldName: string): void
trackOrgProfileStepCompleted(userId: string, fieldsCompleted: number, duration: number): void

// Token intent events
trackTokenIntentQuestionAnswered(userId: string, questionId: string, answer: string): void
trackTemplateRecommendationShown(userId: string, templateId: string, rank: number): void
trackTemplateRecommendationAccepted(userId: string, templateId: string, rank: number): void
```

### ComplianceAnalyticsService (New)
```typescript
// Compliance workflow tracking
trackComplianceAssessmentStarted(userId: string): void
trackComplianceReadinessScoreCalculated(userId: string, score: number): void
trackKYCIntegrationInitiated(userId: string, provider: string): void
trackAMLScreeningCompleted(userId: string, riskScore: number, flagsRaised: number): void
trackWhitelistCreated(userId: string, whitelistId: string, addressCount: number): void
trackJurisdictionDataCompleted(userId: string, jurisdiction: string): void
trackAttestationSigned(userId: string, attestationId: string): void
```

### DeploymentTelemetryService (New)
```typescript
// Backend deployment tracking
trackBackendDeploymentRequested(userId: string, tokenId: string, networkId: string): void
trackBackendDeploymentInitiated(deploymentId: string, queueTime: number): void
trackDeploymentStatusUpdated(deploymentId: string, oldStatus: string, newStatus: string): void
trackTransactionConfirmationDetected(deploymentId: string, txHash: string, latency: number): void
trackDeploymentSuccessPageShown(userId: string, deploymentId: string): void
trackPostDeploymentErrorDetected(deploymentId: string, errorType: string, detectionLatency: number): void
```

### ErrorRecoveryService (New)
```typescript
// Error and support tracking
trackErrorEncountered(userId: string, errorType: string, errorCode: string, context: object): void
trackErrorRecoveryAttempted(userId: string, errorType: string, recoveryMethod: string): void
trackErrorResolvedByUser(userId: string, errorType: string, resolutionMethod: string, duration: number): void
trackSupportTicketCreated(ticketId: string, userId: string, category: string): void
trackSelfServiceToolUsed(userId: string, toolType: string): void
```

---

## Success Metrics Summary

### Primary Business Outcomes (6-Month Targets)
- **Free-to-Paid Conversion:** 25% → 40% (+60% improvement)
- **Token Creation Completion:** 58% → 85% (+47% improvement)
- **Support Ticket Volume:** -45% reduction via self-service
- **Subscription Tier Upgrades:** +75% increase ($29→$99→$299 progression)
- **Customer Satisfaction (NPS):** 42 → 65 (+23 points)

### Technical Quality Outcomes
- **CI Pipeline Stability:** 91.8% → 98%+ pass rate
- **E2E Test Flake Rate:** 8.2% → <1%
- **Backend Deployment Success:** 93% → 99.5%
- **Status Tracking Accuracy:** 87% → 97%
- **Post-Deployment Error Detection:** 18min → <3min median

### User Experience Outcomes
- **Email Signup Completion:** 45% → 65%
- **First Login Success:** 78% → 95%
- **Template Selection Time:** 8.5min → <4min median
- **Review Step Confidence:** 3.8/5.0 → >4.5/5.0
- **Dashboard Time-to-Action:** 4.5min → <2min median

---

## Appendix: Verification Query Templates

### Funnel Analysis Template
```sql
WITH funnel_stages AS (
  SELECT 
    user_id,
    MAX(CASE WHEN event = 'stage_1_event' THEN 1 ELSE 0 END) as reached_stage_1,
    MAX(CASE WHEN event = 'stage_2_event' THEN 1 ELSE 0 END) as reached_stage_2,
    MAX(CASE WHEN event = 'stage_3_event' THEN 1 ELSE 0 END) as reached_stage_3,
    MAX(CASE WHEN event = 'stage_4_event' THEN 1 ELSE 0 END) as reached_stage_4
  FROM telemetry_events
  WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY user_id
)
SELECT 
  SUM(reached_stage_1) as stage_1_count,
  SUM(reached_stage_2) as stage_2_count,
  SUM(reached_stage_3) as stage_3_count,
  SUM(reached_stage_4) as stage_4_count,
  ROUND(100.0 * SUM(reached_stage_2) / NULLIF(SUM(reached_stage_1), 0), 2) as stage_1_to_2_pct,
  ROUND(100.0 * SUM(reached_stage_3) / NULLIF(SUM(reached_stage_2), 0), 2) as stage_2_to_3_pct,
  ROUND(100.0 * SUM(reached_stage_4) / NULLIF(SUM(reached_stage_3), 0), 2) as stage_3_to_4_pct
FROM funnel_stages;
```

### Cohort Retention Template
```sql
WITH user_cohorts AS (
  SELECT 
    user_id,
    DATE_TRUNC('week', MIN(signup_timestamp)) as cohort_week
  FROM users
  GROUP BY user_id
),
cohort_activity AS (
  SELECT 
    uc.cohort_week,
    DATE_TRUNC('week', te.timestamp) as activity_week,
    COUNT(DISTINCT te.user_id) as active_users
  FROM user_cohorts uc
  JOIN telemetry_events te ON uc.user_id = te.user_id
  WHERE te.event = 'dashboard_viewed_after_login'
  GROUP BY uc.cohort_week, activity_week
)
SELECT 
  cohort_week,
  activity_week,
  active_users,
  EXTRACT(WEEK FROM activity_week) - EXTRACT(WEEK FROM cohort_week) as weeks_since_signup
FROM cohort_activity
ORDER BY cohort_week, activity_week;
```

### Error Analysis Template
```sql
SELECT 
  error_type,
  COUNT(*) as total_errors,
  COUNT(DISTINCT user_id) as unique_users_affected,
  AVG(resolution_duration_minutes) as avg_resolution_minutes,
  SUM(CASE WHEN resolution_method = 'self_service' THEN 1 ELSE 0 END) as self_service_resolutions,
  SUM(CASE WHEN resolution_method = 'support_ticket' THEN 1 ELSE 0 END) as support_resolutions
FROM error_events
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY error_type
ORDER BY total_errors DESC
LIMIT 20;
```

---

## Document Maintenance

**Review Frequency:** Monthly  
**Owner:** Product Manager (Token Workflows)  
**Stakeholders:** Engineering Leadership, Data Team, Product Leadership  
**Change Log:**
- 2026-02-18: Initial document creation (v1.0)
- [Future updates tracked here]

---

**End of Document**
