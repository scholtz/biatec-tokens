/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/**
 * Status of a whitelist entry
 * @format int32
 */
export enum WhitelistStatus {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
}

/**
 * Types of whitelisting rules supported for RWA token compliance
 * @format int32
 */
export enum WhitelistRuleType {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
  Value5 = 5,
  Value6 = 6,
  Value7 = 7,
  Value8 = 8,
}

/**
 * Role of the user performing whitelist operations
 * @format int32
 */
export enum WhitelistRole {
  Value0 = 0,
  Value1 = 1,
}

/**
 * Type of action performed on a whitelist entry
 * @format int32
 */
export enum WhitelistActionType {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
}

/**
 * Types of webhook events that can be subscribed to
 * @format int32
 */
export enum WebhookEventType {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
}

/**
 * KYC/AML verification status
 * @format int32
 */
export enum VerificationStatus {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
}

/**
 * Severity level for validation issues
 * @format int32
 */
export enum ValidationSeverity {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
}

/**
 * Types of audit actions for whitelisting rules
 * @format int32
 */
export enum RuleAuditActionType {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
  Value5 = 5,
}

/**
 * Retention status enum
 * @format int32
 */
export enum RetentionStatus {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
}

/**
 * Types of operations that can be limited
 * @format int32
 */
export enum OperationType {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
  Value5 = 5,
}

/**
 * MICA requirement priority
 * @format int32
 */
export enum MicaRequirementPriority {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
}

/**
 * MICA license status
 * @format int32
 */
export enum MicaLicenseStatus {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
  Value5 = 5,
  Value6 = 6,
}

/**
 * MICA compliance status
 * @format int32
 */
export enum MicaComplianceStatus {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
}

/**
 * Issuer verification status
 * @format int32
 */
export enum IssuerVerificationStatus {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
}

/**
 * Issuer profile status
 * @format int32
 */
export enum IssuerProfileStatus {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
  Value5 = 5,
}

/**
 * Compliance status of the token
 * @format int32
 */
export enum ComplianceStatus {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
}

/**
 * Type of action performed on compliance metadata
 * @format int32
 */
export enum ComplianceActionType {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
  Value5 = 5,
}

/**
 * Blacklist status
 * @format int32
 */
export enum BlacklistStatus {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
}

/**
 * Blacklist category
 * @format int32
 */
export enum BlacklistCategory {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
  Value5 = 5,
}

/**
 * Audit log health status enum
 * @format int32
 */
export enum AuditHealthStatus {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
}

/**
 * Category of audit event for enterprise reporting
 * @format int32
 */
export enum AuditEventCategory {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
  Value5 = 5,
}

/**
 * Verification status for compliance attestations
 * @format int32
 */
export enum AttestationVerificationStatus {
  Value0 = 0,
  Value1 = 1,
  Value2 = 2,
  Value3 = 3,
  Value4 = 4,
}

/** Represents a request to deploy an ERC-20 token with mintable functionality. */
export interface ARC1400MintableTokenDeploymentRequest {
  /**
   * The name of the ARC1400 token
   * @minLength 1
   */
  name: string;
  /**
   * The symbol of the ARC1400 token (ticker)
   * @minLength 1
   */
  symbol: string;
  /**
   * Initial supply of tokens (will be multiplied by decimals)
   * @format double
   */
  initialSupply: number;
  /**
   * Number of decimals for the token (typically 18)
   * @format int32
   */
  decimals?: number;
  /**
   * Address that will receive the initial token supply.
   * If not specified, the deployer address will be used.
   */
  initialSupplyReceiver?: string | null;
  /**
   * Algorand network to deploy to (mainnet-v1.0, testnet-v1.0, betanet-v1.0, voimain-v1.0, aramidmain-v1.0)
   * @minLength 1
   */
  network: string;
  /** Gets a value indicating whether the item can be minted. */
  isMintable?: boolean;
  /**
   * Cap of tokens (will be multiplied by decimals)
   * @format double
   */
  cap: number;
}

/** Represents a request to deploy an ERC-20 token with mintable functionality. */
export interface ARC200MintableTokenDeploymentRequest {
  /**
   * The name of the ARC200 token
   * @minLength 1
   */
  name: string;
  /**
   * The symbol of the ARC200 token (ticker)
   * @minLength 1
   */
  symbol: string;
  /**
   * Initial supply of tokens (will be multiplied by decimals)
   * @format double
   */
  initialSupply: number;
  /**
   * Number of decimals for the token (typically 18)
   * @format int32
   */
  decimals?: number;
  /**
   * Address that will receive the initial token supply.
   * If not specified, the deployer address will be used.
   */
  initialSupplyReceiver?: string | null;
  /**
   * Algorand network to deploy to (mainnet-v1.0, testnet-v1.0, betanet-v1.0, voimain-v1.0, aramidmain-v1.0)
   * @minLength 1
   */
  network: string;
  /** Gets a value indicating whether the item can be minted. */
  isMintable?: boolean;
  /**
   * Cap of tokens (will be multiplied by decimals)
   * @format double
   */
  cap: number;
}

/** Represents a request to deploy a non-mintable ARC200 token contract on the blockchain. */
export interface ARC200PremintedTokenDeploymentRequest {
  /**
   * The name of the ARC200 token
   * @minLength 1
   */
  name: string;
  /**
   * The symbol of the ARC200 token (ticker)
   * @minLength 1
   */
  symbol: string;
  /**
   * Initial supply of tokens (will be multiplied by decimals)
   * @format double
   */
  initialSupply: number;
  /**
   * Number of decimals for the token (typically 18)
   * @format int32
   */
  decimals?: number;
  /**
   * Address that will receive the initial token supply.
   * If not specified, the deployer address will be used.
   */
  initialSupplyReceiver?: string | null;
  /**
   * Algorand network to deploy to (mainnet-v1.0, testnet-v1.0, betanet-v1.0, voimain-v1.0, aramidmain-v1.0)
   * @minLength 1
   */
  network: string;
  /** Gets a value indicating whether the item can be minted. */
  isMintable?: boolean;
}

/** Represents the response received after deploying an ERC-20 token contract. */
export interface ARC200TokenDeploymentResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Transaction ID of the asset creation */
  transactionId?: string | null;
  /**
   * Asset ID of the created token
   * @format int64
   */
  assetId?: number | null;
  /** Creator account address */
  creatorAddress?: string | null;
  /**
   * Round number when the transaction was confirmed
   * @format int64
   */
  confirmedRound?: number | null;
  /**
   * Deployed token contract app id
   * @format int64
   */
  appId: number;
}

/** Represents a request to deploy an ARC3-compliant non-fungible token (NFT). */
export interface ARC3FractionalNonFungibleTokenDeploymentRequest {
  /**
   * The name of the ARC3 token
   * @minLength 0
   * @maxLength 32
   */
  name: string;
  /**
   * The unit name (symbol) of the ARC3 token
   * @minLength 0
   * @maxLength 8
   */
  unitName: string;
  /**
   * Optional URL for token metadata
   * @minLength 0
   * @maxLength 96
   */
  url?: string | null;
  /**
   * Optional metadata hash (32 bytes)
   * @format byte
   */
  metadataHash?: string | null;
  /** Whether the asset can be frozen by the freeze address */
  defaultFrozen?: boolean;
  /**
   * Address that can manage the asset configuration (optional)
   * If not provided, the creator will be the manager
   */
  managerAddress?: string | null;
  /** Address that can reserve tokens (optional) */
  reserveAddress?: string | null;
  /** Address that can freeze/unfreeze tokens (optional) */
  freezeAddress?: string | null;
  /** Address that can clawback tokens (optional) */
  clawbackAddress?: string | null;
  /**
   * Algorand network to deploy to (mainnet-v1.0, testnet-v1.0, betanet-v1.0, voimain-v1.0, aramidmain-v1.0)
   * @minLength 1
   */
  network: string;
  /**
   * Total supply of tokens
   * @format int64
   * @min 1
   * @max 18446744073709552000
   */
  totalSupply: number;
  /**
   * Number of decimal places for the token (0-19)
   * @format int32
   * @min 0
   * @max 19
   */
  decimals?: number;
  /** ARC3 compliant token metadata structure */
  metadata: ARC3TokenMetadata;
}

/** Request model for creating an ARC3 Fungible Token on Algorand */
export interface ARC3FungibleTokenDeploymentRequest {
  /**
   * The name of the ARC3 token
   * @minLength 0
   * @maxLength 32
   */
  name: string;
  /**
   * The unit name (symbol) of the ARC3 token
   * @minLength 0
   * @maxLength 8
   */
  unitName: string;
  /**
   * Optional URL for token metadata
   * @minLength 0
   * @maxLength 96
   */
  url?: string | null;
  /**
   * Optional metadata hash (32 bytes)
   * @format byte
   */
  metadataHash?: string | null;
  /** Whether the asset can be frozen by the freeze address */
  defaultFrozen?: boolean;
  /**
   * Address that can manage the asset configuration (optional)
   * If not provided, the creator will be the manager
   */
  managerAddress?: string | null;
  /** Address that can reserve tokens (optional) */
  reserveAddress?: string | null;
  /** Address that can freeze/unfreeze tokens (optional) */
  freezeAddress?: string | null;
  /** Address that can clawback tokens (optional) */
  clawbackAddress?: string | null;
  /**
   * Algorand network to deploy to (mainnet-v1.0, testnet-v1.0, betanet-v1.0, voimain-v1.0, aramidmain-v1.0)
   * @minLength 1
   */
  network: string;
  /**
   * Total supply of tokens
   * @format int64
   * @min 1
   * @max 18446744073709552000
   */
  totalSupply: number;
  /**
   * Number of decimal places for the token (0-19)
   * @format int32
   * @min 0
   * @max 19
   */
  decimals?: number;
  /** ARC3 compliant token metadata structure */
  metadata: ARC3TokenMetadata;
}

/** Represents a request to deploy an ARC3-compliant non-fungible token (NFT). */
export interface ARC3NonFungibleTokenDeploymentRequest {
  /**
   * The name of the ARC3 token
   * @minLength 0
   * @maxLength 32
   */
  name: string;
  /**
   * The unit name (symbol) of the ARC3 token
   * @minLength 0
   * @maxLength 8
   */
  unitName: string;
  /**
   * Optional URL for token metadata
   * @minLength 0
   * @maxLength 96
   */
  url?: string | null;
  /**
   * Optional metadata hash (32 bytes)
   * @format byte
   */
  metadataHash?: string | null;
  /** Whether the asset can be frozen by the freeze address */
  defaultFrozen?: boolean;
  /**
   * Address that can manage the asset configuration (optional)
   * If not provided, the creator will be the manager
   */
  managerAddress?: string | null;
  /** Address that can reserve tokens (optional) */
  reserveAddress?: string | null;
  /** Address that can freeze/unfreeze tokens (optional) */
  freezeAddress?: string | null;
  /** Address that can clawback tokens (optional) */
  clawbackAddress?: string | null;
  /**
   * Algorand network to deploy to (mainnet-v1.0, testnet-v1.0, betanet-v1.0, voimain-v1.0, aramidmain-v1.0)
   * @minLength 1
   */
  network: string;
  /** ARC3 compliant token metadata structure */
  metadata: ARC3TokenMetadata;
}

/** Response model for ARC3 token deployment */
export interface ARC3TokenDeploymentResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Transaction ID of the asset creation */
  transactionId?: string | null;
  /**
   * Asset ID of the created token
   * @format int64
   */
  assetId?: number | null;
  /** Creator account address */
  creatorAddress?: string | null;
  /**
   * Round number when the transaction was confirmed
   * @format int64
   */
  confirmedRound?: number | null;
  tokenInfo?: Asset;
  /** Generated metadata URL if metadata was uploaded */
  metadataUrl?: string | null;
  /** Hash of the uploaded metadata */
  metadataHash?: string | null;
}

/** Localization information for ARC3 token metadata */
export interface ARC3TokenLocalization {
  /**
   * The URI pattern to fetch localized data from. This URI should contain the substring `{locale}`
   * @minLength 1
   */
  uri: string;
  /**
   * The locale of the default data within the base JSON
   * @minLength 1
   */
  default: string;
  /** The list of locales for which data is available */
  locales: string[];
  /** The SHA-256 digests of the localized JSON files (except the default one) */
  integrity?: Record<string, string>;
}

/** ARC3 compliant token metadata structure */
export interface ARC3TokenMetadata {
  /** Identifies the asset to which this token represents */
  name?: string | null;
  /**
   * The number of decimal places that the token amount should display
   * @format int32
   */
  decimals?: number | null;
  /** Describes the asset to which this token represents */
  description?: string | null;
  /** A URI pointing to a file with MIME type image/* representing the asset */
  image?: string | null;
  /** The SHA-256 digest of the file pointed by the URI image */
  imageIntegrity?: string | null;
  /** The MIME type of the file pointed by the URI image. MUST be of the form 'image/*' */
  imageMimetype?: string | null;
  /**
   * Background color to display the asset. MUST be a six-character hexadecimal without a pre-pended #
   * @pattern ^[0-9A-Fa-f]{6}$
   */
  backgroundColor?: string | null;
  /** A URI pointing to an external website presenting the asset */
  externalUrl?: string | null;
  /** The SHA-256 digest of the file pointed by the URI external_url */
  externalUrlIntegrity?: string | null;
  /** The MIME type of the file pointed by the URI external_url */
  externalUrlMimetype?: string | null;
  /** A URI pointing to a multi-media file representing the asset */
  animationUrl?: string | null;
  /** The SHA-256 digest of the file pointed by the URI animation_url */
  animationUrlIntegrity?: string | null;
  /** The MIME type of the file pointed by the URI animation_url */
  animationUrlMimetype?: string | null;
  /** Arbitrary properties (also called attributes). Values may be strings, numbers, object or arrays */
  properties?: Record<string, any>;
  /** Extra metadata in base64 */
  extraMetadata?: string | null;
  /** Localization information for ARC3 token metadata */
  localization?: ARC3TokenLocalization;
}

/** Request model for creating a Fractional Non-Fungible Token on Algorand */
export interface ASAFractionalNonFungibleTokenDeploymentRequest {
  /**
   * The name of the ARC3 token
   * @minLength 0
   * @maxLength 32
   */
  name: string;
  /**
   * The unit name (symbol) of the ARC3 token
   * @minLength 0
   * @maxLength 8
   */
  unitName: string;
  /**
   * Optional URL for token metadata
   * @minLength 0
   * @maxLength 96
   */
  url?: string | null;
  /**
   * Optional metadata hash (32 bytes)
   * @format byte
   */
  metadataHash?: string | null;
  /** Whether the asset can be frozen by the freeze address */
  defaultFrozen?: boolean;
  /**
   * Address that can manage the asset configuration (optional)
   * If not provided, the creator will be the manager
   */
  managerAddress?: string | null;
  /** Address that can reserve tokens (optional) */
  reserveAddress?: string | null;
  /** Address that can freeze/unfreeze tokens (optional) */
  freezeAddress?: string | null;
  /** Address that can clawback tokens (optional) */
  clawbackAddress?: string | null;
  /**
   * Algorand network to deploy to (mainnet-v1.0, testnet-v1.0, betanet-v1.0, voimain-v1.0, aramidmain-v1.0)
   * @minLength 1
   */
  network: string;
  /**
   * Total supply of tokens
   * @format int64
   * @min 1
   * @max 18446744073709552000
   */
  totalSupply: number;
  /**
   * Number of decimal places for the token (0-19)
   * @format int32
   * @min 0
   * @max 19
   */
  decimals?: number;
}

/**
 * Request model for creating an ARC3 Fungible Token on Algorand
 * @example {"TotalSupply":10000000000,"Decimals":6,"Name":"MyToken","UnitName":"MTKN","Url":"https://www.biatec.io","MetadataHash":"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=","DefaultFrozen":false,"ManagerAddress":"ALGONAUTSPIUHDCX3SLFXOFDUKOE4VY36XV4JX2JHQTWJNKVBKPEBQACRY","ReserveAddress":"ALGONAUTSPIUHDCX3SLFXOFDUKOE4VY36XV4JX2JHQTWJNKVBKPEBQACRY","FreezeAddress":"","ClawbackAddress":"","Network":"testnet-v1.0"}
 */
export interface ASAFungibleTokenDeploymentRequest {
  /**
   * The name of the ARC3 token
   * @minLength 0
   * @maxLength 32
   */
  name: string;
  /**
   * The unit name (symbol) of the ARC3 token
   * @minLength 0
   * @maxLength 8
   */
  unitName: string;
  /**
   * Optional URL for token metadata
   * @minLength 0
   * @maxLength 96
   */
  url?: string | null;
  /**
   * Optional metadata hash (32 bytes)
   * @format byte
   */
  metadataHash?: string | null;
  /** Whether the asset can be frozen by the freeze address */
  defaultFrozen?: boolean;
  /**
   * Address that can manage the asset configuration (optional)
   * If not provided, the creator will be the manager
   */
  managerAddress?: string | null;
  /** Address that can reserve tokens (optional) */
  reserveAddress?: string | null;
  /** Address that can freeze/unfreeze tokens (optional) */
  freezeAddress?: string | null;
  /** Address that can clawback tokens (optional) */
  clawbackAddress?: string | null;
  /**
   * Algorand network to deploy to (mainnet-v1.0, testnet-v1.0, betanet-v1.0, voimain-v1.0, aramidmain-v1.0)
   * @minLength 1
   */
  network: string;
  /**
   * Total supply of tokens
   * @format int64
   * @min 1
   * @max 18446744073709552000
   */
  totalSupply: number;
  /**
   * Number of decimal places for the token (0-19)
   * @format int32
   * @min 0
   * @max 19
   */
  decimals?: number;
}

/** Decimals is equal to 0 for non-fungible tokens. Total quantity is equal to 1. */
export interface ASANonFungibleTokenDeploymentRequest {
  /**
   * The name of the ARC3 token
   * @minLength 0
   * @maxLength 32
   */
  name: string;
  /**
   * The unit name (symbol) of the ARC3 token
   * @minLength 0
   * @maxLength 8
   */
  unitName: string;
  /**
   * Optional URL for token metadata
   * @minLength 0
   * @maxLength 96
   */
  url?: string | null;
  /**
   * Optional metadata hash (32 bytes)
   * @format byte
   */
  metadataHash?: string | null;
  /** Whether the asset can be frozen by the freeze address */
  defaultFrozen?: boolean;
  /**
   * Address that can manage the asset configuration (optional)
   * If not provided, the creator will be the manager
   */
  managerAddress?: string | null;
  /** Address that can reserve tokens (optional) */
  reserveAddress?: string | null;
  /** Address that can freeze/unfreeze tokens (optional) */
  freezeAddress?: string | null;
  /** Address that can clawback tokens (optional) */
  clawbackAddress?: string | null;
  /**
   * Algorand network to deploy to (mainnet-v1.0, testnet-v1.0, betanet-v1.0, voimain-v1.0, aramidmain-v1.0)
   * @minLength 1
   */
  network: string;
}

/** Response model for ARC3 token deployment */
export interface ASATokenDeploymentResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Transaction ID of the asset creation */
  transactionId?: string | null;
  /**
   * Asset ID of the created token
   * @format int64
   */
  assetId?: number | null;
  /** Creator account address */
  creatorAddress?: string | null;
  /**
   * Round number when the transaction was confirmed
   * @format int64
   */
  confirmedRound?: number | null;
  tokenInfo?: Asset;
}

/** Request to add a blacklist entry */
export interface AddBlacklistEntryRequest {
  /**
   * Blacklisted address
   * @minLength 1
   */
  address: string;
  /**
   * Asset ID (token ID), or null for global blacklist
   * @format int64
   */
  assetId?: number | null;
  /**
   * Reason for blacklisting
   * @minLength 0
   * @maxLength 1000
   */
  reason: string;
  /** Blacklist category */
  category?: BlacklistCategory;
  /**
   * Network where blacklist applies
   * @minLength 0
   * @maxLength 50
   */
  network?: string | null;
  /**
   * Jurisdiction that issued blacklist
   * @minLength 0
   * @maxLength 200
   */
  jurisdiction?: string | null;
  /**
   * Source of blacklist (OFAC, FinCEN, Chainalysis, etc.)
   * @minLength 0
   * @maxLength 200
   */
  source?: string | null;
  /**
   * Reference number or case ID
   * @minLength 0
   * @maxLength 200
   */
  referenceId?: string | null;
  /**
   * Date blacklist entry becomes effective
   * @format date-time
   */
  effectiveDate?: string | null;
  /**
   * Date blacklist entry expires (null for permanent)
   * @format date-time
   */
  expirationDate?: string | null;
  /**
   * Additional notes
   * @minLength 0
   * @maxLength 2000
   */
  notes?: string | null;
}

/** Request to add a single address to a token's whitelist */
export interface AddWhitelistEntryRequest {
  /**
   * The asset ID (token ID) for which to add the whitelist entry
   * @format int64
   */
  assetId: number;
  /**
   * The Algorand address to whitelist
   * @minLength 1
   */
  address: string;
  /** Status of a whitelist entry */
  status?: WhitelistStatus;
  /** Reason for whitelisting this address */
  reason?: string | null;
  /**
   * Date when the whitelist entry expires (optional)
   * @format date-time
   */
  expirationDate?: string | null;
  /** Whether KYC verification has been completed */
  kycVerified?: boolean;
  /**
   * Date when KYC verification was completed
   * @format date-time
   */
  kycVerificationDate?: string | null;
  /** Name of the KYC provider */
  kycProvider?: string | null;
  /** Network on which the token is deployed (voimain-v1.0, aramidmain-v1.0, mainnet-v1.0, testnet-v1.0, etc.) */
  network?: string | null;
  /** Role of the user performing whitelist operations */
  role?: WhitelistRole;
}

export interface Address {
  /** @format byte */
  bytes?: string | null;
}

/** Request to apply a whitelisting rule */
export interface ApplyWhitelistRuleRequest {
  /**
   * The ID of the rule to apply
   * @minLength 1
   */
  ruleId: string;
  /** Optional list of specific addresses to apply the rule to (if null, applies to all matching entries) */
  targetAddresses?: string[] | null;
  /** Whether to perform a dry run without making actual changes */
  dryRun?: boolean;
}

/** Response for applying a whitelisting rule */
export interface ApplyWhitelistRuleResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Result of applying a whitelisting rule */
  result?: RuleApplicationResult;
}

export interface Asset {
  /** @format int64 */
  index: number;
  params: AssetParams;
}

/** Summary of compliance status for a single asset */
export interface AssetComplianceSummary {
  /**
   * Asset ID
   * @format int64
   */
  assetId?: number;
  /** Network */
  network?: string | null;
  /** Token standard (ASA, ARC3, ARC200, ARC1400, ERC20) */
  tokenStandard?: string | null;
  /** MICA compliance status */
  micaComplianceStatus?: string | null;
  /** Compliance status */
  complianceStatus?: string | null;
  /** Whether whitelist is enabled */
  hasWhitelist?: boolean;
  /**
   * Number of whitelisted addresses
   * @format int32
   */
  whitelistedAddressCount?: number;
  /** Jurisdiction(s) */
  jurisdiction?: string | null;
  /** Transfer restrictions */
  transferRestrictions?: string | null;
  /**
   * Last compliance review date
   * @format date-time
   */
  lastComplianceReview?: string | null;
}

export interface AssetParams {
  clawback?: Address;
  creator?: Address;
  /**
   * @format int64
   * @min 0
   * @max 19
   */
  decimals?: number;
  /** @default false */
  defaultFrozen?: boolean | null;
  freeze?: Address;
  manager?: Address;
  /** @format byte */
  metadataHash?: string | null;
  name?: string | null;
  /** @format byte */
  nameB64?: string | null;
  reserve?: Address;
  /**
   * @format int64
   * @default 0
   */
  total?: number | null;
  unitName?: string | null;
  /** @format byte */
  unitNameB64?: string | null;
  url?: string | null;
  /** @format byte */
  urlB64?: string | null;
}

