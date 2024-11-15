import {
  Address,
  IPlainTransactionObject,
  Mnemonic,
  RelayedTransactionsFactory,
  Token,
  TokenTransfer,
  Transaction,
  TransactionsFactoryConfig,
  TransferTransactionsFactory,
  UserSecretKey,
  UserSigner,
} from '@multiversx/sdk-core/out';
import { MurLock } from 'murlock';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  burnAddress,
  gameConfig,
  masterWallet,
  sftNonces,
} from 'src/endpoints/tg-bot-socket/constants';
import { IAccountState, IToken } from 'src/endpoints/tg-bot-socket/interfaces';
import { NativeAuthDecoded } from '@multiversx/sdk-native-auth-server';

@Injectable()
export class MasterWalletService {
  private secretKey: string;
  private publicKey: string;
  private accountInfo: { balance: string; nonce: number };

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    const mnemonic = Mnemonic.fromString(masterWallet.join(' '));

    const deriveKey = mnemonic.deriveKey(0);
    const secretKeyHex = deriveKey.hex();
    const secretKey = UserSecretKey.fromString(secretKeyHex);
    const address = secretKey.generatePublicKey().toAddress();
    const publicKey = address.bech32();

    this.publicKey = publicKey;
    this.secretKey = secretKeyHex;
    this.setNonce();
  }

  private async setNonce() {
    const nonce = (await this.getAccountInfo()).nonce;
    // const nonce = await this.cacheManager.get('mainWalletNonce');
    this.cacheManager.set('mainWalletNonce', nonce);

    console.log(await this.cacheManager.get('mainWalletNonce'));

    setInterval(async () => {
      //   console.log(await this.cacheManager.get('mainWalletNonce'));
    }, 2000);
  }

  @MurLock(5000, 'lockKey')
  private async getRelayerNonce({ lockKey }: any) {
    const nonceFromCache = (await this.cacheManager.get(
      'mainWalletNonce',
    )) as number;
    let nonce = nonceFromCache || 0;
    const nonceFromNetwork = (await this.getAccountInfo()).nonce;
    if (nonceFromNetwork > nonce) {
      nonce = nonceFromNetwork;
    }
    this.cacheManager.set('mainWalletNonce', nonce + 1);
    return nonce;
  }

  public async redeem(address: string, tokensToRedeem: number) {
    const factoryConfig = new TransactionsFactoryConfig({
      chainID: gameConfig.chainId,
    });

    const token = new Token({
      identifier: gameConfig.tokenIdentifier,
    });
    const tokenTransfer = new TokenTransfer({
      token,
      amount: BigInt(tokensToRedeem + '000000000000000000'),
    });

    const transaction = new TransferTransactionsFactory({
      config: factoryConfig,
    }).createTransactionForESDTTokenTransfer({
      receiver: Address.fromBech32(address),
      sender: Address.fromBech32(this.publicKey),
      tokenTransfers: [tokenTransfer],
    });
    const nonce = await this.getRelayerNonce({ lockKey: 'relayerNonceKey' });
    transaction.nonce = BigInt(nonce);

    const signedTransaction = await this.signTransaction(transaction);
    return signedTransaction;
  }

  public async getRelayedTransaction(address: string, itemCost: number) {
    const factoryConfig = new TransactionsFactoryConfig({
      chainID: gameConfig.chainId,
    });

    const token = new Token({
      identifier: gameConfig.tokenIdentifier,
    });
    const tokenTransfer = new TokenTransfer({
      token,
      amount: BigInt(itemCost + '000000000000000000'),
    });

    const transaction = new TransferTransactionsFactory({
      config: factoryConfig,
    }).createTransactionForESDTTokenTransfer({
      receiver: Address.fromBech32(burnAddress),
      sender: Address.fromBech32(address),
      tokenTransfers: [tokenTransfer],
    });

    transaction.gasLimit = null;

    transaction.nonce = BigInt((await this.getAccountInfo(address)).nonce);
    return transaction.toPlainObject();
  }

  public async burnTokens(
    { address }: NativeAuthDecoded,
    { category, index },
    signedRelayedTransaction: IPlainTransactionObject,
  ) {
    const relayedTransaction = await this.generateRelayedTransaction(
      signedRelayedTransaction,
    );
    return relayedTransaction.toPlainObject();
  }

  public async getBuyTx({ address }: NativeAuthDecoded, { category, index }) {
    const userStateFromCache: IAccountState =
      await this.cacheManager.get(address);
    const itemCost =
      userStateFromCache.purchasesState.upgradeData[category][index].price;

    console.log('userStateFromCache.balance', userStateFromCache.balance);
    if (userStateFromCache.balance < itemCost) {
      throw new Error('Not enough MOONICH balance to purchase the item');
    }

    userStateFromCache.balance = userStateFromCache.balance - itemCost;
    userStateFromCache.purchasesState.upgradeData[category][index]['bought'] =
      true;
    await this.cacheManager.set(address, userStateFromCache);
    return (await this.sendSft(address, category, index)).toPlainObject();
  }

  public async withdraw(signedRelayedTransaction: IPlainTransactionObject) {
    const relayedTx = await this.generateRelayedTransaction(
      signedRelayedTransaction,
      500000 * 20,
    );
    return relayedTx.toPlainObject();
  }

  public async generateRelayedTransaction(
    signedRelayedTransaction: IPlainTransactionObject,
    gaslimit = 50000,
  ) {
    let transaction = new RelayedTransactionsFactory({
      config: {
        chainID: gameConfig.chainId,
        gasLimitPerByte: BigInt(1500),
        minGasLimit: BigInt(gaslimit),
      },
    }).createRelayedV2Transaction({
      relayerAddress: Address.fromBech32(this.publicKey),
      innerTransaction: Transaction.fromPlainObject(signedRelayedTransaction),
      innerTransactionGasLimit: BigInt(500000),
    });

    const nonce = await this.getRelayerNonce({ lockKey: 'relayerNonceKey' });
    transaction.nonce = BigInt(nonce);

    transaction = Transaction.fromPlainObject(transaction.toPlainObject());

    const signedTransaction = await this.signTransaction(transaction);
    return signedTransaction;
  }

  public async sendSft(address: string, category: string, index: number) {
    const factoryConfig = new TransactionsFactoryConfig({
      chainID: gameConfig.chainId,
    });

    const token = new Token({
      identifier: gameConfig.sftCollectionIdentifier,
      nonce: BigInt(sftNonces[category][index]),
    });
    const tokenTransfer = new TokenTransfer({
      token,
      amount: BigInt(1),
    });

    const transaction = new TransferTransactionsFactory({
      config: factoryConfig,
    }).createTransactionForESDTTokenTransfer({
      tokenTransfers: [tokenTransfer],
      receiver: Address.fromBech32(address),
      sender: Address.fromBech32(this.publicKey),
    });
    const nonce = await this.getRelayerNonce({ lockKey: 'relayerNonceKey' });
    transaction.nonce = BigInt(nonce);

    const signedTransaction = await this.signTransaction(transaction);

    return signedTransaction;
  }

  private async getTxStatus(txHash: string) {
    const response = await axios.get(
      `${gameConfig.apiUrl}/transactions/${txHash}`,
    );

    return response.data.status;
  }

  private async signTransaction(
    transaction: Transaction,
  ): Promise<Transaction> {
    try {
      const signer = new UserSigner(UserSecretKey.fromString(this.secretKey));

      const signature = await signer.sign(transaction.serializeForSigning());
      transaction.applySignature(signature);

      return transaction;
    } catch (error: any) {
      throw new Error(`Transaction canceled: ${error.message}.`);
    }
  }

  private async getAccountInfo(address?: string) {
    const response = await axios.get(
      `${gameConfig.apiUrl}/accounts/${address || this.publicKey}`,
    );

    if (!address)
      this.accountInfo = {
        balance: response.data.balance,
        nonce: response.data.nonce,
      };

    return { balance: response.data.balance, nonce: response.data.nonce };
  }

  private async getTokenDetails(tokenIdentifier: string) {
    const response = await axios.get(
      `${gameConfig.apiUrl}/accounts/${this.publicKey}/tokens/?identifier=${tokenIdentifier}`,
    );

    return response.data[0] as IToken;
  }
}
