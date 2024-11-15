import { io, Socket } from "socket.io-client";
import { IAccountState, IServerConfig } from "./interfaces";
import { IPlainTransactionObject } from "@multiversx/sdk-core/out";

export class ClickerWebSocket {
  private socket: Socket;
  constructor(gameSocketApiUrl: string, nativeAuthToken: string) {
    this.socket = io(gameSocketApiUrl, {
      auth: { token: nativeAuthToken },
      transports: ["websocket"],
    });
  }

  public async click(): Promise<IAccountState> {
    return new Promise((resolve) => {
      this.socket.emit("click", null, (data: IAccountState) => {
        resolve(data);
      });
    });
  }

  public async getAccountState(): Promise<IAccountState> {
    return new Promise((resolve) => {
      this.socket.emit("getAccountState", null, (data: IAccountState) => {
        resolve(data);
      });
    });
  }

  public async getServerConfig(): Promise<IServerConfig> {
    return new Promise((resolve) => {
      this.socket.emit("getServerConfig", null, (data: IServerConfig) => {
        resolve(data);
      });
    });
  }

  public async redeem(): Promise<IPlainTransactionObject> {
    return new Promise((resolve) => {
      this.socket.emit("redeem", null, (data: IPlainTransactionObject) => {
        resolve(data);
      });
    });
  }

  public async getBurnTokensTx(item: {
    userTransaction: IPlainTransactionObject;
  }): Promise<IPlainTransactionObject> {
    return new Promise((resolve) => {
      this.socket.emit(
        "getBurnTokensTx",
        item,
        (data: IPlainTransactionObject) => {
          resolve(data);
        }
      );
    });
  }
  public async getBuyTx(item: any): Promise<IPlainTransactionObject> {
    return new Promise((resolve) => {
      this.socket.emit("getBuyTx", item, (data: IPlainTransactionObject) => {
        resolve(data);
      });
    });
  }

  public async automatedMoney(): Promise<IAccountState> {
    return new Promise((resolve) => {
      this.socket.emit("automatedMoney", null, (data: IAccountState) => {
        resolve(data);
      });
    });
  }

  public async buyItem(item: {
    category: string;
    index: number;
  }): Promise<IAccountState> {
    return new Promise((resolve) => {
      this.socket.emit("buyItem", item, (data: IAccountState) => {
        resolve(data);
      });
    });
  }

  public async withdraw(item: {
    userTransaction: IPlainTransactionObject;
  }): Promise<IPlainTransactionObject> {
    return new Promise((resolve) => {
      this.socket.emit("withdraw", item, (data: IPlainTransactionObject) => {
        resolve(data);
      });
    });
  }

  public async getRelayedTransaction(item: {
    category: string;
    index: number;
  }): Promise<IPlainTransactionObject> {
    return new Promise((resolve) => {
      this.socket.emit(
        "getRelayedTransaction",
        item,
        (data: IPlainTransactionObject) => {
          resolve(data);
        }
      );
    });
  }

  public async resetState(): Promise<IAccountState> {
    return new Promise((resolve) => {
      this.socket.emit("resetState", null, (data: IAccountState) => {
        resolve(data);
      });
    });
  }
}
