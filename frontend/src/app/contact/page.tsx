import React from 'react';
import { Metadata } from 'next';
import { ContactForm } from '@/components/forms/ContactForm';
import { 
  Mail, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Clock, 
  Lock, 
  Building2, 
  CheckCircle2 
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Contact Engineering Leadership | CoralSwift',
};
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ContactPage({
  searchParams,
}: {
  searchParams?: { service?: string };
}) {
  const initialService = searchParams?.service || '';

  return (
    <div className="pt-28 pb-24 bg-enterprise-canvas">
      {/* Page Header */}
      <section className="py-14 bg-white border-b border-slate-200/80 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <Badge variant="coral" className="mb-3 font-semibold">
              Direct Engineering Consultation
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0B1426] tracking-tight font-display mb-6">
              Discuss Your Enterprise{' '}
              <span className="text-gradient-coral">Architecture</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Connect directly with our staff and principal engineers. We conduct thorough architectural audits and engineer resilient systems tailored to your SLAs.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid: Form + Office & Security Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Form Column */}
          <div className="lg:col-span-7">
            <ContactForm initialService={initialService} sourcePage="/contact" />
          </div>

          {/* Info Column */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Direct Contact Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm space-y-6">
              <h3 className="text-lg font-extrabold text-[#0B1426] font-display">
                Corporate Headquarters
              </h3>

              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-coral-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-semibold">Corporate Office</strong>
                    <span>30 N Gould St Ste #62633<br />Sheridan, WY 82801<br />United States</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-coral-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-semibold">Electronic Inquiries</strong>
                    <a href="mailto:info@coralswift.com" className="text-coral-600 hover:underline font-medium">
                      info@coralswift.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-coral-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block font-semibold">Telephone</strong>
                    <a href="tel:+13072165154" className="text-coral-600 hover:underline font-medium">
                      +1 (307) 216-5154
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="w-4 h-4 text-coral-600" />
                  <span>SLA: Response guaranteed within 1 business day.</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Lock className="w-4 h-4 text-coral-600" />
                  <span>Mutual NDA executed prior to deep architectural audits.</span>
                </div>
              </div>
            </div>

            {/* What to Expect */}
            <div className="p-7 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 text-xs text-slate-700">
              <h4 className="font-mono text-slate-900 uppercase font-bold text-xs tracking-wider">
                What Happens Next?
              </h4>
              <ul className="space-y-2.5 list-disc list-inside text-slate-600 leading-relaxed">
                <li>Your request is routed directly to a Practice Lead (not a sales rep).</li>
                <li>We review your tech stack and schedule a 45-min technical discovery session.</li>
                <li>You receive a preliminary architectural RFC & scope estimate.</li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
