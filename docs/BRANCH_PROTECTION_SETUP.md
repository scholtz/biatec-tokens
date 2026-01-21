# Branch Protection and CI Setup Guide

This document provides instructions for repository administrators to configure branch protection rules and ensure CI requirements are properly enforced.

## Current CI Status ✅

The repository has a robust CI pipeline with:
- ✅ **245 tests** passing consistently
- ✅ **92.67%** code coverage (exceeds 80% requirement)
- ✅ **Vitest** test framework with coverage thresholds enforced
- ✅ **Dependabot** configured for security updates
- ✅ **Two CI workflows**: `test.yml` and `build-fe.yml`

## Branch Protection Setup

### Step 1: Access Branch Protection Settings

1. Navigate to the repository on GitHub
2. Go to **Settings** → **Branches**
3. Click **Add rule** or edit existing rule for `main` branch

### Step 2: Configure Protection Rules

Enable the following settings:

#### Require Pull Request Reviews

- ✅ **Require a pull request before merging**
  - Require approvals: **1** (minimum)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (if CODEOWNERS file exists)

#### Require Status Checks

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  
  **Required status checks to add:**
  - `test` (from `.github/workflows/test.yml`)
  - `test` job from `build-fe.yml` workflow (if applicable)

#### Additional Protection Rules

- ✅ **Require conversation resolution before merging**
  - Ensures all review comments are addressed
  
- ✅ **Do not allow bypassing the above settings**
  - Enforces rules for all contributors, including admins

- ⚠️ Optional: **Require linear history**
  - Consider enabling if you prefer a clean commit history
  - Note: This prevents merge commits

### Step 3: Verify Configuration

After saving the branch protection rules:

1. Create a test PR to verify:
   - ✅ Status checks appear and must pass
   - ✅ At least 1 approval is required
   - ✅ Cannot merge with failing tests
   - ✅ Cannot merge with insufficient coverage

2. Expected behavior:
   - PRs with failing tests will show "Some checks were not successful"
   - Merge button will be disabled until all checks pass
   - Coverage below 80% lines or 70% branches will fail CI

## CI Workflows Overview

### Test Workflow (`.github/workflows/test.yml`)

**Triggers:**
- Every push to `main` branch
- Every pull request to `main` branch

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies with `npm ci`
4. Run tests with coverage: `npm run test:coverage`
5. Check coverage thresholds (Vitest enforces automatically)
6. Run build: `npm run build`

**Coverage Requirements (enforced in `vitest.config.ts`):**
```javascript
thresholds: {
  statements: 80,  // 80% minimum
  branches: 70,    // 70% minimum
  functions: 70,   // 70% minimum
  lines: 80,       // 80% minimum
}
```

**Current Coverage (as of last run):**
- Statements: 92.67% ✅
- Branches: 82.93% ✅
- Functions: 97.24% ✅
- Lines: 92.33% ✅

### Build and Deploy Workflow (`.github/workflows/build-fe.yml`)

**Triggers:**
- Push to `main` branch with changes in:
  - `src/**`
  - `docker/**`
  - `k8s/**`
  - `public/**`
  - `package-lock.json`

**Jobs:**

1. **Test Job** (runs first):
   - Install dependencies
   - Run tests with coverage
   - Build application

2. **Deploy Job** (runs only if test passes and on main):
   - Configure SSH
   - Deploy to staging server

## Dependabot Configuration

Dependabot is configured in `.github/dependabot.yml` with:

### npm Dependencies
- Weekly scans on Mondays
- Automatic PRs for security updates
- Patch updates grouped together
- Labels: `dependencies`, `security`

### GitHub Actions
- Weekly scans
- Automatic updates for workflow actions
- Labels: `dependencies`, `github-actions`

### Handling Dependabot PRs

1. **Review the PR:**
   - Check changelog and release notes
   - Verify CI passes (tests + build)

2. **Test locally if critical:**
   ```bash
   git fetch origin
   git checkout dependabot/npm_and_yarn/...
   npm ci
   npm test
   npm run build
   ```

3. **Merge promptly** if:
   - All tests pass ✅
   - No breaking changes
   - Security patches should be prioritized

## Verification Checklist

Use this checklist to verify the setup is complete:

### Repository Settings ✅
- [ ] Branch protection rule created for `main` branch
- [ ] Require pull request reviews: **1 approval minimum**
- [ ] Dismiss stale reviews enabled
- [ ] Require status checks enabled
- [ ] "test" status check added as required
- [ ] Require branches to be up to date enabled
- [ ] Conversation resolution required
- [ ] Bypassing settings not allowed

### CI Workflows ✅
- [ ] `.github/workflows/test.yml` exists and runs on PRs
- [ ] `.github/workflows/build-fe.yml` exists and deploys on main
- [ ] Coverage thresholds configured in `vitest.config.ts`
- [ ] All tests passing (245 tests)
- [ ] Coverage exceeds minimums (92.67% > 80%)

### Dependabot ✅
- [ ] `.github/dependabot.yml` exists
- [ ] npm ecosystem configured
- [ ] GitHub Actions ecosystem configured
- [ ] Weekly scan schedule
- [ ] Dependabot PRs are being created

### Documentation ✅
- [ ] `CONTRIBUTING.md` has comprehensive testing section
- [ ] Testing commands documented
- [ ] Coverage requirements explained
- [ ] Branch protection rules documented
- [ ] CI workflows explained

## Common Issues and Troubleshooting

### Issue: Status checks not appearing on PRs

**Solution:**
1. Ensure workflows have run at least once on the main branch
2. Status check names must match exactly (case-sensitive)
3. Workflow must be triggered by `pull_request` event

### Issue: CI passes locally but fails on GitHub

**Solution:**
1. Ensure `npm ci` is used (not `npm install`)
2. Check Node.js version matches (currently 20)
3. Clear cache and retry
4. Verify environment variables are set correctly

### Issue: Coverage threshold failures

**Solution:**
1. Run `npm run test:coverage` locally
2. Open `coverage/index.html` to see uncovered lines
3. Add tests for uncovered code
4. Ensure new code includes tests

### Issue: Dependabot PRs failing CI

**Solution:**
1. Check if dependencies have breaking changes
2. Update tests to match new API
3. Pin problematic dependency versions temporarily
4. Report issues to dependency maintainers

## Maintenance

### Regular Tasks

**Weekly:**
- [ ] Review and merge Dependabot PRs
- [ ] Check CI success rate
- [ ] Review test coverage trends

**Monthly:**
- [ ] Review branch protection effectiveness
- [ ] Audit failed PRs for common issues
- [ ] Update documentation if workflows change

**Quarterly:**
- [ ] Review and update coverage thresholds
- [ ] Evaluate CI performance and optimize
- [ ] Audit security vulnerabilities

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage)

## Support

For questions or issues with CI setup:
1. Check existing GitHub Issues
2. Create a new issue with label `ci` or `testing`
3. Tag repository maintainers for urgent issues

---

**Last Updated:** January 21, 2026  
**Maintained by:** Repository Administrators
