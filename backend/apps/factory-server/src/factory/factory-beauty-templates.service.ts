import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiBeautyTemplate } from '@yikart/mongodb';
import { CreateAiBeautyTemplateDto } from './factory-beauty.dto';

@Injectable()
export class FactoryBeautyTemplatesService {
  constructor(
    @InjectModel(AiBeautyTemplate.name)
    private templateModel: Model<AiBeautyTemplate>
  ) {}

  async findAll() {
    return this.templateModel.find().exec();
  }

  async findOne(templateId: string) {
    return this.templateModel.findOne({ templateId }).exec();
  }

  async create(createDto: CreateAiBeautyTemplateDto) {
    const created = new this.templateModel(createDto);
    return created.save();
  }

  async update(templateId: string, updateDto: any) {
    return this.templateModel.findOneAndUpdate({ templateId }, updateDto, { new: true }).exec();
  }

  async remove(templateId: string) {
    return this.templateModel.findOneAndDelete({ templateId }).exec();
  }
}
