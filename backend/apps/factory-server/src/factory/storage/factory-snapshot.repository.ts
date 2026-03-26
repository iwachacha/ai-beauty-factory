import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Account, PublishRecord } from '@yikart/mongodb'
import { Model } from 'mongoose'
import { FactoryAccountSnapshot } from './account-snapshot.schema'
import { FactoryPostSnapshot } from './post-snapshot.schema'

@Injectable()
export class FactorySnapshotRepository {
  constructor(
    @InjectModel(FactoryAccountSnapshot.name)
    private readonly accountSnapshotModel: Model<FactoryAccountSnapshot>,
    @InjectModel(FactoryPostSnapshot.name)
    private readonly postSnapshotModel: Model<FactoryPostSnapshot>,
  ) {}

  async captureAccount(account: Account) {
    await this.accountSnapshotModel.create({
      userId: account.userId,
      accountId: account.id,
      platform: account.type,
      followers: account.fansCount,
      impressions: null,
      views: account.readCount,
      likes: account.likeCount,
      comments: account.commentCount,
      shares: account.forwardCount,
      posts: account.workCount,
      snapshotAt: new Date(),
    })
  }

  async capturePublishedPost(record: PublishRecord) {
    await this.postSnapshotModel.create({
      userId: record.userId,
      publishRecordId: record.id,
      flowId: record.flowId || '',
      accountId: record.accountId || '',
      platform: record.accountType,
      remotePostId: record.dataId,
      workLink: record.workLink,
      impressions: null,
      views: null,
      likes: null,
      comments: null,
      shares: null,
      snapshotAt: new Date(),
    })
  }
}
