/**
 * Protocolo de Combate ao Medo
 * Formulário extenso com 4 seções
 */

(function() {
    'use strict';
    
    let currentUser = null;
    let savedProtocolId = null;
    
    document.addEventListener('DOMContentLoaded', async () => {
        await checkAuth();
        setupForm();
    });
    
    async function checkAuth() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            
            if (!session) {
                window.location.href = 'index.html';
                return;
            }
            
            currentUser = session.user;
            
            const userName = currentUser.user_metadata?.full_name || 
                           currentUser.user_metadata?.display_name || 
                           currentUser.email.split('@')[0];
            
            document.getElementById('userName').textContent = userName;
            document.getElementById('nome').value = userName;
            
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            window.location.href = 'index.html';
        }
    }
    
    function setupForm() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dataPreenchimento').value = today;
        
        document.getElementById('combateMedoForm').addEventListener('submit', handleSubmit);
        
        updateProgress();
        
        console.log('✅ Formulário configurado');
    }
    
    window.updateProgress = function() {
        const requiredFields = [
            'medoDescricao',
            'impactoFazendoOuDeixando',
            'impactoRuim',
            'impactoBomPerdido',
            'desmistificaPensamento',
            'desmistificaVersaoOposta',
            'desmistificaPadraoVida',
            'desmistificaTipoAtual',
            'desmistificaTipoDesejado',
            'pdaDescontroladoPercepcao',
            'pdaDescontroladoDecisao',
            'pdaDescontroladoAcao',
            'pdaMemoravelPercepcao',
            'pdaMemoravelDecisao',
            'pdaMemoravelAcao'
        ];
        
        let filledFields = 0;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value.trim() !== '') {
                filledFields++;
            }
        });
        
        const progress = Math.round((filledFields / requiredFields.length) * 100);
        
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        progressBar.style.width = progress + '%';
        progressText.textContent = progress + '% completo';
        
        if (progress === 100) {
            progressBar.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
        } else {
            progressBar.style.background = 'linear-gradient(90deg, var(--accent-gold), #f0c674)';
        }
    };
    
    async function handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.spinner-border');
        
        if (!e.target.checkValidity()) {
            e.target.reportValidity();
            return;
        }
        
        submitBtn.disabled = true;
        btnText.classList.add('d-none');
        spinner.classList.remove('d-none');
        
        try {
            console.log('📝 Iniciando salvamento do protocolo...');
            
            const formData = {
                user_id: currentUser.id,
                nome: document.getElementById('nome').value.trim() || null,
                data_preenchimento: document.getElementById('dataPreenchimento').value,
                
                // Seção 1
                medo_descricao: document.getElementById('medoDescricao').value.trim(),
                medo_origem: document.getElementById('medoOrigem').value.trim() || null,
                medo_quando_comecou: document.getElementById('medoQuandoComecou').value.trim() || null,
                medo_aprendeu_com_quem: document.getElementById('medoAprendeuComQuem').value.trim() || null,
                medo_pessoa_nucleo: document.getElementById('medoPessoaNucleo').value.trim() || null,
                medo_quem_alimenta: document.getElementById('medoQuemAlimenta').value.trim() || null,
                medo_alimentador_nucleo: document.getElementById('medoAlimentadorNucleo').value.trim() || null,
                
                // Seção 2
                impacto_fazendo_ou_deixando: document.getElementById('impactoFazendoOuDeixando').value.trim(),
                impacto_ruim: document.getElementById('impactoRuim').value.trim(),
                impacto_bom_perdido: document.getElementById('impactoBomPerdido').value.trim(),
                
                // Seção 3
                desmistifica_pensamento: document.getElementById('desmistificaPensamento').value.trim(),
                desmistifica_nivel_verdade: parseInt(document.getElementById('desmistificaNivelVerdade').value),
                desmistifica_alguem_pensa_diferente: document.getElementById('desmistificaAlguemPensaDiferente').value ? 
                    document.getElementById('desmistificaAlguemPensaDiferente').value === 'true' : null,
                desmistifica_o_que_pensam_diferente: document.getElementById('desmistificaOQuePensamDiferente').value.trim() || null,
                desmistifica_resultados_desejados: document.getElementById('desmistificaResultadosDesejados').value ? 
                    document.getElementById('desmistificaResultadosDesejados').value === 'true' : null,
                desmistifica_info_faltando: document.getElementById('desmistificaInfoFaltando').value.trim() || null,
                desmistifica_versao_oposta: document.getElementById('desmistificaVersaoOposta').value.trim(),
                desmistifica_padrao_vida: document.getElementById('desmistificaPadraoVida').value.trim(),
                desmistifica_tipo_atual: document.getElementById('desmistificaTipoAtual').value,
                desmistifica_tipo_desejado: document.getElementById('desmistificaTipoDesejado').value,
                
                // Seção 4.1
                pda_descontrolado_percepcao: document.getElementById('pdaDescontroladoPercepcao').value.trim(),
                pda_descontrolado_decisao: document.getElementById('pdaDescontroladoDecisao').value.trim(),
                pda_descontrolado_acao: document.getElementById('pdaDescontroladoAcao').value.trim(),
                
                // Seção 4.2
                cenario1_consequencias: document.getElementById('cenario1Consequencias').value.trim() || null,
                cenario2_bom: document.getElementById('cenario2Bom').value.trim() || null,
                cenario2_ruim: document.getElementById('cenario2Ruim').value.trim() || null,
                cenario2_minimizar: document.getElementById('cenario2Minimizar').value.trim() || null,
                cenario3_bom: document.getElementById('cenario3Bom').value.trim() || null,
                cenario3_ruim: document.getElementById('cenario3Ruim').value.trim() || null,
                cenario3_maximizar: document.getElementById('cenario3Maximizar').value.trim() || null,
                
                // Seção 4.3
                cenario_escolhido: document.getElementById('cenarioEscolhido').value || null,
                
                // Seção 4.4
                pda_memoravel_percepcao: document.getElementById('pdaMemoravelPercepcao').value.trim(),
                pda_memoravel_decisao: document.getElementById('pdaMemoravelDecisao').value.trim(),
                pda_memoravel_acao: document.getElementById('pdaMemoravelAcao').value.trim()
            };
            
            console.log('📊 Dados do formulário coletados');
            
            console.log('💾 Salvando protocolo...');
            const { data, error } = await supabase
                .from('ad_protocolo_combate_medo')
                .insert([formData])
                .select();
            
            if (error) {
                console.error('❌ Erro ao salvar:', error);
                throw new Error(`Erro ao salvar protocolo: ${error.message || JSON.stringify(error)}`);
            }
            
            if (!data || data.length === 0) {
                throw new Error('Nenhum dado retornado após inserção');
            }
            
            savedProtocolId = data[0].id;
            console.log('✅ Protocolo salvo com ID:', savedProtocolId);
            
            const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
            modal.show();
            
        } catch (error) {
            console.error('❌ Erro geral ao salvar:', error);
            
            let errorMessage = 'Erro ao salvar protocolo. ';
            
            if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Tente novamente.';
            }
            
            showAlert(errorMessage, 'danger');
            
            submitBtn.disabled = false;
            btnText.classList.remove('d-none');
            spinner.classList.add('d-none');
        }
    }
    
    window.createPDA = function() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        modal.hide();
        
        const pdaUrl = `pda.html?from=combate-medo&id=${savedProtocolId}`;
        window.location.href = pdaUrl;
    };
    
    window.finishWithoutPDA = function() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        modal.hide();
        
        showAlert('Protocolo salvo com sucesso!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    };
    
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
        
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
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
    
    console.log('✅ Form-combate-medo.js inicializado');
    
})();
