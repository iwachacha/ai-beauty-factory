import * as crypto from 'node:crypto'

export interface FactoryPassword {
  password: string
  salt: string
}

const SALT_BYTES = 16
const ITERATIONS = 100_000
const KEY_LENGTH = 32
const DIGEST = 'sha256'

function makeSalt(): string {
  return crypto.randomBytes(SALT_BYTES).toString('base64')
}

export function encryptPassword(
  password: string,
  salt?: string,
): FactoryPassword {
  const resolvedSalt = salt || makeSalt()
  const encrypted = crypto
    .pbkdf2Sync(password, Buffer.from(resolvedSalt, 'base64'), ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('base64')

  return {
    password: encrypted,
    salt: resolvedSalt,
  }
}

export function validatePassword(
  storedPassword: string,
  storedSalt: string,
  password: string,
): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(encryptPassword(password, storedSalt).password, 'base64'),
    Buffer.from(storedPassword, 'base64'),
  )
}
