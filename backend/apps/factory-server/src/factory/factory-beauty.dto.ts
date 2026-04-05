export class CreateAiBeautyCharacterDto {
  code: string;
  name: string;
  nationality: string;
  age: number;
  profession: string;
  outfits?: string[];
  chiralism_fetish?: string[];
  personality: string;
  tier_target: string;
}

export class CreateAiBeautyTemplateDto {
  templateId: string;
  category: string;
  title: string;
  prompt_text: string;
  recommended_outfits?: string[];
}

export class CreateAiBeautyCalendarDto {
  characterCode: string;
  scheduledDate: Date;
  templateId?: string;
  platform: string;
  mediaUrl?: string;
}

export class CreateAiBeautyMonetizationDto {
  recordDate: Date;
  platform: string;
  newSubscribers: number;
  revenueEarned: number;
  currency?: string;
}

export class GenerateComfyUIJobDto {
  characterCode: string;
  templateId: string;
  outfit?: string;
  fetish?: string;
}
