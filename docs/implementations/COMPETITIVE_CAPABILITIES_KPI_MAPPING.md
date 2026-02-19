# Competitive Capabilities KPI Instrumentation Mapping

## Overview

This document maps business KPIs to technical instrumentation for the competitive token capabilities initiative. Each KPI includes baseline metrics, target metrics, measurement queries, and telemetry events required for tracking.

## Success Metrics Framework

### Primary KPIs

#### 1. Token Creation Completion Rate

**Business Metric**: Percentage of users who start token creation and successfully deploy

**Baseline**: 58% (estimated from 1,000 monthly trials → 580 deployments)

**Target**: 73% (+15 percentage points)

**Impact**: +150 deployments/month → +$52,500 MRR (at $350 ARPU)

**Measurement Query**:
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN event = 'journey_started' AND journey = 'token_creation' THEN user_id END) as started,
  COUNT(DISTINCT CASE WHEN event = 'journey_completed' AND journey = 'token_creation' AND success = true THEN user_id END) as completed,
  (completed * 100.0 / NULLIF(started, 0)) as completion_rate
FROM analytics_events
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
```

**Instrumentation Required**:
- `journey_started` - When user begins token creation flow
- `journey_completed` - When deployment succeeds (success=true)
- `journey_abandoned` - When user exits without completing (success=false)

**Telemetry Implementation**:
```typescript
// In GuidedTokenLaunch.vue / TokenCreationWizard.vue
import { competitiveTelemetryService } from '@/services/CompetitiveTelemetryService'

onMounted(() => {
  competitiveTelemetryService.startJourney('token_creation', {
    userType: isNewUser.value ? 'new' : 'returning',
    source: routeSource.value
  })
})

onDeploymentSuccess(() => {
  competitiveTelemetryService.completeJourney('token_creation', true, {
    deploymentId: result.transactionId,
    standard: selectedStandard.value,
    duration: Date.now() - journeyStartTime.value
  })
})

onUnmounted(() => {
  if (!deploymentCompleted.value) {
    competitiveTelemetryService.completeJourney('token_creation', false, {
      abandonedAt: currentStep.value,
      reason: abandonmentReason.value
    })
  }
})
```

**Success Criteria**: Completion rate ≥73% maintained for 14+ consecutive days

---

#### 2. Deployment Abandonment Rate

**Business Metric**: Percentage of started deployments that fail or are abandoned

**Baseline**: 42% (complement of 58% completion)

**Target**: 17% (-25 percentage points)

**Impact**: Reduced support burden (-30% tickets), improved user satisfaction (+15 NPS)

**Measurement Query**:
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN event = 'journey_started' AND journey = 'token_deployment' THEN user_id END) as started,
  COUNT(DISTINCT CASE WHEN event = 'journey_abandoned' AND journey = 'token_deployment' THEN user_id END) as abandoned,
  (abandoned * 100.0 / NULLIF(started, 0)) as abandonment_rate
FROM analytics_events
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
```

**Instrumentation Required**:
- `deployment_status_viewed` - User viewing deployment progress
- `error_abandoned` - User gives up on error
- `error_recovered` - User successfully recovers from error

**Telemetry Implementation**:
```typescript
// In DeploymentStatusStep.vue
watch(deploymentStatus, (status) => {
  competitiveTelemetryService.trackDeploymentStatusVisibility({
    stage: status.currentStage,
    status: status.state,
    progress: status.progress,
    timeInStage: Date.now() - stageStartTime.value,
    userInteraction: 'viewed'
  })
  
  if (status.state === 'failed') {
    competitiveTelemetryService.trackErrorRecovery({
      errorType: status.error.code,
      stage: status.currentStage,
      recovered: false,
      recoveryMethod: 'abandon'
    })
  }
})
```

**Success Criteria**: Abandonment rate ≤17% for 14+ consecutive days

---

#### 3. Standards Selection Time

