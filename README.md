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