/**
 * Configuração do Cliente Supabase
 * 
 * IMPORTANTE: Antes de usar, você precisa:
 * 1. Criar um projeto no Supabase (https://supabase.com)
 * 2. Obter a URL e a ANON KEY do projeto
 * 3. Substituir os valores abaixo
 */

// ⚠️ SUBSTITUA ESTES VALORES PELAS SUAS CREDENCIAIS DO SUPABASE
const SUPABASE_URL = 'https://ztlddoutgextdmyiwoxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bGRkb3V0Z2V4dGRteWl3b3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MTAyNTksImV4cCI6MjA0OTQ4NjI1OX0.l9qwcAL4h9Ho_IU9uNhm2wyBHaYgNbor98a17-43EpI';

// Verificar se as credenciais foram configuradas
if (SUPABASE_URL === 'https://ztlddoutgextdmyiwoxl.supabase.co' || SUPABASE_ANON_KEY === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0bGRkb3V0Z2V4dGRteWl3b3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MTAyNTksImV4cCI6MjA0OTQ4NjI1OX0.l9qwcAL4h9Ho_IU9uNhm2wyBHaYgNbor98a17-43EpI') {
    console.error('⚠️ ERRO: Configure suas credenciais do Supabase no arquivo supabase-client.js');
}

// Criar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Função para verificar autenticação
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// Função para obter usuário atual
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Listener para mudanças de autenticação
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    
    if (event === 'SIGNED_IN') {
        console.log('Usuário logado:', session.user.email);
    } else if (event === 'SIGNED_OUT') {
        console.log('Usuário deslogado');
    }
});

console.log('✅ Cliente Supabase inicializado');
