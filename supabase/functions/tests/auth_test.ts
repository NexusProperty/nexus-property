import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

// Mock createClient to use our mock
import { createMockSupabaseClient } from "./mock_supabase.ts";

globalThis.createClient = () => createMockSupabaseClient({ user: { id: 'user1' }, profileRole: 'customer' });

Deno.test("returns 401 if no user is present", async () => {
  globalThis.createClient = () => createMockSupabaseClient({ user: null });
  const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({ property_address: "123 Main St" }) });
  const mod = await import("../create-appraisal/index.ts");
  const resp = await mod.default(req);
  assertEquals(resp.status, 401);
});

Deno.test("returns 200 for valid user and property_address", async () => {
  globalThis.createClient = () => createMockSupabaseClient({ user: { id: 'user1' }, profileRole: 'customer', insertResult: { id: 1 } });
  const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({ property_address: "123 Main St" }) });
  const mod = await import("../create-appraisal/index.ts");
  const resp = await mod.default(req);
  assertEquals(resp.status, 200);
});

Deno.test("returns 400 if property_address is missing", async () => {
  globalThis.createClient = () => createMockSupabaseClient({ user: { id: 'user1' } });
  const req = new Request("http://localhost", { method: "POST", body: JSON.stringify({}) });
  const mod = await import("../create-appraisal/index.ts");
  const resp = await mod.default(req);
  assertEquals(resp.status, 400);
}); 