import { Injectable } from '@nestjs/common'
import { AccountGroupRepository } from '@yikart/mongodb'

@Injectable()
export class FactoryAccountGroupService {
  constructor(
    private readonly accountGroupRepository: AccountGroupRepository,
  ) {}

  async getDefaultGroup(userId: string) {
    return await this.accountGroupRepository.getDefaultGroup(userId)
  }
}
