// Gerenciador de Investimentos
class GerenciadorInvestimentos {
    constructor() {
        this.investimentos = Utils.carregarDados('investimentos') || [];
        this.rentabilidadesPadrao = {
            'CDB': 1.2,
            'LCI': 1.0,
            'LCA': 1.1,
            'Tesouro Direto': 0.8,
            'Ações': 2.5,
            'Fundos Imobiliários': 1.8,
            'Fundos de Investimento': 1.5,
            'Debêntures': 1.3,
            'Previdência Privada': 1.2,
            'Criptomoedas': 8.0,
            'ETFs': 1.8,
            'BDRs': 2.0,
            'Poupança': 0.5,
            'COE': 3.0,
            'Commodities': 2.2
        };
        
        this.niveisRisco = {
            'CDB': 'Baixo',
            'LCI': 'Baixo',
            'LCA': 'Baixo',
            'Tesouro Direto': 'Baixo',
            'Ações': 'Alto',
            'Fundos Imobiliários': 'Médio',
            'Fundos de Investimento': 'Médio',
            'Debêntures': 'Médio',
            'Previdência Privada': 'Baixo',
            'Criptomoedas': 'Muito Alto',
            'ETFs': 'Médio',
            'BDRs': 'Alto',
            'Poupança': 'Baixo',
            'COE': 'Alto',
            'Commodities': 'Alto'
        };
        this.setupEventListeners();
        this.renderizarInvestimentos();
    }

