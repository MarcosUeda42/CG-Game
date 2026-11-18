# Jogo desenvolvido com conceitos de Computação Gráfica

Projeto desenvolvido para a disciplina de Computação Gráfica.

## Equipe

**Docente**
- Ana Luisa Dine Martins Lemos

**Alunos**
- Davi Torres
- Erik dos Santos Reis
- Felipe Tashiro
- Guilherme Samuel dos Santos
- Marcos Ueda

## Sobre o jogo

O projeto consiste em um jogo 3D inspirado no gênero **Bullet Heaven / arcade**, desenvolvido em JavaScript utilizando **Three.js** para renderização gráfica no navegador.

O objetivo do jogador é sobreviver enquanto enfrenta inimigos que surgem continuamente pela arena.

Os inimigos perseguem o jogador e também podem realizar ataques à distância através de projéteis.

Ao derrotar inimigos, o jogador recebe pontos. A pontuação obtida ao final da partida é armazenada no histórico da sessão.

## Como jogar

O jogo pode ser executado diretamente pelo navegador através do GitHub Pages:

https://marcosueda42.github.io/CG-Game/

### Controles

- `W`, `A`, `S`, `D` — movimentação do personagem;
- `Mouse 1` — ataque corpo a corpo;
- `Botão do meio do mouse` — correr;
- `Q` / `E` — rotacionar a câmera;
- `C` — alternar entre os modos de câmera;
- `Esc` — pausar o jogo.

## Objetivo

O jogador deve derrotar inimigos e sobreviver pelo maior tempo possível.

## Estado atual do projeto

Atualmente estão implementados:

- Cena 3D utilizando Three.js;
- câmera em perspectiva;
- câmera acompanhando o jogador;
- dois modos de câmera;
- rotação orbital da câmera;
- movimentação do jogador;
- corrida;
- personagem principal 3D animado;
- animações de Idle, Walk, Run, Attack, Damage e Death;
- sistema de ataque corpo a corpo;
- sequência de ataques;
- hitbox de ataque;
- possibilidade de um ataque atingir múltiplos inimigos;
- barra de vida do jogador;
- sistema de dano e morte do jogador;
- knockback;
- geração contínua de inimigos;
- múltiplos inimigos simultâneos;
- inimigos com barra de vida;
- animações de movimentação, dano, ataque e morte dos inimigos;
- perseguição do jogador pelos inimigos;
- ataques à distância realizados pelos inimigos;
- projéteis;
- colisão entre projéteis e jogador;
- sistema de pontuação;
- histórico de pontuações da sessão;
- tela inicial;
- menu de pausa;
- opção de reiniciar a partida;
- tela de Game Over;
- terreno texturizado;
- árvores;
- pedras;
- grama;
- tochas;
- iluminação ambiente;
- iluminação da lua;
- iluminação pontual das tochas;
- paredes delimitando a arena;
- colisão entre jogador e paredes.

## Estrutura do projeto

O código foi dividido em módulos com responsabilidades específicas.

```text
CG-Game/
├── main.js
├── cenario.js
├── personagem.js
├── inimigo.js
├── gerador_inimigo.js
├── projetil.js
├── camera.js
├── controles.js
├── renderer.js
├── ui.js
├── pontuacao.js
├── historico_pontuacao.js
├── index.html
├── styles.css
├── personagem/
├── inimigo/
├── objetos/
├── texturas/
└── fontes/
```

## Modelos e assets

### Personagem principal

Modelo e animações obtidos através do Mixamo.

Fonte:  
https://www.mixamo.com/

### Inimigo

Modelo e animações obtidos através do Mixamo.

Fonte:  
https://www.mixamo.com/

### Rochas

Fonte:  
https://poly.pizza/m/OQvi8PIZ40

### Árvores

Fonte:  
https://poly.pizza/m/s6yZuyU2y5

### Grama

Fonte:  
https://poly.pizza/m/vUJjrRsFp4

### Tochas

Fonte:  
https://poly.pizza/m/pNsfJzhXiD

## Execução local para desenvolvimento

Para modificar ou testar o projeto localmente, clone o repositório:

```bash
git clone https://github.com/MarcosUeda42/CG-Game.git
```

Depois abra a pasta utilizando um servidor local, como a extensão **Live Server** do Visual Studio Code.

## Próximas etapas

Entre as possíveis evoluções do projeto estão:

- sistema de ondas;
- progressão de dificuldade;
- diferentes tipos de inimigos;
- inimigos especiais;
- recompensas e evolução do personagem;
- melhorias no sistema de pontuação;
- ranking persistente utilizando armazenamento local;
- registro de informações adicionais das partidas;
- efeitos visuais e sonoros;
- otimização para maiores quantidades de inimigos e projéteis.