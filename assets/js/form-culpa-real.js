/**
 * Eliminando Culpa Real
 * Script estruturado de conversa difícil
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
        
        document.getElementById('culpaRealForm').addEventListener('submit', handleSubmit);
        
        updateProgress();
        updatePreview();
        
        console.log('✅ Formulário configurado');
    }
    
    window.updateProgress = function() {
        const requiredFields = [
            'nomePessoa',
            'acontecimentoChave',
            'reconhecoQue',
            'causouImpactos',
            'aPartirDeHoje'
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
    
    window.updatePreview = function() {
        const nomePessoa = document.getElementById('nomePessoa').value.trim();
        const acontecimento = document.getElementById('acontecimentoChave').value.trim();
        const reconheco = document.getElementById('reconhecoQue').value.trim();
        const causou = document.getElementById('causouImpactos').value.trim();
        const porCausa = document.getElementById('porCausaDisso').value.trim();
        const issoFez = document.getElementById('issoFezComQue').value.trim();
        const compromisso = document.getElementById('aPartirDeHoje').value.trim();
        
        const previewContainer = document.getElementById('scriptPreview');
        
        if (!nomePessoa && !acontecimento && !reconheco && !causou && !compromisso) {
            previewContainer.innerHTML = '<p class="text-muted">Preencha os campos acima para visualizar o script completo...</p>';
            return;
        }
        
        let script = '<div class="script-content">';
        
        script += `<p><strong>Oi ${nomePessoa || '[nome da pessoa]'},</strong></p>`;
        
        script += `<p>Preciso conversar com você sobre <em>${acontecimento || '[o acontecimento]'}</em>.</p>`;
        
        script += `<p>Reconheço que ${reconheco || '[o que você fez ou deixou de fazer]'}.</p>`;
        
        script += `<p>Sei que isso causou ${causou || '[os impactos negativos]'}.</p>`;
        
        if (porCausa) {
            script += `<p>Por causa disso, ${porCausa}.</p>`;
        }
        
        if (issoFez) {
            script += `<p>Isso fez com que ${issoFez}.</p>`;
        }
        
        if (compromisso) {
            script += `<p><strong>A partir de hoje, me comprometo a:</strong> ${compromisso}</p>`;
        }
        
        script += '</div>';
        
        previewContainer.innerHTML = script;
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
                tipo_culpa: document.getElementById('tipoCulpa').value || null,
                
                // Script da conversa
                nome_pessoa: document.getElementById('nomePessoa').value.trim(),
                acontecimento_chave: document.getElementById('acontecimentoChave').value.trim(),
                reconheco_que: document.getElementById('reconhecoQue').value.trim(),
                causou_impactos: document.getElementById('causouImpactos').value.trim(),
                por_causa_disso: document.getElementById('porCausaDisso').value.trim() || null,
                isso_fez_com_que: document.getElementById('issoFezComQue').value.trim() || null,
                
                // Sentimentos
                sabe_como_pessoa_sentiu: document.getElementById('sabeComoSentiu').value ? 
                    document.getElementById('sabeComoSentiu').value === 'true' : null,
                pessoa_se_sentiu: document.getElementById('pessoaSeSentiu').value.trim() || null,
                pessoa_se_sente_hoje: document.getElementById('pessoaSesenteHoje').value.trim() || null,
                
                // Reconhecimento
                pessoas_envolvidas: document.getElementById('pessoasEnvolvidas').value.trim() || null,
                fiz_de_errado: document.getElementById('fizDeErrado').value.trim() || null,
                era_minha_responsabilidade: document.getElementById('eraMinhaResponsabilidade').value.trim() || null,
                
                // Reparação
                necessita_reparacao_material: document.getElementById('necessitaReparacao').value ? 
                    document.getElementById('necessitaReparacao').value === 'true' : null,
                reparacao_proposta: document.getElementById('reparacaoProposta').value.trim() || null,
                
                // Reflexão
                momentos_quando_tento: document.getElementById('momentosQuandoTento').value.trim() || null,
                utilidade_vida: document.getElementById('utilidadeVida').value.trim() || null,
                
                // Compromisso
                a_partir_de_hoje: document.getElementById('aPartirDeHoje').value.trim(),
                
                // Status
                conversa_realizada: false,
                data_conversa: null,
                resultado_conversa: null
            };
            
            console.log('📊 Dados do formulário coletados');
            
            console.log('💾 Salvando protocolo...');
            const { data, error } = await supabase
                .from('ad_protocolo_culpa_real')
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
        
        const pdaUrl = `pda.html?from=culpa-real&id=${savedProtocolId}`;
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
    
    console.log('✅ Form-culpa-real.js inicializado');
    
})();
