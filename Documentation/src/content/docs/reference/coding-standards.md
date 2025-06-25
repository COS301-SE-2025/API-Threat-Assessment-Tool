---
title: Coding Standards document
description: Documentation of Skill Issues' coding standards.
---
# AT-AT Coding Standards Document

## Introduction

This document defines the coding conventions and standards used across all three layers of the **AT-AT (API Threat Assessment Tool)** project to ensure our code is uniform, clear, reliable and efficient, which includes:

- A **JavaScript-based REST API** (Node.js + Express)
- A **Python engine** for API threat analysis
- A **React-based frontend** user interface

---

## 1. JavaScript API (Node.js + Express)

### Code Style

- **Indentation:** 2 spaces
- **Semicolons:** Always use
- **Quotes:** Single quotes preferred
- **Trailing commas:** Required in multiline constructs
- **Brace style:** Always use braces for blocks

```js
// Good
if (user) {
  return true;
}
```

### Naming Conventions

- `camelCase` for variables, functions and filenames
- UPPER\_SNAKE\_CASE for environment variables

### Comments

Single-Line Comments: Use ' // ' for single-line commments
Multi-Line Comments: Use ' /* ... */' for multi-line comments

**Example of Comments from coverage.js**
```js
// scripts/coverage.js - Coverage Analysis Helper

/**
 * Parse coverage summary and display formatted results
 */
function displayCoverageSummary() { ... }
```

### Error Handling

For error handling, try-catch statements are used to ensure errors are properly caught and handled.


---

## 2. Python Engine

### Code Style

- Follow **PEP8** standards
- Indentation: 4 spaces

### Naming Conventions

- `snake_case` for variables, functions, and filenames
- `PascalCase` for class names

### Docstrings

Use triple-quoted docstrings following PEP257:

```python
def analyze_spec(file_path):
    """
    Analyze an OpenAPI spec for threats.

    Args:
        file_path (str): Path to the spec file

    Returns:
        dict: Analysis results
    """
    pass
```

### Logging

Use the `logging` module instead of `print()` for production logs:

```python
import logging
logging.info("Spec uploaded successfully")
```

### Imports

- Standard imports first, third-party next, local modules last

```python
import os
import yaml
from engine.scanner import ThreatScanner
```

---

## 3. React Frontend

### Folder Structure

Organize by feature, not file type. Example:

```sh
/src
  /components
    Navbar.jsx
    TagEditor.jsx
  /pages
    UploadPage.jsx
    ReportPage.jsx
  /assets
    logo.svg
  /styles
    global.css
```

### JavaScript & JSX

- Use `camelCase` for functions and variables
- Use `PascalCase` for components
- Use arrow functions for components
- Keep components focused and reusable

```jsx
const UploadForm = () => {
  return <form>...</form>;
};
```

### CSS

- Use CSS Modules or component-level styles
- Use `kebab-case` for class names
- Example: `tag-list.module.css`

### State & Props

- Use `useState`, `useEffect`, `useContext` appropriately
- Validate props with `PropTypes` or TypeScript if used

### API Integration

Use a dedicated `api.js` or `services/` folder for API calls:

```js
export const fetchEndpoints = async (apiId) => {
  const res = await fetch(`/api/endpoints`, { ... });
  return res.json();
};
```

---

## 4. Git & Workflow Standards

### Branch Naming

- `main` → Stable code
- `dev` → Development integration
- `feature/<name>` → Feature branches
- `fix/<name>` → Bug fixes

### Commits

Use clear, human-readable commit messages that briefly describe the change

### Pull Requests

- Use descriptive titles
- Link related issues if tracked
- Ensure all tests/linting pass before merging

---

By adhering to these conventions, all contributors to the AT-AT project ensure a cohesive, readable, and professional-grade codebase for API threat assessment.

