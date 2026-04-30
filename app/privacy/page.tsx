import Link from 'next/link'
import { Bot } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - SupportAI',
  description: 'SupportAI privacy policy and data handling practices',
}

export default function PrivacyPolicy() {
  const lastUpdated = 'April 25, 2024'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Bot className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">SupportAI</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-base text-foreground leading-relaxed">
              SupportAI ("we", "us", "our", or "Company") operates the SupportAI platform. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>

            <h3 className="text-lg font-semibold mt-6 mb-3">Account Information</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              When you create an account, we collect information such as your name, email address, and organization details. This information is necessary to establish and maintain your account.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Support Documents</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              You may upload documents (PDFs, DOCX, text files) to our platform to be used as knowledge bases for AI responses. These documents are stored securely on our servers and processed according to your configuration.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Customer Conversations</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              When your customers interact with the SupportAI widget or voice interface, we collect conversation data including customer messages, AI responses, and metadata (channel, timestamps). Customer emails may be collected if provided during interactions.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Usage Data</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              We automatically collect usage statistics including number of conversations, messages, tokens used, documents uploaded, and emails processed. This data is aggregated monthly to track your service consumption.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">AI Provider Configuration</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              If you use Bring-Your-Own-Key (BYOK) AI providers, we store references to your provider configuration (provider name, model selected) but do not store your API keys unencrypted. API keys are encrypted at rest using industry-standard encryption.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Email Configuration</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              If you enable email channel support, we may store email server credentials (encrypted), email addresses, and processed email messages to facilitate support operations.
            </p>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Information</h2>
            <ul className="space-y-3 text-base text-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Providing and maintaining our service</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Processing and responding to customer support queries through AI</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Training and improving our RAG (Retrieval-Augmented Generation) models</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Analyzing usage patterns to optimize service performance</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Sending administrative and transactional communications</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Complying with legal obligations and enforcing our agreements</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Detecting and preventing fraud or security issues</span>
              </li>
            </ul>
          </section>

          {/* Data Storage & Security */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Data Storage & Security</h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              We implement comprehensive security measures to protect your data from unauthorized access, alteration, and disclosure. This includes:
            </p>
            <ul className="space-y-3 text-base text-foreground mb-4">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>AES-256 encryption for sensitive data at rest</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>HTTPS/TLS 1.2+ for data in transit</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Role-based access control (RBAC) for team members</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Regular security audits and penetration testing</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Database backups stored securely with geographic redundancy</span>
              </li>
            </ul>
            <p className="text-base text-foreground leading-relaxed">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect personal data, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Third-Party Services</h2>

            <h3 className="text-lg font-semibold mt-6 mb-3">Bring-Your-Own-Key (BYOK) AI Providers</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              SupportAI supports Bring-Your-Own-Key configurations with third-party AI providers including OpenAI, Anthropic Claude, Google Gemini, Groq, and OpenRouter. When you configure BYOK:
            </p>
            <ul className="space-y-3 text-base text-foreground mb-4">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Your documents and customer messages may be sent to your configured AI provider's servers</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>You are responsible for understanding those providers' privacy policies and terms</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>API keys are encrypted and never logged or transmitted in plain text</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>We recommend disabling data retention with your AI provider if sensitive information is involved</span>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Payment Processing</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              We use Razorpay for payment processing. Payment information is not stored on our servers. Razorpay's privacy policy governs payment data handling.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Email Integration</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              If you enable email support, we may integrate with email providers via IMAP or webhooks. Email content is processed and stored according to your configuration.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Data Retention</h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              We retain your data for as long as necessary to provide our services and comply with legal obligations:
            </p>
            <ul className="space-y-3 text-base text-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Account data:</strong> Retained until account deletion</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Conversations:</strong> Retained until organization deletion or manual removal</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Documents:</strong> Retained until deleted by organization admin</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Usage logs:</strong> Retained for 12 months for billing and analytics</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Backup data:</strong> Retained for up to 30 days after deletion</span>
              </li>
            </ul>
          </section>

          {/* Your Rights - GDPR */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Your Rights (GDPR & Data Protection)</h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              If you are located in the European Union or other jurisdictions with data protection regulations, you have the following rights:
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Right to Access</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              You can request and download a complete export of your personal data and organizational data in JSON format. Use the export endpoint to retrieve this information.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Right to Erasure ("Right to be Forgotten")</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              You can request the deletion of all your data and your organization's data. This includes all conversations, documents, tickets, users, and usage logs. This action is permanent and cannot be undone.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Right to Data Portability</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              We provide data export functionality that allows you to obtain your data in a structured, portable format suitable for transfer to another service.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Right to Rectification</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              You can request correction of inaccurate personal data. You can update your account information directly through the settings dashboard.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Right to Object</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              You may object to certain processing of your data. Contact us to discuss your specific concerns.
            </p>

            <p className="text-base text-foreground leading-relaxed mt-6">
              To exercise any of these rights, please contact us at the information provided below. We will respond to your request within 30 days.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p><strong>Email:</strong> support@supportai.example.com</p>
              <p><strong>Service:</strong> SupportAI - AI-Powered Customer Support Platform</p>
              <p><strong>Data Protection Officer:</strong> dpo@supportai.example.com</p>
            </div>
            <p className="text-base text-foreground leading-relaxed mt-4">
              We will work with you to resolve any privacy concerns in a timely and professional manner.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-base text-foreground leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or relevant regulations. We will notify you of any material changes by updating the "Last updated" date and, for significant changes, by sending a notice to the email address associated with your account.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4 text-sm text-muted-foreground text-center">
          <p>&copy; 2024 SupportAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