**Business Metric**: Average time from viewing standards to selection

**Baseline**: 120 seconds (estimated from user session recordings)

**Target**: 84 seconds (-30%)

**Impact**: Faster onboarding, reduced friction, +8% conversion

**Measurement Query**:
```sql
SELECT 
  AVG(time_spent) as avg_selection_time_seconds,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_spent) as median_selection_time
FROM (
  SELECT 
    user_id,
    session_id,
    MAX(timestamp) - MIN(timestamp) as time_spent
  FROM analytics_events
  WHERE event = 'standards_compared'
  GROUP BY user_id, session_id
) as standards_sessions
WHERE time_spent > 0
```

**Instrumentation Required**:
- `standards_compared` - User compares standards
- `feature_discovered` - User explores feature details
- Standard selection confirmation

**Telemetry Implementation**:
```typescript
// In TokenStandardsView.vue
const standardsViewTime = ref(Date.now())

const onStandardSelected = (standard: string) => {
  competitiveTelemetryService.trackStandardsComparison({
    standardsCompared: comparedStandards.value,
    selectedStandard: standard,
    comparisonFeatures: featuresViewed.value,
    timeSpent: (Date.now() - standardsViewTime.value) / 1000
  })
  
  router.push({ name: 'token-creation', query: { standard } })
}

const onFeatureExpanded = (feature: string) => {
  competitiveTelemetryService.trackFeatureDiscovery({
    feature: `standard_feature_${feature}`,
    discovered: true,
    timeToDiscovery: (Date.now() - standardsViewTime.value) / 1000,
    context: 'standards_comparison'
  })
}
```

**Success Criteria**: Average selection time ≤84s for 14+ consecutive days

---

#### 4. Self-Service Error Recovery Rate

**Business Metric**: Percentage of errors resolved without support intervention

**Baseline**: 0% (no current tracking or self-service tooling)

**Target**: 40% (NEW capability)

**Impact**: -45% support tickets, -$18,000/month support costs

**Measurement Query**:
```sql
SELECT 
  COUNT(CASE WHEN recovered = true THEN 1 END) as recovered,
  COUNT(*) as total_errors,
  (COUNT(CASE WHEN recovered = true THEN 1 END) * 100.0 / COUNT(*)) as recovery_rate,
  AVG(CASE WHEN recovered = true THEN time_to_recover END) as avg_recovery_time_seconds
FROM (
  SELECT 
    user_id,
    error_type,
    recovered,
    recovery_method,
    time_to_recover
  FROM analytics_events
  WHERE event IN ('error_recovered', 'error_abandoned')
    AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
) as error_events
```

**Instrumentation Required**:
- `error_recovered` - User successfully resolves error
- `error_abandoned` - User gives up on error
- Recovery method tracking (retry, edit, support, abandon)

**Telemetry Implementation**:
```typescript
// In DeploymentStatusService.ts
try {
  response = await this.deploymentService.deployToken(request)
} catch (error: any) {
  const errorStartTime = Date.now()
  
  // Show error with recovery actions
  const userAction = await showErrorDialog({
    error: error,
    actions: ['retry', 'edit', 'support']
  })
  
  if (userAction === 'retry') {
    // Retry deployment
    const retryResult = await this.retryDeployment(request)
    
    competitiveTelemetryService.trackErrorRecovery({
      errorType: error.code,
      stage: 'deploying',
      recovered: retryResult.success,
      recoveryMethod: 'retry',
      timeToRecover: (Date.now() - errorStartTime) / 1000
    })
  } else if (userAction === 'support') {
    competitiveTelemetryService.trackErrorRecovery({
      errorType: error.code,
      stage: 'deploying',
      recovered: false,
      recoveryMethod: 'support'
    })
  }
}
```

**Success Criteria**: Recovery rate ≥40% within 90 days of launch

---

### Secondary KPIs

#### 5. Feature Discovery Time

