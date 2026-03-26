import * as crypto from 'node:crypto'

export interface FactoryPassword {
  password: string
  salt: string
}

function makeSalt(): string {
  return crypto.randomBytes(3).toString('base64')
}

export function encryptPassword(
  password: string,
  salt?: string,
): FactoryPassword {
  const resolvedSalt = salt || makeSalt()
  const encrypted = crypto
    .pbkdf2Sync(password, Buffer.from(resolvedSalt, 'base64'), 10000, 16, 'sha1')
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
  return encryptPassword(password, storedSalt).password === storedPassword
}
