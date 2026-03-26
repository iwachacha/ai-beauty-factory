import { Injectable } from '@nestjs/common'
import { TableDto, UserType } from '@yikart/common'
import { Material, MaterialRepository, MaterialStatus, MaterialType } from '@yikart/mongodb'

interface FactoryMaterialListFilter {
  userId?: string
  userType?: UserType
  title?: string
  groupId?: string
  status?: MaterialStatus
  ids?: string[]
  useCount?: number
}

@Injectable()
export class FactoryMaterialService {
  constructor(
    private readonly materialRepository: MaterialRepository,
  ) {}

  async create(newData: Partial<Material>) {
    return await this.materialRepository.create(newData)
  }

  async getInfo(id: string) {
    return await this.materialRepository.getInfo(id)
  }

  async getList(page: TableDto, filter: FactoryMaterialListFilter) {
    return await this.materialRepository.getList(filter, page)
  }

  async addUseCount(id: string): Promise<boolean> {
    const material = await this.materialRepository.updateUseCountById(id)
    if (!material) {
      return false
    }

    if (
      material.maxUseCount !== null
      && material.maxUseCount !== undefined
      && material.useCount >= material.maxUseCount
    ) {
      await this.materialRepository.deleteById(id)
    }

    return true
  }

  toMaterialType(contentType: string) {
    return contentType === 'video' ? MaterialType.VIDEO : MaterialType.ARTICLE
  }
}
