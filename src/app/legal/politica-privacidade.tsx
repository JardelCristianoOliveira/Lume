# Política de Privacidade - Lume Store

**Versão:** 1.0  
**Data:** [DATA PARA SER PREENCHIDA]  
**Controlador:** [RAZÃO SOCIAL/NOME FANTASIA PARA SER PREENCHIDA]  
**CNPJ:** [CNPJ PARA SER PREENCHIDA]  
**Endereço:** [ENDEREÇO PARA SER PREENCHIDA]  
**E-mail de contato:** [E-MAIL PARA SER PREENCHIDO]  

## 1. Identificação do Controlador

Este documento tem como objetivo esclarecer como os dados pessoais são tratados pela Lume Store, operação da [RAZÃO SOCIAL], pessoa jurídica de direito privado, inscrita no CNPJ sob o nº [CNPJ], com sede em [ENDEREÇO], para os fins previstos na Lei nº 13.709/2018 (LGPD).

## 2. Canais de Contato

Para quaisquer dúvidas, esclarecimentos ou exercício de direitos, o titular de dados pode entrar em contato através dos seguintes canais:

- **E-mail:** [E-MAIL DE CONTATO]
- **Telefone:** [TELEFONE PARA SER PREENCHIDO]
- **Endereço:** [ENDEREÇO PARA SER PREENCHIDO]

## 3. Dados Coletidos

Coletamos apenas os dados necessários para o funcionamento da loja e para as finalidades descritas abaixo:

### 3.1. Dados fornecidos diretamente pelo titular:

- **Nome completo:** Para identificação e comunicação.
- **E-mail:** Para criação de conta, comunicação sobre pedidos e envios.
- **Telefone:** Para contato relacionado a pedidos e entregas.
- **Senha:** Para autenticação na conta do cliente (gerenciada pelo Supabase Auth).
- **Endereço de entrega:** Apenas quando necessário para a entrega de produtos.
- **Dados de pagamento:** Apenas o necessário para processamento da transação (never armazenamos números completos de cartão ou CVV).

### 3.2. Dados coletados automaticamente:

- **Endereço IP:** Para fins de segurança e prevenção de fraudes.
- **Dados de navegação:** Páginas visitadas, tempo de permanência, referenciador.
- **Cookies:** Conforme a seção 9 desta política.

### 3.3. Dados obtidos de terceiros (quando aplicável):

- Dados de verificação de endereço para entregas, quando o cliente optar por esta opção.

## 4. Finalidades do Tratamento

Cada finalidade de tratamento possui base legal específica, conforme detalhado abaixo:

### 4.1. Finalidade: Execução de contrato e prestação de serviços
- **Finalidade:** Processamento de pedidos, faturamento, entrega de produtos.
- **Base Legal:** Execução de contrato (art. 7º, II da LGPD).
- **Dados:** Nome, e-mail, telefone, endereço de entrega, produtos, quantidades.
- **Compartilhamento:** Apenas com transportadoras necessárias para entrega (dados mínimos: nome, endereço, telefone, itens do pedido).

### 4.2. Finalidade: Conta de cliente e área privada
- **Finalidade:** Permitir que o cliente crie conta, visualize pedidos e histórico.
- **Base Legal:** Consentimento do titular (art. 7º, V da LGPD).
- **Dados:** Nome, e-mail, telefone, senha (hash), perfil.
- **Compartilhamento:** Apenas com o próprio cliente.

### 4.3. Finalidade: Controle de fiado e contas a receber
- **Finalidade:** Registro de vendas fiadas, controle de pagamentos, emissões de lembretes.
- **Base Legal:** Legítimo interesse da titularidade (art. 7º, IX da LGPD) - para a gestão financeira da loja familiar.
- **Dados:** Dados do cliente, valores de vendas, datas de vencimento, histórico de pagamentos.
- **Compartilhamento:** Apenas com a proprietária da loja. Nunca divulgado a terceiros, exceto quando exigido por autoridade competente.

### 4.4. Finalidade: Comunicação com o cliente
- **Finalidade:** Enviar atualizações de pedido, notificações de pagamento, comunicações comerciais.
- **Base Legal:** Consentimento do titular (art. 7º, V da LGPD) e cumprimento de obrigação legal (art. 7º, II).
- **Dados:** E-mail, telefone.
- **Compartilhamento:** Apenas com a proprietária da loja.

