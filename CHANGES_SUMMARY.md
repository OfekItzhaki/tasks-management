# Task Management UI Improvements - Changes Summary

## Date: February 8, 2026

### Changes Implemented

#### 1. ✅ Hide CREATE/CANCEL Window After Save

**Status:** Already implemented (verified)

- **Location:** `web-app/src/pages/TasksPage.tsx` line 333
- **Behavior:** The create task form automatically closes after successful task creation via `setShowCreate(false)` in the `onSuccess` callback

#### 1b. ✅ Hide CREATE Window Immediately When User Clicks CREATE

**Problem:** After clicking CREATE, the form stayed visible while the task was being created, confusing users
**Solution:**

- **Location:** `web-app/src/pages/TasksPage.tsx` - `createTaskMutation.onMutate`
- **Implementation:**
  - Hide form immediately in `onMutate` (before API call)
  - Clear input field immediately
  - Show form again in `onError` if creation fails (so user can retry)
- **User Experience:** Form disappears instantly when user clicks CREATE, showing only the optimistic task

#### 2. ✅ Changed "Delete immediately" to "Delete forever"

**Files Modified:**

- `frontend-services/src/i18n/en.ts` - Line 70
  - Changed: `policyDelete: 'Delete immediately'`
  - To: `policyDelete: 'Delete forever'`
- `frontend-services/src/i18n/he.ts` - Line 70
  - Changed: `policyDelete: 'מחק מיד'`
  - To: `policyDelete: 'מחק לצמיתות'`

#### 3. ✅ Separate One-off and Recurring Tasks in Done/Trash Views

**Files Modified:**

- `frontend-services/src/i18n/en.ts`
  - Added: `oneOffTasks: 'One-off Tasks'`
  - Added: `recurringTasks: 'Recurring Tasks'`
  - Added: `unknownList: 'Unknown List'`

- `frontend-services/src/i18n/he.ts`
  - Added: `oneOffTasks: 'משימות חד פעמיות'`
  - Added: `recurringTasks: 'משימות חוזרות'`
  - Added: `unknownList: 'רשימה לא ידועה'`

- `web-app/src/pages/TasksPage.tsx` (lines 890-1050)
  - **Updated grouping logic** to create nested groups:
    - First level: Group by source list name
    - Second level: Separate into "One-off Tasks" and "Recurring Tasks" sections
  - **Implementation details:**
    - Changed data structure from `Record<string, Task[]>` to `Record<string, { oneOff: Task[]; recurring: Task[] }>`
    - Determines task type based on source list's `taskBehavior` property
    - Renders two subsections per list group with appropriate headers
    - Each subsection only renders if it contains tasks

**Note:** After restarting web-app, translations should show correctly instead of literal "tasks.oneOffTasks"

#### 4. ✅ Fixed "Task not found" Error (Clicking Optimistic Tasks)

**Problem:** When clicking a newly created task (optimistic task with negative ID) before it gets a real ID from the server, navigation would fail with "Task not found"

**Solution:**

- **Location:** `web-app/src/pages/TasksPage.tsx`
- **Fix Applied:** Added check in `onClick` handler to prevent navigation for optimistic tasks:
  ```typescript
  onClick={() => {
    // Prevent navigation for optimistic tasks
    if (typeof task.id === 'number' && task.id < 0) {
      return;
    }
    navigate(`/tasks/${task.id}`);
  }}
  ```
- **Applied to:** Both grouped view (Done/Trash) and standard view
- **Note:** The `SortableTaskItem` component already has `pointer-events-none` for optimistic tasks, providing additional protection

#### 5. ✅ Fixed Task List Flash/Stale Data Issue

**Problem:** When navigating between lists, old tasks would briefly appear before being replaced with the correct tasks
**Solution:**

- **Location:** `web-app/src/pages/TasksPage.tsx`
- **Changes:**
  1. Show loading skeleton ONLY on initial page load (`isLoading`)
  2. During background refetches (create, complete, delete), show a subtle loading bar at the top
  3. Keep current tasks visible during updates - no page reload
  4. Added `isRefetching` state to detect background updates
  5. Added fixed position loading bar that appears during refetches
