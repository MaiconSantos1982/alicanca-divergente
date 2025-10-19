/**
 * Gerenciamento de Autenticação
 * Handles login, registro, recuperação de senha e logout
 */

// Verificar se já está autenticado ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    const session = await checkAuth();
    
    // Se já estiver autenticado, redirecionar para dashboard
    if (session && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
});

// ========================================
// FUNÇÕES DE ALERTA
// ========================================

function showAlert(message, type = 'info', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
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
    container.innerHTML = '';
}

// ========================================
// FUNÇÕES DE UI
// ========================================

function setLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const spinner = button.querySelector('.spinner-border');
    const text = button.querySelector('.btn-text');
    
    if (isLoading) {
        button.disabled = true;
        spinner.classList.remove('d-none');
        text.style.opacity = '0.5';
    } else {
        button.disabled = false;
        spinner.classList.add('d-none');
        text.style.opacity = '1';
    }
}

// ========================================
// LOGIN
// ========================================

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlerts();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    setLoading('loginBtn', true);
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Verificar se o email foi confirmado
        if (!data.user.email_confirmed_at) {
            showAlert('Por favor, confirme seu email antes de fazer login.', 'warning');
            setLoading('loginBtn', false);
            return;
        }
        
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
        }
        
        showAlert(errorMessage, 'danger');
        setLoading('loginBtn', false);
    }
});

// ========================================
// REGISTRO
// ========================================

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlerts();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    // Validações
    if (password !== passwordConfirm) {
        showAlert('As senhas não coincidem.', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showAlert('A senha deve ter pelo menos 6 caracteres.', 'danger');
        return;
    }
    
    setLoading('registerBtn', true);
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) throw error;
        
        // Verificar se precisa confirmar email
        if (data.user && !data.session) {
            showAlert(
                'Cadastro realizado com sucesso! Verifique seu email para confirmar sua conta.',
                'success'
            );
            
            // Limpar formulário
            document.getElementById('registerForm').reset();
            
            // Voltar para aba de login após 3 segundos
            setTimeout(() => {
                document.getElementById('login-tab').click();
            }, 3000);
        } else {
            // Login automático após cadastro (se confirmação de email estiver desabilitada)
            showAlert('Cadastro realizado com sucesso! Redirecionando...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
        
    } catch (error) {
        console.error('Erro no registro:', error);
        
        let errorMessage = 'Erro ao criar conta. Tente novamente.';
        
        if (error.message.includes('already registered')) {
            errorMessage = 'Este email já está cadastrado.';
        } else if (error.message.includes('Password should be')) {
            errorMessage = 'A senha não atende aos requisitos mínimos.';
        }
        
        showAlert(errorMessage, 'danger');
    } finally {
        setLoading('registerBtn', false);
    }
});

// ========================================
// RECUPERAÇÃO DE SENHA
// ========================================

// Abrir modal de recuperação
document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
    e.preventDefault();
    const modal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
    modal.show();
});

// Enviar email de recuperação
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlerts('resetAlertContainer');
    
    const email = document.getElementById('resetEmail').value.trim();
    
    setLoading('resetBtn', true);
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
        
        if (error) throw error;
        
        showAlert(
            'Email de recuperação enviado! Verifique sua caixa de entrada.',
            'success',
            'resetAlertContainer'
        );
        
        // Limpar formulário
        document.getElementById('resetPasswordForm').reset();
        
        // Fechar modal após 3 segundos
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal'));
            modal.hide();
        }, 3000);
        
    } catch (error) {
        console.error('Erro ao recuperar senha:', error);
        showAlert(
            'Erro ao enviar email de recuperação. Verifique o endereço informado.',
            'danger',
            'resetAlertContainer'
        );
    } finally {
        setLoading('resetBtn', false);
    }
});

// ========================================
// LOGOUT (para usar em outras páginas)
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
