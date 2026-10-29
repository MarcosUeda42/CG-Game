# Jogo desenvolvido com conceitos de computação gráfica #
- Docente:
  - Ana Luisa Dine Martins Lemos
- Alunos:
  - Davi Torres
  - Erik dos Santos Reis
  - Felipe Tashiro
  - Guilherme Samuel dos Santos
  - Marcos Ueda
  

## Jogo que será desenvolvido
> Bullet Heaven (shoot ‘em up) estilo jogo arcade, com hordas de inimigos.

## Descrição do jogo (personagens, jogabilidade, objetivo)
> O objetivo principal é sobreviver ao máximo de hordas/ondas possíveis de inimigos. A cada nova onda, a quantidade, a velocidade e a variedade dos inimigos aumentam, exigindo que o jogador se posicione melhor e tome decisões rápidas. A pontuação é baseada no tempo de sobrevivência, nos inimigos eliminados e na onda alcançada, e fica registrada em um ranking local, incentivando o jogador a tentar novamente e superar seu recorde.

## Os personagens são:
- Jogador: o herói deste universo.
- Inimigos comuns: unidades pequenas e numerosas que perseguem o jogador em linha reta.
- Inimigos especiais: variantes mais rápidas, mais resistentes ou que disparam projéteis.

## Funcionamento da jogabilidade
> O controle é feito por meio de movimentação nas quatro direções em terceira pessoa. O jogador poderá coletar recompensas pelo mapa para evoluir o personagem. Além disso, também possui uma barra de vida. Se algum inimigo entrar em colisão, perde um pouco da barra de vida, e o jogo termina quando ela zera.

## Ideias iniciais das estratégias que se pretende utilizar
- Progressão de dificuldade gradual;
- Sistema de recompensas e evolução;
- Ciclo de jogo curto (inspirado em arcade);
- Feedback visual e sonoro;
- Uso de assets (modelos 3D) simples ou gratuitos para otimizar o tempo de desenvolvimento;
- Separar o código em partes independentes (jogador, inimigos, projéteis, sistema de ondas, interface) usando POO, similar visto em atividades apresentadas em sala;
- Spawn de inimigos por regras e fórmulas de dificuldade, em vez de ondas totalmente fixas;
- Controle e otimização de spawn na criação de projéteis, para não deixar o jogo travado.

## Estado atual do projeto

Atualmente já foram implementados:

- Cena 3D utilizando Three.js;
- Câmera com projeção perspectiva;
- Movimentação orbital da câmera pelas setas do teclado;
- Terreno;
- Iluminação ambiente e pontual;
- Personagem principal 3D animado;
- Inimigo 3D animado;
- Árvores e formações rochosas no cenário;
- Posicionamento, escala e rotação dos elementos da cena.

## Modelos e animações utilizados

### Personagem principal
- Paladin W;
- Animação Crouched Walking.

Fonte:  
https://www.mixamo.com/

### Inimigo
- Maynard;
- Animação Magic Attack 01.

Fonte:  
https://www.mixamo.com/

### Rochas
Fonte:  
https://poly.pizza/m/OQvi8PIZ40

### Árvores
Fonte:  
https://poly.pizza/m/s6yZuyU2y5

## Controles atuais

- `←` movimenta a câmera para a esquerda;
- `→` movimenta a câmera para a direita.

## Como executar

1. Clone o repositório:

```bash
git clone https://github.com/MarcosUeda42/CG-Game.git
```

2. Entre na pasta do projeto.

3. Abra o arquivo `index.html` utilizando um servidor local, como **Live Server**.

## O que ainda falta implementar

Entre os principais elementos previstos estão:

- Movimentação do jogador;
- Câmera acompanhando o jogador;
- Sistema de disparos e projéteis;
- Comportamento dos inimigos;
- Sistema de hordas;
- Colisões;
- Barra de vida e dano;
- Pontuação;
- Recompensas e evolução;
- Inimigos especiais;
- Múltiplas posições de câmera;
- Texturas adicionais;
- Efeitos visuais e sonoros;
- Condição de derrota;
- Ranking local;
- Otimizações para grandes quantidades de inimigos e projéteis.
