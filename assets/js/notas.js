/**
 * Notas e Percepções - Áudios Diários e Encontros
 */

(function() {
    'use strict';
    
    let currentUser = null;
    
    document.addEventListener('DOMContentLoaded', async () => {
        await checkAuth();
        setupForm();
        await loadNotas();
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
    
    function setupForm() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dataEvento').value = today;
        
        document.getElementById('notasForm').addEventListener('submit', handleSubmit);
        
        console.log('✅ Formulário configurado');
    }
    
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
    
    async function handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.spinner-border');
        
        submitBtn.disabled = true;
        btnText.classList.add('d-none');
        spinner.classList.remove('d-none');
        
        try {
            const formData = {
                user_id: currentUser.id,
                tipo: document.getElementById('tipo').value,
                data_evento: document.getElementById('dataEvento').value,
                titulo: document.getElementById('titulo').value.trim(),
                conteudo: document.getElementById('conteudo').value.trim()
            };
            
            const { data, error } = await supabase
                .from('ad_notas')
                .insert([formData])
                .select();
            
            if (error) throw error;
            
            showAlert('Nota salva com sucesso!', 'success');
            
            // Limpar form
            document.getElementById('notasForm').reset();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('dataEvento').value = today;
            
            // Recarregar notas
            await loadNotas();
            
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showAlert('Erro ao salvar nota: ' + (error.message || 'Tente novamente'), 'danger');
        } finally {
            submitBtn.disabled = false;
            btnText.classList.remove('d-none');
            spinner.classList.add('d-none');
        }
    }
    
    async function loadNotas() {
        try {
            const container = document.getElementById('notasRecentes');
            
            const { data: notas, error } = await supabase
                .from('ad_notas')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('data_evento', { ascending: false })
                .limit(10);
            
            if (error) throw error;
            
            if (!notas || notas.length === 0) {
                container.innerHTML = '<p class="text-muted text-center">Nenhuma nota registrada ainda.</p>';
                return;
            }
            
            let html = '<div class="list-group">';
            
            notas.forEach(nota => {
                const tipoLabel = getTipoLabel(nota.tipo);
                const tipoColor = getTipoColor(nota.tipo);
                const dataFormatted = formatDate(nota.data_evento);
                
                html += `
                    <div class="list-group-item list-group-item-action" onclick="viewNota('${nota.id}')">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <span class="badge" style="background: ${tipoColor};">${tipoLabel}</span>
                                <small class="text-muted ms-2">${dataFormatted}</small>
                            </div>
                        </div>
                        <h6 class="mb-1">${escapeHtml(nota.titulo)}</h6>
                        <p class="mb-0 text-muted small">${truncateText(escapeHtml(nota.conteudo), 100)}</p>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Erro ao carregar notas:', error);
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
                    <div class="nota-content">
                        ${escapeHtml(nota.conteudo).replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;
            
            const modal = new bootstrap.Modal(document.getElementById('viewModal'));
            modal.show();
            
        } catch (error) {
            console.error('Erro ao carregar nota:', error);
        }
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
            if (alertElement) alertElement.remove();
        }, 5000);
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    console.log('✅ Notas.js inicializado');
    
})();
