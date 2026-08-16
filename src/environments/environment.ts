export const environment = {
  production: true,
  supabase: {
    // From Supabase: Project Settings → API
    // Safe to keep here (the anon key is public by design; security is enforced via RLS policies in the database)
    url: 'https://xqgeaagoetzjluaszygu.supabase.co',
    anonKey:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZ2VhYWdvZXR6amx1YXN6eWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MjU4MDUsImV4cCI6MjEwMjEwMTgwNX0.ff1ABB2ESMRISMNuJW3sv-_1fQGIK7xo_Mak8qKlNiI',
  },
};
