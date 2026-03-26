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
    const admin = await this.ensureAdminUser()
    await this.accountGroupService.getDefaultGroup(admin.id)
    await this.materialGroupService.ensureDefaultGroup(admin.id)
  }

  private async ensureAdminUser() {
    const existing = await this.userRepository.getByMail(config.factory.admin.email, true)
    const encrypted = encryptPassword(config.factory.admin.password, existing?.salt)

    if (!existing) {
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

    const updated = await this.userRepository.updateById(existing.id, {
      name: config.factory.admin.name,
      password: encrypted.password,
      salt: encrypted.salt,
      status: UserStatus.OPEN,
      isDelete: false,
    })
    return updated ?? existing
  }
}
