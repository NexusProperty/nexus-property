

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."apply_csrf_protection"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  table_record RECORD;
  policy_exists BOOLEAN;
  rls_enabled BOOLEAN;
BEGIN
  -- Loop through all tables in the public schema
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  LOOP
    -- Check if RLS is enabled using the correct query
    EXECUTE format('SELECT relrowsecurity FROM pg_class WHERE relnamespace = ''public''::regnamespace AND relname = %L', table_record.table_name) INTO rls_enabled;
    
    -- Enable RLS if it's not already enabled
    IF NOT COALESCE(rls_enabled, FALSE) THEN
      BEGIN
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.table_name);
        RAISE NOTICE 'Enabled RLS on table %', table_record.table_name;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error enabling RLS on table %: %', table_record.table_name, SQLERRM;
      END;
    END IF;
    
    -- Check if the policy already exists
    SELECT EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename = table_record.table_name 
      AND policyname = 'csrf_protection_' || table_record.table_name
    ) INTO policy_exists;
    
    -- If the policy doesn't exist, create it
    IF NOT policy_exists THEN
      BEGIN
        EXECUTE format(
          'CREATE POLICY csrf_protection_%I ON public.%I FOR ALL TO authenticated USING (public.is_csrf_safe())',
          table_record.table_name,
          table_record.table_name
        );
        RAISE NOTICE 'Created CSRF protection policy for table %', table_record.table_name;
      EXCEPTION WHEN OTHERS THEN
        -- Log the error but continue with other tables
        RAISE NOTICE 'Error creating policy for table %: %', table_record.table_name, SQLERRM;
      END;
    END IF;
  END LOOP;
  
  -- No need to reload configuration - removed the pg_reload_conf() call
END;
$$;


ALTER FUNCTION "public"."apply_csrf_protection"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_csrf_tokens"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.csrf_tokens
  WHERE expires_at < NOW()
  OR used = TRUE;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_csrf_tokens"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_request_context"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result TEXT;
  header_token TEXT;
  jwt_token TEXT;
  req_method TEXT;
  user_role TEXT;
  user_id TEXT;
BEGIN
  -- Try to get all headers
  BEGIN
    header_token := COALESCE(current_setting('request.headers.x-csrf-token', true), 'MISSING');
  EXCEPTION WHEN OTHERS THEN
    header_token := 'ERROR: ' || SQLERRM;
  END;
  
  -- Try to get JWT claims
  BEGIN
    jwt_token := COALESCE(current_setting('request.jwt.claim.csrf_token', true), 'MISSING');
    user_role := COALESCE(current_setting('request.jwt.claim.role', true), 'MISSING');
    user_id := COALESCE(current_setting('request.jwt.claim.sub', true), 'MISSING');
  EXCEPTION WHEN OTHERS THEN
    jwt_token := 'ERROR: ' || SQLERRM;
  END;
  
  -- Try to get request method
  BEGIN
    req_method := COALESCE(current_setting('request.method', true), 'MISSING');
  EXCEPTION WHEN OTHERS THEN
    req_method := 'ERROR: ' || SQLERRM;
  END;
  
  -- Build text result
  result := 'Request context: ' || 
            'method=' || req_method || 
            ', header_token=' || header_token || 
            ', jwt_token=' || jwt_token || 
            ', role=' || user_role || 
            ', user_id=' || user_id || 
            ', timestamp=' || now()::text;
  
  -- Log the full context
  RAISE LOG '%', result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."debug_request_context"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_csrf_token"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  new_token TEXT;
  token_id UUID;
BEGIN
  -- Generate a random token using md5 instead of gen_random_bytes
  new_token := md5(random()::text || clock_timestamp()::text || auth.uid()::text);
  
  -- Store the token in the database
  INSERT INTO public.csrf_tokens (user_id, token)
  VALUES (auth.uid(), new_token)
  RETURNING id INTO token_id;
  
  -- Log token creation
  RAISE LOG 'Created CSRF token % for user %', token_id, auth.uid();
  
  RETURN new_token;
END;
$$;


ALTER FUNCTION "public"."generate_csrf_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_csrf_token"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  token TEXT;
  current_token TEXT;
BEGIN
  -- Check for existing token
  BEGIN
    current_token := current_setting('request.jwt.claim.csrf_token', true);
    
    -- Return existing token if valid
    IF current_token IS NOT NULL AND current_token != '' THEN
      RAISE LOG 'CSRF token: returned existing token';
      RETURN current_token;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'CSRF token error getting existing token: %', SQLERRM;
  END;
  
  -- Generate cryptographically secure token
  -- Using multiple sources of randomness
  token := encode(extensions.digest(gen_random_uuid()::text || clock_timestamp()::text, 'sha256'), 'hex');
  
  -- Store token in session (persistently)
  BEGIN
    PERFORM set_config('request.jwt.claim.csrf_token', token, false);
    RAISE LOG 'CSRF token: generated new token';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'CSRF token error storing token: %', SQLERRM;
  END;
  
  RETURN token;