**Business Metric**: Time to discover key features from first session

**Targets**:
- Compliance Dashboard: <30s from login
- Standards Comparison: <45s from token creation start
- Whitelist Management: <60s from deployment

**Measurement Query**:
```sql
SELECT 
  feature,
  AVG(time_to_discovery) as avg_discovery_seconds,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_to_discovery) as median_discovery,
  COUNT(*) as total_discoveries
FROM analytics_events
WHERE event = 'feature_discovered'
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY feature
ORDER BY avg_discovery_seconds ASC
```

**Instrumentation Required**:
- `feature_discovered` - When user first interacts with feature
- Context tracking (how they found it: navigation, search, recommendation)

**Telemetry Implementation**:
```typescript
// In Navbar.vue
const trackFeatureClick = (feature: string) => {
  const userCreatedAt = authStore.user?.createdAt
  const timeToDiscovery = userCreatedAt 
    ? (Date.now() - new Date(userCreatedAt).getTime()) / 1000
    : undefined
  
  competitiveTelemetryService.trackFeatureDiscovery({
    feature,
    discovered: true,
    timeToDiscovery,
    context: 'navigation'
  })
}
```

**Success Criteria**: 
- 70% of users discover compliance dashboard within 30s
- 60% discover standards comparison within 45s
- 50% discover whitelist management within 60s

---

#### 6. Compliance Checkpoint Pass Rate

**Business Metric**: Percentage of compliance checks passed on first attempt

**Target**: >80% first-attempt pass rate

**Impact**: Faster token launch, reduced compliance confusion

**Measurement Query**:
```sql
SELECT 
  checkpoint,
  COUNT(CASE WHEN passed = true THEN 1 END) as passed,
  COUNT(*) as total,
  (COUNT(CASE WHEN passed = true THEN 1 END) * 100.0 / COUNT(*)) as pass_rate,
  AVG(CASE WHEN passed = false THEN ARRAY_LENGTH(blockers, 1) END) as avg_blockers_per_failure
FROM analytics_events
WHERE event = 'compliance_checkpoint'
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY checkpoint
ORDER BY pass_rate DESC
```

**Instrumentation Required**:
- `compliance_checkpoint` - Checkpoint result
- Blocker details when failed
- Recommended actions provided

**Telemetry Implementation**:
```typescript
// In ComplianceSetupWorkspace.vue
watch(complianceChecks, async (checks) => {
  for (const check of checks) {
    if (check.status !== 'pending') {
      competitiveTelemetryService.trackComplianceCheckpoint({
        checkpoint: check.id,
        passed: check.status === 'passed',
        blockers: check.status === 'failed' ? check.issues : undefined,
        recommendedActions: check.status === 'failed' ? check.recommendations : undefined,
        complianceScore: calculateComplianceScore(checks)
      })
    }
  }
}, { deep: true })
```

**Success Criteria**: Overall pass rate ≥80% across all checkpoints

---

#### 7. Post-Deployment Engagement

**Business Metric**: Average actions taken per token after deployment

**Target**: 2.5 actions/token average

**Impact**: Increased platform stickiness, reduced churn

**Activities Tracked**:
- view_details
- share
- manage_whitelist
- update_metadata
- view_explorer

**Measurement Query**:
```sql
SELECT 
  COUNT(DISTINCT token_id) as total_tokens,
  COUNT(*) as total_actions,
  (COUNT(*) * 1.0 / COUNT(DISTINCT token_id)) as avg_actions_per_token,
  activity,
  COUNT(*) as action_count
FROM analytics_events
WHERE event = 'post_deployment_activity'
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY activity
ORDER BY action_count DESC
```

**Instrumentation Required**:
- `post_deployment_activity` - Each post-deployment action
- Token ID association
- Activity context (source: dashboard, detail, notification)

