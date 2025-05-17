# Nexus Property Project - Linter Issues Task List

## Progress Summary

### Fixes Implemented
1. **memory-bank/CoreLogic-API/enhanced-benchmark.ts**:
   - Created a properly typed interface `PropertyResults` using `ReturnType<typeof createPropertyDataResponse>` to replace the `any` type
   - Changed `catch (error)` to `catch (error: unknown)` to use a more type-safe approach

2. **memory-bank/CoreLogic-API/test-edge-function.ts**:
   - Replaced all instances of `any` with `unknown` in Jest type declarations
   - More specific typing for Jest mock functions

3. **src/components/properties/MultiStepPropertyForm.tsx**:
   - Replaced `z.ZodObject<any>` with `z.ZodObject<z.ZodRawShape>` for better type safety
   - Changed `form.trigger(currentFields as any)` to `form.trigger(currentFields as Array<keyof PropertyFormValues>)`

4. **eslint.config.js**:
   - Added a commented suggestion for a more gradual transition by making the `no-explicit-any` rule a warning during development

### Next Steps
Continue working through the remaining files in the task list, focusing on the following patterns:
- Replace `any` with `unknown` when the exact type is unclear
- Create appropriate interfaces or type aliases for more complex structures
- Use generics where applicable
- Consider using type predicates and type guards to narrow types safely

## Overview
This document catalogs all linter issues found in the codebase using `npm run lint`. The issues are categorized by type for easier prioritization and resolution.

## ESLint Configuration
Current settings in `eslint.config.js` and `tsconfig` files show:
- TypeScript is configured with `noImplicitAny: false` in tsconfig files
- ESLint is configured with `@typescript-eslint/no-unused-vars: "off"`

## Issue Categories

### 1. TypeScript 'any' Type Issues (39)
The `@typescript-eslint/no-explicit-any` rule is being enforced despite `noImplicitAny: false` in tsconfig.

| File | Line | Issue |
|------|------|-------|
| memory-bank/CoreLogic-API/enhanced-benchmark.ts | 235:22 | Unexpected any |
| memory-bank/CoreLogic-API/test-edge-function.ts | 34:32, 34:47, 34:55 | Unexpected any |
| src/components/properties/MultiStepPropertyForm.tsx | 88:23, 205:43 | Unexpected any |
| src/tests/components/ProtectedRoute.test.tsx | 104:22, 105:19, 145:22, 146:19, 186:22, 187:19 | Unexpected any |
| src/tests/integration/auth-context.test.tsx | 122:12, 131:14 | Unexpected any |
| src/tests/mock-test.ts | 5:48 | Unexpected any |
| src/tests/performance/api-performance.test.ts | 13:26, 34:26 | Unexpected any |
| src/tests/security/api-access-control.test.ts | 57:22 | Unexpected any |
| src/tests/security/rls-policy.test.ts | 76:22 | Unexpected any |
| src/utils/lazyLoad.tsx | 12:50, 118:100, 120:42, 126:49 | Unexpected any |
| supabase/functions/generate-report/index.ts | 19:36, 20:35, 21:37 | Unexpected any |
| supabase/functions/property-data/circuit-breaker.ts | 202:39 | Unexpected any |
| supabase/functions/property-data/corelogic-service.ts | Multiple lines | 10 instances of unexpected any |
| supabase/functions/utils/prompt-generator.ts | 362:4, 395:49, 415:52 | Unexpected any |
| src/hooks/useRealtimeSubscription.ts | 63:31 | Unexpected any |

### 2. React Hook Dependency Issues (4)
Missing or incorrect dependencies in useEffect hooks.

| File | Line | Issue |
|------|------|-------|
| src/components/appraisals/AppraisalDetail.tsx | 367:6 | Missing dependency: 'fetchAppraisal' |
| src/components/properties/PropertyAccess.tsx | 86:6 | Missing dependency: 'fetchPropertyAccess' |
| src/hooks/useKeyboardNavigation.ts | 55:35 | useEffect has a spread element in dependency array |
| src/hooks/useRealtimeSubscription.ts | 116:6, 116:22 | Missing dependency and complex expression in array |

