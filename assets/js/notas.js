/**
 * Notas e Percepções - Áudios Diários e Encontros
 */

(function() {
    'use strict';
    
    let currentUser = null;
    let editingNoteId = null;
    
    document.addEventListener('DOMContentLoaded', async () => {
        await checkAuth();
        await loadNotas();
        await updateStats();
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
            
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            window.location.href = 'index.html';
        }
    }
    
    window.openNewNoteModal = function() {
        editingNoteId = null;
        
        // Limpar formulário
        document.getElementById('notasForm').reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dataEvento').value = today;
        
        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('newNoteModal'));
        modal.show();
        
        // Atualizar ícones
        setTimeout(() => feather.replace(), 100);
    };
    
    window.updateLabels = function() {
        const tipo = document.getElementById('tipo').value;
        const labelData = document.getElementById('labelData');
        const placeholderText = document.getElementById('placeholderText');
        const conteudoTextarea = document.getElementById('conteudo');
        
        const labels = {
            'audio_diario': {
                data: 'Data do Áudio *',
                placeholder: 'Anote aqui seu resumo ou percepções sobre o áudio diário'
            },
            'impulso': {
                data: 'Data do Encontro de Impulso *',
                placeholder: 'Anote aqui seu resumo ou percepções sobre o encontro de impulso'
            },
            'reforco': {
                data: 'Data do Encontro de Reforço *',
                placeholder: 'Anote aqui seu resumo ou percepções sobre o encontro de reforço'
            }
        };
        
        if (tipo && labels[tipo]) {
            labelData.textContent = labels[tipo].data;
            placeholderText.textContent = labels[tipo].placeholder;
            conteudoTextarea.placeholder = labels[tipo].placeholder;
        }
    };
    
    window.handleSubmit = async function() {
        const form = document.getElementById('notasForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        try {
            const formData = {
                user_id: currentUser.id,
                tipo: document.getElementById('tipo').value,
                data_evento: document.getElementById('dataEvento').value,
                titulo: document.getElementById('titulo').value.trim(),
                conteudo: document.getElementById('conteudo').value.trim()
            };
            
            if (editingNoteId) {
                // Atualizar nota existente
                const { error } = await supabase
                    .from('ad_notas')
                    .update(formData)
                    .eq('id', editingNoteId);
                
                if (error) throw error;
                showAlert('Nota atualizada com sucesso!', 'success');
            } else {
                // Criar nova nota
                const { error } = await supabase
                    .from('ad_notas')
                    .insert([formData]);
                
                if (error) throw error;
                showAlert('Nota salva com sucesso!', 'success');
            }
            
            // Fechar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newNoteModal'));
            modal.hide();
            
            // Recarregar notas
            await loadNotas();
            await updateStats();
            
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showAlert('Erro ao salvar nota: ' + (error.message || 'Tente novamente'), 'danger');
        }
    };
    
    async function updateStats() {
        try {
            const { data: notas, error } = await supabase
                .from('ad_notas')
                .select('tipo')
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            
            const total = notas?.length || 0;
            const audios = notas?.filter(n => n.tipo === 'audio_diario').length || 0;
            const impulso = notas?.filter(n => n.tipo === 'impulso').length || 0;
            const reforco = notas?.filter(n => n.tipo === 'reforco').length || 0;
            
            document.getElementById('totalNotas').textContent = total;
            document.getElementById('countAudios').textContent = audios;
            document.getElementById('countImpulso').textContent = impulso;
            document.getElementById('countReforco').textContent = reforco;
            
        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
        }
    }
    
    async function loadNotas() {
        try {
            const container = document.getElementById('notasContainer');
            
            // Obter filtros
            const filterTipo = document.getElementById('filterTipo')?.value || '';
            const filterDateStart = document.getElementById('filterDateStart')?.value || '';
            const filterDateEnd = document.getElementById('filterDateEnd')?.value || '';
            
            // Construir query
            let query = supabase
                .from('ad_notas')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('data_evento', { ascending: false });
            
            if (filterTipo) {
                query = query.eq('tipo', filterTipo);
            }
            
            if (filterDateStart) {
                query = query.gte('data_evento', filterDateStart);
            }
            
            if (filterDateEnd) {
                query = query.lte('data_evento', filterDateEnd);
            }
            
            const { data: notas, error } = await query;
            
            if (error) throw error;
            
            if (!notas || notas.length === 0) {
                container.innerHTML = `
                    <div class="empty-state py-5">
                        <i data-feather="inbox" style="width: 48px; height: 48px; color: var(--accent-gold);"></i>
                        <h4 class="mt-3">Nenhuma nota registrada</h4>
                        <p class="text-muted">Clique em "Nova Nota" para começar</p>
                    </div>
                `;
                feather.replace();
                return;
            }
            
            let html = '<div class="notes-list">';
            
            notas.forEach(nota => {
    const tipoLabel = getTipoLabel(nota.tipo);
    const tipoColor = getTipoColor(nota.tipo);
    const dataFormatted = formatDate(nota.data_evento);
    
    html += `
        <div class="note-item">
            <!-- Linha 1: Tag e Título -->
            <div class="note-line-1">
                <div class="note-type-title">
                    <span class="badge" style="background: ${tipoColor};">${tipoLabel}</span>
                    <h5 class="note-title">${escapeHtml(nota.titulo)}</h5>
                </div>
                <small class="text-muted">${dataFormatted}</small>
            </div>
            
            <!-- Linha 2: Descrição e Botões -->
            <div class="note-line-2">
                <p class="note-excerpt">${truncateText(escapeHtml(nota.conteudo), 150)}</p>
                <div class="note-actions">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewNota('${nota.id}')" title="Visualizar">
                        <i data-feather="eye" class="feather-xs"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" onclick="editNota('${nota.id}')" title="Editar">
                        <i data-feather="edit-2" class="feather-xs"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteNota('${nota.id}')" title="Excluir">
                        <i data-feather="trash-2" class="feather-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
});
            
            html += '</div>';
            container.innerHTML = html;
            feather.replace();
            
        } catch (error) {
            console.error('Erro ao carregar notas:', error);
            document.getElementById('notasContainer').innerHTML = `
                <div class="alert alert-danger">
                    Erro ao carregar notas. Recarregue a página.
                </div>
            `;
        }
    }
    
    window.viewNota = async function(id) {
        try {
            const { data: nota, error } = await supabase
                .from('ad_notas')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            const tipoLabel = getTipoLabel(nota.tipo);
            const tipoColor = getTipoColor(nota.tipo);
            const dataFormatted = formatDate(nota.data_evento);
            
            const modalBody = document.getElementById('viewModalBody');
            modalBody.innerHTML = `
                <div class="details-container">
                    <div class="mb-3">
                        <span class="badge" style="background: ${tipoColor};">${tipoLabel}</span>
                        <small class="text-muted ms-2">${dataFormatted}</small>
                    </div>
                    <h4 class="mb-3">${escapeHtml(nota.titulo)}</h4>
                    <div class="nota-content" style="white-space: pre-wrap; line-height: 1.8;">
                        ${escapeHtml(nota.conteudo)}
                    </div>
                </div>
            `;
            
            const modal = new bootstrap.Modal(document.getElementById('viewModal'));
            modal.show();
            
        } catch (error) {
            console.error('Erro ao carregar nota:', error);
        }
    };
    
    window.editNota = async function(id) {
        try {
            const { data: nota, error } = await supabase
                .from('ad_notas')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            editingNoteId = id;
            
            // Preencher formulário
            document.getElementById('tipo').value = nota.tipo;
            document.getElementById('dataEvento').value = nota.data_evento;
            document.getElementById('titulo').value = nota.titulo;
            document.getElementById('conteudo').value = nota.conteudo;
            
            updateLabels();
            
            // Abrir modal
            const modal = new bootstrap.Modal(document.getElementById('newNoteModal'));
            modal.show();
            
            setTimeout(() => feather.replace(), 100);
            
        } catch (error) {
            console.error('Erro ao carregar nota para edição:', error);
            showAlert('Erro ao carregar nota', 'danger');
        }
    };
    
    window.deleteNota = async function(id) {
        if (!confirm('Deseja realmente excluir esta nota? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        try {
            const { error } = await supabase
                .from('ad_notas')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            showAlert('Nota excluída com sucesso!', 'success');
            await loadNotas();
            await updateStats();
            
        } catch (error) {
            console.error('Erro ao excluir nota:', error);
            showAlert('Erro ao excluir nota: ' + (error.message || 'Tente novamente'), 'danger');
        }
    };
    
    window.clearFilters = function() {
        const filterTipo = document.getElementById('filterTipo');
        const filterDateStart = document.getElementById('filterDateStart');
        const filterDateEnd = document.getElementById('filterDateEnd');
        
        if (filterTipo) filterTipo.value = '';
        if (filterDateStart) filterDateStart.value = '';
        if (filterDateEnd) filterDateEnd.value = '';
        
        loadNotas();
    };
    
    function getTipoLabel(tipo) {
        const labels = {
            'audio_diario': 'Áudio Diário',
            'impulso': 'Impulso',
            'reforco': 'Reforço'
        };
        return labels[tipo] || tipo;
    }
    
    function getTipoColor(tipo) {
        const colors = {
            'audio_diario': '#17a2b8',
            'impulso': '#28a745',
            'reforco': '#ffc107'
        };
        return colors[tipo] || '#6c757d';
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric' 
        });
    }
    
    function truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function showAlert(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast-notification toast-' + type;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'danger' ? '#dc3545' : '#17a2b8'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
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
    
    // Expor loadNotas globalmente para os filtros
    window.loadNotas = loadNotas;
    
    console.log('✅ Notas.js inicializado');
    
})();
