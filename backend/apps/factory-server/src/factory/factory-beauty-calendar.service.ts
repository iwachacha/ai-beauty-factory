import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiBeautyCalendar } from '@yikart/mongodb';
import { CreateAiBeautyCalendarDto } from './factory-beauty.dto';

@Injectable()
export class FactoryBeautyCalendarService {
  constructor(
    @InjectModel(AiBeautyCalendar.name)
    private calendarModel: Model<AiBeautyCalendar>
  ) {}

  async findAll() {
    return this.calendarModel.find().exec();
  }

  async findOne(id: string) {
    return this.calendarModel.findById(id).exec();
  }

  async create(createDto: CreateAiBeautyCalendarDto) {
    const created = new this.calendarModel(createDto);
    return created.save();
  }

  async update(id: string, updateDto: any) {
    return this.calendarModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }

  async remove(id: string) {
    return this.calendarModel.findByIdAndDelete(id).exec();
  }
}
