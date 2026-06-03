import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("jobs")
    .select("exam_type, status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const examType: Record<string, number> = {};
  const status: Record<string, number> = {};

  for (const row of data ?? []) {
    if (row.exam_type) examType[row.exam_type] = (examType[row.exam_type] ?? 0) + 1;
    if (row.status) status[row.status] = (status[row.status] ?? 0) + 1;
  }

  return NextResponse.json({ examType, status });
}
