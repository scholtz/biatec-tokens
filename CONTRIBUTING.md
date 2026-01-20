# Contributing to Biatec Tokens

Thank you for your interest in contributing to Biatec Tokens! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js 18.x or higher
- npm 9.x or higher
- Git
- A code editor (VS Code recommended)
- Basic knowledge of Vue 3, TypeScript, and Algorand

### Setting Up Your Development Environment

1. **Fork the Repository**
   ```bash
   # Click the "Fork" button on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/biatec-tokens.git
   cd biatec-tokens
   ```

2. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/scholtz/biatec-tokens.git
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Verify Build Works**
   ```bash
   npm run build
   ```

## Development Workflow

### Creating a Feature Branch

Always create a new branch for your work:

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### Making Changes

1. **Make your changes** in the feature branch
2. **Test your changes** thoroughly
3. **Ensure code quality**:
   ```bash
   npm run build  # Includes TypeScript type checking
   ```
4. **Keep commits atomic** - One logical change per commit
5. **Write clear commit messages** (see Commit Guidelines below)

### Keeping Your Branch Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Rebase your branch on upstream/main
git rebase upstream/main

# Push to your fork (force push after rebase)
git push origin feature/your-feature-name --force-with-lease
```

## Coding Standards

### TypeScript

- **Strict Mode**: Always use TypeScript strict mode
- **Type Safety**: Avoid using `any` type
- **Explicit Types**: Define interfaces for complex objects
- **No Unused Variables**: Clean up unused imports and variables

Example:
```typescript
// ✅ Good
interface TokenData {
  name: string;
  symbol: string;
  supply: number;
}

const createToken = (data: TokenData): Promise<Token> => {
  // Implementation
};

// ❌ Bad
const createToken = (data: any) => {
  // Implementation
};
```

### Vue Components

- **Composition API**: Use `<script setup>` syntax
- **TypeScript**: Type all props, emits, and refs
- **Single Responsibility**: Keep components focused
- **Reusability**: Extract common logic into composables

Example:
```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  tokenName: string;
  supply: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  create: [token: Token];
}>();

const isValid = computed(() => props.supply > 0);
</script>
```

### Styling

- **Tailwind CSS**: Use utility classes first
- **Custom Classes**: Only when necessary for reusability
- **Dark Mode**: Always support dark mode
- **Responsive**: Mobile-first approach

Example:
```vue
<template>
  <!-- ✅ Good: Tailwind utilities with dark mode -->
  <button class="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg">
    Create Token
  </button>
  
  <!-- ❌ Bad: Inline styles -->
  <button style="padding: 8px 16px; background: blue;">
    Create Token
  </button>
</template>
```

### File Organization

```typescript
// 1. Imports - external first, then internal
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import type { Token } from '@/types';

// 2. Types/Interfaces
interface FormData {
  // ...
}

// 3. Component/Store definition
export const useTokenStore = defineStore('tokens', () => {
  // 4. State
  const tokens = ref<Token[]>([]);
  
  // 5. Computed
  const totalTokens = computed(() => tokens.value.length);
  
  // 6. Methods
  const createToken = async (data: FormData) => {
    // ...
  };
  
  // 7. Return
  return {
    tokens,
    totalTokens,
    createToken,
  };
});
```

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Use them
- **Line Length**: Max 120 characters
- **Trailing Commas**: Use them in multi-line objects/arrays

Prettier configuration handles most of this automatically.

## Commit Guidelines

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
# Feature
feat(tokens): add support for ARC72 token creation

# Bug fix
fix(wallet): resolve Pera wallet connection timeout issue

# Documentation
docs(readme): update installation instructions

# Multiple changes in body
feat(dashboard): add token analytics view

- Add chart component for token statistics
- Implement transaction history table
- Add export to CSV functionality

Closes #123
```

### Best Practices

