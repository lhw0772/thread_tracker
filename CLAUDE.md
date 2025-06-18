# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thread Tracker - A comprehensive web application for analyzing and managing Threads (Meta) follower relationships. This app helps users identify engagement patterns, manage follow relationships, and optimize their social media presence.

## Development Commands

- `npm run dev` - Start development server (usually runs on port 3001 if 3000 is occupied)
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Environment Setup

Required environment variables in `.env.local`:
- `THREADS_CLIENT_ID` - Client ID from Meta Developer Console
- `THREADS_CLIENT_SECRET` - Client secret from Meta Developer Console  
- `THREADS_REDIRECT_URI` - OAuth redirect URI (typically `http://localhost:3000/api/auth/callback/threads`)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js session encryption
- `NEXTAUTH_URL` - Base URL for the application

## Architecture

### Core Technologies
- **Next.js 15** with App Router
- **NextAuth.js** for OAuth authentication with Threads
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Threads API** for social media data

### Key Components
- `Dashboard` - Main overview with statistics and navigation
- `InterestList` - Users who engage but don't follow back (target for follow)
- `BlackList` - Users you follow who don't follow back (candidates for unfollow)
- `MutualList` - Users with mutual follow relationships

### API Structure
- `/api/auth/[...nextauth]` - OAuth authentication with Threads
- `/api/threads/profile` - Fetch user profile data
- `/api/threads/analysis` - Perform relationship analysis (supports mock mode with `?mock=true`)

### Data Flow
1. User authenticates via Threads OAuth
2. App fetches user profile and posts via Threads API
3. Analysis service processes engagement data and relationships
4. Results are categorized into Interest List, Black List, and Mutual Followers
5. UI displays interactive lists with action buttons

### Key Features
- OAuth login with Threads
- Profile information display
- Follower relationship analysis
- Engagement scoring based on likes, comments, reposts
- Interactive lists for managing relationships
- Responsive design for mobile and desktop

### Mock Data
When Threads API is limited or unavailable, the app can use mock data by adding `?mock=true` to analysis endpoints. This ensures the UI can be tested without valid API credentials.