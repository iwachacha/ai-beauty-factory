/*
 * @Author: nevin
 * @Date: 2021-12-24 13:46:31
 * @LastEditors: nevin
 * @LastEditTime: 2024-08-30 15:01:32
 * @Description: 莠貞勘隶ｰ蠖戊ｮｰ蠖・interactionRecord
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { DEFAULT_SCHEMA_OPTIONS } from '../channel-db.constants'
import { BaseTemp } from './time.tamp'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'interactionRecord' })
export class InteractionRecord extends BaseTemp {
  id: string

  @Prop({
    required: true,
    index: true,
    type: String,
  })
  userId: string

  @Prop({
    required: true,
    index: true,
    type: String,
  })
  accountId: string

  @Prop({
    required: true,
    type: String,
    enum: AccountType,
  })
  type: AccountType

  @Prop({
    required: true,
    index: true,
    type: String,
  })
  worksId: string

  // 菴懷刀譬・｢・
  @Prop({
    type: String,
    default: '',
  })
  worksTitle?: string

  // 菴懷刀蟆・擇
  @Prop({
    type: String,
  })
  worksCover?: string

  @Prop({
    type: String,
    default: '',
  })
  worksContent?: string

  @Prop({
    type: String,
  })
  commentContent?: string

  // 隸・ｮｺ譌ｶ髣ｴ
  @Prop({
    type: Date,
    default: null,
  })
  commentTime?: Date

  // 隸・ｮｺ螟・ｳｨ
  @Prop({
    type: String,
  })
  commentRemark?: string

  // 轤ｹ襍樊慮髣ｴ
  @Prop({
    type: Date,
  })
  likeTime?: Date

  // 謾ｶ阯乗慮髣ｴ
  @Prop({
    type: Date,
  })
  collectTime?: Date
}

export const InteractionRecordSchema = SchemaFactory.createForClass(InteractionRecord)

