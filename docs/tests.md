
# DOCUMENTAÇÃO DE TESTES DE SOFTWARE


## 1. Plano de Testes de Software

**Objetivo:**  
Garantir que as funcionalidades principais da aplicação estejam funcionando conforme os requisitos especificados, identificando erros e inconsistências antes da entrega final.

**Tipos de Teste a serem realizados:**

- Testes Funcionais
- Testes de Regressão
- Testes de Interface
- Testes de Usabilidade (em seção separada)
- Testes em diferentes navegadores

**Ambiente de Teste:**

| Item                  | Especificação                     |
|-----------------------|-----------------------------------|
| Navegadores           | Chrome, Firefox, Edge e Safari            |
| Sistemas Operacionais | Windows 11, MacOs e Android |
| Dispositivos          | Desktop, Notebook, Smartphone     |


##  2. Registro dos Testes de Software

| ID | Funcionalidade         | Descrição do Teste                           | Resultado Esperado                      | Status |
|----|------------------------|----------------------------------------------|-----------------------------------------|--------|
| T01| Upload de Imagem       | Enviar `.jpg`, `.png` e `.webp` válido                         | Imagem carregada com sucesso            | OK     |
| T02| Edição de Imagem        | Cortar, alterar brilho, aplicar filtro ou usar pincel na imagem | Imagem alterada corretamente             | OK     |
| T03| Download               | Baixar imagem após edição                    | Imagem salva localmente                 | OK     |
| T04| Responsividade         | Acessar no celular                           | Layout adaptado corretamente            | OK     |
| T05| Navegadores usuais    | Testar no Firefox, chrome, edge e safari                         | Funcionalidade preservada               | OK      |



## 3. Avaliação dos Testes de Software

**Resumo:**  
Todos os testes funcionais e de regressão foram concluídos com sucesso. O sistema apresenta estabilidade e comportamentos esperados nas funcionalidades principais.


## 4. Cenários de Teste de Usabilidade

| Cenário | Descrição                                               | Expectativa do Usuário                     |
|---------|---------------------------------------------------------|--------------------------------------------|
| C01     | Usuário encontra o botão de upload facilmente           | Localização intuitiva e rótulo claro       |
| C02     | Usuário edita imagem sem instruções                     | Interface deve ser autoexplicativa         |
| C03     | Usuário entende o ícone de download                     | Ícone deve ser reconhecível                |
| C04     | Experiência em celular                                  | Interface adaptada e fácil navegação       |
| C05     | Retorno visual após edição                              | Mudança visível imediatamente após ação    |


## 5. Registro dos Testes de Usabilidade

| Cenário | Método         | Participantes | Resultado                          |
|---------|----------------|---------------|------------------------------------|
| C01     | Teste Guiado   | 2 usuários    | Todos localizaram o botão          |
| C02     | Teste Livre    | 3 usuários    | Todos fizeram exatamente o que quisera  |
| C03     | Entrevista     | 3 usuários    | Reconheceram o ícone de download   |
| C04     | Teste em Mobile| 3 usuários    | Navegação fluida                   |


## 6. Avaliação dos Testes de Usabilidade

**Conclusão Geral:**

- A aplicação é, em geral, bem recebida pelos usuários.
- Pontos fortes: clareza visual, layout limpo, boa performance.