- **Present Tense**: Use "add" not "added"
- **Imperative Mood**: "fix bug" not "fixes bug"
- **Lowercase**: Start subject with lowercase (except proper nouns)
- **No Period**: Don't end subject with a period
- **50/72 Rule**: Subject max 50 chars, body wrap at 72 chars
- **Reference Issues**: Use "Closes #123" or "Fixes #456"

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream changes
2. **Test thoroughly** - All features work as expected
3. **Build succeeds** - `npm run build` completes without errors
4. **No TypeScript errors** - Type checking passes
5. **Code is clean** - No console.logs, commented code, or debug statements
6. **Documentation updated** - If adding features

### Creating a Pull Request

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open Pull Request** on GitHub

3. **Fill out the PR template**:
   - Clear description of changes
   - Motivation and context
   - Type of change (bug fix, feature, etc.)
   - Testing performed
   - Screenshots (for UI changes)
   - Related issues

4. **Request review** from maintainers

### PR Title Format

Use the same format as commit messages:

```
feat(tokens): add ARC72 token support
fix(wallet): resolve connection timeout
docs(contributing): add PR guidelines
```

### Review Process

- Maintainers will review your PR
- Address feedback and requested changes
- Keep discussions professional and constructive
- Be patient - reviews may take a few days

### After Approval

- PR will be merged by maintainers
- Your branch can be deleted
- Celebrate! 🎉

## Testing

### Test Framework

The project uses **Vitest** as the testing framework, which is optimized for Vite projects and provides:
- Fast test execution with hot module replacement
- TypeScript support out of the box
- Vue component testing with @vue/test-utils
- Code coverage reporting

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Tests are co-located with the code they test:
- **Store tests**: `src/stores/*.test.ts`
- **Component tests**: `src/components/**/*.test.ts`
- **View tests**: `src/views/*.test.ts`

### Writing Tests

#### Store Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './auth';

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('should connect wallet', async () => {
    const store = useAuthStore();
    await store.connectWallet('ALGO123...');
    
    expect(store.isConnected).toBe(true);
  });
});
```

#### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Button from './Button.vue';

describe('Button Component', () => {
  it('should render with text', () => {
    const wrapper = mount(Button, {
      slots: { default: 'Click me' },
    });
    
    expect(wrapper.text()).toContain('Click me');
  });

  it('should emit click event', async () => {
    const wrapper = mount(Button);
    await wrapper.trigger('click');
    
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
```

### Test Coverage

- **Target**: Minimum 70% code coverage for critical paths
- **Focus Areas**:
  - Authentication flow
  - Wallet integration
  - Token creation and management
  - State management (Pinia stores)

### Coverage Reports

After running `npm run test:coverage`, you can view the coverage report:
- **Terminal**: Text summary displayed in console
- **HTML Report**: Open `coverage/index.html` in your browser
- **JSON Report**: `coverage/coverage-final.json` for CI integration

### Test-Driven Development (TDD)

We encourage following Test-Driven Development practices for new features:

#### TDD Workflow

1. **Red** - Write a failing test first
2. **Green** - Write minimal code to make the test pass
3. **Refactor** - Improve the code while keeping tests green

#### TDD Example

Here's a real example from the codebase (`src/utils/address.ts`):

**Step 1 - Red: Write failing tests**
```typescript
// src/utils/address.test.ts
import { describe, it, expect } from 'vitest';
import { formatAddress } from './address';

describe('formatAddress', () => {
  it('should shorten a long Algorand address', () => {
    const address = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const result = formatAddress(address);
    
    expect(result).toBe('ABCDEF...VWXYZ');
  });
});
```

Run tests: `npm test` - Test fails because `formatAddress` doesn't exist yet ✗

**Step 2 - Green: Implement minimal code**
```typescript
// src/utils/address.ts
export function formatAddress(
  address: string,
  startLength: number = 6,
  endLength: number = 5
): string {
  if (!address || address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}
```

Run tests: `npm test` - Test passes! ✓

**Step 3 - Refactor: Add more tests and improve**
```typescript
it('should handle empty string', () => {
  expect(formatAddress('')).toBe('');
});

it('should allow custom lengths', () => {
  const address = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  expect(formatAddress(address, 4, 4)).toBe('ABCD...WXYZ');
});
```

