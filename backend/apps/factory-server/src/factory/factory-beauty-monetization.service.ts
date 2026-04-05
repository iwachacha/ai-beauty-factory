import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiBeautyMonetization } from '@yikart/mongodb';
import { CreateAiBeautyMonetizationDto } from './factory-beauty.dto';

@Injectable()
export class FactoryBeautyMonetizationService {
  constructor(
    @InjectModel(AiBeautyMonetization.name)
    private monetizationModel: Model<AiBeautyMonetization>
  ) {}

  async findAll() {
    return this.monetizationModel.find().sort({ recordDate: -1 }).exec();
  }

  async findOne(id: string) {
    return this.monetizationModel.findById(id).exec();
  }

  async create(createDto: CreateAiBeautyMonetizationDto) {
    const created = new this.monetizationModel(createDto);
    return created.save();
  }

  async update(id: string, updateDto: any) {
    return this.monetizationModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }

  async remove(id: string) {
    return this.monetizationModel.findByIdAndDelete(id).exec();
  }
}
