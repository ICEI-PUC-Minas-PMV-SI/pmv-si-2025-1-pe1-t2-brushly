# Especificações do Projeto

Este documento apresenta as diretrizes e requisitos para o desenvolvimento de um editor de imagens web, destacando as necessidades dos usuários e as funcionalidades esperadas. A especificação inclui a definição de personas, histórias de usuário, requisitos funcionais e não funcionais, além das restrições do projeto.

## Personas

João, o Estudante Universitário
- Idade: 21 anos
- Profissão: Estudante de engenharia da computação
- Habilidades com tecnologia: Alta, mas sem experiência com ferramentas profissionais de edição de imagem
- Necessidades: Precisa editar imagens para apresentações acadêmicas e projetos universitários, como pôsteres e relatórios. Busca uma ferramenta intuitiva e acessível, já que não tem condições de pagar por softwares avançados.
- Desafios: Enfrenta prazos curtos e precisa de uma solução rápida para ajustes básicos, como redimensionamento, corte e anotações sobre imagens.
- Expectativas: Interface minimalista e sem curva de aprendizado complexa. Ferramentas rápidas de uso intuitivo.

Maria, a Empreendedora
- Idade: 34 anos
- Profissão: Proprietária de uma loja de roupas online
- Habilidades com tecnologia: Média, utiliza redes sociais e aplicativos de design simplificados
- Necessidades: Precisa criar conteúdos visuais para redes sociais e promoções. Busca um editor que permita aplicar filtros, adicionar textos e personalizar imagens rapidamente.
- Desafios: Não tem tempo para aprender ferramentas complexas e precisa de templates e recursos pré-configurados para agilizar suas postagens.
- Expectativas: Ferramentas rápidas e intuitivas com templates prontos. Possibilidade de salvar presets para reutilização.

Carlos, o Designer Iniciante
- Idade: 26 anos
- Profissão: Estudante de design gráfico
- Habilidades com tecnologia: Média a alta, já experimentou softwares de edição, mas ainda está aprendendo técnicas avançadas
- Necessidades: Quer um editor onde possa praticar ajustes de brilho, contraste, saturação e experimentação com camadas e filtros.
- Desafios: Busca uma interface intuitiva, mas com recursos avançados suficientes para aprender conceitos sem precisar de um software profissional pago.
- Expectativas: Ferramentas que simulem a lógica de editores profissionais sem a complexidade de uso.

Ana, a Usuária Casual
- Idade: 40 anos
- Profissão: Professora do ensino fundamental
- Habilidades com tecnologia: Baixa, utiliza apenas recursos básicos em aplicativos do dia a dia
- Necessidades: Deseja editar fotos pessoais de forma simples, sem necessidade de instalação de programas complexos. Busca funcionalidades como cortes, remoção de olhos vermelhos e filtros rápidos.
- Desafios: Não quer perder tempo aprendendo a usar a ferramenta e prefere interfaces intuitivas, com instruções visuais claras.
- Expectativas: Interface simplificada com botões autoexplicativos e tutoriais curtos.

Mário, o Criador de Conteúdo
- Idade: 29 anos
- Profissão: YouTuber e produtor de conteúdo digital
- Habilidades com tecnologia: Alta, já utiliza editores profissionais como Photoshop e Premiere
- Necessidades: Precisa de um editor rápido para ajustes finais em thumbnails e imagens para redes sociais. Valoriza ferramentas que otimizem o fluxo de trabalho e permitam personalizações avançadas.
- Desafios: Não quer perder tempo com processos demorados e busca atalhos e recursos de automação para melhorar sua produtividade.
- Expectativas: Ferramentas que permitam ajustes rápidos e reutilização de configurações.

## Histórias de Usuários

|Eu como|Preciso/Quero|Para|
|-------|-------------|----|
|João, o Estudante Universitário|Redimensionar e cortar imagens facilmente|Ajustar fotos para apresentações acadêmicas sem perder qualidade|
|Maria, a Empreendedora|Aplicar filtros e sobrepor textos nas imagens|Criar posts rápidos para redes sociais sem precisar contratar um designer|
|Carlos, o Designer Iniciante|Experimentar diferentes ajustes de brilho, contraste e saturação|Aprender conceitos básicos de edição sem precisar de softwares pagos|
|Ana, a Usuária Casual|Fazer edições rápidas sem precisar baixar programas|Ajustar fotos pessoais sem complicação e com poucos cliques|
|Mário, o Criador de Conteúdo|Ajustar rapidamente uma thumbnail já criada|Evitar retrabalho no Photoshop e agilizar o upload dos vídeos|

## Requisitos

As tabelas que se seguem apresentam os requisitos funcionais e não funcionais que detalham o escopo do projeto.

### Requisitos Funcionais

|ID|Descrição do Requisito|Prioridade|
|--|----------------------|----------|
|RF-001|Permitir upload de imagens nos formatos PNG e JPG|Alta|
|RF-002|Disponibilizar ferramentas de edição básicas (corte, redimensionamento, brilho, contraste)|Alta|
|RF-003|Oferecer sobreposição de textos personalizáveis|Média|
|RF-004|Possibilitar a exportação da imagem editada|Alta|
|RF-005|Implementar histórico de edições para desfazer alterações|Média|
|RF-006|Suporte a camadas para edição avançada|Média|
|RF-007|Aplicação de filtros como grayscale, invert, blur|Média|

### Requisitos não Funcionais

|ID|Descrição do Requisito|Prioridade|
|--|----------------------|----------|
|RNF-001|O editor deve ser responsivo e funcionar em dispositivos móveis|Alta|
|RNF-002|O tempo máximo de carregamento da aplicação não deve ultrapassar 3 segundos|Média|
|RNF-003|As edições devem ser processadas no cliente para reduzir latência|Alta|
|RNF-004|A interface deve ser intuitiva, com botões autoexplicativos|Média|
|RNF-005|O editor deve ser capaz de lidar com imagens de alta resolução sem perda de desempenho|Alta|

## Restrições

O projeto está restrito pelos itens apresentados na tabela a seguir.

|ID| Restrição                                             |
|--|-------------------------------------------------------|
|01| O projeto deverá ser entregue até o final do semestre |
|02| Não pode ser desenvolvido um módulo de backend        |
|03| Não pode utilizar APIs externas                       |