END;
$$;


ALTER FUNCTION "public"."get_csrf_token"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "address" "text" NOT NULL,
    "suburb" "text" NOT NULL,
    "city" "text" NOT NULL,
    "postcode" "text",
    "property_type" "text" NOT NULL,
    "bedrooms" integer,
    "bathrooms" numeric(3,1),
    "land_size" numeric(10,2),
    "floor_area" numeric(10,2),
    "year_built" integer,
    "features" "text"[],
    "images" "text"[],
    "is_public" boolean DEFAULT false,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "square_footage" integer,
    "state" "text",
    "zip_code" "text",
    CONSTRAINT "properties_property_type_check" CHECK (("property_type" = ANY (ARRAY['house'::"text", 'apartment'::"text", 'townhouse'::"text", 'land'::"text", 'commercial'::"text", 'other'::"text"]))),
    CONSTRAINT "properties_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text", 'draft'::"text"])))
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_properties"("team_id" "uuid") RETURNS SETOF "public"."properties"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
  -- Get properties owned by members of the team
  SELECT p.* FROM public.properties p
  JOIN public.team_members tm ON p.owner_id = tm.user_id
  WHERE tm.team_id = $1;
$_$;


ALTER FUNCTION "public"."get_team_properties"("team_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_csrf_safe"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  token TEXT;
  method TEXT;
BEGIN
  -- Get the request method
  method := current_setting('request.method', true);

  -- Read-only methods are safe from CSRF
  IF method IN ('GET', 'HEAD', 'OPTIONS') THEN
    RAISE LOG 'CSRF safe: % is a read-only method', method;
    RETURN TRUE;
  END IF;

  -- For mutation methods, check token in both header and parameter
  IF method IN ('POST', 'PUT', 'DELETE', 'PATCH') THEN
    BEGIN
      -- Try to get token from header first
      token := current_setting('request.headers', true)::json->>'x-csrf-token';
      
      -- If not in header, try request parameter
      IF token IS NULL THEN
        -- First, check if there's a request.parameters setting
        IF current_setting('request.parameters', true) IS NOT NULL THEN
          token := current_setting('request.parameters', true)::json->>'csrf_token';
        END IF;
      END IF;
      
      -- If still no token, check in request.json.csrf_token 
      IF token IS NULL THEN
        IF current_setting('request.json', true) IS NOT NULL THEN
          token := current_setting('request.json', true)::json->>'csrf_token';
        END IF;
      END IF;
      
      -- If token found, verify it using our new function
      IF token IS NOT NULL THEN
        RETURN public.verify_csrf_token(token);
      END IF;
      
      RAISE LOG 'CSRF check failed: No valid token found';
      RETURN FALSE;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'CSRF check error: %', SQLERRM;
        RETURN FALSE;
    END;
  END IF;

  -- Default deny for unrecognized methods
  RAISE LOG 'CSRF check failed: Unrecognized method %', method;
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."is_csrf_safe"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_team_admin"("team_id" "uuid", "user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $_$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = $1 AND user_id = $2 AND role = 'admin'
  );
$_$;


