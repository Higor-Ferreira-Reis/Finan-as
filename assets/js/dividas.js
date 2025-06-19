// Módulo de Dívidas
class GerenciadorDividas {
    constructor() {
        this.dividas = Utils.carregarDados('dividas');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botões de modal
        document.getElementById('btnNovaDivida').addEventListener('click', () => this.abrirModalDivida());
        document.getElementById('fecharModalDivida').addEventListener('click', () => this.fecharModalDivida());
        document.getElementById('cancelarDivida').addEventListener('click', () => this.fecharModalDivida());
        
        // Formulário
        document.getElementById('formDivida').addEventListener('submit', (e) => this.salvarDivida(e));
    }

    abrirModalDivida() {
        document.getElementById('modalDivida').classList.remove('hidden');
        document.getElementById('modalDivida').classList.add('flex');
        document.getElementById('descricaoDivida').focus();
    }

    fecharModalDivida() {
        document.getElementById('modalDivida').classList.add('hidden');
        document.getElementById('modalDivida').classList.remove('flex');
        document.getElementById('formDivida').reset();
        
        // Limpar estado de edição
        delete document.getElementById('formDivida').dataset.editandoId;
        document.querySelector('#modalDivida h3').textContent = 'Nova Dívida';
        document.querySelector('#modalDivida button[type="submit"]').textContent = 'Salvar';
    }

    salvarDivida(e) {
        e.preventDefault();
        
        const editandoId = document.getElementById('formDivida').dataset.editandoId;
        
        if (editandoId) {
            // Editando dívida existente
            const divida = this.dividas.find(d => d.id === parseInt(editandoId));
            if (divida) {
                divida.descricao = document.getElementById('descricaoDivida').value;
                divida.valorTotal = parseFloat(document.getElementById('valorDivida').value);
                divida.valorRestante = parseFloat(document.getElementById('valorDivida').value);
                divida.vencimento = document.getElementById('vencimentoDivida').value || null;
                divida.observacoes = document.getElementById('observacoesDivida').value;
                
                Utils.salvarDados('dividas', this.dividas);
                this.renderizarDividas();
                this.fecharModalDivida();
                Utils.mostrarNotificacao('Dívida atualizada com sucesso!', 'success');
                
                // Atualizar dashboard
                if (window.sistema) {
                    sistema.atualizarDashboard();
                }
            }
        } else {
            // Criando nova dívida
            const divida = {
                id: Date.now(),
                descricao: document.getElementById('descricaoDivida').value,
                valorTotal: parseFloat(document.getElementById('valorDivida').value),
                valorRestante: parseFloat(document.getElementById('valorDivida').value),
                vencimento: document.getElementById('vencimentoDivida').value || null,
                observacoes: document.getElementById('observacoesDivida').value,
                pagamentos: [],
                dataCriacao: new Date().toISOString(),
                pagoAte: null
            };

            this.dividas.push(divida);
            Utils.salvarDados('dividas', this.dividas);
            this.renderizarDividas();
            this.fecharModalDivida();
            Utils.mostrarNotificacao('Dívida registrada com sucesso!', 'success');
            
            // Atualizar dashboard
            if (window.sistema) {
                sistema.atualizarDashboard();
            }
        }
    }

    editarDivida(id) {
        const divida = this.dividas.find(d => d.id === id);
        if (!divida) {
            Utils.mostrarNotificacao('Dívida não encontrada!', 'error');
            return;
        }

        // Preencher o modal com os dados da dívida
        document.getElementById('descricaoDivida').value = divida.descricao;
        document.getElementById('valorDivida').value = divida.valorTotal;
        document.getElementById('vencimentoDivida').value = divida.vencimento || '';
        document.getElementById('observacoesDivida').value = divida.observacoes || '';

        // Armazenar o ID da dívida sendo editada
        document.getElementById('formDivida').dataset.editandoId = divida.id;

        // Mudar o título do modal
        document.querySelector('#modalDivida h3').textContent = 'Editar Dívida';
        document.querySelector('#modalDivida button[type="submit"]').textContent = 'Atualizar';

        // Abrir o modal
        this.abrirModalDivida();
    }

    excluirDivida(id) {
        if (confirm('Tem certeza que deseja excluir esta dívida?')) {
            this.dividas = this.dividas.filter(d => d.id !== id);
            Utils.salvarDados('dividas', this.dividas);
            this.renderizarDividas();
            Utils.mostrarNotificacao('Dívida excluída com sucesso!', 'success');
            
            // Atualizar dashboard
            if (window.sistema) {
                sistema.atualizarDashboard();
            }
        }
    }

