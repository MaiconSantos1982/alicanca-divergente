/**
 * Núcleo Emocional Externo
 * Mapeamento de pessoas em cuja vida VOCÊ interfere
 */

(function() {
    'use strict';
    
    let currentUser = null;
    let savedProtocolId = null;
    let pessoasCount = 0;
    
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
        
        addPessoa();
        
        document.getElementById('nucleoExternoForm').addEventListener('submit', handleSubmit);
        
        console.log('✅ Formulário configurado');
    }
    
    window.addPessoa = function() {
        pessoasCount++;
        const container = document.getElementById('pessoasContainer');
        
        const pessoaDiv = document.createElement('div');
        pessoaDiv.className = 'pessoa-item mb-4';
        pessoaDiv.id = `pessoa-${pessoasCount}`;
        
        pessoaDiv.innerHTML = `
            <div class="pessoa-header">
                <span class="pessoa-number">
                    <i data-feather="user" class="feather-xs"></i>
                    Pessoa ${pessoasCount}
                </span>
                ${pessoasCount > 1 ? `
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="removePessoa(${pessoasCount})">
                        <i data-feather="trash-2" class="feather-xs"></i>
                        Remover
                    </button>
                ` : ''}
            </div>
            <div class="pessoa-body">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Nome da Pessoa *</label>
                        <input type="text" class="form-control pessoa-nome" required 
                               placeholder="Ex: Maria Santos" oninput="updateResumo()">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Como você se comporta *</label>
                        <select class="form-select pessoa-quadrante" required onchange="updateResumo()">
                            <option value="">Selecione...</option>
                            <option value="Vítima Natural">😔 Vítima Natural (Ajudo)</option>
                            <option value="Vítima Intencional">⚠️ Vítima Intencional (Me envolvo)</option>
                            <option value="Vingador">⚡ Vingador (Culpo/ataco)</option>
                            <option value="Narcisista">🏆 Narcisista (Desconsidero)</option>
                        </select>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">
                        Nível de Interferência *
                        <span class="nivel-value" id="nivelValue-${pessoasCount}">3</span>
                    </label>
                    <div class="nivel-info mb-2">
                        <span class="nivel-label">1 = Você interfere muito</span>
                        <span class="nivel-label">5 = Você interfere pouco</span>
                    </div>
                    <input type="range" class="form-range pessoa-nivel" min="1" max="5" value="3" 
                           oninput="updateNivelDisplay(${pessoasCount}, this.value); updateResumo();">
                    <div class="nivel-markers">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                    </div>
                </div>
                <div class="mb-0">
                    <label class="form-label">Observações (opcional)</label>
                    <textarea class="form-control pessoa-obs" rows="2" 
                              placeholder="Como você interfere na vida dessa pessoa..."></textarea>
                </div>
            </div>
        `;
        
        container.appendChild(pessoaDiv);
        feather.replace();
        updateResumo();
    };
    
    window.removePessoa = function(id) {
        const elemento = document.getElementById(`pessoa-${id}`);
        if (elemento) {
            elemento.remove();
            pessoasCount--;
            renumberPessoas();
            updateResumo();
        }
    };
    
    function renumberPessoas() {
        const pessoas = document.querySelectorAll('.pessoa-item');
        pessoas.forEach((pessoa, index) => {
            const numero = pessoa.querySelector('.pessoa-number');
            if (numero) {
                const icon = numero.querySelector('i');
                numero.innerHTML = '';
                numero.appendChild(icon);
                numero.append(` Pessoa ${index + 1}`);
            }
        });
    }
    
    window.updateNivelDisplay = function(id, value) {
        const display = document.getElementById(`nivelValue-${id}`);
        if (display) {
            display.textContent = value;
        }
    };
    
    window.updateResumo = function() {
        const pessoas = getPessoas();
        
        if (pessoas.length === 0) {
            document.getElementById('resumoCard').style.display = 'none';
            return;
        }
        
        document.getElementById('resumoCard').style.display = 'block';
        
        document.getElementById('totalPessoas').textContent = pessoas.length;
        
        const counts = {
            'Vítima Natural': 0,
            'Vítima Intencional': 0,
            'Vingador': 0,
            'Narcisista': 0
        };
        
        let somaNiveis = 0;
        
        pessoas.forEach(p => {
            if (p.quadrante) {
                counts[p.quadrante]++;
            }
            somaNiveis += parseInt(p.nivel);
        });
        
        document.getElementById('countVitimanatural').textContent = counts['Vítima Natural'];
        document.getElementById('countVitimaIntencional').textContent = counts['Vítima Intencional'];
        document.getElementById('countVingador').textContent = counts['Vingador'];
        document.getElementById('countNarcisista').textContent = counts['Narcisista'];
        
        const nivelMedio = pessoas.length > 0 ? (somaNiveis / pessoas.length).toFixed(1) : 0;
        document.getElementById('nivelMedio').textContent = nivelMedio;
    };
    
    async function handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.spinner-border');
        
        const pessoas = getPessoas();
        if (pessoas.length === 0) {
            showAlert('Você precisa adicionar pelo menos uma pessoa!', 'danger');
            return;
        }
        
        const pessoasValidas = pessoas.filter(p => p.nome && p.quadrante && p.nivel);
        if (pessoasValidas.length < pessoas.length) {
            showAlert('Preencha todos os campos obrigatórios de cada pessoa!', 'danger');
            return;
        }
        
        submitBtn.disabled = true;
        btnText.classList.add('d-none');
        spinner.classList.remove('d-none');
        
        try {
            console.log('📝 Iniciando salvamento do mapeamento externo...');
            
            const formData = {
                user_id: currentUser.id,
                nome: document.getElementById('nome').value.trim() || null,
                data_preenchimento: document.getElementById('dataPreenchimento').value
            };
            
            console.log('📊 Dados do formulário:', formData);
            
            console.log('💾 Salvando registro principal...');
            const { data: nucleoData, error: nucleoError } = await supabase
                .from('ad_nucleo_emocional_externo')
                .insert([formData])
                .select();
            
            if (nucleoError) {
                console.error('❌ Erro ao salvar registro principal:', nucleoError);
                throw new Error(`Erro ao salvar mapeamento: ${nucleoError.message || JSON.stringify(nucleoError)}`);
            }
            
            if (!nucleoData || nucleoData.length === 0) {
                throw new Error('Nenhum dado retornado após inserção');
            }
            
            savedProtocolId = nucleoData[0].id;
            console.log('✅ Registro principal salvo com ID:', savedProtocolId);
            
            console.log('👥 Salvando pessoas...');
            await savePessoas(savedProtocolId, pessoasValidas);
            
            console.log('✅ Mapeamento salvo com sucesso!');
            
            const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
            modal.show();
            
        } catch (error) {
            console.error('❌ Erro geral ao salvar mapeamento:', error);
            
            let errorMessage = 'Erro ao salvar. ';
            
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
    
    function getPessoas() {
        const pessoas = [];
        const pessoaItems = document.querySelectorAll('.pessoa-item');
        
        pessoaItems.forEach((item) => {
            const nomeInput = item.querySelector('.pessoa-nome');
            const quadranteInput = item.querySelector('.pessoa-quadrante');
            const nivelInput = item.querySelector('.pessoa-nivel');
            const obsInput = item.querySelector('.pessoa-obs');
            
            if (!nomeInput || !quadranteInput || !nivelInput) {
                console.warn('Inputs não encontrados na pessoa');
                return;
            }
            
            const nome = nomeInput.value.trim();
            const quadrante = quadranteInput.value;
            const nivel = nivelInput.value;
            const obs = obsInput ? obsInput.value.trim() : null;
            
            if (nome || quadrante) {
                pessoas.push({
                    nome: nome,
                    quadrante: quadrante,
                    nivel: parseInt(nivel),
                    observacoes: obs || null
                });
            }
        });
        
        console.log('👥 Pessoas coletadas:', pessoas.length);
        return pessoas;
    }
    
    async function savePessoas(nucleoExternoId, pessoas) {
        if (!pessoas || pessoas.length === 0) {
            console.log('⚠️ Nenhuma pessoa para salvar');
            return;
        }
        
        const pessoasData = pessoas.map(p => ({
            nucleo_externo_id: nucleoExternoId,
            user_id: currentUser.id,
            nome_pessoa: p.nome,
            quadrante: p.quadrante,
            nivel_interferencia: p.nivel,
            observacoes: p.observacoes
        }));
        
        console.log('💾 Salvando', pessoasData.length, 'pessoas...');
        console.log('📊 Dados das pessoas:', pessoasData);
        
        const { data, error } = await supabase
            .from('ad_nucleo_externo_pessoas')
            .insert(pessoasData)
            .select();
        
        if (error) {
            console.error('❌ Erro completo ao salvar pessoas:', error);
            console.error('❌ Detalhes do erro:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw new Error(`Erro ao salvar pessoas: ${error.message || error.code || 'Erro desconhecido'}`);
        }
        
        console.log('✅ Pessoas salvas:', data?.length || pessoasData.length);
    }
    
    window.createPDA = function() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        modal.hide();
        
        const pdaUrl = `pda.html?from=nucleo-externo&id=${savedProtocolId}`;
        window.location.href = pdaUrl;
    };
    
    window.finishWithoutPDA = function() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        modal.hide();
        
        showAlert('Mapeamento salvo com sucesso!', 'success');
        
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
    
    console.log('✅ Form-nucleo-externo.js inicializado');
    
})();
