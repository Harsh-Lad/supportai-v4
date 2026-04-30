/**
 * IMAP polling implementation using imapflow.
 * Connects to IMAP server, fetches UNSEEN messages, parses them, processes through email-processor.
 */

import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { Readable } from 'stream'
import { processInboundEmail, type InboundEmail } from './email-processor'
import { decrypt } from './encryption'

export interface ImapConfig {
  host: string
  port: number
  user: string
  password: string // encrypted
  tls: boolean
}

export async function pollInbox(orgId: string, config: ImapConfig): Promise<{ processed: number; errors: any[] }> {
  const errors: any[] = []
  let processed = 0

  let client: ImapFlow | null = null

  try {
    // Decrypt password
    const decryptedPassword = decrypt(config.password)
    if (!decryptedPassword) {
      throw new Error('Failed to decrypt IMAP password')
    }

    // Connect to IMAP server with 30s timeout
    client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.tls,
      auth: {
        user: config.user,
        pass: decryptedPassword,
      },
      connectionTimeout: 30000,
      socketTimeout: 30000,
    })

    // Connect
    await client.connect()

    // Open INBOX
    const mailbox = await client.mailboxOpen('INBOX')

    // Fetch all UNSEEN messages
    const messages = await client.search({ unseen: true })

    if (messages.length === 0) {
      console.log(`[IMAP] No new messages in ${orgId}`)
      await client.logout()
      return { processed: 0, errors: [] }
    }

    console.log(`[IMAP] Found ${messages.length} unseen messages in ${orgId}`)

    // Process each message
    for (const uid of messages) {
      try {
        // Fetch message
        const message = await client.fetchOne(uid, { source: true })
        if (!message.source) {
          throw new Error(`Message ${uid} has no source`)
        }

        // Parse email with simpleParser
        const parsed = await simpleParser(message.source as any)

        const inboundEmail: InboundEmail = {
          from: parsed.from?.text || '',
          fromName: parsed.from?.name,
          to: parsed.to?.text || config.user,
          subject: parsed.subject || '(no subject)',
          body: parsed.text || '',
          htmlBody: parsed.html || undefined,
          messageId: parsed.messageId || undefined,
        }

        // Process through email-processor
        const result = await processInboundEmail(orgId, inboundEmail)
        processed++

        // Mark message as seen
        await client.messageFlagsSet(uid, ['\\Seen'])
      } catch (error) {
        console.error(`[IMAP] Error processing message ${uid}:`, error)
        errors.push({
          uid,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    await client.logout()
    return { processed, errors }
  } catch (error) {
    console.error(`[IMAP] Polling error for ${orgId}:`, error)
    errors.unshift({
      type: 'connection',
      error: error instanceof Error ? error.message : String(error),
    })
    return { processed, errors }
  } finally {
    // Cleanup connection
    if (client) {
      try {
        await client.logout()
      } catch (e) {
        // Ignore logout errors
      }
    }
  }
}
