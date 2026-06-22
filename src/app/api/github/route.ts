export async function GET() {
  const res = await fetch(`https://api.github.com/user/repos?per_page=5&sort=updated&visibility=all`, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  });
  const data = await res.json();
  return Response.json(data);
}
