# Lucifer Enhancement Plan

## Overview
1. Update system prompt for natural tool verbalization + concise messaging
2. Add new tools: Spotify (Klavis), Web Search, News, Weather (Direct APIs)

---

## Part 1: System Prompt Updates

**File:** `utils/index.ts` (and `pages/api/sms.ts` if we care about it later)

**Changes:**
- Instruct Lucifer to verbalize tool use naturally ("lemme check your calendar", "pulling up the weather")
- Each sentence as separate message - short, punchy
- Stay concise

---

## Part 2: New Tools

### A. Spotify (via Klavis)
- Check if Klavis has Spotify MCP server
- Tools to add:
  - `spotify_now_playing` - What's currently playing
  - `spotify_play` - Play a song/playlist/artist
  - `spotify_pause` - Pause playback
  - `spotify_skip` - Skip to next track
  - `spotify_search` - Search for music
  - `spotify_queue` - Add to queue

### B. Web Search (Direct API - Tavily)
**Why Tavily:** Built for AI agents, returns clean structured data, good for LLM consumption

- New file: `lib/tavily.ts`
- Tools to add:
  - `web_search` - Search the web for current info

**Env var:** `TAVILY_API_KEY`

### C. News (Direct API - NewsAPI)
- New file: `lib/news.ts`
- Tools to add:
  - `news_headlines` - Get top headlines (optional: by category/country)
  - `news_search` - Search news for a topic

**Env var:** `NEWS_API_KEY`

### D. Weather (Direct API - OpenWeather)
- New file: `lib/weather.ts`
- Tools to add:
  - `weather_current` - Current weather for a location
  - `weather_forecast` - 5-day forecast

**Env var:** `OPENWEATHER_API_KEY`

---

## Part 3: Integration

### Update `lib/klavis.ts`
- Add Spotify tools to `getGrokTools()`
- Add Spotify to `executeTool()` mapping

### Create new lib files
- `lib/tavily.ts` - Web search
- `lib/news.ts` - News
- `lib/weather.ts` - Weather

### Update `pages/api/chat.ts`
- Import new tool functions
- Combine all tools in the tools array
- Route tool execution to correct handler

---

## File Changes Summary

| File | Action |
|------|--------|
| `utils/index.ts` | Update system prompt |
| `lib/klavis.ts` | Add Spotify tools |
| `lib/tavily.ts` | New - web search |
| `lib/news.ts` | New - news API |
| `lib/weather.ts` | New - weather API |
| `pages/api/chat.ts` | Import & integrate all tools |
| `pages/settings.tsx` | Add new tools to UI list |

---

## Environment Variables Needed

```bash
# Existing
XAI_API_KEY=xxx
KLAVIS_API_KEY=xxx
MEM0_API_KEY=xxx

# New
TAVILY_API_KEY=xxx
NEWS_API_KEY=xxx
OPENWEATHER_API_KEY=xxx
```

---

## Implementation Order

1. System prompt update (quick win)
2. Weather (simplest API)
3. Web Search (Tavily)
4. News (NewsAPI)
5. Spotify (Klavis - needs to verify availability)
