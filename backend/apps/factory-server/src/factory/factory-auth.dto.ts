import { createZodDto } from '@yikart/common'
import z from 'zod'

export const factoryLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export class FactoryLoginDto extends createZodDto(factoryLoginSchema) {}
