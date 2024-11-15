import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const mx_address = client.user.address;
    const username = client.user.username;
    const firstName = client.user.firstName;
    const lastName = client.user.lastName;

    const key = this.generateKey(context, mx_address);
    const ttls = await this.storageService.getRecord(key);

    if (ttls.length >= limit) {
      const throttledEndpoint = context.getHandler().name;
      client.disconnect();
      throw new ThrottlerException(
        `Too many requests to ${throttledEndpoint} by ${mx_address}, username: ${username}, ${firstName} ${lastName}`,
      );
    }

    await this.storageService.addRecord(key, ttl);
    return true;
  }
}
