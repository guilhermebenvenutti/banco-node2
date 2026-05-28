const API_URL = '/api';

// ====================== MÁSCARA DE CPF ======================
document.getElementById('cpfDestino')?.addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); 
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
});

// ====================== TRANSFERÊNCIA ======================
document.getElementById('transferenciaForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const contaOrigem = localStorage.getItem('conta_id');
    if (!contaOrigem) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = 'index.html';
        return;
    }

    const btn = e.target.querySelector('button');
    const textoOriginal = btn.textContent;

    // Pega o CPF e limpa os pontos/traços
    const cpfSujo = document.getElementById('cpfDestino').value;
    const cpfDestino = cpfSujo.replace(/\D/g, '');
    
    const valor = parseFloat(document.getElementById('valor').value);
    const descricao = document.getElementById('descricao').value;
    const mensagem = document.getElementById('mensagem');

    if (cpfDestino.length !== 11) {
        mensagem.textContent = 'Digite um CPF válido com 11 números.';
        return;
    }

    if (!valor || valor <= 0) {
        mensagem.textContent = 'Digite um valor válido para transferir.';
        return;
    }

    btn.textContent = 'Processando PIX...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/transacoes/transferir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conta_origem: parseInt(contaOrigem),
                cpf_destino: cpfDestino, // AGORA ENVIAMOS O CPF
                valor: valor,
                descricao: descricao || 'PIX via App'
            })
        });

        const data = await response.json();

        if (response.ok) {
            // 1. Esconde o formulário antigo
            document.getElementById('transferenciaForm').style.display = 'none';
            document.querySelector('.tela-titulo').style.display = 'none';

            // 2. Preenche os dados do recibo
            const comp = data.comprovante;
            document.getElementById('compValor').textContent = parseFloat(comp.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            document.getElementById('compNome').textContent = comp.destino;
            
            // Aplica a máscara no CPF (ex: 11122233344 vira 111.222.333-44)
            const cpfFormatado = comp.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
            document.getElementById('compCpf').textContent = cpfFormatado;
            document.getElementById('compData').textContent = comp.data;
            document.getElementById('compID').textContent = comp.id;

            // 3. Mostra o comprovante na tela
            document.getElementById('areaComprovante').style.display = 'block';
            mensagem.textContent = ''; 
        } else {
            mensagem.textContent = data.erro || 'Erro ao realizar transferência';
            btn.textContent = textoOriginal;
            btn.disabled = false;
        }
    } catch (error) {
        mensagem.textContent = 'Erro de conexão com o servidor';
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
});



// ====================== GERAR PDF ======================
function baixarPDF() {
    const elemento = document.getElementById('comprovante-print');
    
    // Configurações do arquivo PDF
    const opt = {
        margin:       1,
        filename:     'Comprovante_GGBank.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Gera o download
    html2pdf().set(opt).from(elemento).save();
}