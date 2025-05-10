import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { createMockSupabaseClient } from "./mock_supabase.ts";

globalThis.createClient = () => createMockSupabaseClient({ user: { id: 'user1' }, profileRole: 'customer', insertResult: { id: 1 } });

Deno.test("returns 500 if error fetching user profile", async () => {
  // Mock profile error
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
          single: async () => ({ data: { id: 1 }, error: null }),
        }),
      }),
    }),
  });
  const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({ property_address: "123 Main St" }) });
  const mod = await import("../create-appraisal/index.ts");
  const resp = await mod.default(req);
  assertEquals(resp.status, 500);
});

Deno.test("returns 500 if error creating appraisal", async () => {
  // Mock appraisal error
  globalThis.createClient = () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'user1' } } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { role: 'customer' }, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: 'appraisal error' }),
        }),
      }),
    }),
  });
  const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({ property_address: "123 Main St" }) });
  const mod = await import("../create-appraisal/index.ts");
  const resp = await mod.default(req);
  assertEquals(resp.status, 500);
}); 