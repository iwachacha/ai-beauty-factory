import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { FactoryBeautyTemplatesService } from './factory-beauty-templates.service';
import { CreateAiBeautyTemplateDto } from './factory-beauty.dto';

@Controller('factory/beauty-templates')
export class FactoryBeautyTemplatesController {
  constructor(private readonly templatesService: FactoryBeautyTemplatesService) {}

  @Get()
  findAll() {
    return this.templatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') templateId: string) {
    return this.templatesService.findOne(templateId);
  }

  @Post()
  create(@Body() createDto: CreateAiBeautyTemplateDto) {
    return this.templatesService.create(createDto);
  }

  @Put(':id')
  update(@Param('id') templateId: string, @Body() updateDto: any) {
    return this.templatesService.update(templateId, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') templateId: string) {
    return this.templatesService.remove(templateId);
  }
}
