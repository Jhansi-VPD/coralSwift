import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, company, phone, service_interest, message, consent, source_page } = body;

    if (!full_name || !email || !company) {
      return NextResponse.json({ error: 'Missing required fields: full_name, email, company' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanService = (service_interest || '').trim().toLowerCase();
    const cleanMessage = (message || '').trim();

    // Use admin client if available (bypasses RLS to reliably check and insert), else standard Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    let client = createAdminClient();
    if (!client && supabaseUrl && anonKey && !supabaseUrl.includes('your-project')) {
      client = createClient(supabaseUrl, anonKey);
    }

    if (client) {
      // 1. Exact Duplicate Consultation Booking Check
      if (cleanMessage.includes('[Booked Consultation:')) {
        const { data: existing } = await client
          .from('enquiries')
          .select('id, email, service_interest, message')
          .ilike('email', cleanEmail);

        if (existing && existing.length > 0) {
          const exactDuplicate = existing.some((e: any) => {
            const existingService = (e.service_interest || '').trim().toLowerCase();
            const existingMsg = (e.message || '').trim();
            if (existingService !== cleanService) return false;

            // Extract Date and Slot if present
            const dateMatch = cleanMessage.match(/Date:\s*([^,\]]+)/);
            const slotMatch = cleanMessage.match(/Slot:\s*([^,\]]+)/);

            if (dateMatch && slotMatch) {
              const reqDate = dateMatch[1].trim();
              const reqSlot = slotMatch[1].trim();
              return existingMsg.includes(`Date: ${reqDate}`) && existingMsg.includes(`Slot: ${reqSlot}`);
            }

            return existingMsg === cleanMessage;
          });

          if (exactDuplicate) {
            return NextResponse.json(
              { error: 'A consultation request with this exact corporate email, service domain, date, and time slot has already been submitted.' },
              { status: 409 }
            );
          }
        }
      }

      // 2. Insert into Supabase DB
      const payload = {
        full_name,
        email: cleanEmail,
        company,
        phone: phone || null,
        service_interest: service_interest || 'General Enterprise Consultation',
        message: cleanMessage,
        consent: consent ?? true,
        source_page: source_page || '/contact',
        status: 'new',
      };

      const { data: result, error } = await client.from('enquiries').insert(payload).select().single();

      if (error) {
        if (error.code === '23505' || error.message?.includes('unique constraint') || error.message?.includes('enquiries_email_key')) {
          // If exact duplicate check didn't catch it but DB hit unique constraint
          return NextResponse.json(
            { error: 'A consultation request with this exact corporate email, service domain, date, and time slot has already been submitted.' },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: error.message || 'Failed to submit enquiry' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        id: result?.id || 'enq_' + Date.now(),
        message: 'Your consultation request has been received.'
      });
    }

    // Fallback if no database client available
    return NextResponse.json({
      success: true,
      id: 'enq_' + Date.now(),
      message: 'Your consultation request has been received.'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error processing enquiry' }, { status: 500 });
  }
}
