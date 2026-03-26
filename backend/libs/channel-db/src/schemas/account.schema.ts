import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Schema as MongooseSchema } from 'mongoose'
import { DEFAULT_SCHEMA_OPTIONS } from '../channel-db.constants'
import { AccountStatus } from '../enums'
import { BaseTemp } from './time.tamp'

@Schema({ ...DEFAULT_SCHEMA_OPTIONS, collection: 'account' })
export class Account extends BaseTemp {
  @Prop({ type: MongooseSchema.Types.String })
  _id: string

  id: string

  @Prop({
    required: false,
    type: String,
  })
  userId?: string

  @Prop({
    required: true,
    type: String,
    enum: AccountType,
  })
  type: AccountType

  @Prop({
    required: true, // 蟷ｳ蜿ｰ雍ｦ謌ｷ逧・髪荳ID
  })
  uid: string

  @Prop({
    required: false, // 驛ｨ蛻・ｹｳ蜿ｰ逧・｡･蜈・D
  })
  account: string

  @Prop({
    required: false,
    type: Date,
  })
  loginTime?: Date

  @Prop({
    required: false,
  })
  avatar?: string

  @Prop({
    required: true,
  })
  nickname: string

  @Prop({
    required: true,
    type: Number,
    default: AccountStatus.NORMAL,
  })
  status: AccountStatus // 逋ｻ蠖慕憾諤・ｼ檎畑莠主愛譁ｭ譏ｯ蜷ｦ螟ｱ謨・
}

export const AccountSchema = SchemaFactory.createForClass(Account)
AccountSchema.index({ type: 1, uid: 1 }, { unique: true })

