/**
 * Subscription & Billing Management E2E Tests
 *
 * Tests the subscription UI flows:
 *  - Pricing page accessible without auth
 *  - Auth-required pages redirect to login
 *  - Subscription management page displays plan info when authenticated
 *  - Billing history page shows invoice list
 *  - Usage tracking page shows plan limits
 *  - Navbar user dropdown includes billing/usage links
 *
 * Issue: Implement Subscription & Billing Management UI
 */

import { test, expect, type Page } from '@playwright/test'

const AUTH_USER = JSON.stringify({
  address: 'TESTADDRESS123',
  name: 'Test User',
  email: 'user@example.com',
  isConnected: true,
})

const setupTrialSubscription = async (page: Page, daysAhead: number) => {
  const trialEnd = Math.floor(Date.now() / 1000) + daysAhead * 86400
  await page.addInitScript(
    (args) => {
      localStorage.setItem('algorand_user', args.user)
      localStorage.setItem('subscription_cache', args.cache)
    },
    {
      user: AUTH_USER,
      cache: JSON.stringify({
        customer_id: 'cus_trial',
        subscription_id: 'sub_trial',
        subscription_status: 'trialing',
        price_id: 'price_basic_monthly',
        current_period_start: null,
        current_period_end: trialEnd,
        cancel_at_period_end: false,
        payment_method_brand: null,
        payment_method_last4: null,
        trial_end: trialEnd,
      }),
    }
  )
}

