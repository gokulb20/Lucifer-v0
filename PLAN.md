# Lucifer Enhancement Plan

## Status: IMPLEMENTED ✅

## What Was Done

### 1. System Prompt Updates
- Natural tool verbalization ("lemme check your calendar", "pulling up the weather")
- Short, punchy sentences
- Concise responses

### 2. Klavis Tools (OAuth) - Added
- **Gmail** - search, read, send emails
- **Google Calendar** - list events, create events
- **GitHub** - list repos, issues, PRs, create issues
- **Google Drive** - search, list, read files
- **LinkedIn** - profile, post updates
- **Outlook** - search, read, send emails
- **Discord** - list servers, channels, send messages
- **Instagram** - profile, posts

### 3. Direct API Tools - Added
- **Web Search** (Tavily) - `lib/tavily.ts`
- **News** (NewsAPI) - `lib/news.ts`
- **Weather** (OpenWeather) - `lib/weather.ts`

---

## Files Changed

| File | Change |
|------|--------|
| `utils/index.ts` | Updated system prompt |
| `lib/klavis.ts` | Added GitHub, Drive, LinkedIn, Outlook, Discord, Instagram tools |
| `lib/tavily.ts` | New - web search |
| `lib/news.ts` | New - news API |
| `lib/weather.ts` | New - weather API |
| `pages/api/chat.ts` | Integrated all tools with routing |
| `pages/settings.tsx` | Updated UI with all tools |

---

## Environment Variables Needed

```bash
# Existing
XAI_API_KEY=xxx
KLAVIS_API_KEY=xxx
MEM0_API_KEY=xxx

# New (Direct APIs)
TAVILY_API_KEY=xxx
NEWS_API_KEY=xxx
OPENWEATHER_API_KEY=xxx
```

---

## Notes
- Spotify was NOT added (Klavis doesn't have it)
- All Klavis tools require OAuth setup via klavis.ai dashboard
- Direct API tools just need env vars set