/** Signed compliance attestation package for MICA regulatory audits */
export interface AttestationPackage {
  /** Unique identifier for this attestation package */
  packageId?: string | null;
  /**
   * Token ID this package is for
   * @format int64
   */
  tokenId?: number;
  /**
   * Timestamp when this package was generated
   * @format date-time
   */
  generatedAt?: string;
  /** Address of the issuer who requested this package */
  issuerAddress?: string | null;
  /** Network the token is deployed on */
  network?: string | null;
  /** Token metadata for attestation package */
  token?: TokenMetadata;
  /** Represents compliance metadata for an RWA token */
  complianceMetadata?: ComplianceMetadata;
  /** Whitelist policy information */
  whitelistPolicy?: WhitelistPolicyInfo;
  /** Compliance status information */
  complianceStatus?: ComplianceStatusInfo;
  /** List of attestations in the date range */
  attestations?: ComplianceAttestation[] | null;
  /** Date range information */
  dateRange?: DateRangeInfo;
  /** Deterministic hash of the package content for verification */
  contentHash?: string | null;
  /** Signature metadata for audit verification */
  signature?: SignatureMetadata;
}

/** Response for attestation package generation */
export interface AttestationPackageResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Signed compliance attestation package for MICA regulatory audits */
  package?: AttestationPackage;
  /** Format of the package (json or pdf) */
  format?: string | null;
}

/** Date range information for audit log exports */
export interface AuditDateRange {
  /**
   * Earliest event timestamp
   * @format date-time
   */
  earliestEvent?: string | null;
  /**
   * Latest event timestamp
   * @format date-time
   */
  latestEvent?: string | null;
}

/** Response containing audit log health status */
export interface AuditHealthResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Audit log health status */
  auditHealth?: AuditLogHealth;
}

/** Audit log health status */
export interface AuditLogHealth {
  /**
   * Total number of audit log entries
   * @format int32
   */
  totalEntries?: number;
  /**
   * Number of compliance audit entries
   * @format int32
   */
  complianceEntries?: number;
  /**
   * Number of whitelist audit entries
   * @format int32
   */
  whitelistEntries?: number;
  /**
   * Oldest audit entry timestamp
   * @format date-time
   */
  oldestEntry?: string | null;
  /**
   * Most recent audit entry timestamp
   * @format date-time
   */
  newestEntry?: string | null;
  /** Whether audit logs meet MICA retention requirements */
  meetsRetentionRequirements?: boolean;
  /** Audit log health status enum */
  status?: AuditHealthStatus;
  /** Health issues if any */
  healthIssues?: string[] | null;
  /**
   * Audit coverage percentage (0-100)
   * @format double
   */
  coveragePercentage?: number;
}

/** Summary statistics for audit log exports */
export interface AuditLogSummary {
  /**
   * Number of whitelist events
   * @format int32
   */
  whitelistEvents?: number;
  /**
   * Number of blacklist events
   * @format int32
   */
  blacklistEvents?: number;
  /**
   * Number of compliance events
   * @format int32
   */
  complianceEvents?: number;
  /**
   * Number of token issuance events
   * @format int32
   */
  tokenIssuanceEvents?: number;
  /**
   * Number of successful operations
   * @format int32
   */
  successfulOperations?: number;
  /**
   * Number of failed operations
   * @format int32
   */
  failedOperations?: number;
  /** Date range information for audit log exports */
  dateRange?: AuditDateRange;
  /** Networks included in the export */
  networks?: string[] | null;
  /** Assets included in the export */
  assets?: number[] | null;
}

/** Audit log retention policy information for regulatory compliance */
export interface AuditRetentionPolicy {
  /**
   * Minimum retention period in years
   * @format int32
   */
  minimumRetentionYears?: number;
  /** Regulatory framework requiring retention (e.g., "MICA", "SEC") */
  regulatoryFramework?: string | null;
  /** Whether audit logs are immutable */
  immutableEntries?: boolean;
  /** Description of retention policy */
  description?: string | null;
}

/** Response for blacklist check */
export interface BlacklistCheckResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Address checked */
  address?: string | null;
  /** Whether address is blacklisted */
  isBlacklisted?: boolean;
  /** Blacklist entries for this address */
  entries?: BlacklistEntry[] | null;
  /** Whether on global blacklist */
  globalBlacklist?: boolean;
  /** Whether on asset-specific blacklist */
  assetSpecificBlacklist?: boolean;
}

/** Represents a blacklisted address for compliance enforcement */
export interface BlacklistEntry {
  /** Unique identifier */
  id?: string | null;
  /**
   * Blacklisted address
   * @minLength 1
   */
  address: string;
  /**
   * Asset ID (token ID), or null for global blacklist
   * @format int64
   */
  assetId?: number | null;
  /**
   * Reason for blacklisting
   * @minLength 0
   * @maxLength 1000
   */
  reason: string;
  /** Blacklist category */
  category?: BlacklistCategory;
  /**
   * Network where blacklist applies
   * @minLength 0
   * @maxLength 50
   */
  network?: string | null;
  /**
   * Jurisdiction that issued blacklist
   * @minLength 0
   * @maxLength 200
   */
  jurisdiction?: string | null;
  /**
   * Source of blacklist (OFAC, FinCEN, Chainalysis, etc.)
   * @minLength 0
   * @maxLength 200
   */
  source?: string | null;
  /**
   * Reference number or case ID
   * @minLength 0
   * @maxLength 200
   */
  referenceId?: string | null;
  /**
   * Date blacklist entry becomes effective
   * @format date-time
   */
  effectiveDate?: string;
  /**
   * Date blacklist entry expires (null for permanent)
   * @format date-time
   */
  expirationDate?: string | null;
  /** Blacklist status */
  status?: BlacklistStatus;
  /** Address of user who created the entry */
  createdBy?: string | null;
  /**
   * Date entry was created
   * @format date-time
   */
  createdAt?: string;
  /** Address of user who last updated the entry */
  updatedBy?: string | null;
  /**
   * Date entry was last updated
   * @format date-time
   */
  updatedAt?: string | null;
  /**
   * Additional notes
   * @minLength 0
   * @maxLength 2000
   */
  notes?: string | null;
}

/** Response for blacklist list */
export interface BlacklistListResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of blacklist entries */
  entries?: BlacklistEntry[] | null;
  /**
   * Total count
   * @format int32
   */
  totalCount?: number;
  /**
   * Current page
   * @format int32
   */
  page?: number;
  /**
   * Page size
   * @format int32
   */
  pageSize?: number;
  /**
   * Total pages
   * @format int32
   */
  totalPages?: number;
}

/** Response for blacklist operations */
export interface BlacklistResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Represents a blacklisted address for compliance enforcement */
  entry?: BlacklistEntry;
}

/** Request to bulk upload whitelist entries for a token */
export interface BulkAddWhitelistRequest {
  /**
   * The asset ID (token ID) for which to add the whitelist entries
   * @format int64
   */
  assetId: number;
  /**
   * List of addresses to whitelist
   * @minItems 1
   */
  addresses: string[];
  /** Status of a whitelist entry */
  status?: WhitelistStatus;
  /** Reason for whitelisting these addresses (applies to all) */
  reason?: string | null;
  /**
   * Date when the whitelist entries expire (optional, applies to all)
   * @format date-time
   */
  expirationDate?: string | null;
  /** Whether KYC verification has been completed for all addresses */
  kycVerified?: boolean;
  /**
   * Date when KYC verification was completed (applies to all)
   * @format date-time
   */
  kycVerificationDate?: string | null;
  /** Name of the KYC provider (applies to all) */
  kycProvider?: string | null;
  /** Network on which the token is deployed (voimain-v1.0, aramidmain-v1.0, mainnet-v1.0, testnet-v1.0, etc.) */
  network?: string | null;
  /** Role of the user performing whitelist operations */
  role?: WhitelistRole;
}

/** Response for bulk whitelist operations */
export interface BulkWhitelistResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of successfully added/updated entries */
  successfulEntries?: WhitelistEntry[] | null;
  /** List of addresses that failed validation */
  failedAddresses?: string[] | null;
  /**
   * Number of entries successfully processed
   * @format int32
   */
  successCount?: number;
  /**
   * Number of entries that failed
   * @format int32
   */
  failedCount?: number;
  /** List of validation errors */
  validationErrors?: string[] | null;
}

/** Compliance alert */
export interface ComplianceAlert {
  /** Alert severity */
  severity?: string | null;
  /** Alert message */
  message?: string | null;
  /** Affected asset IDs */
  affectedAssetIds?: number[] | null;
}

/** Represents a wallet-level compliance attestation for regulatory audit trails */
export interface ComplianceAttestation {
  /** Unique identifier for the attestation entry */
  id?: string | null;
  /**
   * The wallet address for which this attestation applies
   * @minLength 1
   * @maxLength 100
   */
  walletAddress: string;
  /**
   * The asset ID (token ID) this attestation is linked to
   * @format int64
   */
  assetId: number;
  /**
   * The issuer address who created this attestation
   * @minLength 1
   * @maxLength 100
   */
  issuerAddress: string;
  /**
   * Cryptographic hash of compliance proof document
   * @minLength 1
   * @maxLength 200
   */
  proofHash: string;
  /**
   * Type of proof provided (e.g., "IPFS", "SHA256", "ARC19")
   * @maxLength 50
   */
  proofType?: string | null;
  /** Verification status for compliance attestations */
  verificationStatus?: AttestationVerificationStatus;
  /**
   * Type of attestation (e.g., KYC, AML, Accreditation, License)
   * @maxLength 100
   */
  attestationType?: string | null;
  /**
   * Network on which the token is deployed
   * @maxLength 50
   */
  network?: string | null;
  /**
   * Jurisdiction(s) applicable to this attestation
   * @maxLength 500
   */
  jurisdiction?: string | null;
  /**
   * Regulatory framework this attestation complies with
   * @maxLength 500
   */
  regulatoryFramework?: string | null;
  /**
   * Date when the attestation was issued
   * @format date-time
   */
  issuedAt?: string;
  /**
   * Date when the attestation expires (if applicable)
   * @format date-time
   */
  expiresAt?: string | null;
  /**
   * Date when the attestation was verified
   * @format date-time
   */
  verifiedAt?: string | null;
  /**
   * Address of the verifier (if different from issuer)
   * @maxLength 100
   */
  verifierAddress?: string | null;
  /**
   * Additional metadata or notes about the attestation
   * @maxLength 2000
   */
  notes?: string | null;
  /**
   * Timestamp when the attestation was created in the system
   * @format date-time
   */
  createdAt?: string;
  /**
   * Timestamp when the attestation was last updated
   * @format date-time
   */
  updatedAt?: string | null;
  /**
   * Address of the user who created this attestation in the system
   * @maxLength 100
   */
  createdBy?: string | null;
  /**
   * Address of the user who last updated this attestation
   * @maxLength 100
   */
  updatedBy?: string | null;
}

/** Response for listing compliance attestations */
export interface ComplianceAttestationListResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of compliance attestations */
  attestations?: ComplianceAttestation[] | null;
  /**
   * Total number of attestations matching the filter
   * @format int32
   */
  totalCount?: number;
  /**
   * Current page number
   * @format int32
   */
  page?: number;
  /**
   * Page size
   * @format int32
   */
  pageSize?: number;
  /**
   * Total number of pages
   * @format int32
   */
  totalPages?: number;
}

/** Response for compliance attestation operations */
export interface ComplianceAttestationResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Represents a wallet-level compliance attestation for regulatory audit trails */
  attestation?: ComplianceAttestation;
}

/** Represents an audit log entry for compliance metadata changes and access */
export interface ComplianceAuditLogEntry {
  /** Unique identifier for the audit log entry */
  id?: string | null;
  /**
   * The asset ID (token ID) for which the compliance operation occurred
   * @format int64
   */
  assetId?: number | null;
  /** The network on which the token is deployed */
  network?: string | null;
  /** Type of action performed on compliance metadata */
  actionType?: ComplianceActionType;
  /** The address of the user who performed the action */
  performedBy?: string | null;
  /**
   * Timestamp when the action was performed
   * @format date-time
   */
  performedAt?: string;
  /** Whether the operation completed successfully */
  success?: boolean;
  /** Error message if the operation failed */
  errorMessage?: string | null;
  /** Compliance status of the token */
  oldComplianceStatus?: ComplianceStatus;
  /** Compliance status of the token */
  newComplianceStatus?: ComplianceStatus;
  /** KYC/AML verification status */
  oldVerificationStatus?: VerificationStatus;
  /** KYC/AML verification status */
  newVerificationStatus?: VerificationStatus;
  /** Additional notes or context about the change */
  notes?: string | null;
  /**
   * For list operations: number of items returned
   * @format int32
   */
  itemCount?: number | null;
  /** For list operations: filter criteria applied */
  filterCriteria?: string | null;
}

/** Response containing compliance audit log entries */
export interface ComplianceAuditLogResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of audit log entries */
  entries?: ComplianceAuditLogEntry[] | null;
  /**
   * Total number of entries matching the filter
   * @format int32
   */
  totalCount?: number;
  /**
   * Current page number
   * @format int32
   */
  page?: number;
  /**
   * Page size
   * @format int32
   */
  pageSize?: number;
  /**
   * Total number of pages
   * @format int32
   */
  totalPages?: number;
  /** Audit log retention policy information for regulatory compliance */
  retentionPolicy?: AuditRetentionPolicy;
}

/** Compliant vs restricted asset count metrics */
export interface ComplianceCountMetrics {
  /**
   * Number of compliant assets
   * @format int32
   */
  compliantAssets?: number;
  /**
   * Number of restricted assets
   * @format int32
   */
  restrictedAssets?: number;
  /**
   * Number of assets under review
   * @format int32
   */
  underReviewAssets?: number;
  /**
   * Number of suspended assets
   * @format int32
   */
  suspendedAssets?: number;
  /**
   * Number of exempt assets
   * @format int32
   */
  exemptAssets?: number;
  /**
   * Compliance rate as percentage (0-100)
   * @format double
   */
  complianceRate?: number;
}

/** Compliance dashboard aggregation response with export formats */
export interface ComplianceDashboardAggregationResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Aggregated compliance metrics for dashboard */
  metrics?: ComplianceDashboardMetrics;
  /** Network filter applied (if any) */
  networkFilter?: string | null;
  /** Token standard filter applied (if any) */
  tokenStandardFilter?: string | null;
  /** Date range information for audit log exports */
  dateRangeFilter?: AuditDateRange;
  /**
   * Timestamp when aggregation was generated
   * @format date-time
   */
  generatedAt?: string;
  /** Detailed asset breakdown (if requested) */
  assetBreakdown?: AssetComplianceSummary[] | null;
}

/** Aggregated compliance metrics for dashboard */
export interface ComplianceDashboardMetrics {
  /**
   * Total number of assets in the dataset
   * @format int32
   */
  totalAssets?: number;
  /** MICA readiness aggregation metrics */
  micaReadiness?: MicaReadinessMetrics;
  /** Whitelist status aggregation metrics */
  whitelistStatus?: WhitelistStatusMetrics;
  /** Jurisdiction coverage aggregation metrics */
  jurisdictions?: JurisdictionMetrics;
  /** Compliant vs restricted asset count metrics */
  complianceCounts?: ComplianceCountMetrics;
  /** Top restriction reasons with counts */
  topRestrictionReasons?: RestrictionReasonCount[] | null;
  /** Token standard distribution */
  tokenStandardDistribution?: Record<string, number>;
  /** Network distribution */
  networkDistribution?: Record<string, number>;
}

/** Response for compliance health */
export interface ComplianceHealthResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /**
   * Overall health score (0-100)
   * @format int32
   */
  overallHealthScore?: number;
  /**
   * Total tokens
   * @format int32
   */
  totalTokens?: number;
  /**
   * Compliant tokens count
   * @format int32
   */
  compliantTokens?: number;
  /**
   * Under review tokens count
   * @format int32
   */
  underReviewTokens?: number;
  /**
   * Non-compliant tokens count
   * @format int32
   */
  nonCompliantTokens?: number;
  /**
   * MICA-ready tokens count
   * @format int32
   */
  micaReadyTokens?: number;
  /**
   * Tokens with whitelisting
   * @format int32
   */
  tokensWithWhitelisting?: number;
  /**
   * Tokens with audit trail
   * @format int32
   */
  tokensWithAuditTrail?: number;
  /** Whether issuer is verified */
  issuerVerified?: boolean;
  /** List of alerts */
  alerts?: ComplianceAlert[] | null;
  /** List of recommendations */
  recommendations?: string[] | null;
}

/** Represents compliance metadata for an RWA token */
export interface ComplianceMetadata {
  /** Unique identifier for the compliance metadata entry */
  id?: string | null;
  /**
   * The asset ID (token ID) for which this compliance metadata applies
   * @format int64
   */
  assetId?: number;
  /** Name of the KYC/AML provider used for verification */
  kycProvider?: string | null;
  /**
   * Date when KYC/AML verification was completed
   * @format date-time
   */
  kycVerificationDate?: string | null;
  /** KYC/AML verification status */
  verificationStatus?: VerificationStatus;
  /** Jurisdiction(s) where the token is compliant (comma-separated country codes) */
  jurisdiction?: string | null;
  /** Regulatory framework(s) the token complies with (e.g., "SEC Reg D", "MiFID II") */
  regulatoryFramework?: string | null;
  /** Compliance status of the token */
  complianceStatus?: ComplianceStatus;
  /**
   * Date when compliance review was last performed
   * @format date-time
   */
  lastComplianceReview?: string | null;
  /**
   * Date when the next compliance review is due
   * @format date-time
   */
  nextComplianceReview?: string | null;
  /** Type of asset being tokenized */
  assetType?: string | null;
  /** Restrictions on token transfers (if any) */
  transferRestrictions?: string | null;
  /**
   * Maximum number of token holders allowed
   * @format int32
   */
  maxHolders?: number | null;
  /** Whether the token requires accredited investors only */
  requiresAccreditedInvestors?: boolean;
  /** Network on which the token is deployed */
  network?: string | null;
  /** Additional compliance notes */
  notes?: string | null;
  /** Address of the user who created this compliance metadata */
  createdBy?: string | null;
  /**
   * Timestamp when the metadata was created
   * @format date-time
   */
  createdAt?: string;
  /**
   * Timestamp when the metadata was last updated
   * @format date-time
   */
  updatedAt?: string | null;
  /** Address of the user who last updated this metadata */
  updatedBy?: string | null;
}

/** Response for listing compliance metadata */
export interface ComplianceMetadataListResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of compliance metadata entries */
  metadata?: ComplianceMetadata[] | null;
  /**
   * Total number of entries matching the filter
   * @format int32
   */
  totalCount?: number;
  /**
   * Current page number
   * @format int32
   */
  page?: number;
  /**
   * Page size
   * @format int32
   */
  pageSize?: number;
  /**
   * Total number of pages
   * @format int32
   */
  totalPages?: number;
}

/** Response for compliance metadata operations */
export interface ComplianceMetadataResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Represents compliance metadata for an RWA token */
  metadata?: ComplianceMetadata;
}

/** Response containing compliance monitoring metrics */
export interface ComplianceMonitoringMetricsResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Whitelist enforcement metrics for transfer validations */
  whitelistEnforcement?: WhitelistEnforcementMetrics;
  /** Audit log health status */
  auditHealth?: AuditLogHealth;
  /** Retention status per network */
  networkRetentionStatus?: NetworkRetentionStatus[] | null;
  /**
   * Overall compliance health score (0-100)
   * @format int32
   */
  overallHealthScore?: number;
  /**
   * Timestamp when metrics were calculated
   * @format date-time
   */
  calculatedAt?: string;
}

/** Compliance status information */
export interface ComplianceStatusInfo {
  /** Compliance status of the token */
  status?: ComplianceStatus;
  /** KYC/AML verification status */
  verificationStatus?: VerificationStatus;
  /**
   * Last compliance review date
   * @format date-time
   */
  lastReviewDate?: string | null;
  /**
   * Next compliance review date
   * @format date-time
   */
  nextReviewDate?: string | null;
}

/** Request to create a new compliance attestation */
export interface CreateComplianceAttestationRequest {
  /**
   * The wallet address for which this attestation applies
   * @minLength 1
   * @maxLength 100
   */
  walletAddress: string;
  /**
   * The asset ID (token ID) this attestation is linked to
   * @format int64
   */
  assetId: number;
  /**
   * The issuer address who creates this attestation
   * @minLength 1
   * @maxLength 100
   */
  issuerAddress: string;
  /**
   * Cryptographic hash of compliance proof document
   * @minLength 1
   * @maxLength 200
   */
  proofHash: string;
  /**
   * Type of proof provided (e.g., "IPFS", "SHA256", "ARC19")
   * @maxLength 50
   */
  proofType?: string | null;
  /**
   * Type of attestation (e.g., KYC, AML, Accreditation, License)
   * @maxLength 100
   */
  attestationType?: string | null;
  /**
   * Network on which the token is deployed
   * @maxLength 50
   */
  network?: string | null;
  /**
   * Jurisdiction(s) applicable to this attestation
   * @maxLength 500
   */
  jurisdiction?: string | null;
  /**
   * Regulatory framework this attestation complies with
   * @maxLength 500
   */
  regulatoryFramework?: string | null;
  /**
   * Date when the attestation expires (if applicable)
   * @format date-time
   */
  expiresAt?: string | null;
  /**
   * Additional metadata or notes about the attestation
   * @maxLength 2000
   */
  notes?: string | null;
}

/** Request to create a webhook subscription */
export interface CreateWebhookSubscriptionRequest {
  /** URL to deliver webhook events to */
  url?: string | null;
  /** Event types to subscribe to */
  eventTypes?: WebhookEventType[] | null;
  /** Optional description for the subscription */
  description?: string | null;
  /**
   * Optional filter by asset ID
   * @format int64
   */
  assetIdFilter?: number | null;
  /** Optional filter by network */
  networkFilter?: string | null;
}

/** Request to create a new whitelisting rule */
export interface CreateWhitelistRuleRequest {
  /**
   * The asset ID (token ID) for which to create the rule
   * @format int64
   */
  assetId: number;
  /**
   * Name of the rule
   * @minLength 3
   * @maxLength 200
   */
  name: string;
  /**
   * Detailed description of what the rule does
   * @minLength 0
   * @maxLength 1000
   */
  description?: string | null;
  /** Types of whitelisting rules supported for RWA token compliance */
  ruleType: WhitelistRuleType;
  /** Whether the rule should be active immediately (defaults to true) */
  isActive?: boolean;
  /**
   * Priority order for rule execution (lower numbers execute first, defaults to 100)
   * @format int32
   * @min 1
   * @max 1000
   */
  priority?: number;
  /** Network on which this rule applies (voimain-v1.0, aramidmain-v1.0, null for all networks) */
  network?: string | null;
  /** Rule-specific configuration as JSON */
  configuration?: string | null;
}

/** Date range information */
export interface DateRangeInfo {
  /**
   * Start date
   * @format date-time
   */
  from?: string | null;
  /**
   * End date
   * @format date-time
   */
  to?: string | null;
}

/** Response for deleting a whitelisting rule */
export interface DeleteWhitelistRuleResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** The ID of the deleted rule */
  ruleId?: string | null;
}

/** Denial reason with occurrence count */
export interface DenialReasonCount {
  /** Reason for denial */
  reason?: string | null;
  /**
   * Number of times this reason occurred
   * @format int32
   */
  count?: number;
}

/** Represents a request to deploy an ERC-20 token with mintable functionality. */
export interface ERC20MintableTokenDeploymentRequest {
  /**
   * The name of the ERC20 token
   * @minLength 1
   */
  name: string;
  /**
   * The symbol of the ERC20 token (ticker)
   * @minLength 1
   */
  symbol: string;
  /**
   * Initial supply of tokens (will be multiplied by decimals)
   * @format double
   */
  initialSupply: number;
  /**
   * Number of decimals for the token (typically 18)
   * @format int32
   */
  decimals?: number;
  /**
   * Address that will receive the initial token supply.
   * If not specified, the deployer address will be used.
   */
  initialSupplyReceiver?: string | null;
  /**
   * EVM chain id
   * @format int64
   */
  chainId: number;
  /** Gets a value indicating whether the item can be minted. */
  isMintable?: boolean;
  /**
   * Cap of tokens (will be multiplied by decimals)
   * @format double
   */
  cap: number;
}