test.describe('Subscription & Billing Management', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`[E2E suppressed error]: ${msg.text()}`)
      }
    })
    page.on('pageerror', (error) => {
      console.log(`[E2E suppressed page error]: ${error.message}`)
    })
  })

  test.describe('Pricing Page', () => {
    test('should display pricing page without authentication', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      const heading = page.getByRole('heading', { name: /Simple, Predictable Pricing/i })
      await expect(heading).toBeVisible({ timeout: 15000 })
    })

    test('should display three pricing tiers', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      await expect(page.getByRole('heading', { name: 'Basic', level: 3 }).first()).toBeVisible({ timeout: 15000 })
      await expect(page.getByRole('heading', { name: 'Professional', level: 3 }).first()).toBeVisible({ timeout: 15000 })
      await expect(page.getByRole('heading', { name: 'Enterprise', level: 3 }).first()).toBeVisible({ timeout: 15000 })
    })

    test('should display price amounts', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      const content = await page.content()
      expect(content).toContain('$29')
      expect(content).toContain('$99')
      expect(content).toContain('$299')
    })

    test('should show sign-in CTA for unauthenticated users', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      const signInBtn = page.getByRole('button', { name: /Sign In or Create Account/i }).first()
      await expect(signInBtn).toBeVisible({ timeout: 15000 })
    })

    test('should not contain wallet connector UI', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      const content = await page.content()
      expect(content).not.toMatch(/WalletConnect|MetaMask|Pera.*Wallet|Defly/i)
      expect(content).not.toContain('connect wallet')
    })

    test('should show feature comparison table', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      const heading = page.getByRole('heading', { name: /Detailed Feature Comparison/i })
      await expect(heading).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('Subscription Management Page (auth required)', () => {
    test('should redirect unauthenticated user away from /account/subscription', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => localStorage.clear())

      await page.goto('/account/subscription')
      await page.waitForLoadState('networkidle')

      // Semantic wait: auth guard redirect completes when URL changes or auth form appears
      await page.waitForFunction(
        () => {
          const url = window.location.href
          const hasAuthParam = url.includes('showAuth=true')
          const emailField = document.querySelector("input[type='email'], form")
          return hasAuthParam || emailField !== null || !url.includes('/account/subscription')
        },
        { timeout: 20000 },
      )

      const url = page.url()
      const urlHasAuthParam = url.includes('showAuth=true')
      const authModalVisible = await page.locator('form').filter({ hasText: /email/i }).isVisible().catch(() => false)
      expect(urlHasAuthParam || authModalVisible).toBe(true)
    })

    test('should display subscription management page when authenticated', async ({ page }) => {
      await page.addInitScript((user: string) => {
        localStorage.setItem('algorand_user', user)
      }, AUTH_USER)

      await page.goto('/account/subscription')
      await page.waitForLoadState('networkidle')

      const heading = page.getByRole('heading', { name: /Subscription Management/i, level: 1 })
      await expect(heading).toBeVisible({ timeout: 45000 })
    })

    test('should show current plan card when authenticated', async ({ page }) => {
      await page.addInitScript((user: string) => {
        localStorage.setItem('algorand_user', user)
      }, AUTH_USER)

      await page.goto('/account/subscription')
      await page.waitForLoadState('networkidle')

      const planCard = page.locator('[data-testid="current-plan-card"]')
      await expect(planCard).toBeVisible({ timeout: 45000 })
    })

    test('should show quick links to billing and usage', async ({ page }) => {
      await page.addInitScript((user: string) => {
        localStorage.setItem('algorand_user', user)
      }, AUTH_USER)

      await page.goto('/account/subscription')
      await page.waitForLoadState('networkidle')

      const billingLink = page.locator('[data-testid="billing-history-link"]')
      await expect(billingLink).toBeVisible({ timeout: 45000 })

      const usageLink = page.locator('[data-testid="usage-tracking-link"]')
      await expect(usageLink).toBeVisible({ timeout: 45000 })
    })

    test('should show payment method card', async ({ page }) => {
      await page.addInitScript((user: string) => {
        localStorage.setItem('algorand_user', user)
      }, AUTH_USER)

      await page.goto('/account/subscription')
      await page.waitForLoadState('networkidle')

      const paymentCard = page.locator('[data-testid="payment-method-card"]')
      await expect(paymentCard).toBeVisible({ timeout: 45000 })
    })
  })

  test.describe('Billing History Page (auth required)', () => {
    test('should display billing history page when authenticated', async ({ page }) => {
      await page.addInitScript((user: string) => {
        localStorage.setItem('algorand_user', user)
      }, AUTH_USER)

      await page.goto('/account/billing')
      await page.waitForLoadState('networkidle')

      const heading = page.getByRole('heading', { name: /Billing History/i, level: 1 })
      await expect(heading).toBeVisible({ timeout: 45000 })
    })

    test('should show invoice list when authenticated', async ({ page }) => {
      await page.addInitScript((user: string) => {
        localStorage.setItem('algorand_user', user)
      }, AUTH_USER)

      await page.goto('/account/billing')
      await page.waitForLoadState('networkidle')

      const invoiceList = page.locator('[data-testid="invoice-list"]')
      await expect(invoiceList).toBeVisible({ timeout: 45000 })
    })

    test('should show back to subscription link', async ({ page }) => {
      await page.addInitScript((user: string) => {
        localStorage.setItem('algorand_user', user)
      }, AUTH_USER)

      await page.goto('/account/billing')
      await page.waitForLoadState('networkidle')

      const backBtn = page.locator('[data-testid="back-to-subscription-btn"]')
      await expect(backBtn).toBeVisible({ timeout: 45000 })
    })
  })

  test.describe('Usage Tracking Page (auth required)', () => {
    test('should display usage tracking page when authenticated', async ({ page }) => {
      await page.addInitScript((user: string) => {
        localStorage.setItem('algorand_user', user)
      }, AUTH_USER)

      await page.goto('/account/usage')
      await page.waitForLoadState('networkidle')

      const heading = page.getByRole('heading', { name: /Usage & Limits/i, level: 1 })
      await expect(heading).toBeVisible({ timeout: 45000 })
    })

    test('should show tokens usage card', async ({ page }) => {
      await page.addInitScript((user: string) => {
        localStorage.setItem('algorand_user', user)
      }, AUTH_USER)

      await page.goto('/account/usage')
      await page.waitForLoadState('networkidle')

      const tokensCard = page.locator('[data-testid="tokens-usage-card"]')
      await expect(tokensCard).toBeVisible({ timeout: 45000 })
    })

    test('should show API usage card', async ({ page }) => {
      await page.addInitScript((user: string) => {
        localStorage.setItem('algorand_user', user)
      }, AUTH_USER)

      await page.goto('/account/usage')
      await page.waitForLoadState('networkidle')

      const apiCard = page.locator('[data-testid="api-usage-card"]')
      await expect(apiCard).toBeVisible({ timeout: 45000 })
    })

    test('should show plan summary with current plan', async ({ page }) => {
      await page.addInitScript((user: string) => {
        localStorage.setItem('algorand_user', user)
      }, AUTH_USER)

      await page.goto('/account/usage')
      await page.waitForLoadState('networkidle')

      const planSummary = page.locator('[data-testid="plan-summary"]')
      await expect(planSummary).toBeVisible({ timeout: 45000 })
    })
  })

  test.describe('Success Page', () => {
    test('should display success page with confirmation', async ({ page }) => {
      await page.addInitScript((user: string) => {
        localStorage.setItem('algorand_user', user)
      }, AUTH_USER)

      await page.goto('/subscription/success')
      await page.waitForLoadState('networkidle')

      const content = await page.content()
      expect(content).toContain('Payment Successful')
    })
  })

  test.describe('Cancel Page', () => {
    test('should display cancel page when payment is cancelled', async ({ page }) => {
      await page.goto('/subscription/cancel')
      await page.waitForLoadState('networkidle')

      const content = await page.content()
      expect(content).toContain('Payment Cancelled')
    })
  })

  test.describe('Annual Billing Toggle', () => {
    test('should display the billing interval toggle', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      const toggle = page.locator('[data-testid="billing-toggle"]')
      await expect(toggle).toBeVisible({ timeout: 15000 })
    })

    test('should display annual discount badge', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      const badge = page.locator('[data-testid="annual-discount-badge"]')
      await expect(badge).toBeVisible({ timeout: 15000 })
      await expect(badge).toContainText('20%')
    })

    test('should show annual billing note when toggle is switched to annual', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      const toggle = page.locator('[data-testid="billing-interval-toggle"]')
      await toggle.click()

      const annualNote = page.locator('[data-testid="basic-annual-note"]').first()
      await expect(annualNote).toBeVisible({ timeout: 10000 })
    })

    test('should display lower monthly-equivalent price when annual is selected', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      // Get monthly price
      const monthlyPriceEl = page.locator('[data-testid="basic-price"]').first()
      await expect(monthlyPriceEl).toBeVisible({ timeout: 15000 })
      const monthlyText = await monthlyPriceEl.textContent()

      // Switch to annual
      const toggle = page.locator('[data-testid="billing-interval-toggle"]')
      await toggle.click()

      const annualPriceEl = page.locator('[data-testid="basic-price"]').first()
      const annualText = await annualPriceEl.textContent()

      // Annual price per month should be less than monthly price
      const monthly = parseFloat(monthlyText?.replace('$', '') ?? '0')
      const annual = parseFloat(annualText?.replace('$', '') ?? '0')
      expect(annual).toBeLessThan(monthly)
    })
  })

  test.describe('Coupon Code', () => {
    test('should display coupon code input field', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      const couponInput = page.locator('[data-testid="coupon-input"]')
      await expect(couponInput).toBeVisible({ timeout: 15000 })
    })

    test('should show apply button for coupon', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      const applyBtn = page.locator('[data-testid="coupon-apply-btn"]')
      await expect(applyBtn).toBeVisible({ timeout: 15000 })
    })

    test('should apply a valid coupon code and show success message', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      const couponInput = page.locator('[data-testid="coupon-input"]')
      await couponInput.fill('LAUNCH20')

      const applyBtn = page.locator('[data-testid="coupon-apply-btn"]')
      await applyBtn.click()

      // Wait for validation to complete
      const message = page.locator('[data-testid="coupon-message"]')
      await expect(message).toBeVisible({ timeout: 10000 })
      const msgText = await message.textContent()
      expect(msgText).toContain('20%')
    })

    test('should show error for invalid coupon code', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      const couponInput = page.locator('[data-testid="coupon-input"]')
      await couponInput.fill('BADCODE999')

      const applyBtn = page.locator('[data-testid="coupon-apply-btn"]')
      await applyBtn.click()

      const message = page.locator('[data-testid="coupon-message"]')
      await expect(message).toBeVisible({ timeout: 10000 })
      const msgText = await message.textContent()
      expect(msgText?.toLowerCase()).toContain('invalid')
    })
  })

  test.describe('Trial Countdown Banner', () => {
    test('should show trial banner for user in trial', async ({ page }) => {
      await setupTrialSubscription(page, 10)

      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const banner = page.locator('[data-testid="trial-countdown-banner"]')
      await expect(banner).toBeVisible({ timeout: 25000 })
    })

    test('trial banner should show days remaining', async ({ page }) => {
      await setupTrialSubscription(page, 7)

      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const banner = page.locator('[data-testid="trial-countdown-banner"]')
      await expect(banner).toBeVisible({ timeout: 25000 })
      const text = await banner.textContent()
      expect(text).toContain('days left')
    })
  })

  test.describe('Feature Gate Component', () => {
    test('pricing page plan cards have data-testid attributes', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('[data-testid="plan-card-basic"]')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('[data-testid="plan-card-professional"]')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('[data-testid="plan-card-enterprise"]')).toBeVisible({ timeout: 15000 })
    })

    test('pricing page has select plan buttons', async ({ page }) => {
      await page.goto('/subscription/pricing')
      await page.waitForLoadState('networkidle')

      await expect(page.locator('[data-testid="select-basic-btn"]')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('[data-testid="select-professional-btn"]')).toBeVisible({ timeout: 15000 })
      await expect(page.locator('[data-testid="select-enterprise-btn"]')).toBeVisible({ timeout: 15000 })
    })
  })
})
