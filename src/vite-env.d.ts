/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_DEEPSEEK_API_KEY: string;
  readonly VITE_GROK_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_ENABLED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}