ALTER FUNCTION "public"."is_team_admin"("team_id" "uuid", "user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_csrf_token"("token_to_verify" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Look up the token
  SELECT * INTO token_record
  FROM public.csrf_tokens
  WHERE token = token_to_verify
    AND user_id = auth.uid()
    AND used = FALSE
    AND expires_at > NOW()
  LIMIT 1;
  
  -- If no token found, return false
  IF token_record IS NULL THEN
    RAISE LOG 'Invalid CSRF token: not found or expired';
    RETURN FALSE;
  END IF;
  
  -- Mark the token as used (one-time use for extra security)
  UPDATE public.csrf_tokens
  SET used = TRUE
  WHERE id = token_record.id;
  
  RAISE LOG 'Valid CSRF token used by user %', auth.uid();
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."verify_csrf_token"("token_to_verify" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appraisal_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "appraisal_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "changes" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."appraisal_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appraisals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "property_id" "uuid",
    "property_address" "text" NOT NULL,
    "property_suburb" "text" NOT NULL,
    "property_city" "text" NOT NULL,
    "property_type" "text" NOT NULL,
    "bedrooms" integer,
    "bathrooms" numeric(3,1),
    "land_size" numeric(10,2),
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "valuation_low" numeric(12,2),
    "valuation_high" numeric(12,2),
    "market_analysis" "text",
    "property_description" "text",
    "comparables_commentary" "text",
    "report_url" "text",
    "is_public" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "team_id" "uuid",
    "floor_area" numeric(10,2),
    "year_built" integer,
    "valuation_confidence" numeric(5,2),
    "ai_content" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "appraisals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."appraisals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comparable_properties" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "appraisal_id" "uuid" NOT NULL,
    "address" "text" NOT NULL,
    "suburb" "text" NOT NULL,
    "city" "text" NOT NULL,
    "sale_date" timestamp with time zone,
    "sale_price" numeric(12,2),
    "property_type" "text" NOT NULL,
    "bedrooms" integer,
    "bathrooms" numeric(3,1),
    "land_size" numeric(10,2),
    "year_built" integer,
    "distance_km" numeric(5,2),
    "similarity_score" numeric(5,2),
    "image_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."comparable_properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."csrf_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '01:00:00'::interval) NOT NULL,
    "used" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."csrf_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "read" boolean DEFAULT false,
    "read_at" timestamp with time zone
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'customer'::"text" NOT NULL,
    "phone" "text",
    "organization" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['agent'::"text", 'customer'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "access_level" "text" NOT NULL,
    "granted_by" "uuid" NOT NULL,
    CONSTRAINT "property_access_access_level_check" CHECK (("access_level" = ANY (ARRAY['viewer'::"text", 'editor'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."property_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "appraisal_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" integer,
    "version" integer DEFAULT 1 NOT NULL,
    "is_current" boolean DEFAULT true,
    "status" "text" DEFAULT 'generating'::"text" NOT NULL,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "reports_status_check" CHECK (("status" = ANY (ARRAY['generating'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    CONSTRAINT "team_members_role_check" CHECK (("role" = ANY (ARRAY['member'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "owner_id" "uuid" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appraisal_history"
    ADD CONSTRAINT "appraisal_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appraisals"
    ADD CONSTRAINT "appraisals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comparable_properties"
    ADD CONSTRAINT "comparable_properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."csrf_tokens"
    ADD CONSTRAINT "csrf_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_access"
    ADD CONSTRAINT "property_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_access"
    ADD CONSTRAINT "property_access_property_id_user_id_key" UNIQUE ("property_id", "user_id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_user_id_key" UNIQUE ("team_id", "user_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



CREATE INDEX "appraisals_address_idx" ON "public"."appraisals" USING "gin" ("to_tsvector"('"english"'::"regconfig", (((("property_address" || ' '::"text") || "property_suburb") || ' '::"text") || "property_city")));



CREATE INDEX "appraisals_property_idx" ON "public"."appraisals" USING "btree" ("property_id");



CREATE INDEX "appraisals_status_idx" ON "public"."appraisals" USING "btree" ("status");



CREATE INDEX "appraisals_team_idx" ON "public"."appraisals" USING "btree" ("team_id");



CREATE INDEX "appraisals_user_idx" ON "public"."appraisals" USING "btree" ("user_id");



CREATE INDEX "comparable_properties_appraisal_idx" ON "public"."comparable_properties" USING "btree" ("appraisal_id");



CREATE INDEX "comparable_similarity_idx" ON "public"."comparable_properties" USING "btree" ("similarity_score");



CREATE INDEX "csrf_tokens_token_idx" ON "public"."csrf_tokens" USING "btree" ("token");



CREATE INDEX "csrf_tokens_user_id_idx" ON "public"."csrf_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_appraisals_property_id" ON "public"."appraisals" USING "btree" ("property_id");



CREATE INDEX "idx_appraisals_user_id" ON "public"."appraisals" USING "btree" ("user_id");



CREATE INDEX "idx_comparable_properties_appraisal_id" ON "public"."comparable_properties" USING "btree" ("appraisal_id");



CREATE INDEX "idx_properties_owner_id" ON "public"."properties" USING "btree" ("owner_id");



CREATE INDEX "idx_team_members_team_id" ON "public"."team_members" USING "btree" ("team_id");



CREATE INDEX "idx_team_members_user_id" ON "public"."team_members" USING "btree" ("user_id");



CREATE INDEX "profiles_role_idx" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "properties_address_idx" ON "public"."properties" USING "gin" ("to_tsvector"('"english"'::"regconfig", (((("address" || ' '::"text") || "suburb") || ' '::"text") || "city")));



CREATE INDEX "properties_owner_idx" ON "public"."properties" USING "btree" ("owner_id");



CREATE INDEX "properties_status_idx" ON "public"."properties" USING "btree" ("status");



CREATE INDEX "properties_type_idx" ON "public"."properties" USING "btree" ("property_type");



CREATE INDEX "property_access_property_id_idx" ON "public"."property_access" USING "btree" ("property_id");



CREATE INDEX "property_access_user_id_idx" ON "public"."property_access" USING "btree" ("user_id");



CREATE INDEX "reports_appraisal_idx" ON "public"."reports" USING "btree" ("appraisal_id");



CREATE INDEX "reports_status_idx" ON "public"."reports" USING "btree" ("status");



CREATE INDEX "reports_user_idx" ON "public"."reports" USING "btree" ("user_id");



CREATE INDEX "team_members_team_idx" ON "public"."team_members" USING "btree" ("team_id");



CREATE INDEX "team_members_user_idx" ON "public"."team_members" USING "btree" ("user_id");



CREATE INDEX "teams_owner_idx" ON "public"."teams" USING "btree" ("owner_id");



CREATE OR REPLACE TRIGGER "set_property_access_updated_at" BEFORE UPDATE ON "public"."property_access" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_appraisals_updated_at" BEFORE UPDATE ON "public"."appraisals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comparable_properties_updated_at" BEFORE UPDATE ON "public"."comparable_properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_properties_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reports_updated_at" BEFORE UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_team_members_updated_at" BEFORE UPDATE ON "public"."team_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."appraisal_history"
    ADD CONSTRAINT "appraisal_history_appraisal_id_fkey" FOREIGN KEY ("appraisal_id") REFERENCES "public"."appraisals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisal_history"
    ADD CONSTRAINT "appraisal_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appraisals"
    ADD CONSTRAINT "appraisals_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."appraisals"
    ADD CONSTRAINT "appraisals_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appraisals"
    ADD CONSTRAINT "appraisals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."comparable_properties"
    ADD CONSTRAINT "comparable_properties_appraisal_id_fkey" FOREIGN KEY ("appraisal_id") REFERENCES "public"."appraisals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."csrf_tokens"
    ADD CONSTRAINT "csrf_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_access"
    ADD CONSTRAINT "property_access_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."property_access"
    ADD CONSTRAINT "property_access_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."property_access"
    ADD CONSTRAINT "property_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_appraisal_id_fkey" FOREIGN KEY ("appraisal_id") REFERENCES "public"."appraisals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "allow_delete_own_profile" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((("id" = "auth"."uid"()) AND "public"."is_csrf_safe"()));



CREATE POLICY "allow_insert_own_profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((("id" = "auth"."uid"()) AND "public"."is_csrf_safe"()));



CREATE POLICY "allow_read_own_profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "allow_update_own_profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK ((("id" = "auth"."uid"()) AND "public"."is_csrf_safe"()));



ALTER TABLE "public"."appraisal_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."appraisals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appraisals_delete_own" ON "public"."appraisals" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "appraisals_insert" ON "public"."appraisals" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "appraisals_insert_own" ON "public"."appraisals" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "appraisals_read_own" ON "public"."appraisals" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "appraisals_read_public" ON "public"."appraisals" FOR SELECT USING (("is_public" = true));



CREATE POLICY "appraisals_read_team" ON "public"."appraisals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."team_members"
     JOIN "public"."teams" ON (("team_members"."team_id" = "teams"."id")))
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("teams"."owner_id" = "appraisals"."user_id")))));



CREATE POLICY "appraisals_update_own" ON "public"."appraisals" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "appraisals_view_own" ON "public"."appraisals" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."comparable_properties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comparable_properties_delete" ON "public"."comparable_properties" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."appraisals"
  WHERE (("appraisals"."id" = "comparable_properties"."appraisal_id") AND ("appraisals"."user_id" = "auth"."uid"())))));



CREATE POLICY "comparable_properties_insert" ON "public"."comparable_properties" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."appraisals"
  WHERE (("appraisals"."id" = "comparable_properties"."appraisal_id") AND ("appraisals"."user_id" = "auth"."uid"())))));



CREATE POLICY "comparable_properties_read" ON "public"."comparable_properties" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."appraisals"
  WHERE (("appraisals"."id" = "comparable_properties"."appraisal_id") AND (("appraisals"."user_id" = "auth"."uid"()) OR ("appraisals"."is_public" = true) OR (EXISTS ( SELECT 1
           FROM ("public"."team_members"
             JOIN "public"."teams" ON (("team_members"."team_id" = "teams"."id")))
          WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("teams"."owner_id" = "appraisals"."user_id")))))))));



CREATE POLICY "comparable_properties_update" ON "public"."comparable_properties" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."appraisals"
  WHERE (("appraisals"."id" = "comparable_properties"."appraisal_id") AND ("appraisals"."user_id" = "auth"."uid"())))));



