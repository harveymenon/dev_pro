# Contributing to Gantt Chart Planner

First off, thank you for considering contributing to Gantt Chart Planner! It's people like you that make this tool great for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Pledge

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find that you don't need to create one. When you create a bug report, please include as many details as possible:

* **Use a clear and descriptive title** for the issue
* **Describe the exact steps** to reproduce the problem
* **Provide specific examples** to demonstrate the steps
* **Describe the behavior** you observed after following the steps
* **Explain which behavior** you expected to see instead
* **Include screenshots** if possible
* **Include your environment details**:
  - OS and version
  - Browser and version
  - Node.js version
  - npm/yarn version

### Suggesting Features

Feature suggestions are welcome! When suggesting a feature:

* **Use a clear and descriptive title**
* **Provide a detailed description** of the proposed feature
* **Explain why this feature** would be useful
* **Include mockups or examples** if applicable
* **List any alternatives** you've considered

### Code Contributions

Not sure where to start? Look for issues tagged with:

- `good first issue` - Perfect for newcomers
- `help wanted` - Extra attention needed
- `enhancement` - New features
- `bug` - Bug fixes

## Getting Started

### Prerequisites

Make sure you have:

- Node.js 18 or higher
- npm or yarn
- Git
- A code editor (VS Code recommended)
- (Optional) Supabase account for testing cloud features

### Setup

1. **Fork the repository**
   Click the "Fork" button at the top of the repository

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/gantt-chart-planner.git
   cd gantt-chart-planner
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/gantt-chart-planner.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/add-dark-mode` - New features
- `fix/date-calculation-bug` - Bug fixes
- `docs/update-readme` - Documentation updates
- `refactor/improve-performance` - Code refactoring
- `test/add-unit-tests` - Test additions

### Making Changes

1. **Keep your fork synced**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Write code**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run build
   npm run type-check
   npm run lint
   ```

4. **Commit your changes**
   See [Commit Messages](#commit-messages) section

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   See [Pull Request Process](#pull-request-process) section

## Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Export types when they might be reused

### React

- Use functional components with hooks
- Keep components focused and small
- Extract reusable logic into custom hooks
- Use TypeScript props interfaces
- Follow React best practices

### CSS

- Use Tailwind CSS utility classes
- Avoid custom CSS when possible
- Use semantic class names
- Follow mobile-first approach
- Ensure responsive design

### Code Organization

```
src/
├── components/     # Reusable UI components
├── utils/         # Utility functions
├── types.ts       # Type definitions
├── App.tsx        # Main application
└── main.tsx       # Entry point
```

### Naming Conventions

- **Components**: PascalCase (`GanttChart.tsx`)
- **Utilities**: camelCase (`dateUtils.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_TASKS`)
- **Variables**: camelCase (`taskList`)
- **Types/Interfaces**: PascalCase (`Task`, `Developer`)

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Simple commit
feat: add dark mode toggle

# With scope
fix(dateUtils): handle leap year correctly

# With body
feat(gantt): implement drag-and-drop for tasks

Add ability to drag task bars to change dates.
Updates both start and end dates automatically.

Closes #123
```

### Rules

1. **Subject line**:
   - Use imperative mood ("add" not "added")
   - Don't capitalize first letter
   - No period at the end
   - Max 50 characters

2. **Body**:
   - Explain what and why, not how
   - Wrap at 72 characters
   - Use to provide context

3. **Footer**:
   - Reference issues: `Closes #123`, `Fixes #456`
   - Breaking changes: `BREAKING CHANGE: description`

## Pull Request Process

### Before Submitting

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**
   ```bash
   npm run build
   npm run type-check
   npm run lint
   ```

3. **Test thoroughly**
   - Test with and without Supabase
   - Test on different screen sizes
   - Test edge cases
   - Verify Excel export works

4. **Update documentation**
   - Update README if needed
   - Add comments for complex code
   - Update relevant docs

### Creating the PR

1. **Go to your fork on GitHub**

2. **Click "New Pull Request"**

3. **Fill in the template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   Describe how you tested your changes

   ## Screenshots
   If applicable, add screenshots

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings
   - [ ] Tests added/updated
   - [ ] All tests pass
   ```

4. **Submit the PR**

### Review Process

1. **Wait for review** - Maintainers will review your PR
2. **Address feedback** - Make requested changes
3. **Update PR** - Push new commits to your branch
4. **Get approval** - At least one maintainer must approve
5. **Merge** - Maintainer will merge your PR

## Community

### Communication

- **Issues**: Use GitHub issues for bugs and features
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: [Join our Discord](#) (if applicable)

### Getting Help

- Check the [documentation](./README.md)
- Search existing [issues](https://github.com/YOUR_USERNAME/gantt-chart-planner/issues)
- Ask in [Discussions](https://github.com/YOUR_USERNAME/gantt-chart-planner/discussions)

### Recognition

Contributors will be:
- Listed in the README
- Mentioned in release notes
- Tagged in relevant issues/PRs

## Additional Resources

- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Questions?

Don't hesitate to ask! Open an issue or start a discussion.

---

Thank you for contributing to Gantt Chart Planner! 🎉
