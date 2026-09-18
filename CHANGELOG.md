# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Multi-developer support with individual tabs
- Dynamic Gantt chart with date-based positioning
- Supabase integration for cloud storage
- Excel export functionality
- Responsive design for desktop and tablet
- Weekend exclusion in date calculations
- Developer color coding
- Overview dashboard
- Summary cards for tasks and hours
- Interactive tooltips
- Sticky columns for better navigation

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## [1.0.0] - 2024-01-XX

### Added
- **Core Features**
  - Multi-developer task management
  - Dynamic Gantt chart visualization
  - Automatic end date calculation
  - Configurable working hours per day
  - Weekend exclusion in calculations
  - Leap year support
  - Multi-year task support

- **Developer Management**
  - Add/edit/delete developers
  - Unique color assignment per developer
  - Individual developer tabs
  - Developer summary cards

- **Task Management**
  - Add/edit/delete tasks
  - Task ID validation (unique across project)
  - Automatic end date calculation
  - Working days calculation
  - Task editing with instant updates

- **Gantt Chart**
  - Date-based bar positioning
  - Dynamic month columns
  - Partial month visualization
  - Color-coded bars by developer
  - Hover tooltips with task details
  - Weekend shading
  - Horizontal scrolling
  - Sticky columns

- **Data Management**
  - Supabase integration
  - Automatic save on changes
  - Real-time sync
  - Graceful fallback to sample data
  - Reset to demo data option
  - localStorage fallback

- **Export**
  - Individual developer Excel export
  - Consolidated project Excel export
  - Multiple sheets per workbook
  - Gantt visualization in Excel
  - Summary sheets
  - Professional formatting

- **UI/UX**
  - Modern, clean interface
  - Responsive design
  - Loading states
  - Confirmation dialogs
  - Error handling
  - Toast notifications (planned)
  - Dark mode (planned)

- **Documentation**
  - Comprehensive README
  - Setup guides
  - API documentation
  - Contributing guidelines
  - Code of conduct

### Technical Stack
- React 18.3
- TypeScript 5.6
- Vite 6.4
- Tailwind CSS 3.4
- Supabase (PostgreSQL)
- SheetJS (xlsx)
- date-fns

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Known Issues
- Large datasets (>1000 tasks) may experience performance issues
- Excel export limited to browser memory constraints
- Mobile support needs improvement

### Migration Notes
- No migration needed for initial release
- Supabase schema required for cloud storage
- Environment variables needed for Supabase connection

---

## Version History Template

<!-- Use this template for future releases -->

<!--
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Vulnerability fixes
-->
