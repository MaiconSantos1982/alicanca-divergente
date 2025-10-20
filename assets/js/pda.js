/**
 * PDA - Percepção, Decisão, Ação
 * Sistema de gerenciamento de tarefas
 */

(function() {
    'use strict';
    
    let currentUser = null;
    let currentPDAId = null;
    let pdaToDelete = null;
    
    // Inicialização
    document.addEventListener('DOMContentLoaded', async () => {
        await checkAuthAndLoad();
    });
    
    // ========================================
    // AUTENTICAÇÃO
    // ========================================
    
    async function checkAuthAndLoad() {
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
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('pdaDataAcao').value = today;
        
        await loadPDAs();
        
        setupStatusListener();  // ← ADICIONE ESTA LINHA
        
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = 'index.html';
    }
}

    // ========================================
// LISTENER PARA STATUS "CONCLUÍDO"
// ========================================

function setupStatusListener() {
    // Adicionar listener ao select de status no modal
    const statusSelect = document.getElementById('pdaStatus');
    if (statusSelect) {
        statusSelect.addEventListener('change', function() {
            if (this.value === 'Concluído') {
                showCelebrationModal();
            }
        });
    }
}

function showCelebrationModal() {
    const modal = new bootstrap.Modal(document.getElementById('celebracaoModal'));
    modal.show();
    
    // Atualizar ícones após abrir o modal
    setTimeout(() => feather.replace(), 100);
}

    // ========================================
    // CARREGAR PDAs
    // ========================================
    
    window.loadPDAs = async function() {
        try {
            const listContainer = document.getElementById('pdasList');
            listContainer.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-gold" role="status"></div>
                    <p class="mt-3 text-muted">Carregando PDAs...</p>
                </div>
            `;
            
            // Obter filtros
            const filterStatus = document.getElementById('filterStatus').value;
            const searchText = document.getElementById('searchText').value.toLowerCase();
            const sortBy = document.getElementById('sortBy').value;
            
            // Query base
            let query = supabase
                .from('ad_pda_geral')
                .select('*')
                .eq('user_id', currentUser.id);
            
            // Aplicar filtro de status
            if (filterStatus) {
                query = query.eq('status', filterStatus);
            }
            
            // Aplicar ordenação
            switch(sortBy) {
                case 'data_acao_desc':
                    query = query.order('data_acao', { ascending: false });
                    break;
                case 'data_acao_asc':
                    query = query.order('data_acao', { ascending: true });
                    break;
                case 'created_desc':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'created_asc':
                    query = query.order('created_at', { ascending: true });
                    break;
            }
            
            const { data: pdas, error } = await query;
            
            if (error) throw error;
            
            // Aplicar busca por texto (client-side)
            let filteredPDAs = pdas;
            if (searchText) {
                filteredPDAs = pdas.filter(pda => 
                    pda.titulo.toLowerCase().includes(searchText) ||
                    pda.percepcao.toLowerCase().includes(searchText) ||
                    pda.decisao.toLowerCase().includes(searchText) ||
                    pda.acao.toLowerCase().includes(searchText)
                );
            }
            
            // Renderizar PDAs
            renderPDAs(filteredPDAs);
            
        } catch (error) {
            console.error('Erro ao carregar PDAs:', error);
            showError('Erro ao carregar PDAs. Recarregue a página.');
        }
    };
    
    function renderPDAs(pdas) {
        const listContainer = document.getElementById('pdasList');
        
        if (pdas.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i data-feather="inbox" style="width: 64px; height: 64px; color: var(--accent-gold);"></i>
                    <h3>Nenhum PDA encontrado</h3>
                    <p>Comece criando seu primeiro PDA clicando no botão "Novo PDA"</p>
                </div>
            `;
            feather.replace();
            return;
        }
        
        let html = '<div class="row g-4">';
        
        pdas.forEach(pda => {
            const statusBadge = getStatusBadge(pda.status);
            const dataFormatada = formatDate(pda.data_acao);
            const criadoEm = formatDateTime(pda.created_at);
            
            html += `
                <div class="col-12">
                    <div class="pda-card" onclick="viewPDA('${pda.id}')">
                        <div class="pda-card-header">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <h4 class="pda-title">${escapeHtml(pda.titulo)}</h4>
                                    <div class="pda-meta">
                                        <span class="meta-item">
                                            <i data-feather="calendar" class="feather-xs"></i>
                                            ${dataFormatada}
                                        </span>
                                        <span class="meta-item">
                                            <i data-feather="clock" class="feather-xs"></i>
                                            ${criadoEm}
                                        </span>
                                    </div>
                                </div>
                                <div class="pda-actions">
                                    ${statusBadge}
                                </div>
                            </div>
                        </div>
                        <div class="pda-card-body">
                            <div class="pda-section">
                                <strong>Percepção:</strong>
                                <p>${truncateText(escapeHtml(pda.percepcao), 150)}</p>
                            </div>
                            <div class="pda-section">
                                <strong>Decisão:</strong>
                                <p>${truncateText(escapeHtml(pda.decisao), 150)}</p>
                            </div>
                            <div class="pda-section">
                                <strong>Ação:</strong>
                                <p>${truncateText(escapeHtml(pda.acao), 150)}</p>
                            </div>
                        </div>
                        <div class="pda-card-footer">
                            <button class="btn btn-sm btn-outline-primary" onclick="event.stopPropagation(); editPDA('${pda.id}')">
                                <i data-feather="edit-2" class="feather-xs"></i>
                                Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deletePDA('${pda.id}')">
                                <i data-feather="trash-2" class="feather-xs"></i>
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        listContainer.innerHTML = html;
        feather.replace();
    }
    
    // ========================================
    // MODAL - NOVO PDA
    // ========================================
    
    window.openNewPDA = function() {
        currentPDAId = null;
        document.getElementById('pdaModalTitle').textContent = 'Novo PDA';
        document.getElementById('pdaForm').reset();
        
        // Data padrão hoje
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('pdaDataAcao').value = today;
        document.getElementById('pdaStatus').value = 'Não iniciado';
    };
    
    // ========================================
    // EDITAR PDA
    // ========================================
    
    window.editPDA = async function(pdaId) {
        try {
            const { data: pda, error } = await supabase
                .from('ad_pda_geral')
                .select('*')
                .eq('id', pdaId)
                .single();
            
            if (error) throw error;
            
            currentPDAId = pdaId;
            document.getElementById('pdaModalTitle').textContent = 'Editar PDA';
            document.getElementById('pdaTitulo').value = pda.titulo;
            document.getElementById('pdaPercepcao').value = pda.percepcao;
            document.getElementById('pdaDecisao').value = pda.decisao;
            document.getElementById('pdaAcao').value = pda.acao;
            document.getElementById('pdaDataAcao').value = pda.data_acao;
            document.getElementById('pdaStatus').value = pda.status;
            document.getElementById('pdaObservacoes').value = pda.observacoes || '';
            
            const modal = new bootstrap.Modal(document.getElementById('pdaModal'));
            modal.show();
            
        } catch (error) {
            console.error('Erro ao carregar PDA:', error);
            alert('Erro ao carregar PDA para edição.');
        }
    };
    
    // ========================================
    // VISUALIZAR PDA
    // ========================================
    
    window.viewPDA = function(pdaId) {
        // Por enquanto, apenas abre para edição
        // Futuramente pode ter uma visualização read-only
        editPDA(pdaId);
    };
    
    // ========================================
    // SALVAR PDA
    // ========================================
    
    window.savePDA = async function() {
        try {
            const form = document.getElementById('pdaForm');
            
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            const pdaData = {
                user_id: currentUser.id,
                titulo: document.getElementById('pdaTitulo').value.trim(),
                percepcao: document.getElementById('pdaPercepcao').value.trim(),
                decisao: document.getElementById('pdaDecisao').value.trim(),
                acao: document.getElementById('pdaAcao').value.trim(),
                data_acao: document.getElementById('pdaDataAcao').value,
                status: document.getElementById('pdaStatus').value,
                observacoes: document.getElementById('pdaObservacoes').value.trim() || null
            };
            
            let result;
            
            if (currentPDAId) {
                // Atualizar
                result = await supabase
                    .from('ad_pda_geral')
                    .update(pdaData)
                    .eq('id', currentPDAId);
            } else {
                // Inserir
                result = await supabase
                    .from('ad_pda_geral')
                    .insert([pdaData]);
            }
            
            if (result.error) throw result.error;
            
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('pdaModal'));
            modal.hide();
            
            // Recarregar lista
            await loadPDAs();
            
            showSuccess(currentPDAId ? 'PDA atualizado com sucesso!' : 'PDA criado com sucesso!');
            
        } catch (error) {
            console.error('Erro ao salvar PDA:', error);
            alert('Erro ao salvar PDA. Tente novamente.');
        }
    };
    
    // ========================================
    // EXCLUIR PDA
    // ========================================
    
    window.deletePDA = function(pdaId) {
        pdaToDelete = pdaId;
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    };
    
    window.confirmDelete = async function() {
        try {
            const { error } = await supabase
                .from('ad_pda_geral')
                .delete()
                .eq('id', pdaToDelete);
            
            if (error) throw error;
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            
            await loadPDAs();
            showSuccess('PDA excluído com sucesso!');
            
        } catch (error) {
            console.error('Erro ao excluir PDA:', error);
            alert('Erro ao excluir PDA. Tente novamente.');
        }
    };
    
    // ========================================
    // FUNÇÕES AUXILIARES
    // ========================================
    
    function getStatusBadge(status) {
        const badges = {
            'Não iniciado': '<span class="badge badge-status badge-not-started">Não iniciado</span>',
            'Em andamento': '<span class="badge badge-status badge-in-progress">Em andamento</span>',
            'Concluído': '<span class="badge badge-status badge-completed">Concluído</span>',
            'Cancelado': '<span class="badge badge-status badge-canceled">Cancelado</span>'
        };
        return badges[status] || status;
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
    }
    
    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function showSuccess(message) {
        // Toast simples
        const toast = document.createElement('div');
        toast.className = 'toast-notification toast-success';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    function showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification toast-error';
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
    
    console.log('✅ PDA.js inicializado');
    
})();
