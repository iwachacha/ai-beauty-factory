import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { FactoryBeautyMonetizationService } from './factory-beauty-monetization.service';
import { CreateAiBeautyMonetizationDto } from './factory-beauty.dto';

@Controller('factory/beauty-monetization')
export class FactoryBeautyMonetizationController {
  constructor(private readonly monetizationService: FactoryBeautyMonetizationService) {}

  @Get()
  findAll() {
    return this.monetizationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.monetizationService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateAiBeautyMonetizationDto) {
    return this.monetizationService.create(createDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.monetizationService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.monetizationService.remove(id);
  }
}
