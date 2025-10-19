/**
 * Plano Perfeito - Definindo Foco
 * Formulário complexo com múltiplas seções
 */

(function() {
    'use strict';
    
    let currentUser = null;
    let savedProtocolId = null;
    let objetivosCount = 0;
    let fichasDistribuidas = {
        financeiro: 0,
        saude: 0,
        relacionamento: 0
    };
    
    const mesesMap = {
        'Janeiro': 'progressoJaneiro',
        'Fevereiro': 'progressoFevereiro',
        'Março': 'progressoMarco',
        'Abril': 'progressoAbril',
        'Maio': 'progressoMaio',
        'Junho': 'progressoJunho',
        'Julho': 'progressoJulho',
        'Agosto': 'progressoAgosto',
        'Setembro': 'progressoSetembro',
        'Outubro': 'progressoOutubro',
        'Novembro': 'progressoNovembro',
        'Dezembro': 'progressoDezembro'
    };
    
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
    
    // ========================================
    // SETUP DO FORMULÁRIO
    // ========================================
    
    function setupForm() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dataPreenchimento').value = today;
        
        // Adicionar 3 objetivos iniciais
        for (let i = 0; i < 3; i++) {
            addObjetivo();
        }
        
        // Handler do formulário
        document.getElementById('focoForm').addEventListener('submit', handleSubmit);
        
        updateProgress();
        updateFichasDisplay();
        
        console.log('✅ Formulário configurado');
    }
    
    // ========================================
    // GESTÃO DE FICHAS
    // ========================================
    
    window.adjustFichas = function(pilar, delta) {
        const totalAtual = Object.values(fichasDistribuidas).reduce((a, b) => a + b, 0);
        const novoValor = fichasDistribuidas[pilar] + delta;
        
        // Validações
        if (novoValor < 0) return;
        if (novoValor > 5) return;
        if (delta > 0 && totalAtual >= 5) {
            showAlert('Você já distribuiu todas as 5 fichas!', 'warning');
            return;
        }
        
        fichasDistribuidas[pilar] = novoValor;
        updateFichasDisplay();
        updateProgress();
    };
    
    function updateFichasDisplay() {
        document.getElementById('fichasFinanceiro').textContent = fichasDistribuidas.financeiro;
        document.getElementById('fichasSaude').textContent = fichasDistribuidas.saude;
        document.getElementById('fichasRelacionamento').textContent = fichasDistribuidas.relacionamento;
        
        const total = Object.values(fichasDistribuidas).reduce((a, b) => a + b, 0);
        document.getElementById('fichasTotal').textContent = total;
        
        const alert = document.getElementById('fichasAlert');
        if (total !== 5) {
            alert.classList.remove('d-none');
        } else {
            alert.classList.add('d-none');
        }
        
        feather.replace();
    }
    
    // ========================================
    // GESTÃO DE OBJETIVOS
    // ========================================
    
    window.addObjetivo = function() {
        if (objetivosCount >= 5) {
            showAlert('Máximo de 5 objetivos permitidos', 'warning');
            return;
        }
        
        objetivosCount++;
        const container = document.getElementById('objetivosContainer');
        
        const objetivoDiv = document.createElement('div');
        objetivoDiv.className = 'objetivo-item mb-3';
        objetivoDiv.id = `objetivo-${objetivosCount}`;
        
        objetivoDiv.innerHTML = `
            <div class="objetivo-header">
                <span class="objetivo-number">Objetivo ${objetivosCount}</span>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeObjetivo(${objetivosCount})">
                    <i data-feather="trash-2" class="feather-xs"></i>
                    Remover
                </button>
            </div>
            <div class="row">
                <div class="col-md-8 mb-3">
                    <label class="form-label">Descrição do Objetivo *</label>
                    <textarea class="form-control objetivo-texto" rows="2" required 
                              placeholder="Ex: Aumentar faturamento em 50%"></textarea>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">Pilar *</label>
                    <select class="form-select objetivo-pilar" required>
                        <option value="">Selecione...</option>
                        <option value="Financeiro">💰 Financeiro</option>
                        <option value="Saúde">❤️ Saúde</option>
                        <option value="Relacionamento">👥 Relacionamento</option>
                    </select>
                </div>
            </div>
        `;
        
        container.appendChild(objetivoDiv);
        feather.replace();
        
        // Limitar botão de adicionar
        if (objetivosCount >= 5) {
            document.getElementById('btnAddObjetivo').disabled = true;
        }
        
        updateProgress();
    };
    
    window.removeObjetivo = function(id) {
        const elemento = document.getElementById(`objetivo-${id}`);
        if (elemento) {
            elemento.remove();
            objetivosCount--;
            
            // Reabilitar botão de adicionar
            if (objetivosCount < 5) {
                document.getElementById('btnAddObjetivo').disabled = false;
            }
            
            // Renumerar objetivos
            renumberObjetivos();
            updateProgress();
        }
    };
    
    function renumberObjetivos() {
        const objetivos = document.querySelectorAll('.objetivo-item');
        objetivos.forEach((obj, index) => {
            const numero = obj.querySelector('.objetivo-number');
            if (numero) {
                numero.textContent = `Objetivo ${index + 1}`;
            }
        });
    }
    
    // ========================================
    // PROGRESSO
    // ========================================
    
    window.updateProgress = function() {
        const requiredFields = [
            'sonhoGrande',
            'comoSeraMedido',
            'meta',
            'prazo'
        ];
        
        let filledFields = 0;
        const totalFields = requiredFields.length + 2; // +2 para fichas e objetivos
        
        // Verificar campos obrigatórios
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value.trim() !== '') {
                filledFields++;
            }
        });
        
        // Verificar fichas (1 ponto se distribuído corretamente)
        const totalFichas = Object.values(fichasDistribuidas).reduce((a, b) => a + b, 0);
        if (totalFichas === 5) {
            filledFields++;
        }
        
        // Verificar objetivos (1 ponto se tiver pelo menos 3)
        const objetivosPreenchidos = document.querySelectorAll('.objetivo-texto');
        let objetivosValidos = 0;
        objetivosPreenchidos.forEach(obj => {
            if (obj.value.trim() !== '') objetivosValidos++;
        });
        if (objetivosValidos >= 3) {
            filledFields++;
        }
        
        const progress = Math.round((filledFields / totalFields) * 100);
        
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
    
        // ========================================
    // SUBMIT DO FORMULÁRIO (CORRIGIDO)
    // ========================================
    
    async function handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.spinner-border');
        
        // Validar fichas
        const totalFichas = Object.values(fichasDistribuidas).reduce((a, b) => a + b, 0);
        if (totalFichas !== 5) {
            showAlert('Você precisa distribuir exatamente 5 fichas entre os pilares!', 'danger');
            return;
        }
        
        // Validar objetivos
        const objetivos = getObjetivos();
        if (objetivos.length < 3) {
            showAlert('Você precisa definir pelo menos 3 objetivos!', 'danger');
            return;
        }
        
        if (!e.target.checkValidity()) {
            e.target.reportValidity();
            return;
        }
        
        // Loading state
        submitBtn.disabled = true;
        btnText.classList.add('d-none');
        spinner.classList.remove('d-none');
        
        try {
            console.log('📝 Iniciando salvamento do protocolo...');
            
            // Dados principais
            const formData = {
                user_id: currentUser.id,
                nome: document.getElementById('nome').value.trim() || null,
                data_preenchimento: document.getElementById('dataPreenchimento').value,
                sonho_grande: document.getElementById('sonhoGrande').value.trim(),
                como_sera_medido: document.getElementById('comoSeraMedido').value.trim(),
                meta: document.getElementById('meta').value.trim(),
                prazo: document.getElementById('prazo').value.trim(),
                fichas_financeiro: fichasDistribuidas.financeiro,
                fichas_saude: fichasDistribuidas.saude,
                fichas_relacionamento: fichasDistribuidas.relacionamento
            };
            
            console.log('📊 Dados do formulário:', formData);
            
            // Inserir registro principal
            console.log('💾 Salvando registro principal...');
            const { data: planoData, error: planoError } = await supabase
                .from('ad_plano_perfeito_foco')
                .insert([formData])
                .select();
            
            if (planoError) {
                console.error('❌ Erro ao salvar registro principal:', planoError);
                throw new Error(`Erro ao salvar plano: ${planoError.message || JSON.stringify(planoError)}`);
            }
            
            if (!planoData || planoData.length === 0) {
                throw new Error('Nenhum dado retornado após inserção');
            }
            
            savedProtocolId = planoData[0].id;
            console.log('✅ Registro principal salvo com ID:', savedProtocolId);
            
            // Inserir objetivos
            try {
                console.log('🎯 Salvando objetivos...');
                await saveObjetivos(savedProtocolId, objetivos);
            } catch (objError) {
                console.error('⚠️ Erro ao salvar objetivos (não crítico):', objError);
                // Não bloqueia o fluxo - objetivos são opcionais
            }
            
            // Inserir progresso mensal (se preenchido)
            try {
                console.log('📅 Salvando progresso mensal...');
                await saveProgressoMensal(savedProtocolId);
            } catch (progError) {
                console.error('⚠️ Erro ao salvar progresso (não crítico):', progError);
                // Não bloqueia o fluxo - progresso é opcional
            }
            
            console.log('✅ Protocolo salvo com sucesso!');
            
            // Mostrar modal de confirmação
            const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
            modal.show();
            
        } catch (error) {
            console.error('❌ Erro geral ao salvar protocolo:', error);
            
            let errorMessage = 'Erro ao salvar. ';
            
            if (error.message) {
                errorMessage += error.message;
            } else if (typeof error === 'object') {
                errorMessage += JSON.stringify(error);
            } else {
                errorMessage += 'Tente novamente.';
            }
            
            showAlert(errorMessage, 'danger');
            
            // Reset button
            submitBtn.disabled = false;
            btnText.classList.remove('d-none');
            spinner.classList.add('d-none');
        }
    }
    
    // ========================================
    // FUNÇÕES AUXILIARES (CORRIGIDAS)
    // ========================================
    
    function getObjetivos() {
        const objetivos = [];
        const objetivoItems = document.querySelectorAll('.objetivo-item');
        
        objetivoItems.forEach((item, index) => {
            const textoInput = item.querySelector('.objetivo-texto');
            const pilarInput = item.querySelector('.objetivo-pilar');
            
            if (!textoInput || !pilarInput) {
                console.warn('Inputs não encontrados no objetivo', index);
                return;
            }
            
            const texto = textoInput.value.trim();
            const pilar = pilarInput.value;
            
            if (texto && pilar) {
                objetivos.push({
                    numero_objetivo: index + 1,
                    objetivo: texto,
                    pilar: pilar
                });
            }
        });
        
        console.log('🎯 Objetivos coletados:', objetivos.length);
        return objetivos;
    }
    
    async function saveObjetivos(planoFocoId, objetivos) {
        if (!objetivos || objetivos.length === 0) {
            console.log('⚠️ Nenhum objetivo para salvar');
            return;
        }
        
        const objetivosData = objetivos.map(obj => ({
            plano_foco_id: planoFocoId,
            user_id: currentUser.id,
            numero_objetivo: obj.numero_objetivo,
            objetivo: obj.objetivo,
            pilar: obj.pilar
        }));
        
        console.log('💾 Salvando', objetivosData.length, 'objetivos...');
        
        const { data, error } = await supabase
            .from('ad_plano_perfeito_objetivos')
            .insert(objetivosData)
            .select();
        
        if (error) {
            console.error('❌ Erro ao salvar objetivos:', error);
            throw new Error(`Erro ao salvar objetivos: ${error.message}`);
        }
        
        console.log('✅ Objetivos salvos:', data?.length || objetivosData.length);
    }
    
    async function saveProgressoMensal(planoFocoId) {
        const progressoData = [];
        
        Object.keys(mesesMap).forEach(mesNome => {
            const fieldId = mesesMap[mesNome];
            const campo = document.getElementById(fieldId);
            
            if (!campo) {
                console.warn('Campo não encontrado:', fieldId);
                return;
            }
            
            const progresso = campo.value.trim();
            
            if (progresso) {
                progressoData.push({
                    plano_foco_id: planoFocoId,
                    user_id: currentUser.id,
                    mes: mesNome.toUpperCase(),
                    progresso: progresso
                });
            }
        });
        
        if (progressoData.length === 0) {
            console.log('ℹ️ Nenhum progresso mensal preenchido');
            return;
        }
        
        console.log('💾 Salvando progresso de', progressoData.length, 'meses...');
        
        const { data, error } = await supabase
            .from('ad_plano_perfeito_progresso')
            .insert(progressoData)
            .select();
        
        if (error) {
            console.error('❌ Erro ao salvar progresso:', error);
            throw new Error(`Erro ao salvar progresso mensal: ${error.message}`);
        }
        
        console.log('✅ Progresso mensal salvo:', data?.length || progressoData.length, 'meses');
    }

    
    // ========================================
    // CRIAR PDA
    // ========================================
    
    window.createPDA = function() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        modal.hide();
        
        const pdaUrl = `pda.html?from=foco&id=${savedProtocolId}`;
        window.location.href = pdaUrl;
    };
    
    // ========================================
    // FINALIZAR SEM PDA
    // ========================================
    
    window.finishWithoutPDA = function() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        modal.hide();
        
        showAlert('Plano salvo com sucesso!', 'success');
        
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
        
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);
        
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
    
    console.log('✅ Form-plano-perfeito-foco.js inicializado');
    
})();
