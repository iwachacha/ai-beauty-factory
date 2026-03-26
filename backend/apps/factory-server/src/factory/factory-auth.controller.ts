import { Body, Controller, Post } from '@nestjs/common'
import { Public } from '@yikart/aitoearn-auth'
import { FactoryLoginDto } from './factory-auth.dto'
import { FactoryAuthService } from './factory-auth.service'

@Controller('auth')
export class FactoryAuthController {
  constructor(private readonly authService: FactoryAuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: FactoryLoginDto) {
    return await this.authService.login(body)
  }
}
