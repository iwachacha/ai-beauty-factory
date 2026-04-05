import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { FactoryBeautyCalendarService } from './factory-beauty-calendar.service';
import { CreateAiBeautyCalendarDto } from './factory-beauty.dto';

@Controller('factory/beauty-calendar')
export class FactoryBeautyCalendarController {
  constructor(private readonly calendarService: FactoryBeautyCalendarService) {}

  @Get()
  findAll() {
    return this.calendarService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateAiBeautyCalendarDto) {
    return this.calendarService.create(createDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.calendarService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calendarService.remove(id);
  }
}