**Telemetry Implementation**:
```typescript
// In TokenDetail.vue
const trackActivity = (activity: PostDeploymentActivity['activity']) => {
  competitiveTelemetryService.trackPostDeploymentActivity({
    tokenId: props.token.id,
    activity,
    timestamp: new Date(),
    context: {
      source: 'token_detail',
      tokenStandard: props.token.standard,
      deployedAt: props.token.createdAt
    }
  })
}

// Track various activities
onViewExplorer(() => trackActivity('view_explorer'))
onShareToken(() => trackActivity('share'))
onManageWhitelist(() => trackActivity('manage_whitelist'))
```

**Success Criteria**: Average ≥2.5 actions/token after 30 days

---

## Conversion Funnel Analysis

### Token Creation Funnel

**Stages**:
1. **Discovery** - User learns about platform
2. **Registration** - Email/password signup
3. **Standards Selection** - Choose token standard
4. **Configuration** - Set token parameters
5. **Compliance** - Pass compliance checks
6. **Deployment** - Submit transaction
7. **Confirmation** - Transaction confirmed

**Instrumentation**:
```typescript
// Funnel stage tracking
competitiveTelemetryService.trackMilestone({
  journey: 'token_creation',
  milestone: 'standards_selected',
  timestamp: new Date(),
  metadata: { standard: selected.value }
})

competitiveTelemetryService.trackMilestone({
  journey: 'token_creation',
  milestone: 'configuration_completed',
  timestamp: new Date(),
  metadata: { 
    tokenName: form.name,
    supply: form.totalSupply,
    decimals: form.decimals
  }
})

competitiveTelemetryService.trackMilestone({
  journey: 'token_creation',
  milestone: 'compliance_passed',
  timestamp: new Date(),
  metadata: {
    complianceScore: score.value,
    checksPassed: passedChecks.value.length
  }
})
```

**Drop-off Analysis Query**:
```sql
WITH funnel AS (
  SELECT 
    user_id,
    MAX(CASE WHEN milestone = 'standards_selected' THEN 1 ELSE 0 END) as reached_standards,
    MAX(CASE WHEN milestone = 'configuration_completed' THEN 1 ELSE 0 END) as reached_config,
    MAX(CASE WHEN milestone = 'compliance_passed' THEN 1 ELSE 0 END) as reached_compliance,
    MAX(CASE WHEN milestone = 'deployment_submitted' THEN 1 ELSE 0 END) as reached_deployment,
    MAX(CASE WHEN milestone = 'deployment_confirmed' THEN 1 ELSE 0 END) as reached_confirmation
  FROM analytics_events
  WHERE event = 'journey_milestone'
    AND journey = 'token_creation'
  GROUP BY user_id
)
SELECT 
  SUM(reached_standards) as standards_count,
  SUM(reached_config) as config_count,
  SUM(reached_compliance) as compliance_count,
  SUM(reached_deployment) as deployment_count,
  SUM(reached_confirmation) as confirmation_count,
  100.0 - (SUM(reached_config) * 100.0 / NULLIF(SUM(reached_standards), 0)) as standards_to_config_dropoff,
  100.0 - (SUM(reached_compliance) * 100.0 / NULLIF(SUM(reached_config), 0)) as config_to_compliance_dropoff,
  100.0 - (SUM(reached_deployment) * 100.0 / NULLIF(SUM(reached_compliance), 0)) as compliance_to_deployment_dropoff,
  100.0 - (SUM(reached_confirmation) * 100.0 / NULLIF(SUM(reached_deployment), 0)) as deployment_to_confirmation_dropoff
FROM funnel
```

**Target Drop-off Rates**:
- Standards → Configuration: <5%
- Configuration → Compliance: <10%
- Compliance → Deployment: <8%
- Deployment → Confirmation: <4%

---

## Dashboard Implementation

### Grafana Panels

