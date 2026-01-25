import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { TokenAttestationMetadata } from "../types/compliance";

export interface Token {
  id: string;
  name: string;
  symbol: string;
  standard: "ASA" | "ARC3FT" | "ARC3NFT" | "ARC3FNFT" | "ARC19" | "ARC69" | "ARC200" | "ARC72" | "ERC20" | "ERC721";
  type: "FT" | "NFT";
  supply: number;
  decimals?: number;
  description: string;
  imageUrl?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  status: "created" | "deploying" | "deployed" | "failed";
  createdAt: Date;
  txId?: string;
  assetId?: number;
  contractAddress?: string;
  attestationMetadata?: TokenAttestationMetadata;
}

export interface TokenTemplate {
  id: string;
  name: string;
  description: string;
  standard: Token["standard"];
  type: Token["type"];
  network: "VOI" | "Aramid" | "Both";
  compliance: string;
  guidance: string;
  defaults: {
    supply: number;
    decimals?: number;
    description: string;
  };
  useCases: string[];
  micaCompliant: boolean;
  isRwaPreset?: boolean;
  rwaFeatures?: {
    whitelistEnabled: boolean;
    transferRestrictions: boolean;
    issuerControls: boolean;
    kycRequired: boolean;
    jurisdictionRestrictions: boolean;
  };
  complianceImplications?: string[];
}

export interface NetworkGuidance {
  name: "VOI" | "Aramid";
  displayName: string;
  description: string;
  fees: {
    creation: string;
    transaction: string;
    description: string;
  };
  metadataHosting: {
    recommended: string[];
    description: string;
  };
  compliance: {
    considerations: string[];
    micaRelevance: string;
  };
  bestFor: string[];
}

export interface TokenStandard {
  name: string;
  type: string;
  description: string;
  detailedDescription: string;
  icon: any;
  bgClass: string;
  badgeVariant: "default" | "info" | "success" | "warning" | "error";
  statusColor: string;
  network: string;
  count: number;
  pros: string[];
  cons: string[];
  useWhen: string[];
  features?: TokenStandardFeatures;
}

/**
 * Feature comparison data for token standards
 */
export interface TokenStandardFeatures {
  /** Whether the standard supports rich metadata (images, descriptions, etc.) */
  metadataSupport: boolean;
  /** Whether the standard is implemented as a smart contract */
  smartContract: boolean;
  /** Whether the standard supports whitelisting/restricted transfers */
  whitelisting: boolean;
  /** Whether the standard has built-in compliance flag capabilities */
  complianceFlags: boolean;
  /** Whether the standard supports automatic royalty payments */
  royalties: boolean;
  /** Whether token metadata can be modified after creation */
  mutableMetadata: boolean;
  /** Whether the standard supports custom programmable logic */
  programmableLogic: boolean;
  /** Whether the standard is native Layer-1 (vs smart contract) */
  nativeL1: boolean;
  /** Optional: Whether the standard is compatible with ERC20 (fungible tokens) */
  erc20Compatible?: boolean;
  /** Optional: Whether the standard is compatible with ERC721 (NFTs) */
  erc721Compatible?: boolean;
  /** Optional: Whether the standard supports fractional ownership (for NFTs) */
  fractionalOwnership?: boolean;
}

import { CubeIcon, CurrencyDollarIcon, PhotoIcon } from "@heroicons/vue/24/outline";

