import Link from "next/link";

export const metadata = {
  title: "Terms of Service - sekpriAI",
  description: "Terms of Service for sekpriAI - AI-powered email secretary",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="sekpriAI" className="h-8 w-auto object-contain" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-white/50 mb-8">Last updated: May 15, 2026</p>

        <div className="prose prose-invert prose-lg max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-white/70 leading-relaxed">
              By accessing or using sekpriAI (&quot;Service&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service.
            </p>
            <p className="text-white/70 leading-relaxed mt-4">
              We reserve the right to modify these Terms at any time. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Description of Service */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-white/70 leading-relaxed">
              sekpriAI is an AI-powered email management platform that provides:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Unified inbox for multiple email accounts (Gmail, Office 365, IMAP)</li>
              <li>AI-powered email summarization, prioritization, and classification</li>
              <li>AI-generated draft replies (subject to your approval)</li>
              <li>Memory extraction and context management</li>
              <li>Channel integrations (Telegram, WhatsApp)</li>
              <li>Email scheduling and automation</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              The Service is provided as a Progressive Web App (PWA) accessible via web browsers.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-[#c9a96e]">3.1 Eligibility</h3>
            <p className="text-white/70 leading-relaxed">
              You must be at least 13 years old to use the Service. By creating an account, you represent that you meet this age requirement.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">3.2 Account Security</h3>
            <p className="text-white/70 leading-relaxed">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">3.3 Account Termination</h3>
            <p className="text-white/70 leading-relaxed">
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, abusive, or illegal activity.
            </p>
          </section>

          {/* Email Access and Permissions */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Email Access and Permissions</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-[#c9a96e]">4.1 OAuth Authorization</h3>
            <p className="text-white/70 leading-relaxed">
              When you connect an email account, you grant us permission to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Read your email messages and metadata</li>
              <li>Send emails on your behalf (only with your explicit approval)</li>
              <li>Modify email labels and read status</li>
              <li>Access attachments for RAG (Retrieval-Augmented Generation) features</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">4.2 Revocation</h3>
            <p className="text-white/70 leading-relaxed">
              You can revoke access at any time by:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Disconnecting the email account in your settings</li>
              <li>Revoking OAuth permissions in your email provider&apos;s security settings</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">4.3 Data Processing</h3>
            <p className="text-white/70 leading-relaxed">
              We process your email data solely to provide the Service. We do not:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Sell your email data to third parties</li>
              <li>Use your email data for advertising</li>
              <li>Share your email data except as described in our Privacy Policy</li>
            </ul>
          </section>

          {/* AI Features */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. AI Features and Limitations</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-[#c9a96e]">5.1 AI-Generated Content</h3>
            <p className="text-white/70 leading-relaxed">
              Our AI features generate suggestions and drafts. You acknowledge that:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>AI-generated content may contain errors or inaccuracies</li>
              <li>You are responsible for reviewing all AI-generated content before use</li>
              <li>We are not liable for consequences of using AI-generated content</li>
              <li>AI never sends emails without your explicit approval</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">5.2 Human-in-the-Loop</h3>
            <p className="text-white/70 leading-relaxed">
              All sensitive actions require your approval:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Sending emails</li>
              <li>Activating extracted memories</li>
              <li>Scheduling automated sends</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">5.3 No Warranty</h3>
            <p className="text-white/70 leading-relaxed">
              AI features are provided &quot;as is&quot; without warranty of any kind. We do not guarantee accuracy, completeness, or reliability of AI-generated content.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use Policy</h2>
            <p className="text-white/70 leading-relaxed">
              You agree NOT to use the Service to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Send spam, unsolicited emails, or bulk commercial messages</li>
              <li>Engage in phishing, fraud, or identity theft</li>
              <li>Distribute malware, viruses, or harmful code</li>
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Harass, threaten, or abuse others</li>
              <li>Attempt to gain unauthorized access to systems or data</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use the Service for any illegal or unauthorized purpose</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-[#c9a96e]">7.1 Our Rights</h3>
            <p className="text-white/70 leading-relaxed">
              The Service, including its design, code, features, and branding, is owned by us and protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">7.2 Your Content</h3>
            <p className="text-white/70 leading-relaxed">
              You retain all rights to your email data and content. By using the Service, you grant us a limited license to process your content solely to provide the Service.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">7.3 Feedback</h3>
            <p className="text-white/70 leading-relaxed">
              If you provide feedback or suggestions, we may use them without obligation or compensation to you.
            </p>
          </section>

          {/* Payment and Billing */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Payment and Billing</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-[#c9a96e]">8.1 Free Tier</h3>
            <p className="text-white/70 leading-relaxed">
              We currently offer the Service free of charge. We reserve the right to introduce paid plans in the future.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">8.2 Future Pricing</h3>
            <p className="text-white/70 leading-relaxed">
              If we introduce paid plans, we will:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Provide advance notice</li>
              <li>Allow you to opt-in to paid features</li>
              <li>Continue to offer a free tier with basic features</li>
            </ul>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimers and Limitations of Liability</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-[#c9a96e]">9.1 Service Availability</h3>
            <p className="text-white/70 leading-relaxed">
              The Service is provided &quot;as is&quot; and &quot;as available.&quot; We do not guarantee:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Uninterrupted or error-free operation</li>
              <li>Availability at all times</li>
              <li>Compatibility with all devices or browsers</li>
              <li>Accuracy of AI-generated content</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">9.2 Limitation of Liability</h3>
            <p className="text-white/70 leading-relaxed">
              To the maximum extent permitted by law, we are not liable for:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of data, profits, or business opportunities</li>
              <li>Damages resulting from use or inability to use the Service</li>
              <li>Damages from AI-generated content or automated actions</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">9.3 Third-Party Services</h3>
            <p className="text-white/70 leading-relaxed">
              We are not responsible for:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Email provider outages or issues</li>
              <li>AI provider limitations or errors</li>
              <li>Third-party integrations (Telegram, etc.)</li>
            </ul>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
            <p className="text-white/70 leading-relaxed">
              You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any laws or third-party rights</li>
              <li>Content you send or actions you take using the Service</li>
            </ul>
          </section>

          {/* Data Backup */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Data Backup and Loss</h2>
            <p className="text-white/70 leading-relaxed">
              You are responsible for maintaining backups of your important data. We are not liable for any data loss, including:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Accidental deletion</li>
              <li>Service outages or technical failures</li>
              <li>Account termination</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              Your email data remains in your email provider&apos;s servers. We only sync and cache data for display purposes.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-[#c9a96e]">12.1 By You</h3>
            <p className="text-white/70 leading-relaxed">
              You may terminate your account at any time by:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Deleting your account in settings</li>
              <li>Contacting us to request account deletion</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">12.2 By Us</h3>
            <p className="text-white/70 leading-relaxed">
              We may suspend or terminate your account if:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>You violate these Terms</li>
              <li>You engage in fraudulent or illegal activity</li>
              <li>Your account is inactive for an extended period</li>
              <li>We discontinue the Service</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">12.3 Effect of Termination</h3>
            <p className="text-white/70 leading-relaxed">
              Upon termination:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Your access to the Service will be revoked</li>
              <li>Your data will be deleted according to our Privacy Policy</li>
              <li>OAuth tokens will be revoked</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law and Disputes</h2>
            <p className="text-white/70 leading-relaxed">
              These Terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved through:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Good faith negotiation</li>
              <li>Mediation (if negotiation fails)</li>
              <li>Binding arbitration or courts in [Your Jurisdiction]</li>
            </ul>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">14. Changes to Terms</h2>
            <p className="text-white/70 leading-relaxed">
              We may update these Terms at any time. We will notify you by:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Posting the updated Terms on this page</li>
              <li>Updating the &quot;Last updated&quot; date</li>
              <li>Sending an email notification (for material changes)</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              Your continued use after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">15. Severability</h2>
            <p className="text-white/70 leading-relaxed">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
            </p>
          </section>

          {/* Entire Agreement */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">16. Entire Agreement</h2>
            <p className="text-white/70 leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding the Service.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">17. Contact Us</h2>
            <p className="text-white/70 leading-relaxed">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="mt-4 p-6 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/70">
                <strong>Email:</strong> legal@sekpriai.com
              </p>
              <p className="text-white/70 mt-2">
                <strong>Website:</strong>{" "}
                <Link href="/" className="text-[#c9a96e] hover:underline">
                  https://sekpri-ai-pi.vercel.app
                </Link>
              </p>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="mt-12 p-6 bg-[#c9a96e]/10 rounded-lg border border-[#c9a96e]/20">
            <h2 className="text-xl font-semibold mb-3">Acknowledgment</h2>
            <p className="text-white/70 leading-relaxed">
              By using sekpriAI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-white/10 flex gap-6 text-sm">
          <Link href="/" className="text-white/50 hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/terms" className="text-[#c9a96e]">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-white/50 hover:text-white transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
