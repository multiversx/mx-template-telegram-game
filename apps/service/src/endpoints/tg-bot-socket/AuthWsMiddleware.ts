import { NativeAuthServer } from '@multiversx/sdk-native-auth-server';
import { UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { IAccountState, IToken } from './interfaces';
import { Cache } from 'cache-manager';
import { initialPlayerState } from './constants';

type SocketMiddleware = (socket: any, next: (err?: Error) => void) => void;

export const AuthWsMiddleware = (
  authServer: NativeAuthServer,
  cacheManager: Cache,
): SocketMiddleware => {
  return async (socket: Socket, next) => {
    const authorization: string = socket.handshake.auth.token;
    if (!authorization) {
      return false;
    }

    try {
      const userInfo = await authServer.validate(authorization);

      socket = Object.assign(socket, {
        user: userInfo,
      });
      const userStateFromCache: IAccountState = await cacheManager.get(
        userInfo.address,
      );
      let userState: IAccountState = userStateFromCache || {
        ...initialPlayerState,
        address: userInfo.address,
        username: userInfo.extraInfo?.username,
        firstName: userInfo.extraInfo?.firstName,
        lastName: userInfo.extraInfo?.lastName,
      };

      cacheManager.set(userInfo.address, userState);
      next();
    } catch (error) {
      console.log(error);
      next(new UnauthorizedException());
    }
  };
};
