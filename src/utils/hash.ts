import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

export const hash = {
  // Hashear una contraseña
  make: (plainText: string): Promise<string> => {
    return bcrypt.hash(plainText, SALT_ROUNDS)
  },

  // Comparar una contraseña con su hash
  compare: (plainText: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(plainText, hash)
  },
}