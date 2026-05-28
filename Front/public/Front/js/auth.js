const API_URL = '/api';

// ====================== MÁSCARAS E VALIDAÇÕES ======================

// Máscara do CPF
document.getElementById('cpf')?.addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); 
    if (value.length > 11) value = value.slice(0, 11);
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = value;
});

// Validador Matemático de CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, ''); 
    if (cpf == '' || cpf.length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto == 10) || (resto == 11)) resto = 0;
    if (resto != parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto == 10) || (resto == 11)) resto = 0;
    if (resto != parseInt(cpf.substring(10, 11))) return false;
    return true;
}

// Validador de Nome (Sem números, pelo menos 2 palavras com 2+ letras)
function validarNome(nome) {
    // 1. Verifica se o nome contém apenas letras (incluindo acentos) e espaços
    const regexSomenteLetras = /^[a-zA-ZÀ-ÿ\s]+$/;
    if (!regexSomenteLetras.test(nome)) return false;

    // 2. Verifica se tem nome e sobrenome, com mínimo de 2 letras cada
    const partes = nome.trim().split(/\s+/); 
    if (partes.length < 2) return false; 
    return partes.every(parte => parte.length >= 2); 
}
// Validador de Senha (Mínimo 6 chars, 1 letra, 1 número, 1 símbolo)
function validarSenhaForte(senha) {
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,}$/;
    return regex.test(senha);
}


// ====================== LOGIN ======================
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector('button');
    const textoOriginal = btn.textContent;
    
    const cpfSujo = document.getElementById('cpf').value;
    const cpf = cpfSujo.replace(/\D/g, ''); 
    const senha = document.getElementById('senha').value;
    const mensagem = document.getElementById('mensagem');

    if (!validarCPF(cpf)) {
        mensagem.textContent = 'CPF inválido. Verifique os números.';
        return;
    }

    btn.textContent = 'Entrando...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/usuarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf, senha })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            window.location.href = 'dashboard.html';
        } else {
            mensagem.textContent = data.erro || 'CPF ou senha inválidos';
            btn.textContent = textoOriginal;
            btn.disabled = false;
        }
    } catch (error) {
        mensagem.textContent = 'Erro de conexão com o servidor';
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
});


// ====================== CADASTRO ======================
document.getElementById('cadastroForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = e.target.querySelector('button');
    const textoOriginal = btn.textContent;
    
    const nome = document.getElementById('nome').value.trim();
    const cpfSujo = document.getElementById('cpf').value;
    const cpf = cpfSujo.replace(/\D/g, ''); 
    const senha = document.getElementById('senha').value;
    
    // Pega o campo novo que adicionamos no HTML
    const confirmaSenha = document.getElementById('confirmaSenha').value; 
    
    const mensagem = document.getElementById('mensagem');

// 1. Valida Nome
    if (!validarNome(nome)) {
        mensagem.textContent = 'Nome inválido. Use apenas letras e certifique-se de digitar nome e sobrenome.';
        return;
    }

    // 2. Valida CPF
    if (!validarCPF(cpf)) {
        mensagem.textContent = 'O CPF informado não é válido.';
        return;
    }

    // 3. Valida Senha Forte
    if (!validarSenhaForte(senha)) {
        mensagem.textContent = 'A senha deve ter no mínimo 6 caracteres, contendo letras, números e 1 símbolo especial.';
        return;
    }

    // 4. Valida se as senhas são iguais
    if (senha !== confirmaSenha) {
        mensagem.textContent = 'As senhas não coincidem. Digite novamente.';
        return;
    }

    // Se passou em todos os testes, bloqueia o botão para evitar clique duplo
    btn.textContent = 'Criando conta...';
    btn.disabled = true;
    mensagem.textContent = ''; // Limpa mensagens antigas

    try {
        const response = await fetch(`${API_URL}/usuarios/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, cpf, senha })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Cadastro realizado com sucesso! Faça login.');
            window.location.href = 'index.html';
        } else {
            mensagem.textContent = data.erro || 'Erro ao cadastrar';
            btn.textContent = textoOriginal;
            btn.disabled = false;
        }
    } catch (error) {
        mensagem.textContent = 'Erro de conexão com o servidor';
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
});