/**
 * Gerenciamento de Autenticação
 * Versão corrigida - Supabase v2
 */

// ========================================
// VERIFICAÇÃO DE AUTENTICAÇÃO INICIAL
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    // Aguardar o Supabase estar pronto
    if (typeof supabase === 'undefined') {
        console.error('❌ Supabase não foi inicializado. Verifique supabase-client.js');
        showAlert('Erro de configuração. Verifique o console.', 'danger');
        return;
    }

    // Verificar se já está autenticado
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Erro ao verificar sessão:', error);
            return;
        }
        
        // Se estiver na página de login e já tiver sessão, redirecionar
        if (session && window.location.pathname.includes('index.html')) {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
});

// ========================================
// FUNÇÕES DE ALERTA
// ========================================

function showAlert(message, type = 'info', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const alertId = 'alert-' + Date.now();
    
    const alert = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    container.innerHTML = alert;
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            alertElement.remove();
        }
    }, 5000);
}

function clearAlerts(containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '';
    }
}

// ========================================
// FUNÇÕES DE UI
// ========================================

function setLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    const spinner = button.querySelector('.spinner-border');
    const text = button.querySelector('.btn-text');
    
    if (isLoading) {
        button.disabled = true;
        if (spinner) spinner.classList.remove('d-none');
        if (text) text.style.opacity = '0.5';
    } else {
        button.disabled = false;
        if (spinner) spinner.classList.add('d-none');
        if (text) text.style.opacity = '1';
    }
}

// ========================================
// LOGIN
// ========================================

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlerts();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        // Validação básica
        if (!email || !password) {
            showAlert('Por favor, preencha todos os campos.', 'warning');
            return;
        }
        
        setLoading('loginBtn', true);
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            
            console.log('Login bem-sucedido:', data);
            
            showAlert('Login realizado com sucesso! Redirecionando...', 'success');
            
            // Redirecionar após 1 segundo
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error('Erro no login:', error);
            
            let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
            
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = 'Email ou senha incorretos.';
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = 'Por favor, confirme seu email antes de fazer login.';
            } else if (error.message.includes('Invalid')) {
                errorMessage = 'Credenciais inválidas. Verifique email e senha.';
            }
            
            showAlert(errorMessage, 'danger');
            setLoading('loginBtn', false);
        }
    });
}

// ========================================
// REGISTRO
// ========================================

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlerts();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        
        // Validações
        if (!name || !email || !password || !passwordConfirm) {
            showAlert('Por favor, preencha todos os campos.', 'warning');
            return;
        }
        
        if (password !== passwordConfirm) {
            showAlert('As senhas não coincidem.', 'danger');
            return;
        }
        
        if (password.length < 6) {
            showAlert('A senha deve ter pelo menos 6 caracteres.', 'danger');
            return;
        }
        
        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('Por favor, insira um email válido.', 'danger');
            return;
        }
        
        setLoading('registerBtn', true);
        
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: name,
                        display_name: name
                    }
                }
            });
            
            if (error) throw error;
            
            console.log('Cadastro bem-sucedido:', data);
            
            // Verificar se precisa confirmar email
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                // Usuário já existe
                showAlert('Este email já está cadastrado. Faça login.', 'warning');
                setTimeout(() => {
                    document.getElementById('login-tab').click();
                }, 2000);
            } else if (data.user && !data.session) {
                // Precisa confirmar email
                showAlert(
                    'Cadastro realizado! Verifique seu email para confirmar sua conta antes de fazer login.',
                    'success'
                );
                
                // Limpar formulário
                registerForm.reset();
                
                // Voltar para aba de login após 4 segundos
                setTimeout(() => {
                    document.getElementById('login-tab').click();
                }, 4000);
            } else if (data.session) {
                // Login automático (confirmação de email desabilitada)
                showAlert('Cadastro realizado com sucesso! Redirecionando...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
            
        } catch (error) {
            console.error('Erro no registro:', error);
            
            let errorMessage = 'Erro ao criar conta. Tente novamente.';
            
            if (error.message.includes('User already registered')) {
                errorMessage = 'Este email já está cadastrado. Faça login.';
            } else if (error.message.includes('Password should be')) {
                errorMessage = 'A senha não atende aos requisitos mínimos de segurança.';
            } else if (error.message.includes('duplicate key')) {
                errorMessage = 'Este email já está em uso.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showAlert(errorMessage, 'danger');
        } finally {
            setLoading('registerBtn', false);
        }
    });
}

// ========================================
// RECUPERAÇÃO DE SENHA
// ========================================

// Abrir modal de recuperação
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
        modal.show();
    });
}

// Enviar email de recuperação
const resetPasswordForm = document.getElementById('resetPasswordForm');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlerts('resetAlertContainer');
        
        const email = document.getElementById('resetEmail').value.trim();
        
        if (!email) {
            showAlert('Por favor, insira seu email.', 'warning', 'resetAlertContainer');
            return;
        }
        
        setLoading('resetBtn', true);
        
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            
            if (error) throw error;
            
            showAlert(
                'Email enviado! Verifique sua caixa de entrada e spam.',
                'success',
                'resetAlertContainer'
            );
            
            // Limpar formulário
            resetPasswordForm.reset();
            
            // Fechar modal após 3 segundos
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal'));
                if (modal) modal.hide();
            }, 3000);
            
        } catch (error) {
            console.error('Erro ao recuperar senha:', error);
            showAlert(
                'Erro ao enviar email. Verifique o endereço informado.',
                'danger',
                'resetAlertContainer'
            );
        } finally {
            setLoading('resetBtn', false);
        }
    });
}

// ========================================
// FUNÇÃO DE LOGOUT (para usar em outras páginas)
// ========================================

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao sair. Tente novamente.');
    }
}

// Tornar logout disponível globalmente
window.logout = logout;

console.log('✅ Auth.js carregado com sucesso');
