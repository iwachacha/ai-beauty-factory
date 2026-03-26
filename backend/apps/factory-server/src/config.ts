import { resolve } from 'node:path'
import { aitoearnAiClientConfigSchema } from '@yikart/aitoearn-ai-client'
import { aitoearnAuthConfigSchema } from '@yikart/aitoearn-auth'
import { aliSmsConfigSchema } from '@yikart/ali-sms'
import { assetsConfigSchema } from '@yikart/assets'
import { mongodbConfigSchema as channelDbConfigSchema } from '@yikart/channel-db'
import { baseConfig, createZodDto, zodValidate } from '@yikart/common'
import { mongodbConfigSchema } from '@yikart/mongodb'
import { redisConfigSchema } from '@yikart/redis'
import { redlockConfigSchema } from '@yikart/redlock'
import { fileLoader, selectConfig as nestSelectConfig, TypedConfigModule } from 'nest-typed-config'
import z from 'zod'

const mailConfigSchema = z.object({
  transport: z.object({
    host: z.string().default(''),
    port: z.number().default(587),
    secure: z.boolean().default(false),
    auth: z.object({
      user: z.string().default(''),
      pass: z.string().default(''),
    }),
  }),
  defaults: z.object({
    from: z.string().default(''),
  }),
})

const oAuthConfigSchema = z.object({
  clientId: z.string().default(''),
  clientSecret: z.string().default(''),
  configId: z.string().default(''),
  redirectUri: z.string().default(''),
  promotionRedirectUri: z.string().default(''),
  promotionBaseUrl: z.string().default(''),
  scopes: z.array(z.string()).default([]),
})

const factoryChannelConfigSchema = z.object({
  channelDb: channelDbConfigSchema,
  moreApi: z.object({
    platApiUri: z.string().default(''),
    xhsCreatorUri: z.string().default(''),
  }),
  shortLink: z.object({
    baseUrl: z.string().default(''),
  }),
  bilibili: z.object({
    id: z.string().default(''),
    secret: z.string().default(''),
    authBackHost: z.string().default(''),
  }),
  douyin: z.object({
    id: z.string().default(''),
    secret: z.string().default(''),
    authBackHost: z.string().default(''),
  }),
  kwai: z.object({
    id: z.string().default(''),
    secret: z.string().default(''),
    authBackHost: z.string().default(''),
  }),
  google: z.object({
    id: z.string().default(''),
    secret: z.string().default(''),
    authBackHost: z.string().default(''),
  }),
  googleBusiness: z.object({
    clientId: z.string().default(''),
    clientSecret: z.string().default(''),
    redirectUri: z.string().default(''),
  }),
  pinterest: z.object({
    id: z.string().default(''),
    secret: z.string().default(''),
    authBackHost: z.string().default(''),
    baseUrl: z.string().default(''),
    test_authorization: z.string().default(''),
  }),
  tiktok: z.object({
    clientId: z.string().default(''),
    clientSecret: z.string().default(''),
    redirectUri: z.string().default(''),
    promotionRedirectUri: z.string().default(''),
    scopes: z.array(z.string()).default([]),
    promotionBaseUrl: z.string().default(''),
  }),
  twitter: z.object({
    clientId: z.string().default(''),
    clientSecret: z.string().default(''),
    redirectUri: z.string().default(''),
  }),
  oauth: z.object({
    facebook: oAuthConfigSchema,
    threads: oAuthConfigSchema,
    instagram: oAuthConfigSchema,
    linkedin: oAuthConfigSchema,
  }),
  wxPlat: z.object({
    id: z.string().default(''),
    secret: z.string().default(''),
    token: z.string().default(''),
    encodingAESKey: z.string().default(''),
    authBackHost: z.string().default(''),
  }),
  myWxPlat: z.object({
    id: z.string().default(''),
    secret: z.string().default(''),
    hostUrl: z.string().default(''),
  }),
  youtube: z.object({
    id: z.string().default(''),
    secret: z.string().default(''),
    authBackHost: z.string().default(''),
  }),
})

const factoryAppConfigSchema = z.object({
  ...baseConfig.shape,
  environment: z.enum(['development', 'production']).default('development'),
  auth: aitoearnAuthConfigSchema,
  redis: redisConfigSchema,
  mongodb: mongodbConfigSchema,
  redlock: redlockConfigSchema,
  aliSms: aliSmsConfigSchema,
  assets: assetsConfigSchema,
  mail: mailConfigSchema,
  aiClient: aitoearnAiClientConfigSchema,
  credits: z.object({}),
  channel: factoryChannelConfigSchema,
  factory: z.object({
    admin: z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(1).default('Factory Admin'),
    }),
  }),
})

export class AppConfig extends createZodDto(factoryAppConfigSchema) {}

function resolveFactoryConfigPath() {
  const envPath = process.env['FACTORY_CONFIG_PATH'] || process.env['APP_CONFIG_PATH']
  if (envPath) {
    return envPath
  }

  for (let i = 0; i < process.argv.length; i += 1) {
    const current = process.argv[i]
    if ((current === '-c' || current === '--config') && process.argv[i + 1]) {
      return process.argv[i + 1]
    }

    if (current.startsWith('--config=')) {
      return current.slice('--config='.length)
    }

    if (current.startsWith('-c=')) {
      return current.slice(3)
    }
  }

  return 'apps/factory-server/config/local.config.js'
}

const configModule = TypedConfigModule.forRoot({
  schema: AppConfig,
  validate(value) {
    return zodValidate(value, factoryAppConfigSchema, (error) => {
      return new Error(`Configuration is not valid:\n${z.prettifyError(error)}\n`)
    }) as unknown as Record<string, unknown>
  },
  load: fileLoader({
    absolutePath: resolve(process.cwd(), resolveFactoryConfigPath()),
  }),
})

export const config = nestSelectConfig(configModule, AppConfig)
