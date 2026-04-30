import Link from 'next/link'
import { Bot } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service - SupportAI',
  description: 'SupportAI terms of service and conditions of use',
}

export default function TermsOfService() {
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
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-base text-foreground leading-relaxed">
              These Terms of Service ("Terms") govern your access to and use of the SupportAI platform, including all related websites, services, and products. By accessing or using SupportAI, you agree to be bound by these Terms. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              By accessing and using SupportAI, you accept and agree to be bound by and abide by all of the terms and conditions of this agreement. If you do not agree to abide by the above, please do not use this service. We reserve the right, at any time and in our sole discretion, to modify or discontinue the service (or any part thereof) with or without notice.
            </p>
          </section>

          {/* Description of Service */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              SupportAI provides a multi-tenant B2B customer support platform that uses Retrieval-Augmented Generation (RAG) and artificial intelligence to:
            </p>
            <ul className="space-y-3 text-base text-foreground mb-4">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Process and analyze customer support documents</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Provide AI-generated responses to customer queries via chat, voice, and email</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Escalate complex queries to human support agents</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Track and manage customer conversations and tickets</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Monitor usage metrics and provide analytics</span>
              </li>
            </ul>
            <p className="text-base text-foreground leading-relaxed">
              The service is provided "as-is" and may be subject to limitations, delays, and other problems inherent in the use of the Internet and electronic communications.
            </p>
          </section>

          {/* Account Terms */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Terms</h2>

            <h3 className="text-lg font-semibold mt-6 mb-3">Account Creation</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and password, and you are responsible for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. You are solely responsible for the accuracy of the information you provide during registration.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Account Eligibility</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              You must be at least 18 years of age to use SupportAI. By using our service, you represent and warrant that you meet this requirement. Organizations must authorize the person creating the account to enter into these Terms on their behalf.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Team Members</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              As an account owner, you are responsible for all activities of team members you invite to your organization. You agree to monitor and control access, and to revoke access immediately if a team member no longer requires it.
            </p>
          </section>

          {/* API Usage & BYOK */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. API Usage & Bring-Your-Own-Key (BYOK)</h2>

            <h3 className="text-lg font-semibold mt-6 mb-3">BYOK Configuration</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              SupportAI allows you to configure Bring-Your-Own-Key (BYOK) AI providers, including OpenAI, Anthropic Claude, Google Gemini, Groq, and OpenRouter. When you configure BYOK:
            </p>
            <ul className="space-y-3 text-base text-foreground mb-4">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>You are responsible for obtaining and maintaining valid API credentials</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>You maintain full responsibility for charges incurred through your API usage</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>You agree to comply with the terms of service and usage policies of the AI provider</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>We are not liable for issues, outages, or changes to third-party AI services</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Your documents and customer messages will be sent to the configured AI provider</span>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">API Rate Limits</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              We reserve the right to implement rate limits on our API and service endpoints. Excessive use that impacts service stability for other users may result in temporary or permanent account suspension.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Acceptable Use Policy</h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              You agree not to use SupportAI for any unlawful purpose or in violation of any applicable laws or regulations. Specifically, you agree not to:
            </p>
            <ul className="space-y-3 text-base text-foreground">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Use the service for phishing, fraud, or deception</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Attempt to gain unauthorized access to our systems or other users' accounts</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Upload or distribute malware, viruses, or harmful code</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Transmit child sexual abuse material (CSAM) or other illegal content</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Harass, threaten, or abuse other users or team members</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Perform denial-of-service (DoS) attacks or stress tests without written permission</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Reverse engineer, decompile, or attempt to discover source code</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Scrape, crawl, or bulk extract data from the platform</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Violate intellectual property rights of SupportAI or third parties</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Spam other users or send unsolicited marketing communications</span>
              </li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL SUPPORTAI, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="space-y-3 text-base text-foreground mb-4">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Loss of profits, revenue, or business opportunities</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Loss of data or interruption of service</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Reputational damage or loss of goodwill</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Any damages arising from AI-generated content or decisions</span>
              </li>
            </ul>
            <p className="text-base text-foreground leading-relaxed">
              OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU HAVE PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM. SOME JURISDICTIONS DO NOT ALLOW EXCLUSION OF LIABILITY, SO THIS LIMITATION MAY NOT APPLY TO YOU.
            </p>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Disclaimer of Warranties</h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
            </p>
            <p className="text-base text-foreground leading-relaxed">
              AI-generated responses are provided on a best-effort basis. We do not guarantee the accuracy, completeness, or relevance of AI responses. You should review and validate all AI responses before relying on them for customer support.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Termination</h2>

            <h3 className="text-lg font-semibold mt-6 mb-3">Termination by You</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              You may terminate your account at any time by contacting our support team or through your account settings. Upon termination, we will delete your data according to our retention policies.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Termination by Us</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              We may terminate or suspend your account immediately, without prior notice or liability, if you:
            </p>
            <ul className="space-y-3 text-base text-foreground mb-4">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Violate these Terms or any applicable laws</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Engage in abusive, harassing, or illegal behavior</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Fail to pay invoices for 30 days or more</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Cause significant harm to our platform or other users</span>
              </li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Effect of Termination</h3>
            <p className="text-base text-foreground leading-relaxed mb-4">
              Upon termination, your access to the service will immediately cease. Your data may be deleted according to our Privacy Policy and data retention schedule.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to Terms</h2>
            <p className="text-base text-foreground leading-relaxed">
              We may revise these Terms from time to time to reflect changes in our practices or to comply with applicable laws. Material changes will be communicated to you at least 30 days before they take effect. Your continued use of the service following publication of modified Terms constitutes your acceptance of the changes.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Governing Law & Jurisdiction</h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              These Terms and Conditions are governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. You agree to submit to the exclusive jurisdiction of the courts located in India for resolution of any disputes.
            </p>
            <p className="text-base text-foreground leading-relaxed">
              If you are located in the EU, you may also have rights under the laws of your member state that cannot be waived by these Terms.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Dispute Resolution</h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              Before pursuing legal action, you agree to attempt to resolve any disputes through good-faith negotiation with our support team. If negotiation fails, disputes may be resolved through binding arbitration as permitted by applicable law.
            </p>
          </section>

          {/* Entire Agreement */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Entire Agreement</h2>
            <p className="text-base text-foreground leading-relaxed">
              These Terms, together with our Privacy Policy, form the entire agreement between you and SupportAI regarding your use of the service and supersede all prior and contemporaneous agreements, whether written or oral.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact Us</h2>
            <p className="text-base text-foreground leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p><strong>Email:</strong> support@supportai.example.com</p>
              <p><strong>Service:</strong> SupportAI - AI-Powered Customer Support Platform</p>
            </div>
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