    setupEventListeners() {
        // Botão novo investimento
        document.getElementById('btnNovoInvestimento').addEventListener('click', () => {
            this.abrirModalInvestimento();
        });

        // Modal investimento
        document.getElementById('fecharModalInvestimento').addEventListener('click', () => {
            this.fecharModalInvestimento();
        });

        document.getElementById('cancelarInvestimento').addEventListener('click', () => {
            this.fecharModalInvestimento();
        });

        // Formulário investimento
        document.getElementById('formInvestimento').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarInvestimento();
        });

        // Auto-preenchimento da data de início
        document.getElementById('dataInicioInvestimento').value = new Date().toISOString().split('T')[0];

        // Calcular rentabilidade automaticamente ao selecionar tipo
        document.getElementById('tipoInvestimento').addEventListener('change', (e) => {
            this.calcularRentabilidadeAutomatica(e.target.value);
        });

        // Botão para recalcular rentabilidade
        document.getElementById('btnRecalcularRentabilidade').addEventListener('click', () => {
            const tipoSelecionado = document.getElementById('tipoInvestimento').value;
            if (tipoSelecionado) {
                this.calcularRentabilidadeAutomatica(tipoSelecionado);
            } else {
                Utils.mostrarNotificacao('Selecione primeiro um tipo de investimento', 'warning');
            }
        });
    }

    abrirModalInvestimento(investimento = null) {
        const modal = document.getElementById('modalInvestimento');
        const form = document.getElementById('formInvestimento');
        const titulo = document.querySelector('#modalInvestimento h3');

        if (investimento) {
            // Modo edição
            titulo.textContent = 'Editar Investimento';
            this.preencherFormulario(investimento);
            form.dataset.editId = investimento.id;
        } else {
            // Modo criação
            titulo.textContent = 'Novo Investimento';
            form.reset();
            delete form.dataset.editId;
            document.getElementById('dataInicioInvestimento').value = new Date().toISOString().split('T')[0];
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    fecharModalInvestimento() {
        const modal = document.getElementById('modalInvestimento');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    preencherFormulario(investimento) {
        document.getElementById('nomeInvestimento').value = investimento.nome;
        document.getElementById('tipoInvestimento').value = investimento.tipo;
        document.getElementById('valorInvestimento').value = investimento.valor;
        document.getElementById('dataInicioInvestimento').value = investimento.dataInicio;
        document.getElementById('rentabilidadeInvestimento').value = investimento.rentabilidade;
        document.getElementById('observacoesInvestimento').value = investimento.observacoes || '';
        
        // Não calcular rentabilidade automática quando estiver editando
        // para preservar o valor original do investimento
    }

    salvarInvestimento() {
        const form = document.getElementById('formInvestimento');
        const editId = form.dataset.editId;

        const investimento = {
            id: editId || Date.now().toString(),
            nome: document.getElementById('nomeInvestimento').value,
            tipo: document.getElementById('tipoInvestimento').value,
            valor: parseFloat(document.getElementById('valorInvestimento').value),
            dataInicio: document.getElementById('dataInicioInvestimento').value,
            rentabilidade: parseFloat(document.getElementById('rentabilidadeInvestimento').value),
            observacoes: document.getElementById('observacoesInvestimento').value,
            dataCriacao: editId ? this.investimentos.find(i => i.id === editId)?.dataCriacao : new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
        };

        if (editId) {
            // Editar investimento existente
            const index = this.investimentos.findIndex(i => i.id === editId);
            if (index !== -1) {
                this.investimentos[index] = investimento;
            }
        } else {
            // Adicionar novo investimento
            this.investimentos.push(investimento);
        }

        Utils.salvarDados('investimentos', this.investimentos);
        this.renderizarInvestimentos();
        this.fecharModalInvestimento();
        
        // Atualizar dashboard
        if (window.sistema) {
            window.sistema.atualizarDashboard();
        }

        Utils.mostrarNotificacao(
            editId ? 'Investimento atualizado com sucesso!' : 'Investimento adicionado com sucesso!',
            'success'
        );
    }

    calcularRendimento(investimento) {
        const dataInicio = new Date(investimento.dataInicio);
        const hoje = new Date();
        const mesesDecorridos = (hoje.getFullYear() - dataInicio.getFullYear()) * 12 + 
                               (hoje.getMonth() - dataInicio.getMonth());
        
        if (mesesDecorridos <= 0) return 0;
        
        const rendimentoMensal = investimento.rentabilidade / 100;
        const valorAtual = investimento.valor * Math.pow(1 + rendimentoMensal, mesesDecorridos);
        return valorAtual - investimento.valor;
    }

    calcularValorAtual(investimento) {
        const rendimento = this.calcularRendimento(investimento);
        return investimento.valor + rendimento;
    }

    renderizarInvestimentos() {
        const container = document.getElementById('listaInvestimentos');
        container.innerHTML = '';

        if (this.investimentos.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-gray-400 mb-4">
                        <i class="fas fa-chart-line text-6xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhum investimento cadastrado</h3>
                    <p class="text-gray-500 mb-4">Comece adicionando seu primeiro investimento para acompanhar seus rendimentos.</p>
                    <button onclick="gerenciadorInvestimentos.abrirModalInvestimento()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-plus mr-2"></i>Adicionar Investimento
                    </button>
                </div>
            `;
            return;
        }

        this.investimentos.forEach(investimento => {
            const valorAtual = this.calcularValorAtual(investimento);
            const rendimento = this.calcularRendimento(investimento);
            const percentualRendimento = (rendimento / investimento.valor) * 100;
            const mesesDecorridos = this.calcularMesesDecorridos(investimento.dataInicio);

            // Determinar classe CSS baseada no rendimento
            let rendimentoClass = 'rendimento-neutro';
            if (rendimento > 0) {
                rendimentoClass = 'rendimento-positivo';
            } else if (rendimento < 0) {
                rendimentoClass = 'rendimento-negativo';
            }

            const card = document.createElement('div');
            card.className = `bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500 investimento-card ${rendimentoClass}`;
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">${investimento.nome}</h3>
                        <p class="text-sm text-gray-600">${investimento.tipo}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-500">${mesesDecorridos} meses</p>
                        <p class="text-xs text-gray-400">desde ${new Date(investimento.dataInicio).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
                
                <div class="space-y-3 mb-4">
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Valor Investido:</span>
                        <span class="font-medium valor-investido">${Utils.formatarMoeda(investimento.valor)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Valor Atual:</span>
                        <span class="font-medium valor-atual">${Utils.formatarMoeda(valorAtual)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Rendimento:</span>
                        <span class="font-medium ${rendimento >= 0 ? 'rendimento-positivo' : 'rendimento-negativo'}">
                            ${Utils.formatarMoeda(rendimento)} (${percentualRendimento.toFixed(2)}%)
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Rentabilidade Mensal:</span>
                        <span class="font-medium rentabilidade-mensal">${investimento.rentabilidade}%</span>
                    </div>
                </div>

                ${investimento.observacoes ? `
                    <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p class="text-sm text-gray-700">${investimento.observacoes}</p>
                    </div>
                ` : ''}

                <div class="flex space-x-2">
                    <button onclick="gerenciadorInvestimentos.editarInvestimento('${investimento.id}')" 
                            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
                        <i class="fas fa-edit mr-1"></i>Editar
                    </button>
                    <button onclick="gerenciadorInvestimentos.excluirInvestimento('${investimento.id}')" 
                            class="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors">
                        <i class="fas fa-trash mr-1"></i>Excluir
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    calcularMesesDecorridos(dataInicio) {
        const inicio = new Date(dataInicio);
        const hoje = new Date();
        return (hoje.getFullYear() - inicio.getFullYear()) * 12 + 
               (hoje.getMonth() - inicio.getMonth());
    }

    editarInvestimento(id) {
        const investimento = this.investimentos.find(i => i.id === id);
        if (investimento) {
            this.abrirModalInvestimento(investimento);
        }
    }

    excluirInvestimento(id) {
        if (confirm('Tem certeza que deseja excluir este investimento?')) {
            this.investimentos = this.investimentos.filter(i => i.id !== id);
            Utils.salvarDados('investimentos', this.investimentos);
            this.renderizarInvestimentos();
            
            // Atualizar dashboard
            if (window.sistema) {
                window.sistema.atualizarDashboard();
            }

            Utils.mostrarNotificacao('Investimento excluído com sucesso!', 'success');
        }
    }

    obterTotalInvestido() {
        return this.investimentos.reduce((total, investimento) => total + investimento.valor, 0);
    }

    obterRendimentoTotal() {
        return this.investimentos.reduce((total, investimento) => {
            return total + this.calcularRendimento(investimento);
        }, 0);
    }

    obterValorAtualTotal() {
        return this.investimentos.reduce((total, investimento) => {
            return total + this.calcularValorAtual(investimento);
        }, 0);
    }

    // Método para obter dados para relatórios
    obterDadosRelatorio() {
        const dadosPorTipo = {};
        
        this.investimentos.forEach(investimento => {
            const tipo = investimento.tipo;
            if (!dadosPorTipo[tipo]) {
                dadosPorTipo[tipo] = {
                    valorInvestido: 0,
                    valorAtual: 0,
                    rendimento: 0,
                    quantidade: 0
                };
            }
            
            const valorAtual = this.calcularValorAtual(investimento);
            const rendimento = this.calcularRendimento(investimento);
            
            dadosPorTipo[tipo].valorInvestido += investimento.valor;
            dadosPorTipo[tipo].valorAtual += valorAtual;
            dadosPorTipo[tipo].rendimento += rendimento;
            dadosPorTipo[tipo].quantidade += 1;
        });

        return dadosPorTipo;
    }

    calcularRentabilidadeAutomatica(tipoInvestimento) {
        const campoRentabilidade = document.getElementById('rentabilidadeInvestimento');
        
        if (tipoInvestimento && this.rentabilidadesPadrao[tipoInvestimento]) {
            // Adicionar variação aleatória para simular diferentes condições de mercado
            const rentabilidadeBase = this.rentabilidadesPadrao[tipoInvestimento];
            
            // Variação baseada no tipo de investimento
            let variacaoMaxima;
            switch(tipoInvestimento) {
                case 'Criptomoedas':
                    variacaoMaxima = 0.8; // Alta volatilidade
                    break;
                case 'Ações':
                    variacaoMaxima = 0.6; // Volatilidade média-alta
                    break;
                case 'Fundos Imobiliários':
                case 'ETFs':
                case 'BDRs':
                    variacaoMaxima = 0.4; // Volatilidade média
                    break;
                case 'COE':
                case 'Commodities':
                    variacaoMaxima = 0.5; // Volatilidade média-alta
                    break;
                default:
                    variacaoMaxima = 0.2; // Baixa volatilidade para investimentos de renda fixa
            }
            
            const variacao = (Math.random() - 0.5) * variacaoMaxima;
            const rentabilidadeFinal = Math.max(0.1, rentabilidadeBase + variacao);
            
            campoRentabilidade.value = rentabilidadeFinal.toFixed(2);
            
            // Adicionar tooltip explicativo
            this.mostrarTooltipRentabilidade(tipoInvestimento, rentabilidadeFinal, rentabilidadeBase);
        } else {
            campoRentabilidade.value = '';
        }
    }

    mostrarTooltipRentabilidade(tipo, rentabilidade, rentabilidadeBase) {
        const campoRentabilidade = document.getElementById('rentabilidadeInvestimento');
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute z-10 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg max-w-xs';
        tooltip.style.top = '-40px';
        tooltip.style.left = '0';
        
        const descricoes = {
            'CDB': 'Certificado de Depósito Bancário - Renda fixa com garantia do FGC',
            'LCI': 'Letra de Crédito Imobiliário - Renda fixa isenta de IR',
            'LCA': 'Letra de Crédito do Agronegócio - Renda fixa isenta de IR',
            'Tesouro Direto': 'Títulos públicos federais - Baixo risco',
            'Ações': 'Participação em empresas - Alto risco e potencial de retorno',
            'Fundos Imobiliários': 'Investimento em imóveis - Renda passiva',
            'Fundos de Investimento': 'Carteira diversificada gerenciada por especialistas',
            'Debêntures': 'Títulos de dívida corporativa - Renda fixa',
            'Previdência Privada': 'Planejamento de aposentadoria com benefícios fiscais',
            'Criptomoedas': 'Moedas digitais - Alta volatilidade e risco',
            'ETFs': 'Fundos negociados em bolsa - Diversificação automática',
            'BDRs': 'Certificados de ações estrangeiras - Exposição internacional',
            'Poupança': 'Conta de poupança tradicional - Baixo risco e liquidez',
            'COE': 'Certificado de Operações Estruturadas - Produto híbrido',
            'Commodities': 'Mercadorias como ouro, petróleo, etc. - Hedge contra inflação'
        };
        
        const nivelRisco = this.niveisRisco[tipo] || 'Não informado';
        let corRisco = 'text-gray-400';
        
        switch(nivelRisco) {
            case 'Baixo':
                corRisco = 'text-green-300';
                break;
            case 'Médio':
                corRisco = 'text-yellow-300';
                break;
            case 'Alto':
                corRisco = 'text-orange-300';
                break;
            case 'Muito Alto':
                corRisco = 'text-red-300';
                break;
        }
        
        tooltip.innerHTML = `
            <div class="font-semibold mb-1">${tipo}</div>
            <div class="text-gray-300 mb-1">${descricoes[tipo] || 'Tipo de investimento'}</div>
            <div class="text-green-300">Rentabilidade atual: ${rentabilidade.toFixed(2)}% ao mês</div>
            <div class="text-gray-400">Média histórica: ${rentabilidadeBase.toFixed(2)}% ao mês</div>
            <div class="${corRisco} mt-1">Nível de risco: ${nivelRisco}</div>
        `;
        
        // Remover tooltip anterior se existir
        const tooltipAnterior = campoRentabilidade.parentNode.querySelector('.absolute');
        if (tooltipAnterior) {
            tooltipAnterior.remove();
        }
        
        campoRentabilidade.parentNode.style.position = 'relative';
        campoRentabilidade.parentNode.appendChild(tooltip);
        
        // Remover tooltip após 5 segundos
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 5000);
    }
}

// Inicializar gerenciador de investimentos
let gerenciadorInvestimentos;
document.addEventListener('DOMContentLoaded', () => {
    gerenciadorInvestimentos = new GerenciadorInvestimentos();
}); 