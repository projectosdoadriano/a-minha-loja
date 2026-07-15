// ============================================================
// CONFIG — ligação ao projeto Supabase "aminhaloja"
// ============================================================
// PREENCHE ESTES DOIS VALORES depois de criares o projeto em
// supabase.com (Project Settings → API):

const SUPABASE_URL = 'https://eiazkaxyfqfxwpjumatp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IZFNg-QdmW4NW-kI3FsrAw_A0AjhNfb';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
