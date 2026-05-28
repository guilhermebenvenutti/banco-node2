-- =============================================
-- 1. Tabela de Usuários (sem dependências)
-- =============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id              BIGSERIAL PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL,
    cpf             VARCHAR(11) UNIQUE NOT NULL,
    senha           VARCHAR(255) NOT NULL,
    criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. Tabela de Contas (depende de usuarios)
-- =============================================
CREATE TABLE IF NOT EXISTS contas (
    id              BIGSERIAL PRIMARY KEY,
    usuario_id      BIGINT NOT NULL,
    saldo           NUMERIC(15, 2) DEFAULT 0.00 NOT NULL CHECK (saldo >= 0),
    criado_em       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adiciona a chave estrangeira separadamente (evita o erro)
ALTER TABLE contas 
ADD CONSTRAINT fk_contas_usuario 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_contas_usuario_id ON contas(usuario_id);

-- =============================================
-- 3. Tabela de Transações (depende de contas)
-- =============================================
CREATE TABLE IF NOT EXISTS transacoes (
    id                BIGSERIAL PRIMARY KEY,
    conta_origem      BIGINT,
    conta_destino     BIGINT,
    valor             NUMERIC(15, 2) NOT NULL CHECK (valor > 0),
    tipo              VARCHAR(20) NOT NULL CHECK (tipo IN ('TRANSFERENCIA', 'DEPOSITO', 'SAQUE')),
    descricao         TEXT,
    data              TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Adiciona as chaves estrangeiras separadamente
ALTER TABLE transacoes 
ADD CONSTRAINT fk_transacoes_origem 
FOREIGN KEY (conta_origem) REFERENCES contas(id) ON DELETE SET NULL;

ALTER TABLE transacoes 
ADD CONSTRAINT fk_transacoes_destino 
FOREIGN KEY (conta_destino) REFERENCES contas(id) ON DELETE SET NULL;

-- Índices importantes
CREATE INDEX IF NOT EXISTS idx_transacoes_conta_origem  ON transacoes(conta_origem);
CREATE INDEX IF NOT EXISTS idx_transacoes_conta_destino ON transacoes(conta_destino);
CREATE INDEX IF NOT EXISTS idx_transacoes_data          ON transacoes(data);



-- =============================================
-- 4. Tabela de Cartões (depende de contas)
-- =============================================
CREATE TABLE IF NOT EXISTS cartoes (
    id BIGSERIAL PRIMARY KEY,
    conta_id BIGINT NOT NULL,
    numero VARCHAR(16) NOT NULL,
    nome_impresso VARCHAR(100) NOT NULL,
    validade VARCHAR(5) NOT NULL,
    cvv VARCHAR(3) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'DEBITO',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cartoes_conta FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE CASCADE
);


-- =============================================
-- 5. Seeding (Dados Iniciais de Teste)
-- =============================================

-- Cria o Guilherme ADM
INSERT INTO usuarios (nome, cpf, senha) 
VALUES ('Guilherme ADM', '13880251916', '$2b$10$VTqWsxY1wzMHw20feqfu1e2W9VyY2NP1OHZxXRX7AxcOkRx.zpCaK')
ON CONFLICT (cpf) DO NOTHING;

-- Cria a conta com 10 mil reais (ID = 1)
INSERT INTO contas (usuario_id, saldo) 
VALUES (1, 100000000.00);

-- Cria o cartão de débito zerado do Guilherme
INSERT INTO cartoes (conta_id, numero, nome_impresso, validade, cvv)
VALUES (1, '0000000000000000', 'GUILHERME ADM', '12/99', '000');