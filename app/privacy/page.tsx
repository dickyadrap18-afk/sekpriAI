import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - sekpriAI",
  description: "Privacy Policy for sekpriAI - AI-powered email secretary",
};

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/50 mb-8">Last updated: May 15, 2026</p>

        <div className="prose prose-invert prose-lg max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-white/70 leading-relaxed">
              Welcome to sekpriAI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered email secretary service.
            </p>
            <p className="text-white/70 leading-relaxed mt-4">
              By using sekpriAI, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-[#c9a96e]">2.1 Account Information</h3>
            <p className="text-white/70 leading-relaxed">
              When you create an account, we collect:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Email address</li>
              <li>Password (encrypted)</li>
              <li>Display name (if provided via OAuth)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">2.2 Email Data</h3>
            <p className="text-white/70 leading-relaxed">
              When you connect your email accounts, we access and process:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Email messages (sender, subject, body, attachments)</li>
              <li>Email metadata (date, labels, read status)</li>
              <li>Contact information from your emails</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">2.3 OAuth Tokens</h3>
            <p className="text-white/70 leading-relaxed">
              We store encrypted OAuth tokens to access your email accounts:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Gmail OAuth tokens (if you connect Gmail)</li>
              <li>Microsoft OAuth tokens (if you connect Office 365)</li>
              <li>All tokens are encrypted using AES-256-GCM</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">2.4 Usage Data</h3>
            <p className="text-white/70 leading-relaxed">
              We collect information about how you use our service:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Feature usage patterns</li>
              <li>AI interactions and commands</li>
              <li>Error logs and diagnostics</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-white/70 leading-relaxed">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong>Provide email management services</strong> - Display, organize, and manage your emails</li>
              <li><strong>AI features</strong> - Summarize emails, classify priority, draft replies, extract insights</li>
              <li><strong>Notifications</strong> - Send alerts via Telegram or other channels you configure</li>
              <li><strong>Improve our service</strong> - Analyze usage patterns to enhance features</li>
              <li><strong>Security</strong> - Detect and prevent fraud, abuse, and security incidents</li>
              <li><strong>Compliance</strong> - Meet legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          {/* AI Processing */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. AI Processing</h2>
            <p className="text-white/70 leading-relaxed">
              Our AI features process your email content to provide intelligent assistance:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong>Email summarization</strong> - We send email content to AI providers (Claude, OpenAI, Gemini, or DeepSeek) to generate summaries</li>
              <li><strong>Priority classification</strong> - AI analyzes email metadata to determine urgency</li>
              <li><strong>Draft replies</strong> - AI generates reply suggestions based on email context</li>
              <li><strong>Memory extraction</strong> - AI identifies key facts, deadlines, and preferences (requires your approval)</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              <strong>Important:</strong> AI never sends emails without your explicit approval. All AI-generated content is reviewed by you before any action is taken.
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-[#c9a96e]">5.1 Third-Party Services</h3>
            <p className="text-white/70 leading-relaxed">
              We share data with the following service providers:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong>Supabase</strong> - Database and authentication (data stored in secure cloud infrastructure)</li>
              <li><strong>AI Providers</strong> - Claude (Anthropic), OpenAI, Google Gemini, or DeepSeek for AI features</li>
              <li><strong>Email Providers</strong> - Gmail, Microsoft, or your IMAP provider to access your emails</li>
              <li><strong>Vercel</strong> - Hosting and serverless functions</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">5.2 We Do NOT Share</h3>
            <p className="text-white/70 leading-relaxed">
              We do not sell, rent, or share your personal data with:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Advertisers or marketing companies</li>
              <li>Data brokers</li>
              <li>Any third party for their own marketing purposes</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-[#c9a96e]">5.3 Legal Requirements</h3>
            <p className="text-white/70 leading-relaxed">
              We may disclose your information if required by law or to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Comply with legal obligations</li>
              <li>Protect our rights and property</li>
              <li>Prevent fraud or security threats</li>
              <li>Protect the safety of our users</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-white/70 leading-relaxed">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong>Encryption at rest</strong> - All OAuth tokens encrypted with AES-256-GCM</li>
              <li><strong>Encryption in transit</strong> - HTTPS/TLS for all data transmission</li>
              <li><strong>Row Level Security</strong> - Database access restricted to your own data</li>
              <li><strong>Secure authentication</strong> - Supabase Auth with OAuth 2.0</li>
              <li><strong>Regular security audits</strong> - Continuous monitoring and updates</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-white/70 leading-relaxed">
              We retain your data as follows:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong>Account data</strong> - Until you delete your account</li>
              <li><strong>Email data</strong> - Synced from your email provider; deleted when you disconnect the account</li>
              <li><strong>AI-generated content</strong> - Stored until you delete it or your account</li>
              <li><strong>Logs</strong> - Retained for 90 days for security and debugging purposes</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
            <p className="text-white/70 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li><strong>Access</strong> - Request a copy of your personal data</li>
              <li><strong>Correction</strong> - Update or correct your information</li>
              <li><strong>Deletion</strong> - Delete your account and all associated data</li>
              <li><strong>Portability</strong> - Export your data in a machine-readable format</li>
              <li><strong>Revoke access</strong> - Disconnect email accounts at any time</li>
              <li><strong>Opt-out</strong> - Disable AI features or specific processing</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              To exercise these rights, contact us or use the settings page in your account.
            </p>
          </section>

          {/* Google API Disclosure */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Google API Services User Data Policy</h2>
            <p className="text-white/70 leading-relaxed">
              sekpriAI&apos;s use and transfer of information received from Google APIs adheres to the{" "}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#c9a96e] hover:underline"
              >
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
            <p className="text-white/70 leading-relaxed mt-4">
              Specifically:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>We only request the minimum Gmail API scopes necessary for our features</li>
              <li>We do not use Gmail data for advertising purposes</li>
              <li>We do not allow humans to read your Gmail data except for security, compliance, or with your explicit consent</li>
              <li>We do not transfer Gmail data to third parties except as necessary to provide our service</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
            <p className="text-white/70 leading-relaxed">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          {/* International Users */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
            <p className="text-white/70 leading-relaxed">
              Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-white/70 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by:
            </p>
            <ul className="list-disc list-inside text-white/70 space-y-2 ml-4">
              <li>Posting the new Privacy Policy on this page</li>
              <li>Updating the &quot;Last updated&quot; date</li>
              <li>Sending you an email notification (for material changes)</li>
            </ul>
            <p className="text-white/70 leading-relaxed mt-4">
              Your continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
            <p className="text-white/70 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-4 p-6 bg-white/5 rounded-lg border border-white/10">
              <p className="text-white/70">
                <strong>Email:</strong> privacy@sekpriai.com
              </p>
              <p className="text-white/70 mt-2">
                <strong>Website:</strong>{" "}
                <Link href="/" className="text-[#c9a96e] hover:underline">
                  https://sekpri-ai-pi.vercel.app
                </Link>
              </p>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-white/10 flex gap-6 text-sm">
          <Link href="/" className="text-white/50 hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/terms" className="text-white/50 hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-[#c9a96e]">
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
