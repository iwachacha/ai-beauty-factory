import { Injectable } from '@nestjs/common'
import { Account, PublishRecord } from '@yikart/mongodb'
import { FactorySnapshotRepository } from './storage/factory-snapshot.repository'

@Injectable()
export class FactorySnapshotService {
  constructor(
    private readonly snapshotRepository: FactorySnapshotRepository,
  ) {}

  async captureAccount(account: Account) {
    await this.snapshotRepository.captureAccount(account)
  }

  async capturePublishedPost(record: PublishRecord) {
    await this.snapshotRepository.capturePublishedPost(record)
  }
}
