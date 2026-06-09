import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface WorkflowStatus {
  name: string;
  status: "success" | "failure" | "skipped";
  conclusion?: string;
  runAt?: string;
  url?: string;
}

export async function POST(req: NextRequest) {
  const { workflows }: { workflows: WorkflowStatus[] } = await req.json();
  if (!workflows?.length) return NextResponse.json({ error: "No data" }, { status: 400 });

  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const allGreen = workflows.every(w => w.status === "success");

  const rowHtml = (w: WorkflowStatus) => {
    const icon = w.status === "success" ? "✅" : w.status === "failure" ? "❌" : "⚠️";
    const color = w.status === "success" ? "#16a34a" : w.status === "failure" ? "#dc2626" : "#d97706";
    const label = w.status === "success" ? "Success" : w.status === "failure" ? "Failed" : "Skipped";
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;">${icon} ${w.name}</td>
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:14px;font-weight:700;color:${color};">${label}</td>
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;">${w.runAt || "—"}</td>
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:12px;">
          ${w.url ? `<a href="${w.url}" style="color:#f97316;text-decoration:none;">View logs →</a>` : ""}
        </td>
      </tr>
    `;
  };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });

  await transporter.sendMail({
    from: `SarkariPath <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: `${allGreen ? "✅" : "❌"} SarkariPath Daily Cron Report — ${date}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:${allGreen ? "#16a34a" : "#dc2626"};padding:24px 40px;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;">
              ${allGreen ? "✅ All Systems Green" : "❌ Some Jobs Failed"}
            </h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">SarkariPath · ${date}</p>
          </div>
          <div style="padding:28px 40px;">
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="text-align:left;font-size:12px;color:#6b7280;font-weight:600;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">Workflow</th>
                  <th style="text-align:left;font-size:12px;color:#6b7280;font-weight:600;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">Status</th>
                  <th style="text-align:left;font-size:12px;color:#6b7280;font-weight:600;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">Ran At</th>
                  <th style="text-align:left;font-size:12px;color:#6b7280;font-weight:600;padding-bottom:8px;border-bottom:1px solid #e5e7eb;">Logs</th>
                </tr>
              </thead>
              <tbody>${workflows.map(rowHtml).join("")}</tbody>
            </table>
          </div>
          <div style="padding:16px 40px;border-top:1px solid #f3f4f6;background:#f9fafb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
              SarkariPath automated cron report · <a href="https://github.com/manupratapgit/SarkariPath/actions" style="color:#f97316;">View all workflows →</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return NextResponse.json({ sent: true });
}
