/**
 * Protocolo de Proteção Emocional - JS
 */
(function() {
    'use strict';

    let currentUser = null;

    document.addEventListener('DOMContentLoaded', async () => {
        await checkAuth();
        setupFormEvents();
        setToday();
    });

    async function checkAuth() {
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
    }

    function setToday() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('dataPreenchimento').value = today;
    }

    function setupFormEvents() {
        document.getElementById('protecaoEmocionalForm').addEventListener('submit', handleSubmit);

        // Checkbox listeners para abrir campos extras dos padrões
        ['vitimanatural', 'vitimaintencional', 'vingador', 'narcisista'].forEach(pattern => {
            document.getElementById('padrao' + capitalize(pattern)).addEventListener('change', () => {
                togglePatternFields(pattern);
            });
        });

        // Contrato feito "Sim/Não"
        document.getElementsByName('contratoFeito').forEach(el => {
            el.addEventListener('change', toggleContratoDetails);
        });
    }

    window.togglePatternFields = function(pattern) {
        const box = document.getElementById('padrao' + capitalize(pattern));
        const fields = document.getElementById('fields' + capitalize(pattern));
        if (box.checked) fields.style.display = '';
        else fields.style.display = 'none';
    };

    window.toggleContratoDetails = function() {
        const sim = document.getElementById('contratoSim').checked;
        const nao = document.getElementById('contratoNao').checked;
        document.getElementById('contratoSimDetails').style.display = sim ? '' : 'none';
        document.getElementById('contratoNaoDetails').style.display = nao ? '' : 'none';
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
            const patterns = {};
            ['vitimanatural', 'vitimaintencional', 'vingador', 'narcisista'].forEach(pat => {
                patterns[pat] = document.getElementById('padrao' + capitalize(pat)).checked;
            });

            let contratoFeito = document.getElementById('contratoSim').checked ? true : 
                                (document.getElementById('contratoNao').checked ? false : null);

            const record = {
                user_id: currentUser.id,
                nome: document.getElementById('nome').value.trim(),
                data_preenchimento: document.getElementById('dataPreenchimento').value,
                envolvido: document.getElementById('envolvido').value,
                padrao_vitima_natural: patterns.vitimanatural,
                padrao_vitima_natural_tempo: document.getElementById('vitimanaturalTempo').value,
                padrao_vitima_natural_esperar: document.getElementById('vitimanaturalEsperar').value,
                padrao_vitima_intencional: patterns.vitimaintencional,
                padrao_vitima_intencional_tempo: document.getElementById('vitimaintencionalTempo').value,
                padrao_vitima_intencional_esperar: document.getElementById('vitimaintencionalEsperar').value,
                padrao_vingador: patterns.vingador,
                padrao_vingador_tempo: document.getElementById('vingadorTempo').value,
                padrao_vingador_esperar: document.getElementById('vingadorEsperar').value,
                padrao_narcisista: patterns.narcisista,
                padrao_narcisista_tempo: document.getElementById('narcisistaTempo').value,
                padrao_narcisista_esperar: document.getElementById('narcisistaEsperar').value,
                contrato_feito: contratoFeito,
                quem_descumprindo: document.getElementById('quemDescumprindo').value,
                esperando_outra_pessoa: document.getElementById('esperandoOutraPessoa').value,
                por_que_nao_feito: document.getElementById('porqueNaoFeito').value,
                quando_sera_feito: document.getElementById('quandoSeraFeito').value,
                custo_dano_interferencia: document.getElementById('custoDanoInterferencia').value,
                motivo_oferecendo_ajuda: document.getElementById('motivoOferecendoAjuda').checked,
                motivo_focando_expectativa: document.getElementById('motivoFocandoExpectativa').checked,
                motivo_tentando_mudar: document.getElementById('motivoTentandoMudar').checked,
                fazer_diferente: document.getElementById('fazerDiferente').value,
                analise_topicos: document.getElementById('analiseTopicos').value,
                marca_passos_percepcoes: document.getElementById('marcaPassosPercepcoes').value,
                marca_passos_decisoes: document.getElementById('marcaPassosDecisoes').value,
                marca_passos_acoes: document.getElementById('marcaPassosAcoes').value
            };

            const { error } = await supabase
                .from('ad_protocolo_protecao_emocional')
                .insert([record]);
            if (error) throw error;

            showAlert("Protocolo salvo com sucesso!", "success");
            document.getElementById('protecaoEmocionalForm').reset();
            setToday();

        } catch (error) {
            showAlert("Erro ao salvar: " + (error.message || "Tente novamente."), "danger");
        } finally {
            submitBtn.disabled = false;
            btnText.classList.remove('d-none');
            spinner.classList.add('d-none');
        }
    }

    function showAlert(message, type) {
        const container = document.getElementById('alertContainer');
        container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
        setTimeout(() => container.innerHTML = '', 4000);
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    window.logout = async function() {
        if (confirm('Deseja realmente sair?')) {
            const { error } = await supabase.auth.signOut();
            if (!error) window.location.href = 'index.html';
        }
    };

    window.updateProgress = function() {};
    // Implemente a lógica de progresso se desejar

    console.log('✅ ProtecaoEmocional.js inicializado');
})();
