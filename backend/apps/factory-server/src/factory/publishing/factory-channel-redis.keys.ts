export class FactoryChannelRedisKeys {
  static accessToken(platform: string, id: string) {
    return `${platform}:access_token:${id}`
  }
}
