import { NextResponse } from "next/server";

const USERNAME = process.env.LEETCODE_USERNAME ?? "Zhong86";

const GRAPHQL_URL = "https://leetcode.com/graphql";

const query = `
  query getUserStats($username: String!) {
    matchedUser(username: $username) {
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      languageProblemCount {
        languageName
        problemsSolved
      }
      profile {
        ranking
        reputation
      }
      userCalendar(year: 0) {
        submissionCalendar
        totalActiveDays
        streak
      }
    }
    allQuestionsCount {
      difficulty
      count
    }
  }
`;

export async function GET() {
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com",
        "User-Agent": "Mozilla/5.0",
      },
      body: JSON.stringify({ query, variables: { username: USERNAME } }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("LeetCode GraphQL error:", res.status, text);
      return NextResponse.json({ error: `LeetCode returned ${res.status}` }, { status: 502 });
    }

    const json = await res.json();

    if (json.errors) {
      console.error("LeetCode GraphQL errors:", json.errors);
      return NextResponse.json({ error: json.errors[0]?.message ?? "GraphQL error" }, { status: 502 });
    }

    const user = json.data?.matchedUser;
    const allQ: { difficulty: string; count: number }[] = json.data?.allQuestionsCount ?? [];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const acNums: { difficulty: string; count: number }[] = user.submitStats?.acSubmissionNum ?? [];
    const solved = (d: string) => acNums.find((x) => x.difficulty === d)?.count ?? 0;
    const total  = (d: string) => allQ.find((x) => x.difficulty === d)?.count ?? 0;

    const stats = {
      totalSolved:        solved("All"),
      totalQuestions:     total("All"),
      easySolved:         solved("Easy"),
      totalEasy:          total("Easy"),
      mediumSolved:       solved("Medium"),
      totalMedium:        total("Medium"),
      hardSolved:         solved("Hard"),
      totalHard:          total("Hard"),
      ranking:            user.profile?.ranking ?? 0,
      streak:             user.userCalendar?.streak ?? 0,
      totalActiveDays:    user.userCalendar?.totalActiveDays ?? 0,
      submissionCalendar: JSON.parse(user.userCalendar?.submissionCalendar ?? "{}"),
    };

    const langs: { languageName: string; problemsSolved: number }[] =
      (user.languageProblemCount ?? []).sort(
        (a: { problemsSolved: number }, b: { problemsSolved: number }) =>
          b.problemsSolved - a.problemsSolved
      );

    return NextResponse.json({ stats, langs });
  } catch (e: any) {
    console.error("LeetCode route error:", e);
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
