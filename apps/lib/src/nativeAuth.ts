import { NativeAuthClient } from "@multiversx/sdk-native-auth-client";
import { IWallet } from "./interfaces";
import { Address, Message, MessageComputer } from "@multiversx/sdk-core/out";
import { UserSecretKey, UserSigner } from "@multiversx/sdk-wallet/out";
import WebApp from "@twa-dev/sdk";

interface SignMessageParams {
  message: string;
  address?: string;
  privateKey: string;
}

export class NativeAuth {
  public static async generateNativeAuthToken(
    apiUrl: string,
    keyPairs: IWallet
  ) {
    const client = new NativeAuthClient({
      apiUrl,
      expirySeconds: 7200,
    });

    const challengeToken = await client.initialize({
      firstName: WebApp.initDataUnsafe.user.first_name,
      lastName: WebApp.initDataUnsafe.user.last_name,
      username: WebApp.initDataUnsafe.user.username,
    });

    const messageToSign = `${keyPairs.publicKey}${challengeToken}`;

    const signature = Buffer.from(
      (
        await this.signMessageWithPrivateKey({
          message: messageToSign,
          privateKey: keyPairs.secretKey,
        })
      ).signature
    ).toString("hex");

    const nativeAuthToken = client.getToken(
      keyPairs.publicKey,
      challengeToken,
      signature
    );

    return nativeAuthToken;
  }

  private static async signMessageWithPrivateKey({
    message,
    privateKey,
  }: SignMessageParams): Promise<Message> {
    const signer = new UserSigner(UserSecretKey.fromString(privateKey));

    const msg = new Message({
      data: Buffer.from(message, "utf8"),
    });
    const messageComputer = new MessageComputer();
    const messageToSign = messageComputer.computeBytesForSigning(msg);
    msg.signature = await signer.sign(Buffer.from(messageToSign));
    return msg;
  }
}
