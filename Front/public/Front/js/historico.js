const API_URL = '/api';

window.onload = async () => {
    const contaId = localStorage.getItem('conta_id');
    if (!contaId) return window.location.href = 'index.html';

    try {
        const response = await fetch(`${API_URL}/transacoes/historico/${contaId}`);
        const transacoes = await response.json();
        const lista = document.getElementById('listaCompleta');

        if (transacoes.length === 0) {
            lista.innerHTML = '<p style="color: #888; text-align: center;">Nenhuma transação encontrada.</p>';
            return;
        }

        transacoes.forEach(t => {
            const div = document.createElement('div');
            // Estilo de cada linha do extrato
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.borderBottom = '1px solid #2a2a2a';
            div.style.padding = '12px 0';

            const ehSaida = t.conta_origem == contaId;
            const corTexto = ehSaida ? '#ff5252' : '#00c853';
            const textoTipo = ehSaida ? 'Saiu:' : 'Entrou:';
            const dataFormatada = new Date(t.data).toLocaleString('pt-BR');
            const valorFormatado = parseFloat(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            div.innerHTML = `
                <div>
                    <p style="color: ${corTexto}; margin: 0; font-size: 15px; font-weight: bold;">
                        ${textoTipo} ${valorFormatado}
                    </p>
                    <small style="color: #888;">${t.descricao || 'Transferência'} | ${dataFormatada.split(',')[0]}</small>
                </div>
                <button onclick="gerarRecibo('${t.valor}', '${t.descricao}', '${t.data}', '${t.id}')" 
                        style="background: transparent; border: 1px solid #444; color: #fff; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">
                    📄 PDF
                </button>
            `;
            lista.appendChild(div);
        });
    } catch (error) {
        console.error("Erro ao carregar histórico completo", error);
    }
};

// Função acionada ao clicar no botão de PDF de alguma transação da lista
function gerarRecibo(valor, desc, data, id) {
    document.getElementById('compValor').textContent = parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('compDesc').textContent = desc !== 'null' ? desc : 'Transferência';
    document.getElementById('compData').textContent = new Date(data).toLocaleString('pt-BR');
    document.getElementById('compID').textContent = id;

    const elemento = document.getElementById('comprovante-print');
    
    // Configurações do PDF com tela escura
    const opt = {
        margin:       1,
        filename:     `GGBank_Recibo_${id}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Gera o arquivo temporariamente mostrando a div oculta
    document.getElementById('areaComprovanteOculto').style.display = 'block';
    html2pdf().set(opt).from(elemento).save().then(() => {
        document.getElementById('areaComprovanteOculto').style.display = 'none';
    });
}