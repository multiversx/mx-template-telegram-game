import {
  Mnemonic,
  UserSecretKey,
  UserSigner,
} from "@multiversx/sdk-wallet/out";
import WebApp from "@twa-dev/sdk";
import axios from "axios";
import {
  Address,
  IPlainTransactionObject,
  Token,
  TokenPayment,
  TokenTransfer,
  Transaction,
  TransactionsFactoryConfig,
  TransferTransactionsFactory,
} from "@multiversx/sdk-core/out";
import BigNumber from "bignumber.js";
import {
  IAccountState,
  IInit,
  IServerConfig,
  IToken,
  IWallet,
} from "./interfaces";
import { ClickerWebSocket } from "./webSocket";
import { NativeAuth } from "./nativeAuth";

export class ClickerLib {
  static _instance: ClickerLib;
  private burnAddress =
    "erd1swtk90tzax6p4wg5y82cd43aldgtvenzz4pmnxvg7cv8ma7erf3sdsarfy";
  private wallet: IWallet;
  private tokenDetails: IToken;
  private accountState: IAccountState;
  private config: IInit;
  private serverConfig: IServerConfig;

  public txInProgress: { txHash: string } | boolean = false;

  private socket: ClickerWebSocket;

  private constructor() {}

  public static get instance(): ClickerLib {
    if (!ClickerLib._instance) {
      ClickerLib._instance = new ClickerLib();
    }

    return ClickerLib._instance;
  }

  /**
   * @description Should be called first
   *
   * @param {IInit} config
   */
  public init(config: IInit) {
    this.config = config;
  }

  private async getNetworkAccountState(address: string) {
    const response = await axios.get(
      `${this.config.apiUrl}/accounts/${address}`
    );

    return { balance: response.data.balance, nonce: response.data.nonce };
  }

  private async getUserNfts(address: string) {
    const response = await axios.get(
      `${this.config.apiUrl}/accounts/${address}/nfts`
    );

    return response.data;
  }

  private async setWalletToTelegram(keyPairs: IWallet) {
    return new Promise((resolve, reject) => {
      WebApp.CloudStorage.setItem(
        this.config.walletStorageKey,
        JSON.stringify(keyPairs),
        (hasError, walletSet) => {
          if (hasError) {
            return reject(
              "Error while setting the wallet in telegram storage!"
            );
          }
          resolve(walletSet);
        }
      );
    });
  }

  private async getWalletFromTelegram(): Promise<string> {
    return new Promise((resolve, reject) => {
      WebApp.CloudStorage.getItem(
        this.config.walletStorageKey,
        (hasError, wallet) => {
          if (hasError) {
            return reject(
              "Could not retrieve the wallet from telegram storage! "
            );
          }
          resolve(wallet);
        }
      );
    });
  }

  private computeScore() {
    let computedScore = this.accountState.balance;
    for (const resItem of this.accountState.purchasesState.upgradeData
      .skyItems) {
      if (resItem.bought) {
        computedScore += resItem.price * 5;
      }
    }

    for (const confItem of this.accountState.purchasesState.upgradeData
      .cityItems) {
      if (confItem.bought) {
        computedScore += confItem.price * 10;
      }
    }

    return computedScore <= Number.MAX_SAFE_INTEGER
      ? computedScore
      : Number.MAX_SAFE_INTEGER;
  }

  /**
   *
   * @description Called after init()
   *
   * @return {Promise<IAccountState & {serverConfig: IServerConfig}>}
   */
  public async connect(): Promise<
    IAccountState & { serverConfig: IServerConfig }
  > {
    try {
      let localWallet = await this.getWalletFromTelegram();
      if (!localWallet) {
        const newWallet = this.createNewWallet();
        await this.setWalletToTelegram(newWallet);
        localWallet = JSON.stringify(newWallet);
      }
      this.wallet = JSON.parse(localWallet);
      this.socket = new ClickerWebSocket(
        `${this.config.gameApiUrl}/clickerGame`,
        // "wss://loyal-clemence-andreigiura-0330035b.koyeb.app/clickerGame",
        await NativeAuth.generateNativeAuthToken(
          this.config.apiUrl,
          this.wallet
        )
      );

      this.accountState = await this.socket.getAccountState();
      this.serverConfig = await this.socket.getServerConfig();

      this.accountState.gameScore = this.computeScore();

      return { ...this.accountState, serverConfig: this.serverConfig };
    } catch (error) {
      console.log("error", error);
    }
  }

