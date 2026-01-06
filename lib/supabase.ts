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
