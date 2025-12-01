# Restore functional browser bundle and doc workflow

## What?

Fixed the browser bundle exports so `dockerParfum.dinghy.nodeType` and other APIs are properly exposed in the browser. Resolved AngularJS digest cycle conflicts and `toString()` errors that prevented smell detection and repair from working. Added local development documentation and Playwright smoke tests. Resolves #1.

## Why?

The local static web UI (`docs/index.html`) was crashing when analyzing Dockerfiles because:
1. `dockerParfum.dinghy.nodeType` was `undefined` - the Browserify bundle wasn't preserving the namespace exports
2. AngularJS `$rootScope:inprog` errors from calling `$scope.$apply()` during digest cycles
3. `toString()` errors when Printer tried to access missing `File` objects in browser context
4. No documentation for local development workflow
5. No automated tests to catch regressions

## How?

### Browser Bundle Fixes
- **Explicit `nodeType` export** (`lib/browser.ts`): Created explicit `nodeType` object with query functions and node type classes, then attached to `dinghy` export using `Object.assign()` to ensure Browserify includes it
- **Safe `toString()` wrapper** (`docs/js/dinghy.js`): Added `safeToString()` helper with try-catch fallbacks for nodes that can't be stringified in browser context
- **AngularJS digest cycle fixes**: Replaced all `$scope.$apply()` calls with `$timeout()` to avoid `$rootScope:inprog` errors when Monaco editor events trigger during digest cycles

### Build System Fixes
- **Cross-platform build** (`package.json`): Replaced `rm -rf` with `rimraf` for Windows compatibility
- **TypeScript compilation** (`tsconfig.json`): Added `skipLibCheck: true` to ignore type errors in `node_modules/@tdurieux/dinghy-diff` (complements #11's patch-package approach - see "Overlap with #11" below)
- **Missing dependency**: Added `@browserify/uglifyify` to `devDependencies`

### Documentation & Testing
- **Local development guide** (`README.md`): Added step-by-step instructions for building and serving the web UI locally
- **Playwright smoke tests** (`tests/ui/browser-smoke.spec.ts`): Created automated tests that:
  - Spin up `http-server` on port 4173
  - Navigate to the UI and paste a test Dockerfile
  - Verify `nodeType` is accessible
  - Assert smell cards appear
  - Test "Apply fix" functionality
- **Test configuration** (`playwright.config.ts`): Basic Playwright setup
- **Git ignore** (`.gitignore`): Added `playwright-report/` directory

### UI Improvements
- **Non-repairable smells** (`docs/index.html`, `docs/js/dinghy.js`): Smells without repair implementations now display with "Auto-repair not available" message instead of being hidden or causing errors

## Overlap with #11

**No overlapping work** - we solved the same TypeScript compilation errors differently:
- **#11 approach**: Used `patch-package` to fix incorrect import statements in `node_modules/@tdurieux/dinghy-diff`
- **This PR approach**: Added `skipLibCheck: true` to `tsconfig.json` to skip type checking of declaration files in `node_modules`

Both approaches are valid and complementary. The `skipLibCheck` approach is simpler and doesn't require maintaining patches, while the patch-package approach fixes the root cause. We chose `skipLibCheck` to avoid dependency on patch maintenance.

## Testing

### Manual Testing
1. ✅ `npm run build` succeeds on Windows
2. ✅ `npx http-server docs -p 4173` serves the UI
3. ✅ Browser console: `typeof window.dockerParfum.dinghy.nodeType.Q` returns `"function"`
4. ✅ Pasting Dockerfile shows smell cards
5. ✅ "Apply fix" buttons work for repairable smells
6. ✅ Non-repairable smells show informative message

### Automated Testing
```bash
npm run test:ui
# ✅ 2 passed (18.2s)
```

### Screenshots
- Browser UI showing smell cards with "Apply fix" buttons
- Console showing successful analysis without errors
- Playwright test report showing passing tests

## Files Changed

- `lib/browser.ts` - Explicit `nodeType` export
- `docs/js/dinghy.js` - AngularJS fixes, safe `toString()`, error handling
- `docs/index.html` - Conditional "Apply fix" button display
- `package.json` - Cross-platform build, Playwright dependencies
- `tsconfig.json` - `skipLibCheck` for node_modules type errors
- `README.md` - Local development documentation
- `tests/ui/browser-smoke.spec.ts` - Playwright smoke tests (new)
- `playwright.config.ts` - Playwright configuration (new)
- `.gitignore` - Playwright artifacts

## Acceptance Criteria ✅

- ✅ Manual page load shows smells
- ✅ Playwright test passes headless
- ✅ README includes local development steps
- ✅ No console errors when analyzing Dockerfiles
- ✅ "Apply fix" works for repairable smells
- ✅ Non-repairable smells display correctly

## Anything Else?

- The `content_script.js` errors visible in browser console are from browser extensions (form autofill), not from docker-parfum
- "Not implemented" warnings for `ruleMoreThanOneInstall` are expected - that rule detects smells but doesn't have a repair implementation yet
- All changes are backward compatible and don't affect CLI or API usage

