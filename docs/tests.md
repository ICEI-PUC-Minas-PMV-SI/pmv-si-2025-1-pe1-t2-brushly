
# DOCUMENTAÇÃO DE TESTES DE SOFTWARE



## 1. Plano de Testes de Software

**Objetivo:**  
Garantir que as funcionalidades principais da aplicação estejam funcionando conforme os requisitos especificados, identificando erros e inconsistências antes da entrega final.

**Escopo:**  
Serão testadas funcionalidades de upload, edição, visualização e download de imagens. A responsividade e a compatibilidade com diferentes dispositivos também serão verificadas.

**Tipos de Teste a serem realizados:**

- Testes Funcionais
- Testes de Regressão
- Testes de Interface
- Testes de Usabilidade (em seção separada)
- Testes em diferentes navegadores

**Ambiente de Teste:**

| Item                  | Especificação                     |
|-----------------------|-----------------------------------|
| Navegadores           | Chrome e Edge             |
| Sistemas Operacionais | Windows 10 e 11.|
| Dispositivos          | Desktop e Notebook     |



## 2. Registro dos Testes de Software

| ID | Funcionalidade         | Descrição do Teste                           | Resultado Esperado                      | Status |
|----|------------------------|----------------------------------------------|-----------------------------------------|--------|
| T01| Upload de Imagem       | Enviar `.jpg` e `.png` válido                         | Imagem carregada com sucesso            | ✅     |
| T02| Corte de Imagem        | Cortar uma área selecionada                  | Imagem cortada corretamente             | ✅     |
| T03| Download               | Baixar imagem após edição                    | Imagem salva localmente                 | ✅     |
| T04| Navegador Diferente    | Testar no Chrome e Edge                            | Funcionalidade preservada               | ✅     |



##3. Avaliação dos Testes de Software

**Resumo:**  
Todos os testes funcionais e de regressão foram concluídos com sucesso. O sistema apresenta estabilidade e comportamentos esperados nas funcionalidades principais.

**Observações:**

- Nenhum erro crítico foi encontrado.
- Tempo médio de resposta(sem travamentos): satisfatório.



## 4. Cenários de Teste de Usabilidade

| Cenário | Descrição                                               | Expectativa do Usuário                     |
|---------|---------------------------------------------------------|--------------------------------------------|
| C01     | Usuário encontra o botão de upload facilmente           | Localização intuitiva e rótulo claro       |
| C02     | Usuário edita imagem sem instruções(todas as edições disponíveis atualmente)                   | Interface deve ser autoexplicativa         |
| C03     | Usuário entende o ícone de download                     | Ícone deve ser reconhecível                |
| C04     | Retorno visual após edição                              | Mudança visível imediatamente após ação    |



## 5. Registro dos Testes de Usabilidade

| Cenário | Método         | Participantes | Resultado                          | 
|---------|----------------|---------------|------------------------------------|
| C01     | Teste Livre   | 3 usuários    | Todos localizaram o botão          |
| C02     | Teste Livre    | 2 usuários    | Todos localizaram e ententederam do que se tratava   |
| C03     | Teste Livre    | 2 usuários    | Todos localizaram e ententederam do que se tratava   |
| C04     | Teste Livre    | 2 usuários    | Todos visualizaram claramente as mudanças   |




## 6. Avaliação dos Testes de Usabilidade

**Conclusão Geral:**

- A aplicação é, em geral, bem recebida pelos usuários.
- Pontos fortes: clareza visual, layout limpo, boa performance.
  

**Pontuação média (em escala de 1 a 5):**

| Critério               | Nota Média |
|------------------------|------------|
| Facilidade de uso      | 4.6        |
| Clareza visual         | 4.7        |
| Velocidade de resposta | 4.5        |
| Satisfação geral       | 4.8        |
|Média Geral | 4,65|
---
