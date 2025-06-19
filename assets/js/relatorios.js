// Módulo de Relatórios
class GerenciadorRelatorios {
    constructor() {
        this.graficoCategorias = null;
        this.graficoFluxo = null;
        this.inicializarGraficos();
    }

    inicializarGraficos() {
        this.criarGraficoCategorias();
        this.criarGraficoFluxo();
    }

    criarGraficoCategorias() {
        const ctx = document.getElementById('graficoCategorias');
        if (!ctx) return;

        this.graficoCategorias = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    criarGraficoFluxo() {
        const ctx = document.getElementById('graficoFluxo');
        if (!ctx) return;

        this.graficoFluxo = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Ganhos',
                    data: [],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Gastos',
                    data: [],
                    borderColor: '#EF4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Saldo',
                    data: [],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: R$ ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }

    atualizarGraficoCategorias() {
        if (!this.graficoCategorias) return;

        const transacoes = Utils.carregarDados('transacoes');
        const gastosPorCategoria = {};

        // Filtrar apenas gastos e agrupar por categoria
        transacoes
            .filter(t => t.tipo === 'gasto')
            .forEach(t => {
                gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + t.valor;
            });

        // Ordenar por valor (maior para menor)
        const categoriasOrdenadas = Object.entries(gastosPorCategoria)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10 categorias

        this.graficoCategorias.data.labels = categoriasOrdenadas.map(([categoria]) => categoria);
        this.graficoCategorias.data.datasets[0].data = categoriasOrdenadas.map(([, valor]) => valor);
        this.graficoCategorias.update();
    }

    atualizarGraficoFluxo() {
        if (!this.graficoFluxo) return;

        const transacoes = Utils.carregarDados('transacoes');
        const meses = [];
        const ganhos = [];
        const gastos = [];
        const saldos = [];

        // Gerar últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const data = new Date();
            data.setMonth(data.getMonth() - i);
            const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            meses.push(mesAno);

            // Calcular valores do mês
            const mesInicio = new Date(data.getFullYear(), data.getMonth(), 1);
            const mesFim = new Date(data.getFullYear(), data.getMonth() + 1, 0);

            const transacoesMes = transacoes.filter(t => {
                const dataTransacao = new Date(t.data);
                return dataTransacao >= mesInicio && dataTransacao <= mesFim;
            });

            const ganhosMes = transacoesMes
                .filter(t => t.tipo === 'ganho')
                .reduce((sum, t) => sum + t.valor, 0);

            const gastosMes = transacoesMes
                .filter(t => t.tipo === 'gasto')
                .reduce((sum, t) => sum + t.valor, 0);

            ganhos.push(ganhosMes);
            gastos.push(gastosMes);
            saldos.push(ganhosMes - gastosMes);
        }

        this.graficoFluxo.data.labels = meses;
        this.graficoFluxo.data.datasets[0].data = ganhos;
        this.graficoFluxo.data.datasets[1].data = gastos;
        this.graficoFluxo.data.datasets[2].data = saldos;
        this.graficoFluxo.update();
    }

    atualizarRelatorios() {
        this.atualizarGraficoCategorias();
        this.atualizarGraficoFluxo();
    }

    gerarRelatorioMensal(mes, ano) {
        const transacoes = Utils.carregarDados('transacoes');
        const mesInicio = new Date(ano, mes - 1, 1);
        const mesFim = new Date(ano, mes, 0);

        const transacoesMes = transacoes.filter(t => {
            const dataTransacao = new Date(t.data);
            return dataTransacao >= mesInicio && dataTransacao <= mesFim;
        });

        const ganhos = transacoesMes.filter(t => t.tipo === 'ganho');
        const gastos = transacoesMes.filter(t => t.tipo === 'gasto');

        const totalGanhos = ganhos.reduce((sum, t) => sum + t.valor, 0);
        const totalGastos = gastos.reduce((sum, t) => sum + t.valor, 0);
        const saldo = totalGanhos - totalGastos;

        // Agrupar gastos por categoria
        const gastosPorCategoria = {};
        gastos.forEach(t => {
            gastosPorCategoria[t.categoria] = (gastosPorCategoria[t.categoria] || 0) + t.valor;
        });

        return {
            mes: mesInicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            totalGanhos,
            totalGastos,
            saldo,
            ganhos,
            gastos,
            gastosPorCategoria,
            transacoesMes
        };
    }

    exportarRelatorio() {
        const relatorio = this.gerarRelatorioMensal(new Date().getMonth() + 1, new Date().getFullYear());
        
        let conteudo = `RELATÓRIO FINANCEIRO - ${relatorio.mes}\n`;
        conteudo += '='.repeat(50) + '\n\n';
        
        conteudo += `RESUMO:\n`;
        conteudo += `Total de Ganhos: ${Utils.formatarMoeda(relatorio.totalGanhos)}\n`;
        conteudo += `Total de Gastos: ${Utils.formatarMoeda(relatorio.totalGastos)}\n`;
        conteudo += `Saldo: ${Utils.formatarMoeda(relatorio.saldo)}\n\n`;
        
        conteudo += `GASTOS POR CATEGORIA:\n`;
        Object.entries(relatorio.gastosPorCategoria)
            .sort(([,a], [,b]) => b - a)
            .forEach(([categoria, valor]) => {
                conteudo += `${categoria}: ${Utils.formatarMoeda(valor)}\n`;
            });
        
        conteudo += `\nTRANSAÇÕES DETALHADAS:\n`;
        relatorio.transacoesMes
            .sort((a, b) => new Date(a.data) - new Date(b.data))
            .forEach(t => {
                const tipo = t.tipo === 'ganho' ? '+' : '-';
                conteudo += `${Utils.formatarData(t.data)} - ${t.descricao} (${t.categoria}) ${tipo}${Utils.formatarMoeda(t.valor)}\n`;
            });

        // Criar arquivo para download
        const blob = new Blob([conteudo], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_financeiro_${relatorio.mes.replace(' ', '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.mostrarNotificacao('Relatório exportado com sucesso!', 'success');
    }
}

// Instanciar o gerenciador de relatórios
const gerenciadorRelatorios = new GerenciadorRelatorios(); 