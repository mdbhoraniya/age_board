# AgeNow — Track Everyone's Age

> A modern, responsive, privacy-first web application to track the dynamic ages of family members, children, parents, and friends.

---

## 🌟 Key Features

- **Accurate Calendar Age Calculation**: Calculates exact years, months, and days with calendar precision — properly accounting for leap years, February 29th birthdays, variable month lengths, and month-end dates.
- **Dynamic Age & Birthday Updates**: Automatically updates calculated ages when the calendar date rolls over at midnight or when returning to the tab, with zero high-frequency polling or battery drain.
- **100% Private & On-Device**: All dates of birth remain strictly on the user's device in browser `localStorage`. No accounts, no servers, no tracking.
- **Upcoming Birthday Countdowns**: Highlights birthdays today (`🎉 Birthday today!`) and shows countdowns for upcoming birthdays (`🎂 In 12 days`, `🎂 In 3 months`).
- **Flexible Sorting & Search**:
  - Custom order (with reorder controls)
  - Upcoming birthday countdown
  - Age (Oldest first / Youngest first)
  - Alphabetical by name (A → Z / Z → A)
  - Instant live search by name
- **Family & Custom Groups**: Organize people into custom groups (e.g. "My Family", "Brother's Family", "Parents") with instant group filter tabs.
- **1-Click Sharing (No Re-entry)**: Generate instant share links for all members or specific groups. When your brother or family member opens the link, they can import everyone with 1 click without typing anything.
- **Backup & Restore**: Export full family data as `.json` backups and import them anytime on any device.
- **Progressive Web App (PWA)**: Installable on Android (via Chrome "Add to Home Screen"), iOS (Safari "Add to Home Screen"), and desktop browsers as a standalone application.
- **Responsive Mobile-First Design**: Optimized for 320px, 375px, 430px, tablets, and desktop displays with 44px+ touch targets and dark mode support.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Installation

```bash
# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Create optimized production build
npm run build

# Start production server
npm run start
```

### Running Tests

```bash
npm test
```

Runs 27 comprehensive automated tests covering calendar calculations, leap year handling, singular/plural formatting, storage integrity, sorting, and user workflows.

### Linting

```bash
npm run lint
```

---

## 📐 Project Structure

```text
age_board/
├── app/
│   ├── layout.tsx         # Root layout with SEO metadata & PWA tags
│   ├── page.tsx           # Main dashboard page
│   └── globals.css        # Tailwind CSS and theme design tokens
├── components/
│   ├── DeleteConfirmModal.tsx # Safe deletion confirmation dialog
│   ├── EmptyState.tsx         # Attractive empty state with Add Person action
│   ├── Header.tsx             # Brand header, privacy indicator, Add CTA
│   ├── PersonCard.tsx         # Age card with big numbers & birthday status
│   ├── PersonFormModal.tsx    # Add / Edit modal with live age preview
│   ├── PersonList.tsx         # Responsive card grid with reordering
│   ├── PwaRegister.tsx        # Client PWA service worker registration
│   └── SearchAndSort.tsx      # Name search filter and sort dropdown
├── lib/
│   ├── age.ts             # Calendar math, birthday countdowns, formatting
│   ├── storage.ts         # Safe localStorage persistence & usePeople hook
│   └── useCurrentDate.ts  # Midnight-anchored live date synchronization
├── types/
│   └── person.ts          # Person, AgeResult, BirthdayInfo types
├── public/
│   ├── manifest.json      # PWA web manifest
│   ├── sw.js              # Minimalist PWA service worker
│   ├── icon.svg           # High-resolution vector app icon
│   ├── icon-192.png       # 192x192 PWA icon
│   ├── icon-512.png       # 512x512 PWA icon
│   └── apple-touch-icon.png
└── tests/
    ├── age.test.ts        # Unit tests for calendar accuracy & edge cases
    ├── storage.test.ts    # Tests for local storage and sorting
    └── integration.test.ts # End-to-end integration workflow tests
```

---

## 🧮 Calendar Calculation Architecture

Instead of naive approximations like `(now - birth) / 365.25`, AgeNow implements calendar-accurate calendar math:

1. **Date Parsing**: Parses `YYYY-MM-DD` strings into numerical `[year, month, day]` integers, avoiding UTC timezone rollbacks that occur with native `new Date("YYYY-MM-DD")`.
2. **Calendar Borrowing**:
   - `years = curYear - birthYear`
   - `months = curMonth - birthMonth`
   - `days = curDay - birthDay`
   - If `days < 0`: borrows the exact number of days from the previous month (`new Date(curYear, curMonth - 1, 0).getDate()`), decrementing `months`.
   - If `months < 0`: borrows 12 months, decrementing `years`.
3. **Feb 29 & Leap Years**:
   - Properly accounts for leap years (`year % 4 === 0 && year % 100 !== 0 || year % 400 === 0`).
   - For people born on Feb 29, birthdays in non-leap years are celebrated on Feb 28.
4. **Natural Grammar Formatting**:
   - Formats `1 year` vs `2 years`, `1 month` vs `2 months`, `1 day` vs `2 days`.
   - Omit zero units when appropriate (`10 years old`, `10 years, 1 day`, `5 months, 12 days`).
