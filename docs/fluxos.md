# Fluxos

Resumo dos fluxos funcionais principais do sistema.

## 1. Login Admin

1. Usuário acessa `admin/login.html`
2. Envia e-mail e senha
3. Backend valida credenciais
4. Sistema retorna `accessToken`
5. Backend grava `refresh_token` em cookie `httpOnly`
6. Painel usa `Authorization: Bearer` nas rotas protegidas

## 2. Refresh de Sessão

1. `accessToken` expira
2. Front chama `/api/auth/refresh`
3. Backend valida refresh token
4. Token anterior é revogado
5. Novo refresh token é emitido
6. Novo `accessToken` é devolvido ao front junto com `user`

## 3. Solicitação Pública de Agendamento

1. Cliente preenche formulário no site
2. Front envia para `/api/public/agendamentos`
3. Backend valida dados e calcula valor estimado pelo serviço
4. Agendamento entra como `pendente`
5. Admin passa a enxergar esse agendamento no painel

## 4. Contato Público

1. Cliente preenche formulário de contato
2. Front envia para `/api/public/contatos`
3. Backend valida e salva em `contatos`

## 5. Solicitação Pública de Acesso

1. Usuário acessa `admin/login.html`
2. Clica em `Cadastrar novo usuário`
3. Front envia a solicitação para `/api/public/solicitacoes-acesso`
4. Backend valida nome, e-mail, senha e duplicidade
5. Solicitação entra como `pendente`
6. Admin pode aprovar ou recusar no painel
7. Quando aprovada, o sistema cria um usuário com perfil `operador`

## 6. Cadastro de Veículo no Admin

1. Admin abre `Histórico de Veículos`
2. Cadastra placa, cliente e veículo
3. Campos de último serviço e data são opcionais
4. Histórico financeiro e operacional vem dos agendamentos

## 7. Novo Veículo pelo Modal de Agendamentos

1. Admin abre `Agendamentos`
2. Clica em `+ Novo`
3. No campo veículo, usa `+ Novo`
4. Sistema cria a ficha do veículo
5. Veículo é carregado no select do agendamento

## 8. Conclusão de Agendamento

1. Admin conclui um agendamento
2. Backend registra pagamento
3. Backend atualiza dados de último serviço do veículo
4. Dashboard passa a refletir esse pagamento

## 9. Gestão de Funcionários

1. Admin cadastra funcionário
2. Funcionário pode ter e-mail, telefone e observações
3. Status pode ser `ativo` ou `inativo`

## 10. Gestão de Usuários do Sistema

1. Admin abre `Funcionários`
2. Na seção `Usuários do Sistema`, pode:
   criar novo usuário
   alterar senha
   ativar ou desativar
   alterar perfil de acesso
   excluir
3. Na seção `Solicitações de Acesso`, pode:
   aprovar solicitação pendente
   recusar solicitação pendente

Regras:

- não pode desativar o próprio usuário
- não pode excluir o próprio usuário
- não pode alterar o próprio perfil para deixar de ser `admin`
- não pode desativar ou excluir o último usuário admin
- não pode remover o último usuário `admin` ativo do sistema

## 11. Dashboard

1. Admin escolhe ano e mês
2. Front consulta resumo financeiro
3. Front consulta faturamento mensal
4. Front consulta serviços mais vendidos
5. Painel exibe cards e gráficos