#### Panel 1: Conversion Funnel
```
Visualization: Funnel Chart
Query: conversion_funnel_stages
Refresh: 5 minutes
Alert: Completion rate < 70%
```

#### Panel 2: Error Recovery Trends
```
Visualization: Time Series
Metrics:
  - Error count by type
  - Recovery rate %
  - Average time to recovery
Alert: Recovery rate < 35%
```

#### Panel 3: Feature Discovery Heatmap
```
Visualization: Heatmap
Axes: Feature (y) × Time to Discovery (x)
Color: Discovery count
Target lines at 30s, 45s, 60s
```

#### Panel 4: Compliance Health
```
Visualization: Gauge + Table
Metrics:
  - Overall pass rate (gauge)
  - Pass rate by checkpoint (table)
  - Common blockers (table)
Alert: Overall pass rate < 75%
```

#### Panel 5: Post-Deployment Engagement
```
Visualization: Bar Chart + Trend Line
Metrics:
  - Actions per token (bar)
  - Trend over time (line)
  - Activity breakdown (stacked bar)
Alert: Avg actions < 2.0
```

---

## Monitoring & Alerting

### Critical Alerts

**Alert 1: Completion Rate Drop**
```
Condition: completion_rate < 70% for 24 hours
Severity: P1
Notification: Slack #product-alerts
Action: Review funnel drop-off points, investigate recent changes
```

**Alert 2: Error Spike**
```
Condition: error_count > 50/hour
Severity: P2
Notification: Slack #engineering-alerts
Action: Check error types, review deployment logs
```

**Alert 3: Feature Discovery Slowdown**
```
Condition: avg_discovery_time > 90s for any critical feature
Severity: P3
Notification: Slack #ux-alerts
Action: Review navigation UX, check for UI regressions
```

### Weekly Review Metrics

**Product Team Review** (Every Monday):
- Conversion funnel trends
- Feature discovery patterns
- Standards selection distribution
- User feedback correlation

**Engineering Team Review** (Every Wednesday):
- Error recovery rates
- Deployment success rates
- Performance metrics
- Technical debt indicators

---

## Success Validation

### 30-Day Checkpoint

**Metrics to Validate**:
- ✅ Completion rate ≥73% (baseline 58%)
- ✅ Abandonment rate ≤17% (baseline 42%)
- ✅ Standards selection time ≤84s (baseline 120s)
- ✅ Error recovery rate ≥40% (baseline 0%)
- ✅ Feature discovery times meet targets
- ✅ Compliance pass rate ≥80%
- ✅ Post-deployment engagement ≥2.5 actions/token

**If Targets Not Met**:
1. Analyze funnel data to identify bottlenecks
2. User interview to understand pain points
3. A/B test UX improvements
4. Iterate based on data insights

### 90-Day Review

**Comprehensive Analysis**:
- Revenue impact validation (MRR growth vs. target)
- User satisfaction surveys (NPS improvement)
- Support ticket reduction (vs. baseline)
- Feature adoption rates
- Competitive positioning update

---

## Conclusion

This KPI instrumentation framework provides:

✅ **Clear Measurement Plan**: 7 primary/secondary KPIs with specific targets
✅ **Comprehensive Tracking**: All user journeys from discovery to post-deployment
✅ **Actionable Insights**: SQL queries + Grafana dashboards for continuous monitoring
✅ **Success Validation**: 30-day and 90-day checkpoints with clear criteria
✅ **Business Alignment**: Revenue impact tied to measurable user behavior improvements

**Implementation Status**: Foundation complete (CompetitiveTelemetryService), integration with UI components pending.

**Expected Timeline**: 
- Week 1-2: Baseline data collection
- Week 3-4: UI integration and instrumentation deployment
- Week 5-8: Monitoring and initial optimization
- Week 9-12: Iteration based on data insights

---

**Prepared by**: GitHub Copilot Agent  
**Date**: February 19, 2026  
**Review Status**: Ready for Product Owner Review