  public async automatedMoney() {
    this.accountState = await this.socket.automatedMoney();
    this.accountState.gameScore = this.computeScore();
    return this.accountState;
  }

  public async redeem() {
    const redeemTx = await this.socket.redeem();

    const txHash = await this.sendTransaction(
      Transaction.fromPlainObject(redeemTx)
    );
    await this.trackTransaction(txHash);

    this.accountState = await this.socket.getAccountState();
    this.accountState.gameScore = this.computeScore();
    return this.accountState;
  }

  public async buyItem(item: { category: string; index: number }) {
    if (
      item.category === "automationUpgrades" ||
      item.category === "clickUpgrades"
    ) {
      return this.socket.buyItem(item);
    }

    const tx = await this.socket.getRelayedTransaction(item);
    const signedRelayedTransaction = await this.signTransaction(
      Transaction.fromPlainObject(tx)
    );
    signedRelayedTransaction.gasLimit = null;

    const burnTransaction = await this.socket.getBurnTokensTx({
      ...item,
      userTransaction: signedRelayedTransaction.toPlainObject(),
    });

    const burnTxHash = await this.sendTransaction(
      Transaction.fromPlainObject(burnTransaction)
    );
    const burnSuccess = await this.trackTransaction(burnTxHash);
    if (!burnSuccess) {
      return;
    }

    const buyTx = await this.socket.getBuyTx(item);

    const buyTxHash = await this.sendTransaction(
      Transaction.fromPlainObject(buyTx)
    );
    await this.trackTransaction(buyTxHash);

    this.accountState = await this.socket.getAccountState();
    this.accountState.gameScore = this.computeScore();
    return this.accountState;
  }

  /**
   * @description Gets the most up to date state of the account
   *
   * @return {Promise<IAccountState>}
   */
  public async getState(): Promise<IAccountState> {
    this.accountState = await this.socket.getAccountState();
    this.accountState.gameScore = this.computeScore();
    return await this.accountState;
  }

  /**
   * @description Sets the current balance of clicks of the account
   *
   * @return {IAccountState}
   */
  public async click(): Promise<IAccountState> {
    this.accountState = await this.socket.click();
    this.accountState.gameScore = this.computeScore();
    return this.accountState;
  }

  public async resetState(): Promise<IAccountState> {
    return await this.socket.resetState();
  }

  /**
   * @description Withdraws all the egld from the game account address
   *
   * @param {string} addressToWithdraw
   * @return {Promise<IAccountState & {txHash: string}>}
   */
  public async withdrawEgld(
    addressToWithdraw: string
  ): Promise<IAccountState & { txHash: string }> {
    throw new Error("Not implemented");
    // if (this.accountState.egldBalance <= 0) {
    //   throw new Error("You can not withdraw. Your egld balance is 0");
    // }
    // const factoryConfig = new TransactionsFactoryConfig({
    //   chainID: this.serverConfig.chainId,
    // });

    // const maxAmount = new BigNumber(
    //   TokenPayment.fungibleFromAmount(
    //     "",
    //     new BigNumber(this.accountState.egldBalance),
    //     18
    //   ).toString()
    // )
    //   .minus("50000000000000")
    //   .toString();
    // const transaction = new TransferTransactionsFactory({
    //   config: factoryConfig,
    // }).createTransactionForNativeTokenTransfer({
    //   receiver: Address.fromBech32(addressToWithdraw),
    //   sender: Address.fromBech32(this.accountState.address),
    //   nativeAmount: BigInt(maxAmount),
    // });

    // transaction.nonce = BigInt(
    //   (await this.getEgldBalance(this.wallet.publicKey)).nonce
    // );

    // const signedTransaction = await this.signTransaction(transaction);

    // const txHash = await this.sendTransaction(signedTransaction);
    // this.accountState = {
    //   ...this.accountState,
    //   egldBalance: 0,
    // };
    // this.accountState.gameScore = this.computeScore();
    // return { txHash, ...this.accountState };
  }

