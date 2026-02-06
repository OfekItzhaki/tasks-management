# Horizon Tasks
> by **Ofek Labs** 🧪

## Overview
**Horizon Tasks** is a powerful, full-stack task management solution designed to help you organize your life with clarity and precision. Built with a modern tech stack, it seamlessly syncs across Web and Mobile.

- **Lists & tasks** — Daily, weekly, monthly, yearly, and custom lists with tasks, steps, and due dates.
- **Reminders** — Per-task reminders (specific date, every day/week/month/year, days before due). Optional **location** (e.g. address or place name) per reminder; shown in task view and in notification body on web and mobile.
- **Notifications** — Browser notifications (web) and push notifications (mobile) for reminders, including task name, time, location (when set), and due-date context.
- **Shared logic** — Reminder types and helpers (`ReminderConfig`, convert/format) live in `frontend-services` and are used by both web-app and mobile-app.

## Repo structure

| Package            | Description                                      |
|--------------------|--------------------------------------------------|
| `todo-backend`     | NestJS API (Prisma, JWT auth, reminderConfig)   |
| `frontend-services`| Shared API client, types, **reminders module**  |
| `web-app`          | React + Vite SPA                                |
| `mobile-app`       | React Native + Expo                             |

## Local Development (Getting Started)

To get the project running locally for demoing or testing:

1. **Prerequisites**: Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
2. **Setup Infrastructure**: Run the following command in the root directory to spin up the Database and Redis:
   ```bash
   docker-compose up -d
   ```
3. **Configure Backend**:
   - `cd todo-backend`
   - `cp .env.example .env`
   - Fill in your `CLOUDINARY` credentials (see `.env.example`).
   - Run `npm install` and `npx prisma migrate dev`.
4. **Run Services**:
   - Start backend: `npm run dev`
   - Start web-app: `cd ../web-app && npm run dev`
