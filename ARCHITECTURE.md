# 🏆 Architecture & Excellence Blueprint

This document provides the high-level architecture overview and engineering standards for the **Horizon Project**. This is a **living document** and should be the primary reference for both human developers and AI agents.

This project adheres to **[The Horizon Standard](HORIZON_STANDARD.md)** for universal architectural principles.

---

## 🏗️ System Overview

Horizon is a multi-platform task management ecosystem built with industrial-grade standards.

### Tech Stack
- **Backend**: Node.js (NestJS) + PostgreSQL (Prisma)
- **Frontend (Web)**: React (Vite) + Tailwind CSS + TanStack Query
- **Mobile**: React Native (Expo) + TanStack Query
- **Infrastructure**: Docker Compose + Seq (Logging) + Redis (BullMQ for background jobs)
- **Shared Layer**: `@tasks-management/frontend-services` (Zod validation + API Client)

---

## 📂 Project Structure

### Centralized Service Layer (`/frontend-services`)
Contains all API clients, types, and Zod schemas shared between Web and Mobile.
- **Rules**:
  - All API calls MUST go through this package.
  - No manual `Fetch` or `Axios` calls in screen components.
  - Shared validation logic for both platforms.

### Backend (`/todo-backend`)
NestJS application following Modular Architecture.
- **Key Modules**:
  - `Auth`: Multi-step registration, JWT rotation, password resets.
  - `Tasks/TodoLists`: Core business logic.
  - `Reminders`: Background worker integration for multi-channel alerts.
  - `Health`: Orchestration-ready health checks.

### Web App (`/web-app`)
Vite-powered PWA.
- **Key Features**:
  - Responsive Tailwind UI.
  - Real-time updates via Socket.IO.
  - Offline-ready with TanStack Query.

### Mobile App (`/mobile-app`)
Expo-managed React Native application.
- **Key Features**:
  - Native performance.
  - Shared service layer with Web.
  - Local notifications sync.

---

## 🚀 Key Architectural Patterns

### 1. Robust Registration Flow
- Multi-step validation (Email -> OTP -> Password).
- Backend-enforced state machine for registration progress.

### 2. Intelligent Reminders
- Schedule-based reminders (e.g., "Remind me in 3 days").
- Offloaded to Redis/BullMQ to ensure API performance.

### 3. Presence & Real-time
- Collaborative presence tracking within lists.
- Socket.IO integration for instant task synchronization.

---

## 🛠️ Developer Workflow

Always run verification before pushing. Refer to **[HORIZON_STANDARD.md](HORIZON_STANDARD.md)** for global coding standards (no-any, error handling, etc.).