    marcarDividaPaga(id) {
        const divida = this.dividas.find(d => d.id === id);
        if (!divida) return;
        // Marca como paga por 30 dias
        const agora = new Date();
        const pagoAte = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);
        divida.pagoAte = pagoAte.toISOString();
        Utils.salvarDados('dividas', this.dividas);
        this.renderizarDividas();
        Utils.mostrarNotificacao('Dívida marcada como paga por 30 dias!', 'success');
        
        // Atualizar dashboard
        if (window.sistema) {
            sistema.atualizarDashboard();
        }
    }

    marcarDividaNaoPaga(id) {
        const divida = this.dividas.find(d => d.id === id);
        if (!divida) return;
        // Marca como não paga
        divida.pagoAte = null;
        Utils.salvarDados('dividas', this.dividas);
        this.renderizarDividas();
        Utils.mostrarNotificacao('Dívida marcada como não paga!', 'success');
        
        // Atualizar dashboard
        if (window.sistema) {
            sistema.atualizarDashboard();
        }
    }

    renderizarDividas() {
        const container = document.getElementById('listaDividas');
        container.innerHTML = '';

        if (this.dividas.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <i class="fas fa-credit-card text-4xl mb-4"></i>
                    <p>Nenhuma dívida registrada</p>
                </div>
            `;
            return;
        }

        this.dividas.forEach(divida => {
            // Verifica se passou 30 dias desde o pagamento
            if (divida.pagoAte) {
                const agora = new Date();
                const pagoAte = new Date(divida.pagoAte);
                if (agora > pagoAte) {
                    divida.pagoAte = null;
                    Utils.salvarDados('dividas', this.dividas);
                }
            }
            const status = this.getStatusDivida(divida);
            const card = document.createElement('div');
            card.className = `divida-card bg-white rounded-lg shadow-md p-6 ${status === 'paga' ? 'paga' : ''} ${status === 'vencida' ? 'vencida' : ''}`;
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">${divida.descricao}</h3>
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusClass(status)}">
                        ${this.getStatusText(status)}
                    </span>
                </div>
                <div class="space-y-3">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Valor:</span>
                        <span class="font-semibold">R$ ${divida.valorTotal.toFixed(2)}</span>
                    </div>
                    ${divida.vencimento ? `
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Vencimento:</span>
                            <span class="font-semibold">${Utils.formatarData(divida.vencimento)}</span>
                        </div>
                    ` : ''}
                </div>
                ${divida.observacoes ? `
                    <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p class="text-sm text-gray-700">${divida.observacoes}</p>
                    </div>
                ` : ''}
                <div class="flex justify-between mt-4">
                    <button onclick="gerenciadorDividas.excluirDivida(${divida.id})" class="btn-danger text-white px-3 py-1 rounded-lg text-sm">
                        <i class="fas fa-trash mr-1"></i>Excluir
                    </button>
                    <button onclick="gerenciadorDividas.editarDivida(${divida.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors">
                        <i class="fas fa-edit mr-1"></i>Editar
                    </button>
                    ${status === 'paga' ? `
                        <button onclick="gerenciadorDividas.marcarDividaNaoPaga(${divida.id})" class="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg text-sm transition-colors">
                            <i class="fas fa-times mr-1"></i>Não Pago
                        </button>
                    ` : `
                        <button onclick="gerenciadorDividas.marcarDividaPaga(${divida.id})" class="btn-success text-white px-3 py-1 rounded-lg text-sm">
                            <i class="fas fa-check mr-1"></i>Pago
                        </button>
                    `}
                </div>
            `;
            container.appendChild(card);
        });
    }

    getStatusDivida(divida) {
        if (divida.pagoAte) {
            const agora = new Date();
            const pagoAte = new Date(divida.pagoAte);
            if (agora <= pagoAte) return 'paga';
        }
        
        // Se não tem data de vencimento, só pode ser pendente ou paga
        if (!divida.vencimento) {
            return divida.pagoAte ? 'paga' : 'pendente';
        }
        
        const hoje = new Date();
        const vencimento = new Date(divida.vencimento);
        if (vencimento < hoje) return 'vencida';
        return 'pendente';
    }

    getStatusClass(status) {
        switch (status) {
            case 'paga': return 'status-pago';
            case 'pendente': return 'status-pendente';
            case 'vencida': return 'status-vencido';
            default: return 'status-pendente';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'paga': return 'Paga';
            case 'pendente': return 'Pendente';
            case 'vencida': return 'Vencida';
            default: return 'Pendente';
        }
    }

    obterDividasPendentes() {
        return this.dividas
            .filter(d => !d.pagoAte)
            .reduce((sum, d) => sum + d.valorRestante, 0);
    }
}

// Instanciar o gerenciador de dívidas
const gerenciadorDividas = new GerenciadorDividas(); 