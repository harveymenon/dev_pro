# 📊 Gantt Chart Planner

A modern, dynamic Gantt chart application for project management with multi-developer support, built with React, TypeScript, and Supabase.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/react-18.3-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.6-blue.svg)
![Supabase](https://img.shields.io/badge/supabase-connected-green.svg)

## ✨ Features

### Core Functionality
- 🎯 **Multi-Developer Support** - Manage tasks for multiple developers with individual tabs
- 📅 **Dynamic Gantt Charts** - Visual timeline with accurate date-based positioning
- 🔄 **Auto-Calculation** - End dates automatically calculated based on working hours
- ⚙️ **Configurable Settings** - Adjustable working hours per day
- 📊 **Overview Dashboard** - Project-wide view combining all developers' tasks
- 💾 **Cloud Storage** - Supabase integration for persistent data storage
- 📥 **Excel Export** - Export individual or consolidated reports to Excel
- 🎨 **Developer Colors** - Color-coded tasks by developer

### Advanced Features
- 🗓️ **Smart Date Handling** - Weekend exclusion, leap year support, multi-year spans
- 📱 **Responsive Design** - Works on desktop, laptop, and tablet
- ⚡ **Real-time Updates** - Instant UI updates when data changes
- 🔍 **Sticky Columns** - Task details remain visible while scrolling timeline
- 💬 **Interactive Tooltips** - Hover over bars for detailed task information
- 🎯 **Summary Cards** - Quick overview of tasks, hours, and working days
- 🔄 **Data Persistence** - Automatic save to Supabase on every change

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- (Optional) Supabase account for cloud storage

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/gantt-chart-planner.git
cd gantt-chart-planner
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment (Optional)**

For cloud storage with Supabase:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** The app works without Supabase using sample data!

4. **Start development server**
```bash
npm run dev
```

5. **Open browser**
Navigate to `http://localhost:5173`

## 📖 Usage

### Getting Started

1. **Add Developers**
   - Click "Add Developer" button
   - Enter developer name
   - Each developer gets a unique color

2. **Create Tasks**
   - Switch to a developer's tab
   - Click "Add Task"
   - Fill in: Task ID, Title, Hours Needed, Start Date
   - End date is calculated automatically

3. **View Gantt Chart**
   - Tasks appear as colored bars on the timeline
   - Hover over bars for detailed information
   - Timeline adjusts automatically based on task dates

4. **Overview Tab**
   - Switch to "Overview" to see all developers' tasks
   - Consolidated project timeline
   - Export all data to Excel

### Working Hours Configuration

- Default: 8 hours/day
- Change in header: "Working Hours / Day: [ 8 ]"
- All end dates recalculate automatically
- Weekends are excluded from calculations

### Excel Export

**Individual Developer:**
- Navigate to developer's tab
- Click "Export Excel"
- Downloads: `{DeveloperName}_Gantt_Report.xlsx`

**All Developers:**
- Navigate to Overview tab
- Click "Export All"
- Downloads: `Project_Gantt_All_Developers.xlsx`

## 🗄️ Supabase Setup (Optional)

For cloud storage and multi-device sync:

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Wait for database to be ready

2. **Run Database Schema**
   - Open SQL Editor in Supabase dashboard
   - Copy contents of `supabase-schema.sql`
   - Execute the SQL

3. **Get Credentials**
   - Go to Settings → API
   - Copy Project URL and anon/public key
   - Add to `.env` file

4. **Restart Application**
```bash
npm run dev
```

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

## 🏗️ Project Structure

```
gantt-chart-planner/
├── src/
│   ├── utils/
│   │   ├── dateUtils.ts          # Date calculation utilities
│   │   ├── developerUtils.ts     # Developer management
│   │   ├── excelUtils.ts         # Excel export functionality
│   │   ├── storageUtils.ts       # Supabase storage operations
│   │   └── supabaseClient.ts     # Supabase client configuration
│   ├── App.tsx                   # Main application component
│   ├── types.ts                  # TypeScript type definitions
│   ├── main.tsx                  # Application entry point
│   └── index.css                 # Global styles
├── public/                       # Static assets
├── index.html                    # HTML template
├── package.json                  # Dependencies
├── vite.config.js               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── supabase-schema.sql          # Database schema
├── .env.example                 # Environment template
└── README.md                    # This file
```

## 🔧 Technology Stack

- **React 18.3** - UI framework
- **TypeScript 5.6** - Type safety
- **Vite 6.4** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS
- **Supabase** - Backend as a Service (PostgreSQL)
- **SheetJS (xlsx)** - Excel file generation
- **date-fns** - Date manipulation utilities

## 📊 Features in Detail

### Date Calculations
- **Working Days**: Excludes weekends (Saturday/Sunday)
- **End Date**: Automatically calculated from start date + hours
- **Leap Years**: Properly handles February 29th
- **Multi-Year**: Supports tasks spanning multiple years

### Gantt Chart
- **Date-Based Positioning**: Bars positioned accurately by date
- **Month Columns**: Dynamic columns based on task date range
- **Partial Months**: Shows correct portion of month for tasks
- **Color Coding**: Each developer has unique color
- **Tooltips**: Hover for task details

### Data Management
- **Auto-Save**: Changes saved immediately to Supabase
- **Conflict Resolution**: Handles concurrent edits
- **Fallback Mode**: Works without Supabase using sample data
- **Reset Option**: Restore demo data anytime

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Lint code
npm run lint
```

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting
- Component-based architecture
- Utility functions for reusability

## 🐛 Troubleshooting

### Supabase Connection Issues

**Problem:** "Invalid supabaseUrl" error

**Solution:** 
- Check `.env` file exists
- Verify URL starts with `https://`
- Ensure no placeholder values remain
- Restart dev server after changes

### Data Not Loading

**Problem:** App shows sample data instead of Supabase data

**Solution:**
- Verify Supabase project is active
- Check credentials in `.env`
- Run `supabase-schema.sql` in SQL Editor
- Check browser console for errors

### Build Errors

**Problem:** TypeScript errors during build

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📝 Documentation

- [Quick Start Guide](./QUICKSTART.md) - 5-minute setup
- [Supabase Setup](./SUPABASE_SETUP.md) - Detailed database configuration
- [Integration Guide](./SUPABASE_INTEGRATION.md) - Technical implementation
- [Supabase Fix](./SUPABASE_FIX.md) - Configuration troubleshooting

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Contribution Steps

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [React](https://reactjs.org) - UI framework
- [Vite](https://vitejs.dev) - Build tool
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [SheetJS](https://sheetjs.com) - Excel generation

## 📞 Support

- 📖 Read the [documentation](./SUPABASE_SETUP.md)
- 🐛 Report [issues](https://github.com/YOUR_USERNAME/gantt-chart-planner/issues)
- 💡 Request [features](https://github.com/YOUR_USERNAME/gantt-chart-planner/issues)

## 🗺️ Roadmap

- [ ] Real-time collaboration with Supabase Realtime
- [ ] User authentication and multi-user support
- [ ] Task dependencies and relationships
- [ ] Progress tracking and completion percentages
- [ ] File attachments and documentation
- [ ] Advanced reporting and analytics
- [ ] Mobile app version
- [ ] API for third-party integrations

## ⭐ Show Your Support

If this project helps you, please give it a ⭐ on GitHub!

---

**Built with ❤️ using React, TypeScript, and Supabase**
