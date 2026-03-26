import { Injectable } from '@nestjs/common'
import { TokenInfo } from '@yikart/aitoearn-auth'
import { TableDto, UserType } from '@yikart/common'
import { MaterialSource, MaterialStatus, MediaType } from '@yikart/mongodb'
import { CreateFactoryContentAssetDto } from './factory-content.dto'
import { FactoryMaterialGroupService } from './factory-material-group.service'
import { FactoryMaterialService } from './factory-material.service'

@Injectable()
export class FactoryContentService {
  constructor(
    private readonly materialService: FactoryMaterialService,
    private readonly materialGroupService: FactoryMaterialGroupService,
  ) {}

  async list(token: TokenInfo) {
    const result = await this.materialService.getList(
      { pageNo: 1, pageSize: 1000 } as TableDto,
      {
        userId: token.id,
        userType: UserType.User,
      },
    )

    return result.list.map(item => ({
      id: item.id,
      title: item.title,
      body: item.desc || '',
      topics: item.topics || [],
      contentType: (item.option?.['factory'] as { contentType?: string } | undefined)?.contentType || this.inferContentType(item.mediaList),
      coverUrl: item.coverUrl,
      mediaRefs: item.mediaList.map(media => ({
        url: media.url,
        thumbUrl: media.thumbUrl,
        type: media.type === MediaType.VIDEO ? 'video' : 'image',
        mediaId: media.mediaId,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))
  }

  async create(token: TokenInfo, body: CreateFactoryContentAssetDto) {
    await this.materialGroupService.ensureDefaultGroup(token.id)
    const defaultGroup = await this.materialGroupService.getDefaultGroup(token.id)
    if (!defaultGroup) {
      throw new Error('Default material group could not be initialized')
    }
    const materialType = this.materialService.toMaterialType(body.contentType)
    const created = await this.materialService.create({
      userId: token.id,
      userType: UserType.User,
      groupId: defaultGroup.id,
      source: MaterialSource.UPLOAD,
      type: materialType,
      coverUrl: body.coverUrl,
      title: body.title,
      desc: body.body,
      topics: body.topics,
      mediaList: body.mediaRefs.map(media => ({
        url: media.url,
        thumbUrl: media.thumbUrl,
        mediaId: media.mediaId,
        type: media.type === 'video' ? MediaType.VIDEO : MediaType.IMG,
      })),
      autoDeleteMedia: false,
      status: MaterialStatus.SUCCESS,
      option: {
        factory: {
          contentType: body.contentType,
        },
      },
    })

    return {
      id: created.id,
      title: created.title,
    }
  }

  private inferContentType(mediaList: { type: MediaType }[]) {
    if (mediaList.length === 0) {
      return 'text'
    }
    const hasVideo = mediaList.some(item => item.type === MediaType.VIDEO)
    const hasImage = mediaList.some(item => item.type === MediaType.IMG)
    if (hasVideo && hasImage) {
      return 'mixed'
    }
    return hasVideo ? 'video' : 'image'
  }
}
