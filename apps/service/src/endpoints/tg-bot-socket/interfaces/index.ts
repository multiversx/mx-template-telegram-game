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
  purchasesState: IPurchases;
  /** Current game score [clicks + balance * redeemDivider ]*/
  gameScore: number;
  username: string;
  firstName: string;
  lastName: string;
}

/**
 * @description Setup game storage keys, api endpoints, etc...
 *
 * @interface IInit
 */
export interface IInit {
  /** The key of telegram cloud storage for: wallet information */
  walletStorageKey: string;
  /** MultiversX api url eg: https://devnet-api.multiversx.com */
  apiUrl: string;
  /** The identifier of the token that will be used in game */
  tokenIdentifier: string;
  /** The key of telegram cloud storage for: clicks from IAccountState */
  gameBalanceStorageKey: string;
  /** Chain id 1 (mainnet), D (devnet), T (testnet)  eg: D */
  chainId: string;
  /** The key of telegram cloud storage for: purchasesState from IAccountState */
  gamePurchasesStateKey: string;
  /** clicks from IAccountState/redeemDivider = x game tokens to be redeemed  */
  redeemDivider: number;
}

export interface IPurchases {
  MoneyByClick: number;
  MoneyPerSecond: number;
  upgradeData: {
    clickUpgrades: { price: number; itemsBought: number }[];
    skyItems: { price: number; bought: boolean }[];
    cityItems: { price: number; bought: boolean }[];
    automationUpgrades: { price: number; itemsBought: number }[];
  };
}
