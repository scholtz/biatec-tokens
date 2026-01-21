import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Token {
  id: string;
  name: string;
  symbol: string;
  standard: "ASA" | "ARC3FT" | "ARC3NFT" | "ARC3FNFT" | "ARC200" | "ARC72" | "ERC20" | "ERC721";
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
      id: "stablecoin-template",
      name: "Algorithmic Stablecoin",
      description: "Stablecoin template with mechanisms for price stability on VOI/Aramid",
      standard: "ARC200",
      type: "FT",
      network: "Both",
      compliance: "Stablecoins under MICA require authorization as e-money tokens or asset-referenced tokens. Reserve requirements and redemption rights mandatory.",
      guidance: "Best for: Price-stable medium of exchange. Requires collateral management and stability mechanisms. High decimals for precision.",
      defaults: {
        supply: 1000000,
        decimals: 18,
        description: "A stablecoin maintaining price stability through algorithmic mechanisms and collateral backing.",
      },
      useCases: ["Stable payments", "DeFi collateral", "Trading pairs", "Savings instruments"],
      micaCompliant: true,
    },
  ];

  const tokenStandards = [
    {
      name: "ASA",
      type: "Fungible",
      description: "Native Algorand ASA token without ARC3 metadata.",
      icon: CubeIcon,
      bgClass: "bg-gray-500",
      badgeVariant: "default" as const,
      statusColor: "bg-gray-500",
      network: "Algorand",
      count: 0,
    },
    {
      name: "ARC3 Fungible Token",
      type: "Fungible",
      description: "Native Algorand Standard Assets with built-in metadata support.",
      icon: CurrencyDollarIcon,
      bgClass: "bg-blue-500",
      badgeVariant: "info" as const,
      statusColor: "bg-blue-500",
      network: "Algorand",
      count: 0,
    },
    {
      name: "ARC3 NFT",
      type: "NFT",
      description: "Native Algorand ASA NFT with metadata like picture, project description and project URL stored in IPFS. The total supply is 1.",
      icon: CubeIcon,
      bgClass: "bg-orange-500",
      badgeVariant: "info" as const,
      statusColor: "bg-orange-500",
      network: "Algorand",
      count: 0,
    },
    {
      name: "ARC3 Fractional NFT",
      type: "NFT",
      description: "Native Algorand ASA NFT with metadata like picture, project description and project URL stored in IPFS. The total supply must be 10^decimals representation.",
      icon: CubeIcon,
      bgClass: "bg-orange-200",
      badgeVariant: "info" as const,
      statusColor: "bg-orange-200",
      network: "Algorand",
      count: 0,
    },
    {
      name: "ARC200",
      type: "Fungible",
      description: "Algorand smart contract tokens compatible with ERC20 standards and functionality.",
      icon: CurrencyDollarIcon,
      bgClass: "bg-green-500",
      badgeVariant: "success" as const,
      statusColor: "bg-green-500",
      network: "Algorand",
      count: 0,
    },
    {
      name: "ARC72",
      type: "NFT",
      description: "Algorand NFT standard with Ethereum-style functionality and metadata handling.",
      icon: PhotoIcon,
      bgClass: "bg-purple-500",
      badgeVariant: "default" as const,
      statusColor: "bg-green-500",
      network: "Algorand",
      count: 0,
    },
    {
      name: "ERC20",
      type: "Fungible",
      description: "Standard Ethereum fungible tokens with full EVM compatibility and features.",
      icon: CurrencyDollarIcon,
      bgClass: "bg-yellow-500",
      badgeVariant: "warning" as const,
      statusColor: "bg-yellow-500",
      network: "Ethereum",
      count: 0,
    },
    {
      name: "ERC721",
      type: "NFT",
      description: "Ethereum non-fungible tokens with rich metadata and ownership tracking capabilities.",
      icon: PhotoIcon,
      bgClass: "bg-pink-500",
      badgeVariant: "error" as const,
      statusColor: "bg-yellow-500",
      network: "Ethereum",
      count: 0,
    },
  ];
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
  };
});
