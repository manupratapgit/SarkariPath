import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; name?: string; preferences?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, name, preferences = [] } = body;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Check for existing subscriber
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, is_active")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (existing) {
    if (existing.is_active) {
      return NextResponse.json({ status: "already_subscribed" });
    }
    // Re-activate
    await supabase
      .from("subscriptions")
      .update({ is_active: true, name: name || null, preferences, subscribed_at: new Date().toISOString() })
      .eq("id", existing.id);
    return NextResponse.json({ status: "resubscribed" });
  }

  const { error: insertError } = await supabase.from("subscriptions").insert({
    email: email.toLowerCase().trim(),
    name: name || null,
    preferences,
    subscribed_at: new Date().toISOString(),
    is_active: true,
  });

  if (insertError) {
    console.error("Supabase insert error:", insertError);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }

  // Send welcome email
  try {
    const prefList = preferences.length
      ? preferences.join(", ")
      : "all government jobs";

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "SarkariPath <onboarding@resend.dev>",
      to: email,
      subject: "Welcome to SarkariPath — You're subscribed!",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:#f97316;padding:32px 40px;">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">SarkariPath</h1>
              <p style="margin:8px 0 0;color:#fff3e0;font-size:14px;">One Portal to track all govt. jobs</p>
            </div>
            <div style="padding:32px 40px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">You're subscribed! 🎉</h2>
              <p style="color:#6b7280;line-height:1.6;margin:0 0 20px;">
                Hi ${name || "there"}, welcome to SarkariPath. You'll now receive weekly digests for <strong>${prefList}</strong>.
              </p>
              <p style="color:#6b7280;line-height:1.6;margin:0 0 28px;">
                We send every week with the latest government job notifications — deadlines, vacancies, and direct links to apply.
              </p>
              <a href="https://sarkaripath.com/jobs" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
                Browse Jobs Now →
              </a>
            </div>
            <div style="padding:20px 40px;border-top:1px solid #f3f4f6;background:#f9fafb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                You can unsubscribe at any time by replying "unsubscribe" to this email.
                <br>SarkariPath · India
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (emailErr) {
    // Don't fail the subscription if email sending fails
    console.error("Resend error:", emailErr);
  }

  return NextResponse.json({ status: "subscribed" });
}
