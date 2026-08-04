// src/lib/steam.ts
import Groq from "groq-sdk";

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = process.env.STEAM_ID;

type SteamGame = {
  appid: number;
  name: string;
  playtime_forever: number; // minutes
  playtime_2weeks?: number; // minutes, only present if played recently
};

type LibraryFilter = "unplayed" | "recently_played" | "most_played" | "all";

export const steamTools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_steam_library",
      description:
        "Fetch Billy's Steam game library to help recommend what he should play next. " +
        "Use this when the user asks for a game recommendation, what to play, what's in the backlog, " +
        "or anything about Billy's Steam library / games owned.",
      parameters: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            enum: ["unplayed", "recently_played", "most_played", "all"],
            description:
              "unplayed: games with 0 playtime (untouched backlog) — best for 'what should I try next'. " +
              "recently_played: games played in the last 2 weeks — useful for 'what am I currently into'. " +
              "most_played: top games by total playtime — useful for 'what do I actually like'. " +
              "all: full library sorted alphabetically. Defaults to 'unplayed' if omitted.",
          },
          limit: {
            type: "number",
            description: "Max number of games to return. Defaults to 25.",
          },
        },
        required: [],
      },
    },
  },
];

async function fetchOwnedGames(): Promise<SteamGame[]> {
  if (!STEAM_API_KEY || !STEAM_ID) {
    throw new Error("Steam integration is not configured on the server.");
  }

  const url = new URL("https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/");
  url.searchParams.set("key", STEAM_API_KEY);
  url.searchParams.set("steamid", STEAM_ID);
  url.searchParams.set("format", "json");
  url.searchParams.set("include_appinfo", "true");
  url.searchParams.set("include_played_free_games", "true");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Steam API returned ${res.status}`);
  }

  const data = await res.json();
  const games: SteamGame[] = data?.response?.games ?? [];
  return games;
}

function formatGame(g: SteamGame): string {
  const hours = (g.playtime_forever / 60).toFixed(1);
  const recent = g.playtime_2weeks
    ? ` (${(g.playtime_2weeks / 60).toFixed(1)}h in last 2 weeks)`
    : "";
  return `- ${g.name} — ${hours}h total${recent}`;
}

function selectGames(games: SteamGame[], filter: LibraryFilter, limit: number): SteamGame[] {
  switch (filter) {
    case "unplayed":
      return games
        .filter((g) => g.playtime_forever === 0)
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, limit);
    case "recently_played":
      return games
        .filter((g) => (g.playtime_2weeks ?? 0) > 0)
        .sort((a, b) => (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0))
        .slice(0, limit);
    case "most_played":
      return games
        .sort((a, b) => b.playtime_forever - a.playtime_forever)
        .slice(0, limit);
    case "all":
    default:
      return games.sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit);
  }
}

export async function executeSteamTool(name: string, argsJson: string): Promise<string> {
  if (name !== "get_steam_library") {
    return `Unknown tool: ${name}`;
  }

  try {
    const args = argsJson ? JSON.parse(argsJson) : {};
    const filter: LibraryFilter = args.filter ?? "unplayed";
    const limit: number = Math.min(Math.max(Number(args.limit) || 25, 1), 100);

    const games = await fetchOwnedGames();
    if (games.length === 0) {
      return "Steam library is empty or private.";
    }

    const selected = selectGames(games, filter, limit);
    if (selected.length === 0) {
      return `No games found for filter "${filter}". Total library size: ${games.length}.`;
    }

    const header = `Steam library (${filter}, showing ${selected.length} of ${games.length} total games):`;
    return `${header}\n${selected.map(formatGame).join("\n")}`;
  } catch (err) {
    return `Error fetching Steam library: ${err instanceof Error ? err.message : "unknown error"}`;
  }
}
