import * as THREE from "three";
import Cenario from "./cenario.js";
import Personagem from "./personagem.js";
import Camera from "./camera.js";
import Controles from "./controles.js";
import Renderer from "./renderer.js";
import GeradorInimigo from "./gerador_inimigo.js";
import UI from "./ui.js";

// Inicialização das classes e loop de animação
// Personagem importado do MIXAMO Paladin W + Crouched Walking https://www.mixamo.com/#/
// Inimigo Maynard + Magic Attack 01 (não é mais usado)
class Jogo {
  constructor() {
    // inicializa a cena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("midnightblue");

    // inicializa a camera e renderizador
    this.camera = new Camera();
    this.renderer = new Renderer();

    // inicializa o cenario
    this.cenario = new Cenario(this.scene);

    // inicializa os controles
    this.controles = new Controles(this.renderer.getDOMElement());

    // inicializa o personagem
    this.personagem = new Personagem(
      "./personagem/model.glb",
      this.scene,
      this.controles,
      this.cenario,
    );
    this.ui = new UI(this.personagem);

    this.geradorInimigo = new GeradorInimigo(this.scene);
    this.clock = new THREE.Clock();
    this.projeteis = [];

    this.gameOver = false;
    this.gameOverEl = document.getElementById("game-over");
  }
  configurarGameOver() {
    document.getElementById("restart-button").addEventListener("click", () => {
      sessionStorage.setItem("reiniciar", "1");
      window.location.reload();
    });

    document
      .getElementById("gameover-quit-button")
      .addEventListener("click", () => window.location.reload());
  }

  mostrarGameOver() {
    this.camera.modo = 1;
    this.gameOver = true;
    this.gameOverEl.classList.add("visivel");
    document.getElementById("health-bar").classList.add("hidden");
    this.removerInimigos();
  }

  atualizarSpotGameOver() {
    const p = this.personagem.getPosition().clone();
    p.y += 0.9;
    p.project(this.camera.camera);

    const x = (p.x * 0.5 + 0.5) * 100;
    const y = (-p.y * 0.5 + 0.5) * 100;
    this.gameOverEl.style.setProperty("--x", `${x}%`);
    this.gameOverEl.style.setProperty("--y", `${y}%`);
  }

  iniciar() {
    this.cenario.renderizar();
    this.personagem.carregar();
    this.animar();
    this.configurarPausa();
    this.configurarGameOver();
  }

  configurarPausa() {
    const pauseMenu = document.getElementById("pause-menu");
    const resumeButton = document.getElementById("resume-button");
    const quitButton = document.getElementById("quit-button");

    const alternarPausa = () => {
      this.pausado = !this.pausado;
      if (this.pausado) {
        pauseMenu.classList.remove("hidden");
      } else {
        pauseMenu.classList.add("hidden");
      }
    };

    window.addEventListener("keydown", (e) => {
      // Evita pausar se a tela de título ainda estiver visível (opcional)
      const titleScreen = document.getElementById("title-screen");
      const jogoRodando = titleScreen.classList.contains("hidden");

      if (jogoRodando && !this.gameOver && e.code === "Escape") {
        alternarPausa();
      }
    });

    resumeButton.addEventListener("click", () => {
      alternarPausa();
    });

    quitButton.addEventListener("click", () => {
      window.location.reload();
    });
  }

  animar = () => {
    requestAnimationFrame(this.animar);

    if (this.pausado) {
      this.clock.getDelta();
      return;
    }

    const delta = this.clock.getDelta();

    if (this.controles.teclas["KeyQ"] && !this.gameOver)
      this.camera.orbitarEsquerda(this.personagem.getPosition());
    else if (this.controles.teclas["KeyE"] && !this.gameOver)
      this.camera.orbitarDireita(this.personagem.getPosition());

    if (this.controles.teclas["KeyC"] && !this.gameOver) {
      this.camera.modo = (this.camera.modo + 1) % 2;
      this.controles.teclas["KeyC"] = false;
    }

    this.personagem.atualizar(this.camera);
    if (this.personagem.morto && !this.gameOver) this.mostrarGameOver();

    if (!this.gameOver) {
      this.geradorInimigo.atualizar(
        delta,
        this.personagem.getPosition(),
        this.projeteis,
      );
    }

    for (const inimigo of this.geradorInimigo.inimigos)
      this.personagem.verificarAcerto(inimigo, this.scene);

    for (let i = this.projeteis.length - 1; i >= 0; i--) {
      const p = this.projeteis[i];
      p.atualizar(delta);

      if (p.hitbox.intersectsBox(this.personagem.hitbox)) {
        this.personagem.dano(10, p);
        p.destruir();
        this.projeteis.splice(i, 1);
        continue;
      }
      if (!p.ativo) this.projeteis.splice(i, 1);
    }

    this.camera.atualizarPosicao(this.personagem.getPosition());
    this.renderer.draw(this.scene, this.camera.camera);
    if (this.gameOver) this.atualizarSpotGameOver();
    this.ui.updatePlayerHealth();
  };

  removerInimigos() {
    this.geradorInimigo.removerTodos();

    for (const p of this.projeteis) p.destruir();
    this.projeteis.length = 0;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("start-button");
  const titleScreen = document.getElementById("title-screen");
  const healthBar = document.getElementById("health-bar");

  const iniciarJogo = () => {
    titleScreen.classList.add("hidden");
    healthBar.classList.remove("hidden");
    new Jogo().iniciar();
  };

  startButton.addEventListener("click", iniciarJogo);

  if (sessionStorage.getItem("reiniciar")) {
    sessionStorage.removeItem("reiniciar");
    iniciarJogo();
  }
});
