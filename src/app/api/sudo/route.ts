export async function POST(req: Request) {
  const { password } = await req.json();
  if (password === process.env.SUDO_PASSWORD) {
    return Response.json({ ok: true });
  }
  return Response.json({ ok: false }, { status: 401 });
}