/** Represents a request to deploy a non-mintable ERC20 token contract on the blockchain. */
export interface ERC20PremintedTokenDeploymentRequest {
  /**
   * The name of the ERC20 token
   * @minLength 1
   */
  name: string;
  /**
   * The symbol of the ERC20 token (ticker)
   * @minLength 1
   */
  symbol: string;
  /**
   * Initial supply of tokens (will be multiplied by decimals)
   * @format double
   */
  initialSupply: number;
  /**
   * Number of decimals for the token (typically 18)
   * @format int32
   */
  decimals?: number;
  /**
   * Address that will receive the initial token supply.
   * If not specified, the deployer address will be used.
   */
  initialSupplyReceiver?: string | null;
  /**
   * EVM chain id
   * @format int64
   */
  chainId: number;
  /** Gets a value indicating whether the item can be minted. */
  isMintable?: boolean;
}

/** Represents the response of an Ethereum Virtual Machine (EVM) token deployment operation. */
export interface EVMTokenDeploymentResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Transaction hash of the deployment */
  transactionHash: string | null;
}

/** Unified enterprise audit log entry for MICA reporting */
export interface EnterpriseAuditLogEntry {
  /** Unique identifier for the audit log entry */
  id?: string | null;
  /**
   * The asset ID (token ID) associated with this audit event
   * @format int64
   */
  assetId?: number | null;
  /** Network on which the event occurred (voimain-v1.0, aramidmain-v1.0, mainnet-v1.0, etc.) */
  network?: string | null;
  /** Category of audit event for enterprise reporting */
  category?: AuditEventCategory;
  /** The type of action performed (Add, Update, Remove, Validate, etc.) */
  actionType?: string | null;
  /** The address of the user who performed the action */
  performedBy?: string | null;
  /**
   * Timestamp when the action was performed (UTC)
   * @format date-time
   */
  performedAt?: string;
  /** Whether the operation completed successfully */
  success?: boolean;
  /** Error message if the operation failed */
  errorMessage?: string | null;
  /** The Algorand address affected by this event (for whitelist/blacklist operations) */
  affectedAddress?: string | null;
  /** Status before the change (e.g., "Active", "Suspended", "Compliant") */
  oldStatus?: string | null;
  /** Status after the change */
  newStatus?: string | null;
  /** Additional notes or context about the change */
  notes?: string | null;
  /** For transfer validations: the receiver's address */
  toAddress?: string | null;
  /** For transfer validations: whether the transfer was allowed */
  transferAllowed?: boolean | null;
  /** For transfer validations: the reason if transfer was denied */
  denialReason?: string | null;
  /**
   * For transfer validations or token operations: the amount involved
   * @format int64
   */
  amount?: number | null;
  /** Role of the user who performed the action */
  role?: string | null;
  /**
   * For list operations: number of items returned
   * @format int32
   */
  itemCount?: number | null;
  /** Source system that generated this audit entry */
  sourceSystem?: string | null;
  /** Correlation ID for related events */
  correlationId?: string | null;
}

/** Response containing enterprise audit log entries */
export interface EnterpriseAuditLogResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of audit log entries */
  entries?: EnterpriseAuditLogEntry[] | null;
  /**
   * Total number of entries matching the filter
   * @format int32
   */
  totalCount?: number;
  /**
   * Current page number
   * @format int32
   */
  page?: number;
  /**
   * Page size
   * @format int32
   */
  pageSize?: number;
  /**
   * Total number of pages
   * @format int32
   */
  totalPages?: number;
  /** Audit log retention policy information for regulatory compliance */
  retentionPolicy?: AuditRetentionPolicy;
  /** Summary statistics for audit log exports */
  summary?: AuditLogSummary;
}

/** Request to generate a signed compliance attestation package for MICA audits */
export interface GenerateAttestationPackageRequest {
  /**
   * The token ID (asset ID) for which to generate the attestation package
   * @format int64
   * @min 1
   * @max 18446744073709552000
   */
  tokenId: number;
  /**
   * Start date for the attestation package date range
   * @format date-time
   */
  fromDate?: string | null;
  /**
   * End date for the attestation package date range
   * @format date-time
   */
  toDate?: string | null;
  /**
   * Output format for the attestation package (json or pdf)
   * @minLength 1
   * @maxLength 10
   * @pattern ^(json|pdf)$
   */
  format: string;
}

/** Request to generate a compliance evidence bundle (ZIP) for auditors */
export interface GenerateComplianceEvidenceBundleRequest {
  /**
   * The asset ID (token ID) for which to generate the evidence bundle
   * @format int64
   */
  assetId: number;
  /**
   * Optional start date filter for audit logs (ISO 8601 format)
   * @format date-time
   */
  fromDate?: string | null;
  /**
   * Optional end date filter for audit logs (ISO 8601 format)
   * @format date-time
   */
  toDate?: string | null;
  /** Whether to include whitelist history in the bundle (default: true) */
  includeWhitelistHistory?: boolean;
  /** Whether to include transfer approvals in the bundle (default: true) */
  includeTransferApprovals?: boolean;
  /** Whether to include audit logs in the bundle (default: true) */
  includeAuditLogs?: boolean;
  /** Whether to include policy metadata in the bundle (default: true) */
  includePolicyMetadata?: boolean;
  /** Whether to include token metadata in the bundle (default: true) */
  includeTokenMetadata?: boolean;
}

/** Issuer address information */
export interface IssuerAddress {
  /**
   * Address line 1
   * @minLength 0
   * @maxLength 200
   */
  addressLine1: string;
  /**
   * Address line 2
   * @minLength 0
   * @maxLength 200
   */
  addressLine2?: string | null;
  /**
   * City
   * @minLength 0
   * @maxLength 100
   */
  city: string;
  /**
   * State or province
   * @minLength 0
   * @maxLength 100
   */
  stateOrProvince?: string | null;
  /**
   * Postal code
   * @minLength 0
   * @maxLength 20
   */
  postalCode: string;
  /**
   * Country code (ISO 2-letter)
   * @minLength 0
   * @maxLength 2
   */
  countryCode: string;
}

/** Response for issuer assets list */
export interface IssuerAssetsResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Issuer address */
  issuerAddress?: string | null;
  /** List of asset IDs */
  assetIds?: number[] | null;
  /**
   * Total count
   * @format int32
   */
  totalCount?: number;
  /**
   * Current page
   * @format int32
   */
  page?: number;
  /**
   * Page size
   * @format int32
   */
  pageSize?: number;
  /**
   * Total pages
   * @format int32
   */
  totalPages?: number;
}

/** Issuer contact information */
export interface IssuerContact {
  /**
   * Contact name
   * @minLength 0
   * @maxLength 200
   */
  name: string;
  /**
   * Email address
   * @format email
   * @minLength 0
   * @maxLength 200
   */
  email: string;
  /**
   * Phone number
   * @format tel
   * @minLength 0
   * @maxLength 50
   */
  phoneNumber?: string | null;
  /**
   * Job title
   * @minLength 0
   * @maxLength 100
   */
  title?: string | null;
}

/** Represents an issuer profile for MICA compliance */
export interface IssuerProfile {
  /**
   * Unique identifier (issuer's Algorand address)
   * @minLength 1
   */
  issuerAddress: string;
  /**
   * Legal entity name
   * @minLength 0
   * @maxLength 200
   */
  legalName: string;
  /**
   * Doing Business As (DBA) name
   * @minLength 0
   * @maxLength 200
   */
  doingBusinessAs?: string | null;
  /**
   * Entity type (Corporation, LLC, DAO, etc.)
   * @minLength 0
   * @maxLength 100
   */
  entityType?: string | null;
  /**
   * Country of incorporation (ISO country code)
   * @minLength 0
   * @maxLength 2
   */
  countryOfIncorporation: string;
  /**
   * Tax identification number
   * @minLength 0
   * @maxLength 100
   */
  taxIdentificationNumber?: string | null;
  /**
   * Business registration number
   * @minLength 0
   * @maxLength 100
   */
  registrationNumber?: string | null;
  /** Issuer address information */
  registeredAddress?: IssuerAddress;
  /** Issuer address information */
  operationalAddress?: IssuerAddress;
  /** Issuer contact information */
  primaryContact?: IssuerContact;
  /** Issuer contact information */
  complianceContact?: IssuerContact;
  /**
   * Website URL
   * @minLength 0
   * @maxLength 500
   */
  website?: string | null;
  /** KYC/AML verification status */
  kybStatus?: VerificationStatus;
  /**
   * KYB provider name
   * @minLength 0
   * @maxLength 200
   */
  kybProvider?: string | null;
  /**
   * KYB verification date
   * @format date-time
   */
  kybVerifiedDate?: string | null;
  /** MICA license status */
  micaLicenseStatus?: MicaLicenseStatus;
  /**
   * MICA license number
   * @minLength 0
   * @maxLength 100
   */
  micaLicenseNumber?: string | null;
  /**
   * MICA competent authority
   * @minLength 0
   * @maxLength 200
   */
  micaCompetentAuthority?: string | null;
  /**
   * Date issuer profile was created
   * @format date-time
   */
  createdAt?: string;
  /**
   * Date issuer profile was last updated
   * @format date-time
   */
  updatedAt?: string | null;
  /** Issuer profile status */
  status?: IssuerProfileStatus;
  /**
   * Additional notes
   * @minLength 0
   * @maxLength 2000
   */
  notes?: string | null;
  /** Address of user who created profile */
  createdBy?: string | null;
  /** Address of user who last updated profile */
  updatedBy?: string | null;
}

/** Response for issuer profile operations */
export interface IssuerProfileResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Represents an issuer profile for MICA compliance */
  profile?: IssuerProfile;
}

/** Response for issuer verification status */
export interface IssuerVerificationResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Issuer address */
  issuerAddress?: string | null;
  /** Issuer verification status */
  overallStatus?: IssuerVerificationStatus;
  /** KYC/AML verification status */
  kybStatus?: VerificationStatus;
  /** MICA license status */
  micaLicenseStatus?: MicaLicenseStatus;
  /** Issuer profile status */
  profileStatus?: IssuerProfileStatus;
  /** Whether profile is complete */
  isProfileComplete?: boolean;
  /** List of missing required fields */
  missingFields?: string[] | null;
  /**
   * Verification score (0-100)
   * @format int32
   */
  verificationScore?: number;
}

/** Jurisdiction coverage aggregation metrics */
export interface JurisdictionMetrics {
  /**
   * Number of assets with jurisdiction information
   * @format int32
   */
  assetsWithJurisdiction?: number;
  /**
   * Number of assets without jurisdiction information
   * @format int32
   */
  assetsWithoutJurisdiction?: number;
  /** Distribution of assets by jurisdiction (country code -> count) */
  jurisdictionDistribution?: Record<string, number>;
  /**
   * Number of unique jurisdictions covered
   * @format int32
   */
  uniqueJurisdictions?: number;
  /** Most common jurisdiction */
  mostCommonJurisdiction?: string | null;
}

/** Request model for checking if an operation is allowed (preflight check) */
export interface LimitCheckRequest {
  /** Types of operations that can be limited */
  operationType?: OperationType;
  /**
   * Number of operations to check (default: 1)
   * @format int32
   */
  operationCount?: number;
  /**
   * Optional asset ID for context
   * @format int64
   */
  assetId?: number | null;
  /** Optional network for context */
  network?: string | null;
}

/** Response model for limit check endpoint */
export interface LimitCheckResponse {
  /** Whether the operation is allowed */
  isAllowed?: boolean;
  /**
   * Current usage for this operation type
   * @format int32
   */
  currentUsage?: number;
  /**
   * Maximum allowed for this operation type (-1 for unlimited)
   * @format int32
   */
  maxAllowed?: number;
  /**
   * Remaining capacity (-1 for unlimited)
   * @format int32
   */
  remainingCapacity?: number;
  /** Reason if the operation is denied */
  denialReason?: string | null;
  /** Error code for programmatic handling */
  errorCode?: string | null;
  /** Subscription tier of the tenant */
  subscriptionTier?: string | null;
}

/** MICA compliance checklist for a specific token */
export interface MicaComplianceChecklist {
  /**
   * Asset ID (token ID)
   * @format int64
   */
  assetId?: number;
  /** MICA compliance status */
  overallStatus?: MicaComplianceStatus;
  /**
   * Compliance percentage (0-100)
   * @format int32
   * @min 0
   * @max 100
   */
  compliancePercentage?: number;
  /** List of compliance requirements */
  requirements?: MicaRequirement[] | null;
  /**
   * Date checklist was generated
   * @format date-time
   */
  generatedAt?: string;
  /**
   * Next required action
   * @minLength 0
   * @maxLength 500
   */
  nextAction?: string | null;
  /**
   * Estimated completion date
   * @format date-time
   */
  estimatedCompletionDate?: string | null;
}

/** Response for MICA compliance checklist */
export interface MicaComplianceChecklistResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** MICA compliance checklist for a specific token */
  checklist?: MicaComplianceChecklist;
}

/** MICA readiness aggregation metrics */
export interface MicaReadinessMetrics {
  /**
   * Number of assets with MICA compliance metadata
   * @format int32
   */
  assetsWithMetadata?: number;
  /**
   * Number of assets without MICA compliance metadata
   * @format int32
   */
  assetsWithoutMetadata?: number;
  /**
   * Number of fully compliant assets
   * @format int32
   */
  fullyCompliantAssets?: number;
  /**
   * Number of nearly compliant assets
   * @format int32
   */
  nearlyCompliantAssets?: number;
  /**
   * Number of assets in progress
   * @format int32
   */
  inProgressAssets?: number;
  /**
   * Number of non-compliant assets
   * @format int32
   */
  nonCompliantAssets?: number;
  /**
   * Number of assets not started
   * @format int32
   */
  notStartedAssets?: number;
  /**
   * Average MICA compliance percentage across all assets
   * @format double
   */
  averageCompliancePercentage?: number;
}

/** Individual MICA requirement */
export interface MicaRequirement {
  /**
   * Requirement ID
   * @minLength 0
   * @maxLength 50
   */
  id: string;
  /**
   * Requirement category
   * @minLength 0
   * @maxLength 200
   */
  category: string;
  /**
   * Requirement description
   * @minLength 0
   * @maxLength 1000
   */
  description: string;
  /** Whether requirement is met */
  isMet?: boolean;
  /** MICA requirement priority */
  priority?: MicaRequirementPriority;
  /**
   * Evidence or notes
   * @minLength 0
   * @maxLength 2000
   */
  evidence?: string | null;
  /**
   * Date requirement was met
   * @format date-time
   */
  metDate?: string | null;
  /**
   * Recommendations for meeting requirement
   * @minLength 0
   * @maxLength 1000
   */
  recommendations?: string | null;
}

/** Represents compliance metadata for a blockchain network */
export interface NetworkComplianceMetadata {
  /** Network identifier (e.g., "voimain-v1.0", "aramidmain-v1.0", "mainnet-v1.0", "testnet-v1.0") */
  network?: string | null;
  /** Human-readable network name (e.g., "VOI Mainnet", "Aramid Mainnet", "Algorand Mainnet") */
  networkName?: string | null;
  /** Indicates if this network is ready for MICA (Markets in Crypto-Assets) compliance */
  isMicaReady?: boolean;
  /** Indicates if whitelisting is required for tokens on this network */
  requiresWhitelisting?: boolean;
  /** Indicates if jurisdiction specification is required for this network */
  requiresJurisdiction?: boolean;
  /** Indicates if regulatory framework specification is required for this network */
  requiresRegulatoryFramework?: boolean;
  /** Description of network-specific compliance requirements */
  complianceRequirements?: string | null;
  /** Source of compliance metadata (e.g., "Network policy", "Regulatory guidance") */
  source?: string | null;
  /**
   * Timestamp when this metadata was last updated
   * @format date-time
   */
  lastUpdated?: string;
}

/** Response model for network compliance metadata endpoint */
export interface NetworkComplianceMetadataResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of networks with their compliance metadata */
  networks?: NetworkComplianceMetadata[] | null;
  /**
   * Cache duration in seconds (recommended client-side cache time)
   * @format int32
   */
  cacheDurationSeconds?: number;
}

/** VOI/Aramid network-specific compliance status */
export interface NetworkComplianceStatus {
  /** Whether the token meets VOI/Aramid network requirements */
  meetsNetworkRequirements?: boolean;
  /** Specific network rules that are satisfied */
  satisfiedRules?: string[] | null;
  /** Specific network rules that are violated */
  violatedRules?: string[] | null;
  /** Network-specific recommendations */
  recommendations?: string[] | null;
}

/** Enforcement metrics per network */
export interface NetworkEnforcementMetrics {
  /** Network name (voimain-v1.0, aramidmain-v1.0, etc.) */
  network?: string | null;
  /**
   * Total validations on this network
   * @format int32
   */
  totalValidations?: number;
  /**
   * Allowed transfers on this network
   * @format int32
   */
  allowedTransfers?: number;
  /**
   * Denied transfers on this network
   * @format int32
   */
  deniedTransfers?: number;
  /**
   * Number of assets on this network
   * @format int32
   */
  assetCount?: number;
}

/** Network retention status for compliance */
export interface NetworkRetentionStatus {
  /** Network name (voimain-v1.0, aramidmain-v1.0, etc.) */
  network?: string | null;
  /** Whether this network requires MICA compliance */
  requiresMicaCompliance?: boolean;
  /**
   * Total audit entries for this network
   * @format int32
   */
  totalAuditEntries?: number;
  /**
   * Oldest audit entry for this network
   * @format date-time
   */
  oldestEntry?: string | null;
  /**
   * Retention period in years
   * @format int32
   */
  retentionYears?: number;
  /** Whether retention requirements are met */
  meetsRetentionRequirements?: boolean;
  /**
   * Number of assets on this network
   * @format int32
   */
  assetCount?: number;
  /**
   * Number of assets with compliance metadata
   * @format int32
   */
  assetsWithCompliance?: number;
  /**
   * Compliance coverage percentage (0-100)
   * @format double
   */
  complianceCoverage?: number;
  /** Retention status enum */
  status?: RetentionStatus;
  /** Status message */
  statusMessage?: string | null;
}

/** Defines plan limits for a subscription tier */
export interface PlanLimits {
  /**
   * Maximum number of tokens that can be issued per period (-1 for unlimited)
   * @format int32
   */
  maxTokenIssuance?: number;
  /**
   * Maximum number of transfer validations per period (-1 for unlimited)
   * @format int32
   */
  maxTransferValidations?: number;
  /**
   * Maximum number of audit exports per period (-1 for unlimited)
   * @format int32
   */
  maxAuditExports?: number;
  /**
   * Maximum storage items allowed (-1 for unlimited)
   * @format int32
   */
  maxStorageItems?: number;
  /**
   * Maximum compliance operations per period (-1 for unlimited)
   * @format int32
   */
  maxComplianceOperations?: number;
  /**
   * Maximum whitelist operations per period (-1 for unlimited)
   * @format int32
   */
  maxWhitelistOperations?: number;
}

/** Response model for plan limits operations */
export interface PlanLimitsResponse {
  /** Whether the request was successful */
  success?: boolean;
  /** Defines plan limits for a subscription tier */
  limits?: PlanLimits;
  /** Error message if the request failed */
  errorMessage?: string | null;
}

export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  /** @format int32 */
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any;
}

/** Request to remove an address from a token's whitelist */
export interface RemoveWhitelistEntryRequest {
  /**
   * The asset ID (token ID) for which to remove the whitelist entry
   * @format int64
   */
  assetId: number;
  /**
   * The Algorand address to remove from the whitelist
   * @minLength 1
   */
  address: string;
}

/** Subscription tier information included in compliance reports */
export interface ReportSubscriptionInfo {
  /** Current subscription tier */
  tierName?: string | null;
  /** Whether audit log access is enabled in this tier */
  auditLogEnabled?: boolean;
  /**
   * Maximum number of assets that can be included in a single report
   * @format int32
   */
  maxAssetsPerReport?: number;
  /** Whether detailed compliance reports are available */
  detailedReportsEnabled?: boolean;
  /** Message about tier limitations (if any) */
  limitationMessage?: string | null;
  /** Whether this report was metered for billing */
  metered?: boolean;
}

/** Restriction reason with occurrence count */
export interface RestrictionReasonCount {
  /** The restriction reason */
  reason?: string | null;
  /**
   * Number of assets with this restriction
   * @format int32
   */
  count?: number;
  /**
   * Percentage of total restricted assets
   * @format double
   */
  percentage?: number;
}

/** Response containing retention status per network */
export interface RetentionStatusResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Retention status for each network */
  networks?: NetworkRetentionStatus[] | null;
  /**
   * Overall retention health score (0-100)
   * @format int32
   */
  overallRetentionScore?: number;
}

/** Result of applying a whitelisting rule */
export interface RuleApplicationResult {
  /** Represents a whitelisting rule for RWA tokens aligned with MICA requirements */
  rule?: WhitelistRule;
  /** Whether the rule application was successful */
  success?: boolean;
  /**
   * Number of whitelist entries affected by the rule
   * @format int32
   */
  affectedEntriesCount?: number;
  /** List of addresses that were affected */
  affectedAddresses?: string[] | null;
  /** Actions taken by the rule (e.g., "Revoked expired entry", "Activated entry with KYC") */
  actions?: string[] | null;
  /** Error message if rule application failed */
  errorMessage?: string | null;
  /**
   * Timestamp when the rule was applied
   * @format date-time
   */
  appliedAt?: string;
}

/** Signature metadata for audit verification */
export interface SignatureMetadata {
  /** Algorithm used for signing (e.g., "ED25519", "SHA256") */
  algorithm?: string | null;
  /** Public key used for signature verification */
  publicKey?: string | null;
  /** Signature value (base64 encoded) */
  signatureValue?: string | null;
  /**
   * Timestamp when signature was created
   * @format date-time
   */
  signedAt?: string;
}

/** Represents simplified compliance indicators for a token, designed for frontend display */
export interface TokenComplianceIndicators {
  /**
   * The asset ID (token ID) for which these indicators apply
   * @format int64
   */
  assetId?: number;
  /** Indicates if the token meets MICA (Markets in Crypto-Assets) regulatory requirements */
  isMicaReady?: boolean;
  /** Indicates if whitelisting controls are enabled for this token */
  whitelistingEnabled?: boolean;
  /**
   * Number of addresses currently whitelisted for this token
   * @format int32
   */
  whitelistedAddressCount?: number;
  /** Indicates if the token has transfer restrictions */
  hasTransferRestrictions?: boolean;
  /** Description of transfer restrictions, if any */
  transferRestrictions?: string | null;
  /** Indicates if the token requires accredited investors only */
  requiresAccreditedInvestors?: boolean;
  /** Compliance status of the token */
  complianceStatus?: string | null;
  /** KYC verification status */
  verificationStatus?: string | null;
  /** Regulatory framework(s) the token complies with */
  regulatoryFramework?: string | null;
  /** Jurisdiction(s) where the token is compliant */
  jurisdiction?: string | null;
  /**
   * Maximum number of token holders allowed
   * @format int32
   */
  maxHolders?: number | null;
  /**
   * Overall enterprise readiness score (0-100)
   * @format int32
   */
  enterpriseReadinessScore?: number;
  /** Network on which the token is deployed */
  network?: string | null;
  /** Indicates if compliance metadata exists for this token */
  hasComplianceMetadata?: boolean;
  /**
   * Date when compliance metadata was last updated
   * @format date-time
   */
  lastComplianceUpdate?: string | null;
}

/** Response model for token compliance indicators endpoint */
export interface TokenComplianceIndicatorsResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Represents simplified compliance indicators for a token, designed for frontend display */
  indicators?: TokenComplianceIndicators;
}

/** Comprehensive compliance report response for a token */
export interface TokenComplianceReportResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of token compliance status entries */
  tokens?: TokenComplianceStatus[] | null;
  /**
   * Total number of tokens matching the filter
   * @format int32
   */
  totalCount?: number;
  /**
   * Current page number
   * @format int32
   */
  page?: number;
  /**
   * Page size
   * @format int32
   */
  pageSize?: number;
  /**
   * Total number of pages
   * @format int32
   */
  totalPages?: number;
  /**
   * Report generation timestamp
   * @format date-time
   */
  generatedAt?: string;
  /** Network filter applied (if any) */
  networkFilter?: string | null;
  /** Subscription tier information included in compliance reports */
  subscriptionInfo?: ReportSubscriptionInfo;
}

