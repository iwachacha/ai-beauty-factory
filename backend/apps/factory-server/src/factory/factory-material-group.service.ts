import { Injectable } from '@nestjs/common'
import { MaterialGroupRepository } from '@yikart/mongodb'

@Injectable()
export class FactoryMaterialGroupService {
  constructor(
    private readonly materialGroupRepository: MaterialGroupRepository,
  ) {}

  async getDefaultGroup(userId: string) {
    return await this.materialGroupRepository.getDefaultGroup(userId)
  }

  async ensureDefaultGroup(userId: string) {
    return await this.materialGroupRepository.createDefault(userId)
  }
}
