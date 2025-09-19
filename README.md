# PMC - Professional Marketing Copy Generator

A comprehensive AI-powered copywriting platform that helps create professional marketing content with various voice styles and personas.

## Setup Instructions

### Environment Configuration

1. **Create Environment File**: Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. **Configure Supabase**: 
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Navigate to Project Settings → API
   - Replace the following values in your `.env` file:
     - `VITE_SUPABASE_URL`: Copy from "Project URL"
     - `VITE_SUPABASE_ANON_KEY`: Copy from "anon public" key

3. **Configure AI Providers** (Optional):
   - Add your API keys for OpenAI, DeepSeek, or Grok as needed
   - These are used for content generation features

4. **Restart Development Server**: After updating `.env`, restart your dev server:
   ```bash
   npm run dev
   ```

### Development Mode

If you don't have Supabase set up yet, you can run in development mode:
- Set `VITE_SUPABASE_ENABLED=false` in your `.env` file
- This enables mock data for testing the interface

### Supabase Authentication Setup

For development, you may want to disable email confirmation:
1. Go to Authentication → Settings in your Supabase dashboard
2. Under "Email Auth", disable "Enable email confirmations"

## Features

- AI-powered copy generation with multiple voice styles
- Template management and reuse
- Customer and project organization
- Token usage tracking
- Beta user registration system
- Admin dashboard for user management
