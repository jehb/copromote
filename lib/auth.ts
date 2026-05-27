import crypto from 'crypto'

export async function hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    return `${salt}:${hash}`
}

export async function verifyPassword(password: string, hashWithSalt: string): Promise<boolean> {
    if (!hashWithSalt.includes(':')) {
        return false
    }
    const [salt, hash] = hashWithSalt.split(':')
    const candidateHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    return candidateHash === hash
}