  /**
   * @description Withdraws all the redeemed tokens from the game account address
   *
   * @param {string} addressToWithdraw
   * @return {Promise<IAccountState & {txHash: string}>}
   */
  public async withdraw(
    addressToWithdraw: string
  ): Promise<IAccountState & { txHash: string }> {
    this.accountState = await this.socket.getAccountState();

    const hasBalance = this.accountState.balance !== 0;
    const hasNfts = false;
    if (!hasBalance && !hasNfts) {
      throw new Error("Nothing to withdraw.");
    }

    const factoryConfig = new TransactionsFactoryConfig({
      chainID: this.serverConfig.chainId,
    });

    const userNfts = await this.getUserNfts(this.accountState.address);

    const tokenTransfers = [
      new TokenTransfer({
        token: new Token({
          identifier: this.serverConfig.tokenIdentifier,
        }),
        amount: BigInt(this.accountState.balance + "000000000000000000"),
      }),
    ];

    for (const nft of userNfts) {
      const tokenTransfer = new TokenTransfer({
        token: new Token({
          identifier: nft.collection,
          nonce: BigInt(nft.nonce),
        }),
        amount: BigInt(nft.balance ? parseInt(nft.balance) : 1),
      });
      tokenTransfers.push(tokenTransfer);
    }

    const transaction = new TransferTransactionsFactory({
      config: factoryConfig,
    }).createTransactionForESDTTokenTransfer({
      receiver: Address.fromBech32(addressToWithdraw),
      sender: Address.fromBech32(this.accountState.address),
      tokenTransfers,
    });

    transaction.gasLimit = null;

    transaction.nonce = (
      await this.getNetworkAccountState(this.accountState.address)
    ).nonce;

    const signedTransaction = await this.signTransaction(transaction);
    const withdrawTx = await this.socket.withdraw({
      userTransaction: signedTransaction.toPlainObject(),
    });

    const txHash = await this.sendTransaction(
      Transaction.fromPlainObject(withdrawTx)
    );

    await this.trackTransaction(txHash);
    this.accountState = await this.socket.getAccountState();
    this.accountState.gameScore = this.computeScore();
    return { txHash, ...this.accountState };
  }

  private async trackTransaction(txHash: string) {
    this.txInProgress = { txHash };
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });

    let isTxSuccessful = false;

    for (let i = 1; i <= 500; i++) {
      const finished = await new Promise(async (resolve) => {
        try {
          const status = await this.getTxStatus(txHash);
          if (status === "pending") {
            resolve(false);
            return;
          }
          if (status === "success") {
            isTxSuccessful = true;
          }

          resolve(true);
        } catch (error) {
          resolve(true);
        }
      });

      if (finished) {
        break;
      }

      await new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 3000);
      });
    }

    this.txInProgress = false;

    return isTxSuccessful;
  }

  private async getTxStatus(txHash: string) {
    const response = await axios.get(
      `${this.serverConfig.apiUrl}/transactions/${txHash}`
    );

    return response.data.status;
  }

  private async sendTransaction(signedTransaction: Transaction) {
    const response = await axios.post(
      `${this.config.apiUrl}/transactions`,
      signedTransaction.toPlainObject()
    );

    if (!response.data.txHash) {
      throw new Error("Could not send withdraw transaction!");
    }

    return response.data.txHash;
  }

  private async signTransaction(
    transaction: Transaction
  ): Promise<Transaction> {
    try {
      const signer = new UserSigner(
        UserSecretKey.fromString(this.wallet.secretKey)
      );

      const signature = await signer.sign(transaction.serializeForSigning());
      transaction.applySignature(signature);

      return transaction;
    } catch (error: any) {
      throw new Error(`Transaction canceled: ${error.message}.`);
    }
  }

  private createNewWallet() {
    return this.getKeyPairsOnSahrd(1);
  }

  private getKeyPairsOnSahrd(shardId: number): any {
    const mnemonic = Mnemonic.generate();

    const deriveKey = mnemonic.deriveKey(0);
    const secretKeyHex = deriveKey.hex();
    const secretKey = UserSecretKey.fromString(secretKeyHex);
    const address = secretKey.generatePublicKey().toAddress();
    const publicKey = address.bech32();

    const addressShard = this.getShardOfAddress(address.hex());
    if (addressShard !== shardId) {
      return this.getKeyPairsOnSahrd(shardId);
    }
    return { publicKey, secretKey: secretKeyHex };
  }

  private getShardOfAddress(hexPubKey: any) {
    try {
      const numShards = 3;
      const maskHigh = parseInt("11", 2);
      const maskLow = parseInt("01", 2);
      const pubKey = Buffer.from(hexPubKey, "hex");
      const lastByteOfPubKey = pubKey[31];
      let shard = lastByteOfPubKey & maskHigh;
      if (shard > numShards - 1) {
        shard = lastByteOfPubKey & maskLow;
      }
      return shard;
    } catch (err) {
      return -1;
    }
  }
}

(window as any).ClickerLib = ClickerLib.instance;
