interface EmailRecipient {
    address: string
    name?: string
}

interface SendEmailOptions {
    to: string | string[] | EmailRecipient[]
    subject: string
    text: string
    html?: string
    from?: EmailRecipient
}

/**
 * Sends an email using the configured email provider.
 * Supports 'mock' (logs to console/files) and 'twilio' (native Twilio Email REST API).
 * 
 * Configure via environment variables:
 * - EMAIL_PROVIDER: 'mock' (default) or 'twilio'
 * - TWILIO_ACCOUNT_SID: Twilio Account SID
 * - TWILIO_AUTH_TOKEN: Twilio Auth Token
 * - TWILIO_EMAIL_FROM_ADDRESS: Default sender email (e.g. no-reply@copromote.app)
 * - TWILIO_EMAIL_FROM_NAME: Default sender name (e.g. Co+promote)
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const provider = process.env.EMAIL_PROVIDER || 'mock'
    const fromAddress = options.from?.address || process.env.TWILIO_EMAIL_FROM_ADDRESS || 'no-reply@copromote.app'
    const fromName = options.from?.name || process.env.TWILIO_EMAIL_FROM_NAME || 'Co+promote'

    // Normalize recipients
    let recipients: EmailRecipient[] = []
    if (typeof options.to === 'string') {
        recipients = [{ address: options.to }]
    } else if (Array.isArray(options.to)) {
        recipients = options.to.map(item => {
            if (typeof item === 'string') {
                return { address: item }
            }
            return item
        })
    }

    if (provider === 'mock') {
        console.log('\n========================================')
        console.log('[MOCK EMAIL SENT]')
        console.log(`From: "${fromName}" <${fromAddress}>`)
        console.log(`To: ${recipients.map(r => (r.name ? `"${r.name}" <${r.address}>` : r.address)).join(', ')}`)
        console.log(`Subject: ${options.subject}`)
        console.log('----------------------------------------')
        console.log('Body (Text):', options.text)
        if (options.html) {
            console.log('Body (HTML):', options.html)
        }
        console.log('========================================\n')
        return { success: true, messageId: `mock-${Date.now()}` }
    }

    if (provider === 'twilio') {
        const accountSid = process.env.TWILIO_ACCOUNT_SID
        const authToken = process.env.TWILIO_AUTH_TOKEN

        if (!accountSid || !authToken) {
            console.error('Twilio credentials not configured in environment variables.')
            return { success: false, error: 'Twilio credentials not configured' }
        }

        try {
            const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
            const response = await fetch('https://comms.twilio.com/v1/Emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                },
                body: JSON.stringify({
                    from: { address: fromAddress, name: fromName },
                    to: recipients,
                    content: {
                        subject: options.subject,
                        text: options.text,
                        html: options.html || `<p>${options.text}</p>`,
                    }
                })
            })

            const responseData = await response.json()
            if (!response.ok) {
                console.error('Twilio Email API Error:', responseData)
                return { success: false, error: responseData.message || 'Twilio API error' }
            }

            return { success: true, messageId: responseData.sid || responseData.id }
        } catch (error: any) {
            console.error('Failed to send email via Twilio:', error)
            return { success: false, error: error.message || 'Network error' }
        }
    }

    return { success: false, error: `Unsupported email provider: ${provider}` }
}
