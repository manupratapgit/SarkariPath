import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") || "";
  const examType = searchParams.get("examType") || "";
  const location = searchParams.get("location") || "";
  const status = searchParams.get("status") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "latest";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || "20")));

  let query = supabase.from("jobs").select("*", { count: "exact" });

  if (q) {
    query = query.or(`title.ilike.%${q}%,organization.ilike.%${q}%,exam_type.ilike.%${q}%`);
  }
  if (examType) query = query.eq("exam_type", examType);
  if (location) query = query.ilike("location", `%${location}%`);
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);

  if (sort === "deadline") query = query.order("last_date", { ascending: true, nullsFirst: false });
  else if (sort === "vacancies") query = query.order("vacancies", { ascending: false, nullsFirst: false });
  else query = query.order("created_at", { ascending: false });

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    jobs: data,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  });
}