CREATE POLICY "create_own_properties" ON "public"."properties" FOR INSERT TO "authenticated" WITH CHECK ((("owner_id" = "auth"."uid"()) AND "public"."is_csrf_safe"()));



CREATE POLICY "csrf_protection_appraisal_history" ON "public"."appraisal_history" TO "authenticated" USING ("public"."is_csrf_safe"());



CREATE POLICY "csrf_protection_appraisals" ON "public"."appraisals" TO "authenticated" USING ("public"."is_csrf_safe"());



CREATE POLICY "csrf_protection_comparable_properties" ON "public"."comparable_properties" TO "authenticated" USING ("public"."is_csrf_safe"());



CREATE POLICY "csrf_protection_notifications" ON "public"."notifications" TO "authenticated" USING ("public"."is_csrf_safe"());



CREATE POLICY "csrf_protection_property_access" ON "public"."property_access" TO "authenticated" USING ("public"."is_csrf_safe"());



CREATE POLICY "csrf_protection_reports" ON "public"."reports" TO "authenticated" USING ("public"."is_csrf_safe"());



CREATE POLICY "csrf_protection_team_members" ON "public"."team_members" TO "authenticated" USING ("public"."is_csrf_safe"());



CREATE POLICY "csrf_protection_teams" ON "public"."teams" TO "authenticated" USING ("public"."is_csrf_safe"());