/** Complete compliance status for a single token */
export interface TokenComplianceStatus {
  /**
   * Asset ID of the token
   * @format int64
   */
  assetId?: number;
  /** Network on which the token is deployed */
  network?: string | null;
  /** Represents compliance metadata for an RWA token */
  complianceMetadata?: ComplianceMetadata;
  /** Summary statistics for token whitelist */
  whitelistSummary?: WhitelistSummary;
  /** Recent compliance metadata audit entries */
  complianceAuditEntries?: ComplianceAuditLogEntry[] | null;
  /** Recent whitelist change audit entries */
  whitelistAuditEntries?: WhitelistAuditLogEntry[] | null;
  /** Recent transfer validation audit entries */
  transferValidationEntries?: WhitelistAuditLogEntry[] | null;
  /**
   * Overall compliance health score (0-100)
   * @format int32
   */
  complianceHealthScore?: number;
  /** Compliance warnings or issues identified */
  warnings?: string[] | null;
  /** VOI/Aramid network-specific compliance status */
  networkSpecificStatus?: NetworkComplianceStatus;
}

/** Token metadata for attestation package */
export interface TokenMetadata {
  /**
   * Token ID (asset ID)
   * @format int64
   */
  assetId?: number;
  /** Token name */
  name?: string | null;
  /** Token unit name */
  unitName?: string | null;
  /**
   * Total supply
   * @format int64
   */
  total?: number | null;
  /**
   * Number of decimals
   * @format int32
   */
  decimals?: number | null;
  /** Creator address */
  creator?: string | null;
  /** Manager address */
  manager?: string | null;
  /** Reserve address */
  reserve?: string | null;
  /** Freeze address */
  freeze?: string | null;
  /** Clawback address */
  clawback?: string | null;
}

/** Status information for a transfer participant (sender or receiver) */
export interface TransferParticipantStatus {
  /** The Algorand address */
  address?: string | null;
  /** Whether the address is whitelisted */
  isWhitelisted?: boolean;
  /** Whether the whitelist entry is active */
  isActive?: boolean;
  /** Whether the whitelist entry has expired */
  isExpired?: boolean;
  /**
   * The expiration date if applicable
   * @format date-time
   */
  expirationDate?: string | null;
  /** Status of a whitelist entry */
  status?: WhitelistStatus;
}

/** Response for transfer validation */
export interface TransferValidationResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Whether transfer is valid */
  isValid?: boolean;
  /** Whether transfer can proceed */
  canTransfer?: boolean;
  /** List of validation checks */
  validations?: ValidationCheck[] | null;
  /** List of violations */
  violations?: string[] | null;
  /** List of warnings */
  warnings?: string[] | null;
  /** List of recommendations */
  recommendations?: string[] | null;
}

/** Request model for updating plan limits (admin only) */
export interface UpdatePlanLimitsRequest {
  /** The tenant's Algorand address */
  tenantAddress?: string | null;
  /** Defines plan limits for a subscription tier */
  limits?: PlanLimits;
  /** Optional notes about why limits were changed */
  notes?: string | null;
}

/** Request to update a webhook subscription */
export interface UpdateWebhookSubscriptionRequest {
  /** ID of the subscription to update */
  subscriptionId?: string | null;
  /** Whether the subscription is active */
  isActive?: boolean | null;
  /** Event types to subscribe to */
  eventTypes?: WebhookEventType[] | null;
  /** Optional description for the subscription */
  description?: string | null;
}

/** Request to update an existing whitelisting rule */
export interface UpdateWhitelistRuleRequest {
  /**
   * The ID of the rule to update
   * @minLength 1
   */
  ruleId: string;
  /**
   * Name of the rule
   * @minLength 3
   * @maxLength 200
   */
  name?: string | null;
  /**
   * Detailed description of what the rule does
   * @minLength 0
   * @maxLength 1000
   */
  description?: string | null;
  /** Whether the rule is active */
  isActive?: boolean | null;
  /**
   * Priority order for rule execution
   * @format int32
   * @min 1
   * @max 1000
   */
  priority?: number | null;
  /** Network on which this rule applies */
  network?: string | null;
  /** Rule-specific configuration as JSON */
  configuration?: string | null;
}

/** Request to create or update compliance metadata for a token */
export interface UpsertComplianceMetadataRequest {
  /**
   * The asset ID (token ID) for which to set compliance metadata
   * @format int64
   */
  assetId: number;
  /**
   * Name of the KYC/AML provider used for verification
   * @maxLength 200
   */
  kycProvider?: string | null;
  /**
   * Date when KYC/AML verification was completed
   * @format date-time
   */
  kycVerificationDate?: string | null;
  /** KYC/AML verification status */
  verificationStatus?: VerificationStatus;
  /**
   * Jurisdiction(s) where the token is compliant (comma-separated country codes)
   * @maxLength 500
   */
  jurisdiction?: string | null;
  /**
   * Regulatory framework(s) the token complies with
   * @maxLength 500
   */
  regulatoryFramework?: string | null;
  /** Compliance status of the token */
  complianceStatus?: ComplianceStatus;
  /**
   * Date when compliance review was last performed
   * @format date-time
   */
  lastComplianceReview?: string | null;
  /**
   * Date when the next compliance review is due
   * @format date-time
   */
  nextComplianceReview?: string | null;
  /**
   * Type of asset being tokenized
   * @maxLength 200
   */
  assetType?: string | null;
  /**
   * Restrictions on token transfers (if any)
   * @maxLength 1000
   */
  transferRestrictions?: string | null;
  /**
   * Maximum number of token holders allowed
   * @format int32
   * @min 1
   * @max 2147483647
   */
  maxHolders?: number | null;
  /** Whether the token requires accredited investors only */
  requiresAccreditedInvestors?: boolean;
  /**
   * Network on which the token is deployed (voimain-v1.0, aramidmain-v1.0, etc.)
   * @maxLength 50
   */
  network?: string | null;
  /**
   * Additional compliance notes
   * @maxLength 2000
   */
  notes?: string | null;
}

/** Request to create or update issuer profile */
export interface UpsertIssuerProfileRequest {
  /**
   * Legal entity name
   * @minLength 0
   * @maxLength 200
   */
  legalName: string;
  /**
   * Doing Business As (DBA) name
   * @minLength 0
   * @maxLength 200
   */
  doingBusinessAs?: string | null;
  /**
   * Entity type (Corporation, LLC, DAO, etc.)
   * @minLength 0
   * @maxLength 100
   */
  entityType?: string | null;
  /**
   * Country of incorporation (ISO country code)
   * @minLength 0
   * @maxLength 2
   */
  countryOfIncorporation: string;
  /**
   * Tax identification number
   * @minLength 0
   * @maxLength 100
   */
  taxIdentificationNumber?: string | null;
  /**
   * Business registration number
   * @minLength 0
   * @maxLength 100
   */
  registrationNumber?: string | null;
  /** Issuer address information */
  registeredAddress?: IssuerAddress;
  /** Issuer address information */
  operationalAddress?: IssuerAddress;
  /** Issuer contact information */
  primaryContact?: IssuerContact;
  /** Issuer contact information */
  complianceContact?: IssuerContact;
  /**
   * Website URL
   * @minLength 0
   * @maxLength 500
   */
  website?: string | null;
  /**
   * KYB provider name
   * @minLength 0
   * @maxLength 200
   */
  kybProvider?: string | null;
  /**
   * MICA license number
   * @minLength 0
   * @maxLength 100
   */
  micaLicenseNumber?: string | null;
  /**
   * MICA competent authority
   * @minLength 0
   * @maxLength 200
   */
  micaCompetentAuthority?: string | null;
  /**
   * Additional notes
   * @minLength 0
   * @maxLength 2000
   */
  notes?: string | null;
}

/** Summary of usage metrics for a tenant */
export interface UsageSummary {
  /** The tenant's Algorand address */
  tenantAddress?: string | null;
  /** Current subscription tier */
  subscriptionTier?: string | null;
  /**
   * Start date of the usage period (UTC)
   * @format date-time
   */
  periodStart?: string;
  /**
   * End date of the usage period (UTC)
   * @format date-time
   */
  periodEnd?: string;
  /**
   * Total number of tokens issued
   * @format int32
   */
  tokenIssuanceCount?: number;
  /**
   * Total number of transfer validations
   * @format int32
   */
  transferValidationCount?: number;
  /**
   * Total number of audit exports performed
   * @format int32
   */
  auditExportCount?: number;
  /**
   * Total storage used (in items/records)
   * @format int32
   */
  storageItemsCount?: number;
  /**
   * Number of compliance metadata operations
   * @format int32
   */
  complianceOperationCount?: number;
  /**
   * Number of whitelist operations
   * @format int32
   */
  whitelistOperationCount?: number;
  /** Defines plan limits for a subscription tier */
  currentLimits?: PlanLimits;
  /** Whether any limits have been exceeded */
  hasExceededLimits?: boolean;
  /** List of limit violations if any */
  limitViolations?: string[] | null;
}

/** Response model for usage summary endpoint */
export interface UsageSummaryResponse {
  /** Whether the request was successful */
  success?: boolean;
  /** Summary of usage metrics for a tenant */
  data?: UsageSummary;
  /** Error message if the request failed */
  errorMessage?: string | null;
}

/** Request to validate a transfer */
export interface ValidateComplianceTransferRequest {
  /**
   * Asset ID
   * @format int64
   */
  assetId: number;
  /**
   * From address
   * @minLength 1
   */
  fromAddress: string;
  /**
   * To address
   * @minLength 1
   */
  toAddress: string;
  /**
   * Amount to transfer
   * @format int64
   * @min 1
   * @max 9223372036854776000
   */
  amount: number;
  /**
   * Network
   * @minLength 0
   * @maxLength 50
   */
  network?: string | null;
}

/** Request to validate token configuration against compliance rules */
export interface ValidateTokenPresetRequest {
  /**
   * Type of asset being tokenized (e.g., "Security Token", "Utility Token", "NFT")
   * @maxLength 200
   */
  assetType?: string | null;
  /** Whether the token requires accredited investors only */
  requiresAccreditedInvestors?: boolean;
  /** Whether whitelist controls are enabled for the token */
  hasWhitelistControls?: boolean;
  /** Whether issuer controls are enabled for the token (freeze, clawback, etc.) */
  hasIssuerControls?: boolean;
  /** KYC/AML verification status */
  verificationStatus?: VerificationStatus;
  /**
   * Jurisdiction(s) where the token is compliant (comma-separated country codes)
   * @maxLength 500
   */
  jurisdiction?: string | null;
  /**
   * Regulatory framework(s) the token complies with
   * @maxLength 500
   */
  regulatoryFramework?: string | null;
  /** Compliance status of the token */
  complianceStatus?: ComplianceStatus;
  /**
   * Maximum number of token holders allowed
   * @format int32
   * @min 1
   * @max 2147483647
   */
  maxHolders?: number | null;
  /**
   * Network on which the token will be deployed (voimain-v1.0, aramidmain-v1.0, etc.)
   * @maxLength 50
   */
  network?: string | null;
  /** Whether to include only critical errors (false) or also warnings (true) */
  includeWarnings?: boolean;
}

/** Response for token preset validation */
export interface ValidateTokenPresetResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Whether the token configuration is valid for MICA/RWA compliance */
  isValid?: boolean;
  /** List of validation errors that must be fixed */
  errors?: ValidationIssue[] | null;
  /** List of validation warnings that should be reviewed */
  warnings?: ValidationIssue[] | null;
  /** Summary of validation results */
  summary?: string | null;
}

/** Request to validate a token transfer between two addresses */
export interface ValidateTransferRequest {
  /**
   * The asset ID (token ID) for which to validate the transfer
   * @format int64
   */
  assetId: number;
  /**
   * The sender's Algorand address
   * @minLength 1
   */
  fromAddress: string;
  /**
   * The receiver's Algorand address
   * @minLength 1
   */
  toAddress: string;
  /**
   * Optional amount to transfer (for future use in amount-based restrictions)
   * @format int64
   */
  amount?: number | null;
}

/** Response for transfer validation */
export interface ValidateTransferResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Whether the transfer is allowed based on whitelist rules */
  isAllowed?: boolean;
  /** Reason why the transfer is not allowed (if IsAllowed is false) */
  denialReason?: string | null;
  /** Status information for a transfer participant (sender or receiver) */
  senderStatus?: TransferParticipantStatus;
  /** Status information for a transfer participant (sender or receiver) */
  receiverStatus?: TransferParticipantStatus;
}

/** Individual validation check */
export interface ValidationCheck {
  /** Rule name */
  rule?: string | null;
  /** Whether check passed */
  passed?: boolean;
  /** Check message */
  message?: string | null;
}

/** Represents a validation issue (error or warning) */
export interface ValidationIssue {
  /** Severity level for validation issues */
  severity?: ValidationSeverity;
  /** Field or area that has the issue */
  field?: string | null;
  /** Description of the issue */
  message?: string | null;
  /** Suggested action to resolve the issue */
  recommendation?: string | null;
  /** Applicable regulatory framework or standard */
  regulatoryContext?: string | null;
}

/** Response containing webhook delivery history */
export interface WebhookDeliveryHistoryResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of delivery results */
  deliveries?: WebhookDeliveryResult[] | null;
  /**
   * Total number of delivery attempts
   * @format int32
   */
  totalCount?: number;
  /**
   * Number of successful deliveries
   * @format int32
   */
  successCount?: number;
  /**
   * Number of failed deliveries
   * @format int32
   */
  failedCount?: number;
  /**
   * Number of pending retries
   * @format int32
   */
  pendingRetries?: number;
}

/** Result of a webhook delivery attempt */
export interface WebhookDeliveryResult {
  /** Unique identifier for the delivery attempt */
  id?: string | null;
  /** ID of the webhook subscription */
  subscriptionId?: string | null;
  /** ID of the event being delivered */
  eventId?: string | null;
  /** Whether the delivery was successful */
  success?: boolean;
  /**
   * HTTP status code from the webhook endpoint
   * @format int32
   */
  statusCode?: number | null;
  /**
   * Timestamp of the delivery attempt (UTC)
   * @format date-time
   */
  attemptedAt?: string;
  /**
   * Number of retry attempts made
   * @format int32
   */
  retryCount?: number;
  /** Error message if delivery failed */
  errorMessage?: string | null;
  /** Response body from the webhook endpoint */
  responseBody?: string | null;
  /** Whether this delivery will be retried */
  willRetry?: boolean;
  /**
   * Timestamp when the next retry will occur (UTC)
   * @format date-time
   */
  nextRetryAt?: string | null;
}

/** Webhook subscription configuration */
export interface WebhookSubscription {
  /** Unique identifier for the webhook subscription */
  id?: string | null;
  /** URL to deliver webhook events to */
  url?: string | null;
  /** Signing secret for webhook signature verification */
  signingSecret?: string | null;
  /** Event types this subscription is interested in */
  eventTypes?: WebhookEventType[] | null;
  /** Whether the subscription is active */
  isActive?: boolean;
  /** Address of the user who created this subscription */
  createdBy?: string | null;
  /**
   * Timestamp when the subscription was created (UTC)
   * @format date-time
   */
  createdAt?: string;
  /**
   * Timestamp when the subscription was last updated (UTC)
   * @format date-time
   */
  updatedAt?: string | null;
  /** Optional description for the subscription */
  description?: string | null;
  /**
   * Optional filter by asset ID
   * @format int64
   */
  assetIdFilter?: number | null;
  /** Optional filter by network */
  networkFilter?: string | null;
}

/** Response containing a list of webhook subscriptions */
export interface WebhookSubscriptionListResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of webhook subscriptions */
  subscriptions?: WebhookSubscription[] | null;
  /**
   * Total number of subscriptions
   * @format int32
   */
  totalCount?: number;
}

/** Response containing webhook subscription details */
export interface WebhookSubscriptionResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Webhook subscription configuration */
  subscription?: WebhookSubscription;
}

/** Represents an audit log entry for whitelist changes and transfer validations */
export interface WhitelistAuditLogEntry {
  /** Unique identifier for the audit log entry */
  id?: string | null;
  /**
   * The asset ID (token ID) for which the whitelist change occurred
   * @format int64
   */
  assetId?: number;
  /** The Algorand address affected by this change (sender address for transfer validations) */
  address?: string | null;
  /** Type of action performed on a whitelist entry */
  actionType?: WhitelistActionType;
  /** The address of the user who performed the action */
  performedBy?: string | null;
  /**
   * Timestamp when the action was performed
   * @format date-time
   */
  performedAt?: string;
  /** Status of a whitelist entry */
  oldStatus?: WhitelistStatus;
  /** Status of a whitelist entry */
  newStatus?: WhitelistStatus;
  /** Additional notes or context about the change */
  notes?: string | null;
  /** For transfer validations: the receiver's address */
  toAddress?: string | null;
  /** For transfer validations: whether the transfer was allowed */
  transferAllowed?: boolean | null;
  /** For transfer validations: the reason if transfer was denied */
  denialReason?: string | null;
  /**
   * For transfer validations: the amount being transferred (optional)
   * @format int64
   */
  amount?: number | null;
  /** Network on which the token is deployed (voimain-v1.0, aramidmain-v1.0, mainnet-v1.0, testnet-v1.0, etc.) */
  network?: string | null;
  /** Role of the user performing whitelist operations */
  role?: WhitelistRole;
}

/** Response containing whitelist audit log entries */
export interface WhitelistAuditLogResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of audit log entries */
  entries?: WhitelistAuditLogEntry[] | null;
  /**
   * Total number of entries matching the filter
   * @format int32
   */
  totalCount?: number;
  /**
   * Current page number
   * @format int32
   */
  page?: number;
  /**
   * Page size
   * @format int32
   */
  pageSize?: number;
  /**
   * Total number of pages
   * @format int32
   */
  totalPages?: number;
  /** Audit log retention policy information for regulatory compliance */
  retentionPolicy?: AuditRetentionPolicy;
}

/** Whitelist enforcement metrics for transfer validations */
export interface WhitelistEnforcementMetrics {
  /**
   * Total number of transfer validations performed
   * @format int32
   */
  totalValidations?: number;
  /**
   * Number of transfers that were allowed
   * @format int32
   */
  allowedTransfers?: number;
  /**
   * Number of transfers that were denied
   * @format int32
   */
  deniedTransfers?: number;
  /**
   * Percentage of transfers allowed (0-100)
   * @format double
   */
  allowedPercentage?: number;
  /** Top denial reasons with occurrence counts */
  topDenialReasons?: DenialReasonCount[] | null;
  /**
   * Number of unique assets with enforcement enabled
   * @format int32
   */
  assetsWithEnforcement?: number;
  /** Breakdown by network */
  networkBreakdown?: NetworkEnforcementMetrics[] | null;
}

/** Represents a whitelist entry for an RWA token */
export interface WhitelistEntry {
  /** Unique identifier for the whitelist entry */
  id?: string | null;
  /**
   * The asset ID (token ID) for which this whitelist entry applies
   * @format int64
   */
  assetId?: number;
  /** The Algorand address being whitelisted */
  address?: string | null;
  /** Status of a whitelist entry */
  status?: WhitelistStatus;
  /** The address of the user who created this whitelist entry */
  createdBy?: string | null;
  /**
   * Timestamp when the whitelist entry was created
   * @format date-time
   */
  createdAt?: string;
  /**
   * Timestamp when the whitelist entry was last updated
   * @format date-time
   */
  updatedAt?: string | null;
  /** The address of the user who last updated this whitelist entry */
  updatedBy?: string | null;
  /** Reason for whitelisting this address (e.g., "KYC verified", "Accredited investor") */
  reason?: string | null;
  /**
   * Date when the whitelist entry expires (optional)
   * @format date-time
   */
  expirationDate?: string | null;
  /** Whether KYC verification has been completed for this address */
  kycVerified?: boolean;
  /**
   * Date when KYC verification was completed
   * @format date-time
   */
  kycVerificationDate?: string | null;
  /** Name of the KYC provider */
  kycProvider?: string | null;
  /** Network on which the token is deployed (voimain-v1.0, aramidmain-v1.0, mainnet-v1.0, testnet-v1.0, etc.) */
  network?: string | null;
  /** Role of the user performing whitelist operations */
  role?: WhitelistRole;
}

/** Response for listing whitelist entries */
export interface WhitelistListResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of whitelist entries */
  entries?: WhitelistEntry[] | null;
  /**
   * Total number of entries matching the filter
   * @format int32
   */
  totalCount?: number;
  /**
   * Current page number
   * @format int32
   */
  page?: number;
  /**
   * Page size
   * @format int32
   */
  pageSize?: number;
  /**
   * Total number of pages
   * @format int32
   */
  totalPages?: number;
}

/** Whitelist policy information */
export interface WhitelistPolicyInfo {
  /** Whether whitelist is enabled */
  isEnabled?: boolean;
  /**
   * Total number of whitelisted addresses
   * @format int32
   */
  totalWhitelisted?: number;
  /** Whitelist enforcement type */
  enforcementType?: string | null;
}

/** Response for whitelist operations */
export interface WhitelistResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Represents a whitelist entry for an RWA token */
  entry?: WhitelistEntry;
  /**
   * Number of entries affected (for bulk operations)
   * @format int32
   */
  affectedCount?: number | null;
}

/** Represents a whitelisting rule for RWA tokens aligned with MICA requirements */
export interface WhitelistRule {
  /** Unique identifier for the rule */
  id?: string | null;
  /**
   * The asset ID (token ID) for which this rule applies
   * @format int64
   */
  assetId?: number;
  /** Name of the rule (e.g., "KYC Required for Active Status", "Auto-Revoke Expired Entries") */
  name?: string | null;
  /** Detailed description of what the rule does */
  description?: string | null;
  /** Types of whitelisting rules supported for RWA token compliance */
  ruleType?: WhitelistRuleType;
  /** Whether the rule is currently active */
  isActive?: boolean;
  /**
   * Priority order for rule execution (lower numbers execute first)
   * @format int32
   */
  priority?: number;
  /** Network on which this rule applies (voimain-v1.0, aramidmain-v1.0, null for all networks) */
  network?: string | null;
  /** Rule-specific configuration as JSON */
  configuration?: string | null;
  /** The address of the user who created this rule */
  createdBy?: string | null;
  /**
   * Timestamp when the rule was created
   * @format date-time
   */
  createdAt?: string;
  /** The address of the user who last updated this rule */
  updatedBy?: string | null;
  /**
   * Timestamp when the rule was last updated
   * @format date-time
   */
  updatedAt?: string | null;
  /**
   * Number of times this rule has been applied
   * @format int32
   */
  applicationCount?: number;
  /**
   * Timestamp when the rule was last applied
   * @format date-time
   */
  lastAppliedAt?: string | null;
}

/** Audit log entry for whitelisting rule changes (MICA compliance) */
export interface WhitelistRuleAuditLog {
  /** Unique identifier for the audit log entry */
  id?: string | null;
  /**
   * The asset ID (token ID) affected by this rule change
   * @format int64
   */
  assetId?: number;
  /** The rule ID that was modified */
  ruleId?: string | null;
  /** Name of the rule at the time of the action */
  ruleName?: string | null;
  /** Types of audit actions for whitelisting rules */
  actionType?: RuleAuditActionType;
  /** The address of the user who performed the action */
  performedBy?: string | null;
  /**
   * Timestamp when the action was performed
   * @format date-time
   */
  performedAt?: string;
  /** Previous state of the rule (JSON serialized, null for Create actions) */
  oldState?: string | null;
  /** New state of the rule (JSON serialized, null for Delete actions) */
  newState?: string | null;
  /** Optional notes or reason for the change */
  notes?: string | null;
  /** Network on which the rule applies (for filtering) */
  network?: string | null;
  /**
   * Number of entries affected when rule was applied (for Apply actions)
   * @format int32
   */
  affectedEntriesCount?: number | null;
}

