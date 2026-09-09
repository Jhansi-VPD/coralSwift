import React from 'react';
import { Metadata } from 'next';
import { Badge } from '@/components/ui/Badge';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | CoralSwift Technologies',
  description: 'CoralSwift Privacy Policy governing data collection, consultation inquiries, candidate applications, and GDPR/CCPA compliance.'
};

export default function PrivacyPage() {
  return (
    <div className="pt-28 pb-24 bg-enterprise-canvas min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 border-b border-slate-200 mb-8 bg-white rounded-3xl p-8 shadow-sm">
          <Badge variant="coral" className="mb-3 font-semibold">
            Legal & Compliance
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] font-display mb-2">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-slate-500">
            Last Updated: September 8, 2026 • Version 1.0
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-slate-600 text-sm space-y-6 leading-relaxed shadow-sm">
          <section>
            <h2 className="text-lg font-bold text-[#0B1426] font-display mb-2">1. Overview & Commitment</h2>
            <p>
              CoralSwift Technologies Inc. (&quot;CoralSwift&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting the privacy and security of your personal and business data. This Privacy Policy outlines our practices regarding information collected through coralswift.com, including consultation inquiries, career applications, and administrative communications.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B1426] font-display mb-2">2. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600">
              <li><strong className="text-slate-900">Consultation Enquiries:</strong> Full name, corporate email address, company name, telephone number, service interests, and project requirement details.</li>
              <li><strong className="text-slate-900">Job Applications:</strong> Candidate name, contact details, resume/CV files, portfolio links, LinkedIn profile URLs, and employment history.</li>
              <li><strong className="text-slate-900">Technical & Analytical Data:</strong> Anonymized server logs, browser user-agent data, and referrers for site security and DDoS prevention.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B1426] font-display mb-2">3. How We Use Your Data</h2>
            <p>
              We process collected information solely to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600">
              <li>Respond to business consultation requests and prepare engineering proposals.</li>
              <li>Evaluate candidate qualifications for active engineering and architecture job openings.</li>
              <li>Maintain security, prevent abuse, and enforce administrative access boundaries.</li>
              <li>Comply with applicable legal, tax, and regulatory compliance standards.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B1426] font-display mb-2">4. Data Retention & Security Controls</h2>
            <p>
              All submitted enquiries and candidate records are stored in encrypted Supabase PostgreSQL databases. Access is strictly restricted to authorized CoralSwift personnel using multi-factor authentication. We never sell, rent, or lease personal or corporate information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B1426] font-display mb-2">5. Your Data Rights (GDPR & CCPA)</h2>
            <p>
              Depending on your jurisdiction, you have the right to request access to, rectification of, or deletion of your personal data. To exercise these rights, please contact our Data Governance team at <a href="mailto:privacy@coralswift.com" className="text-coral-600 underline font-medium">privacy@coralswift.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
