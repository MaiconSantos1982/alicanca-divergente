/**
 * Histórico - Visualização cronológica de todos os protocolos
 */

(function() {
    'use strict';
    
    let currentUser = null;
    let allProtocols = [];
    
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
            
            // Carregar histórico
            await loadHistory();
            
            // Adicionar listeners aos filtros
            const filterType = document.getElementById('filterType');
            const filterDateStart = document.getElementById('filterDateStart');
            const filterDateEnd = document.getElementById('filterDateEnd');
            
            if (filterType) filterType.addEventListener('change', loadHistory);
            if (filterDateStart) filterDateStart.addEventListener('change', loadHistory);
            if (filterDateEnd) filterDateEnd.addEventListener('change', loadHistory);
            
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            window.location.href = 'index.html';
        }
    }
    
    // ========================================
    // CARREGAR HISTÓRICO
    // ========================================
    
    window.loadHistory = async function() {
        try {
            const timeline = document.getElementById('timeline');
            timeline.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-gold" role="status"></div>
                    <p class="mt-3 text-muted">Carregando histórico...</p>
                </div>
            `;
            
            // Obter filtros (com proteção)
            const filterTypeEl = document.getElementById('filterType');
            const filterDateStartEl = document.getElementById('filterDateStart');
            const filterDateEndEl = document.getElementById('filterDateEnd');
            
            const filterType = filterTypeEl ? filterTypeEl.value : '';
            const filterDateStart = filterDateStartEl ? filterDateStartEl.value : '';
            const filterDateEnd = filterDateEndEl ? filterDateEndEl.value : '';
            
            allProtocols = [];
            
            // 1. PDAs
            const { data: pdas } = await supabase
                .from('ad_pda_geral')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('data_acao', { ascending: false });
            
            if (pdas) {
                pdas.forEach(item => {
                    allProtocols.push({
                        ...item,
                        type: 'pda',
                        typeName: 'PDA',
                        date: item.data_acao,
                        title: item.titulo
                    });
                });
            }
            
            // 2. Plano Perfeito - Lições
            const { data: licoes } = await supabase
                .from('ad_plano_perfeito_licoes')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('data_preenchimento', { ascending: false });
            
            if (licoes) {
                licoes.forEach(item => {
                    allProtocols.push({
                        ...item,
                        type: 'plano_perfeito_licoes',
                        typeName: 'Plano Perfeito - Lições',
                        date: item.data_preenchimento,
                        title: 'Lições Aprendidas'
                    });
                });
            }
            
            // 3. Plano Perfeito - Foco
            const { data: foco } = await supabase
                .from('ad_plano_perfeito_foco')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('data_preenchimento', { ascending: false });
            
            if (foco) {
                foco.forEach(item => {
                    allProtocols.push({
                        ...item,
                        type: 'plano_perfeito_foco',
                        typeName: 'Plano Perfeito - Foco',
                        date: item.data_preenchimento,
                        title: item.sonho_grande || 'Definindo Foco'
                    });
                });
            }
            
            // 4. Núcleo Interno
            const { data: interno } = await supabase
                .from('ad_nucleo_emocional_interno')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('data_preenchimento', { ascending: false });
            
            if (interno) {
                interno.forEach(item => {
                    allProtocols.push({
                        ...item,
                        type: 'nucleo_interno',
                        typeName: 'Núcleo Emocional Interno',
                        date: item.data_preenchimento,
                        title: 'Mapeamento Interno'
                    });
                });
            }
            
            // 5. Núcleo Externo
            const { data: externo } = await supabase
                .from('ad_nucleo_emocional_externo')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('data_preenchimento', { ascending: false });
            
            if (externo) {
                externo.forEach(item => {
                    allProtocols.push({
                        ...item,
                        type: 'nucleo_externo',
                        typeName: 'Núcleo Emocional Externo',
                        date: item.data_preenchimento,
                        title: 'Mapeamento Externo'
                    });
                });
            }
            
            // 6. Combate ao Medo
            const { data: medos } = await supabase
                .from('ad_protocolo_combate_medo')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('data_preenchimento', { ascending: false });
            
            if (medos) {
                medos.forEach(item => {
                    allProtocols.push({
                        ...item,
                        type: 'combate_medo',
                        typeName: 'Combate ao Medo',
                        date: item.data_preenchimento,
                        title: item.medo_descricao ? 'Medo: ' + item.medo_descricao.substring(0, 50) + '...' : 'Combate ao Medo'
                    });
                });
            }
            
            // 7. Culpa Real
            const { data: culpas } = await supabase
                .from('ad_protocolo_culpa_real')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('data_preenchimento', { ascending: false });
            
            if (culpas) {
                culpas.forEach(item => {
                    allProtocols.push({
                        ...item,
                        type: 'culpa_real',
                        typeName: 'Eliminando Culpa Real',
                        date: item.data_preenchimento,
                        title: item.nome_pessoa ? 'Conversa com ' + item.nome_pessoa : 'Eliminando Culpa'
                    });
                });
            }
            
            // Aplicar filtros
            let filteredProtocols = [...allProtocols];
            
            if (filterType) {
                filteredProtocols = filteredProtocols.filter(p => p.type === filterType);
            }
            
            if (filterDateStart) {
                filteredProtocols = filteredProtocols.filter(p => p.date >= filterDateStart);
            }
            
            if (filterDateEnd) {
                filteredProtocols = filteredProtocols.filter(p => p.date <= filterDateEnd);
            }
            
            // Ordenar por data (mais recente primeiro)
            filteredProtocols.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Atualizar estatísticas
            updateStats(allProtocols);
            
            // Renderizar timeline
            renderTimeline(filteredProtocols);
            
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            showError('Erro ao carregar histórico. Recarregue a página.');
        }
    };
    
    // ========================================
    // ESTATÍSTICAS
    // ========================================
    
    function updateStats(protocols) {
        const total = protocols.length;
        document.getElementById('totalCount').textContent = total;
        
        // Este mês
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonth = protocols.filter(p => new Date(p.date) >= thisMonthStart).length;
        document.getElementById('thisMonthCount').textContent = thisMonth;
        
        // Esta semana
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const thisWeek = protocols.filter(p => new Date(p.date) >= weekStart).length;
        document.getElementById('thisWeekCount').textContent = thisWeek;
        
        // Tipos diferentes
        const types = new Set(protocols.map(p => p.type));
        document.getElementById('typesCount').textContent = types.size;
    }
    
    // ========================================
    // RENDERIZAR TIMELINE
    // ========================================
    
    function renderTimeline(protocols) {
        const timeline = document.getElementById('timeline');
        
        if (protocols.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <i data-feather="inbox" style="width: 64px; height: 64px; color: var(--accent-gold);"></i>
                    <h3>Nenhum registro encontrado</h3>
                    <p>Ajuste os filtros ou comece criando seus protocolos</p>
                </div>
            `;
            feather.replace();
            return;
        }
        
        // Agrupar por mês/ano
        const grouped = groupByMonth(protocols);
        
        let html = '<div class="timeline-container">';
        
        Object.keys(grouped).forEach((monthYear, index) => {
            const items = grouped[monthYear];
            const [year, month] = monthYear.split('-');
            const monthName = getMonthName(parseInt(month) - 1);
            
            html += `
                <div class="timeline-month">
                    <div class="month-header">
                        <h3 class="month-title">${monthName} ${year}</h3>
                        <span class="month-count">${items.length} ${items.length === 1 ? 'registro' : 'registros'}</span>
                    </div>
                    <div class="timeline-items">
            `;
            
            items.forEach(protocol => {
                const icon = getTypeIcon(protocol.type);
                const color = getTypeColor(protocol.type);
                const dateFormatted = formatDate(protocol.date);
                
                html += `
                    <div class="timeline-item" onclick="viewDetails('${protocol.type}', '${protocol.id}')">
                        <div class="timeline-marker" style="background: ${color};">
                            <i data-feather="${icon}"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-header">
                                <span class="timeline-type" style="color: ${color};">${protocol.typeName}</span>
                                <span class="timeline-date">${dateFormatted}</span>
                            </div>
                            <h4 class="timeline-title">${escapeHtml(protocol.title)}</h4>
                            ${protocol.percepcao ? `<p class="timeline-excerpt">${truncateText(escapeHtml(protocol.percepcao), 100)}</p>` : ''}
                            ${protocol.sonho_grande ? `<p class="timeline-excerpt">${truncateText(escapeHtml(protocol.sonho_grande), 100)}</p>` : ''}
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        timeline.innerHTML = html;
        feather.replace();
    }
    
    // ========================================
    // AGRUPAR POR MÊS
    // ========================================
    
    function groupByMonth(protocols) {
        const grouped = {};
        
        protocols.forEach(protocol => {
            const date = new Date(protocol.date + 'T00:00:00');
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(protocol);
        });
        
        return grouped;
    }
    
    // ========================================
    // VISUALIZAR DETALHES
    // ========================================
    
    window.viewDetails = async function(type, id) {
        try {
            const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
            const modalBody = document.getElementById('detailsModalBody');
            
            modalBody.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-gold"></div></div>';
            modal.show();
            
            let data = null;
            let html = '';
            
            // Buscar dados baseado no tipo
            switch(type) {
                case 'pda':
                    const { data: pda } = await supabase
                        .from('ad_pda_geral')
                        .select('*')
                        .eq('id', id)
                        .single();
                    data = pda;
                    html = renderPDADetails(data);
                    break;
                    
                case 'plano_perfeito_licoes':
                    const { data: licoes } = await supabase
                        .from('ad_plano_perfeito_licoes')
                        .select('*')
                        .eq('id', id)
                        .single();
                    data = licoes;
                    html = renderLicoesDetails(data);
                    break;
                    
                case 'plano_perfeito_foco':
                    const { data: foco } = await supabase
                        .from('ad_plano_perfeito_foco')
                        .select('*')
                        .eq('id', id)
                        .single();
                    data = foco;
                    html = renderFocoDetails(data);
                    break;
                    
                case 'nucleo_interno':
                case 'nucleo_externo':
                    const tableName = type === 'nucleo_interno' ? 'ad_nucleo_emocional_interno' : 'ad_nucleo_emocional_externo';
                    const pessoasTable = type === 'nucleo_interno' ? 'ad_nucleo_interno_pessoas' : 'ad_nucleo_externo_pessoas';
                    
                    const { data: nucleo } = await supabase
                        .from(tableName)
                        .select('*')
                        .eq('id', id)
                        .single();
                    
                    const { data: pessoas } = await supabase
                        .from(pessoasTable)
                        .select('*')
                        .eq(type === 'nucleo_interno' ? 'nucleo_interno_id' : 'nucleo_externo_id', id);
                    
                    html = renderNucleoDetails(nucleo, pessoas, type);
                    break;
                    
                case 'combate_medo':
                    const { data: medo } = await supabase
                        .from('ad_protocolo_combate_medo')
                        .select('*')
                        .eq('id', id)
                        .single();
                    html = renderMedoDetails(medo);
                    break;
                    
                case 'culpa_real':
                    const { data: culpa } = await supabase
                        .from('ad_protocolo_culpa_real')
                        .select('*')
                        .eq('id', id)
                        .single();
                    html = renderCulpaDetails(culpa);
                    break;
            }
            
            modalBody.innerHTML = html;
            
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            alert('Erro ao carregar detalhes do protocolo.');
        }
    };
    
    // ========================================
    // RENDERIZAR DETALHES POR TIPO
    // ========================================
    
    function renderPDADetails(pda) {
        return `
            <div class="details-container">
                <div class="detail-item">
                    <strong>Título:</strong>
                    <p>${escapeHtml(pda.titulo)}</p>
                </div>
                <div class="detail-item">
                    <strong>Percepção:</strong>
                    <p>${escapeHtml(pda.percepcao)}</p>
                </div>
                <div class="detail-item">
                    <strong>Decisão:</strong>
                    <p>${escapeHtml(pda.decisao)}</p>
                </div>
                <div class="detail-item">
                    <strong>Ação:</strong>
                    <p>${escapeHtml(pda.acao)}</p>
                </div>
                <div class="row">
                    <div class="col-md-6">
                        <div class="detail-item">
                            <strong>Data da Ação:</strong>
                            <p>${formatDate(pda.data_acao)}</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="detail-item">
                            <strong>Status:</strong>
                            <p>${pda.status}</p>
                        </div>
                    </div>
                </div>
                ${pda.observacoes ? `
                <div class="detail-item">
                    <strong>Observações:</strong>
                    <p>${escapeHtml(pda.observacoes)}</p>
                </div>` : ''}
            </div>
        `;
    }
    
    function renderLicoesDetails(licoes) {
        return `
            <div class="details-container">
                <div class="detail-item">
                    <strong>Sonho Grande:</strong>
                    <p>${escapeHtml(licoes.sonho_grande || '-')}</p>
                </div>
                <div class="detail-item">
                    <strong>O que te distanciou desse sonho:</strong>
                    <p>${escapeHtml(licoes.distanciou_sonho || '-')}</p>
                </div>
                <div class="detail-item">
                    <strong>O que te aproximou desse sonho:</strong>
                    <p>${escapeHtml(licoes.aproximou_sonho || '-')}</p>
                </div>
                <div class="detail-item">
                    <strong>O que faria diferente:</strong>
                    <p>${escapeHtml(licoes.faria_diferente || '-')}</p>
                </div>
                <div class="detail-item">
                    <strong>O que repetiria:</strong>
                    <p>${escapeHtml(licoes.repetiria || '-')}</p>
                </div>
            </div>
        `;
    }
    
    function renderFocoDetails(foco) {
        return `
            <div class="details-container">
                <div class="detail-item">
                    <strong>Sonho Grande:</strong>
                    <p>${escapeHtml(foco.sonho_grande || '-')}</p>
                </div>
                <div class="row">
                    <div class="col-md-4">
                        <div class="detail-item">
                            <strong>Como será medido:</strong>
                            <p>${escapeHtml(foco.como_sera_medido || '-')}</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="detail-item">
                            <strong>Meta:</strong>
                            <p>${escapeHtml(foco.meta || '-')}</p>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="detail-item">
                            <strong>Prazo:</strong>
                            <p>${escapeHtml(foco.prazo || '-')}</p>
                        </div>
                    </div>
                </div>
                <div class="detail-item">
                    <strong>Distribuição de Fichas nos Pilares:</strong>
                    <ul class="list-unstyled mt-2">
                        <li>💰 Financeiro: ${foco.fichas_financeiro || 0} fichas</li>
                        <li>❤️ Saúde: ${foco.fichas_saude || 0} fichas</li>
                        <li>👥 Relacionamento: ${foco.fichas_relacionamento || 0} fichas</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    function renderNucleoDetails(nucleo, pessoas, type) {
        const titulo = type === 'nucleo_interno' ? 'Núcleo Emocional Interno' : 'Núcleo Emocional Externo';
        const descricao = type === 'nucleo_interno' 
            ? 'Pessoas que interferem nas suas emoções'
            : 'Pessoas em quem você interfere emocionalmente';
        
        let html = `
            <div class="details-container">
                <div class="detail-item">
                    <strong>${descricao}:</strong>
                </div>
        `;
        
        if (pessoas && pessoas.length > 0) {
            html += '<div class="table-responsive mt-3"><table class="table table-dark table-striped">';
            html += '<thead><tr><th>Nome</th><th>Quadrante</th><th>Nível</th></tr></thead><tbody>';
            
            pessoas.forEach(pessoa => {
                html += `
                    <tr>
                        <td>${escapeHtml(pessoa.nome_pessoa)}</td>
                        <td>${pessoa.quadrante}</td>
                        <td>${pessoa.nivel_interferencia}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table></div>';
        } else {
            html += '<p class="text-muted mt-2">Nenhuma pessoa mapeada</p>';
        }
        
        html += '</div>';
        return html;
    }
    
    function renderMedoDetails(medo) {
        return `
            <div class="details-container">
                <div class="detail-item">
                    <strong>Medo:</strong>
                    <p>${escapeHtml(medo.medo_descricao || '-')}</p>
                </div>
                <div class="detail-item">
                    <strong>PDA Memorável - Percepção:</strong>
                    <p>${escapeHtml(medo.pda_memoravel_percepcao || '-')}</p>
                </div>
                <div class="detail-item">
                    <strong>PDA Memorável - Decisão:</strong>
                    <p>${escapeHtml(medo.pda_memoravel_decisao || '-')}</p>
                </div>
                <div class="detail-item">
                    <strong>PDA Memorável - Ação:</strong>
                    <p>${escapeHtml(medo.pda_memoravel_acao || '-')}</p>
                </div>
            </div>
        `;
    }
    
    function renderCulpaDetails(culpa) {
        return `
            <div class="details-container">
                <div class="detail-item">
                    <strong>Pessoa:</strong>
                    <p>${escapeHtml(culpa.nome_pessoa || '-')}</p>
                </div>
                <div class="detail-item">
                    <strong>Acontecimento:</strong>
                    <p>${escapeHtml(culpa.acontecimento_chave || '-')}</p>
                </div>
                <div class="detail-item">
                    <strong>Reconheço que:</strong>
                    <p>${escapeHtml(culpa.reconheco_que || '-')}</p>
                </div>
                <div class="detail-item">
                    <strong>Compromisso:</strong>
                    <p>${escapeHtml(culpa.a_partir_de_hoje || '-')}</p>
                </div>
            </div>
        `;
    }
    
    // ========================================
    // LIMPAR FILTROS
    // ========================================
    
    window.clearFilters = function() {
        const filterType = document.getElementById('filterType');
        const filterDateStart = document.getElementById('filterDateStart');
        const filterDateEnd = document.getElementById('filterDateEnd');
        
        if (filterType) filterType.value = '';
        if (filterDateStart) filterDateStart.value = '';
        if (filterDateEnd) filterDateEnd.value = '';
        
        loadHistory();
    };
    
    // ========================================
    // FUNÇÕES AUXILIARES
    // ========================================
    
    function getTypeIcon(type) {
        const icons = {
            'pda': 'check-circle',
            'plano_perfeito_licoes': 'book-open',
            'plano_perfeito_foco': 'compass',
            'nucleo_interno': 'user-check',
            'nucleo_externo': 'users',
            'combate_medo': 'shield',
            'culpa_real': 'heart'
        };
        return icons[type] || 'file-text';
    }
    
    function getTypeColor(type) {
        const colors = {
            'pda': '#28a745',
            'plano_perfeito_licoes': '#17a2b8',
            'plano_perfeito_foco': '#ffc107',
            'nucleo_interno': '#6f42c1',
            'nucleo_externo': '#e83e8c',
            'combate_medo': '#fd7e14',
            'culpa_real': '#dc3545'
        };
        return colors[type] || '#D8AE61';
    }
    
    function getMonthName(month) {
        const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return months[month];
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'short', 
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
    
    console.log('✅ Historico.js inicializado');
    
})();