/** Response for rule audit logs */
export interface WhitelistRuleAuditLogResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of audit log entries */
  entries?: WhitelistRuleAuditLog[] | null;
  /**
   * Total number of entries
   * @format int32
   */
  totalCount?: number;
  /**
   * Current page number
   * @format int32
   */
  page?: number;
  /**
   * Page size
   * @format int32
   */
  pageSize?: number;
  /**
   * Total number of pages
   * @format int32
   */
  totalPages?: number;
}

/** Response for whitelisting rule operations */
export interface WhitelistRuleResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** Represents a whitelisting rule for RWA tokens aligned with MICA requirements */
  rule?: WhitelistRule;
}

/** Response for listing whitelisting rules */
export interface WhitelistRulesListResponse {
  /** Error message if deployment failed */
  errorMessage?: string | null;
  /** Status of the deployment */
  success?: boolean;
  /** List of whitelisting rules */
  rules?: WhitelistRule[] | null;
  /**
   * Total number of rules matching the filter
   * @format int32
   */
  totalCount?: number;
  /**
   * Current page number
   * @format int32
   */
  page?: number;
  /**
   * Page size
   * @format int32
   */
  pageSize?: number;
  /**
   * Total number of pages
   * @format int32
   */
  totalPages?: number;
}

/** Whitelist status aggregation metrics */
export interface WhitelistStatusMetrics {
  /**
   * Number of assets with whitelist enabled
   * @format int32
   */
  assetsWithWhitelist?: number;
  /**
   * Number of assets without whitelist
   * @format int32
   */
  assetsWithoutWhitelist?: number;
  /**
   * Total whitelisted addresses across all assets
   * @format int32
   */
  totalWhitelistedAddresses?: number;
  /**
   * Number of active whitelisted addresses
   * @format int32
   */
  activeWhitelistedAddresses?: number;
  /**
   * Number of revoked whitelisted addresses
   * @format int32
   */
  revokedWhitelistedAddresses?: number;
  /**
   * Number of suspended whitelisted addresses
   * @format int32
   */
  suspendedWhitelistedAddresses?: number;
  /**
   * Average number of whitelisted addresses per asset
   * @format double
   */
  averageWhitelistedAddressesPerAsset?: number;
}

