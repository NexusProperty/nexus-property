import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createMockSupabaseClient } from "./mock_supabase.ts";

globalThis.createClient = () => createMockSupabaseClient({ user: { id: 'user1' }, profileRole: 'agent', insertResult: { id: 2 } });

Deno.test("orchestrates user, profile, and appraisal creation successfully", async () => {
  globalThis.createClient = () => createMockSupabaseClient({ user: { id: 'user1' }, profileRole: 'agent', insertResult: { id: 2 } });
  const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({ property_address: "456 Main St" }) });
  const mod = await import("../create-appraisal/index.ts");
  const resp = await mod.default(req);
  assertEquals(resp.status, 200);
});

Deno.test("returns 500 if any orchestration step fails", async () => {
  // Simulate error in profile fetch
  globalThis.createClient = () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'user1' } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: 'profile error' }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: { id: 2 }, error: null }),
        }),
      }),
    }),
  });
  const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({ property_address: "456 Main St" }) });
  const mod = await import("../create-appraisal/index.ts");
  const resp = await mod.default(req);
  assertEquals(resp.status, 500);
}); 