- **User Experience:**
  - Initial load: Full skeleton (as before)
  - Creating/completing/deleting tasks: Subtle loading bar at top, tasks stay visible
  - No jarring page reloads or flashing
  - Smooth, continuous experience

### Visual Changes

#### Before:

- "Delete immediately" text in list settings
- Tasks in Done/Trash grouped only by source list
- Clicking optimistic tasks caused "Task not found" error
- Create form stayed visible while task was being created
- Old tasks briefly appeared when switching lists

#### After:

- "Delete forever" text in list settings (more clear and permanent-sounding)
- Tasks in Done/Trash grouped by:
  1. Source list (main header)
  2. Task type subsections:
     - "One-off Tasks" (for ONE_OFF behavior lists)
     - "Recurring Tasks" (for RECURRING behavior lists)
- Clicking optimistic tasks is prevented (no error)
- Create form disappears immediately when user clicks CREATE
- Loading skeleton shown instead of stale data when switching lists

### Testing Recommendations

1. **Test "Delete forever" text:**
   - Go to Lists page
   - Create or edit a list
   - Check that completion policy shows "Delete forever" instead of "Delete immediately"

2. **Test task grouping in Done/Trash:**
   - Create multiple lists with different task behaviors (one-off and recurring)
   - Add tasks to these lists
   - Complete tasks (they go to Done list)
   - Delete tasks (they go to Trash)
   - Verify tasks are grouped by source list AND separated into one-off/recurring sections

3. **Test optimistic task clicking:**
   - Create a new task
   - Immediately try to click it before it finishes saving
   - Verify no "Task not found" error appears
   - Wait for task to save, then click - should navigate correctly

4. **Test create form hiding:**
   - Click "New Task" button
   - Type a task description
   - Click CREATE
   - Verify form disappears immediately (not after API response)
   - Verify optimistic task appears in the list

5. **Test no stale data flash:**
   - Create tasks in List A
   - Create different tasks in List B
   - Navigate from List A to List B
   - Verify you see loading skeleton, NOT List A's tasks briefly
   - Verify List B's tasks appear after loading

### Files Changed

1. `frontend-services/src/i18n/en.ts`
2. `frontend-services/src/i18n/he.ts`
3. `web-app/src/pages/TasksPage.tsx`

### Build Status

✅ Frontend services build: SUCCESS
✅ TypeScript compilation: No errors
✅ No diagnostics found

### Next Steps

- **IMPORTANT:** Restart the web-app development server to see all changes:
  1. Stop the frontend PowerShell window (Ctrl+C)
  2. Run `.\dev.ps1` to restart everything
  3. Or manually: `cd web-app; npm run dev`
- Test all five improvements manually
- Verify translations work correctly in both English and Hebrew
- Verify no stale data appears when switching between lists

#### 6. ✅ Restrict Recurring Tasks from Done/Delete Forever

**Problem:** Recurring tasks shouldn't be moved to Done or deleted forever - they should always stay in their list
**Solution:**

- **Files Modified:**
  - `web-app/src/pages/ListsPage.tsx`
  - `web-app/src/pages/TasksPage.tsx`

**Implementation:**

1. **Disabled completion policy dropdown for recurring lists:**
   - Added `disabled={taskBehavior === TaskBehavior.RECURRING}` to completion policy select
   - Added visual feedback (opacity-50, cursor-not-allowed)
   - Added tooltip explaining the restriction

2. **Auto-set policy to KEEP for recurring lists:**
   - Added `useEffect` that watches `taskBehavior` changes
   - Automatically sets `completionPolicy` to `KEEP` when behavior changes to `RECURRING`
   - Applied in both ListsPage (create) and TasksPage (edit)

3. **User Experience:**
   - When user selects "Recurring" task behavior, completion policy automatically changes to "Keep tasks"
   - Completion policy dropdown becomes disabled and grayed out
   - Hovering shows tooltip: "Recurring tasks must use 'Keep tasks' policy"
   - Users cannot select "Move to Done" or "Delete forever" for recurring lists

**Why this matters:**

- Recurring tasks are meant to repeat - they shouldn't disappear when completed
- Prevents user confusion about where recurring tasks went
- Enforces the correct workflow for recurring vs one-off tasks
