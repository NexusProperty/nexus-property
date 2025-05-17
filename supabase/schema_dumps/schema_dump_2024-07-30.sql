

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






CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


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
    CONSTRAINT "properties_property_type_check" CHECK (("property_type" = ANY (ARRAY['house'::"text", 'apartment'::"text", 'townhouse'::"text", 'land'::"text", 'commercial'::"text", 'other'::"text"]))),
    CONSTRAINT "properties_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'archived'::"text", 'draft'::"text"])))
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


ALTER TABLE "public"."reports" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."reports_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



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


ALTER TABLE ONLY "public"."appraisals"
    ADD CONSTRAINT "appraisals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comparable_properties"
    ADD CONSTRAINT "comparable_properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "appraisals_team_idx" ON "public"."appraisals" USING "btree" ("team_id");



CREATE INDEX "appraisals_user_idx" ON "public"."appraisals" USING "btree" ("user_id");



CREATE INDEX "idx_appraisals_property_id" ON "public"."appraisals" USING "btree" ("property_id");



CREATE INDEX "idx_appraisals_user_id" ON "public"."appraisals" USING "btree" ("user_id");



CREATE INDEX "idx_comparable_properties_appraisal_id" ON "public"."comparable_properties" USING "btree" ("appraisal_id");



CREATE INDEX "idx_properties_owner_id" ON "public"."properties" USING "btree" ("owner_id");



CREATE INDEX "idx_team_members_team_id" ON "public"."team_members" USING "btree" ("team_id");



CREATE INDEX "idx_team_members_user_id" ON "public"."team_members" USING "btree" ("user_id");



CREATE INDEX "profiles_role_idx" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "properties_address_idx" ON "public"."properties" USING "gin" ("to_tsvector"('"english"'::"regconfig", (((("address" || ' '::"text") || "suburb") || ' '::"text") || "city")));



CREATE OR REPLACE TRIGGER "update_appraisals_updated_at" BEFORE UPDATE ON "public"."appraisals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_comparable_properties_updated_at" BEFORE UPDATE ON "public"."comparable_properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_properties_updated_at" BEFORE UPDATE ON "public"."properties" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_team_members_updated_at" BEFORE UPDATE ON "public"."team_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."appraisals"
    ADD CONSTRAINT "appraisals_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id");



ALTER TABLE ONLY "public"."appraisals"
    ADD CONSTRAINT "appraisals_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."appraisals"
    ADD CONSTRAINT "appraisals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."comparable_properties"
    ADD CONSTRAINT "comparable_properties_appraisal_id_fkey" FOREIGN KEY ("appraisal_id") REFERENCES "public"."appraisals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."appraisals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appraisals_insert" ON "public"."appraisals" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "appraisals_read_own" ON "public"."appraisals" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "appraisals_read_public" ON "public"."appraisals" FOR SELECT USING (("is_public" = true));



CREATE POLICY "appraisals_read_team" ON "public"."appraisals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."team_members"
     JOIN "public"."teams" ON (("team_members"."team_id" = "teams"."id")))
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("teams"."owner_id" = "appraisals"."user_id")))));



CREATE POLICY "appraisals_update_own" ON "public"."appraisals" FOR UPDATE USING (("user_id" = "auth"."uid"()));



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



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete" ON "public"."notifications" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "notifications_insert" ON "public"."notifications" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "notifications_select" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "notifications_update" ON "public"."notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_read_all_admin" ON "public"."profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))));



CREATE POLICY "profiles_read_own" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "properties_read_own" ON "public"."properties" FOR SELECT USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "properties_read_public" ON "public"."properties" FOR SELECT USING (("is_public" = true));



CREATE POLICY "properties_read_team" ON "public"."properties" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."team_members"
     JOIN "public"."teams" ON (("team_members"."team_id" = "teams"."id")))
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("teams"."owner_id" = "properties"."owner_id")))));



CREATE POLICY "properties_update_own" ON "public"."properties" FOR UPDATE USING (("owner_id" = "auth"."uid"()));



ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_members_insert" ON "public"."team_members" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "team_members"."team_id") AND (("teams"."owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."team_members" "team_members_1"
          WHERE (("team_members_1"."team_id" = "teams"."id") AND ("team_members_1"."user_id" = "auth"."uid"()) AND ("team_members_1"."role" = 'admin'::"text")))))))));



CREATE POLICY "team_members_read" ON "public"."team_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "team_members"."team_id") AND (("teams"."owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."team_members" "team_members_1"
          WHERE (("team_members_1"."team_id" = "teams"."id") AND ("team_members_1"."user_id" = "auth"."uid"()) AND ("team_members_1"."role" = 'admin'::"text")))))))));



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teams_delete_own" ON "public"."teams" FOR DELETE USING (("owner_id" = "auth"."uid"()));



CREATE POLICY "teams_insert" ON "public"."teams" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'agent'::"text")))));



CREATE POLICY "teams_read_own" ON "public"."teams" FOR SELECT USING ((("owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."team_id" = "teams"."id") AND ("team_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "teams_update_own" ON "public"."teams" FOR UPDATE USING (("owner_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."appraisals" TO "anon";
GRANT ALL ON TABLE "public"."appraisals" TO "authenticated";
GRANT ALL ON TABLE "public"."appraisals" TO "service_role";



GRANT ALL ON TABLE "public"."comparable_properties" TO "anon";
GRANT ALL ON TABLE "public"."comparable_properties" TO "authenticated";
GRANT ALL ON TABLE "public"."comparable_properties" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reports_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reports_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reports_id_seq" TO "service_role";



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
