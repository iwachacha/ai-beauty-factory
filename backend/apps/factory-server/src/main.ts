require('node:dns').setServers(['8.8.8.8', '8.8.4.4']);
import { startApplication } from '@yikart/common'
import { AppModule } from './app.module'
import { config } from './config'

startApplication(AppModule, config, {
  setupApp: (app) => {
    app.enableCors({
      origin: process.env['FACTORY_CORS_ORIGIN'] || 'http://localhost:6070',
      credentials: true,
    })
  },
})
