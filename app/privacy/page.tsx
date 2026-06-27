'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0B0D10]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-[#F5F7FA] transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Cadent
        </Link>

        <h1 className="text-3xl font-bold text-[#F5F7FA] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#6B7280] mb-8">Last updated: June 2026</p>

        {/* Table of Contents */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-[#9CA3AF] mb-3">Contents</h2>
          <ul className="space-y-1.5 text-sm">
            <li><a href="#overview" className="text-[#22D3EE] hover:underline">Overview</a></li>
            <li><a href="#info-collect" className="text-[#22D3EE] hover:underline">Information We Collect</a></li>
            <li><a href="#how-use" className="text-[#22D3EE] hover:underline">How We Use Your Information</a></li>
            <li><a href="#sharing" className="text-[#22D3EE] hover:underline">Information Sharing</a></li>
            <li><a href="#coppa" className="text-[#22D3EE] hover:underline">Children&apos;s Privacy (COPPA)</a></li>
            <li><a href="#data-retention" className="text-[#22D3EE] hover:underline">Data Retention and Deletion</a></li>
            <li><a href="#security" className="text-[#22D3EE] hover:underline">Data Security</a></li>
            <li><a href="#cookies" className="text-[#22D3EE] hover:underline">Cookies and Tracking</a></li>
            <li><a href="#rights" className="text-[#22D3EE] hover:underline">Your Rights</a></li>
            <li><a href="#changes" className="text-[#22D3EE] hover:underline">Changes to This Policy</a></li>
            <li><a href="#contact" className="text-[#22D3EE] hover:underline">Contact Us</a></li>
          </ul>
        </div>

        <div className="space-y-8 text-sm text-[#9CA3AF] leading-relaxed">
          <section id="overview">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Overview</h2>
            <p>Cadent (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the website and mobile application at cadent.online (the &quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. By using Cadent, you agree to the collection and use of information in accordance with this policy.</p>
          </section>

          <section id="info-collect">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Information We Collect</h2>
            <h3 className="text-sm font-semibold text-[#9CA3AF] mb-2">Account Information</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-[#F5F7FA]">Email address</span> — used for authentication and account recovery</li>
              <li><span className="text-[#F5F7FA]">Display name</span> — the name visible to others on the leader board (filtered for profanity)</li>
              <li><span className="text-[#F5F7FA]">Instrument</span> — optional, shown on your profile and leader board</li>
              <li><span className="text-[#F5F7FA]">Account type</span> — student or teacher</li>
            </ul>

            <h3 className="text-sm font-semibold text-[#9CA3AF] mb-2 mt-4">Practice Data</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-[#F5F7FA]">Practice sessions</span> — duration, song name, optional notes, timestamp</li>
              <li><span className="text-[#F5F7FA]">Streak data</span> — consecutive practice days and current multiplier</li>
              <li><span className="text-[#F5F7FA]">Points earned</span> — calculated from practice time and streak multipliers</li>
              <li><span className="text-[#F5F7FA]">Leader board visibility preference</span> — whether you appear on the student leader board</li>
            </ul>

            <h3 className="text-sm font-semibold text-[#9CA3AF] mb-2 mt-4">Child-Specific Data (Under 13)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-[#F5F7FA]">Parent/guardian email</span> — collected only for students under 13, used solely for consent verification</li>
              <li><span className="text-[#F5F7FA]">Consent token</span> — a one-time UUID link shared manually by the student with their parent. This token is deleted after the parent approves or denies consent.</li>
              <li><span className="text-[#F5F7FA]">Consent status</span> — tracks whether parental consent has been granted, denied, or is pending</li>
            </ul>

            <h3 className="text-sm font-semibold text-[#9CA3AF] mb-2 mt-4">Payment Information</h3>
            <p>Subscription payments are processed through <span className="text-[#F5F7FA]">Stripe</span>. Cadent does not store credit card numbers, bank details, or full payment information on our servers. Stripe provides us with a tokenized customer ID and subscription status only.</p>

            <h3 className="text-sm font-semibold text-[#9CA3AF] mb-2 mt-4">Technical Data</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Browser type, operating system, and device identifiers (collected by Supabase Auth)</li>
              <li>IP address (used for security and fraud prevention)</li>
              <li>App usage patterns (pages visited, features used)</li>
            </ul>
          </section>

          <section id="how-use">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-[#F5F7FA]">Provide the Service</span> — authenticate your account, store practice data, calculate streaks and points</li>
              <li><span className="text-[#F5F7FA]">Share with teachers</span> — when you generate a share link, your teacher can view your practice history, streaks, and points for the purposes of music instruction</li>
              <li><span className="text-[#F5F7FA]">Leader board display</span> — your display name, instrument, points, and streak appear on the leader board unless you opt out</li>
              <li><span className="text-[#F5F7FA]">Process payments</span> — handle subscription billing through Stripe</li>
              <li><span className="text-[#F5F7FA]">Communicate with you</span> — account verification, password reset, service announcements</li>
              <li><span className="text-[#F5F7FA]">COPPA compliance</span> — verify parental consent before collecting data from children under 13</li>
            </ul>
          </section>

          <section id="sharing">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Information Sharing</h2>
            <p>We do <span className="text-[#F5F7FA]">not</span> sell, rent, or trade your personal information to third parties. We share data only in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li><span className="text-[#F5F7FA]">Supabase</span> — our database and authentication provider (hosted in the United States). Supabase processes and stores your data on our behalf under a Data Processing Agreement.</li>
              <li><span className="text-[#F5F7FA]">Stripe</span> — our payment processor (United States). Stripe handles all payment card data directly. We receive only a tokenized customer ID and subscription status.</li>
              <li><span className="text-[#F5F7FA]">Teacher sharing</span> — when you explicitly share your profile with a teacher via a share link, that teacher can view your practice data, streaks, and points. You can revoke access at any time.</li>
              <li><span className="text-[#F5F7FA]">Legal requirements</span> — we may disclose information if required by law, subpoena, or other legal process.</li>
            </ul>
            <p className="mt-3">We do <span className="text-[#F5F7FA]">not</span> use your data for advertising. Cadent has no ads, no ad networks, and no third-party tracking for advertising purposes.</p>
          </section>

          <section id="coppa">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Children&apos;s Privacy (COPPA)</h2>
            <p>Cadent is designed for music students, including those under 13. We comply with the Children&apos;s Online Privacy Protection Act (COPPA) and the 2025 COPPA Final Rule:</p>
            <ul className="list-disc pl-5 space-y-1 mt-3">
              <li><span className="text-[#F5F7FA]">Age gate</span> — during sign-up, we ask whether the user is 13 or older. Users under 13 are directed to the parental consent flow before their account is fully activated.</li>
              <li><span className="text-[#F5F7FA]">Parental consent</span> — we require verifiable parental consent before collecting personal information from children under 13. Our consent flow uses a one-time UUID token link that the student shares with their parent. The parent reviews what data is collected and approves or denies consent.</li>
              <li><span className="text-[#F5F7FA]">No email required for consent</span> — the consent link is generated by the student and shared manually with their parent (text, email, or in person). We do not send emails to parents as part of the consent process.</li>
              <li><span className="text-[#F5F7FA]">Consent token deletion</span> — the UUID consent token is deleted immediately after the parent approves or denies consent. It cannot be reused.</li>
              <li><span className="text-[#F5F7FA]">Feature gating</span> — students with pending or denied consent have restricted access to social features (leader board, sharing). Full access is restored after parental approval.</li>
              <li><span className="text-[#F5F7FA]">No voice or biometric data</span> — Cadent does not collect, store, or process voice recordings, photographs, or biometric data from any user.</li>
              <li><span className="text-[#F5F7FA]">Data minimization</span> — we collect only the data necessary to provide the Service and nothing more.</li>
            </ul>
            <p className="mt-3">Parents may review, modify, or delete their child&apos;s information at any time by contacting us at <a href="mailto:privacy@cadent.online" className="text-[#22D3EE] hover:underline">privacy@cadent.online</a>.</p>
          </section>

          <section id="data-retention">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Data Retention and Deletion</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>We retain your account data for as long as your account is active.</li>
              <li>You may request account deletion at any time by contacting <a href="mailto:privacy@cadent.online" className="text-[#22D3EE] hover:underline">privacy@cadent.online</a>.</li>
              <li>Upon account deletion, we remove your profile, practice sessions, songs, and share links from our database within 30 days.</li>
              <li>Anonymized, aggregate data (e.g., total practice minutes across all users) may be retained for analytics purposes and cannot be linked back to you.</li>
            </ul>
          </section>

          <section id="security">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Data Security</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="text-[#F5F7FA]">Encryption in transit</span> — all data is transmitted over HTTPS/TLS</li>
              <li><span className="text-[#F5F7FA]">Encryption at rest</span> — Supabase encrypts all stored data using AES-256</li>
              <li><span className="text-[#F5F7FA]">Authentication</span> — passwords are hashed and never stored in plaintext</li>
              <li><span className="text-[#F5F7FA]">Row-level security</span> — database policies ensure users can only access their own data unless sharing is explicitly enabled</li>
            </ul>
            <p className="mt-3">No method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>
          </section>

          <section id="cookies">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Cookies and Tracking</h2>
            <p>Cadent uses minimal cookies necessary for the Service to function:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><span className="text-[#F5F7FA]">Authentication cookies</span> — required to keep you logged in (set by Supabase Auth)</li>
              <li><span className="text-[#F5F7FA]">Service worker cache</span> — stores app shell files for offline use (PWA functionality)</li>
            </ul>
            <p className="mt-3">We do <span className="text-[#F5F7FA]">not</span> use advertising cookies, tracking pixels, or third-party analytics cookies.</p>
          </section>

          <section id="rights">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><span className="text-[#F5F7FA]">Access</span> — request a copy of your personal data</li>
              <li><span className="text-[#F5F7FA]">Correct</span> — update inaccurate information in your profile</li>
              <li><span className="text-[#F5F7FA]">Delete</span> — request full account and data deletion</li>
              <li><span className="text-[#F5F7FA]">Opt out</span> — hide your profile from the leader board at any time via the visibility toggle</li>
              <li><span className="text-[#F5F7FA]">Revoke consent</span> — parents can deny or revoke consent for a child under 13 at any time</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:privacy@cadent.online" className="text-[#22D3EE] hover:underline">privacy@cadent.online</a>.</p>
          </section>

          <section id="changes">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email (for account holders) or by posting a notice on our website at least 30 days before the changes take effect. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section id="contact">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our data practices, please contact:</p>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mt-3">
              <p className="text-[#F5F7FA]">Cadent Privacy</p>
              <p>Email: <a href="mailto:privacy@cadent.online" className="text-[#22D3EE] hover:underline">privacy@cadent.online</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}