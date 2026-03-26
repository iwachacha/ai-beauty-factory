import { Injectable, UnauthorizedException } from '@nestjs/common'
import { AitoearnAuthService } from '@yikart/aitoearn-auth'
import { UserRepository, UserStatus } from '@yikart/mongodb'
import { FactoryLoginDto } from './factory-auth.dto'
import { validatePassword } from './utils/password.util'

@Injectable()
export class FactoryAuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AitoearnAuthService,
  ) {}

  async login(data: FactoryLoginDto) {
    const user = await this.userRepository.getByMail(data.email, true)
    if (!user || user.isDelete || user.status !== UserStatus.OPEN || !user.password || !user.salt) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const matched = validatePassword(user.password, user.salt, data.password)
    if (!matched) {
      throw new UnauthorizedException('Invalid email or password')
    }

    const token = this.authService.generateToken({
      id: user.id,
      mail: user.mail,
      name: user.name,
    })

    return {
      token,
      user: {
        id: user.id,
        email: user.mail,
        name: user.name,
      },
    }
  }
}
