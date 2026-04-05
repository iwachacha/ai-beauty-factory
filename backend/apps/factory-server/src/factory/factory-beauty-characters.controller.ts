import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { FactoryBeautyCharactersService } from './factory-beauty-characters.service';
import { CreateAiBeautyCharacterDto } from './factory-beauty.dto';

@Controller('factory/beauty-characters')
export class FactoryBeautyCharactersController {
  constructor(private readonly charactersService: FactoryBeautyCharactersService) {}

  @Get()
  findAll() {
    return this.charactersService.findAll();
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.charactersService.findOne(code);
  }

  @Post()
  create(@Body() createDto: CreateAiBeautyCharacterDto) {
    return this.charactersService.create(createDto);
  }

  @Put(':code')
  update(@Param('code') code: string, @Body() updateDto: any) {
    return this.charactersService.update(code, updateDto);
  }

  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.charactersService.remove(code);
  }
}
