# Frontend Developer Documentation

## Overview
This frontend powers the Modern Pharmacy Management System. It is built with React, MUI, and Redux/Context, providing a modern, responsive, and accessible UI for all pharmacy operations.

---

## Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev` (for development)
4. `npm run build` (for production)
5. Configure API base URL in `src/constants.tsx`

---

## Architecture
- **Pages:** All routes in `src/pages`, modular by feature (pharmacy, store, wholesale, etc.).
- **Components:** Shared UI in `src/components`, design system in `src/components/UI`.
- **Modules:** Feature-based organization in `src/modules`.
- **Contexts:** Global state (auth, settings, theme) in `src/contexts`.
- **Services:** API calls in `src/services`.
- **Types:** Shared types in `src/types` and `src/lib/types.ts`.

---

## Design System
- **MUI:** Used for all core UI components, theming, and accessibility.
- **Custom Theme:** Pharmacy-specific palette, dark/light mode, accessible typography.
- **Reusable Components:** Buttons, tables, modals, forms, etc. in `src/components/UI`.
- **Responsive:** Mobile-first, grid layouts, and adaptive navigation.

---

## State Management
- **Context:** For auth, settings, and theme.
- **Redux (optional):** For complex state (e.g., notifications, global data).
- **Hooks:** Custom hooks for API/data logic.

---

## Extensibility
- **Add a Feature:**
  1. Create a new page/component/service as needed.
  2. Add routes in `src/App.tsx`.
  3. Use context or Redux for global state if needed.
  4. Update types in `src/types`.
  5. Write tests for new components/services.
- **Best Practices:**
  - Use MUI components and theme for all UI.
  - Keep components small and focused.
  - Use hooks for logic/data fetching.
  - Validate all user input.
  - Write JSDoc for all functions/components.

---

## Testing
- Use Jest and React Testing Library for unit/integration tests.
- Add tests for new features and bug fixes.

---

## Troubleshooting
- **API Issues:** Check API base URL and browser console.
- **Auth Issues:** Check token in localStorage and API responses.
- **Build Issues:** Delete `node_modules` and reinstall dependencies.

---

## Contribution
- PRs welcome! Please follow code style and add tests/docs for new features.
- For shared context and user documentation, see the main project `README.md`. 