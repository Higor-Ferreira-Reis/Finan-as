// Sistema Financeiro Principal
class SistemaFinanceiro {
    constructor() {
        this.setupEventListeners();
        this.inicializar();
    }

    setupEventListeners() {
        // Navegação por abas
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.trocarAba(e.target.dataset.tab);
            });
        });

        // Fechar modais ao clicar fora
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('fixed') && e.target.classList.contains('bg-gray-600')) {
                e.target.classList.add('hidden');
                e.target.classList.remove('flex');
            }
        });

        // Fechar modais com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.fecharTodosModais();
            }
        });
    }

    inicializar() {
        // Renderizar dados iniciais
        gerenciadorTransacoes.renderizarTransacoes();
        gerenciadorDividas.renderizarDividas();
        gerenciadorRelatorios.atualizarRelatorios();
        
        // Atualizar dashboard
        this.atualizarDashboard();
        
        // Verificar dívidas vencidas periodicamente
        setInterval(() => {
            gerenciadorDividas.renderizarDividas();
        }, 60000); // Verificar a cada minuto
    }

    trocarAba(abaAtiva) {
        // Remover classe active de todos os botões e conteúdos
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.classList.add('hidden');
        });

        // Adicionar classe active ao botão clicado
        const botaoAtivo = document.querySelector(`[data-tab="${abaAtiva}"]`);
        if (botaoAtivo) {
            botaoAtivo.classList.add('active', 'border-blue-500', 'text-blue-600');
            botaoAtivo.classList.remove('border-transparent', 'text-gray-500');
        }

        // Mostrar conteúdo da aba ativa
        const conteudoAtivo = document.getElementById(abaAtiva);
        if (conteudoAtivo) {
            conteudoAtivo.classList.remove('hidden');
            conteudoAtivo.classList.add('active');
        }

        // Atualizar relatórios se for a aba de relatórios
        if (abaAtiva === 'relatorios') {
            gerenciadorRelatorios.atualizarRelatorios();
        }
    }

    fecharTodosModais() {
        document.querySelectorAll('.fixed.bg-gray-600').forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    }

    atualizarDashboard() {
        // Atualizar valores dos cards
        const saldo = gerenciadorTransacoes.obterSaldo();
        const totalGanhos = gerenciadorTransacoes.obterTotalGanhos();
        const totalGastos = gerenciadorTransacoes.obterTotalGastos();
        const dividasPendentes = gerenciadorDividas.obterDividasPendentes();

        document.getElementById('saldoTotal').textContent = Utils.formatarMoeda(saldo);
        document.getElementById('totalGanhos').textContent = Utils.formatarMoeda(totalGanhos);
        document.getElementById('totalGastos').textContent = Utils.formatarMoeda(totalGastos);
        document.getElementById('dividasPendentes').textContent = Utils.formatarMoeda(dividasPendentes);

        // Atualizar cores baseadas no saldo
        const saldoElement = document.getElementById('saldoTotal');
        if (saldo >= 0) {
            saldoElement.className = 'text-2xl font-bold text-green-600';
        } else {
            saldoElement.className = 'text-2xl font-bold text-red-600';
        }
    }

    // Método para exportar dados
    exportarDados() {
        const dados = {
            transacoes: Utils.carregarDados('transacoes'),
            dividas: Utils.carregarDados('dividas'),
            dataExportacao: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dados_financeiros_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.mostrarNotificacao('Dados exportados com sucesso!', 'success');
    }

    // Método para importar dados
    importarDados(arquivo) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dados = JSON.parse(e.target.result);
                
                if (dados.transacoes) {
                    Utils.salvarDados('transacoes', dados.transacoes);
                    gerenciadorTransacoes.transacoes = dados.transacoes;
                }
                
                if (dados.dividas) {
                    Utils.salvarDados('dividas', dados.dividas);
                    gerenciadorDividas.dividas = dados.dividas;
                }

                // Atualizar interface
                gerenciadorTransacoes.renderizarTransacoes();
                gerenciadorDividas.renderizarDividas();
                gerenciadorRelatorios.atualizarRelatorios();
                this.atualizarDashboard();

                Utils.mostrarNotificacao('Dados importados com sucesso!', 'success');
            } catch (error) {
                Utils.mostrarNotificacao('Erro ao importar dados. Verifique o arquivo.', 'error');
            }
        };
        reader.readAsText(arquivo);
    }

    // Método para limpar todos os dados
    limparDados() {
        if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('transacoes');
            localStorage.removeItem('dividas');
            
            gerenciadorTransacoes.transacoes = [];
            gerenciadorDividas.dividas = [];
            
            gerenciadorTransacoes.renderizarTransacoes();
            gerenciadorDividas.renderizarDividas();
            gerenciadorRelatorios.atualizarRelatorios();
            this.atualizarDashboard();
            
            Utils.mostrarNotificacao('Todos os dados foram limpos!', 'success');
        }
    }

    // Método para gerar backup automático
    gerarBackupAutomatico() {
        const dados = {
            transacoes: Utils.carregarDados('transacoes'),
            dividas: Utils.carregarDados('dividas'),
            dataBackup: new Date().toISOString()
        };

        localStorage.setItem('backup_' + Date.now(), JSON.stringify(dados));
        
        // Manter apenas os últimos 5 backups
        const backups = Object.keys(localStorage).filter(key => key.startsWith('backup_'));
        if (backups.length > 5) {
            backups.sort().slice(0, backups.length - 5).forEach(key => {
                localStorage.removeItem(key);
            });
        }
    }
}

// Inicializar o sistema quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.sistema = new SistemaFinanceiro();
    
    // Gerar backup automático a cada hora
    setInterval(() => {
        window.sistema.gerarBackupAutomatico();
    }, 3600000); // 1 hora
});

// Adicionar métodos globais para acesso externo
window.exportarDados = () => window.sistema.exportarDados();
window.importarDados = (arquivo) => window.sistema.importarDados(arquivo);
window.limparDados = () => window.sistema.limparDados(); 