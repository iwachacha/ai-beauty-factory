const {
  REDIS_HOST = '127.0.0.1',
  REDIS_PORT = '6379',
  REDIS_PASSWORD = '',
  REDIS_USERNAME = '',
  MONGODB_HOST = '127.0.0.1',
  MONGODB_PORT = '27017',
  MONGODB_USERNAME = '',
  MONGODB_PASSWORD = '',
  MONGODB_AUTH_SOURCE = 'admin',
  MONGODB_DIRECT_CONNECTION = 'true',
  FACTORY_DB_NAME = 'factory',
  FACTORY_CHANNEL_DB_NAME = 'factory_channel',
  FACTORY_PORT = '3012',
  NODE_ENV = 'development',
  APP_DOMAIN = 'localhost:3012',
  APP_BASE_URL,
  JWT_SECRET = 'factory-dev-secret',
  INTERNAL_TOKEN = 'factory-internal-token',
  FACTORY_ADMIN_EMAIL = 'admin@example.com',
  FACTORY_ADMIN_PASSWORD = 'changeme123',
  FACTORY_ADMIN_NAME = 'Factory Admin',
  FACTORY_ASSETS_CONFIG,
  ASSETS_CONFIG,
  AI_URL = '',
  MAIL_USER = '',
  MAIL_PASS = '',
  GOOGLE_CLIENT_ID = '',
  GOOGLE_CLIENT_SECRET = '',
  PINTEREST_CLIENT_ID = '',
  PINTEREST_CLIENT_SECRET = '',
  PINTEREST_TEST_AUTHORIZATION = '',
  TIKTOK_CLIENT_ID = '',
  TIKTOK_CLIENT_SECRET = '',
  TWITTER_CLIENT_ID = '',
  TWITTER_CLIENT_SECRET = '',
  FACEBOOK_CLIENT_ID = '',
  FACEBOOK_CLIENT_SECRET = '',
  FACEBOOK_CONFIG_ID = '',
  THREADS_CLIENT_ID = '',
  THREADS_CLIENT_SECRET = '',
  INSTAGRAM_CLIENT_ID = '',
  INSTAGRAM_CLIENT_SECRET = '',
  YOUTUBE_CLIENT_ID = '',
  YOUTUBE_CLIENT_SECRET = '',
  ALI_SMS_ACCESS_KEY_ID = '',
  ALI_SMS_ACCESS_KEY_SECRET = '',
  ALI_SMS_SIGN_NAME = '',
  ALI_SMS_TEMPLATE_CODE = '',
} = process.env

const appBaseUrl = APP_BASE_URL || `http://${APP_DOMAIN}`
const mongoCredential = MONGODB_USERNAME
  ? `${encodeURIComponent(MONGODB_USERNAME)}:${encodeURIComponent(MONGODB_PASSWORD)}@`
  : ''
const mongoQuery = new URLSearchParams({
  authSource: MONGODB_AUTH_SOURCE,
})

if (MONGODB_DIRECT_CONNECTION) {
  mongoQuery.set('directConnection', MONGODB_DIRECT_CONNECTION)
}

const mongoUri = `mongodb://${mongoCredential}${MONGODB_HOST}:${MONGODB_PORT}/?${mongoQuery.toString()}`

const parsedAssetsConfig = (() => {
  const raw = FACTORY_ASSETS_CONFIG || ASSETS_CONFIG
  if (raw) {
    return JSON.parse(raw)
  }

  return {
    provider: 's3',
    region: 'auto',
    endpoint: `${appBaseUrl}/assets`,
    bucketName: 'factory-assets',
    accessKeyId: '',
    secretAccessKey: '',
    forcePathStyle: true,
    publicEndpoint: `${appBaseUrl}/assets`,
  }
})()

