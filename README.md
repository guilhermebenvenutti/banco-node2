# GGBank - Sistema Bancário

Sistema bancário desenvolvido com Node.js, PostgreSQL, Docker e Kubernetes.

---

## Tecnologias

- **Backend:** Node.js + Express
- **Banco de Dados:** PostgreSQL
- **Frontend:** HTML, CSS, JavaScript
- **Containerização:** Docker + Docker Hub
- **Orquestração:** Kubernetes (Minikube ou K3s)
- **Deploy:** AWS EC2

---

## Estrutura do Projeto

```
banco-node2/
├── Back/                    # API Node.js
│   ├── src/
│   │   ├── routes/
│   │   │   ├── contas.js
│   │   │   ├── transacoes.js
│   │   │   └── usuarios.js
│   │   ├── db.js
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
├── Database/
│   └── init.sql             # Tabelas + dados iniciais
├── Front/public/            # Frontend estático
│   ├── Front/
│   │   ├── css/
│   │   ├── js/
│   │   └── *.html
│   └── Dockerfile
├── k8s/                     # Manifests Kubernetes
│   ├── backend_deployment.yaml
│   ├── backend_service.yaml
│   ├── frontend_deployment.yaml
│   ├── frontend_service.yaml
│   ├── ingress.yaml
│   ├── postgres.yaml
│   ├── configmap.yaml
│   └── secret.yaml
├── docker-compose.yaml      # Para rodar localmente
└── README.md
```

---

## Usuário Administrador (para testes)