### 3. React Refresh Issues (14)
Components that export both React components and other items causing refresh issues.

| File | Line | Issue |
|------|------|-------|
| src/components/ui/badge.tsx | 36:17 | Fast refresh only works when a file only exports components |
| src/components/ui/button.tsx | 56:18 | Fast refresh only works when a file only exports components |
| src/components/ui/error-message.tsx | 6:13 | Fast refresh only works when a file only exports components |
| src/components/ui/feedback-system.tsx | 121:14 | Fast refresh only works when a file only exports components |
| src/components/ui/form-elements.tsx | 468:17, 479:17 | Fast refresh only works when a file only exports components |
| src/components/ui/form.tsx | 168:3 | Fast refresh only works when a file only exports components |
| src/components/ui/navigation-menu.tsx | 119:3 | Fast refresh only works when a file only exports components |
| src/components/ui/sidebar.tsx | 760:3 | Fast refresh only works when a file only exports components |
| src/components/ui/sonner.tsx | 29:19 | Fast refresh only works when a file only exports components |
| src/components/ui/toggle.tsx | 43:18 | Fast refresh only works when a file only exports components |
| src/contexts/AuthContext.tsx | 36:14 | Fast refresh only works when a file only exports components |
| src/tests/utils/test-utils.tsx | 8:7, 34:1 | Fast refresh warnings for component exports |
| src/utils/lazyLoad.tsx | 12:17, 118:17 | Fast refresh only works when a file only exports components |

### 4. Empty Interface Issues (2)

| File | Line | Issue |
|------|------|-------|
| src/components/ui/command.tsx | 24:11 | Interface declaring no members is equivalent to its supertype |
| src/components/ui/textarea.tsx | 5:18 | Interface declaring no members is equivalent to its supertype |

### 5. TypeScript Comment Issues (6)
Using @ts-ignore instead of the recommended @ts-expect-error.

| File | Line | Issue |
|------|------|-------|
| src/services/notification.ts | 62:1, 65:1 | Use @ts-expect-error instead of @ts-ignore |
| src/tests/services/appraisal.test.ts | 271:7, 275:7, 442:7, 446:7 | Use @ts-expect-error instead of @ts-ignore |

### 6. Unused ESLint Disable Directives (8)
Directives that do nothing.

| File | Line | Issue |
|------|------|-------|
| src/tests/services/auth.test.ts | Multiple lines | 8 unused eslint-disable directives |

### 7. Other Issues (3)

| File | Line | Issue |
|------|------|-------|
| src/tests/security/role-access.test.ts | 14:9 | Parsing error: '>' expected |
| supabase/functions/property-data/corelogic-transformers.ts | 128:7 | 'addressParts' is never reassigned. Use 'const' |
| tailwind.config.ts | 95:12 | A require() style import is forbidden |

## Proposed Fixes

### Short-term Fixes
1. Fix the parsing error in `src/tests/security/role-access.test.ts` which is likely breaking the build.
2. Replace @ts-ignore with @ts-expect-error where needed.
3. Fix 'const' vs 'let' variable declaration in corelogic-transformers.ts.
4. Fix the require() style import in tailwind.config.ts.

### Medium-term Fixes
1. Fix React Hook dependency issues to prevent potential bugs.
2. Resolve empty interface issues.
3. Address unused ESLint disable directives.

### Long-term Fixes
1. Gradually replace `any` types with proper type definitions.
2. Refactor UI component files to separate component exports from utilities/constants.

## Configuration Recommendations
Consider updating the ESLint configuration:

```javascript
// In eslint.config.js
rules: {
  "@typescript-eslint/no-explicit-any": process.env.NODE_ENV === 'production' ? "error" : "warn",
  // Other rules...
}
```

This would allow development with 'any' types while warning about them, but fail in production builds to maintain code quality. 