module.exports = {
  appDomain: APP_DOMAIN,
  globalPrefix: 'api',
  port: Number(FACTORY_PORT),
  environment: NODE_ENV === 'production' ? 'production' : 'development',
  enableBadRequestDetails: true,
  auth: {
    secret: JWT_SECRET,
    internalToken: INTERNAL_TOKEN,
  },
  logger: {
    console: {
      enable: true,
      level: 'debug',
      pretty: false,
    },
  },
  mongodb: {
    uri: mongoUri,
    dbName: FACTORY_DB_NAME,
  },
  redis: {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
    username: REDIS_USERNAME || undefined,
    password: REDIS_PASSWORD || undefined,
  },
  redlock: {
    redis: {
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
      username: REDIS_USERNAME || undefined,
      password: REDIS_PASSWORD || undefined,
    },
  },
  channel: {
    channelDb: {
      uri: mongoUri,
      dbName: FACTORY_CHANNEL_DB_NAME,
    },
    moreApi: {
      platApiUri: '',
      xhsCreatorUri: '',
    },
    shortLink: {
      baseUrl: '',
    },
    bilibili: {
      id: '',
      secret: '',
      authBackHost: '',
    },
    douyin: {
      id: '',
      secret: '',
      authBackHost: '',
    },
    kwai: {
      id: '',
      secret: '',
      authBackHost: '',
    },
    google: {
      id: GOOGLE_CLIENT_ID,
      secret: GOOGLE_CLIENT_SECRET,
      authBackHost: '',
    },
    googleBusiness: {
      clientId: '',
      clientSecret: '',
      redirectUri: '',
    },
    pinterest: {
      id: PINTEREST_CLIENT_ID,
      secret: PINTEREST_CLIENT_SECRET,
      authBackHost: '',
      baseUrl: 'https://api.pinterest.com',
      test_authorization: PINTEREST_TEST_AUTHORIZATION,
    },
    tiktok: {
      clientId: TIKTOK_CLIENT_ID,
      clientSecret: TIKTOK_CLIENT_SECRET,
      redirectUri: `${appBaseUrl}/api/accounts/connect/tiktok/callback`,
      promotionRedirectUri: `${appBaseUrl}/api/accounts/connect/tiktok/callback`,
      scopes: [
        'user.info.basic',
        'user.info.profile',
        'video.upload',
        'video.publish',
      ],
      promotionBaseUrl: appBaseUrl,
    },
    twitter: {
      clientId: TWITTER_CLIENT_ID,
      clientSecret: TWITTER_CLIENT_SECRET,
      redirectUri: `${appBaseUrl}/api/accounts/connect/twitter/callback`,
    },
    oauth: {
      facebook: {
        clientId: FACEBOOK_CLIENT_ID,
        clientSecret: FACEBOOK_CLIENT_SECRET,
        configId: FACEBOOK_CONFIG_ID,
        redirectUri: `${appBaseUrl}/api/accounts/connect/meta/callback`,
        scopes: [
          'public_profile',
          'pages_show_list',
          'pages_manage_posts',
          'pages_read_engagement',
          'pages_manage_engagement',
          'read_insights',
        ],
      },
      threads: {
        clientId: THREADS_CLIENT_ID,
        clientSecret: THREADS_CLIENT_SECRET,
        configId: '',
        redirectUri: `${appBaseUrl}/api/accounts/connect/meta/callback`,
        scopes: [
          'threads_basic',
          'threads_content_publish',
          'threads_manage_insights',
        ],
      },
      instagram: {
        clientId: INSTAGRAM_CLIENT_ID,
        clientSecret: INSTAGRAM_CLIENT_SECRET,
        configId: '',
        redirectUri: `${appBaseUrl}/api/accounts/connect/meta/callback`,
        promotionRedirectUri: `${appBaseUrl}/api/accounts/connect/meta/callback`,
        promotionBaseUrl: appBaseUrl,
        scopes: [
          'instagram_business_basic',
          'instagram_business_content_publish',
          'instagram_business_manage_comments',
        ],
      },
      linkedin: {
        clientId: '',
        clientSecret: '',
        configId: '',
        redirectUri: '',
        scopes: ['openid', 'profile', 'email', 'w_member_social'],
      },
    },
    wxPlat: {
      id: '',
      secret: '',
      token: 'factory',
      encodingAESKey: '',
      authBackHost: '',
    },
    myWxPlat: {
      id: '',
      secret: '',
      hostUrl: '',
    },
    youtube: {
      id: YOUTUBE_CLIENT_ID,
      secret: YOUTUBE_CLIENT_SECRET,
      authBackHost: `${appBaseUrl}/api/accounts/connect/youtube/callback`,
    },
  },
  assets: parsedAssetsConfig,
  mail: {
    transport: {
      host: '',
      port: 587,
      secure: false,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    },
    defaults: {
      from: '',
    },
  },
  aliSms: {
    accessKeyId: ALI_SMS_ACCESS_KEY_ID,
    accessKeySecret: ALI_SMS_ACCESS_KEY_SECRET,
    signName: ALI_SMS_SIGN_NAME,
    templateCode: ALI_SMS_TEMPLATE_CODE,
  },
  aiClient: {
    baseUrl: AI_URL,
    token: INTERNAL_TOKEN,
  },
  credits: {},
  factory: {
    admin: {
      email: FACTORY_ADMIN_EMAIL,
      password: FACTORY_ADMIN_PASSWORD,
      name: FACTORY_ADMIN_NAME,
    },
  },
}