ALTER TABLE "public"."csrf_tokens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_own_properties" ON "public"."properties" FOR DELETE TO "authenticated" USING ((("owner_id" = "auth"."uid"()) AND "public"."is_csrf_safe"()));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete" ON "public"."notifications" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "notifications_insert" ON "public"."notifications" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "notifications_select" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "notifications_update" ON "public"."notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_access" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "read_own_properties" ON "public"."properties" FOR SELECT TO "authenticated" USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "read_own_tokens" ON "public"."csrf_tokens" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_members_insert" ON "public"."team_members" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "team_members"."team_id") AND (("teams"."owner_id" = "auth"."uid"()) OR "public"."is_team_admin"("teams"."id", "auth"."uid"()))))));



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teams_delete_own" ON "public"."teams" FOR DELETE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "teams_insert" ON "public"."teams" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'agent'::"text")))));



CREATE POLICY "teams_read_own" ON "public"."teams" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "teams"."id") AND ("team_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "teams_update_own" ON "public"."teams" FOR UPDATE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "update_own_properties" ON "public"."properties" FOR UPDATE TO "authenticated" USING (("owner_id" = "auth"."uid"())) WITH CHECK ((("owner_id" = "auth"."uid"()) AND "public"."is_csrf_safe"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."apply_csrf_protection"() TO "anon";
GRANT ALL ON FUNCTION "public"."apply_csrf_protection"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_csrf_protection"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_csrf_tokens"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_csrf_tokens"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_csrf_tokens"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_request_context"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_request_context"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_request_context"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_csrf_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_csrf_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_csrf_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_csrf_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_csrf_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_csrf_token"() TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_properties"("team_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_properties"("team_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_properties"("team_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_csrf_safe"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_csrf_safe"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_csrf_safe"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_team_admin"("team_id" "uuid", "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_team_admin"("team_id" "uuid", "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_team_admin"("team_id" "uuid", "user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_csrf_token"("token_to_verify" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_csrf_token"("token_to_verify" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_csrf_token"("token_to_verify" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."appraisal_history" TO "anon";
GRANT ALL ON TABLE "public"."appraisal_history" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisal_history" TO "service_role";



GRANT ALL ON TABLE "public"."appraisals" TO "anon";
GRANT ALL ON TABLE "public"."appraisals" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisals" TO "service_role";



GRANT ALL ON TABLE "public"."comparable_properties" TO "anon";
GRANT ALL ON TABLE "public"."comparable_properties" TO "authenticated";
GRANT ALL ON TABLE "public"."comparable_properties" TO "service_role";



GRANT ALL ON TABLE "public"."csrf_tokens" TO "anon";
GRANT ALL ON TABLE "public"."csrf_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."csrf_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."property_access" TO "anon";
GRANT ALL ON TABLE "public"."property_access" TO "authenticated";
GRANT ALL ON TABLE "public"."property_access" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
