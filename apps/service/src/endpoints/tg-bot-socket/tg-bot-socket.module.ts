import { Module } from '@nestjs/common';
import { TgBotSocketService } from './tg-bot-socket.service';
import { TgBotSocketGateway } from './tg-bot-socket.gateway';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageProvider } from '@nestjs/throttler/dist/throttler.providers';
import { redisStore } from 'cache-manager-redis-yet';
import { MurLockModule } from 'murlock';
import { MasterWalletService } from './services/tg-bot-socket/services/master-wallet/master-wallet.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: 'localhost',
            port: 6379,
            // tls: true,
          },
          pingInterval: 30000,
          // password: '',
          // username: '',
        });

        return {
          store: store as unknown as CacheStore,
          ttl: 0,
        };
      },
    }),
    ThrottlerModule.forRoot({ limit: 30, ttl: 1 }),
    MurLockModule.forRoot({
      redisOptions: {
        socket: {
          host: 'localhost',
          port: 6379,
          // tls: true,
        },
        pingInterval: 30000,
        // password: '',
        // username: '',
      },
      wait: 100,
      maxAttempts: 500,
      logLevel: 'none',
      ignoreUnlockFail: true,
    }),
  ],
  providers: [
    TgBotSocketGateway,
    TgBotSocketService,
    ThrottlerStorageProvider,
    MasterWalletService,
  ],
})
export class TgBotSocketModule {}
