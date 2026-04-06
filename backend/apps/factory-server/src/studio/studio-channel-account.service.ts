import { Injectable, UnprocessableEntityException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { AccountStatus } from '@yikart/mongodb'
import { Model } from 'mongoose'
import { FactoryAccountService } from '../factory/factory-account.service'
import { StudioChannelAccountEntity } from './storage/studio-channel-account.schema'

@Injectable()
export class StudioChannelAccountService {
  constructor(
    @InjectModel(StudioChannelAccountEntity.name)
    private readonly channelAccountModel: Model<StudioChannelAccountEntity>,
    private readonly accountService: FactoryAccountService,
  ) {}

  async getState(userId: string) {
    const [items, availableAccounts] = await Promise.all([
      this.channelAccountModel.find({ userId }).sort({ createdAt: -1 }).lean({ virtuals: true }).exec(),
      this.listAvailableXAccounts(userId),
    ])

    const active = items.find(item => item.isActive) || null

    return {
      activeAccountId: active?.accountId || null,
      items,
      availableAccounts,
    }
  }

  async activate(userId: string, accountId: string) {
    const account = (await this.accountService.getUserAccounts(userId))
      .find(item => item.id === accountId && item.type === AccountType.TWITTER)

    if (!account) {
      throw new UnprocessableEntityException('X account not found')
    }

    await this.channelAccountModel.updateMany({ userId, isActive: true }, { $set: { isActive: false } }).exec()

    const profileUrl = account.account ? `https://x.com/${account.account.replace(/^@/, '')}` : null
    const credentialSummary = {
      nickname: account.nickname,
      handle: account.account || '',
      followers: account.fansCount || 0,
      profileUrl,
      lastSyncedAt: account.updatedAt?.toISOString?.() || new Date().toISOString(),
    }

    return await this.channelAccountModel.findOneAndUpdate(
      { userId, accountId },
      {
        $set: {
          userId,
          accountId,
          platform: 'x',
          status: account.status === AccountStatus.NORMAL ? 'connected' : 'needs_reconnect',
          isActive: true,
          credentialSummary,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean({ virtuals: true }).exec()
  }

  async getActive(userId: string) {
    return await this.channelAccountModel.findOne({ userId, isActive: true }).lean({ virtuals: true }).exec()
  }

  private async listAvailableXAccounts(userId: string) {
    const accounts = await this.accountService.getUserAccounts(userId)
    return accounts
      .filter(account => account.type === AccountType.TWITTER)
      .map(account => ({
        accountId: account.id,
        platform: 'x' as const,
        nickname: account.nickname,
        handle: account.account || '',
        followers: account.fansCount || 0,
        status: account.status,
      }))
  }
}
