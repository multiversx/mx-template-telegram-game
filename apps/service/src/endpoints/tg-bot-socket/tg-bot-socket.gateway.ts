import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { TgBotSocketService } from './tg-bot-socket.service';
import { Socket } from 'socket.io';
import { AuthWsMiddleware } from './AuthWsMiddleware';
import {
  NativeAuthDecoded,
  NativeAuthServer,
} from '@multiversx/sdk-native-auth-server';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, UseGuards } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Throttle } from '@nestjs/throttler';
import { WsThrottlerGuard } from './WsThrottleGuard';
import { IPlainTransactionObject } from '@multiversx/sdk-core/out';
import { gameConfig } from './constants';

@WebSocketGateway({ namespace: 'clickerGame', cors: true })
export class TgBotSocketGateway implements OnGatewayInit {
  constructor(
    private readonly tgBotSocketService: TgBotSocketService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async afterInit(@ConnectedSocket() socket: Socket) {
    const nativeAuth = new NativeAuthServer({
      apiUrl: gameConfig.apiUrl,
      maxExpirySeconds: 7200,
      acceptedOrigins: ['*'],
    });
    socket.use(AuthWsMiddleware(nativeAuth, this.cacheManager));
  }

  @Throttle(20, 1)
  @UseGuards(WsThrottlerGuard)
  @SubscribeMessage('click')
  click(
    @ConnectedSocket()
    socket: Socket & { user: NativeAuthDecoded },
  ) {
    return this.tgBotSocketService.click(socket.user);
  }

  @SubscribeMessage('resetState')
  resetState(
    @ConnectedSocket()
    socket: Socket & { user: NativeAuthDecoded },
  ) {
    return this.tgBotSocketService.resetState(socket.user);
  }

  @Throttle(5, 1)
  @UseGuards(WsThrottlerGuard)
  @SubscribeMessage('getAccountState')
  getAccountState(
    @ConnectedSocket()
    socket: Socket & { user: NativeAuthDecoded },
  ) {
    return this.tgBotSocketService.getAccountState(socket.user);
  }

  @Throttle(1, 1)
  @UseGuards(WsThrottlerGuard)
  @SubscribeMessage('getServerConfig')
  getServerConfig(
    @ConnectedSocket()
    socket: Socket & { user: NativeAuthDecoded },
  ) {
    return this.tgBotSocketService.getServerConfig();
  }

  @Throttle(1, 1)
  @SubscribeMessage('redeem')
  redeem(
    @ConnectedSocket()
    socket: Socket & { user: NativeAuthDecoded },
  ) {
    return this.tgBotSocketService.redeem(socket.user);
  }

  @Throttle(2, 1)
  @UseGuards(WsThrottlerGuard)
  @SubscribeMessage('automatedMoney')
  automatedMoney(
    @ConnectedSocket()
    socket: Socket & { user: NativeAuthDecoded & { automatedMoney: boolean } },
  ) {
    return this.tgBotSocketService.click({
      ...socket.user,
      automatedMoney: true,
    });
  }

  @Throttle(50, 1)
  @UseGuards(WsThrottlerGuard)
  @SubscribeMessage('buyItem')
  buyItem(
    @MessageBody() body: any,
    @ConnectedSocket()
    socket: Socket & { user: NativeAuthDecoded },
  ) {
    return this.tgBotSocketService.buyItem(socket.user, body);
  }

  // @Throttle(1, 1)
  // @UseGuards(WsThrottlerGuard)
  @SubscribeMessage('withdraw')
  withdraw(
    @MessageBody() body: { userTransaction: IPlainTransactionObject },
    @ConnectedSocket()
    socket: Socket & { user: NativeAuthDecoded },
  ) {
    return this.tgBotSocketService.withdraw(socket.user, body.userTransaction);
  }

  @Throttle(1, 1)
  @UseGuards(WsThrottlerGuard)
  @SubscribeMessage('getRelayedTransaction')
  getRelayedTransaction(
    @MessageBody() body: any,
    @ConnectedSocket()
    socket: Socket & { user: NativeAuthDecoded },
  ) {
    return this.tgBotSocketService.getRelayedTransaction(socket.user, body);
  }

  @Throttle(1, 1)
  @UseGuards(WsThrottlerGuard)
  @SubscribeMessage('getBurnTokensTx')
  getBurnTokensTx(
    @MessageBody() body: any,
    @ConnectedSocket()
    socket: Socket & { user: NativeAuthDecoded },
  ) {
    return this.tgBotSocketService.getBurnTokensTx(socket.user, body);
  }

  @Throttle(1, 1)
  @UseGuards(WsThrottlerGuard)
  @SubscribeMessage('getBuyTx')
  getBuyTx(
    @MessageBody() body: any,
    @ConnectedSocket()
    socket: Socket & { user: NativeAuthDecoded },
  ) {
    return this.tgBotSocketService.getBuyTx(socket.user, body);
  }
}
