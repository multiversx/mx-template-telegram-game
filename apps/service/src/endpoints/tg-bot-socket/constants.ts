import { IAccountState, IPurchases } from './interfaces';

export const masterWallet = [
  'sport',
  'draft',
  'tattoo',
  'upper',
  'fee',
  'point',
  'execute',
  'tunnel',
  'better',
  'tissue',
  'cement',
  'cover',
  'crunch',
  'earn',
  'drive',
  'between',
  'isolate',
  'wrestle',
  'chapter',
  'runway',
  'stomach',
  'critic',
  'manual',
  'brown',
];

export const purchasesInitialState: IPurchases = {
  MoneyByClick: 1,
  MoneyPerSecond: 0,
  upgradeData: {
    clickUpgrades: [
      //increase clicking multiplier
      { price: 10, itemsBought: 0 },
      { price: 50, itemsBought: 0 },
      { price: 120, itemsBought: 0 },
      { price: 250, itemsBought: 0 },
      { price: 400, itemsBought: 0 },
    ],
    skyItems: [
      //visual
      { price: 10, bought: false },
      { price: 20, bought: false },
      { price: 50, bought: false },
      { price: 100, bought: false },
      { price: 150, bought: false },
    ],
    cityItems: [
      //visual
      { price: 10, bought: false },
      { price: 20, bought: false },
      { price: 50, bought: false },
      { price: 100, bought: false },
      { price: 300, bought: false },
    ],
    automationUpgrades: [
      //increase money per second
      { price: 10, itemsBought: 0 },
      { price: 500, itemsBought: 0 },
      { price: 1_500, itemsBought: 0 },
      { price: 3_000, itemsBought: 0 },
      { price: 30_000, itemsBought: 0 },
    ],
  },
};

export const gameConfig = {
  tokenIdentifier: 'MOONICH-6e43c6',
  tokenTicker: 'MOONICH',
  sftCollectionIdentifier: 'MOONICH-839af7',
  apiUrl: 'https://api.multiversx.com',
  redeemDivider: 1000,
  chainId: '1',
  upgradeConfig: {
    multiplyPriceOnBuyBy: 2,
    clickUpgrades: {
      clickingMultiplier: [2, 5, 10, 15, 20],
      maxBuyPerItem: [2, 2, 2, 2, 2],
    },
    automationUpgrades: {
      moneyPerSecond: [1, 5, 10, 15, 25],
      maxBuyPerItem: [2, 2, 2, 2, 2],
    },
  },
};

export const sftNonces = {
  skyItems: [1, 2, 3, 5, 6],
  cityItems: [7, 8, 9, 9, 10, 11],
};

export const burnAddress =
  'erd1swtk90tzax6p4wg5y82cd43aldgtvenzz4pmnxvg7cv8ma7erf3sdsarfy'; //this is the raleyer address, the tokens are comming back when user is buying colletables

export const initialPlayerState: IAccountState = {
  address: '',
  balance: 0,
  clicks: 0,
  egldBalance: 0,
  gameScore: 0,
  purchasesState: purchasesInitialState,
  firstName: '',
  lastName: '',
  username: '',
};
