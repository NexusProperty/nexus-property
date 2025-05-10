// Mock Supabase client for Deno tests
export function createMockSupabaseClient({ user = null, profileRole = 'customer', insertResult = {} } = {}) {
  return {
    auth: {
      getUser: async () => ({ data: { user } }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { role: profileRole },
            error: null,
          }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: insertResult,
            error: null,
          }),
        }),
      }),
    }),
  };
}

globalThis.createMockSupabaseClient = createMockSupabaseClient; 