| Campo | Valor |
|-------|-------|
| CPF | 138.802.519-16 |
| Senha | gui123/*- |
| Saldo inicial | R$ 100.000.000,00 |

---

## Opção 1 — Rodar Localmente com Docker Compose

### Pré-requisitos
- Docker Desktop instalado e rodando

### Comandos

```bash
# Clonar o repositório
git clone https://github.com/guilhermebenvenutti/banco-node2.git
cd banco-node2

# Subir todos os containers
docker compose up -d

# Ver logs
docker compose logs -f

# Parar tudo
docker compose down
```

Acesse em: `http://localhost:3001`

---

## Opção 2 — Deploy na AWS EC2 com Docker Compose

### 1. Criar instância EC2
- Sistema: Ubuntu 22.04
- Tipo: t2.micro (mínimo) ou t2.small (recomendado)
- Disco: mínimo 20 GB
- Security Group — liberar portas:
  - 22 (SSH)
  - 80 (HTTP)
  - 3000 (Backend)
  - 3001 (Frontend)

### 2. Conectar na instância

```bash
ssh -i "sua-chave.pem" ubuntu@SEU_IP_DA_AWS
```

### 3. Instalar Docker na VM

```bash
sudo apt update
sudo apt install docker.io -y
sudo usermod -aG docker $USER
newgrp docker

# Instalar Docker Compose V2
sudo apt install docker-compose-plugin -y

# Verificar instalação
docker --version
docker compose version
```

### 4. Clonar e subir o projeto

```bash
git clone https://github.com/guilhermebenvenutti/banco-node2.git
cd banco-node2

docker compose up -d

# Ver se está rodando
docker compose ps
```

Acesse em: `http://SEU_IP_DA_AWS:3001`

---

## Opção 3 — Deploy na AWS EC2 com Kubernetes (Minikube)

### 1. Instalar dependências na VM

```bash
# Atualizar sistema
sudo apt update

# Instalar Docker
sudo apt install docker.io -y
sudo usermod -aG docker $USER
newgrp docker

# Instalar kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Instalar Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Verificar instalações
kubectl version --client
minikube version
```

### 2. Clonar o repositório

```bash
git clone https://github.com/guilhermebenvenutti/banco-node2.git
cd banco-node2
```

### 3. Iniciar o Minikube

```bash
minikube start

# Habilitar o Ingress (NGINX)
minikube addons enable ingress

# Verificar se o cluster está rodando
kubectl get nodes
```

### 4. Construir as imagens Docker dentro do Minikube

```bash
# Apontar o terminal para o Docker interno do Minikube
eval $(minikube docker-env)

# Construir imagem do backend
docker build -t guigotoso/banco-node-back:1.0 ./Back

# Construir imagem do frontend
docker build -t guigotoso/banco-node-front:1.5 ./Front/public

# Verificar imagens criadas
docker images
```

### 5. Aplicar os manifests Kubernetes

```bash
# Aplicar na ordem correta
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml

# Aguardar o banco subir (cerca de 10 segundos)
sleep 10

kubectl apply -f k8s/backend_deployment.yaml
kubectl apply -f k8s/backend_service.yaml
kubectl apply -f k8s/frontend_deployment.yaml
kubectl apply -f k8s/frontend_service.yaml
kubectl apply -f k8s/ingress.yaml

# Ou aplicar tudo de uma vez
kubectl apply -f k8s/
```

### 6. Verificar se está tudo rodando

```bash
# Ver status dos pods
kubectl get pods

# Resultado esperado (todos Running):
# backend-deployment-xxxxx    1/1   Running   0   1m
# frontend-deployment-xxxxx   1/1   Running   0   1m
# postgres-xxxxx              1/1   Running   0   1m

# Ver services
kubectl get svc

# Ver ingress
kubectl get ingress
```

### 7. Acessar a aplicação

```bash
# Pegar o IP da VM
curl ifconfig.me
```

Acesse em: `http://SEU_IP_DA_AWS`

> O Ingress roteia automaticamente:
> - `/` → Frontend (porta 3001)
> - `/api` → Backend (porta 3000)

---

## Publicar imagens no Docker Hub (atualizar versão)

```bash
# Login no Docker Hub
docker login

# Build das imagens (substituir SEU_USUARIO pelo seu login)
cd Back
docker build -t guigotoso/banco-node-back:1.0 .
cd ../Front/public
docker build -t guigotoso/banco-node-front:1.5 .

# Push para o Docker Hub
docker push guigotoso/banco-node-back:1.0
docker push guigotoso/banco-node-front:1.5
```

---

## Comandos úteis do Kubernetes

```bash
# Ver todos os recursos
kubectl get all

# Ver logs do backend
kubectl logs -l app=backend

# Ver logs do frontend
kubectl logs -l app=frontend

# Ver logs do banco
kubectl logs -l app=postgres

# Entrar no pod do backend
kubectl exec -it deploy/backend-deployment -- sh

# Entrar no banco de dados
kubectl exec -it deploy/postgres -- psql -U postgres -d guigostoso

# Reiniciar um deployment
kubectl rollout restart deployment backend-deployment
kubectl rollout restart deployment frontend-deployment

# Deletar tudo e recomeçar
kubectl delete -f k8s/
kubectl apply -f k8s/

# Deletar pods com erro
kubectl delete pods --all
```

## Comandos úteis do banco de dados

```bash
# Entrar no PostgreSQL
kubectl exec -it deploy/postgres -- psql -U postgres -d guigostoso

# Listar tabelas
\dt

# Ver todos os usuários
SELECT id, nome, cpf FROM usuarios;

# Ver contas e saldos
SELECT u.nome, c.id AS conta, c.saldo
FROM usuarios u
JOIN contas c ON u.id = c.usuario_id;

# Ver transações
SELECT * FROM transacoes ORDER BY data DESC;

# Sair do banco
\q
```

---

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/usuarios/register` | Cadastrar usuário |
| POST | `/api/usuarios/login` | Login |
| GET | `/api/contas/usuario/:id` | Consultar conta |
| GET | `/api/contas/cartao/:conta_id` | Dados do cartão |
| POST | `/api/transacoes/transferir` | Transferência via CPF (PIX) |
| GET | `/api/transacoes/historico/:conta_id` | Histórico de transações |

---

## Atualizar aplicação na VM (após mudanças no código)

```bash
# Na sua máquina local — enviar para o GitHub
git add .
git commit -m "descricao da mudanca"
git push

# Na VM da AWS — puxar atualizações
cd banco-node2
git pull

# Reconstruir e aplicar
eval $(minikube docker-env)
docker build -t guigotoso/banco-node-back:1.0 ./Back
kubectl rollout restart deployment backend-deployment
```
