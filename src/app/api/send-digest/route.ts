import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
}

function formatDeadline(dateStr: string | null): string {
  if (!dateStr) return "See notification";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function jobRow(job: {
  title: string;
  organization: string;
  vacancies_display?: string;
  vacancies?: number;
  last_date?: string;
  id: string;
}) {
  const vacancies = job.vacancies_display || (job.vacancies ? job.vacancies.toLocaleString("en-IN") : "See notification");
  const deadline = formatDeadline(job.last_date ?? null);
  return `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #f3f4f6;vertical-align:top;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">${job.title}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">${job.organization}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <span style="font-size:12px;color:#374151;"><strong>Vacancies:</strong> ${vacancies}</span>
          <span style="font-size:12px;color:#374151;"><strong>Deadline:</strong> ${deadline}</span>
        </div>
      </td>
      <td style="padding:16px 0 16px 16px;border-bottom:1px solid #f3f4f6;vertical-align:middle;white-space:nowrap;">
        <a href="https://sarkari-path.vercel.app/jobs/${job.id}" style="display:inline-block;background:#f97316;color:#fff;font-size:12px;font-weight:700;padding:8px 16px;border-radius:8px;text-decoration:none;">
          View →
        </a>
      </td>
    </tr>
  `;
}

export async function POST() {
  const { data: subscribers, error: subError } = await supabase
    .from("subscriptions")
    .select("email, name, preferences")
    .eq("is_active", true);

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ sent: 0, message: "No active subscribers" });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, title, organization, vacancies, vacancies_display, last_date, exam_type")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(10);

  if (jobsError) {
    return NextResponse.json({ error: jobsError.message }, { status: 500 });
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ sent: 0, message: "No new jobs in last 7 days" });
  }

  const jobsHtml = jobs.map(jobRow).join("");
  const weekLabel = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const transporter = createTransporter();

  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    try {
      await transporter.sendMail({
        from: `SarkariPath <${process.env.GMAIL_USER}>`,
        to: sub.email,
        subject: `Weekly Govt Job Digest — ${weekLabel}`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif;">
            <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
              <div style="background:#f97316;padding:28px 40px;">
                <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">SarkariPath Weekly Digest</h1>
                <p style="margin:6px 0 0;color:#fff3e0;font-size:13px;">${weekLabel}</p>
              </div>
              <div style="padding:28px 40px;">
                <p style="color:#374151;font-size:14px;margin:0 0 24px;">
                  Hi ${sub.name || "there"}, here are the latest government job notifications added this week:
                </p>
                <table style="width:100%;border-collapse:collapse;">
                  <tbody>${jobsHtml}</tbody>
                </table>
                <div style="margin-top:28px;text-align:center;">
                  <a href="https://sarkari-path.vercel.app/jobs" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                    See All Jobs on SarkariPath →
                  </a>
                </div>
              </div>
              <div style="padding:20px 40px;border-top:1px solid #f3f4f6;background:#f9fafb;">
                <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                  You're receiving this because you subscribed at sarkari-path.vercel.app.<br>
                  Reply "unsubscribe" to stop receiving these emails.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send to ${sub.email}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed, total: subscribers.length });
}
