import { describe, expect, it } from 'vitest'
import { encryptPassword, validatePassword } from './password.util'

describe('password.util', () => {
  describe('encryptPassword', () => {
    it('generates a salt when none is provided', () => {
      const result = encryptPassword('test-password')
      expect(result.password).toBeTruthy()
      expect(result.salt).toBeTruthy()
      expect(result.password).not.toBe('test-password')
    })

    it('uses the provided salt', () => {
      const salt = Buffer.from('a'.repeat(16)).toString('base64')
      const result = encryptPassword('test-password', salt)
      expect(result.salt).toBe(salt)
    })

    it('produces deterministic output for the same salt', () => {
      const salt = Buffer.from('b'.repeat(16)).toString('base64')
      const a = encryptPassword('hello', salt)
      const b = encryptPassword('hello', salt)
      expect(a.password).toBe(b.password)
    })

    it('produces different output for different passwords', () => {
      const salt = Buffer.from('c'.repeat(16)).toString('base64')
      const a = encryptPassword('password1', salt)
      const b = encryptPassword('password2', salt)
      expect(a.password).not.toBe(b.password)
    })

    it('produces different salts when called without salt', () => {
      const a = encryptPassword('test')
      const b = encryptPassword('test')
      expect(a.salt).not.toBe(b.salt)
    })

    it('generates a salt of at least 16 bytes', () => {
      const result = encryptPassword('test')
      const saltBuffer = Buffer.from(result.salt, 'base64')
      expect(saltBuffer.length).toBeGreaterThanOrEqual(16)
    })
  })

  describe('validatePassword', () => {
    it('returns true for a matching password', () => {
      const encrypted = encryptPassword('my-secret')
      expect(validatePassword(encrypted.password, encrypted.salt, 'my-secret')).toBe(true)
    })

    it('returns false for a wrong password', () => {
      const encrypted = encryptPassword('my-secret')
      expect(validatePassword(encrypted.password, encrypted.salt, 'wrong-password')).toBe(false)
    })

    it('returns false for a different salt', () => {
      const encrypted = encryptPassword('my-secret')
      const otherSalt = Buffer.from('z'.repeat(16)).toString('base64')
      expect(validatePassword(encrypted.password, otherSalt, 'my-secret')).toBe(false)
    })
  })
})
