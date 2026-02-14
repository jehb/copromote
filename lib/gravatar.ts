import md5 from 'crypto-js/md5'

export function getGravatarUrl(email: string, size: number = 200) {
    if (!email) return ''

    const trimmedEmail = email.trim().toLowerCase()
    const hash = md5(trimmedEmail).toString()

    // d=mp (mystery person) is a good default
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`
}
