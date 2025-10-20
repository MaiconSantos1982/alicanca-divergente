/**
 * Dashboard - Lógica Principal
 */

(function() {
    'use strict';
    
    // Verificar autenticação ao carregar
    document.addEventListener('DOMContentLoaded', async () => {
        await checkAuthAndLoadData();
    });
    
    // ========================================
    // VERIFICAÇÃO DE AUTENTICAÇÃO
    // ========================================
    
    async function checkAuthAndLoadData() {
        try {
            // Verificar se está autenticado
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) throw error;
            
            if (!session) {
                // Não autenticado, redirecionar para login
                console.log('Usuário não autenticado, redirecionando...');
                window.location.href = 'index.html';
                return;
            }
            
            // Carregar dados do usuário
            await loadUserData(session.user);
            
            // Carregar contadores
            await loadCounts(session.user.id);
            
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            window.location.href = 'index.html';
        }
    }
    
    // ========================================
    // CARREGAR DADOS DO USUÁRIO
    // ========================================
    
    async function loadUserData(user) {
        try {
            // Pegar nome do usuário dos metadados
            const userName = user.user_metadata?.full_name || 
                           user.user_metadata?.display_name || 
                           user.email.split('@')[0];
            
            // Atualizar UI
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = userName;
            }
            
            console.log('✅ Dados do usuário carregados:', userName);
            
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    }
    
    // ========================================
    // CARREGAR CONTADORES
    // ========================================
    
    async function loadCounts(userId) {
        try {
            // Contador: Plano Perfeito - Lições
            const { count: countLicoes, error: errorLicoes } = await supabase
                .from('ad_plano_perfeito_licoes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            
            if (!errorLicoes) {
                updateCounter('count-licoes', countLicoes);
            }
            
            // Contador: Plano Perfeito - Foco
            const { count: countFoco, error: errorFoco } = await supabase
                .from('ad_plano_perfeito_foco')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            
            if (!errorFoco) {
                updateCounter('count-foco', countFoco);
            }
            
            // Contador: Núcleo Interno
            const { count: countInterno, error: errorInterno } = await supabase
                .from('ad_nucleo_emocional_interno')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            
            if (!errorInterno) {
                updateCounter('count-interno', countInterno);
            }
            
            // Contador: Núcleo Externo
            const { count: countExterno, error: errorExterno } = await supabase
                .from('ad_nucleo_emocional_externo')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
            
            if (!errorExterno) {
                updateCounter('count-externo', countExterno);
            }

            // Contador: Notas
            const { count: countNotas, error: errorNotas } = await supabase
                .from('ad_notas')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (!errorNotas) {
                updateCounter('count-notas', countNotas, 'notas');
            }

            // Contador: Combate ao Medo (quando criar a tabela)
            // const { count: countMedo } = await supabase
            //     .from('ad_protocolo_combate_medo')
            //     .select('*', { count: 'exact', head: true })
            //     .eq('user_id', userId);
            // updateCounter('count-medo', countMedo);
            
            // Contador: Culpa Real (quando criar a tabela)
            // const { count: countCulpa } = await supabase
            //     .from('ad_protocolo_culpa_real')
            //     .select('*', { count: 'exact', head: true })
            //     .eq('user_id', userId);
            // updateCounter('count-culpa', countCulpa);
            
            // Contador: PDA (quando criar a tabela)
            // const { count: countPDA } = await supabase
            //     .from('ad_pda_geral')
            //     .select('*', { count: 'exact', head: true })
            //     .eq('user_id', userId);
            // updateCounter('count-pda', countPDA);
            
            // Total (soma de todos)
            const total = (countLicoes || 0) + (countFoco || 0) + 
                         (countInterno || 0) + (countExterno || 0);
            updateCounter('count-total', total, 'total');
            
            console.log('✅ Contadores carregados');
            
        } catch (error) {
            console.error('Erro ao carregar contadores:', error);
        }
    }
    
    function updateCounter(elementId, count, suffix = 'registros') {
        const element = document.getElementById(elementId);
        if (element) {
            const text = count === 0 ? `Nenhum ${suffix.split(' ')[0]}` :
                        count === 1 ? `1 ${suffix.replace('registros', 'registro').replace('total', 'registro')}` :
                        `${count} ${suffix}`;
            element.textContent = text;
        }
    }
    
    // ========================================
    // NAVEGAÇÃO
    // ========================================
    
    window.navigateTo = function(page) {
    const pageMap = {
        'plano-perfeito-licoes': 'form-plano-perfeito-licoes.html',
        'plano-perfeito-foco': 'form-plano-perfeito-foco.html',
        'nucleo-interno': 'form-nucleo-interno.html',
        'nucleo-externo': 'form-nucleo-externo.html',
        'combate-medo': 'form-combate-medo.html',
        'culpa-real': 'form-culpa-real.html',
        'pda': 'pda.html',
        'historico': 'historico.html',
        'novo-protocolo': 'novo-protocolo.html',
        'notas': 'notas.html'
    };
    
    const url = pageMap[page];
    if (url) {
        window.location.href = url;
    } else {
        console.error('Página não encontrada:', page);
    }
};
    
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
    
    console.log('✅ Dashboard.js inicializado');
    
})();
