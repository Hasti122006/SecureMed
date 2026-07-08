# MedGuard Loading Fix TODO

## Plan Summary
Fix endless loading on navigation to protected routes caused by `loading` state in AuthContext hanging due to `fetchUserData` (Supabase queries).

## Steps
- [x] **Step 1**: Update `src/contexts/AuthContext.tsx` - Add timeout (5s) to `fetchUserData`, ensure `loading=false` on timeout/error, log issues. ✅
- [x] **Step 2**: Update `src/components/ProtectedRoute.tsx` - Add loading timeout fallback. ✅
- [ ] **Step 3**: Test: Run dev server, login, navigate to /patient or /doctor.
- [ ] **Step 3**: Test: Run dev server, login, navigate to /patient or /doctor.
- [ ] **Step 4**: Check console for logs, verify no hang.
- [ ] Complete: attempt_completion.

Progress will be updated after each step.

