'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#0B0D10]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-[#9CA3AF] hover:text-[#F5F7FA] transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Cadent
        </Link>

        <h1 className="text-3xl font-bold text-[#F5F7FA] mb-2">Terms of Service</h1>
        <p className="text-sm text-[#6B7280] mb-8">Last updated: June 2026</p>

        {/* Table of Contents */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-[#9CA3AF] mb-3">Contents</h2>
          <ul className="space-y-1.5 text-sm">
            <li><a href="#acceptance" className="text-[#22D3EE] hover:underline">Acceptance of Terms</a></li>
            <li><a href="#accounts" className="text-[#22D3EE] hover:underline">Accounts and Eligibility</a></li>
            <li><a href="#use" className="text-[#22D3EE] hover:underline">Acceptable Use</a></li>
            <li><a href="#prohibited" className="text-[#22D3EE] hover:underline">Prohibited Conduct</a></li>
            <li><a href="#subscriptions" className="text-[#22D3EE] hover:underline">Subscriptions and Billing</a></li>
            <li><a href="#content" className="text-[#22D3EE] hover:underline">User Content</a></li>
            <li><a href="#ip" className="text-[#22D3EE] hover:underline">Intellectual Property</a></li>
            <li><a href="#disclaimer" className="text-[#22D3EE] hover:underline">Disclaimer of Warranties</a></li>
            <li><a href="#liability" className="text-[#22D3EE] hover:underline">Limitation of Liability</a></li>
            <li><a href="#termination" className="text-[#22D3EE] hover:underline">Termination</a></li>
            <li><a href="#changes" className="text-[#22D3EE] hover:underline">Changes to These Terms</a></li>
            <li><a href="#contact" className="text-[#22D3EE] hover:underline">Contact Us</a></li>
          </ul>
        </div>

        <div className="space-y-8 text-sm text-[#9CA3AF] leading-relaxed">
          <section id="acceptance">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Acceptance of Terms</h2>
            <p>By accessing or using Cadent (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. If you are under 13 years of age, your parent or legal guardian must consent to these terms on your behalf before you create an account.</p>
          </section>

          <section id="accounts">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Accounts and Eligibility</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You must provide a valid email address to create an account.</li>
              <li>Users under 13 must have verifiable parental consent before creating an account, in compliance with COPPA. Our sign-up process includes an age gate and parental consent flow.</li>
              <li>Users 13 years of age or older may create their own account without parental consent.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must be at least 7 years old to use the Service. Users between 7 and 12 require parental consent.</li>
              <li>You may not create multiple accounts for the purpose of manipulating the point system or leader board.</li>
            </ul>
          </section>

          <section id="use">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Acceptable Use</h2>
            <p>Cadent is a music practice tracking application. You may use the Service to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Track your practice sessions (duration, songs, notes)</li>
              <li>View your practice streaks, points, and analytics</li>
              <li>Share your practice data with a music teacher via a share link</li>
              <li>View the leader board (with the option to opt out)</li>
              <li>Receive and complete assignments from your teacher</li>
              <li>Subscribe to premium features as available</li>
            </ul>
          </section>

          <section id="prohibited">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Reverse engineer, decompile, or disassemble the Service or its underlying technology</li>
              <li>Spam, overload, or attempt to disrupt the Service&apos;s infrastructure or APIs</li>
              <li>Create fake or fraudulent accounts</li>
              <li>Exploit or manipulate the point system, streak calculations, or leader board (e.g., running the timer without actually practicing)</li>
              <li>Use the Service for any purpose that is unlawful or prohibited by these terms</li>
              <li>Attempt to gain unauthorized access to another user&apos;s account or data</li>
              <li>Upload content that is offensive, abusive, or violates any applicable law</li>
              <li>Share your account credentials with others</li>
              <li>Use automated tools (bots, scripts) to interact with the Service</li>
            </ul>
            <p className="mt-3">We reserve the right to suspend or terminate accounts that violate these prohibitions, including removing ill-gotten points or resetting manipulated streaks.</p>
          </section>

          <section id="subscriptions">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Subscriptions and Billing</h2>
            <p>Cadent offers the following subscription plans:</p>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mt-3 mb-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[#F5F7FA] font-semibold">Student Premium</p>
                  <p className="text-xs text-[#6B7280]">$3.99/month or $29.99/year</p>
                  <p className="text-xs text-[#6B7280] mt-1">Unlimited teacher sharing, full analytics, practice reminders, data export</p>
                </div>
                <div>
                  <p className="text-[#F5F7FA] font-semibold">Teacher</p>
                  <p className="text-xs text-[#6B7280]">$9.99/month or $79.99/year</p>
                  <p className="text-xs text-[#6B7280] mt-1">Dashboard for all students, assignment creation, progress reports, studio management</p>
                </div>
              </div>
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>All prices are in USD and include applicable taxes unless stated otherwise.</li>
              <li>Subscriptions renew automatically at the end of each billing period (monthly or annually).</li>
              <li>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No partial refunds are provided for unused portions of a billing period.</li>
              <li>Payments are processed by Stripe. Cadent does not store your credit card information.</li>
              <li>We reserve the right to change pricing with 30 days&apos; advance notice via email.</li>
              <li>Free tier features remain available without a subscription.</li>
            </ul>
          </section>

          <section id="content">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">User Content</h2>
            <p>You retain ownership of any content you create or submit to Cadent, including practice notes, song titles, and display names.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>You grant Cadent a limited license to store, display, and process your content solely for the purpose of providing the Service.</li>
              <li>You are responsible for ensuring that your content does not violate applicable laws or the rights of others.</li>
              <li>We may remove or filter content that violates our guidelines, including display names that contain profanity (filtered automatically) or content reported by other users.</li>
              <li>Practice notes are private and visible only to you and your teacher (if you have shared your profile). They are never shown on the leader board.</li>
            </ul>
          </section>

          <section id="ip">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Intellectual Property</h2>
            <p>The Cadent name, logo, and Service design are owned by Cadent and protected by applicable intellectual property laws. You may not use our trademarks, logos, or branding without written permission.</p>
          </section>

          <section id="disclaimer">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Disclaimer of Warranties</h2>
            <p>The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. We do not guarantee that:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>The Service will be uninterrupted, timely, secure, or error-free</li>
              <li>The results obtained from the Service will be accurate or reliable</li>
              <li>Any errors in the Service will be corrected</li>
            </ul>
            <p className="mt-3">Your use of the Service is at your sole risk.</p>
          </section>

          <section id="liability">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Cadent and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability to you for any claim arising from these terms or the Service shall not exceed the total amount you paid to Cadent in the twelve (12) months preceding the claim.</p>
          </section>

          <section id="termination">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Termination</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>You may delete your account at any time by contacting <a href="mailto:support@cadent.online" className="text-[#22D3EE] hover:underline">support@cadent.online</a>.</li>
              <li>We may suspend or terminate your account for violation of these terms, with or without notice.</li>
              <li>Upon termination, your right to use the Service ceases immediately.</li>
              <li>Provisions that by their nature should survive termination (disclaimers, liability limits, IP rights) remain in effect.</li>
            </ul>
          </section>

          <section id="changes">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Changes to These Terms</h2>
            <p>We may update these Terms of Service from time to time. If we make material changes, we will provide notice by emailing registered users at least 30 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the revised terms.</p>
          </section>

          <section id="contact">
            <h2 className="text-lg font-semibold text-[#F5F7FA] mb-3">Contact Us</h2>
            <p>If you have questions about these Terms of Service, please contact:</p>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mt-3">
              <p className="text-[#F5F7FA]">Cadent Support</p>
              <p>Email: <a href="mailto:support@cadent.online" className="text-[#22D3EE] hover:underline">support@cadent.online</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}