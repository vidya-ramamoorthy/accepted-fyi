-- Enable Row Level Security on all 5 public tables
--
-- Context: Supabase Security Advisor flagged these tables as "RLS Disabled in Public".
-- Without RLS, anyone with the NEXT_PUBLIC_SUPABASE_ANON_KEY (exposed in the browser)
-- could bypass app API routes and directly query/modify data via Supabase PostgREST.
--
-- The app's server-side code connects as the postgres superuser (via DATABASE_URL),
-- which bypasses RLS entirely. No app code changes are needed.

-- ============================================================================
-- 1. schools — Public institutional data (read-only via PostgREST)
-- ============================================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools_select_public"
  ON public.schools
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- 2. decision_timelines — Public decision dates (read-only via PostgREST)
-- ============================================================================
ALTER TABLE public.decision_timelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decision_timelines_select_public"
  ON public.decision_timelines
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- 3. user_profiles — Private user data (own-row access only)
-- ============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- ============================================================================
-- 4. admission_submissions — Core data pool
--    SELECT: all authenticated users (data sharing model)
--    INSERT/UPDATE: only own submissions (matched via user_profiles lookup)
-- ============================================================================
ALTER TABLE public.admission_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admission_submissions_select_authenticated"
  ON public.admission_submissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admission_submissions_insert_own"
  ON public.admission_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (
      SELECT id FROM public.user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "admission_submissions_update_own"
  ON public.admission_submissions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (
      SELECT id FROM public.user_profiles
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = (
      SELECT id FROM public.user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. submission_flags — Community moderation (immutable after creation)
--    SELECT: own flags only
--    INSERT: only flags where flagged_by_user_id matches own profile
-- ============================================================================
ALTER TABLE public.submission_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submission_flags_select_own"
  ON public.submission_flags
  FOR SELECT
  TO authenticated
  USING (
    flagged_by_user_id = (
      SELECT id FROM public.user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "submission_flags_insert_own"
  ON public.submission_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    flagged_by_user_id = (
      SELECT id FROM public.user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );
