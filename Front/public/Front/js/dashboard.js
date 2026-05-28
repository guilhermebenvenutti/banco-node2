const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if (!usuario) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('nomeUsuario').textContent = usuario.nome || 'Usuário';
    
    // Inicia a busca dos dados reais no banco
    carregarDadosBancarios(usuario.id);
});

async function carregarDadosBancarios(usuarioId) {
    try {
        // 1. Busca a conta e o saldo
        const responseConta = await fetch(`${API_URL}/contas/usuario/${usuarioId}`);
        if (!responseConta.ok) throw new Error('Conta não encontrada');
        
        const conta = await responseConta.json();
        const saldoFormatado = parseFloat(conta.saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('saldo').textContent = saldoFormatado;
        localStorage.setItem('conta_id', conta.id);

        // 2. Busca o Histórico
        carregarHistorico(conta.id);

        // 3. BUSCA O CARTÃO DE DÉBITO
        carregarCartao(conta.id);

    } catch (error) {
        console.error(error);
        document.getElementById('saldo').textContent = 'Erro ao carregar';
    }
}

// NOVA FUNÇÃO: Renderiza os dados do cartão na tela
async function carregarCartao(contaId) {
    try {
        const response = await fetch(`${API_URL}/contas/cartao/${contaId}`);
        if (!response.ok) return; // Se não tiver cartão, apenas não faz nada
        
        const cartao = await response.json();

        // Formata o número colocando espaço a cada 4 dígitos
        const numeroFormatado = cartao.numero.replace(/(.{4})/g, '$1 ').trim();

        document.getElementById('cartaoNumero').textContent = numeroFormatado;
        document.getElementById('cartaoNome').textContent = cartao.nome_impresso;
        document.getElementById('cartaoValidade').textContent = cartao.validade;

    } catch (error) {
        console.error('Erro ao carregar o cartão:', error);
    }
}

async function carregarHistorico(contaId) {
    const historicoDiv = document.getElementById('historico');
    historicoDiv.innerHTML = '<p>Carregando histórico...</p>';

    try {
        const response = await fetch(`${API_URL}/transacoes/historico/${contaId}`);
        const transacoes = await response.json();

        if (transacoes.length === 0) {
            historicoDiv.innerHTML = '<p style="color: #ccc;">Nenhuma transação encontrada.</p>';
            return;
        }

        // 👇 AQUI ESTÁ A MÁGICA: Corta a lista para pegar apenas os 5 primeiros itens!
        const ultimasTransacoes = transacoes.slice(0, 5);

        // Monta a lista de histórico dinamicamente usando a nova variável
        historicoDiv.innerHTML = ultimasTransacoes.map(t => {
            const isOrigem = (t.conta_origem == contaId);
            const tipoTexto = isOrigem ? 'Saiu:' : 'Entrou:';
            const cor = isOrigem ? '#ff5252' : '#00c853'; // Vermelho se saiu, Verde se entrou
            
            const dataFormatada = new Date(t.data).toLocaleDateString('pt-BR');
            const valorFormatado = parseFloat(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            return `<p>
                      <strong style="color: ${cor}">${tipoTexto}</strong> 
                      ${t.descricao || t.tipo} - ${valorFormatado} 
                      <span style="font-size: 0.8em; color: #aaa; float: right;">${dataFormatada}</span>
                    </p>`;
        }).join('');

    } catch (error) {
        historicoDiv.innerHTML = '<p class="error">Erro ao carregar histórico.</p>';
    }
}
// Função de logout 
function logout() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('conta_id'); // Limpa a conta também
    window.location.href = 'index.html';
}