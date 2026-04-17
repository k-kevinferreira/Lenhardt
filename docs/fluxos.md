# Fluxos

Resumo dos fluxos funcionais principais do sistema.

## 1. Login Admin

1. Usuario acessa `admin/login.html`
2. Envia e-mail e senha
3. Backend valida credenciais
4. Sistema retorna `accessToken`
5. Backend grava `refresh_token` em cookie `httpOnly`
6. Painel usa `Authorization: Bearer` nas rotas protegidas

## 2. Refresh de Sessao

1. `accessToken` expira
2. Front chama `/api/auth/refresh`
3. Backend valida refresh token
4. Token anterior e revogado
5. Novo refresh token e emitido
6. Novo `accessToken` e devolvido ao front junto com `user`

## 3. Solicitacao Publica de Agendamento

1. Cliente preenche formulario no site
2. Front envia para `/api/public/agendamentos`
3. Backend valida dados e calcula valor estimado pelo servico
4. Agendamento entra como `pendente`
5. Admin passa a enxergar esse agendamento no painel

## 4. Contato Publico

1. Cliente preenche formulario de contato
2. Front envia para `/api/public/contatos`
3. Backend valida e salva em `contatos`

## 5. Solicitacao Publica de Acesso

1. Usuario acessa `admin/login.html`
2. Clica em `Cadastrar novo usuario`
3. Front envia a solicitacao para `/api/public/solicitacoes-acesso`
4. Backend valida nome, e-mail, senha e duplicidade
5. Solicitacao entra como `pendente`
6. Admin pode aprovar ou recusar no painel
7. Quando aprovada, o sistema cria um usuario com perfil `operador`

## 6. Cadastro de Veiculo no Admin

1. Admin abre `Historico de Veiculos`
2. Cadastra placa, cliente e veiculo
3. Campos de ultimo servico e data sao opcionais
4. Historico financeiro e operacional vem dos agendamentos

## 7. Novo Veiculo pelo Modal de Agendamentos

1. Admin abre `Agendamentos`
2. Clica em `+ Novo`
3. No campo veiculo, usa `+ Novo`
4. Sistema cria a ficha do veiculo
5. Veiculo e carregado no select do agendamento

## 8. Conclusao de Agendamento

1. Admin conclui um agendamento
2. Backend registra pagamento
3. Backend atualiza dados de ultimo servico do veiculo
4. Dashboard passa a refletir esse pagamento

## 9. Gestao de Funcionarios

1. Admin cadastra funcionario
2. Funcionario pode ter e-mail, telefone e observacoes
3. Status pode ser `ativo` ou `inativo`

## 10. Gestao de Usuarios do Sistema

1. Admin abre `Funcionarios`
2. Na secao `Usuarios do Sistema`, pode:
   criar novo usuario
   alterar senha
   ativar ou desativar
   alterar perfil de acesso
   excluir
3. Na secao `Solicitacoes de Acesso`, pode:
   aprovar solicitacao pendente
   recusar solicitacao pendente

Regras:

- nao pode desativar o proprio usuario
- nao pode excluir o proprio usuario
- nao pode alterar o proprio perfil para deixar de ser `admin`
- nao pode desativar ou excluir o ultimo usuario admin
- nao pode remover o ultimo usuario `admin` ativo do sistema

## 11. Dashboard

1. Admin escolhe ano e mes
2. Front consulta resumo financeiro
3. Front consulta faturamento mensal
4. Front consulta servicos mais vendidos
5. Painel exibe cards e graficos
