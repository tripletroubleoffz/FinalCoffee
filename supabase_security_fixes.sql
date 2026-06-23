-- ====================================================================
-- SUPABASE DATABASE ADVISOR SECURITY REFINEMENTS MIGRATION
-- File: supabase_security_fixes.sql
-- ====================================================================

-- 1. FUNCTION SEARCH PATHS MUTABLE & DEFINER REFINEMENTS
-- Update trigger function for new user registrations (sets search_path to public)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into public.profiles (id, nickname, email, subscription_status, preferred_topics)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'FREE',
    array['Artificial Intelligence', 'Technology']::text[]
  );
  return new;
end;
$$;

-- Update trigger function for article likes count (sets search_path to public)
CREATE OR REPLACE FUNCTION public.handle_article_like_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if (TG_OP = 'INSERT') then
    update public.articles
    set likes_count = likes_count + 1
    where id = new.article_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.articles
    set likes_count = greatest(0, likes_count - 1)
    where id = old.article_id;
    return old;
  end if;
  return null;
end;
$$;

-- Drop old RPC delete user function (releasing it from API exposure to avoid advisor warnings)
DROP FUNCTION IF EXISTS public.delete_user_account();

-- Create secure trigger function for account deletion (sets search_path to public)
CREATE OR REPLACE FUNCTION public.handle_delete_user_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  delete from auth.users where id = old.id;
  return old;
end;
$$;

-- 2. CREATE ACCOUNT DELETION TRIGGER AND POLICIES
-- Setup trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_delete_user_trigger();

-- Setup RLS profile delete policy to grant users delete permissions on their own profile row
DROP POLICY IF EXISTS "Allow users to delete own profile" ON public.profiles;
CREATE POLICY "Allow users to delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- 3. REVOKE EXECUTE FROM PUBLIC ON SECURITY DEFINER FUNCTIONS
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_article_like_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_delete_user_trigger() FROM PUBLIC, anon, authenticated;

-- 4. FIX RLS POLICIES ALWAYS TRUE
-- contact_submissions: Require non-empty fields + correct auth roles
DROP POLICY IF EXISTS "Allow anonymous insert of contact submissions" ON public.contact_submissions;
CREATE POLICY "Allow anonymous insert of contact submissions" ON public.contact_submissions
  FOR INSERT WITH CHECK (
    name IS NOT NULL AND 
    email IS NOT NULL AND 
    message IS NOT NULL AND 
    length(trim(name)) > 0 AND 
    length(trim(email)) > 0 AND 
    length(trim(message)) > 0 AND 
    (auth.role() = 'anon' OR auth.role() = 'authenticated')
  );

-- rss_sources: Restrict ALL access controls to admin role
DROP POLICY IF EXISTS "Allow all updates of rss_sources" ON public.rss_sources;
DROP POLICY IF EXISTS "Allow admin all updates of rss_sources" ON public.rss_sources;
CREATE POLICY "Allow admin all updates of rss_sources" ON public.rss_sources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- rss_ingestion_logs: Restrict ALL access controls to admin role
DROP POLICY IF EXISTS "Allow all updates of rss_ingestion_logs" ON public.rss_ingestion_logs;
DROP POLICY IF EXISTS "Allow admin all updates of rss_ingestion_logs" ON public.rss_ingestion_logs;
CREATE POLICY "Allow admin all updates of rss_ingestion_logs" ON public.rss_ingestion_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
