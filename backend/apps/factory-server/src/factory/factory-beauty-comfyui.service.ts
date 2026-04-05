import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiBeautyComfyuiJob } from '@yikart/mongodb';
import { GenerateComfyUIJobDto } from './factory-beauty.dto';

@Injectable()
export class FactoryBeautyComfyuiService {
  private readonly logger = new Logger(FactoryBeautyComfyuiService.name);

  constructor(
    @InjectModel(AiBeautyComfyuiJob.name)
    private comfyuiJobModel: Model<AiBeautyComfyuiJob>
  ) {}

  async findAllJobs() {
    return this.comfyuiJobModel.find().sort({ createdAt: -1 }).exec();
  }

  async queueGeneration(dto: GenerateComfyUIJobDto) {
    this.logger.log(`Queueing generation for ${dto.characterCode} with template ${dto.templateId}`);
    
    // In a real implementation, this would call the ComfyUI API
    // const response = await fetch('http://localhost:8188/prompt', { ... });
    // const data = await response.json();
    const mockJobId = `mock-job-${Date.now()}`;
    
    const job = new this.comfyuiJobModel({
      jobId: mockJobId,
      characterCode: dto.characterCode,
      promptText: `Character: ${dto.characterCode}, Template: ${dto.templateId}`,
      status: 'queued'
    });
    
    return job.save();
  }

  async updateJobStatus(jobId: string, status: string, resultUrls?: string[]) {
    return this.comfyuiJobModel.findOneAndUpdate(
      { jobId }, 
      { status, resultUrls }, 
      { new: true }
    ).exec();
  }
}
