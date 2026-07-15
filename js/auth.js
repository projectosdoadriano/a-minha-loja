// ============================================================
// AUTH — login do admin (username: adriano / password definida no Supabase)
// ============================================================

const ADMIN_USERNAME = 'adriano';
const ADMIN_EMAIL = 'adriano@aminhaloja.pt';

async function loginAdmin(username, password) {
  if (username.trim().toLowerCase() !== ADMIN_USERNAME) {
    throw new Error('Utilizador ou password inválidos.');
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password
  });
  if (error) throw new Error('Utilizador ou password inválidos.');
  return data.session;
}

async function logoutAdmin() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

async function requireAdminSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}
