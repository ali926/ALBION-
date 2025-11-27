import { NextResponse } from "next/server";
import axios from "axios";

const EURO_API = "https://europe.albion-online-data.com/api/v2";

export async function GET(request: Request, { params }: { params: { itemId: string } }) {
  const { itemId } = params;
  const url = new URL(`${EURO_API}/stats/prices/${encodeURIComponent(itemId)}`);
  const locs = request.nextUrl.searchParams.get("locations");
  if (locs) url.searchParams.set("locations", locs);
  try {
    const resp = await axios.get(url.toString(), { timeout: 10_000 });
    return NextResponse.json(resp.data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "fetch error" }, { status: 500 });
  }
}
