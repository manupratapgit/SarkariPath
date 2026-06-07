import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
  });
}

export async function POST(req: NextRequest) {
  const { email, name } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const firstName = name?.split(" ")[0] || "there";

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `SarkariPath <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Welcome to SarkariPath 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif;">
          <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:#f97316;padding:28px 40px;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">Welcome to SarkariPath!</h1>
              <p style="margin:6px 0 0;color:#fff3e0;font-size:13px;">Your government job tracker is ready</p>
            </div>
            <div style="padding:32px 40px;">
              <p style="color:#374151;font-size:15px;margin:0 0 16px;">Hi ${firstName},</p>
              <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
                You're now part of SarkariPath — India's AI-powered government job portal.
                We'll help you never miss an opportunity across UPSC, SSC, Railways, Banking and more.
              </p>

              <div style="background:#fff7ed;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#c2410c;">What you can do now:</p>
                <ul style="margin:0;padding-left:20px;color:#374151;font-size:13px;line-height:2;">
                  <li>Browse 100+ active government job listings</li>
                  <li>Filter by exam type, qualification & deadline</li>
                  <li>Track applications — Saved → Applied → Result</li>
                  <li>Get weekly job digest in your inbox</li>
                </ul>
              </div>

              <div style="text-align:center;">
                <a href="https://sarkari-path.vercel.app/dashboard"
                  style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;">
                  Go to My Dashboard →
                </a>
              </div>
            </div>
            <div style="padding:20px 40px;border-top:1px solid #f3f4f6;background:#f9fafb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                SarkariPath · India's most trusted government job portal
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("Welcome email failed:", err);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }
}
