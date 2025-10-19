/**
 * Plano Perfeito - Lições Aprendidas
 * Formulário de registro
 */

(function() {
    'use strict';
    
    let currentUser = null;
    let savedProtocolId = null;
    
    // Inicialização
    document.addEventListener('DOMContentLoaded', async () => {
        await checkAuth();
        setupForm();
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
            
            // Preencher nome no formulário
            document.getElementById('nome').value = userName;
            
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            window.location.href = 'index.html';
        }
    }
    
    // ========================================
    // SETUP DO FORMULÁRIO
    // ========================================
    
    function setupForm() {
        // Definir data padrão como hoje
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dataPreenchimento').value = today;
        
        // Handler do formulário
        document.getElementById('licoesForm').addEventListener('submit', handleSubmit);
        
        // Atualizar progresso inicial
        updateProgress();
        
        console.log('✅ Formulário configurado');
    }
    
    // ========================================
    // PROGRESSO
    // ========================================
    
    window.updateProgress = function() {
        const requiredFields = [
            'sonhoGrande',
            'distanciouSonho',
            'aproximouSonho',
            'fariaDiferente',
            'repetiria'
        ];
        
        let filledFields = 0;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value.trim() !== '') {
                filledFields++;
            }
        });
        
        const progress = Math.round((filledFields / requiredFields.length) * 100);
        
        // Atualizar barra
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        progressBar.style.width = progress + '%';
        progressText.textContent = progress + '% completo';
        
        // Mudar cor quando completo
        if (progress === 100) {
            progressBar.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, var(--accent-gold), #f0c674)';
        }
    };
    
    // ========================================
    // SUBMIT DO FORMULÁRIO
    // ========================================
    
    async function handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.spinner-border');
        
        // Validar campos obrigatórios
        if (!e.target.checkValidity()) {
            e.target.reportValidity();
            return;
        }
        
        // Loading state
        submitBtn.disabled = true;
        btnText.classList.add('d-none');
        spinner.classList.remove('d-none');
        
        try {
            // Coletar dados
            const formData = {
                user_id: currentUser.id,
                nome: document.getElementById('nome').value.trim() || null,
                data_preenchimento: document.getElementById('dataPreenchimento').value,
                sonho_grande: document.getElementById('sonhoGrande').value.trim(),
                distanciou_sonho: document.getElementById('distanciouSonho').value.trim(),
                aproximou_sonho: document.getElementById('aproximouSonho').value.trim(),
                faria_diferente: document.getElementById('fariaDiferente').value.trim(),
                repetiria: document.getElementById('repetiria').value.trim()
            };
            
            // Inserir no Supabase
            const { data, error } = await supabase
                .from('ad_plano_perfeito_licoes')
                .insert([formData])
                .select();
            
            if (error) throw error;
            
            savedProtocolId = data[0].id;
            
            console.log('✅ Protocolo salvo:', savedProtocolId);
            
            // Mostrar modal de confirmação
            const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
            modal.show();
            
        } catch (error) {
            console.error('Erro ao salvar protocolo:', error);
            showAlert('Erro ao salvar. Tente novamente.', 'danger');
            
            // Reset button
            submitBtn.disabled = false;
            btnText.classList.remove('d-none');
            spinner.classList.add('d-none');
        }
    }
    
    // ========================================
    // CRIAR PDA
    // ========================================
    
    window.createPDA = function() {
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        modal.hide();
        
        // Redirecionar para PDA com contexto
        const pdaUrl = `pda.html?from=licoes&id=${savedProtocolId}`;
        window.location.href = pdaUrl;
    };
    
    // ========================================
    // FINALIZAR SEM PDA
    // ========================================
    
    window.finishWithoutPDA = function() {
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        modal.hide();
        
        // Mostrar mensagem de sucesso
        showAlert('Lições salvas com sucesso!', 'success');
        
        // Redirecionar após 1.5s
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    };
    
    // ========================================
    // ALERTAS
    // ========================================
    
    function showAlert(message, type = 'info') {
        const container = document.getElementById('alertContainer');
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
        
        // Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // ========================================
    // LOGOUT
    // ========================================
    
    window.logout = async function() {
        if (confirm('Deseja realmente sair? Dados não salvos serão perdidos.')) {
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
    
    console.log('✅ Form-plano-perfeito-licoes.js inicializado');
    
})();
