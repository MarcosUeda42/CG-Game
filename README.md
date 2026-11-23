# Jogo desenvolvido com conceitos de Computação Gráfica

Projeto desenvolvido para a disciplina de **Computação Gráfica**.

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

O projeto consiste em um jogo 3D, desenvolvido em JavaScript utilizando **Three.js** para renderização gráfica no navegador.

O objetivo do jogador é sobreviver pelo maior tempo possível enquanto enfrenta inimigos que surgem continuamente pela arena e aumentam gradualmente em quantidade ao longo da partida.

Atualmente existem dois tipos principais de inimigos:

- **Mago** — persegue o jogador e realiza ataques à distância através de projéteis;
- **Orc / Tank** — inimigo mais resistente que persegue o jogador e realiza ataques corpo a corpo.

O jogador possui um combo de ataques com espada, corrida baseada em stamina e sistema de defesa com escudo.

Ao derrotar inimigos, o jogador recebe pontos e pode obter power-ups temporários.

A partida também possui um sistema progressivo de **Rounds**, que aumenta gradualmente a quantidade máxima de inimigos presentes na arena.

## Como jogar

O jogo pode ser executado diretamente pelo navegador através do GitHub Pages:

https://marcosueda42.github.io/CG-Game/

### Controles

- `W`, `A`, `S`, `D` — movimentação do personagem;
- `Mouse 1` — ataque corpo a corpo;
- `Mouse 2` — defender com o escudo;
- `Shift` — correr;
- `Scroll` — zoom;
- `Q` / `E` — rotacionar a câmera;
- `C` — alternar entre os modos de câmera;
- `Esc` — pausar o jogo.

## Objetivo

O jogador deve derrotar inimigos, acumular pontos e sobreviver pelo maior tempo possível conforme a dificuldade aumenta ao longo dos Rounds.

## Estado atual do projeto

Atualmente estão implementados:

- cena 3D utilizando Three.js;
- câmera em perspectiva acompanhando o jogador;
- dois modos de câmera;
- rotação orbital da câmera;
- movimentação e corrida do jogador;
- sistema de stamina;
- personagem principal 3D animado;
- combo de ataques corpo a corpo;
- sistema de defesa com escudo;
- hitboxes de ataque, defesa e inimigos;
- sistema de dano, morte e knockback;
- Magos com ataques à distância;
- Orcs / Tanks com ataques corpo a corpo;
- geração independente de diferentes tipos de inimigos;
- múltiplos inimigos simultâneos;
- sistema progressivo de Rounds;
- aumento gradual do limite de inimigos;
- projéteis;
- barras de vida;
- Health Power-Up;
- Strength Power-Up;
- drops de power-ups;
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
- iluminação;
- paredes delimitando a arena;
- colisão entre jogador e paredes;
- valores de balanceamento centralizados em `config.js`;
- otimizações para múltiplos inimigos, partículas e projéteis.

## Estrutura do projeto

O código foi dividido em módulos com responsabilidades específicas.

```text
CG-Game/
├── main.js
├── config.js
├── cenario.js
├── personagem.js
├── inimigo.js
├── inimigo_tank.js
├── gerador_inimigo.js
├── projetil.js
├── particulas.js
├── powerup.js
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
├── tank/
├── objetos/
├── texturas/
└── fontes/
```

## Modelos e assets

### Personagem principal

Modelo e animações obtidos através do Mixamo.

Fonte:  
https://www.mixamo.com/

### Mago

Modelo e animações obtidos através do Mixamo.

Fonte:  
https://www.mixamo.com/

### Orc / Tank

Modelo **Low Poly Orc**, disponibilizado no Sketchfab sob licença Creative Commons Attribution.

Fonte:  
https://sketchfab.com/3d-models/low-poly-orc-62f1637181cb4f6aa38897f5b7ab5edf

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


- sistema de experiência e níveis e upgrades do personagem;
- novos power-ups move speed e atk speed;
- refinamentos no combate;
- adicionar ajuste de sensibilidade de câmera;
- aprimoramento do cenário e colisões;
- melhorias no histórico de partidas;
- efeitos visuais e sonoros;
- balanceamento e polimento geral;
- otimizações adicionais conforme necessário.