All tests still pass! ✓

#### Benefits of TDD

- **Better Design**: Writing tests first forces you to think about the API
- **Confidence**: Tests prove your code works before you write it
- **Documentation**: Tests serve as usage examples
- **Regression Prevention**: Tests catch bugs when making changes
- **Faster Debugging**: When a test fails, you know exactly what broke

#### When to Use TDD

TDD works especially well for:
- ✅ Utility functions and helpers
- ✅ Business logic and calculations
- ✅ Data transformations
- ✅ Validation functions
- ✅ State management (Pinia stores)

TDD can be challenging for:
- ⚠️ Complex UI interactions (consider component tests instead)
- ⚠️ External API integrations (use mocks)
- ⚠️ Third-party library setup

### Testing Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
   ```typescript
   it('should do something', () => {
     // Arrange - Set up test data
     const store = useAuthStore();
     
     // Act - Perform the action
     store.connectWallet('address');
     
     // Assert - Verify the result
     expect(store.isConnected).toBe(true);
   });
   ```

2. **Test Behavior, Not Implementation**: Focus on what the code does, not how
3. **Use Descriptive Test Names**: "should connect wallet with valid address"
4. **Keep Tests Independent**: Each test should run in isolation
5. **Mock External Dependencies**: Mock API calls, localStorage, etc.
6. **Test Edge Cases**: Empty states, error conditions, boundary values

### Mocking

#### LocalStorage

```typescript
beforeEach(() => {
  localStorage.clear();
});
```

#### API Calls

```typescript
import { vi } from 'vitest';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));
```

#### DOM APIs

```typescript
global.window = {
  matchMedia: vi.fn().mockReturnValue({ matches: false }),
} as any;
```

### Continuous Integration

Tests run automatically on every push and pull request via GitHub Actions:
- All tests must pass before merging
- Coverage reports are generated and must meet minimum thresholds
- Failed tests block deployment

#### CI Workflows

The project has two main CI workflows:

**1. Test Workflow** (`.github/workflows/test.yml`)
- Runs on every push to main and all pull requests
- Steps:
  1. Checkout code
  2. Setup Node.js 18
  3. Install dependencies
  4. Run tests with coverage (`npm run test:coverage`)
  5. Check coverage thresholds (min 70%)
  6. Run build to verify no TypeScript errors

**2. Build and Deploy Workflow** (`.github/workflows/build-fe.yml`)
- Runs on push to main and pull requests
- Test Job:
  1. Run all tests with coverage
  2. Build application
- Deploy Job (main branch only):
  1. Deploy to staging server via SSH

#### Coverage Requirements

The CI enforces minimum coverage thresholds:
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

Current coverage: **84.65% statements** (exceeding requirements) ✅

If your changes cause coverage to drop below these thresholds, the CI will fail. To check coverage locally:

```bash
npm run test:coverage
```

The coverage report will show:
- Text summary in the terminal
- Detailed HTML report in `coverage/` directory (open `coverage/index.html`)
- JSON report for programmatic access

#### CI Expectations for Pull Requests

Before your PR can be merged, it must:

1. ✅ **All tests pass** - No failing test cases
2. ✅ **Coverage thresholds met** - Minimum 70% in all categories
3. ✅ **Build succeeds** - No TypeScript errors
4. ✅ **Code review approved** - At least one maintainer approval

To ensure CI success before opening a PR:

```bash
# Run all tests
npm test

# Check coverage
npm run test:coverage

# Verify build works
npm run build

# If all pass locally, CI should pass too!
```

#### Handling CI Failures

**Test Failures:**
```bash
# Run tests in watch mode to debug
npm run test:watch

# Run specific test file
npm test -- path/to/test.test.ts
```

**Coverage Failures:**
```bash
# Generate coverage report
npm run test:coverage

# Open HTML report to see uncovered lines
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows

# Add tests for uncovered code
```

