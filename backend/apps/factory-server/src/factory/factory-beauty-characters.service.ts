import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiBeautyCharacter } from '@yikart/mongodb';
import { CreateAiBeautyCharacterDto } from './factory-beauty.dto';

@Injectable()
export class FactoryBeautyCharactersService {
  constructor(
    @InjectModel(AiBeautyCharacter.name)
    private characterModel: Model<AiBeautyCharacter>
  ) {}

  async findAll() {
    return this.characterModel.find().exec();
  }

  async findOne(code: string) {
    return this.characterModel.findOne({ code }).exec();
  }

  async create(createDto: CreateAiBeautyCharacterDto) {
    const created = new this.characterModel(createDto);
    return created.save();
  }

  async update(code: string, updateDto: any) {
    return this.characterModel.findOneAndUpdate({ code }, updateDto, { new: true }).exec();
  }

  async remove(code: string) {
    return this.characterModel.findOneAndDelete({ code }).exec();
  }
}
