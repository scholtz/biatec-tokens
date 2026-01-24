# Biatec Tokens

<div align="center">
  <h3>Next-Generation Tokenization Platform</h3>
  <p>Create, manage, and deploy tokens across multiple standards with enterprise-grade security and lightning-fast performance on Algorand-based networks.</p>
</div>

---

## 🚀 Overview

Biatec Tokens is a comprehensive Vue 3-based frontend application that simplifies the creation and management of blockchain tokens on Algorand-based networks. With support for multiple token standards and seamless wallet integration, Biatec Tokens empowers developers and businesses to tokenize assets quickly and securely.

## Deployment

- Frontend: https://tokens.biatec.io
- Backend: [https://api.tokens.biatec.io](https://api.tokens.biatec.io/swagger/index.html)

### Key Features

- **Multi-Standard Support**: Create tokens across 8 different standards including:
  - **Algorand Native**: ASA (Algorand Standard Assets)
  - **ARC Standards**: ARC3 Fungible Tokens, ARC3 NFTs, ARC3 Fractional NFTs, ARC200, ARC72
  - **Ethereum Standards**: ERC20, ERC721
  
- **Multi-Wallet Integration**: Seamless connection with popular Algorand wallets:
  - Biatec Wallet
  - Pera Wallet
  - Defly Wallet
  - Exodus
  - Kibisis
  - Lute Connect
  
- **Multi-Network Support**: Deploy tokens on multiple networks:
  - VOI Mainnet
  - Aramid Mainnet
  - Dockernet (Local Development)
  
- **Intuitive User Interface**: 
  - Modern, responsive design with dark mode support
  - Token creation wizard with validation
  - Real-time dashboard for token management
  - Transaction history and analytics
  - **API Health Monitoring**: Real-time backend connectivity status with automatic retry
  
- **Enterprise-Grade Security**:
  - Algorand-based authentication
  - Secure wallet integration
  - Transaction signing with user consent

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Git**: For cloning the repository
- **Compatible Wallet**: One of the supported Algorand wallets installed

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/scholtz/biatec-tokens.git
cd biatec-tokens
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Algorand Network Configuration
VITE_ALGOD_URL=https://testnet-api.algonode.cloud
VITE_ALGOD_TOKEN=
VITE_INDEXER_URL=https://testnet-idx.algonode.cloud
VITE_INDEXER_TOKEN=

# Stripe Configuration (if using payments)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

> **Note**: For production, update these values with your mainnet endpoints and credentials.

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔌 Backend API Integration

This frontend integrates with the [BiatecTokensApi](https://github.com/scholtz/BiatecTokensApi) backend for token deployment and management. The integration is implemented following Test-Driven Development (TDD) practices.

### Backend Configuration

Add the backend API URL to your `.env` file:

```env
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
```

For production environments, replace with your production API URL:

```env
VITE_API_BASE_URL=https://api.biatec-tokens.com/api
```

### API Client Usage

The application provides type-safe API clients for interacting with the backend:

#### 1. API Client (Basic HTTP Operations)

```typescript
import { BiatecTokensApiClient } from '@/services/BiatecTokensApiClient';

// Create a client instance
const apiClient = new BiatecTokensApiClient();

// Or use the default instance
import { apiClient } from '@/services/BiatecTokensApiClient';

// Check API health
const health = await apiClient.healthCheck();
console.log(health); // { status: 'healthy', timestamp: '...' }

// Make custom API calls
const response = await apiClient.get('/tokens/list');
const newToken = await apiClient.post('/tokens/deploy', tokenData);
```

#### 2. Token Deployment Service (High-Level Operations)

```typescript
import { tokenDeploymentService } from '@/services/TokenDeploymentService';
import { TokenStandard } from '@/types/api';

// Deploy an ERC20 token
const erc20Request = {
  standard: TokenStandard.ERC20,
  name: 'My Token',
  symbol: 'MTK',
  decimals: 18,
  totalSupply: '1000000',
  walletAddress: '0x1234567890123456789012345678901234567890',
};

const result = await tokenDeploymentService.deployToken(erc20Request);
console.log(result.transactionId); // txn_123456
console.log(result.tokenId); // token_789

// Deploy an ARC3 NFT
const arc3Request = {
  standard: TokenStandard.ARC3,
  name: 'My NFT Collection',
  unitName: 'MNFT',
  total: 1,
  decimals: 0,
  url: 'ipfs://QmYourMetadataHash',
  walletAddress: 'YOUR_ALGORAND_ADDRESS_HERE',
  metadata: {
    name: 'My NFT',
    description: 'A unique digital collectible',
    image: 'ipfs://QmYourImageHash',
  },
};

const nftResult = await tokenDeploymentService.deployToken(arc3Request);

// Check deployment status
const status = await tokenDeploymentService.checkDeploymentStatus(
  result.transactionId
);

// List all deployed tokens for a wallet
const { tokens } = await tokenDeploymentService.listDeployedTokens(
  '0x1234567890123456789012345678901234567890'
);
```

### API Type Definitions

All API types are fully typed and validated:

```typescript
import {
  TokenStandard,
  ERC20DeploymentRequest,
  ARC3DeploymentRequest,
  ARC200DeploymentRequest,
  ARC1400DeploymentRequest,
  TokenDeploymentResponse,
  validateTokenDeploymentRequest,
} from '@/types/api';

// Validate request before sending
const request: ERC20DeploymentRequest = {
  standard: TokenStandard.ERC20,
  name: 'Test Token',
  symbol: 'TST',
  decimals: 18,
  totalSupply: '1000000',
  walletAddress: '0x1234567890123456789012345678901234567890',
};

const validation = validateTokenDeploymentRequest(request);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
} else {
  // Proceed with deployment
  const result = await tokenDeploymentService.deployToken(request);
}
```

### Supported Token Standards

The backend integration supports the following token standards:

| Standard | Type | Description |
|----------|------|-------------|
| **ERC20** | Fungible | Standard Ethereum fungible tokens |
| **ARC3** | NFT/Fungible | Algorand Standard Assets with metadata (NFTs or fractional NFTs) |
| **ARC200** | Fungible | Smart contract tokens compatible with ERC20 |
| **ARC1400** | Security Token | Security tokens with partition support |

### Error Handling

The API integration includes comprehensive error handling:

```typescript
try {
  const result = await tokenDeploymentService.deployToken(request);
  
  if (result.success) {
    console.log('Token deployed successfully!', result.tokenId);
  } else {
    console.error('Deployment failed:', result.error);
    console.error('Error code:', result.errorCode);
  }
} catch (error) {
  if (error.response) {
    // API returned an error response
    console.error('API error:', error.response.status);
    console.error('Error details:', error.response.data);
  } else if (error.code === 'ECONNREFUSED') {
    // Backend is not reachable
    console.error('Cannot connect to backend API');
  } else {
    // Other error
    console.error('Unexpected error:', error.message);
  }
}
```

### API Health Monitoring

The application includes an automatic API health monitoring system that provides real-time feedback on the backend API's availability and performance.

#### Features

- **Automatic Health Checks**: Polls the backend API every 30 seconds to verify connectivity
- **Smart Status Detection**: 
  - 🟢 **Healthy**: API responding normally (< 5 seconds)
  - 🟡 **Slow**: API responding slowly (> 5 seconds)
  - 🔴 **Unreachable**: API is down or not responding
- **Exponential Backoff**: Automatically adjusts polling frequency when API is unreachable (5s → 10s → 20s → max 60s)
- **User-Friendly Notifications**: Non-intrusive banner appears only when there are issues
- **Manual Retry**: One-click retry button to immediately check connectivity
- **Dismissible**: Users can temporarily dismiss the banner if needed

#### Health Banner Behavior

The health indicator banner automatically appears at the top of the page when issues are detected:

```
⚠️ API is responding slowly                     [Dismiss]
```

```
❌ API is unreachable: Connection timeout        [Retry] [Dismiss]
```

- **Slow Performance Warning**: Yellow/orange banner when API response time exceeds 5 seconds
- **Connection Error**: Red banner with error details when API is unreachable
- **Retry Button**: Click to manually trigger an immediate health check (only shown when unreachable)
- **Auto-Recovery**: Banner automatically disappears when connection is restored
- **Smart Dismissal**: Dismissed banners reappear if status changes (e.g., from slow to unreachable)

#### Using the Health Check Composable

You can integrate health monitoring into your own components:

```typescript
import { useApiHealth } from '@/composables/useApiHealth';

export default {
  setup() {
    const { 
      status,       // Current status: 'healthy' | 'slow' | 'unreachable'
      isHealthy,    // Boolean: true if healthy
      isSlow,       // Boolean: true if slow
      isUnreachable,// Boolean: true if unreachable
      isChecking,   // Boolean: true during health check
      error,        // Error message (if any)
      lastChecked,  // ISO timestamp of last check
      checkHealth,  // Manual health check function
      startPolling, // Start automatic polling
      stopPolling,  // Stop automatic polling
    } = useApiHealth();
    
    // Start polling on mount
    onMounted(() => {
      startPolling();
    });
    
    // Stop polling on unmount
    onUnmounted(() => {
      stopPolling();
    });
    
    // Manual retry
    const handleRetry = async () => {
      await checkHealth();
    };
    
    return {
      status,
      isHealthy,
      isSlow,
      isUnreachable,
      isChecking,
      error,
      handleRetry,
    };
  }
};
```

#### Health Check Implementation

The health monitoring system is built following Test-Driven Development (TDD) principles:

- **15 Unit Tests**: Comprehensive coverage of health check logic, polling, backoff, and error handling
- **17 Component Tests**: Complete UI state testing, retry functionality, and accessibility
- **Type-Safe**: Full TypeScript support with proper typing

```bash
# Run health check tests
npm test -- src/composables/__tests__/useApiHealth.test.ts
npm test -- src/components/__tests__/ApiHealthBanner.test.ts
```

### Testing

The backend integration is fully tested with 167+ passing tests and 84%+ code coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui
```

#### Test Coverage

The project maintains high test coverage standards:
- **Overall Coverage**: 84.65% statements
- **Components**: 100% coverage (UI components fully tested)
- **Services**: 56.62% coverage
- **Stores**: 93.51% coverage
- **Utils**: 100% coverage

Coverage thresholds enforced by CI:
- Minimum 70% for statements, branches, functions, and lines
- Pull requests must maintain or improve coverage

#### Test Structure

Tests are organized by category:
- **Component Tests**: `src/components/**/*.test.ts` (86 tests)
- **Service Tests**: `src/services/__tests__/*.test.ts` (31 tests)
- **Store Tests**: `src/stores/*.test.ts` (19 tests)
- **Type Tests**: `src/types/__tests__/*.test.ts` (18 tests)
- **Utility Tests**: `src/utils/*.test.ts` (9 tests)

For more information on writing tests, see [CONTRIBUTING.md](CONTRIBUTING.md#testing).

## 🏗️ Project Structure

```
biatec-tokens/
├── src/
│   ├── components/          # Vue components
│   │   ├── ui/             # Reusable UI components (Button, Modal, Card, etc.)
│   │   ├── layout/         # Layout components (Navbar, Sidebar)
│   │   ├── ApiHealthBanner.vue  # API health status banner
│   │   └── __tests__/      # Component tests (17 API health banner tests)
│   ├── composables/        # Vue composables (reusable logic)
│   │   ├── useApiHealth.ts # API health monitoring composable
│   │   └── __tests__/      # Composable tests (15 health check tests)
│   ├── services/           # Backend API integration services
│   │   ├── BiatecTokensApiClient.ts      # HTTP client for backend API
│   │   ├── TokenDeploymentService.ts     # Token deployment service
│   │   └── __tests__/      # Service tests (16 API client + 15 deployment tests)
│   ├── types/              # TypeScript type definitions
│   │   ├── api.ts          # Backend API types and validation
│   │   └── __tests__/      # Type tests (18 tests)
│   ├── stores/             # Pinia state management stores
│   │   ├── auth.ts         # Authentication state
│   │   ├── tokens.ts       # Token management state
│   │   ├── theme.ts        # Theme management (dark/light mode)
│   │   ├── settings.ts     # User settings
│   │   └── subscription.ts # Subscription management
│   ├── layout/             # Layout components
│   │   └── MainLayout.vue  # Main application layout with API health banner
│   ├── router/             # Vue Router configuration
│   │   └── index.ts        # Route definitions
│   ├── views/              # Page components
│   │   ├── Home.vue        # Landing page
│   │   ├── TokenCreator.vue    # Token creation wizard
│   │   ├── TokenDashboard.vue  # Token management dashboard
│   │   ├── Settings.vue    # User settings
│   │   └── subscription/   # Subscription-related views
│   ├── utils/              # Utility functions
│   ├── test/               # Test setup files
│   ├── assets/             # Static assets (images, styles)
│   ├── main.ts             # Application entry point
│   ├── App.vue             # Root component
│   └── style.css           # Global styles (Tailwind CSS)
├── public/                 # Public static files
├── docker/                 # Docker configuration
├── k8s/                    # Kubernetes manifests
├── .github/                # GitHub Actions workflows
├── package.json            # Project dependencies
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Vitest test configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 💻 Development

### Available Scripts

- **`npm run dev`**: Start development server with hot-reload
- **`npm run build`**: Build for production (includes TypeScript type checking)
- **`npm run preview`**: Preview production build locally
- **`npm test`**: Run all tests once
- **`npm run test:watch`**: Run tests in watch mode
- **`npm run test:ui`**: Run tests with interactive UI
- **`npm run test:coverage`**: Generate test coverage report

### Development Workflow

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Make your changes**: The app will hot-reload automatically

3. **Run tests**: Ensure your changes don't break existing functionality
   ```bash
   npm test
   ```

4. **Type checking**: TypeScript errors will be shown in your IDE and during build

5. **Build for production**: 
   ```bash
   npm run build
   ```

### Technology Stack

- **Frontend Framework**: Vue 3 (Composition API with `<script setup>`)
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **Testing**: Vitest with Vue Test Utils
- **Styling**: Tailwind CSS with custom configuration
- **State Management**: Pinia
- **Router**: Vue Router
- **HTTP Client**: Axios
- **Backend Integration**: BiatecTokensApi with type-safe API client
- **Blockchain SDK**: Algorand SDK (algosdk)
- **Wallet Integration**: @txnlab/use-wallet-vue

## 🎨 Supported Token Standards

### Algorand Standards

| Standard | Type | Description |
|----------|------|-------------|
| **ASA** | Fungible | Native Algorand Standard Assets without ARC3 metadata |
| **ARC3 Fungible** | Fungible | ASA with built-in metadata support (name, symbol, URL, etc.) |
| **ARC3 NFT** | NFT | ASA NFT with metadata stored in IPFS (supply = 1) |
| **ARC3 Fractional NFT** | NFT | ASA NFT with fractional ownership support |
| **ARC200** | Fungible | Smart contract tokens compatible with ERC20 standards |
| **ARC72** | NFT | NFT standard with Ethereum-style functionality |

### Ethereum Standards

| Standard | Type | Description |
|----------|------|-------------|
| **ERC20** | Fungible | Standard Ethereum fungible tokens with full EVM compatibility |
| **ERC721** | NFT | Ethereum NFTs with rich metadata and ownership tracking |

## 🌐 Network Configuration

The application supports multiple Algorand-based networks:

### VOI Mainnet
- **Algod**: https://mainnet-api.voi.nodely.dev
- **Genesis ID**: voimain-v1.0
- **Use Case**: Production deployments on VOI network

### Aramid Mainnet
- **Algod**: https://algod.aramidmain.a-wallet.net
- **Genesis ID**: aramidmain-v1.0
- **Use Case**: Production deployments on Aramid network

### Dockernet (Local)
- **Algod**: http://localhost:4001
- **Genesis ID**: dockernet-v1
- **Use Case**: Local development and testing

> **Note**: Network selection and configuration is handled in `src/main.ts`

## 👛 Wallet Integration

Biatec Tokens integrates with multiple Algorand wallet providers:

- **Biatec Wallet**: Native integration with WalletConnect
- **Pera Wallet**: Popular Algorand mobile and web wallet
- **Defly Wallet**: Feature-rich Algorand wallet
- **Exodus**: Multi-chain wallet with Algorand support
- **Kibisis**: Browser extension wallet for Algorand
- **Lute Connect**: Algorand wallet with advanced features

### Connecting Your Wallet

1. Click "Connect Wallet" in the navigation bar
2. Select your preferred wallet provider
3. Approve the connection in your wallet
4. Start creating and managing tokens!

## 📦 Deployment

### Building for Production

```bash
npm run build
```

This command:
1. Runs TypeScript type checking (`vue-tsc -b`)
2. Builds the application with Vite
3. Outputs optimized files to the `dist/` directory

### Docker Deployment

Docker configuration is available in the `docker/` directory:

```bash
# Build Docker image
docker build -t biatec-tokens -f docker/Dockerfile .

# Run container
docker run -p 8080:80 biatec-tokens
```

### Kubernetes Deployment

Kubernetes manifests are available in the `k8s/` directory:

```bash
kubectl apply -f k8s/
```

## 🔄 CI/CD

The project uses GitHub Actions for continuous integration and deployment:

### Test Workflow

Runs on all pushes and pull requests:
1. **Install dependencies**: `npm ci`
2. **Run tests with coverage**: `npm run test:coverage`
3. **Verify coverage thresholds**: Minimum 70% required
4. **Build application**: `npm run build`

All checks must pass before merging. Coverage reports ensure code quality is maintained.

### Build and Deploy Workflow

Runs on all changes, deploys on main branch:
1. **Test Job**: Run all tests and build
2. **Deploy Job** (main branch only): Deploy to staging server via SSH

### Coverage Requirements

Pull requests must meet these minimum thresholds:
- ✅ 70% statement coverage
- ✅ 70% branch coverage
- ✅ 70% function coverage
- ✅ 70% line coverage

Current coverage: **84.65%** (exceeding requirements)

To verify your changes will pass CI:
```bash
npm run test:coverage && npm run build
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | No | `http://localhost:5000/api` |
| `VITE_ALGOD_URL` | Algorand node API URL | No | Configured per network in main.ts |
| `VITE_ALGOD_TOKEN` | Algorand node API token | No | Empty for public nodes |
| `VITE_INDEXER_URL` | Algorand indexer URL | No | - |
| `VITE_INDEXER_TOKEN` | Algorand indexer token | No | - |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key (for subscriptions) | No | - |

> **Note**: `VITE_API_BASE_URL` connects the frontend to the BiatecTokensApi backend. See [Backend API Integration](#-backend-api-integration) section for more details.

### Wallet Configuration

Wallet providers are configured in `src/main.ts`:

```typescript
app.use(WalletManagerPlugin, {
  wallets: [
    { id: WalletId.BIATEC, options: { projectId: 'your-project-id' } },
    WalletId.PERA,
    WalletId.DEFLY,
    // ... other wallets
  ],
  networks: networks,
  defaultNetwork: NetworkId.TESTNET,
});
```

## 📚 Documentation

Comprehensive guides and documentation are available in the `docs/` directory:

### General Documentation
- **[Wallet Integration Guide](docs/WALLET_INTEGRATION.md)** - Complete guide for wallet integration, including setup, usage, and troubleshooting
- **[MICA Wallet Integration Checklist](docs/MICA_WALLET_INTEGRATION_CHECKLIST.md)** - Vision-aligned checklist for MICA-compliant wallet integration with acceptance criteria, UX flows, and security considerations

### Business Value & Compliance
- **[MICA Whitelist Business Value](docs/MICA_WHITELIST_BUSINESS_VALUE.md)** - ROI analysis and compliance requirements for MICA whitelist management
- **[Enterprise Guide](docs/ENTERPRISE_GUIDE_BUSINESS_VALUE.md)** - Enterprise features and business value proposition
- **[RWA Compliance Presets](docs/RWA_COMPLIANCE_PRESETS_BUSINESS_VALUE.md)** - Real-world asset compliance templates
- **[Network Switching](docs/NETWORK_SWITCHING_BUSINESS_VALUE.md)** - Multi-network support and business impact

### Technical Guides
- **[API Integration Examples](docs/API_INTEGRATION_EXAMPLES.md)** - Backend API integration patterns and examples
- **[Branch Protection Setup](docs/BRANCH_PROTECTION_SETUP.md)** - Repository security and CI/CD configuration

## 🤝 Contributing

We welcome contributions to Biatec Tokens! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. **Run tests**: `npm run test:coverage` (must pass with 70%+ coverage)
5. **Run type checking**: `npm run build` (must succeed)
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Before Submitting a PR

Ensure all CI checks will pass:

```bash
# 1. Run tests with coverage (must meet 70% thresholds)
npm run test:coverage

# 2. Verify build succeeds (no TypeScript errors)
npm run build

# If both pass, you're ready to submit! ✅
```

### Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **Vue Components**: Use Composition API with `<script setup>`
- **Styling**: Follow Tailwind CSS utility-first approach
- **Formatting**: Code is formatted with Prettier (configuration in project)

### Commit Messages

Follow conventional commits format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## 🐛 Troubleshooting

### Common Issues

#### Wallet Connection Fails
- **Solution**: Ensure you have the latest version of your wallet installed
- Check that you're on the correct network (mainnet/testnet)
- Clear browser cache and try again

#### Build Errors
- **Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install`
- Ensure you're using Node.js 18.x or higher
- Check that all required environment variables are set

#### TypeScript Errors
- **Solution**: Run `npm run build` to see detailed error messages
- Ensure all dependencies are installed correctly
- Check `tsconfig.json` for proper configuration

#### Module Not Found Errors
- **Solution**: Some wallet libraries require Buffer polyfills (already configured in `src/main.ts`)
- If you add new dependencies, ensure they're compatible with Vite

### Getting Help

- **Issues**: Open an issue on [GitHub Issues](https://github.com/scholtz/biatec-tokens/issues)
- **Discussions**: Join discussions on [GitHub Discussions](https://github.com/scholtz/biatec-tokens/discussions)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contact & Support

- **Repository**: [https://github.com/scholtz/biatec-tokens](https://github.com/scholtz/biatec-tokens)
- **Author**: [@scholtz](https://github.com/scholtz)

---

<div align="center">
  <p>Built with ❤️ for the Algorand ecosystem</p>
  <p>Powered by Vue 3, TypeScript, and Vite</p>
</div>
