// Utilitários do Sistema Financeiro

// Funções de formatação
const Utils = {
    formatarData(data) {
        return new Date(data).toLocaleDateString('pt-BR');
    },

    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    },

    mostrarNotificacao(mensagem, tipo = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${tipo} px-4 py-3 rounded-lg shadow-lg`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'exclamation-triangle'} mr-2"></i>
                <span>${mensagem}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Remover notificação após 3 segundos
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    salvarDados(chave, dados) {
        localStorage.setItem(chave, JSON.stringify(dados));
    },

    carregarDados(chave) {
        return JSON.parse(localStorage.getItem(chave)) || [];
    },

    definirDataAtual() {
        return new Date().toISOString().split('T')[0];
    }
}; 