/** Summary statistics for token whitelist */
export interface WhitelistSummary {
  /**
   * Total number of whitelisted addresses
   * @format int32
   */
  totalAddresses?: number;
  /**
   * Number of addresses with Active status
   * @format int32
   */
  activeAddresses?: number;
  /**
   * Number of addresses with Revoked status
   * @format int32
   */
  revokedAddresses?: number;
  /**
   * Number of addresses with Suspended status
   * @format int32
   */
  suspendedAddresses?: number;
  /**
   * Number of addresses with KYC verification
   * @format int32
   */
  kycVerifiedAddresses?: number;
  /**
   * Most recent whitelist change timestamp
   * @format date-time
   */
  lastModified?: string | null;
  /**
   * Number of transfer validations in the report period
   * @format int32
   */
  transferValidationsCount?: number;
  /**
   * Number of denied transfers in the report period
   * @format int32
   */
  deniedTransfersCount?: number;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Biatec Tokens API
 * @version v1
 *
 * # Biatec Tokens API
 *
 * [![Test Pull Request](https://github.com/scholtz/BiatecTokensApi/actions/workflows/test-pr.yml/badge.svg)](https://github.com/scholtz/BiatecTokensApi/actions/workflows/test-pr.yml)
 *
 * A comprehensive API for deploying and managing various types of tokens on different blockchain networks, including ERC20 tokens on EVM chains, ARC3 tokens, and ARC200 tokens on Algorand.
 *
 * ## Features
 *
 * - **ERC20 Token Deployment**: Deploy mintable and preminted ERC20 tokens on EVM chains (Base blockchain)
 * - **Algorand Standard Assets (ASA)**: Create fungible tokens, NFTs, and fractional NFTs on Algorand
 * - **ARC3 Token Support**: Deploy ARC3-compliant tokens with rich metadata and IPFS integration
 * - **ARC200 Token Support**: Create ARC200 tokens with mintable and preminted variants
 * - **RWA Compliance Management**: Comprehensive compliance metadata and whitelist management for Real World Asset tokens
 * - **Compliance Indicators API**: Frontend-friendly endpoint exposing MICA readiness, whitelisting status, and enterprise readiness scores
 * - **Network-Specific Validation**: Enforce compliance rules for VOI and Aramid networks
 * - **Authentication**: Secure API access using ARC-0014 Algorand authentication
 * - **Multi-Network Support**: Support for various Algorand networks and EVM chains
 *
 * ## Supported Token Types
 *
 * ### EVM Chains (Base Blockchain)
 * - **ERC20 Mintable**: Advanced ERC20 tokens with minting, burning, and pausable functionality
 * - **ERC20 Preminted**: Standard ERC20 tokens with fixed supply
 *
 * ### Algorand Network
 * - **ASA Fungible Tokens**: Standard Algorand assets for fungible tokens
 * - **ASA NFTs**: Non-fungible tokens with quantity of 1
 * - **ASA Fractional NFTs**: Fractional non-fungible tokens with custom supply
 * - **ARC3 Fungible Tokens**: ARC3-compliant tokens with rich metadata and IPFS support
 * - **ARC3 NFTs**: ARC3-compliant non-fungible tokens with metadata
 * - **ARC3 Fractional NFTs**: ARC3-compliant fractional tokens
 * - **ARC200 Mintable**: ARC200 tokens with minting capabilities
 * - **ARC200 Preminted**: ARC200 tokens with fixed supply
 *
 * ## Getting Started
 *
 * ### Prerequisites
 *
 * - .NET 8.0 SDK
 * - Visual Studio 2022 or Visual Studio Code
 * - Algorand account with sufficient funds for transactions
 * - Access to supported blockchain networks
 *
 * ### Installation
 *
 * 1. Clone the repository:
 * ```bash
 * git clone <repository-url>
 * cd BiatecTokensApi
 * ```
 *
 * 2. Restore NuGet packages:
 * ```bash
 * dotnet restore
 * ```
 *
 * 3. Configure the application settings in `appsettings.json`:
 * ```json
 * {
 *   "App": {
 *     "Account": "your-mnemonic-phrase-here"
 *   },
 *   "EVMChains": [
 *     {
 *       "RpcUrl": "https://mainnet.base.org",
 *       "ChainId": 8453,
 *       "GasLimit": 4500000
 *     }
 *   ],
 *   "IPFSConfig": {
 *     "ApiUrl": "https://ipfs-api.biatec.io",
 *     "GatewayUrl": "https://ipfs.biatec.io/ipfs",
 *     "Username": "",
 *     "Password": "",
 *     "TimeoutSeconds": 30,
 *     "MaxFileSizeBytes": 10485760,
 *     "ValidateContentHash": true
 *   },
 *   "AlgorandAuthentication": {
 *     "Realm": "BiatecTokens#ARC14",
 *     "CheckExpiration": true,
 *     "Debug": false,
 *     "AllowedNetworks": {
 *       "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=": {
 *         "Server": "https://testnet-api.4160.nodely.dev",
 *         "Token": "",
 *         "Header": ""
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * 4. Run the application:
 * ```bash
 * dotnet run
 * ```
 *
 * 5. Access the API documentation at `https://localhost:7000/swagger` (or your configured port)
 *
 * ## Authentication
 *
 * The API uses ARC-0014 Algorand authentication. You need to include an `Authorization` header with your authentication transaction.
 *
 * Realm: ***BiatecTokens#ARC14***
 *
 * ### Example Authentication Header:
 * ```
 * Authorization: SigTx <your-arc14-signed-transaction>
 * ```
 *
 * ## API Endpoints
 *
 * ### Base URL
 * ```
 * https://localhost:7000/api/v1/token
 * ```
 *
 * ### ERC20 Tokens (Base Blockchain)
 *
 * #### Deploy Mintable ERC20 Token
 * ```http
 * POST /erc20-mintable/create
 * ```
 *
 * **Request Body:**
 * ```json
 * {
 *   "name": "My Mintable Token",
 *   "symbol": "MMT",
 *   "initialSupply": 1000000,
 *   "decimals": 18,
 *   "initialSupplyReceiver": "0x742d35Cc6634C0532925a3b8D4434d3C7f2db9bc",
 *   "chainId": 8453,
 *   "cap": 10000000
 * }
 * ```
 *
 * #### Deploy Preminted ERC20 Token
 * ```http
 * POST /erc20-preminted/create
 * ```
 *
 * **Request Body:**
 * ```json
 * {
 *   "name": "My Preminted Token",
 *   "symbol": "MPT",
 *   "initialSupply": 1000000,
 *   "decimals": 18,
 *   "initialSupplyReceiver": "0x742d35Cc6634C0532925a3b8D4434d3C7f2db9bc",
 *   "chainId": 8453
 * }
 * ```
 *
 * ### ASA Tokens (Algorand)
 *
 * #### Deploy ASA Fungible Token
 * ```http
 * POST /asa-ft/create
 * ```
 *
 * **Request Body:**
 * ```json
 * {
 *   "name": "My ASA Token",
 *   "unitName": "MAT",
 *   "totalSupply": 1000000,
 *   "decimals": 6,
 *   "network": "testnet-v1.0",
 *   "defaultFrozen": false,
 *   "managerAddress": "ALGONAUTSPIUHDCX3SLFXOFDUKOE4VY36XV4JX2JHQTWJNKVBKPEBQACRY",
 *   "url": "https://example.com"
 * }
 * ```
 *
 * #### Deploy ASA NFT
 * ```http
 * POST /asa-nft/create
 * ```
 *
 * **Request Body:**
 * ```json
 * {
 *   "name": "My NFT",
 *   "unitName": "NFT",
 *   "network": "testnet-v1.0",
 *   "defaultFrozen": false,
 *   "url": "https://example.com/nft-metadata"
 * }
 * ```
 *
 * #### Deploy ASA Fractional NFT
 * ```http
 * POST /asa-fnft/create
 * ```
 *
 * **Request Body:**
 * ```json
 * {
 *   "name": "My Fractional NFT",
 *   "unitName": "FNFT",
 *   "totalSupply": 100,
 *   "decimals": 0,
 *   "network": "testnet-v1.0",
 *   "defaultFrozen": false
 * }
 * ```
 *
 * ### ARC3 Tokens (Algorand with Rich Metadata)
 *
 * #### Deploy ARC3 Fungible Token
 * ```http
 * POST /arc3-ft/create
 * ```
 *
 * **Request Body:**
 * ```json
 * {
 *   "name": "My ARC3 Token",
 *   "unitName": "ARC3",
 *   "totalSupply": 1000000,
 *   "decimals": 6,
 *   "network": "testnet-v1.0",
 *   "defaultFrozen": false,
 *   "metadata": {
 *     "name": "My ARC3 Token",
 *     "description": "A token with rich metadata",
 *     "image": "https://example.com/image.png",
 *     "properties": {
 *       "category": "utility",
 *       "rarity": "common"
 *     }
 *   }
 * }
 * ```
 *
 * #### Deploy ARC3 NFT
 * ```http
 * POST /arc3-nft/create
 * ```
 *
 * **Request Body:**
 * ```json
 * {
 *   "name": "My ARC3 NFT",
 *   "unitName": "NFT",
 *   "network": "testnet-v1.0",
 *   "defaultFrozen": false,
 *   "metadata": {
 *     "name": "Unique NFT",
 *     "description": "A unique digital asset",
 *     "image": "https://example.com/nft.png",
 *     "properties": {
 *       "trait_type": "Color",
 *       "value": "Blue"
 *     }
 *   }
 * }
 * ```
 *
 * #### Deploy ARC3 Fractional NFT
 * ```http
 * POST /arc3-fnft/create
 * ```
 *
 * **Request Body:**
 * ```json
 * {
 *   "name": "My Fractional ARC3 NFT",
 *   "unitName": "FNFT",
 *   "totalSupply": 100,
 *   "decimals": 0,
 *   "network": "testnet-v1.0",
 *   "defaultFrozen": false,
 *   "metadata": {
 *     "name": "Fractional Art Piece",
 *     "description": "A fractional ownership of digital art",
 *     "image": "https://example.com/art.png"
 *   }
 * }
 * ```
 *
 * ### ARC200 Tokens (Algorand Smart Contracts)
 *
 * #### Deploy ARC200 Mintable Token
 * ```http
 * POST /arc200-mintable/create
 * ```
 *
 * **Request Body:**
 * ```json
 * {
 *   "name": "My ARC200 Mintable Token",
 *   "symbol": "ARC200M",
 *   "initialSupply": 1000000,
 *   "decimals": 18,
 *   "network": "testnet-v1.0",
 *   "cap": 10000000
 * }
 * ```
 *
 * #### Deploy ARC200 Preminted Token
 * ```http
 * POST /arc200-preminted/create
 * ```
 *
 * **Request Body:**
 * ```json
 * {
 *   "name": "My ARC200 Preminted Token",
 *   "symbol": "ARC200P",
 *   "initialSupply": 1000000,
 *   "decimals": 18,
 *   "network": "testnet-v1.0"
 * }
 * ```
 *
 * ## Response Format
 *
 * All endpoints return responses in the following format:
 *
 * ### Success Response
 * ```json
 * {
 *   "success": true,
 *   "transactionId": "transaction-hash",
 *   "assetId": 123456,
 *   "creatorAddress": "creator-address",
 *   "confirmedRound": 12345,
 *   "errorMessage": null
 * }
 * ```
 *
 * ### Error Response
 * ```json
 * {
 *   "success": false,
 *   "transactionId": null,
 *   "assetId": null,
 *   "creatorAddress": null,
 *   "confirmedRound": null,
 *   "errorMessage": "Error description"
 * }
 * ```
 *
 * ## Supported Networks
 *
 * ### Algorand Networks
 * - `mainnet-v1.0` - Algorand Mainnet
 * - `testnet-v1.0` - Algorand Testnet
 * - `betanet-v1.0` - Algorand Betanet
 * - `voimain-v1.0` - Voi Mainnet
 * - `aramidmain-v1.0` - Aramid Mainnet
 *
 * ### EVM Networks
 * - **Base Mainnet** (Chain ID: 8453)
 *
 * ## Error Handling
 *
 * The API returns standard HTTP status codes:
 *
 * - `200 OK` - Successful operation
 * - `400 Bad Request` - Invalid request parameters
 * - `401 Unauthorized` - Authentication required
 * - `403 Forbidden` - Insufficient permissions
 * - `500 Internal Server Error` - Server error
 *
 * ## Rate Limiting
 *
 * Please be mindful of blockchain network limitations and transaction fees when making requests. Each token deployment creates a blockchain transaction that requires network fees.
 *
 * ## Security Considerations
 *
 * 1. **Keep your mnemonic phrase secure** - Never commit it to version control
 * 2. **Use environment variables** for sensitive configuration
 * 3. **Validate all inputs** before making API calls
 * 4. **Monitor transaction costs** on mainnet networks
 *
 * ## Development and Testing
 *
 * ### Continuous Integration
 *
 * This project uses GitHub Actions for continuous integration. On every pull request, the CI pipeline:
 * - Builds the solution in Release configuration
 * - Runs all unit and integration tests
 * - Reports test results
 *
 * The test pipeline ensures code quality and prevents breaking changes from being merged.
 *
 * ### Running Tests
 *
 * Run all tests:
 * ```bash
 * dotnet test BiatecTokensTests
 * ```
 *
 * Run tests with detailed output:
 * ```bash
 * dotnet test BiatecTokensTests --verbosity detailed
 * ```
 *
 * Run tests in Release configuration:
 * ```bash
 * dotnet test BiatecTokensTests --configuration Release
 * ```
 *
 * ### Test-Driven Development (TDD)
 *
 * We follow TDD practices for new features:
 *
 * 1. **Write failing tests first** - Define expected behavior through tests
 * 2. **Implement the minimum code** - Make the tests pass
 * 3. **Refactor** - Clean up code while keeping tests green
 *
 * ### Test Structure
 *
 * The test suite includes:
 * - **Unit Tests**: Test individual components in isolation (services, repositories)
 * - **Integration Tests**: Test interactions between components
 * - **Mock Tests**: Use Moq to isolate dependencies
 *
 * Example test file structure:
 * ```
 * BiatecTokensTests/
 * ├── TokenServiceTests.cs       # Service layer tests
 * ├── IPFSRepositoryTests.cs     # Repository unit tests
 * ├── TokenControllerTests.cs    # Controller tests
 * └── Erc20TokenTests.cs         # ERC20 functionality tests
 * ```
 *
 * ### Development Environment
 *
 * The API includes comprehensive Swagger/OpenAPI documentation:
 * - Interactive API explorer available at `/swagger` endpoint
 * - OpenAPI JSON specification at `/swagger/v1/swagger.json`
 *
 * #### Running the API Locally
 *
 * Use the provided script for easy local development:
 *
 * ```bash
 * ./run-local.sh
 * ```
 *
 * The script will:
 * 1. Check for required .NET SDK installation
 * 2. Prompt for user secrets configuration
 * 3. Restore dependencies and build the project
 * 4. Start the API server
 *
 * The API will be available at:
 * - HTTPS: https://localhost:7000
 * - HTTP: http://localhost:5000
 * - Swagger UI: https://localhost:7000/swagger
 *
 * #### Sample Data for Testing
 *
 * The `sample-seed-data.json` file contains sample request payloads for all token types. Use these as templates when testing the API endpoints.
 *
 * #### OpenAPI Contract
 *
 * The OpenAPI specification is automatically generated and can be used by frontend developers for:
 * - Generating type-safe API clients
 * - Creating mock servers for testing
 * - Validating requests and responses
 * - API documentation
 *
 * See [OPENAPI.md](OPENAPI.md) for detailed information about accessing and using the OpenAPI contract.
 *
 * #### CI/CD Integration
 *
 * On every pull request and push to main/master:
 * - The OpenAPI specification is generated and published as a GitHub Actions artifact
 * - All tests (unit and integration) are run
 * - Test results are reported in the PR
 *
 * To download the OpenAPI specification from CI:
 * 1. Go to the Actions tab in GitHub
 * 2. Select the latest workflow run
 * 3. Download the `openapi-specification` artifact
 *
 * ## RWA Compliance Management
 *
 * The API provides comprehensive compliance metadata management for Real World Asset (RWA) tokens, including KYC/AML verification tracking, jurisdiction management, and regulatory compliance monitoring.
 *
 * ### Compliance Indicators Endpoint (NEW)
 *
 * **GET** `/api/v1/token/{assetId}/compliance-indicators` - Get frontend-friendly compliance indicators
 *
 * Returns simplified compliance status including:
 * - **MICA readiness flag** - Whether token meets MICA regulatory requirements
 * - **Whitelisting enabled** - Status and count of whitelisted addresses
 * - **Transfer restrictions** - Summary of any restrictions in place
 * - **Enterprise readiness score** - Overall score (0-100) indicating compliance maturity
 * - **Regulatory framework** - Applicable frameworks (MICA, SEC Reg D, etc.)
 * - **KYC verification status** - Current verification state
 *
 * For detailed documentation, see [COMPLIANCE_INDICATORS_API.md](../COMPLIANCE_INDICATORS_API.md)
 *
 * ### Compliance Metadata Endpoints
 *
 * - `GET /api/v1/compliance/{assetId}` - Get compliance metadata for a token
 * - `POST /api/v1/compliance` - Create or update compliance metadata
 * - `DELETE /api/v1/compliance/{assetId}` - Delete compliance metadata
 * - `GET /api/v1/compliance` - List compliance metadata with filtering
 *
 * ### Compliance Attestation Endpoints (MICA Audit Trail)
 *
 * - `POST /api/v1/compliance/attestations` - Create compliance attestation (KYC, AML, accreditation)
 * - `GET /api/v1/compliance/attestations` - List attestations with filtering
 * - `GET /api/v1/compliance/attestations/{id}` - Get specific attestation by ID
 * - `GET /api/v1/compliance/attestations/export/json` - Export attestations as JSON
 * - `GET /api/v1/compliance/attestations/export/csv` - Export attestations as CSV
 * - `POST /api/v1/compliance/attestation` - Generate MICA attestation package for audit
 *
 * ### Whitelist Management
 *
 * - `GET /api/v1/whitelist/{assetId}` - List whitelisted addresses
 * - `POST /api/v1/whitelist` - Add address to whitelist (with KYC fields)
 * - `DELETE /api/v1/whitelist` - Remove address from whitelist
 * - `POST /api/v1/whitelist/bulk` - Bulk add addresses
 * - `POST /api/v1/whitelist/validate-transfer` - Validate if transfer is allowed
 * - `GET /api/v1/whitelist/{assetId}/audit-log` - Get compliance audit trail
 * - `GET /api/v1/whitelist/audit-log` - Get audit logs across all assets
 * - `GET /api/v1/whitelist/audit-log/export/csv` - Export audit log as CSV
 * - `GET /api/v1/whitelist/audit-log/export/json` - Export audit log as JSON
 * - `GET /api/v1/whitelist/audit-log/retention-policy` - Get MICA compliance policy
 *
 * **Documentation:**
 * - [Enforcement Examples & Integration Guide](../WHITELIST_ENFORCEMENT_EXAMPLES.md) - Complete examples for applying whitelist enforcement to token operations
 * - [Frontend Integration Guide](../RWA_WHITELIST_FRONTEND_INTEGRATION.md) - Frontend developer integration guide
 * - [Feature Overview](../WHITELIST_FEATURE.md) - Business value and technical overview
 *
 * ### Network-Specific Compliance Rules
 *
 * #### VOI Network
 * - Requires KYC verification for accredited investor tokens
 * - Jurisdiction must be specified
 *
 * #### Aramid Network
 * - Requires regulatory framework for compliant tokens
 * - Requires max holders specification for security tokens
 *
 * For detailed documentation, see [COMPLIANCE_API.md](COMPLIANCE_API.md)
 *
 * ## Contributing
 *
 * We welcome contributions! Please follow these guidelines:
 *
 * 1. **Fork the repository**
 * 2. **Create a feature branch** (`git checkout -b feature/your-feature`)
 * 3. **Follow TDD practices**:
 *    - Write tests first (they should fail initially)
 *    - Implement the feature to make tests pass
 *    - Refactor while keeping tests green
 * 4. **Add tests for new functionality** - All new code should include appropriate tests
 * 5. **Run tests locally** - Ensure all tests pass before submitting
 * 6. **Open a Pull Request** - The CI pipeline will automatically run tests
 *
 * ### Pull Request Requirements
 * - All tests must pass
 * - Code should build without errors
 * - Include test coverage for new features
 * - Follow existing code style and conventions
 *
 * ## Client generators
 *
 * ```
 * cd BiatecTokensApi/Generated
 * docker run --rm -v ".:/app/out" scholtz2/dotnet-avm-generated-client:latest dotnet client-generator.dll --namespace "BiatecTokensApi.Generated" --url https://raw.githubusercontent.com/scholtz/arc-1400/refs/heads/main/projects/arc-1400/smart_contracts/artifacts/security_token/Arc1644.arc56.json
 * docker run --rm -v ".:/app/out" scholtz2/dotnet-avm-generated-client:latest dotnet client-generator.dll --namespace "BiatecTokensApi.Generated" --url https://raw.githubusercontent.com/scholtz/arc200/refs/heads/main/contracts/artifacts/Arc200.arc56.json
 * ```
 *
 * ## License
 *
 * This project is licensed under the MIT License - see the LICENSE file for details.
 *
 * ## Support
 *
 * For support and questions:
 * - Open an issue on GitHub
 * - Contact the development team
 * - Check the API documentation at `/swagger`
 *
 * ## Changelog
 *
 * ### Version 1.0
 * - Initial release
 * - Support for ERC20, ASA, ARC3, and ARC200 tokens
 * - Multi-network support
 * - ARC-0014 authentication integration
 * - IPFS metadata support for ARC3 tokens
 *
 * ## Subscription Metering
 *
 * This API includes subscription metering for compliance and whitelist operations. Metering events are emitted as structured logs for billing analytics. See SUBSCRIPTION_METERING.md for detailed documentation on the metering schema and integration.
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * @description This endpoint provides a comprehensive view of usage across all metered operations for the current billing period. It includes: - Token issuance count - Transfer validation count - Audit export count - Storage items count - Compliance operation count - Whitelist operation count - Current plan limits - Limit violation warnings **Authentication:** Requires ARC-0014 authentication. The authenticated user's address is used as the tenant identifier. **Billing Period:** Usage is tracked per calendar month. The period automatically resets on the first day of each month. **Use Cases:** - Billing dashboard display - Usage analytics and forecasting - Limit monitoring and alerts - Compliance reporting
     *
     * @tags Billing
     * @name V1BillingUsageList
     * @summary Gets usage summary for the authenticated tenant
     * @request GET:/api/v1/billing/usage
     * @secure
     */
    v1BillingUsageList: (params: RequestParams = {}) =>
      this.request<UsageSummaryResponse, ProblemDetails | void>({
        path: `/api/v1/billing/usage`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint performs a preflight check to determine if a planned operation would exceed the tenant's plan limits. It does NOT record usage or perform the actual operation - it only checks if the operation would be allowed. **Authentication:** Requires ARC-0014 authentication. The authenticated user's address is used as the tenant identifier. **Operation Types:** - TokenIssuance: Token creation/deployment operations - TransferValidation: Transfer validation checks - AuditExport: Audit log export operations - Storage: Storage item additions (whitelist entries, compliance metadata) - ComplianceOperation: Compliance metadata operations - WhitelistOperation: Whitelist management operations **Response:** - IsAllowed: Whether the operation is permitted - CurrentUsage: Current usage count for this operation type - MaxAllowed: Maximum allowed operations (-1 for unlimited) - RemainingCapacity: Available capacity (-1 for unlimited) - DenialReason: Explanation if operation is denied - ErrorCode: "LIMIT_EXCEEDED" if denied due to limit **Error Handling:** When limits are exceeded, the response includes: - Clear error message explaining the violation - Current usage vs limit details - Suggestion to upgrade subscription - Audit log entry for compliance review **Use Cases:** - Pre-flight validation before expensive operations - UI elements showing available capacity - Preventing unnecessary API calls that would fail - Billing reconciliation and limit enforcement
     *
     * @tags Billing
     * @name V1BillingLimitsCheckCreate
     * @summary Checks if a planned operation would exceed plan limits (preflight check)
     * @request POST:/api/v1/billing/limits/check
     * @secure
     */
    v1BillingLimitsCheckCreate: (
      data: LimitCheckRequest,
      params: RequestParams = {},
    ) =>
      this.request<LimitCheckResponse, ProblemDetails | void>({
        path: `/api/v1/billing/limits/check`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint allows administrators to customize plan limits for specific tenants, overriding the default tier-based limits. Changes are logged to the audit repository for compliance review and billing reconciliation. **Authorization:** Requires ARC-0014 authentication AND admin role. Only addresses configured as admins (currently the app account) can call this endpoint. Non-admin attempts are logged and return a 403 Forbidden response. **Plan Limits:** All limits use -1 to indicate unlimited capacity: - MaxTokenIssuance: Maximum tokens that can be issued per period - MaxTransferValidations: Maximum transfer validations per period - MaxAuditExports: Maximum audit exports per period - MaxStorageItems: Maximum storage items (whitelist entries, etc.) - MaxComplianceOperations: Maximum compliance operations per period - MaxWhitelistOperations: Maximum whitelist operations per period **Audit Trail:** Every plan limit update creates an audit log entry containing: - Admin who performed the update - Tenant whose limits were changed - Timestamp of the change - Optional notes explaining the change - All new limit values **Use Cases:** - Custom enterprise agreements - Temporary limit increases for special events - Granular control over tenant capabilities - Compliance with custom SLAs - Testing and development environments **Security:** Failed authorization attempts are logged for security monitoring. Admin status is determined by comparing authenticated address against configured admin addresses.
     *
     * @tags Billing
     * @name V1BillingLimitsUpdate
     * @summary Updates plan limits for a specific tenant (admin only)
     * @request PUT:/api/v1/billing/limits/{tenantAddress}
     * @secure
     */
    v1BillingLimitsUpdate: (
      tenantAddress: string,
      data: UpdatePlanLimitsRequest,
      params: RequestParams = {},
    ) =>
      this.request<PlanLimitsResponse, ProblemDetails | void>({
        path: `/api/v1/billing/limits/${tenantAddress}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint retrieves the current plan limits for the authenticated tenant. Limits may be tier-based defaults or custom limits set by an administrator. **Authentication:** Requires ARC-0014 authentication. The authenticated user's address is used as the tenant identifier. **Limit Sources:** 1. Custom limits (set via admin endpoint) - highest priority 2. Tier-based defaults (from subscription tier) **Response:** Returns PlanLimits object with all limit values. A value of -1 indicates unlimited capacity. **Use Cases:** - Displaying current plan details in UI - Determining available features - Planning resource usage - Upgrade decision support
     *
     * @tags Billing
     * @name V1BillingLimitsList
     * @summary Gets current plan limits for the authenticated tenant
     * @request GET:/api/v1/billing/limits
     * @secure
     */
    v1BillingLimitsList: (params: RequestParams = {}) =>
      this.request<PlanLimitsResponse, ProblemDetails | void>({
        path: `/api/v1/billing/limits`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Compliance
     * @name V1ComplianceDetail
     * @summary Gets compliance metadata for a specific token
     * @request GET:/api/v1/compliance/{assetId}
     * @secure
     */
    v1ComplianceDetail: (assetId: number, params: RequestParams = {}) =>
      this.request<ComplianceMetadataResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/${assetId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation emits a metering event for billing analytics with the following details: - Category: Compliance - OperationType: Delete - Network: Not available - PerformedBy: Not available - ItemCount: 1
     *
     * @tags Compliance
     * @name V1ComplianceDelete
     * @summary Deletes compliance metadata for a specific token
     * @request DELETE:/api/v1/compliance/{assetId}
     * @secure
     */
    v1ComplianceDelete: (assetId: number, params: RequestParams = {}) =>
      this.request<ComplianceMetadataResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/${assetId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation emits a metering event for billing analytics with the following details: - Category: Compliance - OperationType: Upsert - Network: From request - PerformedBy: Authenticated user - ItemCount: 1
     *
     * @tags Compliance
     * @name V1ComplianceCreate
     * @summary Creates or updates compliance metadata for a token
     * @request POST:/api/v1/compliance
     * @secure
     */
    v1ComplianceCreate: (
      data: UpsertComplianceMetadataRequest,
      params: RequestParams = {},
    ) =>
      this.request<ComplianceMetadataResponse, ProblemDetails | void>({
        path: `/api/v1/compliance`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Compliance
     * @name V1ComplianceList
     * @summary Lists compliance metadata with optional filtering
     * @request GET:/api/v1/compliance
     * @secure
     */
    v1ComplianceList: (
      query?: {
        /** Optional filter by compliance status */
        complianceStatus?: ComplianceStatus;
        /** Optional filter by verification status */
        verificationStatus?: VerificationStatus;
        /** Optional filter by network */
        network?: string;
        /**
         * Page number (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size (default: 20, max: 100)
         * @format int32
         * @default 20
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ComplianceMetadataListResponse, ProblemDetails | void>({
        path: `/api/v1/compliance`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint provides access to immutable audit logs for compliance reporting and incident investigations. All compliance operations (create, update, delete, read, list) are logged with timestamps, actors, and results. **Retention Policy**: Audit logs are retained for a minimum of 7 years to comply with MICA regulations. All entries are immutable and cannot be modified or deleted. **Use Cases**: - Regulatory compliance reporting - Incident investigations - Access audits - Change tracking Requires ARC-0014 authentication. Recommended for compliance and admin roles only.
     *
     * @tags Compliance
     * @name V1ComplianceAuditLogList
     * @summary Gets audit log for compliance operations with optional filtering
     * @request GET:/api/v1/compliance/audit-log
     * @secure
     */
    v1ComplianceAuditLogList: (
      query?: {
        /**
         * Optional filter by asset ID (token ID)
         * @format int64
         */
        assetId?: number;
        /** Optional filter by network */
        network?: string;
        /** Optional filter by action type */
        actionType?: ComplianceActionType;
        /** Optional filter by user who performed the action */
        performedBy?: string;
        /** Optional filter by operation result (success/failure) */
        success?: boolean;
        /**
         * Optional start date filter
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter
         * @format date-time
         */
        toDate?: string;
        /**
         * Page number (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size (default: 50, max: 100)
         * @format int32
         * @default 50
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ComplianceAuditLogResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/audit-log`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Exports audit log entries matching the filter criteria as a CSV file for regulatory compliance reporting. The CSV includes all audit fields: timestamp, actor, action, asset ID, network, result, and notes. **Format**: Standard CSV with headers **Encoding**: UTF-8 **Max Records**: 10,000 per export (use pagination for larger datasets) **Metering**: This operation emits a subscription metering event for billing analytics with: - Category: Compliance - OperationType: Export - Metadata: export format (csv), export type (auditLog), row count, time range Requires ARC-0014 authentication. Recommended for compliance and admin roles only.
     *
     * @tags Compliance
     * @name V1ComplianceAuditLogExportCsvList
     * @summary Exports audit log as CSV for compliance reporting
     * @request GET:/api/v1/compliance/audit-log/export/csv
     * @secure
     */
    v1ComplianceAuditLogExportCsvList: (
      query?: {
        /**
         * Optional filter by asset ID (token ID)
         * @format int64
         */
        assetId?: number;
        /** Optional filter by network */
        network?: string;
        /** Optional filter by action type */
        actionType?: ComplianceActionType;
        /** Optional filter by user who performed the action */
        performedBy?: string;
        /** Optional filter by operation result (success/failure) */
        success?: boolean;
        /**
         * Optional start date filter
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter
         * @format date-time
         */
        toDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails | void>({
        path: `/api/v1/compliance/audit-log/export/csv`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Exports audit log entries matching the filter criteria as a JSON file for regulatory compliance reporting. The JSON includes all audit fields and retention policy metadata. **Format**: Standard JSON array **Encoding**: UTF-8 **Max Records**: 10,000 per export (use pagination for larger datasets) **Metering**: This operation emits a subscription metering event for billing analytics with: - Category: Compliance - OperationType: Export - Metadata: export format (json), export type (auditLog), row count, time range Requires ARC-0014 authentication. Recommended for compliance and admin roles only.
     *
     * @tags Compliance
     * @name V1ComplianceAuditLogExportJsonList
     * @summary Exports audit log as JSON for compliance reporting
     * @request GET:/api/v1/compliance/audit-log/export/json
     * @secure
     */
    v1ComplianceAuditLogExportJsonList: (
      query?: {
        /**
         * Optional filter by asset ID (token ID)
         * @format int64
         */
        assetId?: number;
        /** Optional filter by network */
        network?: string;
        /** Optional filter by action type */
        actionType?: ComplianceActionType;
        /** Optional filter by user who performed the action */
        performedBy?: string;
        /** Optional filter by operation result (success/failure) */
        success?: boolean;
        /**
         * Optional start date filter
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter
         * @format date-time
         */
        toDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<ComplianceAuditLogResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/audit-log/export/json`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns metadata about the audit log retention policy including minimum retention period, regulatory framework, and immutability guarantees. This endpoint is useful for compliance teams to understand data retention policies.
     *
     * @tags Compliance
     * @name V1ComplianceAuditLogRetentionPolicyList
     * @summary Gets the audit log retention policy metadata
     * @request GET:/api/v1/compliance/audit-log/retention-policy
     * @secure
     */
    v1ComplianceAuditLogRetentionPolicyList: (params: RequestParams = {}) =>
      this.request<AuditRetentionPolicy, ProblemDetails | void>({
        path: `/api/v1/compliance/audit-log/retention-policy`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint validates token configuration against MICA/RWA compliance rules used by frontend presets. It checks for: - Missing whitelist or issuer controls - KYC verification requirements - Jurisdiction and regulatory framework requirements - Network-specific compliance rules (VOI, Aramid) - Security token specific requirements The endpoint returns actionable validation errors that must be fixed and warnings that should be reviewed. Use this endpoint before token deployment to ensure compliance with applicable regulations.
     *
     * @tags Compliance
     * @name V1ComplianceValidatePresetCreate
     * @summary Validates token configuration against MICA/RWA compliance rules
     * @request POST:/api/v1/compliance/validate-preset
     * @secure
     */
    v1ComplianceValidatePresetCreate: (
      data: ValidateTokenPresetRequest,
      params: RequestParams = {},
    ) =>
      this.request<ValidateTokenPresetResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/validate-preset`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation creates a wallet-level compliance attestation that provides cryptographic proof of compliance verification. Attestations are used for MICA/RWA workflows to maintain persistent compliance audit trails for issuers. **Key Features**: - Links attestation to specific wallet and token - Stores cryptographic proof hash (IPFS CID, SHA-256, etc.) - Supports multiple attestation types (KYC, AML, Accreditation) - Optional expiration dates for time-limited attestations This operation emits a metering event for billing analytics. Requires ARC-0014 authentication.
     *
     * @tags Compliance
     * @name V1ComplianceAttestationsCreate
     * @summary Creates a new compliance attestation
     * @request POST:/api/v1/compliance/attestations
     * @secure
     */
    v1ComplianceAttestationsCreate: (
      data: CreateComplianceAttestationRequest,
      params: RequestParams = {},
    ) =>
      this.request<ComplianceAttestationResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/attestations`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Lists compliance attestations with flexible filtering options. **Common Use Cases**: - List all attestations for a specific wallet - List all attestations for a specific token - List attestations by issuer - Filter by verification status (Pending, Verified, Failed, Expired, Revoked) - Filter by attestation type (KYC, AML, Accreditation, etc.) Note: This is a read operation and does not emit metering events. Requires ARC-0014 authentication.
     *
     * @tags Compliance
     * @name V1ComplianceAttestationsList
     * @summary Lists compliance attestations with optional filtering
     * @request GET:/api/v1/compliance/attestations
     * @secure
     */
    v1ComplianceAttestationsList: (
      query?: {
        /** Optional filter by wallet address */
        walletAddress?: string;
        /**
         * Optional filter by asset ID (token ID)
         * @format int64
         */
        assetId?: number;
        /** Optional filter by issuer address */
        issuerAddress?: string;
        /** Optional filter by verification status */
        verificationStatus?: AttestationVerificationStatus;
        /** Optional filter by attestation type */
        attestationType?: string;
        /** Optional filter by network */
        network?: string;
        /** Optional filter to exclude expired attestations */
        excludeExpired?: boolean;
        /**
         * Page number (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size (default: 20, max: 100)
         * @format int32
         * @default 20
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ComplianceAttestationListResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/attestations`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieves a specific compliance attestation by its unique identifier. The attestation includes wallet address, issuer, proof hash, verification status, and metadata. Expired attestations are automatically marked with Expired status when retrieved. Requires ARC-0014 authentication.
     *
     * @tags Compliance
     * @name V1ComplianceAttestationsDetail
     * @summary Gets a compliance attestation by ID
     * @request GET:/api/v1/compliance/attestations/{id}
     * @secure
     */
    v1ComplianceAttestationsDetail: (id: string, params: RequestParams = {}) =>
      this.request<ComplianceAttestationResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/attestations/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Exports attestation history matching the filter criteria as a JSON file for regulatory compliance reporting. The JSON includes all attestation fields: ID, wallet address, asset ID, issuer, proof hash, verification status, attestation type, network, jurisdiction, regulatory framework, issued date, expiration date, and metadata. **Format**: Standard JSON array of attestation objects **Use Cases**: - Enterprise audit trail export - Regulator reporting and disclosure - Compliance verification for token holders - Historical attestation analysis **Pagination**: Maximum 10,000 records per export for performance. Use pagination for larger datasets. **Metering**: This operation emits a subscription metering event for billing analytics with: - Category: Compliance - OperationType: Export - Metadata: export format (json), export type (attestations), row count, time range **Filters**: Combine multiple filters to narrow down results (e.g., specific token + date range + wallet).
     *
     * @tags Compliance
     * @name V1ComplianceAttestationsExportJsonList
     * @summary Exports attestation audit history as JSON for compliance reporting
     * @request GET:/api/v1/compliance/attestations/export/json
     * @secure
     */
    v1ComplianceAttestationsExportJsonList: (
      query?: {
        /** Optional filter by wallet address */
        walletAddress?: string;
        /**
         * Optional filter by asset ID (token ID)
         * @format int64
         */
        assetId?: number;
        /** Optional filter by issuer address */
        issuerAddress?: string;
        /** Optional filter by verification status */
        verificationStatus?: AttestationVerificationStatus;
        /** Optional filter by attestation type */
        attestationType?: string;
        /** Optional filter by network */
        network?: string;
        /** Optional filter to exclude expired attestations */
        excludeExpired?: boolean;
        /**
         * Optional start date filter (filter by IssuedAt)
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter (filter by IssuedAt)
         * @format date-time
         */
        toDate?: string;
        /**
         * Page number for pagination (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size for pagination (default: 100, max: 10000)
         * @format int32
         * @default 100
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ComplianceAttestation[], ProblemDetails | void>({
        path: `/api/v1/compliance/attestations/export/json`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Exports attestation history matching the filter criteria as a CSV file for regulatory compliance reporting. The CSV includes all attestation fields: ID, wallet address, asset ID, issuer, proof hash, verification status, attestation type, network, jurisdiction, regulatory framework, issued date, expiration date, and metadata. **Format**: Standard CSV with headers **Use Cases**: - Enterprise audit trail export - Regulator reporting and disclosure - Compliance verification for token holders - Historical attestation analysis - Import into Excel or other tools **Pagination**: Maximum 10,000 records per export for performance. Use pagination for larger datasets. **Metering**: This operation emits a subscription metering event for billing analytics with: - Category: Compliance - OperationType: Export - Metadata: export format (csv), export type (attestations), row count, time range **Filters**: Combine multiple filters to narrow down results (e.g., specific token + date range + wallet).
     *
     * @tags Compliance
     * @name V1ComplianceAttestationsExportCsvList
     * @summary Exports attestation audit history as CSV for compliance reporting
     * @request GET:/api/v1/compliance/attestations/export/csv
     * @secure
     */
    v1ComplianceAttestationsExportCsvList: (
      query?: {
        /** Optional filter by wallet address */
        walletAddress?: string;
        /**
         * Optional filter by asset ID (token ID)
         * @format int64
         */
        assetId?: number;
        /** Optional filter by issuer address */
        issuerAddress?: string;
        /** Optional filter by verification status */
        verificationStatus?: AttestationVerificationStatus;
        /** Optional filter by attestation type */
        attestationType?: string;
        /** Optional filter by network */
        network?: string;
        /** Optional filter to exclude expired attestations */
        excludeExpired?: boolean;
        /**
         * Optional start date filter (filter by IssuedAt)
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter (filter by IssuedAt)
         * @format date-time
         */
        toDate?: string;
        /**
         * Page number for pagination (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size for pagination (default: 100, max: 10000)
         * @format int32
         * @default 100
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails | void>({
        path: `/api/v1/compliance/attestations/export/csv`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description This endpoint generates verifiable audit artifacts for regulators and enterprise issuers. The attestation package includes: - Issuer metadata (creator address, network information) - Token details (asset ID, compliance metadata) - Whitelist policy information (if applicable) - Latest compliance status and verification status - All attestations within the specified date range - Deterministic content hash for verification - Signature metadata for audit trail **Supported Formats**: - json: Structured JSON package (default) - pdf: PDF document (future enhancement) **MICA Compliance**: This endpoint aligns with MICA reporting requirements by providing: - Complete audit trail of compliance attestations - Verifiable cryptographic signatures - Regulatory framework and jurisdiction information - KYC/AML verification status **Use Cases**: - Regulatory audit submissions - Enterprise compliance reporting - Investor disclosure packages - Quarterly/Annual compliance reviews This operation emits a metering event for billing analytics. Requires ARC-0014 authentication.
     *
     * @tags Compliance
     * @name V1ComplianceAttestationCreate
     * @summary Generates a signed compliance attestation package for MICA audits
     * @request POST:/api/v1/compliance/attestation
     * @secure
     */
    v1ComplianceAttestationCreate: (
      data: GenerateAttestationPackageRequest,
      params: RequestParams = {},
    ) =>
      this.request<AttestationPackageResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/attestation`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint provides enterprise-grade compliance reporting for VOI/Aramid networks. It aggregates compliance metadata, whitelist statistics, and audit logs to support MICA dashboard requirements and regulatory reporting. The report includes: - Compliance metadata (KYC, verification status, regulatory framework) - Whitelist summary statistics (active/revoked addresses, KYC counts) - Compliance audit log (metadata changes) - Whitelist audit log (address additions/removals) - Transfer validation audit log (allowed/denied transfers) - Compliance health score (0-100) - VOI/Aramid specific compliance status - Warnings and recommendations - Subscription tier information This operation emits a metering event for billing analytics. Example usage: - VOI network report: GET /api/v1/compliance/report?network=voimain-v1.0 - Aramid network report: GET /api/v1/compliance/report?network=aramidmain-v1.0 - Specific token: GET /api/v1/compliance/report?assetId=12345 - Date range: GET /api/v1/compliance/report?fromDate=2026-01-01&toDate=2026-01-31
     *
     * @tags Compliance
     * @name V1ComplianceReportList
     * @summary Generates a comprehensive compliance report for VOI/Aramid tokens
     * @request GET:/api/v1/compliance/report
     * @secure
     */
    v1ComplianceReportList: (
      query?: {
        /**
         * Optional filter by specific asset ID
         * @format int64
         */
        assetId?: number;
        /** Optional filter by network (voimain-v1.0, aramidmain-v1.0) */
        network?: string;
        /**
         * Optional start date for audit events
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date for audit events
         * @format date-time
         */
        toDate?: string;
        /**
         * Include detailed whitelist information
         * @default true
         */
        includeWhitelistDetails?: boolean;
        /**
         * Include recent transfer validation audit events
         * @default true
         */
        includeTransferAudits?: boolean;
        /**
         * Include compliance metadata changes audit log
         * @default true
         */
        includeComplianceAudits?: boolean;
        /**
         * Maximum number of audit entries per category
         * @format int32
         * @default 100
         */
        maxAuditEntriesPerCategory?: number;
        /**
         * Page number for pagination
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size for pagination
         * @format int32
         * @default 50
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<TokenComplianceReportResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/report`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Compliance
     * @name V1ComplianceBlacklistCreate
     * @summary Adds an address to the blacklist
     * @request POST:/api/v1/compliance/blacklist
     * @secure
     */
    v1ComplianceBlacklistCreate: (
      data: AddBlacklistEntryRequest,
      params: RequestParams = {},
    ) =>
      this.request<BlacklistResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/blacklist`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Compliance
     * @name V1ComplianceBlacklistList
     * @summary Lists blacklist entries with filtering
     * @request GET:/api/v1/compliance/blacklist
     * @secure
     */
    v1ComplianceBlacklistList: (
      query?: {
        /** Optional address filter */
        address?: string;
        /**
         * Optional asset ID filter
         * @format int64
         */
        assetId?: number;
        /** Optional category filter */
        category?: BlacklistCategory;
        /** Optional status filter */
        status?: BlacklistStatus;
        /** Optional network filter */
        network?: string;
        /**
         * Page number (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size (default: 20, max: 100)
         * @format int32
         * @default 20
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<BlacklistListResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/blacklist`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Compliance
     * @name V1ComplianceBlacklistCheckList
     * @summary Checks if an address is blacklisted
     * @request GET:/api/v1/compliance/blacklist/check
     * @secure
     */
    v1ComplianceBlacklistCheckList: (
      query?: {
        /** The address to check */
        address?: string;
        /**
         * Optional asset ID
         * @format int64
         */
        assetId?: number;
        /** Optional network filter */
        network?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<BlacklistCheckResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/blacklist/check`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Compliance
     * @name V1ComplianceBlacklistDelete
     * @summary Removes a blacklist entry
     * @request DELETE:/api/v1/compliance/blacklist/{id}
     * @secure
     */
    v1ComplianceBlacklistDelete: (id: string, params: RequestParams = {}) =>
      this.request<BlacklistResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/blacklist/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Compliance
     * @name V1ComplianceValidateTransferCreate
     * @summary Validates a proposed transfer against compliance rules
     * @request POST:/api/v1/compliance/validate-transfer
     * @secure
     */
    v1ComplianceValidateTransferCreate: (
      data: ValidateComplianceTransferRequest,
      params: RequestParams = {},
    ) =>
      this.request<TransferValidationResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/validate-transfer`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Compliance
     * @name V1ComplianceMicaChecklistList
     * @summary Gets MICA compliance checklist for a token
     * @request GET:/api/v1/compliance/{assetId}/mica-checklist
     * @secure
     */
    v1ComplianceMicaChecklistList: (
      assetId: number,
      params: RequestParams = {},
    ) =>
      this.request<MicaComplianceChecklistResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/${assetId}/mica-checklist`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Compliance
     * @name V1ComplianceHealthList
     * @summary Gets aggregate compliance health for an issuer
     * @request GET:/api/v1/compliance/health
     * @secure
     */
    v1ComplianceHealthList: (
      query?: {
        /** Optional issuer address filter (if not provided, uses authenticated user) */
        issuerAddress?: string;
        /** Optional network filter */
        network?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<ComplianceHealthResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/health`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Generates a comprehensive compliance evidence bundle for MICA/RWA audit purposes. **Bundle Contents:** - **manifest.json**: Complete manifest with SHA256 checksums of all files - **README.txt**: Human-readable documentation of bundle contents - **metadata/compliance_metadata.json**: Token compliance metadata (KYC, jurisdiction, regulatory framework) - **whitelist/current_entries.json**: Current whitelist entries - **whitelist/audit_log.json**: Complete whitelist operation history - **audit_logs/compliance_operations.json**: Compliance metadata operation logs - **audit_logs/transfer_validations.json**: Transfer validation records - **policy/retention_policy.json**: 7-year MICA retention policy details **Manifest Features:** - Bundle ID for tracking and audit trail - Generation timestamp (UTC) - Generator's Algorand address - SHA256 checksums for all included files - SHA256 checksum for entire bundle - Summary statistics (record counts, date ranges, categories) - Network information (VOI, Aramid, etc.) **Use Cases:** - MICA compliance audits - Regulatory investigations - External auditor submissions - Procurement compliance evidence - Long-term archival and retention **Access Control:** - Requires ARC-0014 authentication - Recommended for compliance officers and auditors only - Export event is logged in audit trail - Metering event emitted for subscription tracking **Filtering:** - Optional date range filtering (fromDate, toDate) - Selective inclusion of evidence types - Asset-specific data only **Security:** - All files include SHA256 checksums for integrity verification - Bundle includes overall SHA256 checksum - Timestamp ensures temporal ordering - Immutable source data (append-only logs) **File Format:** - Filename: compliance-evidence-{assetId}-{timestamp}.zip - Content-Type: application/zip - All JSON files are UTF-8 encoded with pretty-printing
     *
     * @tags Compliance
     * @name V1ComplianceEvidenceBundleCreate
     * @summary Generates a signed compliance evidence bundle (ZIP) for auditors
     * @request POST:/api/v1/compliance/evidence-bundle
     * @secure
     */
    v1ComplianceEvidenceBundleCreate: (
      data: GenerateComplianceEvidenceBundleRequest,
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails | void>({
        path: `/api/v1/compliance/evidence-bundle`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint returns compliance metadata for each supported blockchain network, including MICA readiness status, whitelisting requirements, and regulatory specifications. Use this to display network-specific compliance indicators in the frontend and help users understand compliance requirements when deploying tokens to different networks. Response includes cache headers (CacheDurationSeconds) to optimize frontend performance. Networks included: - VOI Mainnet (voimain-v1.0): MICA-ready, requires jurisdiction - Aramid Mainnet (aramidmain-v1.0): MICA-ready, requires regulatory framework - Algorand Mainnet (mainnet-v1.0): MICA-ready, optional compliance - Algorand Testnet (testnet-v1.0): Development only - Algorand Betanet (betanet-v1.0): Testing only
     *
     * @tags Compliance
     * @name V1ComplianceNetworksList
     * @summary Gets per-network compliance metadata for all supported blockchain networks
     * @request GET:/api/v1/compliance/networks
     * @secure
     */
    v1ComplianceNetworksList: (params: RequestParams = {}) =>
      this.request<NetworkComplianceMetadataResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/networks`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint provides enterprise-grade compliance dashboard aggregations for scheduled exports and compliance posture tracking. Supports filtering by network, token standard, and date range. **Use Cases:** - Enterprise compliance dashboards - Scheduled compliance exports - Compliance posture tracking across assets - Regulatory reporting automation - MICA readiness assessment **Aggregations Provided:** - MICA readiness statistics (compliant, nearly compliant, in progress, non-compliant) - Whitelist status metrics (enabled/disabled, active/revoked/suspended addresses) - Jurisdiction coverage (distribution, unique jurisdictions) - Compliant vs restricted asset counts - Top restriction reasons with occurrence counts - Token standard and network distribution **Filters:** All filters are optional and can be combined for precise queries. **Asset Breakdown:** Set includeAssetBreakdown=true to get detailed per-asset compliance information. This is useful for drill-down analysis but increases response size. **Security:** Requires ARC-0014 authentication. Recommended for compliance and admin roles only.
     *
     * @tags Compliance
     * @name V1ComplianceDashboardAggregationList
     * @summary Gets aggregated compliance dashboard metrics for enterprise reporting
     * @request GET:/api/v1/compliance/dashboard-aggregation
     * @secure
     */
    v1ComplianceDashboardAggregationList: (
      query?: {
        /** Optional filter by network (voimain-v1.0, aramidmain-v1.0, mainnet-v1.0, etc.) */
        network?: string;
        /** Optional filter by token standard (ASA, ARC3, ARC200, ARC1400, ERC20) */
        tokenStandard?: string;
        /**
         * Optional start date filter (ISO 8601 format)
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter (ISO 8601 format)
         * @format date-time
         */
        toDate?: string;
        /**
         * Include detailed asset breakdown (default: false)
         * @default false
         */
        includeAssetBreakdown?: boolean;
        /**
         * Maximum number of top restriction reasons to include (default: 10)
         * @format int32
         * @default 10
         */
        topRestrictionsCount?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        ComplianceDashboardAggregationResponse,
        ProblemDetails | void
      >({
        path: `/api/v1/compliance/dashboard-aggregation`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Exports aggregated compliance metrics in CSV format for enterprise reporting and scheduled exports. **CSV Format:** - UTF-8 encoding with proper CSV escaping - Summary metrics section with all aggregations - MICA readiness section - Whitelist status section - Jurisdiction coverage section - Compliance counts section - Top restriction reasons section - Token standard distribution section - Network distribution section - Optional detailed asset breakdown section **Use Cases:** - Scheduled compliance exports for enterprise systems - Executive reporting (spreadsheet analysis) - Compliance posture tracking over time - Cross-asset compliance analysis - Regulatory audit preparation **Filename:** - Format: compliance-dashboard-{timestamp}.csv - Timestamp in yyyyMMddHHmmss format **Security:** Requires ARC-0014 authentication. Recommended for compliance and admin roles only.
     *
     * @tags Compliance
     * @name V1ComplianceDashboardAggregationCsvList
     * @summary Exports compliance dashboard aggregation data as CSV
     * @request GET:/api/v1/compliance/dashboard-aggregation/csv
     * @secure
     */
    v1ComplianceDashboardAggregationCsvList: (
      query?: {
        /** Optional filter by network (voimain-v1.0, aramidmain-v1.0, mainnet-v1.0, etc.) */
        network?: string;
        /** Optional filter by token standard (ASA, ARC3, ARC200, ARC1400, ERC20) */
        tokenStandard?: string;
        /**
         * Optional start date filter (ISO 8601 format)
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter (ISO 8601 format)
         * @format date-time
         */
        toDate?: string;
        /**
         * Include detailed asset breakdown (default: false)
         * @default false
         */
        includeAssetBreakdown?: boolean;
        /**
         * Maximum number of top restriction reasons to include (default: 10)
         * @format int32
         * @default 10
         */
        topRestrictionsCount?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails | void>({
        path: `/api/v1/compliance/dashboard-aggregation/csv`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Exports aggregated compliance metrics in JSON format for programmatic access and API integrations. **JSON Format:** - Pretty-printed JSON with camelCase property names - Includes full aggregation response structure with metadata - Complete metrics with all distribution data - Optional detailed asset breakdown **Use Cases:** - Programmatic dashboard data feeds - API integrations with compliance management systems - Automated compliance monitoring - Data archival for long-term tracking - Real-time compliance posture analysis **Filename:** - Format: compliance-dashboard-{timestamp}.json - Timestamp in yyyyMMddHHmmss format **Security:** Requires ARC-0014 authentication. Recommended for compliance and admin roles only.
     *
     * @tags Compliance
     * @name V1ComplianceDashboardAggregationJsonList
     * @summary Exports compliance dashboard aggregation data as JSON
     * @request GET:/api/v1/compliance/dashboard-aggregation/json
     * @secure
     */
    v1ComplianceDashboardAggregationJsonList: (
      query?: {
        /** Optional filter by network (voimain-v1.0, aramidmain-v1.0, mainnet-v1.0, etc.) */
        network?: string;
        /** Optional filter by token standard (ASA, ARC3, ARC200, ARC1400, ERC20) */
        tokenStandard?: string;
        /**
         * Optional start date filter (ISO 8601 format)
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter (ISO 8601 format)
         * @format date-time
         */
        toDate?: string;
        /**
         * Include detailed asset breakdown (default: false)
         * @default false
         */
        includeAssetBreakdown?: boolean;
        /**
         * Maximum number of top restriction reasons to include (default: 10)
         * @format int32
         * @default 10
         */
        topRestrictionsCount?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails | void>({
        path: `/api/v1/compliance/dashboard-aggregation/json`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Provides enterprise-grade MICA/RWA compliance observability metrics including: **Whitelist Enforcement Metrics:** - Total transfer validations performed - Allowed vs denied transfers with percentages - Top denial reasons with occurrence counts - Network-specific enforcement breakdown - Assets with enforcement enabled count **Audit Log Health:** - Total audit entries (compliance + whitelist) - Oldest and newest entry timestamps - MICA retention compliance status (7-year requirement) - Health status (Healthy, Warning, Critical) - Coverage percentage and health issues **Network Retention Status:** - Per-network audit entry counts (VOI/Aramid focus) - Retention period compliance - Asset counts and compliance coverage - Network-specific status messages **Overall Health Score:** - Composite score (0-100) based on all metrics Designed for real-time compliance monitoring dashboards and regulatory reporting.
     *
     * @tags Compliance
     * @name V1ComplianceMonitoringMetricsList
     * @summary Gets comprehensive compliance monitoring metrics including whitelist enforcement, audit health, and retention status
     * @request GET:/api/v1/compliance/monitoring/metrics
     * @secure
     */
    v1ComplianceMonitoringMetricsList: (
      query?: {
        /** Optional filter by network (voimain-v1.0, aramidmain-v1.0, etc.) */
        network?: string;
        /**
         * Optional filter by asset ID
         * @format int64
         */
        assetId?: number;
        /**
         * Optional start date for metrics calculation (ISO 8601 format)
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date for metrics calculation (ISO 8601 format)
         * @format date-time
         */
        toDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<ComplianceMonitoringMetricsResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/monitoring/metrics`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Provides audit log health monitoring metrics for MICA compliance: **Metrics Included:** - Total audit entries (compliance + whitelist) - Compliance and whitelist entry counts - Oldest and newest entry timestamps - MICA retention compliance (7-year requirement) - Health status: Healthy, Warning, or Critical - Coverage percentage (estimated) - List of health issues if any **Health Status Determination:** - Healthy: All requirements met, adequate logging - Warning: Minor issues (e.g., low entry count, recent deployment) - Critical: Major issues (e.g., no audit entries, retention violation) Critical for demonstrating compliance with MICA audit trail requirements.
     *
     * @tags Compliance
     * @name V1ComplianceMonitoringAuditHealthList
     * @summary Gets audit log health status including retention compliance and coverage metrics
     * @request GET:/api/v1/compliance/monitoring/audit-health
     * @secure
     */
    v1ComplianceMonitoringAuditHealthList: (
      query?: {
        /** Optional filter by network (voimain-v1.0, aramidmain-v1.0, etc.) */
        network?: string;
        /**
         * Optional filter by asset ID
         * @format int64
         */
        assetId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<AuditHealthResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/monitoring/audit-health`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Provides per-network retention monitoring for RWA compliance: **Per-Network Metrics:** - Network name and MICA compliance requirement flag - Total audit entries for the network - Oldest audit entry timestamp - Retention period (7 years for MICA) - Retention compliance status (met/not met) - Asset count on the network - Assets with compliance metadata count - Compliance coverage percentage - Status: Active, Warning, or Critical - Human-readable status message **Network Focus:** - VOI (voimain-v1.0) - Requires MICA compliance - Aramid (aramidmain-v1.0) - Requires MICA compliance - Also supports mainnet-v1.0 and testnet-v1.0 **Overall Retention Score:** - Composite score (0-100) across all networks - Weighted by retention compliance and coverage Essential for demonstrating network-specific compliance with regulatory requirements.
     *
     * @tags Compliance
     * @name V1ComplianceMonitoringRetentionStatusList
     * @summary Gets retention status per network with focus on VOI and Aramid networks for RWA compliance
     * @request GET:/api/v1/compliance/monitoring/retention-status
     * @secure
     */
    v1ComplianceMonitoringRetentionStatusList: (
      query?: {
        /** Optional filter by specific network (voimain-v1.0, aramidmain-v1.0, mainnet-v1.0, testnet-v1.0) */
        network?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<RetentionStatusResponse, ProblemDetails | void>({
        path: `/api/v1/compliance/monitoring/retention-status`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint provides a unified view of all audit events across whitelist/blacklist and compliance operations. **Use Cases:** - MICA compliance reporting and audits - Regulatory investigation support - Enterprise compliance dashboards - Network-specific audit trails (VOI, Aramid) - Cross-asset incident investigations **Filtering:** All filters are optional and can be combined for precise queries. Date filters support ISO 8601 format. **Networks:** - voimain-v1.0: VOI mainnet - aramidmain-v1.0: Aramid mainnet - mainnet-v1.0: Algorand mainnet - testnet-v1.0: Algorand testnet **Response includes:** - Paginated audit entries ordered by most recent first - Total count and page information - 7-year MICA retention policy metadata - Summary statistics (event counts, date ranges, networks, assets) **Security:** Requires ARC-0014 authentication. Recommended for compliance and admin roles only.
     *
     * @tags EnterpriseAudit
     * @name V1EnterpriseAuditExportList
     * @summary Retrieves enterprise audit log entries with comprehensive filtering
     * @request GET:/api/v1/enterprise-audit/export
     * @secure
     */
    v1EnterpriseAuditExportList: (
      query?: {
        /**
         * Optional filter by asset ID (token ID)
         * @format int64
         */
        assetId?: number;
        /** Optional filter by network (voimain-v1.0, aramidmain-v1.0, mainnet-v1.0, etc.) */
        network?: string;
        /** Optional filter by event category (Whitelist, Blacklist, Compliance, TransferValidation) */
        category?: AuditEventCategory;
        /** Optional filter by action type (Add, Update, Remove, Create, Delete, etc.) */
        actionType?: string;
        /** Optional filter by user who performed the action */
        performedBy?: string;
        /** Optional filter by affected address (for whitelist/blacklist operations) */
        affectedAddress?: string;
        /** Optional filter by operation result (true/false) */
        success?: boolean;
        /**
         * Optional start date filter (ISO 8601 format)
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter (ISO 8601 format)
         * @format date-time
         */
        toDate?: string;
        /**
         * Page number for pagination (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size for pagination (default: 50, max: 100)
         * @format int32
         * @default 50
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<EnterpriseAuditLogResponse, ProblemDetails | void>({
        path: `/api/v1/enterprise-audit/export`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Exports up to 10,000 audit log entries in CSV format for compliance reporting and analysis. **CSV Format:** - UTF-8 encoding with proper CSV escaping - Header row with all field names - One row per audit event - Timestamp in ISO 8601 format **Use Cases:** - MICA compliance reporting - Regulatory audit submissions - Enterprise compliance system integration - Excel/spreadsheet analysis - Long-term archival **Limits:** - Maximum 10,000 records per export - Use pagination parameters to export data in chunks if needed - Filtered exports may contain fewer records **Filename:** - Format: enterprise-audit-log-{timestamp}.csv - Timestamp in yyyyMMddHHmmss format **Security:** Requires ARC-0014 authentication. Recommended for compliance and admin roles only.
     *
     * @tags EnterpriseAudit
     * @name V1EnterpriseAuditExportCsvList
     * @summary Exports enterprise audit log as CSV for MICA compliance reporting
     * @request GET:/api/v1/enterprise-audit/export/csv
     * @secure
     */
    v1EnterpriseAuditExportCsvList: (
      query?: {
        /**
         * Optional filter by asset ID (token ID)
         * @format int64
         */
        assetId?: number;
        /** Optional filter by network (voimain-v1.0, aramidmain-v1.0, etc.) */
        network?: string;
        /** Optional filter by event category */
        category?: AuditEventCategory;
        /** Optional filter by action type */
        actionType?: string;
        /** Optional filter by user who performed the action */
        performedBy?: string;
        /** Optional filter by affected address */
        affectedAddress?: string;
        /** Optional filter by operation result */
        success?: boolean;
        /**
         * Optional start date filter (ISO 8601 format)
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter (ISO 8601 format)
         * @format date-time
         */
        toDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails | void>({
        path: `/api/v1/enterprise-audit/export/csv`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Exports up to 10,000 audit log entries in JSON format for compliance reporting and programmatic analysis. **JSON Format:** - Pretty-printed JSON with camelCase property names - Includes full response structure with metadata - Contains retention policy and summary statistics - Timestamp in ISO 8601 format **Use Cases:** - MICA compliance reporting - Programmatic audit log analysis - Integration with compliance management systems - Data archival for long-term storage - Compliance dashboard data feeds **Limits:** - Maximum 10,000 records per export - Use pagination parameters to export data in chunks if needed - Filtered exports may contain fewer records **Filename:** - Format: enterprise-audit-log-{timestamp}.json - Timestamp in yyyyMMddHHmmss format **Security:** Requires ARC-0014 authentication. Recommended for compliance and admin roles only.
     *
     * @tags EnterpriseAudit
     * @name V1EnterpriseAuditExportJsonList
     * @summary Exports enterprise audit log as JSON for MICA compliance reporting
     * @request GET:/api/v1/enterprise-audit/export/json
     * @secure
     */
    v1EnterpriseAuditExportJsonList: (
      query?: {
        /**
         * Optional filter by asset ID (token ID)
         * @format int64
         */
        assetId?: number;
        /** Optional filter by network (voimain-v1.0, aramidmain-v1.0, etc.) */
        network?: string;
        /** Optional filter by event category */
        category?: AuditEventCategory;
        /** Optional filter by action type */
        actionType?: string;
        /** Optional filter by user who performed the action */
        performedBy?: string;
        /** Optional filter by affected address */
        affectedAddress?: string;
        /** Optional filter by operation result */
        success?: boolean;
        /**
         * Optional start date filter (ISO 8601 format)
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter (ISO 8601 format)
         * @format date-time
         */
        toDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails | void>({
        path: `/api/v1/enterprise-audit/export/json`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns metadata about the audit log retention policy for transparency and compliance verification. **Policy Details:** - Minimum retention: 7 years - Regulatory framework: MICA (Markets in Crypto-Assets Regulation) - Immutable entries: Cannot be modified or deleted - Scope: All whitelist, blacklist, and compliance events - Networks: All supported networks including VOI and Aramid **Use Cases:** - Compliance policy verification - Audit preparation - Regulatory documentation - Enterprise policy alignment **Security:** Requires ARC-0014 authentication for consistency with other endpoints.
     *
     * @tags EnterpriseAudit
     * @name V1EnterpriseAuditRetentionPolicyList
     * @summary Gets the 7-year MICA retention policy for enterprise audit logs
     * @request GET:/api/v1/enterprise-audit/retention-policy
     * @secure
     */
    v1EnterpriseAuditRetentionPolicyList: (params: RequestParams = {}) =>
      this.request<AuditRetentionPolicy, ProblemDetails | void>({
        path: `/api/v1/enterprise-audit/retention-policy`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Issuer
     * @name V1IssuerProfileDetail
     * @summary Gets an issuer profile
     * @request GET:/api/v1/issuer/profile/{issuerAddress}
     * @secure
     */
    v1IssuerProfileDetail: (
      issuerAddress: string,
      params: RequestParams = {},
    ) =>
      this.request<IssuerProfileResponse, ProblemDetails | void>({
        path: `/api/v1/issuer/profile/${issuerAddress}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Issuer
     * @name V1IssuerProfileCreate
     * @summary Creates or updates an issuer profile
     * @request POST:/api/v1/issuer/profile
     * @secure
     */
    v1IssuerProfileCreate: (
      data: UpsertIssuerProfileRequest,
      params: RequestParams = {},
    ) =>
      this.request<IssuerProfileResponse, ProblemDetails | void>({
        path: `/api/v1/issuer/profile`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Issuer
     * @name V1IssuerVerificationDetail
     * @summary Gets issuer verification status
     * @request GET:/api/v1/issuer/verification/{issuerAddress}
     * @secure
     */
    v1IssuerVerificationDetail: (
      issuerAddress: string,
      params: RequestParams = {},
    ) =>
      this.request<IssuerVerificationResponse, ProblemDetails | void>({
        path: `/api/v1/issuer/verification/${issuerAddress}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Issuer
     * @name V1IssuerAssetsList
     * @summary Lists assets for an issuer
     * @request GET:/api/v1/issuer/{issuerAddress}/assets
     * @secure
     */
    v1IssuerAssetsList: (
      issuerAddress: string,
      query?: {
        /** Optional network filter */
        network?: string;
        /** Optional compliance status filter */
        complianceStatus?: ComplianceStatus;
        /**
         * Page number (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size (default: 20, max: 100)
         * @format int32
         * @default 20
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<IssuerAssetsResponse, ProblemDetails | void>({
        path: `/api/v1/issuer/${issuerAddress}/assets`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Token
 * @name V1TokenErc20MintableCreateCreate
 * @summary Deploys a new BiatecToken on the Base blockchain.
BiatecToken is an advanced ERC20 token with additional features:
- Minting capabilities (owner and authorized minters)
- Burning capabilities (burn and burnFrom)
- Pausable functionality (owner can pause/unpause transfers)
- Ownable (ownership transfer functionality)
The deployer automatically becomes the owner and first minter.
The initial token supply can be sent to a specified address or the deployer.
 * @request POST:/api/v1/token/erc20-mintable/create
 * @secure
 */
    v1TokenErc20MintableCreateCreate: (
      data: ERC20MintableTokenDeploymentRequest,
      params: RequestParams = {},
    ) =>
      this.request<EVMTokenDeploymentResponse, ProblemDetails | void>({
        path: `/api/v1/token/erc20-mintable/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This method logs the deployment status and any errors encountered during the process.
     *
     * @tags Token
     * @name V1TokenErc20PremintedCreateCreate
     * @summary Deploys a new ERC20 preminted token based on the provided deployment request.
     * @request POST:/api/v1/token/erc20-preminted/create
     * @secure
     */
    v1TokenErc20PremintedCreateCreate: (
      data: ERC20PremintedTokenDeploymentRequest,
      params: RequestParams = {},
    ) =>
      this.request<EVMTokenDeploymentResponse, ProblemDetails | void>({
        path: `/api/v1/token/erc20-preminted/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This method processes a request to deploy an ARC3 fungible token using the provided deployment parameters. It validates the request model and interacts with the token service to create the token. If the token creation is successful, the method returns a response containing the asset ID and transaction details. If the creation fails, an error response is returned.
     *
     * @tags Token
     * @name V1TokenAsaFtCreateCreate
     * @summary Creates an ARC3 fungible token on the specified network.
     * @request POST:/api/v1/token/asa-ft/create
     * @secure
     */
    v1TokenAsaFtCreateCreate: (
      data: ASAFungibleTokenDeploymentRequest,
      params: RequestParams = {},
    ) =>
      this.request<ASATokenDeploymentResponse, ProblemDetails | void>({
        path: `/api/v1/token/asa-ft/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This method validates the input request and attempts to create an ASA NFT using the provided parameters.  If the operation is successful, the response includes details such as the asset ID and transaction hash.  In case of failure, appropriate error information is returned.
     *
     * @tags Token
     * @name V1TokenAsaNftCreateCreate
     * @summary Creates an ASA NFT (Algorand Standard Asset Non-Fungible Token) based on the provided deployment request. It creates basic ASA token with quantity of 1. If you want to serve also the picture for the NFT token, use the ARC3 NFT standard instead.
     * @request POST:/api/v1/token/asa-nft/create
     * @secure
     */
    v1TokenAsaNftCreateCreate: (
      data: ASANonFungibleTokenDeploymentRequest,
      params: RequestParams = {},
    ) =>
      this.request<ASATokenDeploymentResponse, ProblemDetails | void>({
        path: `/api/v1/token/asa-nft/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This method validates the input request and attempts to create an ASA NFT using the provided parameters.  If the operation is successful, the response includes details such as the asset ID and transaction hash.  In case of failure, appropriate error information is returned.
     *
     * @tags Token
     * @name V1TokenAsaFnftCreateCreate
     * @summary Creates an ASA NFT (Algorand Standard Asset Non-Fungible Token) based on the provided deployment request. It creates basic ASA token with quantity of 1. If you want to serve also the picture for the NFT token, use the ARC3 NFT standard instead.
     * @request POST:/api/v1/token/asa-fnft/create
     * @secure
     */
    v1TokenAsaFnftCreateCreate: (
      data: ASAFractionalNonFungibleTokenDeploymentRequest,
      params: RequestParams = {},
    ) =>
      this.request<ASATokenDeploymentResponse, ProblemDetails | void>({
        path: `/api/v1/token/asa-fnft/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
 * No description
 *
 * @tags Token
 * @name V1TokenArc3FtCreateCreate
 * @summary Creates a new ARC3 Fungible Token on the Algorand blockchain.
ARC3 tokens are Algorand Standard Assets (ASAs) that comply with the ARC3 metadata standard:
- Support for rich metadata including images, descriptions, and properties
- IPFS-based metadata storage with integrity verification
- Localization support for international use
- Optional management features (freeze, clawback, reserve)
The creator becomes the initial manager and can configure additional roles.
 * @request POST:/api/v1/token/arc3-ft/create
 * @secure
 */
    v1TokenArc3FtCreateCreate: (
      data: ARC3FungibleTokenDeploymentRequest,
      params: RequestParams = {},
    ) =>
      this.request<ARC3TokenDeploymentResponse, ProblemDetails | void>({
        path: `/api/v1/token/arc3-ft/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This method accepts a deployment request containing the necessary parameters to create an ARC3 NFT. It validates the request model and interacts with the token service to perform the creation. If the operation is successful, the method returns the details of the created token, including the asset ID and transaction hash. In case of failure, it returns an appropriate error response.
     *
     * @tags Token
     * @name V1TokenArc3NftCreateCreate
     * @summary Creates an ARC3-compliant non-fungible token (NFT) on the specified network.
     * @request POST:/api/v1/token/arc3-nft/create
     * @secure
     */
    v1TokenArc3NftCreateCreate: (
      data: ARC3NonFungibleTokenDeploymentRequest,
      params: RequestParams = {},
    ) =>
      this.request<ARC3TokenDeploymentResponse, ProblemDetails | void>({
        path: `/api/v1/token/arc3-nft/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This method processes the deployment request for an ARC3 FNFT and returns the result of the operation. The request must include all required parameters for token creation, and the model state must be valid. If the operation succeeds, the response contains details about the created token, including the asset ID and transaction hash. If the operation fails, an appropriate error response is returned.
     *
     * @tags Token
     * @name V1TokenArc3FnftCreateCreate
     * @summary Creates an ARC3 fractional non-fungible token (FNFT) based on the provided deployment request.
     * @request POST:/api/v1/token/arc3-fnft/create
     * @secure
     */
    v1TokenArc3FnftCreateCreate: (
      data: ARC3FractionalNonFungibleTokenDeploymentRequest,
      params: RequestParams = {},
    ) =>
      this.request<ARC3TokenDeploymentResponse, ProblemDetails | void>({
        path: `/api/v1/token/arc3-fnft/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This method validates the input request and attempts to create an ARC200 mintable token using the provided details. If the operation succeeds, the response includes the asset ID and transaction details. In case of failure, an appropriate error response is returned.
     *
     * @tags Token
     * @name V1TokenArc200MintableCreateCreate
     * @summary Creates a new ARC200 mintable token based on the provided deployment request.
     * @request POST:/api/v1/token/arc200-mintable/create
     * @secure
     */
    v1TokenArc200MintableCreateCreate: (
      data: ARC200MintableTokenDeploymentRequest,
      params: RequestParams = {},
    ) =>
      this.request<ARC200TokenDeploymentResponse, ProblemDetails | void>({
        path: `/api/v1/token/arc200-mintable/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This method validates the input request and attempts to create an ARC200 preminted token using the provided details. If the operation is successful, the response includes the asset ID and transaction details. If the operation fails, an appropriate error response is returned.
     *
     * @tags Token
     * @name V1TokenArc200PremintedCreateCreate
     * @summary Creates a new ARC200 preminted fungible token based on the provided deployment request.
     * @request POST:/api/v1/token/arc200-preminted/create
     * @secure
     */
    v1TokenArc200PremintedCreateCreate: (
      data: ARC200PremintedTokenDeploymentRequest,
      params: RequestParams = {},
    ) =>
      this.request<ARC3TokenDeploymentResponse, ProblemDetails | void>({
        path: `/api/v1/token/arc200-preminted/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This method validates the input request and attempts to create an ARC200 mintable token using the provided details. If the operation succeeds, the response includes the asset ID and transaction details. In case of failure, an appropriate error response is returned.
     *
     * @tags Token
     * @name V1TokenArc1400MintableCreateCreate
     * @summary Creates a new ARC200 mintable token based on the provided deployment request.
     * @request POST:/api/v1/token/arc1400-mintable/create
     * @secure
     */
    v1TokenArc1400MintableCreateCreate: (
      data: ARC1400MintableTokenDeploymentRequest,
      params: RequestParams = {},
    ) =>
      this.request<ARC200TokenDeploymentResponse, ProblemDetails | void>({
        path: `/api/v1/token/arc1400-mintable/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint exposes compliance-related flags that enable the frontend to display: - MICA regulatory readiness - Whitelisting enabled status and entry count - Transfer restrictions summary - Enterprise readiness score - KYC verification status - Regulatory framework and jurisdiction information Use this endpoint to support subscription value features and enterprise readiness indicators in the UI.
     *
     * @tags Token
     * @name V1TokenComplianceIndicatorsList
     * @summary Gets compliance indicators for a token, providing enterprise readiness information
     * @request GET:/api/v1/token/{assetId}/compliance-indicators
     * @secure
     */
    v1TokenComplianceIndicatorsList: (
      assetId: number,
      params: RequestParams = {},
    ) =>
      this.request<TokenComplianceIndicatorsResponse, ProblemDetails | void>({
        path: `/api/v1/token/${assetId}/compliance-indicators`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Creates a webhook subscription for compliance events. The response includes a signing secret that should be used to verify webhook signatures. Supported event types: - WhitelistAdd: Triggered when an address is added to the whitelist - WhitelistRemove: Triggered when an address is removed from the whitelist - TransferDeny: Triggered when a transfer is denied by whitelist rules - AuditExportCreated: Triggered when an audit export is created All webhook payloads include: - Event ID and type - Timestamp (UTC) - Actor (user who triggered the event) - Asset ID and network - Event-specific data Webhook delivery includes exponential backoff retry on failure (1min, 5min, 15min).
     *
     * @tags Webhook
     * @name V1WebhooksSubscriptionsCreate
     * @summary Creates a new webhook subscription
     * @request POST:/api/v1/webhooks/subscriptions
     * @secure
     */
    v1WebhooksSubscriptionsCreate: (
      data: CreateWebhookSubscriptionRequest,
      params: RequestParams = {},
    ) =>
      this.request<WebhookSubscriptionResponse, ProblemDetails | void>({
        path: `/api/v1/webhooks/subscriptions`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Webhook
     * @name V1WebhooksSubscriptionsList
     * @summary Lists all webhook subscriptions for the authenticated user
     * @request GET:/api/v1/webhooks/subscriptions
     * @secure
     */
    v1WebhooksSubscriptionsList: (params: RequestParams = {}) =>
      this.request<WebhookSubscriptionListResponse, ProblemDetails | void>({
        path: `/api/v1/webhooks/subscriptions`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Webhook
     * @name V1WebhooksSubscriptionsUpdate
     * @summary Updates an existing webhook subscription
     * @request PUT:/api/v1/webhooks/subscriptions
     * @secure
     */
    v1WebhooksSubscriptionsUpdate: (
      data: UpdateWebhookSubscriptionRequest,
      params: RequestParams = {},
    ) =>
      this.request<WebhookSubscriptionResponse, ProblemDetails | void>({
        path: `/api/v1/webhooks/subscriptions`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Webhook
     * @name V1WebhooksSubscriptionsDetail
     * @summary Gets a webhook subscription by ID
     * @request GET:/api/v1/webhooks/subscriptions/{subscriptionId}
     * @secure
     */
    v1WebhooksSubscriptionsDetail: (
      subscriptionId: string,
      params: RequestParams = {},
    ) =>
      this.request<WebhookSubscriptionResponse, ProblemDetails | void>({
        path: `/api/v1/webhooks/subscriptions/${subscriptionId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Webhook
     * @name V1WebhooksSubscriptionsDelete
     * @summary Deletes a webhook subscription
     * @request DELETE:/api/v1/webhooks/subscriptions/{subscriptionId}
     * @secure
     */
    v1WebhooksSubscriptionsDelete: (
      subscriptionId: string,
      params: RequestParams = {},
    ) =>
      this.request<WebhookSubscriptionResponse, ProblemDetails | void>({
        path: `/api/v1/webhooks/subscriptions/${subscriptionId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint provides comprehensive webhook delivery tracking including: - Delivery attempts and outcomes - HTTP status codes and error messages - Retry status and next retry times - Success/failure statistics This serves as the admin audit endpoint for webhook delivery failures.
     *
     * @tags Webhook
     * @name V1WebhooksDeliveriesList
     * @summary Gets webhook delivery history with filtering
     * @request GET:/api/v1/webhooks/deliveries
     * @secure
     */
    v1WebhooksDeliveriesList: (
      query?: {
        /** Optional filter by subscription ID */
        subscriptionId?: string;
        /** Optional filter by event ID */
        eventId?: string;
        /** Optional filter by success status */
        success?: boolean;
        /**
         * Optional start date filter (ISO 8601)
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter (ISO 8601)
         * @format date-time
         */
        toDate?: string;
        /**
         * Page number (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size (default: 50, max: 100)
         * @format int32
         * @default 50
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<WebhookDeliveryHistoryResponse, ProblemDetails | void>({
        path: `/api/v1/webhooks/deliveries`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Whitelist
     * @name V1WhitelistDetail
     * @summary Lists whitelist entries for a specific token
     * @request GET:/api/v1/whitelist/{assetId}
     * @secure
     */
    v1WhitelistDetail: (
      assetId: number,
      query?: {
        /** Optional status filter */
        status?: WhitelistStatus;
        /**
         * Page number (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size (default: 20, max: 100)
         * @format int32
         * @default 20
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<WhitelistListResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist/${assetId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation emits a metering event for billing analytics with the following details: - Category: Whitelist - OperationType: Add (for new entries) or Update (for existing entries) - Network: Not available - PerformedBy: Authenticated user - ItemCount: 1
     *
     * @tags Whitelist
     * @name V1WhitelistCreate
     * @summary Adds a single address to the whitelist
     * @request POST:/api/v1/whitelist
     * @secure
     */
    v1WhitelistCreate: (
      data: AddWhitelistEntryRequest,
      params: RequestParams = {},
    ) =>
      this.request<WhitelistResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation emits a metering event for billing analytics with the following details: - Category: Whitelist - OperationType: Remove - Network: Not available - PerformedBy: User who last modified the entry - ItemCount: 1
     *
     * @tags Whitelist
     * @name V1WhitelistDelete
     * @summary Removes an address from the whitelist
     * @request DELETE:/api/v1/whitelist
     * @secure
     */
    v1WhitelistDelete: (
      data: RemoveWhitelistEntryRequest,
      params: RequestParams = {},
    ) =>
      this.request<WhitelistResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist`,
        method: "DELETE",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description This operation emits a metering event for billing analytics with the following details: - Category: Whitelist - OperationType: BulkAdd - Network: Not available - PerformedBy: Authenticated user - ItemCount: Number of successfully added/updated entries (not failed ones) Note: Metering event is only emitted if at least one entry succeeds.
     *
     * @tags Whitelist
     * @name V1WhitelistBulkCreate
     * @summary Bulk adds addresses to the whitelist
     * @request POST:/api/v1/whitelist/bulk
     * @secure
     */
    v1WhitelistBulkCreate: (
      data: BulkAddWhitelistRequest,
      params: RequestParams = {},
    ) =>
      this.request<BulkWhitelistResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist/bulk`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Whitelist
     * @name V1WhitelistAuditLogList
     * @summary Gets the audit log for a specific token's whitelist
     * @request GET:/api/v1/whitelist/{assetId}/audit-log
     * @secure
     */
    v1WhitelistAuditLogList: (
      assetId: number,
      query?: {
        /** Optional filter by address */
        address?: string;
        /** Optional filter by action type */
        actionType?: WhitelistActionType;
        /** Optional filter by user who performed the action */
        performedBy?: string;
        /**
         * Optional start date filter
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter
         * @format date-time
         */
        toDate?: string;
        /**
         * Page number (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size (default: 50, max: 100)
         * @format int32
         * @default 50
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<WhitelistAuditLogResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist/${assetId}/audit-log`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint provides access to immutable audit logs for compliance reporting and incident investigations across all whitelist operations. Unlike the asset-specific endpoint, this allows querying across all assets and filtering by network for MICA/RWA compliance dashboards. **Retention Policy**: Audit logs are retained for a minimum of 7 years to comply with MICA regulations. All entries are immutable and cannot be modified or deleted. **Use Cases**: - Enterprise-wide compliance dashboards - Network-specific audit reports (VOI, Aramid) - Cross-asset incident investigations - Regulatory compliance reporting - Actor-based activity tracking Requires ARC-0014 authentication. Recommended for compliance and admin roles only.
     *
     * @tags Whitelist
     * @name V1WhitelistAuditLogList2
     * @summary Gets audit log for whitelist operations across all assets with optional filtering
     * @request GET:/api/v1/whitelist/audit-log
     * @originalName v1WhitelistAuditLogList
     * @duplicate
     * @secure
     */
    v1WhitelistAuditLogList2: (
      query?: {
        /**
         * Optional filter by asset ID (token ID)
         * @format int64
         */
        assetId?: number;
        /** Optional filter by address */
        address?: string;
        /** Optional filter by action type */
        actionType?: WhitelistActionType;
        /** Optional filter by user who performed the action */
        performedBy?: string;
        /** Optional filter by network */
        network?: string;
        /**
         * Optional start date filter
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter
         * @format date-time
         */
        toDate?: string;
        /**
         * Page number (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size (default: 50, max: 100)
         * @format int32
         * @default 50
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<WhitelistAuditLogResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist/audit-log`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Exports audit log entries matching the filter criteria as a CSV file for regulatory compliance reporting. The CSV includes all audit fields: timestamp, asset ID, address, action type, actor, network, status changes, and notes. **Format**: Standard CSV with headers **Encoding**: UTF-8 **Max Records**: 10,000 per export (use pagination for larger datasets) Requires ARC-0014 authentication. Recommended for compliance and admin roles only.
     *
     * @tags Whitelist
     * @name V1WhitelistAuditLogExportCsvList
     * @summary Exports whitelist audit log as CSV for compliance reporting
     * @request GET:/api/v1/whitelist/audit-log/export/csv
     * @secure
     */
    v1WhitelistAuditLogExportCsvList: (
      query?: {
        /**
         * Optional filter by asset ID (token ID)
         * @format int64
         */
        assetId?: number;
        /** Optional filter by address */
        address?: string;
        /** Optional filter by action type */
        actionType?: WhitelistActionType;
        /** Optional filter by user who performed the action */
        performedBy?: string;
        /** Optional filter by network */
        network?: string;
        /**
         * Optional start date filter
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter
         * @format date-time
         */
        toDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails | void>({
        path: `/api/v1/whitelist/audit-log/export/csv`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * @description Exports audit log entries matching the filter criteria as a JSON file for regulatory compliance reporting. The JSON includes all audit fields and retention policy metadata. **Max Records**: 10,000 per export (use pagination for larger datasets) Requires ARC-0014 authentication. Recommended for compliance and admin roles only.
     *
     * @tags Whitelist
     * @name V1WhitelistAuditLogExportJsonList
     * @summary Exports whitelist audit log as JSON for compliance reporting
     * @request GET:/api/v1/whitelist/audit-log/export/json
     * @secure
     */
    v1WhitelistAuditLogExportJsonList: (
      query?: {
        /**
         * Optional filter by asset ID (token ID)
         * @format int64
         */
        assetId?: number;
        /** Optional filter by address */
        address?: string;
        /** Optional filter by action type */
        actionType?: WhitelistActionType;
        /** Optional filter by user who performed the action */
        performedBy?: string;
        /** Optional filter by network */
        network?: string;
        /**
         * Optional start date filter
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter
         * @format date-time
         */
        toDate?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<File, ProblemDetails | void>({
        path: `/api/v1/whitelist/audit-log/export/json`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns metadata about the audit log retention policy including minimum retention period, regulatory framework, and immutability guarantees.
     *
     * @tags Whitelist
     * @name V1WhitelistAuditLogRetentionPolicyList
     * @summary Gets the whitelist audit log retention policy metadata
     * @request GET:/api/v1/whitelist/audit-log/retention-policy
     * @secure
     */
    v1WhitelistAuditLogRetentionPolicyList: (params: RequestParams = {}) =>
      this.request<AuditRetentionPolicy, ProblemDetails | void>({
        path: `/api/v1/whitelist/audit-log/retention-policy`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description This endpoint validates whether a token transfer is permitted based on whitelist compliance rules. Both sender and receiver must be actively whitelisted (status=Active) with non-expired entries. Use this endpoint before executing transfers to ensure compliance with MICA regulations and other regulatory requirements for RWA tokens. The response includes detailed status information for both sender and receiver, including whitelist status, expiration dates, and specific denial reasons if applicable. **Audit Logging**: All transfer validation attempts are recorded in the audit log with: - Who performed the validation (authenticated user) - When the validation occurred (timestamp) - Transfer details (from/to addresses, amount) - Validation result (allowed/denied with reason)
     *
     * @tags Whitelist
     * @name V1WhitelistValidateTransferCreate
     * @summary Validates if a transfer between two addresses is allowed based on whitelist rules
     * @request POST:/api/v1/whitelist/validate-transfer
     * @secure
     */
    v1WhitelistValidateTransferCreate: (
      data: ValidateTransferRequest,
      params: RequestParams = {},
    ) =>
      this.request<ValidateTransferResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist/validate-transfer`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Creates a new automated compliance rule for managing whitelist entries. Rules can enforce KYC requirements, handle expiration, and implement network-specific policies. Example request: ```json { "assetId": 12345, "name": "Auto-Revoke Expired Entries", "description": "Automatically revokes whitelist entries that have passed their expiration date", "ruleType": "AutoRevokeExpired", "isActive": true, "priority": 100, "network": "voimain-v1.0" } ```
     *
     * @tags WhitelistRules
     * @name V1WhitelistRulesCreate
     * @summary Creates a new whitelisting rule for an RWA token
     * @request POST:/api/v1/whitelist-rules
     * @secure
     */
    v1WhitelistRulesCreate: (
      data: CreateWhitelistRuleRequest,
      params: RequestParams = {},
    ) =>
      this.request<WhitelistRuleResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist-rules`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Updates properties of an existing rule. Only provided fields will be updated. Example request: ```json { "ruleId": "550e8400-e29b-41d4-a716-446655440000", "isActive": false, "priority": 50 } ```
     *
     * @tags WhitelistRules
     * @name V1WhitelistRulesUpdate
     * @summary Updates an existing whitelisting rule
     * @request PUT:/api/v1/whitelist-rules
     * @secure
     */
    v1WhitelistRulesUpdate: (
      data: UpdateWhitelistRuleRequest,
      params: RequestParams = {},
    ) =>
      this.request<WhitelistRuleResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist-rules`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieves all rules for a token with optional filtering by type, status, and network. Results are ordered by priority (ascending) and creation date.
     *
     * @tags WhitelistRules
     * @name V1WhitelistRulesDetail
     * @summary Lists whitelisting rules for a specific token
     * @request GET:/api/v1/whitelist-rules/{assetId}
     * @secure
     */
    v1WhitelistRulesDetail: (
      assetId: number,
      query?: {
        /** Optional rule type filter */
        ruleType?: WhitelistRuleType;
        /** Optional active status filter */
        isActive?: boolean;
        /** Optional network filter */
        network?: string;
        /**
         * Page number (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size (default: 20, max: 100)
         * @format int32
         * @default 20
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<WhitelistRulesListResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist-rules/${assetId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Applies a rule's logic to whitelist entries, potentially modifying their status. Supports dry-run mode to preview changes without committing them. Example request: ```json { "ruleId": "550e8400-e29b-41d4-a716-446655440000", "dryRun": true } ``` Example with target addresses: ```json { "ruleId": "550e8400-e29b-41d4-a716-446655440000", "targetAddresses": [ "ALGORAND_ADDRESS_1...", "ALGORAND_ADDRESS_2..." ], "dryRun": false } ```
     *
     * @tags WhitelistRules
     * @name V1WhitelistRulesApplyCreate
     * @summary Applies a whitelisting rule to matching whitelist entries
     * @request POST:/api/v1/whitelist-rules/apply
     * @secure
     */
    v1WhitelistRulesApplyCreate: (
      data: ApplyWhitelistRuleRequest,
      params: RequestParams = {},
    ) =>
      this.request<ApplyWhitelistRuleResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist-rules/apply`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Permanently deletes a rule. This action is logged in the audit trail.
     *
     * @tags WhitelistRules
     * @name V1WhitelistRulesDelete
     * @summary Deletes a whitelisting rule
     * @request DELETE:/api/v1/whitelist-rules/{ruleId}
     * @secure
     */
    v1WhitelistRulesDelete: (ruleId: string, params: RequestParams = {}) =>
      this.request<DeleteWhitelistRuleResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist-rules/${ruleId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieves audit trail of all rule-related actions for compliance reporting. Supports filtering by rule, action type, and date range. Example usage: ``` GET /api/v1/whitelist-rules/12345/audit-log?actionType=Apply&fromDate=2026-01-01T00:00:00Z ```
     *
     * @tags WhitelistRules
     * @name V1WhitelistRulesAuditLogList
     * @summary Gets audit log entries for whitelisting rules
     * @request GET:/api/v1/whitelist-rules/{assetId}/audit-log
     * @secure
     */
    v1WhitelistRulesAuditLogList: (
      assetId: number,
      query?: {
        /** Optional rule ID filter */
        ruleId?: string;
        /** Optional action type filter */
        actionType?: RuleAuditActionType;
        /**
         * Optional start date filter (ISO 8601)
         * @format date-time
         */
        fromDate?: string;
        /**
         * Optional end date filter (ISO 8601)
         * @format date-time
         */
        toDate?: string;
        /**
         * Page number (default: 1)
         * @format int32
         * @default 1
         */
        page?: number;
        /**
         * Page size (default: 50, max: 100)
         * @format int32
         * @default 50
         */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<WhitelistRuleAuditLogResponse, ProblemDetails | void>({
        path: `/api/v1/whitelist-rules/${assetId}/audit-log`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