export const useTokenStore = defineStore("tokens", () => {
  const tokens = ref<Token[]>([]);
  const isLoading = ref(false);

  const tokensByStandard = computed(() => {
    const grouped = tokens.value.reduce(
      (acc, token) => {
        if (!acc[token.standard]) {
          acc[token.standard] = [];
        }
        acc[token.standard].push(token);
        return acc;
      },
      {} as Record<string, Token[]>
    );
    return grouped;
  });

  const totalTokens = computed(() => tokens.value.length);
  const deployedTokens = computed(() => tokens.value.filter((t) => t.status === "deployed").length);
  const failedTokens = computed(() => tokens.value.filter((t) => t.status === "failed").length);

  const createToken = async (tokenData: Omit<Token, "id" | "status" | "createdAt">) => {
    isLoading.value = true;

    try {
      const newToken: Token = {
        ...tokenData,
        id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: "deploying",
        createdAt: new Date(),
      };

      tokens.value.push(newToken);

      // Simulate deployment process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock successful deployment
      const tokenIndex = tokens.value.findIndex((t) => t.id === newToken.id);
      if (tokenIndex !== -1) {
        tokens.value[tokenIndex].status = "deployed";
        tokens.value[tokenIndex].txId = `tx_${Math.random().toString(36).substr(2, 20)}`;

        if (newToken.standard.startsWith("ARC")) {
          tokens.value[tokenIndex].assetId = Math.floor(Math.random() * 1000000) + 100000;
        } else {
          tokens.value[tokenIndex].contractAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
        }
      }

      return newToken;
    } catch (error) {
      console.error("Failed to create token:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteToken = (tokenId: string) => {
    const index = tokens.value.findIndex((t) => t.id === tokenId);
    if (index !== -1) {
      tokens.value.splice(index, 1);
    }
  };

  const updateTokenStatus = (tokenId: string, status: Token["status"]) => {
    const token = tokens.value.find((t) => t.id === tokenId);
    if (token) {
      token.status = status;
    }
  };
  const tokenTemplates: TokenTemplate[] = [
    {
      id: "voi-utility-token",
      name: "VOI Utility Token",
      description: "Standard utility token for VOI network - perfect for rewards, governance, or platform currencies",
      standard: "ARC3FT",
      type: "FT",
      network: "VOI",
      compliance: "Suitable for utility tokens under MICA regulation. Ensure proper disclosures about token purpose and rights.",
      guidance: "Best for: Platform rewards, in-app currency, governance tokens. Recommended decimals: 6 for standard divisibility.",
      defaults: {
        supply: 1000000,
        decimals: 6,
        description: "A utility token for the VOI ecosystem, designed for seamless integration with dApps and services.",
      },
      useCases: ["Platform rewards", "Governance voting", "Service payments", "In-app currency"],
      micaCompliant: true,
    },
    {
      id: "aramid-payment-token",
      name: "Aramid Payment Token",
      description: "Payment-focused token for Aramid network - ideal for e-commerce and cross-border transactions",
      standard: "ARC3FT",
      type: "FT",
      network: "Aramid",
      compliance: "E-money tokens under MICA require authorization from relevant authorities. Ensure compliance with payment service regulations.",
      guidance: "Best for: Payment systems, remittances, e-commerce. Higher decimals (8-18) recommended for precise value representation.",
      defaults: {
        supply: 10000000,
        decimals: 8,
        description: "A payment token built on Aramid network for fast, secure, and low-cost transactions.",
      },
      useCases: ["E-commerce payments", "Cross-border transfers", "Merchant solutions", "Remittance services"],
      micaCompliant: true,
    },
    {
      id: "voi-security-token",
      name: "VOI Security Token",
      description: "Security token for VOI network - compliant structure for asset-backed or equity tokens",
      standard: "ARC200",
      type: "FT",
      network: "VOI",
      compliance: "Asset-referenced tokens under MICA require prospectus and authorization. Consult legal counsel for securities compliance.",
      guidance: "Best for: Equity representation, asset-backed tokens, tokenized securities. Requires KYC/AML procedures and proper documentation.",
      defaults: {
        supply: 1000000,
        decimals: 0,
        description: "A security token representing ownership or rights in accordance with applicable securities regulations.",
      },
      useCases: ["Equity tokens", "Asset-backed tokens", "Real estate tokens", "Fund shares"],
      micaCompliant: true,
    },
    {
      id: "aramid-loyalty-token",
      name: "Aramid Loyalty Token",
      description: "Loyalty rewards token for Aramid network - engage customers with blockchain-based rewards",
      standard: "ASA",
      type: "FT",
      network: "Aramid",
      compliance: "Loyalty tokens typically exempt from MICA if non-transferable outside closed ecosystem. Review portability restrictions.",
      guidance: "Best for: Customer loyalty programs, rewards systems, membership benefits. Lower supply recommended for exclusive programs.",
      defaults: {
        supply: 500000,
        decimals: 2,
        description: "A loyalty token designed to reward customer engagement and build long-term relationships.",
      },
      useCases: ["Customer rewards", "Membership programs", "Brand loyalty", "Partner ecosystems"],
      micaCompliant: true,
    },
    {
      id: "voi-nft-collection",
      name: "VOI NFT Collection",
      description: "Non-fungible token collection for VOI network - perfect for digital art, collectibles, and unique assets",
      standard: "ARC3NFT",
      type: "NFT",
      network: "VOI",
      compliance: "NFTs generally outside core MICA scope unless fungible. Ensure intellectual property rights and consumer protection compliance.",
      guidance: "Best for: Digital art, collectibles, certificates, gaming assets. Supply of 1 for unique items, higher for limited editions.",
      defaults: {
        supply: 1,
        decimals: 0,
        description: "A unique digital collectible with verified ownership and provenance on the VOI blockchain.",
      },
      useCases: ["Digital art", "Collectibles", "Gaming items", "Certificates", "Event tickets"],
      micaCompliant: true,
    },
    {
      id: "aramid-fractional-nft",
      name: "Aramid Fractional NFT",
      description: "Fractional ownership NFT for Aramid network - enable shared ownership of high-value assets",
      standard: "ARC3FNFT",
      type: "NFT",
      network: "Aramid",
      compliance: "Fractional NFTs may trigger securities regulations if representing investment rights. Not automatically MICA-compliant - requires legal review and may need prospectus approval. Consult legal counsel before deployment.",
      guidance: "Best for: Shared ownership of real estate, art, or luxury items. Use decimals to define fraction size.",
      defaults: {
        supply: 1000000,
        decimals: 6,
        description: "A fractional NFT enabling shared ownership of a valuable asset with transparent, on-chain governance.",
      },
      useCases: ["Fractional real estate", "Art ownership", "Luxury goods", "Revenue-sharing assets"],
      micaCompliant: false,
    },
    {
      id: "voi-mutable-nft",
      name: "VOI Mutable NFT (ARC-19)",
      description: "Dynamic NFT with updatable metadata for VOI network - perfect for evolving digital assets",
      standard: "ARC19",
      type: "NFT",
      network: "VOI",
      compliance: "Mutable NFTs must maintain clear disclosure about mutability rights and conditions. Ensure transparency about who can update metadata and under what circumstances.",
      guidance: "Best for: Evolving collectibles, gaming assets that level up, membership passes, dynamic art. Use Reserve Address to control metadata updates.",
      defaults: {
        supply: 1,
        decimals: 0,
        description: "A mutable NFT with updatable metadata stored off-chain, enabling dynamic content evolution while maintaining on-chain ownership.",
      },
      useCases: ["Gaming assets", "Evolving art", "Membership passes", "Dynamic collectibles", "Achievement badges"],
      micaCompliant: true,
    },
    {
      id: "aramid-onchain-nft",
      name: "Aramid On-Chain NFT (ARC-69)",
      description: "Lightweight NFT with on-chain metadata for Aramid network - no external storage dependencies",
      standard: "ARC69",
      type: "NFT",
      network: "Aramid",
      compliance: "On-chain metadata NFTs offer transparency and permanence. Ensure metadata complies with content regulations and does not contain prohibited information.",
      guidance: "Best for: Simple collectibles, event tickets, certificates, proofs of attendance. Metadata must fit within 1024 bytes. Ideal when IPFS hosting is not desired.",
      defaults: {
        supply: 1,
        decimals: 0,
        description: "An on-chain NFT with metadata stored directly on the blockchain for maximum permanence and reliability.",
      },
      useCases: ["Event tickets", "Certificates", "Proof of attendance", "Simple collectibles", "Badges"],
      micaCompliant: true,
    },
    {
      id: "voi-arc200-utility",
      name: "VOI ARC-200 Utility Token",
      description: "Smart contract utility token for VOI network with programmable controls",
      standard: "ARC200",
      type: "FT",
      network: "VOI",
      compliance: "Utility tokens under MICA require clear disclosure of purpose and rights. Programmable controls enable future compliance features if needed.",
      guidance: "Best for: DeFi protocols, DAO governance, gaming economies. Programmable logic allows custom tokenomics and access control.",
      defaults: {
        supply: 10000000,
        decimals: 6,
        description: "A programmable utility token on VOI network with smart contract functionality for advanced use cases.",
      },
      useCases: ["DeFi protocols", "DAO governance", "Gaming tokens", "Programmable rewards"],
      micaCompliant: true,
    },
    {
      id: "aramid-arc200-payment",
      name: "Aramid ARC-200 Payment Token",
      description: "ARC-200 payment token for Aramid with transfer controls and compliance features",
      standard: "ARC200",
      type: "FT",
      network: "Aramid",
      compliance: "Payment tokens may require e-money authorization under MICA. Transfer controls enable regulatory compliance and sanctions screening.",
      guidance: "Best for: Payment systems, merchant solutions, B2B settlements. Built-in compliance controls for regulated payment use cases.",
      defaults: {
        supply: 50000000,
        decimals: 8,
        description: "An ARC-200 payment token with built-in transfer controls and compliance features for enterprise payment solutions.",
      },
      useCases: ["Payment processing", "B2B settlements", "Merchant solutions", "Regulated payments"],
      micaCompliant: true,
    },
    {
      id: "voi-arc200-governance",
      name: "VOI ARC-200 Governance Token",
      description: "Governance token with on-chain voting and delegation support for VOI",
      standard: "ARC200",
      type: "FT",
      network: "VOI",
      compliance: "Governance tokens require clear documentation of voting rights and limitations. Ensure governance model is transparent and well-documented.",
      guidance: "Best for: DAO governance, protocol voting, community decisions. Smart contract enables complex voting mechanisms and delegation.",
      defaults: {
        supply: 100000000,
        decimals: 6,
        description: "A governance token enabling on-chain voting and delegation for decentralized protocol management.",
      },
      useCases: ["DAO voting", "Protocol governance", "Community decisions", "Delegated voting"],
      micaCompliant: true,
    },
    {
      id: "aramid-arc200-stablecoin",
      name: "Aramid ARC-200 Stablecoin",
      description: "Programmable stablecoin with reserve management and compliance controls",
      standard: "ARC200",
      type: "FT",
      network: "Aramid",
      compliance: "Stablecoins require e-money or asset-referenced token authorization under MICA. Must maintain reserves and provide redemption rights. Smart contract controls facilitate regulatory compliance.",
      guidance: "Best for: Stable-value payments, DeFi collateral, trading pairs. Requires e-money license, reserve backing, and redemption infrastructure. Programmable controls enable whitelisting and transfer restrictions.",
      defaults: {
        supply: 100000000,
        decimals: 6,
        description: "A MICA-compliant stablecoin with programmable reserve management, transfer controls, and guaranteed redemption features.",
      },
      useCases: ["Stable payments", "DeFi collateral", "Remittances", "Reserve-backed currency"],
      micaCompliant: true,
    },
    {
      id: "voi-arc200-rewards",
      name: "VOI ARC-200 Rewards Token",
      description: "Rewards token with vesting and distribution controls for VOI ecosystem",
      standard: "ARC200",
      type: "FT",
      network: "VOI",
      compliance: "Rewards tokens generally outside core MICA scope if non-transferable or limited to ecosystem. Smart contract enables controlled distribution and vesting.",
      guidance: "Best for: Platform incentives, staking rewards, ecosystem growth. Programmable vesting schedules and distribution rules ensure fair token economics.",
      defaults: {
        supply: 50000000,
        decimals: 6,
        description: "A rewards token with built-in vesting and controlled distribution for ecosystem incentivization and growth.",
      },
      useCases: ["Staking rewards", "Platform incentives", "Ecosystem growth", "Liquidity mining"],
      micaCompliant: true,
    },
    {
      id: "aramid-arc200-security",
      name: "Aramid ARC-200 Security Token",
      description: "Security token with mandatory whitelisting and transfer restrictions for Aramid",
      standard: "ARC200",
      type: "FT",
      network: "Aramid",
      compliance: "Security tokens under MICA require prospectus approval and authorization. Mandatory KYC/AML, whitelisting, and transfer restrictions. Smart contract enforces compliance rules automatically.",
      guidance: "Best for: Equity tokens, asset-backed securities, regulated investment products. Requires legal opinion, prospectus, and regulatory authorization. Whitelisting and transfer controls mandatory.",
      defaults: {
        supply: 1000000,
        decimals: 0,
        description: "A fully compliant security token with mandatory whitelisting, KYC verification, and smart contract-enforced transfer restrictions.",
      },
      useCases: ["Equity tokenization", "Asset-backed securities", "Regulated investments", "Compliant fundraising"],
      micaCompliant: true,
    },
    {
      id: "cross-chain-bridge-token",
      name: "Cross-Chain Bridge Token",
      description: "Bridge token compatible with both VOI and Aramid networks",
      standard: "ARC200",
      type: "FT",
      network: "Both",
      compliance: "Bridge tokens facilitating cross-chain transfers must comply with MICA across all jurisdictions. Enhanced AML/CFT controls required.",
      guidance: "Best for: Cross-chain transfers, interoperability solutions. Requires robust bridge infrastructure and security audits.",
      defaults: {
        supply: 5000000,
        decimals: 6,
        description: "A bridge token enabling seamless asset transfers between VOI and Aramid networks.",
      },
      useCases: ["Cross-chain transfers", "Liquidity bridges", "Multi-chain dApps", "Interoperability solutions"],
      micaCompliant: true,
    },
    {
      id: "both-arc200-algorithmic-stablecoin",
      name: "ARC-200 Algorithmic Stablecoin",
      description: "Algorithmic stablecoin with price stability mechanisms on VOI/Aramid",
      standard: "ARC200",
      type: "FT",
      network: "Both",
      compliance: "Algorithmic stablecoins under MICA may require authorization as asset-referenced tokens. Must maintain adequate collateral backing and provide redemption mechanisms. Smart contract enforces algorithmic price stability through supply adjustments.",
      guidance: "Best for: Price-stable medium of exchange, DeFi collateral. Requires algorithmic stabilization mechanisms (supply expansion/contraction, collateral pools, arbitrage incentives). High decimals for precision. Works on both VOI and Aramid.",
      defaults: {
        supply: 1000000,
        decimals: 18,
        description: "An algorithmic stablecoin maintaining price stability through smart contract mechanisms and collateral backing.",
      },
      useCases: ["Stable payments", "DeFi collateral", "Trading pairs", "Savings instruments"],
      micaCompliant: true,
    },
    // RWA Compliance Presets
    {
      id: "rwa-security-token",
      name: "RWA Security Token (Whitelisted)",
      description: "MICA-compliant security token with mandatory KYC/AML whitelist for regulated asset tokenization",
      standard: "ARC200",
      type: "FT",
      network: "Both",
      isRwaPreset: true,
      rwaFeatures: {
        whitelistEnabled: true,
        transferRestrictions: true,
        issuerControls: true,
        kycRequired: true,
        jurisdictionRestrictions: true,
      },
      compliance: "Asset-referenced tokens under MICA require prospectus approval, authorization from competent authorities, and ongoing regulatory supervision. Full KYC/AML compliance mandatory.",
      guidance: "Best for: Tokenized securities, equity representation, regulated investment products. Requires legal opinion, prospectus, and authorization before deployment.",
      defaults: {
        supply: 1000000,
        decimals: 0,
        description: "A regulated security token representing ownership rights with mandatory whitelist and KYC verification for all participants.",
      },
      useCases: ["Equity tokenization", "Bond tokens", "Investment funds", "Regulated securities"],
      micaCompliant: true,
      complianceImplications: [
        "All token holders must complete KYC/AML verification before receiving tokens",
        "Transfers only permitted between whitelisted addresses",
        "Issuer maintains control to pause transfers or freeze accounts for compliance",
        "Geographic restrictions enforced based on regulatory authorization",
        "Real-time transfer validation against sanctions lists and jurisdiction rules",
        "Comprehensive audit trail maintained for all transactions",
        "Regular reporting to regulatory authorities required"
      ]
    },
    {
      id: "rwa-real-estate-token",
      name: "RWA Real Estate Token",
      description: "Fractional real estate ownership with transfer restrictions and accredited investor verification",
      standard: "ARC200",
      type: "FT",
      network: "Aramid",
      isRwaPreset: true,
      rwaFeatures: {
        whitelistEnabled: true,
        transferRestrictions: true,
        issuerControls: true,
        kycRequired: true,
        jurisdictionRestrictions: true,
      },
      compliance: "Real estate tokens typically qualify as securities under MICA. Requires authorization, investor accreditation verification, and compliance with property law. May require real estate fund authorization.",
      guidance: "Best for: Tokenized property ownership, REITs, fractional real estate. Requires property legal structure, custody arrangements, and accredited investor verification.",
      defaults: {
        supply: 10000000,
        decimals: 6,
        description: "A fractional real estate ownership token with restricted transfers and mandatory investor verification for compliant property tokenization.",
      },
      useCases: ["Commercial real estate", "Residential property tokens", "REIT tokenization", "Property fractional ownership"],
      micaCompliant: true,
      complianceImplications: [
        "Enhanced KYC including accredited investor status verification",
        "Transfer lockup periods enforced by smart contract",
        "Secondary transfers require issuer approval and compliance check",
        "Automatic distribution of rental income or property proceeds",
        "Legal ownership structure must comply with local property law",
        "Issuer controls enable forced buybacks or redemptions if required",
        "Property valuation and custody documentation required"
      ]
    },
    {
      id: "rwa-emoney-token",
      name: "RWA E-Money Token",
      description: "MICA e-money token with reserve requirements, redemption rights, and payment controls",
      standard: "ARC200",
      type: "FT",
      network: "Aramid",
      isRwaPreset: true,
      rwaFeatures: {
        whitelistEnabled: true,
        transferRestrictions: false,
        issuerControls: true,
        kycRequired: true,
        jurisdictionRestrictions: true,
      },
      compliance: "E-money tokens under MICA require e-money institution authorization. Must maintain 1:1 reserves in segregated accounts, provide redemption at par value, and comply with payment service regulations.",
      guidance: "Best for: Digital currency, payment tokens, remittances. Requires e-money institution license, reserve management, and redemption infrastructure.",
      defaults: {
        supply: 100000000,
        decimals: 2,
        description: "A MICA-compliant e-money token backed by fiat reserves with guaranteed redemption at par value and payment service capabilities.",
      },
      useCases: ["Digital payments", "Cross-border remittances", "Merchant payments", "B2B settlements"],
      micaCompliant: true,
      complianceImplications: [
        "Requires e-money institution authorization under MICA",
        "1:1 fiat reserves maintained in segregated, safeguarded accounts",
        "Holders have legal right to redeem at par value at any time",
        "KYC required for issuance, optional whitelist for transactions",
        "Issuer controls enable transaction monitoring and sanctions screening",
        "Regular reserve audits and public disclosure required",
        "Compliance with payment service regulations (PSD2 in EU)",
        "Customer funds protection and deposit insurance considerations"
      ]
    },
    {
      id: "rwa-carbon-credit",
      name: "RWA Carbon Credit Token",
      description: "Tokenized carbon credits with registry linkage, transfer tracking, and retirement controls",
      standard: "ARC200",
      type: "FT",
      network: "VOI",
      isRwaPreset: true,
      rwaFeatures: {
        whitelistEnabled: false,
        transferRestrictions: true,
        issuerControls: true,
        kycRequired: false,
        jurisdictionRestrictions: false,
      },
      compliance: "Carbon credits may fall under environmental commodity regulations. Requires linkage to certified carbon registry, transparent tracking, and retirement mechanism to prevent double-counting.",
      guidance: "Best for: Verified carbon offsets, renewable energy credits, environmental commodities. Requires certification from recognized registry (Gold Standard, Verra, etc.).",
      defaults: {
        supply: 1000000,
        decimals: 3,
        description: "A tokenized carbon credit representing verified emissions reductions with registry linkage and transparent retirement tracking.",
      },
      useCases: ["Carbon offset trading", "Corporate sustainability", "Renewable energy credits", "Environmental commodities"],
      micaCompliant: true,
      complianceImplications: [
        "Each token backed by verified carbon credit in recognized registry",
        "Transfer restrictions prevent retired credits from re-entering circulation",
        "Issuer controls enable permanent retirement when credits are used",
        "Transparent tracking of credit vintage, project, and methodology",
        "Integration with carbon registries (Gold Standard, Verra, ACR, etc.)",
        "Prevents double-counting through blockchain transparency",
        "May require commodity trading license depending on jurisdiction"
      ]
    },
    {
      id: "rwa-supply-chain-token",
      name: "RWA Supply Chain Asset Token",
      description: "Tokenized supply chain assets with provenance tracking and controlled transfer",
      standard: "ARC3FT",
      type: "FT",
      network: "Both",
      isRwaPreset: true,
      rwaFeatures: {
        whitelistEnabled: true,
        transferRestrictions: true,
        issuerControls: true,
        kycRequired: true,
        jurisdictionRestrictions: false,
      },
      compliance: "Supply chain tokens representing physical assets require proof of custody, insurance, and trade compliance. May trigger commodity or warehouse receipt regulations.",
      guidance: "Best for: Invoice factoring, commodity tokenization, warehouse receipts, trade finance. Requires custody verification and trade documentation.",
      defaults: {
        supply: 5000000,
        decimals: 4,
        description: "A supply chain asset token with provenance tracking and restricted transfers for compliant trade finance and commodity tokenization.",
      },
      useCases: ["Invoice factoring", "Commodity tokens", "Warehouse receipts", "Trade finance"],
      micaCompliant: true,
      complianceImplications: [
        "Whitelist restricted to verified supply chain participants",
        "Transfer validation ensures custody chain integrity",
        "Issuer controls enable recall for quality or compliance issues",
        "Integration with physical asset custody and insurance",
        "Trade compliance checking (export controls, sanctions)",
        "Audit trail links on-chain tokens to physical asset documentation",
        "May require commodity trading or warehouse license"
      ]
    },
  ];

  const networkGuidance: NetworkGuidance[] = [
    {
      name: "VOI",
      displayName: "VOI Network",
      description: "High-performance blockchain optimized for DeFi and utility tokens with fast finality",
      fees: {
        creation: "~0.1 VOI",
        transaction: "~0.001 VOI",
        description: "VOI offers minimal transaction costs, making it ideal for high-volume applications and microtransactions"
      },
      metadataHosting: {
        recommended: ["IPFS", "Arweave", "VOI native storage"],
        description: "Store token metadata on decentralized networks for permanence and censorship resistance. VOI native storage recommended for best integration."
      },
      compliance: {
        considerations: [
          "Ensure KYC/AML procedures for security tokens",
          "Maintain transparent token documentation",
          "Implement proper disclosure of token rights and limitations",
          "Consider data protection requirements (GDPR)"
        ],
        micaRelevance: "VOI tokens must comply with MICA regulations when operating in EU markets. Utility tokens require proper disclosure of purpose and limitations."
      },
      bestFor: ["DeFi applications", "Gaming tokens", "DAO governance", "High-frequency trading"]
    },
    {
      name: "Aramid",
      displayName: "Aramid Network",
      description: "Enterprise-grade blockchain designed for regulated assets and cross-border payments",
      fees: {
        creation: "~0.2 ARAMID",
        transaction: "~0.002 ARAMID",
        description: "Aramid provides predictable fee structure suitable for enterprise applications and regulated environments"
      },
      metadataHosting: {
        recommended: ["IPFS", "Arweave", "Private enterprise storage", "Aramid certified providers"],
        description: "Use certified metadata providers for compliance requirements. Enterprise storage options available for regulated use cases."
      },
      compliance: {
        considerations: [
          "Enhanced KYC/AML requirements for payment tokens",
          "Reserve requirements for stablecoins",
          "Regular compliance audits recommended",
          "Maintain audit trail for all transactions",
          "Implement geo-blocking if required by regulations"
        ],
        micaRelevance: "Aramid is optimized for MICA-compliant tokens. E-money tokens and asset-referenced tokens require authorization and reserve management."
      },
      bestFor: ["Payment systems", "Stablecoins", "Security tokens", "Cross-border transfers", "Regulated assets"]
    }
  ];

  const tokenStandards: TokenStandard[] = [
    {
      name: "ASA",
      type: "Fungible",
      description: "Native Algorand Standard Asset - lightweight, fast, and cost-effective fungible token without metadata",
      detailedDescription: "ASA is the foundational token standard on Algorand-based chains. It provides native Layer-1 token functionality with minimal fees and instant finality. Best for simple fungible tokens that don't require complex metadata or smart contract logic.",
      icon: CubeIcon,
      bgClass: "bg-gray-500",
      badgeVariant: "default" as const,
      statusColor: "bg-gray-500",
      network: "Algorand",
      count: 0,
      pros: ["Lowest fees", "Native Layer-1", "Instant finality", "Simple implementation"],
      cons: ["No metadata support", "Limited functionality", "No smart contract features"],
      useWhen: ["You need a simple fungible token", "Cost efficiency is critical", "Metadata is not required"],
      features: {
        metadataSupport: false,
        smartContract: false,
        whitelisting: false,
        complianceFlags: false,
        royalties: false,
        mutableMetadata: false,
        programmableLogic: false,
        nativeL1: true,
      }
    },
    {
      name: "ARC3FT",
      type: "Fungible",
      description: "Algorand Standard Asset with ARC3 metadata standard - includes rich token information and visual assets",
      detailedDescription: "ARC3 extends ASA with comprehensive metadata support stored on IPFS. Ideal for tokens requiring branding, detailed descriptions, and visual identity. Fully compatible with wallets and explorers supporting ARC3.",
      icon: CurrencyDollarIcon,
      bgClass: "bg-blue-500",
      badgeVariant: "info" as const,
      statusColor: "bg-blue-500",
      network: "Algorand",
      count: 0,
      pros: ["Rich metadata support", "Wallet compatibility", "Native Layer-1 speed", "IPFS integration"],
      cons: ["Requires IPFS hosting", "Slightly higher setup cost", "Metadata is immutable"],
      useWhen: ["You need token branding/logo", "Metadata is important", "Wallet display matters", "Building consumer-facing tokens"],
      features: {
        metadataSupport: true,
        smartContract: false,
        whitelisting: false,
        complianceFlags: false,
        royalties: false,
        mutableMetadata: false,
        programmableLogic: false,
        nativeL1: true,
      }
    },
    {
      name: "ARC3NFT",
      type: "NFT",
      description: "True NFT standard with unique supply of 1 - perfect for digital art, certificates, and collectibles",
      detailedDescription: "ARC3 NFT enforces true non-fungibility with a supply of exactly 1. Metadata includes artwork, properties, and provenance stored on IPFS. Widely supported across Algorand ecosystem wallets and marketplaces.",
      icon: CubeIcon,
      bgClass: "bg-orange-500",
      badgeVariant: "info" as const,
      statusColor: "bg-orange-500",
      network: "Algorand",
      count: 0,
      pros: ["True uniqueness (supply = 1)", "Full metadata support", "Marketplace compatible", "Proven standard"],
      cons: ["Not fractionizable", "Requires IPFS", "Fixed supply post-creation"],
      useWhen: ["Creating unique digital art", "Issuing certificates", "Building collectibles", "Single-owner assets"],
      features: {
        metadataSupport: true,
        smartContract: false,
        whitelisting: false,
        complianceFlags: false,
        royalties: false,
        mutableMetadata: false,
        programmableLogic: false,
        nativeL1: true,
        fractionalOwnership: false,
      }
    },
    {
      name: "ARC3FNFT",
      type: "NFT",
      description: "Fractional NFT enabling shared ownership - split valuable assets into tradeable fractions",
      detailedDescription: "ARC3 Fractional NFT allows multiple owners to hold portions of a single asset. Supply equals 10^decimals for precise fractional division. Ideal for high-value assets requiring shared ownership models.",
      icon: CubeIcon,
      bgClass: "bg-orange-200",
      badgeVariant: "info" as const,
      statusColor: "bg-orange-200",
      network: "Algorand",
      count: 0,
      pros: ["Shared ownership model", "Divisible into fractions", "Liquidity for high-value assets", "NFT metadata retained"],
      cons: ["Complex legal considerations", "May trigger securities laws", "Requires governance model"],
      useWhen: ["Fractionalizing expensive assets", "Creating shared ownership", "Building investment vehicles", "Real estate tokenization"],
      features: {
        metadataSupport: true,
        smartContract: false,
        whitelisting: false,
        complianceFlags: false,
        royalties: false,
        mutableMetadata: false,
        programmableLogic: false,
        nativeL1: true,
        fractionalOwnership: true,
      }
    },
    {
      name: "ARC19",
      type: "NFT",
      description: "Mutable NFT with templated URLs - update metadata after minting via reserve address",
      detailedDescription: "ARC19 enables NFT metadata mutability by using templated Asset URLs that reference the Reserve Address. Change NFT content by updating the Reserve Address, allowing dynamic or evolving NFTs while maintaining on-chain provenance.",
      icon: PhotoIcon,
      bgClass: "bg-teal-500",
      badgeVariant: "info" as const,
      statusColor: "bg-teal-500",
      network: "Algorand",
      count: 0,
      pros: ["Mutable metadata", "Dynamic NFT content", "On-chain mutability control", "Combines well with ARC-3"],
      cons: ["Requires Reserve Address management", "More complex setup", "Must maintain metadata infrastructure"],
      useWhen: ["Need updatable NFT metadata", "Building evolving collectibles", "Creating dynamic game assets", "Require content versioning"],
      features: {
        metadataSupport: true,
        smartContract: false,
        whitelisting: false,
        complianceFlags: false,
        royalties: false,
        mutableMetadata: true,
        programmableLogic: false,
        nativeL1: true,
        fractionalOwnership: false,
      }
    },
    {
      name: "ARC69",
      type: "NFT",
      description: "On-chain metadata NFT - lightweight metadata stored directly in transaction notes",
      detailedDescription: "ARC69 stores NFT metadata on-chain in the transaction NOTE field (max 1024 bytes), eliminating the need for external metadata storage. Ideal for simple NFTs with lightweight metadata that require fast, reliable access.",
      icon: PhotoIcon,
      bgClass: "bg-cyan-500",
      badgeVariant: "info" as const,
      statusColor: "bg-cyan-500",
      network: "Algorand",
      count: 0,
      pros: ["On-chain metadata", "No IPFS required", "Fast metadata access", "Simple implementation"],
      cons: ["1024 byte metadata limit", "Less flexible than ARC-3", "Metadata size constrained"],
      useWhen: ["Need fully on-chain NFTs", "Metadata is simple/small", "Want to avoid IPFS dependencies", "Building lightweight collectibles"],
      features: {
        metadataSupport: true,
        smartContract: false,
        whitelisting: false,
        complianceFlags: false,
        royalties: false,
        mutableMetadata: false,
        programmableLogic: false,
        nativeL1: true,
        fractionalOwnership: false,
      }
    },
    {
      name: "ARC200",
      type: "Fungible",
      description: "Smart contract token with ERC20-like functionality - programmable logic and advanced features",
      detailedDescription: "ARC200 provides ERC20-compatible functionality through smart contracts. Enables complex tokenomics, access control, minting/burning logic, and custom transfer rules. Best for tokens requiring programmable behavior.",
      icon: CurrencyDollarIcon,
      bgClass: "bg-green-500",
      badgeVariant: "success" as const,
      statusColor: "bg-green-500",
      network: "Algorand",
      count: 0,
      pros: ["Programmable logic", "ERC20 compatibility", "Custom tokenomics", "Advanced features"],
      cons: ["Higher fees than ASA", "Requires smart contract development", "More complex deployment"],
      useWhen: ["Need programmable tokenomics", "Require access control", "Building DeFi protocols", "Need minting/burning logic"],
      features: {
        metadataSupport: true,
        smartContract: true,
        whitelisting: true,
        complianceFlags: true,
        royalties: false,
        mutableMetadata: false,
        programmableLogic: true,
        nativeL1: false,
        erc20Compatible: true,
      }
    },
    {
      name: "ARC72",
      type: "NFT",
      description: "Advanced NFT standard with ERC721-style features - dynamic metadata and enhanced functionality",
      detailedDescription: "ARC72 brings Ethereum's ERC721 capabilities to Algorand. Supports mutable metadata, royalties, and advanced NFT features. Ideal for gaming, evolving collectibles, and applications requiring dynamic NFT properties.",
      icon: PhotoIcon,
      bgClass: "bg-purple-500",
      badgeVariant: "default" as const,
      statusColor: "bg-green-500",
      network: "Algorand",
      count: 0,
      pros: ["Mutable metadata", "Royalty support", "ERC721 compatibility", "Advanced NFT features"],
      cons: ["Smart contract complexity", "Higher fees", "Newer standard with evolving support"],
      useWhen: ["Need dynamic metadata", "Building NFT games", "Require royalty mechanisms", "Need ERC721 compatibility"],
      features: {
        metadataSupport: true,
        smartContract: true,
        whitelisting: false,
        complianceFlags: false,
        royalties: true,
        mutableMetadata: true,
        programmableLogic: true,
        nativeL1: false,
        erc721Compatible: true,
      }
    },
    {
      name: "ERC20",
      type: "Fungible",
      description: "Industry-standard Ethereum fungible token - maximum ecosystem compatibility and tooling",
      detailedDescription: "ERC20 is the most widely adopted fungible token standard in blockchain. Full EVM compatibility means extensive tooling, wallet support, and DeFi integration. Best for Ethereum-native applications and cross-chain bridges.",
      icon: CurrencyDollarIcon,
      bgClass: "bg-yellow-500",
      badgeVariant: "warning" as const,
      statusColor: "bg-yellow-500",
      network: "Ethereum",
      count: 0,
      pros: ["Widest adoption", "Extensive tooling", "DeFi integration", "Maximum compatibility"],
      cons: ["Higher gas fees", "Network congestion", "Ethereum-only"],
      useWhen: ["Need Ethereum ecosystem", "Maximum DeFi compatibility", "Building on EVM", "Cross-chain bridges"],
      features: {
        metadataSupport: true,
        smartContract: true,
        whitelisting: true,
        complianceFlags: true,
        royalties: false,
        mutableMetadata: false,
        programmableLogic: true,
        nativeL1: false,
        erc20Compatible: true,
      }
    },
    {
      name: "ERC721",
      type: "NFT",
      description: "Ethereum NFT standard - vast marketplace support and proven track record",
      detailedDescription: "ERC721 pioneered NFT standards and remains the most supported format. Deep integration with NFT marketplaces, galleries, and tools. The go-to choice for Ethereum-native NFT projects with maximum discoverability.",
      icon: PhotoIcon,
      bgClass: "bg-pink-500",
      badgeVariant: "error" as const,
      statusColor: "bg-yellow-500",
      network: "Ethereum",
      count: 0,
      pros: ["Largest NFT ecosystem", "Maximum marketplace support", "Proven standard", "Rich tooling"],
      cons: ["High gas fees", "Ethereum network limitations", "Not suitable for high-volume"],
      useWhen: ["Targeting Ethereum NFT market", "Need marketplace visibility", "Building on Ethereum", "Premium NFT projects"],
      features: {
        metadataSupport: true,
        smartContract: true,
        whitelisting: false,
        complianceFlags: false,
        royalties: true,
        mutableMetadata: true,
        programmableLogic: true,
        nativeL1: false,
        erc721Compatible: true,
      }
    },
  ];
  
  // Computed properties to filter templates
  const rwaTokenTemplates = computed(() => 
    tokenTemplates.filter(t => t.isRwaPreset === true)
  );
  
  const standardTokenTemplates = computed(() => 
    tokenTemplates.filter(t => !t.isRwaPreset)
  );
  
  return {
    tokens,
    tokensByStandard,
    isLoading,
    totalTokens,
    deployedTokens,
    failedTokens,
    createToken,
    deleteToken,
    updateTokenStatus,
    tokenStandards,
    tokenTemplates,
    rwaTokenTemplates,
    standardTokenTemplates,
    networkGuidance,
  };
});
