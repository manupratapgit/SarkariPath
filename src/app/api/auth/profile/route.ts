import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Uses service role key to bypass RLS — safe because we validate the user id
// from Supabase Auth directly (not from the request body).
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, ...profileData } = body;

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Verify the user actually exists in Supabase Auth before saving
  const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(userId);
  if (authErr || !authUser.user) {
    return NextResponse.json({ error: "Invalid user" }, { status: 403 });
  }

  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    ...profileData,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
