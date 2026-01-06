// OpenWeather API Integration

const OPENWEATHER_API = "https://api.openweathermap.org/data/2.5";

export function isWeatherConfigured(): boolean {
  return !!process.env.OPENWEATHER_API_KEY;
}

// Get current weather for a location
export async function getCurrentWeather(location: string): Promise<string> {
  if (!process.env.OPENWEATHER_API_KEY) {
    return JSON.stringify({ error: "Weather API not configured" });
  }

  try {
    const res = await fetch(
      `${OPENWEATHER_API}/weather?q=${encodeURIComponent(location)}&appid=${process.env.OPENWEATHER_API_KEY}&units=imperial`
    );

    if (!res.ok) {
      const error = await res.text();
      return JSON.stringify({ error: `Weather API error: ${error}` });
    }

    const data = await res.json();

    return JSON.stringify({
      location: `${data.name}, ${data.sys.country}`,
      temperature: `${Math.round(data.main.temp)}°F`,
      feels_like: `${Math.round(data.main.feels_like)}°F`,
      condition: data.weather[0].description,
      humidity: `${data.main.humidity}%`,
      wind: `${Math.round(data.wind.speed)} mph`
    });
  } catch (error) {
    return JSON.stringify({ error: `Failed to get weather: ${error}` });
  }
}

// Get 5-day forecast for a location
export async function getWeatherForecast(location: string): Promise<string> {
  if (!process.env.OPENWEATHER_API_KEY) {
    return JSON.stringify({ error: "Weather API not configured" });
  }

  try {
    const res = await fetch(
      `${OPENWEATHER_API}/forecast?q=${encodeURIComponent(location)}&appid=${process.env.OPENWEATHER_API_KEY}&units=imperial`
    );

    if (!res.ok) {
      const error = await res.text();
      return JSON.stringify({ error: `Weather API error: ${error}` });
    }

    const data = await res.json();

    // Group by day and get one forecast per day (noon)
    const dailyForecasts: Record<string, any> = {};

    for (const item of data.list) {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const hour = date.getHours();

      // Prefer noon forecasts, or take first available for each day
      if (!dailyForecasts[dateKey] || (hour >= 11 && hour <= 13)) {
        dailyForecasts[dateKey] = {
          date: dateKey,
          temperature: `${Math.round(item.main.temp)}°F`,
          condition: item.weather[0].description,
          humidity: `${item.main.humidity}%`
        };
      }
    }

    return JSON.stringify({
      location: `${data.city.name}, ${data.city.country}`,
      forecast: Object.values(dailyForecasts).slice(0, 5)
    });
  } catch (error) {
    return JSON.stringify({ error: `Failed to get forecast: ${error}` });
  }
}

// Tool definitions for Grok
export function getWeatherTools() {
  return [
    {
      type: "function",
      function: {
        name: "weather_current",
        description: "Get current weather for a location. Use when asked about weather, temperature, or conditions.",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "City name, optionally with country code (e.g., 'San Francisco' or 'London, UK')"
            }
          },
          required: ["location"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "weather_forecast",
        description: "Get 5-day weather forecast for a location. Use when asked about upcoming weather.",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "City name, optionally with country code (e.g., 'San Francisco' or 'London, UK')"
            }
          },
          required: ["location"]
        }
      }
    }
  ];
}

// Execute weather tool
export async function executeWeatherTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  const location = args.location as string;

  if (toolName === "weather_current") {
    return getCurrentWeather(location);
  } else if (toolName === "weather_forecast") {
    return getWeatherForecast(location);
  }

  return JSON.stringify({ error: `Unknown weather tool: ${toolName}` });
}
