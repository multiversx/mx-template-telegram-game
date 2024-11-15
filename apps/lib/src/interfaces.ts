/**
 * @description Private/public key pairs
 *
 * @interface IWallet
 */
export interface IWallet {
  /** Bech32 address of the user */
  publicKey: string;
  /** Hex secret key */
  secretKey: string;
}

/**
 * @description Token info as on multiversx network
 *
 * @interface IToken
 */
export interface IToken {
  /** Token balance */
  balance: string;
  /** Number of decimals to use for formatting the balance amount to */
  decimals: number;
}

/**
 * @description Information about the account state
 *
 * @interface IAccountState
 */
export interface IAccountState {
  /** Address of the current connected user */
  address: string;
  /** Current balance of game tokens redeemed based on clicks */
  balance: number;
  /** Current balance of clicks */
  clicks: number;
  /** EGLD balance */
  egldBalance: number;
  /** Object of items purchased in game */
  purchasesState: any;
  /** Current game score [clicks + balance * redeemDivider ]*/
  gameScore: number;
}

/**
 * @description Setup game storage keys, api endpoints, etc...
 *
 * @interface IInit
 */
export interface IInit {
  /** The key of telegram cloud storage for: wallet information */
  walletStorageKey: string;
  gameApiUrl: string;
  apiUrl: string;
}

export interface IServerConfig {
  tokenIdentifier: string;
  tokenTicker: string;
  sftCollectionIdentifier: string;
  apiUrl: string;
  chainId: string;
  redeemDivider: number;
  upgradeConfig: {
    multiplyPriceOnBuyBy: number;
    clickUpgrades: {
      clickingMultiplier: number[];
      maxBuyPerItem: number[];
    };
    automationUpgrades: {
      moneyPerSecond: number[];
      maxBuyPerItem: number[];
    };
  };
}
