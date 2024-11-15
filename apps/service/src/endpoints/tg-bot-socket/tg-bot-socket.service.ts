import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UseGuards } from '@nestjs/common';
import { IAccountState, IToken } from './interfaces';
import { NativeAuthDecoded } from '@multiversx/sdk-native-auth-server';
import axios from 'axios';
import { MurLock } from 'murlock';
import { Cache } from 'cache-manager';
import { formatAmount } from './helpers/formatAmount';
import { gameConfig, purchasesInitialState } from './constants';
import { MasterWalletService } from './services/tg-bot-socket/services/master-wallet/master-wallet.service';
import { IPlainTransactionObject } from '@multiversx/sdk-core/out';

@Injectable()
export class TgBotSocketService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private masterWallet: MasterWalletService,
  ) {}

  async getServerConfig() {
    return gameConfig;
  }

  async getRelayedTransaction(
    { address }: NativeAuthDecoded,
    { category, index }: { category: string; index: number },
  ) {
    const userStateFromCache: IAccountState =
      await this.cacheManager.get(address);

    const itemCost =
      userStateFromCache.purchasesState.upgradeData[category][index].price;

    return await this.masterWallet.getRelayedTransaction(address, itemCost);
  }

  // @MurLock(100, 'address')
  async buyItem(
    { address }: NativeAuthDecoded,
    {
      category,
      index,
    }: {
      category: string;
      index: number;
      signedRelayedTransaction: IPlainTransactionObject;
    },
  ) {
    const userStateFromCache: IAccountState =
      await this.cacheManager.get(address);

    if (!userStateFromCache.purchasesState.upgradeData[category][index]) {
      throw new Error('Category or index does not exist!');
    }

    const itemCost =
      userStateFromCache.purchasesState.upgradeData[category][index].price;

    switch (category) {
      case 'clickUpgrades':
      case 'automationUpgrades':
        if (userStateFromCache.clicks < itemCost) {
          throw new Error('Not enough balance to purchase the item');
        }
        const currentItemPrice =
          userStateFromCache.purchasesState.upgradeData[category][index].price;
        const initialItemPrice =
          purchasesInitialState.upgradeData[category][index].price;
        const timesCanBuy =
          gameConfig.upgradeConfig[category].maxBuyPerItem[index];

        const timesItemBought = currentItemPrice / initialItemPrice;
        const canBuyItem = timesItemBought <= timesCanBuy;
        if (!canBuyItem) {
          throw new Error('You can not buy this item any more.');
        }
        userStateFromCache.clicks = userStateFromCache.clicks - itemCost;
        userStateFromCache.purchasesState.upgradeData[category][index].price =
          currentItemPrice * gameConfig.upgradeConfig.multiplyPriceOnBuyBy;

        userStateFromCache.purchasesState.upgradeData[category][
          index
        ].itemsBought += 1;

        if (category === 'clickUpgrades') {
          userStateFromCache.purchasesState.MoneyByClick +=
            gameConfig.upgradeConfig.clickUpgrades.clickingMultiplier[index];
        }

        if (category === 'automationUpgrades') {
          userStateFromCache.purchasesState.MoneyPerSecond +=
            gameConfig.upgradeConfig.automationUpgrades.moneyPerSecond[index];
        }
        break;

      default:
        throw new Error('Category does not exist!');
    }

    await this.cacheManager.set(address, userStateFromCache);
    return userStateFromCache;
  }

  async click({
    address,
    automatedMoney,
  }: NativeAuthDecoded & { automatedMoney?: boolean }) {
    const userStateFromCache: IAccountState =
      await this.cacheManager.get(address);
    userStateFromCache.clicks += automatedMoney
      ? userStateFromCache.purchasesState.MoneyPerSecond
      : userStateFromCache.purchasesState.MoneyByClick;

    await this.cacheManager.set(address, userStateFromCache);
    return { ...userStateFromCache };
  }

  async resetState({
    address,
  }: NativeAuthDecoded & { automatedMoney?: boolean }) {
    const userStateFromCache: IAccountState =
      await this.cacheManager.get(address);

    userStateFromCache.clicks = 0;
    userStateFromCache.purchasesState = purchasesInitialState;

    await this.cacheManager.set(address, userStateFromCache);
    return userStateFromCache;
  }

  public async redeem({ address }: NativeAuthDecoded) {
    const userStateFromCache: IAccountState =
      await this.cacheManager.get(address);
    const remainingClicks =
      userStateFromCache.clicks % gameConfig.redeemDivider;
    const tokensToRedeem = Math.floor(
      userStateFromCache.clicks / gameConfig.redeemDivider,
    );
    console.log(userStateFromCache.clicks, gameConfig.redeemDivider);
    if (tokensToRedeem === 0) {
      throw new Error("You don't have enough balance to redeem");
    }

    const redeemTransaction = await this.masterWallet.redeem(
      address,
      tokensToRedeem,
    );

    console.log('here!', redeemTransaction);

    userStateFromCache.clicks = remainingClicks;
    userStateFromCache.balance += tokensToRedeem;
    await this.cacheManager.set(address, userStateFromCache);
    return redeemTransaction.toPlainObject();
  }

  async getAccountState({ address }: NativeAuthDecoded) {
    const userStateFromCache: IAccountState =
      await this.cacheManager.get(address);

    const tokenDetails = await this.getTokenDetails(address);
    const egldBalance = (await this.getEgldBalance(address)).balance;
    userStateFromCache.balance = !tokenDetails?.balance
      ? 0
      : parseInt(
          formatAmount({
            input: tokenDetails.balance,
            decimals: tokenDetails.decimals,
            showLastNonZeroDecimal: false,
            digits: 2,
          }),
        );

    userStateFromCache.egldBalance = parseFloat(
      formatAmount({
        input: egldBalance,
        decimals: 18,
        showLastNonZeroDecimal: true,
        digits: 2,
      }),
    );

    await this.cacheManager.set(address, userStateFromCache);

    return { ...userStateFromCache, gameConfig };
  }

  public async getBurnTokensTx(
    { address }: NativeAuthDecoded,
    { category, index, userTransaction },
  ) {
    return this.masterWallet.burnTokens(
      { address } as NativeAuthDecoded,
      { category, index },
      userTransaction,
    );
  }

  public async getBuyTx({ address }: NativeAuthDecoded, { category, index }) {
    return this.masterWallet.getBuyTx({ address } as NativeAuthDecoded, {
      category,
      index,
    });
  }

  public async withdraw(
    { address }: NativeAuthDecoded,
    userTransaction: IPlainTransactionObject,
  ) {
    console.log('redeem');
    return this.masterWallet.withdraw(userTransaction);
  }

  private async getTokenDetails(address: string) {
    const response = await axios.get(
      `${gameConfig.apiUrl}/accounts/${address}/tokens/?identifier=${gameConfig.tokenIdentifier}`,
    );

    return response.data[0] as IToken;
  }
  private async getEgldBalance(address: string) {
    const response = await axios.get(
      `${gameConfig.apiUrl}/accounts/${address}`,
    );

    return { balance: response.data.balance, nonce: response.data.nonce };
  }
}
