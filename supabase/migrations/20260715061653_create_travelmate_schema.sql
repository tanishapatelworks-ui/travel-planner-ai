/*
# TravelMate AI — Core Schema

1. Purpose
   Multi-user AI travel planner. Users sign in (email/password), create trips,
   and store AI-generated itineraries, budgets, packing lists, and chat history.

2. New Tables
   - `profiles` — user profile (name, avatar, preferences). One row per auth user.
     * id (uuid, PK, references auth.users)
     * full_name (text)
     * avatar_url (text, nullable)
     * preferred_budget (text, nullable) — e.g. "Budget", "Mid-range", "Luxury"
     * preferred_destinations (text[], nullable)
     * travel_preferences (jsonb, nullable) — interests, transport, etc.
     * created_at, updated_at
   - `trips` — a planned trip + its full AI-generated plan.
     * id (uuid, PK)
     * user_id (uuid, FK auth.users, DEFAULT auth.uid())
     * title (text)
     * destination (text)
     * budget_total (numeric)
     * currency (text, default 'INR')
     * days (int)
     * start_date (date, nullable)
     * end_date (date, nullable)
     * travelers (int)
     * interests (text[])
     * transport (text)
     * status (text, default 'planned') — planned | upcoming | completed
     * is_favorite (boolean, default false)
     * plan (jsonb) — full AI plan: itinerary, budget breakdown, hotels, transport, packing, tips, emergency, weather
     * created_at, updated_at
   - `chat_messages` — conversation history with the AI assistant per trip.
     * id (uuid, PK)
     * trip_id (uuid, FK trips ON DELETE CASCADE)
     * user_id (uuid, FK auth.users, DEFAULT auth.uid())
     * role (text) — user | assistant
     * content (text)
     * created_at

3. Security (RLS)
   - Enable RLS on all tables.
   - profiles: owner-only CRUD (auth.uid() = id).
   - trips: owner-only CRUD (auth.uid() = user_id). user_id defaults to auth.uid().
   - chat_messages: owner-only CRUD via trips ownership check.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  preferred_budget text,
  preferred_destinations text[] DEFAULT '{}',
  travel_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  destination text NOT NULL,
  budget_total numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  days int NOT NULL DEFAULT 1,
  start_date date,
  end_date date,
  travelers int NOT NULL DEFAULT 1,
  interests text[] DEFAULT '{}',
  transport text DEFAULT 'Mixed',
  status text NOT NULL DEFAULT 'planned',
  is_favorite boolean NOT NULL DEFAULT false,
  plan jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trips" ON trips;
CREATE POLICY "select_own_trips" ON trips FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trips" ON trips;
CREATE POLICY "insert_own_trips" ON trips FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trips" ON trips;
CREATE POLICY "update_own_trips" ON trips FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trips" ON trips;
CREATE POLICY "delete_own_trips" ON trips FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips(user_id);
CREATE INDEX IF NOT EXISTS trips_status_idx ON trips(status);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON chat_messages;
CREATE POLICY "select_own_messages" ON chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_messages" ON chat_messages;
CREATE POLICY "insert_own_messages" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_messages" ON chat_messages;
CREATE POLICY "update_own_messages" ON chat_messages FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_messages" ON chat_messages;
CREATE POLICY "delete_own_messages" ON chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS chat_messages_trip_id_idx ON chat_messages(trip_id);

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
