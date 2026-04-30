declare module 'pdf-parse' {
  interface PDFData {
    numpages: number
    numrender: number
    info: any
    metadata: any
    text: string
    version: string
  }
  function pdfParse(buffer: Buffer): Promise<PDFData>
  export default pdfParse
}

declare module 'natural' {
  export class TfIdf {
    addDocument(document: string): void
    tfidfs(term: string, callback: (i: number, measure: number) => void): void
    listTerms(documentIndex: number): Array<{ term: string; tfidf: number }>
  }
}

declare module 'imapflow' {
  export interface ImapFlowOptions {
    host: string
    port: number
    secure?: boolean
    auth?: {
      user: string
      pass: string
    }
    connectionTimeout?: number
    socketTimeout?: number
  }

  export class ImapFlow {
    constructor(options: ImapFlowOptions)
    connect(): Promise<void>
    logout(): Promise<void>
    mailboxOpen(mailbox: string): Promise<{ exists: number }>
    search(query: { unseen?: boolean }): Promise<number[]>
    fetchOne(uid: number, options?: { source?: boolean }): Promise<{ source?: Buffer | string | any }>
    messageFlagsSet(uid: number, flags: string[]): Promise<void>
  }
}

declare module 'mailparser' {
  export interface ParsedMail {
    from?: { text: string; name?: string }
    to?: { text: string; name?: string }
    subject?: string
    text?: string
    html?: string
    messageId?: string
  }

  export function simpleParser(source: any): Promise<ParsedMail>
}
