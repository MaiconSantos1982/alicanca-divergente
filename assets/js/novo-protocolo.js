/**
 * Novo Protocolo - Seleção e Redirecionamento
 */

(function() {
    'use strict';
    
    let currentUser = null;
    
    // Inicialização
    document.addEventListener('DOMContentLoaded', async () => {
        await checkAuth();
    });
    
    // ========================================
    // AUTENTICAÇÃO
    // ========================================
    
    async function checkAuth() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            
            if (!session) {
                window.location.href = 'index.html';
                return;
            }
            
            currentUser = session.user;
            
            // Carregar nome do usuário
            const userName = currentUser.user_metadata?.full_name || 
                           currentUser.user_metadata?.display_name || 
                           currentUser.email.split('@')[0];
            
            document.getElementById('userName').textContent = userName;
            
            console.log('✅ Usuário autenticado:', userName);
            
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            window.location.href = 'index.html';
        }
    }
    
    // ========================================
    // SELEÇÃO DE PROTOCOLO
    // ========================================
    
    window.selectProtocol = function(protocolType) {
        // Mapear protocolos para suas páginas
        const protocolPages = {
            'plano-perfeito-licoes': 'form-plano-perfeito-licoes.html',
            'plano-perfeito-foco': 'form-plano-perfeito-foco.html',
            'nucleo-interno': 'form-nucleo-interno.html',
            'nucleo-externo': 'form-nucleo-externo.html',
            'combate-medo': 'form-combate-medo.html',
            'culpa-real': 'form-culpa-real.html',
            'pda': 'pda.html'
        };
        
        const page = protocolPages[protocolType];
        
        if (page) {
            // Adicionar animação de saída
            document.body.style.opacity = '0.8';
            
            setTimeout(() => {
                window.location.href = page;
            }, 150);
        } else {
            console.error('Protocolo não encontrado:', protocolType);
            showNotification('Este protocolo ainda não está disponível.', 'warning');
        }
    };
    
    // ========================================
    // NOTIFICAÇÃO
    // ========================================
    
    function showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    // ========================================
    // LOGOUT
    // ========================================
    
    window.logout = async function() {
        if (confirm('Deseja realmente sair?')) {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao sair. Tente novamente.');
            }
        }
    };
    
    console.log('✅ Novo-protocolo.js inicializado');
    
})();
