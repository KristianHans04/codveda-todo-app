# Level-2-Todo-App

A full-featured task manager built with HTML, CSS, and vanilla JavaScript. Supports Create, Read, Update, and Delete operations with automatic `localStorage` persistence, filtering tabs, inline editing, and a dark-themed Codveda UI.

## Features

- **Create:** Add tasks via form input. IDs generated with `crypto.randomUUID()`.
- **Read:** Tasks rendered from state array with HTML escaping to prevent XSS.
- **Update:** Click the edit button or the task text to switch to inline editing. Commits on blur or Enter, cancels on Escape.
- **Delete:** Remove individual tasks or bulk-clear all completed tasks.
- **Toggle Completion:** Custom checkbox toggles completed state with visual line-through and green indicator.
- **Filtering:** All, Active, Completed tabs with live count badges.
- **Persistence:** State automatically saved to and loaded from `localStorage` on every mutation.
- **Event Delegation:** A single click listener on the task list container handles toggle, edit, and delete actions.

## Tech Stack

| Layer     | Technology                       |
| --------- | -------------------------------- |
| Structure | HTML5 (semantic, accessible)     |
| Styling   | CSS3 (custom properties, dark theme, transitions) |
| Scripting | Vanilla JavaScript (CRUD, localStorage, event delegation) |
| Fonts     | Inter (Google Fonts)             |
| Design    | Codveda brand palette (dark navy) |

## File Structure

```
Level-2-Todo-App/
  index.html              Task manager page
  styles/
    styles.css             Dark-themed UI with custom checkbox and filter tabs
  scripts/
    app.js                 CRUD logic, localStorage sync, filtering, inline editing
  README.md
```

## Getting Started

```bash
git clone https://github.com/KristianHans04/codveda-todo-app.git
cd codveda-todo-app
npx serve .
```

Tasks persist in `localStorage` across browser sessions.

## Accessibility

- Skip-to-content link for keyboard users.
- ARIA roles on filter tabs (`tablist`, `tab`), task list (`list`), and empty state (`status`).
- Task actions have descriptive `aria-label` attributes.
- Inline edit input receives focus automatically and supports Enter/Escape.

## License

This project is part of the Codveda Web Development Internship program.
