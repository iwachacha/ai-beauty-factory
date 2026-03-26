import { Injectable } from '@nestjs/common'
import { AccountRepository } from '@yikart/mongodb'

@Injectable()
export class FactoryAccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
  ) {}

  async getUserAccounts(userId: string) {
    return await this.accountRepository.getUserAccounts(userId)
  }

  async getAccountListByIdsOfUser(userId: string, ids: string[]) {
    return await this.accountRepository.getAccountListByIdsOfUser(userId, ids)
  }
}
