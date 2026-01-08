// Supabase client for persistent storage
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Database types
export interface Goal {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: "active" | "completed" | "paused";
  created_at: string;
  updated_at: string;
}

export interface MoodEntry {
  id: string;
  mood: number;
  energy?: number;
  notes?: string;
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  relationship?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Preference {
  id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface LocationEntry {
  id: string;
  lat: number;
  lng: number;
  name?: string;
  created_at: string;
}

export interface HealthEntry {
  id: string;
  steps?: number;
  sleep_hours?: number;
  active_minutes?: number;
  heart_rate?: number;
  workouts?: Array<{ type: string; duration: number; calories?: number }>;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  prompt_id: number;
  prompt: string;
  answer: string;
  created_at: string;
}

// Trigger system types
export interface TriggerHistory {
  id: string;
  trigger_id: string;
  fired_at: string;
  context?: Record<string, any>;
  message_sent?: string;
  delivery_method?: string;
  delivered: boolean;
  user_responded: boolean;
  responded_at?: string;
}

export interface VipContact {
  id: string;
  email: string;
  name: string;
  relationship?: string;
  created_at: string;
}

export interface KnownLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_meters: number;
  trigger_on_arrive: boolean;
  trigger_on_leave: boolean;
  created_at: string;
}

export interface DeviceToken {
  id: string;
  token: string;
  platform: string;
  created_at: string;
  last_used?: string;
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ScreenTimeEntry {
  id: string;
  date: string;
  app_category?: string;
  app_name?: string;
  minutes: number;
  created_at: string;
}

// Initialize Supabase client
let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

// Goals
export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await getSupabase()
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createGoal(title: string, description?: string): Promise<Goal> {
  const { data, error } = await getSupabase()
    .from("goals")
    .insert({
      id: `goal_${Date.now()}`,
      title,
      description,
      progress: 0,
      status: "active",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
  const { data, error } = await getSupabase()
    .from("goals")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await getSupabase().from("goals").delete().eq("id", id);
  if (error) throw error;
}

// Mood
export async function getMoodEntries(limit = 30): Promise<MoodEntry[]> {
  const { data, error } = await getSupabase()
    .from("mood_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function logMood(mood: number, energy?: number, notes?: string): Promise<MoodEntry> {
  const { data, error } = await getSupabase()
    .from("mood_entries")
    .insert({
      id: `mood_${Date.now()}`,
      mood,
      energy,
      notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// People
export async function getPeople(): Promise<Person[]> {
  const { data, error } = await getSupabase()
    .from("people")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function addPerson(name: string, relationship?: string, notes?: string): Promise<Person> {
  const { data, error } = await getSupabase()
    .from("people")
    .insert({
      id: `person_${Date.now()}`,
      name,
      relationship,
      notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePerson(id: string, updates: Partial<Person>): Promise<Person> {
  const { data, error } = await getSupabase()
    .from("people")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePerson(id: string): Promise<void> {
  const { error } = await getSupabase().from("people").delete().eq("id", id);
  if (error) throw error;
}

// Preferences
export async function getPreferences(): Promise<Preference[]> {
  const { data, error } = await getSupabase()
    .from("preferences")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function savePreference(question: string, answer: string): Promise<Preference> {
  // Upsert based on question
  const { data, error } = await getSupabase()
    .from("preferences")
    .upsert(
      {
        id: `pref_${Buffer.from(question).toString("base64").slice(0, 20)}`,
        question,
        answer,
      },
      { onConflict: "question" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Location
export async function getLatestLocation(): Promise<LocationEntry | null> {
  const { data, error } = await getSupabase()
    .from("locations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function saveLocation(lat: number, lng: number, name?: string): Promise<LocationEntry> {
  const { data, error } = await getSupabase()
    .from("locations")
    .insert({
      id: `loc_${Date.now()}`,
      lat,
      lng,
      name,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Health
export async function getLatestHealth(): Promise<HealthEntry | null> {
  const { data, error } = await getSupabase()
    .from("health_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function saveHealth(entry: Omit<HealthEntry, "id" | "created_at">): Promise<HealthEntry> {
  const { data, error } = await getSupabase()
    .from("health_entries")
    .insert({
      id: `health_${Date.now()}`,
      ...entry,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Journal
export async function getJournalEntries(limit = 30): Promise<JournalEntry[]> {
  const { data, error } = await getSupabase()
    .from("journal_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function saveJournalEntry(promptId: number, prompt: string, answer: string): Promise<JournalEntry> {
  const { data, error } = await getSupabase()
    .from("journal_entries")
    .insert({
      id: `journal_${Date.now()}`,
      prompt_id: promptId,
      prompt,
      answer,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Trigger History
export async function logTrigger(
  triggerId: string,
  context: Record<string, any>,
  messageSent: string,
  deliveryMethod: string
): Promise<TriggerHistory> {
  const { data, error } = await getSupabase()
    .from("trigger_history")
    .insert({
      id: `th_${Date.now()}`,
      trigger_id: triggerId,
      context,
      message_sent: messageSent,
      delivery_method: deliveryMethod,
      delivered: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLastTriggerFire(triggerId: string): Promise<TriggerHistory | null> {
  const { data, error } = await getSupabase()
    .from("trigger_history")
    .select("*")
    .eq("trigger_id", triggerId)
    .order("fired_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// VIP Contacts
export async function getVipContacts(): Promise<VipContact[]> {
  const { data, error } = await getSupabase()
    .from("vip_contacts")
    .select("*");

  if (error) throw error;
  return data || [];
}

export async function isVipEmail(email: string): Promise<VipContact | null> {
  const { data, error } = await getSupabase()
    .from("vip_contacts")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function addVipContact(email: string, name: string, relationship?: string): Promise<VipContact> {
  const { data, error } = await getSupabase()
    .from("vip_contacts")
    .insert({
      id: `vip_${Date.now()}`,
      email: email.toLowerCase(),
      name,
      relationship,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Known Locations
export async function getKnownLocations(): Promise<KnownLocation[]> {
  const { data, error } = await getSupabase()
    .from("known_locations")
    .select("*")
    .eq("trigger_on_arrive", true);

  if (error) throw error;
  return data || [];
}

export async function addKnownLocation(
  name: string,
  lat: number,
  lng: number,
  radiusMeters = 100
): Promise<KnownLocation> {
  const { data, error } = await getSupabase()
    .from("known_locations")
    .insert({
      id: `kloc_${Date.now()}`,
      name,
      lat,
      lng,
      radius_meters: radiusMeters,
      trigger_on_arrive: true,
      trigger_on_leave: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Device Tokens
export async function getDeviceTokens(): Promise<DeviceToken[]> {
  const { data, error } = await getSupabase()
    .from("device_tokens")
    .select("*")
    .eq("platform", "ios");

  if (error) throw error;
  return data || [];
}

export async function saveDeviceToken(token: string, platform = "ios"): Promise<DeviceToken> {
  const { data, error } = await getSupabase()
    .from("device_tokens")
    .upsert({
      id: `dt_${Date.now()}`,
      token,
      platform,
      last_used: new Date().toISOString(),
    }, { onConflict: "token" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Chat History
export async function saveChatMessage(role: string, content: string): Promise<ChatMessage> {
  const { data, error } = await getSupabase()
    .from("chat_history")
    .insert({
      id: `chat_${Date.now()}`,
      role,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLastUserMessage(): Promise<ChatMessage | null> {
  const { data, error } = await getSupabase()
    .from("chat_history")
    .select("*")
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Screen Time
export async function saveScreenTime(
  date: string,
  appCategory: string,
  minutes: number,
  appName?: string
): Promise<ScreenTimeEntry> {
  const { data, error } = await getSupabase()
    .from("screen_time")
    .insert({
      id: `st_${Date.now()}`,
      date,
      app_category: appCategory,
      app_name: appName,
      minutes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getScreenTimeByCategory(category: string, days = 1): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await getSupabase()
    .from("screen_time")
    .select("minutes")
    .eq("app_category", category)
    .gte("date", since.toISOString().split("T")[0]);

  if (error) throw error;
  return (data || []).reduce((sum, d) => sum + d.minutes, 0);
}

// Health queries for triggers
export async function getHealthEntriesSince(days: number): Promise<HealthEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await getSupabase()
    .from("health_entries")
    .select("*")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getMoodEntriesSince(days: number): Promise<MoodEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await getSupabase()
    .from("mood_entries")
    .select("*")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getStaleGoals(daysStale: number): Promise<Goal[]> {
  const since = new Date();
  since.setDate(since.getDate() - daysStale);

  const { data, error } = await getSupabase()
    .from("goals")
    .select("*")
    .eq("status", "active")
    .lt("updated_at", since.toISOString());

  if (error) throw error;
  return data || [];
}