### 4.5. Finalidade: Melhoria da experiência do usuário
- **Finalidade:** Análises de desempenho do site, testes A/B, melhoria de usabilidade.
- **Base Legal:** Consentimento do titular (art. 7º, V da LGPD) - após exibir o aviso de cookies.
- **Dados:** Dados de navegação, cookies.
- **Compartilhamento:** Anonimizados, nunca identificam indivíduos.

## 5. Compartilhamento com Fornecedores

- **Transportadoras:** Recebemos o nome do destinatário, endereço e telefone exclusivamente para entrega de pedidos. Exigimos que tais dados sejam utilizados apenas para este fim.
- **Fornecedores de pagamento:** Integrações com plataformas de pagamento (quando configuradas) recebem apenas os dados mínimos necessários para processamento de transação, nunca dados sensíveis.
- **Autoridades competentes:** Quando exigido por ordem judicial ou regulatória, respeitando os limites da lei.

## 6. Armazenamento e Segurança

- **Locais de armazenamento:** Banco de dados Supabase (PostgreSQL) com criptografia em repouso.
- **Prazos de retenção:**
  - Dados de cliente: Enquanto o cliente for ativo ou até solicitar exclusão/anonimização.
  - Dados de pedidos: Pelo menos 5 anos para fins fiscais e contábeis, conforme legislação brasileira.
  - Dados de fiado/pagamentos: Pelo menos 5 anos para fins de controle financeiro e eventual disputa.
  - Logs de acesso: 6 meses.
- **Segurança:** Utilizamos criptografia TLS/HTTPS para transmissão de dados, senhas armazenadas com hash (bcrypt/argon2), RLS (Row Level Security) no banco de dados para isolamento de dados entre usuários, e auditoria de acessos.

## 7. Direitos dos Titulares

O titular de dados pode exercer os seguintes direitos conforme a LGPD:

### 7.1. Confirmação da existência de tratamento
Solicitar confirmação de que seus dados estão sendo tratados.

### 7.2. Acesso aos dados
Solicitar a visualização de todos os dados pessoais que temos sobre você.

### 7.3. Correção de dados
Solicitar a correção de dados incompletos, inexatos ou desatualizados.

### 7.4. Anonimização, bloqueio ou eliminação
Solicitar a eliminação de dados pessoais tratados com o seu consentimento, exceto quando:
- Necessário para cumprimento de obrigação legal ou regulatória;
- Necessário para a execução de política pública;
- Necessário para a vida ou integridade física do titular;
- Necessário para a regularidade de procedimentos em processos judiciais.

### 7.5. Portabilidade de dados
Receber seus dados em formato estruturado e legível para transferência a outro fornecedor de serviço, quando o tratamento basear-se no consentimento ou execução de contrato.

### 7.6. Oposição
Oposição ao tratamento de dados quando baseado em legítimo interesse, caso em que deixaremos de tratar os dados exceto por razões legítimas e protegentes.

### 7.7. Revogação do consentimento
Quando o tratamento basear-se em consentimento, retirar o consentimento a qualquer momento, sem afetar a licitude do tratamento baseado no consentimento anterior.

## 8. Como Exercer Seus Direitos

Para exercer quaisquer dos direitos acima, entre em contato conosco através:

- **E-mail:** [E-MAIL DE CONTATO]
- **Assunto:** "Exercício de Direitos LGPD - [Seu Nome]"

Responderemos em até 15 (quinze) dias úteis. Se não tivermos como atender sua solicitação dentro desse prazo, informaremos os motivos e o prazo estimado.

## 9. Transferência Internacional de Dados

Não realizamos transferência internacional de dados pessoais. Todos os dados são armazenados em banco de dados na região de escolha do cliente (pode ser configurado no Supabase). Caso venha a ser necessária transferência internacional no futuro, seremos transparentes sobre os dados transferidos, o país de destino e as salvaguardas adotadas.

## 10. Atualizações da Política

Esta política pode ser atualizada periodicamente. Qualquer alteração será publicada nesta página com a nova data de "Versão". Recomendamos que consulte esta política periodicamente. Para mudanças significativas, poderemos enviar uma notificação para o e-mail cadastrado.

## 11. Procedimentos para Reclamações

Se o titular considerar que seus direitos foram violados, pode:
1. Entrar em contato conosco para tentativa de resolução;
2. Registrar reclamação na Autoridade Nacional de Proteção de Dados (ANPD) - www.gov.br/anpd;
3. Buscar orientação jurídica particular.

---

*Esta política foi gerada como modelo inicial sujeito à revisão jurídica conforme a atividade real da loja. Campos em [COLCHETES] devem ser preenchidos antes da publicação definitiva.*