**Build Failures:**
```bash
# Run build locally
npm run build

# Check TypeScript errors
npx vue-tsc -b

# Fix type errors and try again
```

### Manual Testing

In addition to automated tests, manual testing is important for:

1. **Token Creation**: Test all token standards (ASA, ARC3, ARC200, ARC72, ERC20, ERC721)
2. **Wallet Connection**: Test all supported wallets (Pera, Defly, Biatec, Exodus, Kibisis, Lute)
3. **Network Switching**: Test on different networks (VOI, Aramid, dockernet)
4. **Responsive Design**: Test on mobile and desktop
5. **Dark Mode**: Test both light and dark themes
6. **Browser Compatibility**: Test on Chrome, Firefox, Safari, Edge

### Testing Checklist

Before submitting a PR, verify all of the following to ensure CI passes:

#### Required Checks (CI will verify these)
- [ ] All existing tests pass (`npm test`)
- [ ] Test coverage meets minimum requirements:
  - [ ] 70%+ statements coverage
  - [ ] 70%+ branches coverage
  - [ ] 70%+ functions coverage
  - [ ] 70%+ lines coverage
- [ ] Build completes without errors (`npm run build`)
- [ ] No TypeScript errors

#### Best Practices
- [ ] New features have corresponding tests
- [ ] All tests are independent and can run in any order
- [ ] No console errors or warnings in tests
- [ ] Mock external dependencies (API calls, localStorage, etc.)
- [ ] Tests follow naming conventions ("should do something")
- [ ] Edge cases and error conditions are tested
- [ ] Tests use Arrange-Act-Assert pattern

#### Quick Pre-PR Verification

Run these commands to verify everything will pass CI:

```bash
# 1. Run all tests with coverage
npm run test:coverage

# 2. Verify build works
npm run build

# If both succeed, CI should pass! ✅
```

### UI/Manual Testing Checklist

- [ ] All existing features still work
- [ ] New features work as expected
- [ ] UI is responsive on mobile and desktop
- [ ] Dark mode works correctly
- [ ] No console errors or warnings
- [ ] All wallet connections work
- [ ] Transactions can be signed and submitted
- [ ] Error handling works properly

## Documentation

### When to Update Documentation

Update documentation when:

- Adding new features
- Changing existing behavior
- Adding new configuration options
- Updating dependencies that affect usage

### Documentation Files

- **README.md**: Main project documentation
- **CONTRIBUTING.md**: This file
- **SECURITY.md**: Security policy and practices
- **Code Comments**: For complex logic only
- **JSDoc**: For public APIs and utilities

### Documentation Style

- **Clear and Concise**: Easy to understand
- **Examples**: Include code examples
- **Up-to-date**: Keep in sync with code
- **Beginner-Friendly**: Don't assume expert knowledge

## Getting Help

### Resources

- **README.md**: Start here for project overview
- **GitHub Issues**: Search existing issues
- **GitHub Discussions**: Ask questions, share ideas
- **Code**: Read the source code - it's well-organized!

### Asking Questions

When asking for help:

1. **Search first**: Check existing issues and discussions
2. **Be specific**: Describe what you're trying to do
3. **Include context**: Version, OS, error messages
4. **Show your work**: What have you tried?
5. **Be patient**: Maintainers are volunteers

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Pull Requests**: Code review and feedback

## Recognition

Contributors are recognized in:

- Git commit history
- Release notes
- README.md (for significant contributions)
- GitHub contributors page

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to Biatec Tokens! Your efforts help make blockchain technology more accessible to everyone.

## Quick Reference

```bash
# Setup
git clone https://github.com/YOUR_USERNAME/biatec-tokens.git
cd biatec-tokens
npm install
cp .env.example .env
npm run dev

# Development
git checkout -b feature/my-feature
# Make changes
npm run build  # Test build
git add .
git commit -m "feat(scope): description"
git push origin feature/my-feature

# Update branch
git fetch upstream
git rebase upstream/main
git push origin feature/my-feature --force-with-lease
```

Happy coding! 🚀
