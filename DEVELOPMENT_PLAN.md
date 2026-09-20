# CSK Pharmacy Web App and Offline/PWA Development Plan

## Overview

This repository is a Next.js + TypeScript pharmacy inventory and POS system. It currently uses a local SQLite database (`better-sqlite3`) and server-side logic suited for a local desktop deployment. To make it a proper Chrome-hosted web app and eventually support offline use, the application should be redesigned around a hosted web database and a browser-based offline layer.

## Goal

Create a modern web application that can:

- Run in Chrome/Edge as a hosted web app
- Be installed as a PWA for desktop use
- Work online with a hosted database
- Support limited offline operations using browser storage
- Synchronize data when connectivity is restored

## Recommended Architecture

### Phase 1: Hosted Web App

Use a standard web deployment:

- Next.js frontend
- PostgreSQL or MySQL database hosted externally
- HTTPS deployment
- Server-side API routes or server actions
- Authentication and authorization

This is the recommended base architecture for a real production application.

### Phase 2: Installable PWA

Allow Chrome users to install the application as a standalone app:

- Web app manifest
- Service worker
- App icons
- Standalone display mode
- Offline launch shell

This is useful for a desktop-like feel in Chrome.

### Phase 3: Offline Capability

For offline support, use browser local storage instead of relying on server-side SQLite:

- IndexedDB for local records
- Queue operations while offline
- Automatic sync on network recovery
- Conflict resolution for duplicates and changed records

This is the correct model for offline browser functionality.

## Why the Current Setup Needs a Change

The current repository uses:

- `better-sqlite3`
- a local file database at `process.cwd()`
- server-side file-based backup and restore
- direct server access to the database

This design is appropriate for a single local workstation or desktop packaging, but not for a browser-hosted app that must work online and offline across multiple devices.

## Recommended Migration Path

### Step 1: Move the database to a hosted database

Replace SQLite with PostgreSQL or MySQL for production use. Reasons:

- persistence across app restarts
- better concurrency for multi-user access
- more suitable for hosting and backups
- easier integration with a web app

### Step 2: Keep the app logic but detach it from local file paths

Currently the database is opened directly from the project working directory. This needs to be changed to use environment-based configuration, for example:

- `DATABASE_URL`
- pool configuration
- migration scripts
- health checks

### Step 3: Keep the UI, but make data access web-safe

The UI is already built in Next.js and React, which is a good foundation for a hosted app. The main change is to ensure all data operations happen through the web backend rather than local disk access.

### Step 4: Add installability in Chrome

Add a PWA configuration with:

- `manifest.json`
- icons
- `metadata` in `layout.tsx`
- service worker registration

This makes the app installable in Chrome and behave more like an app.

### Step 5: Add offline queueing

Use IndexedDB plus a sync mechanism for:

- medicine creation
- inventory updates
- billing transactions
- expiry adjustments

The app should:

- save the action locally when offline
- show a pending indicator
- retry synchronization when online
- avoid duplicate submissions

## Recommended Technologies

### Frontend

- Next.js
- React
- Tailwind CSS
- TypeScript

### Hosted database

- PostgreSQL preferred
- MySQL as second option

### Offline support

- IndexedDB
- Dexie.js (recommended)

### PWA support

- `next-pwa` or manual service worker configuration

### Hosting

- Vercel for frontend
- Railway, Render, or a VPS for PostgreSQL

## Web App Design

### Online workflow

1. User opens the app in Chrome.
2. App loads from the hosted server.
3. Client requests inventory, bills, and medicines from the API.
4. Data is read from the production database.
5. Updates are sent through the backend.

### Offline workflow

1. App detects connection loss.
2. User continues working in the interface.
3. Actions are stored in IndexedDB.
4. Pending items are shown with a sync status.
5. When connectivity returns, the app uploads queued actions.
6. Server confirms completion and updates state.

## Offline Data Model

Add a local browser database such as:

- `medicines`
- `batches`
- `invoices`
- `pendingOperations`
- `syncLog`

This allows offline capture without losing work.

## Print and Device Support

The current app includes thermal receipt logic and local print settings. For a browser app:

- browser printing remains possible
- direct thermal printer support is more complex in the browser
- certain devices may require browser print dialogs or a local helper application

For a fully desktop-like experience, Electron remains the best option for direct hardware integration. For a standard web app, browser print is the practical route.

## Security Considerations

When moving to a hosted web app:

- Use HTTPS only
- Add user authentication
- Restrict admin-only functions
- Protect API routes against abuse
- Validate all input on the server
- Use environment variables for secrets
- Store backups outside the runtime directory

## Deployment Plan

### Stage 1: Local Development

- Keep Next.js app running locally
- Use PostgreSQL locally for testing
- Validate all CRUD flows
- Migrate local business logic to server-safe functions

### Stage 2: Staging Deployment

- Deploy to a staging environment
- Connect to a staging database
- Test login, billing, and data sync
- Validate offline queue behavior

### Stage 3: Production Deployment

- Use production database credentials
- Enable HTTPS
- Configure automatic database backups
- Add monitoring and logs
- Set up deployment pipelines

## Recommended Final Solution

The strongest path for this project is:

- Next.js web app for browser use
- PostgreSQL for production data storage
- PWA installability in Chrome
- IndexedDB for offline transaction queueing
- Sync engine for restoring online connectivity

This approach is better than trying to run the current SQLite-based app directly in Chrome offline.

## Summary

The current repository is a good candidate for a web app and PWA, but it is not yet browser-offline-ready because it depends on local file-based SQLite access. The recommended plan is to migrate from local SQLite to a hosted database, add PWA install support, and layer IndexedDB-based offline synchronization on top. This gives the app a proper online/offline experience while maintaining a desktop-like workflow in the browser.

## Suggested Next Tasks

1. Replace `better-sqlite3` with a hosted database layer
2. Add environment-based database configuration
3. Add PWA manifest and install support
4. Add IndexedDB layer for offline storage
5. Build sync queue and retry logic
6. Deploy to a secure HTTPS environment
7. Add admin authentication and role controls
8. Validate backup, restore, and print workflows in production

## Recommended Implementation Priority

1. Hosted database migration
2. Web deployment
3. PWA packaging
4. Offline queue + sync engine
5. Print/hardware polish
6. Production hardening and backups

This plan provides a realistic path from a local desktop tool to a dependable browser-based pharmacy system.
