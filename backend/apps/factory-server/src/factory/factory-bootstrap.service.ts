import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { UserRepository, UserStatus, UserType } from '@yikart/mongodb'
import { config } from '../config'
import { FactoryAccountGroupService } from './factory-account-group.service'
import { FactoryMaterialGroupService } from './factory-material-group.service'
import { encryptPassword } from './utils/password.util'

@Injectable()
export class FactoryBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(FactoryBootstrapService.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly accountGroupService: FactoryAccountGroupService,
    private readonly materialGroupService: FactoryMaterialGroupService,
  ) {}

  async onModuleInit() {
    this.warnInsecureDefaults()
    const admin = await this.ensureAdminUser()
    await this.accountGroupService.getDefaultGroup(admin.id)
    await this.materialGroupService.ensureDefaultGroup(admin.id)
  }

  private warnInsecureDefaults() {
    if (config.auth.secret === 'factory-dev-secret') {
      this.logger.warn('JWT_SECRET is using the default value. Set a strong secret via the JWT_SECRET environment variable before deploying.')
    }
    if (config.factory.admin.password === 'changeme123') {
      this.logger.warn('FACTORY_ADMIN_PASSWORD is using the default value. Change it via the FACTORY_ADMIN_PASSWORD environment variable.')
    }
  }

  private async ensureAdminUser() {
    const existing = await this.userRepository.getByMail(config.factory.admin.email, true)

    if (!existing) {
      const encrypted = encryptPassword(config.factory.admin.password)
      const created = await this.userRepository.create({
        mail: config.factory.admin.email,
        name: config.factory.admin.name,
        password: encrypted.password,
        salt: encrypted.salt,
        status: UserStatus.OPEN,
        userType: UserType.CREATOR,
        isDelete: false,
        locale: 'ja-JP',
      })
      this.logger.log(`Seeded factory admin user: ${created.mail}`)
      return created
    }

    // Always sync admin credentials from config on every startup
    const encrypted = encryptPassword(config.factory.admin.password)
    const updates: Record<string, unknown> = {
      name: config.factory.admin.name,
      status: UserStatus.OPEN,
      isDelete: false,
      password: encrypted.password,
      salt: encrypted.salt,
    }

    const updated = await this.userRepository.updateById(existing.id, updates)
    this.logger.log(`Synced factory admin user: ${existing.mail}`)
    return updated ?? existing
  }
}

