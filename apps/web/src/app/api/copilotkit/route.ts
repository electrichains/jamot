export async function GET() {
  return Response.json({ status: "ok", service: "copilotkit-api" });
}
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return Response.json({ received: true, method: "POST" });
}
