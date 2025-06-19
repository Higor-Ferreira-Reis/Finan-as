// Módulo de Transações
class GerenciadorTransacoes {
    constructor() {
        this.transacoes = Utils.carregarDados('transacoes');
        this.categorias = {
            ganho: ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros'],
            gasto: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Vestuário', 'Contas', 'Outros']
        };
        this.setupEventListeners();
        this.carregarCategorias();
    }

    setupEventListeners() {
        // Botões de modal
        document.getElementById('btnNovaTransacao').addEventListener('click', () => this.abrirModalTransacao());
        document.getElementById('fecharModalTransacao').addEventListener('click', () => this.fecharModalTransacao());
        document.getElementById('cancelarTransacao').addEventListener('click', () => this.fecharModalTransacao());
        
        // Formulário
        document.getElementById('formTransacao').addEventListener('submit', (e) => this.salvarTransacao(e));

        // Filtros
        document.getElementById('filtroTipo').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filtroCategoria').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filtroData').addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('btnLimparFiltros').addEventListener('click', () => this.limparFiltros());
    }

    carregarCategorias() {
        const selectCategoria = document.getElementById('categoriaTransacao');
        const selectFiltro = document.getElementById('filtroCategoria');
        
        // Limpar opções existentes
        selectCategoria.innerHTML = '<option value="">Selecione uma categoria</option>';
        selectFiltro.innerHTML = '<option value="">Todas as categorias</option>';

        // Adicionar categorias de ganho
        this.categorias.ganho.forEach(categoria => {
            selectCategoria.innerHTML += `<option value="${categoria}">${categoria}</option>`;
            selectFiltro.innerHTML += `<option value="${categoria}">${categoria}</option>`;
        });

        // Adicionar categorias de gasto
        this.categorias.gasto.forEach(categoria => {
            selectCategoria.innerHTML += `<option value="${categoria}">${categoria}</option>`;
            selectFiltro.innerHTML += `<option value="${categoria}">${categoria}</option>`;
        });
    }

    abrirModalTransacao() {
        document.getElementById('modalTransacao').classList.remove('hidden');
        document.getElementById('modalTransacao').classList.add('flex');
        document.getElementById('descricaoTransacao').focus();
        document.getElementById('dataTransacao').value = Utils.definirDataAtual();
    }

    fecharModalTransacao() {
        document.getElementById('modalTransacao').classList.add('hidden');
        document.getElementById('modalTransacao').classList.remove('flex');
        document.getElementById('formTransacao').reset();
    }

    salvarTransacao(e) {
        e.preventDefault();
        
        const transacao = {
            id: Date.now(),
            descricao: document.getElementById('descricaoTransacao').value,
            valor: parseFloat(document.getElementById('valorTransacao').value),
            tipo: document.getElementById('tipoTransacao').value,
            categoria: document.getElementById('categoriaTransacao').value,
            data: document.getElementById('dataTransacao').value,
            dataCriacao: new Date().toISOString()
        };

        this.transacoes.push(transacao);
        Utils.salvarDados('transacoes', this.transacoes);
        this.renderizarTransacoes();
        this.fecharModalTransacao();
        Utils.mostrarNotificacao('Transação salva com sucesso!', 'success');
        
        // Atualizar dashboard
        if (window.sistema) {
            sistema.atualizarDashboard();
        }
    }

    excluirTransacao(id) {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            this.transacoes = this.transacoes.filter(t => t.id !== id);
            Utils.salvarDados('transacoes', this.transacoes);
            this.renderizarTransacoes();
            Utils.mostrarNotificacao('Transação excluída com sucesso!', 'success');
            
            // Atualizar dashboard
            if (window.sistema) {
                sistema.atualizarDashboard();
            }
        }
    }

    aplicarFiltros() {
        const tipo = document.getElementById('filtroTipo').value;
        const categoria = document.getElementById('filtroCategoria').value;
        const data = document.getElementById('filtroData').value;

        let transacoesFiltradas = this.transacoes;

        if (tipo) {
            transacoesFiltradas = transacoesFiltradas.filter(t => t.tipo === tipo);
        }

        if (categoria) {
            transacoesFiltradas = transacoesFiltradas.filter(t => t.categoria === categoria);
        }

        if (data) {
            transacoesFiltradas = transacoesFiltradas.filter(t => t.data === data);
        }

        this.renderizarTransacoes(transacoesFiltradas);
    }

    limparFiltros() {
        document.getElementById('filtroTipo').value = '';
        document.getElementById('filtroCategoria').value = '';
        document.getElementById('filtroData').value = '';
        this.renderizarTransacoes();
    }

    renderizarTransacoes(transacoes = this.transacoes) {
        const tbody = document.getElementById('listaTransacoes');
        tbody.innerHTML = '';

        if (transacoes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                        Nenhuma transação encontrada
                    </td>
                </tr>
            `;
            return;
        }

        // Ordenar por data (mais recente primeiro)
        transacoes.sort((a, b) => new Date(b.data) - new Date(a.data));

        transacoes.forEach(transacao => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            
            const valorClass = transacao.tipo === 'ganho' ? 'valor-ganho' : 'valor-gasto';
            const valorPrefix = transacao.tipo === 'ganho' ? '+' : '-';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${Utils.formatarData(transacao.data)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transacao.descricao}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transacao.categoria}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transacao.tipo === 'ganho' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }">
                        ${transacao.tipo === 'ganho' ? 'Ganho' : 'Gasto'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${valorClass}">
                    ${valorPrefix} R$ ${transacao.valor.toFixed(2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="gerenciadorTransacoes.excluirTransacao(${transacao.id})" 
                            class="text-red-600 hover:text-red-900 transition-colors">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    obterTotalGanhos() {
        return this.transacoes
            .filter(t => t.tipo === 'ganho')
            .reduce((sum, t) => sum + t.valor, 0);
    }

    obterTotalGastos() {
        return this.transacoes
            .filter(t => t.tipo === 'gasto')
            .reduce((sum, t) => sum + t.valor, 0);
    }

    obterSaldo() {
        return this.obterTotalGanhos() - this.obterTotalGastos();
    }
}

// Instanciar o gerenciador de transações
const gerenciadorTransacoes = new GerenciadorTransacoes(); 