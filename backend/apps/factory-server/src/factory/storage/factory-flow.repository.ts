import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { FactoryFlow } from './flow.schema'

@Injectable()
export class FactoryFlowRepository {
  constructor(
    @InjectModel(FactoryFlow.name)
    private readonly flowModel: Model<FactoryFlow>,
  ) {}

  async create(data: Partial<FactoryFlow>) {
    return await this.flowModel.create(data)
  }

  async listByUserId(userId: string) {
    return await this.flowModel.find({ userId }).sort({ createdAt: -1 }).lean({ virtuals: true }).exec()
  }

  async listIdsByUserId(userId: string) {
    return await this.flowModel.find({ userId }).select('_id').lean().exec()
  }

  async findDocByUserIdAndId(userId: string, id: string) {
    return await this.flowModel.findOne({ _id: id, userId }).exec()
  }

  async findLeanByUserIdAndId(userId: string, id: string) {
    return await this.flowModel.findOne({ _id: id, userId }).lean({ virtuals: true }).exec()
  }

  async findDocById(id: string) {
    return await this.flowModel.findById(id).exec()
  }

  async updateById(id: string, data: Partial<FactoryFlow>) {
    return await this.flowModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true },
    ).exec()
  }

  async updateByUserIdAndId(userId: string, id: string, data: Partial<FactoryFlow>) {
    return await this.flowModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true },
    ).exec()
  }

  async existsById(id: string) {
    return !!(await this.flowModel.exists({ _id: id }))
  }
}
