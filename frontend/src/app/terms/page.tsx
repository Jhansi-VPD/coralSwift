import React from 'react';
import { Metadata } from 'next';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Terms of Service | CoralSwift Technologies',
  description: 'CoralSwift Terms of Service governing website usage, software consultation services, and intellectual property.'
};

export default function TermsPage() {
  return (
    <div className="pt-28 pb-24 bg-enterprise-canvas min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 border-b border-slate-200 mb-8 bg-white rounded-3xl p-8 shadow-sm">
          <Badge variant="coral" className="mb-3 font-semibold">
            Legal & Compliance
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1426] font-display mb-2">
            Terms of Service
          </h1>
          <p className="text-xs font-mono text-slate-500">
            Last Updated: September 8, 2026 • Version 1.0
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 text-slate-600 text-sm space-y-6 leading-relaxed shadow-sm">
          <section>
            <h2 className="text-lg font-bold text-[#0B1426] font-display mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the website at coralswift.com (the &quot;Site&quot;), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the Site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B1426] font-display mb-2">2. Intellectual Property Rights</h2>
            <p>
              All content, trademarks, architecture diagrams, brand logos, code snippets, and case studies published on this Site are the proprietary property of CoralSwift Technologies Inc. or licensed client partners. Unauthorized reproduction, scraping, or distribution is prohibited without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B1426] font-display mb-2">3. Services & Engagement Scopes</h2>
            <p>
              Descriptions of software engineering, cloud modernization, and AI capabilities published on the Site represent general capabilities. Formal client engagements, deliverables, warranties, and SLAs are governed solely by separate Master Services Agreements (MSAs) and Statements of Work (SOWs).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B1426] font-display mb-2">4. Disclaimers & Limitation of Liability</h2>
            <p>
              The Site and its contents are provided &quot;as is&quot; without warranties of any kind. In no event shall CoralSwift Technologies Inc. be liable for any direct, indirect, incidental, or consequential damages arising from website use or temporary unavailability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#0B1426] font-display mb-2">5. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law principles.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
