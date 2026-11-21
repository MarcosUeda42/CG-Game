import * as THREE from "three";
import Cenario from "./cenario.js";
import Personagem from "./personagem.js";
import Camera from "./camera.js";
import Controles from "./controles.js";
import Renderer from "./renderer.js";
import GeradorInimigo from "./gerador_inimigo.js";
import UI from "./ui.js";
import Pontuacao from "./pontuacao.js";
import HistoricoPontuacao from "./historico_pontuacao.js";
import { StrengthPowerUp, HealthPowerUp } from "./powerup.js";
import { POWERUP_CONFIG, PROJECTILE_CONFIG } from "./config.js";

// Inicialização das classes e loop de animação
// Personagem importado do MIXAMO Paladin W + Crouched Walking https://www.mixamo.com/#/
// Inimigo Maynard + Magic Attack 01 (não é mais usado)
class Jogo {
  constructor(historico) {
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

    this.pontuacao = new Pontuacao();
    this.ui.updateScore(this.pontuacao.getValor());
    this.historico = historico;
    this.pontuacaoRegistrada = false;

    this.geradorInimigo = new GeradorInimigo(
      this.scene,
      (pontos, inimigo) => {
        const novoValor = this.pontuacao.adicionar(pontos);
        this.ui.updateScore(novoValor);

        this.tentarDroparPowerUp(inimigo);
      },
    );
    this.clock = new THREE.Clock();
    this.projeteis = [];

    this.gameOver = false;
    this.pausado = false;
    this.gameOverEl = document.getElementById("game-over");

    this.powerups = [
      new HealthPowerUp(
        this.scene,
        new THREE.Vector3(-2, 1.7, 3),
        POWERUP_CONFIG.health.cura,
      ),
      new StrengthPowerUp(
        this.scene,
        new THREE.Vector3(2, 1.5, 3),
        POWERUP_CONFIG.strength.multiplicador,
        POWERUP_CONFIG.strength.duracao,
      ),
    ];
  }
  tentarDroparPowerUp(inimigo) {
    if (!inimigo || Math.random() >= POWERUP_CONFIG.chanceDrop) return;

    const posicao = inimigo.getPosition();

    if (Math.random() < POWERUP_CONFIG.chanceHealth) {
      posicao.y = 1.7;

      this.powerups.push(
        new HealthPowerUp(this.scene, posicao, POWERUP_CONFIG.health.cura),
      );

      return;
    }

    posicao.y = 1.5;

    this.powerups.push(
      new StrengthPowerUp(
        this.scene,
        posicao,
        POWERUP_CONFIG.strength.multiplicador,
        POWERUP_CONFIG.strength.duracao,
      ),
    );
  }
  configurarGameOver() {
    document
      .getElementById("restart-death-button")
      .addEventListener("click", () => {
        sessionStorage.setItem("reiniciar", "1");
        window.location.reload();
      });

    document
      .getElementById("gameover-quit-button")
      .addEventListener("click", () => window.location.reload());
  }
  configurarRestart() {
    document.getElementById("restart-button").addEventListener("click", () => {
      sessionStorage.setItem("reiniciar", "1");
      window.location.reload();
    });
  }
  mostrarGameOver() {
    this.camera.modo = 1;
    this.gameOver = true;
    this.controles.liberarMouse();

    const pontosFinais = this.pontuacao.getValor();

    if (!this.pontuacaoRegistrada) {
      this.historico.registrar(pontosFinais);
      this.pontuacaoRegistrada = true;
    }

    document.getElementById("game-over-pontuacao").textContent =
      `Pontuação final: ${pontosFinais}`;

    this.gameOverEl.classList.add("visivel");
    document.getElementById("stamina-bar").classList.add("hidden");
    document.getElementById("health-bar").classList.add("hidden");
    document.getElementById("buff-forca").classList.add("hidden");
    document.getElementById("score").classList.add("hidden");
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
    this.configurarRestart();
    this.controles.capturarMouse();
  }
  configurarPausa() {
    const pauseMenu = document.getElementById("pause-menu");
    const resumeButton = document.getElementById("resume-button");
    const quitButton = document.getElementById("quit-button");
    const canvas = this.renderer.getDOMElement();

    const pausar = () => {
      if (this.gameOver || this.pausado) return;

      this.pausado = true;
      pauseMenu.classList.remove("hidden");
    };

    const tentarRetomar = () => {
      if (this.gameOver || !this.pausado) return;

      this.controles.capturarMouse();
    };

    document.addEventListener("pointerlockchange", () => {
      const mouseCapturado = document.pointerLockElement === canvas;

      if (!mouseCapturado) {
        if (!this.gameOver) {
          pausar();
        }
      } else {
        if (this.pausado && !this.gameOver) {
          this.pausado = false;
          pauseMenu.classList.add("hidden");
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      const titleScreen = document.getElementById("title-screen");
      const jogoRodando = titleScreen.classList.contains("hidden");

      if (!jogoRodando || this.gameOver) return;

      if (e.code === "Escape" && this.pausado) {
        tentarRetomar();
      }
    });

    resumeButton.addEventListener("click", () => {
      tentarRetomar();
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

    const movimentoMouse = this.controles.consumirMovimentoMouse();

    if (!this.gameOver) {
      this.camera.moverComMouse(movimentoMouse.x, movimentoMouse.y);
    }

    if (this.controles.teclas["KeyQ"] && !this.gameOver)
      this.camera.orbitarDireita(this.personagem.getPosition());
    else if (this.controles.teclas["KeyE"] && !this.gameOver)
      this.camera.orbitarEsquerda(this.personagem.getPosition());
    const deltaRoda = this.controles.consumirDeltaRoda();

    if (deltaRoda !== 0 && !this.gameOver) {
      this.camera.ajustarZoom(deltaRoda);
    }

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

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.atualizar(delta);

      if (p.verificarColeta(this.personagem)) {
        this.powerups.splice(i, 1);
      }
    }

    for (let i = this.projeteis.length - 1; i >= 0; i--) {
      const p = this.projeteis[i];
      p.atualizar(delta);

      if (this.personagem.bloquear(p.hitbox)) {
        p.destruir();
        this.projeteis.splice(i, 1);
        continue;
      }

      if (p.hitbox.intersectsBox(this.personagem.hitbox)) {
        this.personagem.dano(PROJECTILE_CONFIG.dano, p);
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
    this.ui.updatePlayerStamina();
    this.ui.updateBuffForca();
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
  const score = document.getElementById("score");
  const staminaBar = document.getElementById("stamina-bar");
  const historyButton = document.getElementById("history-button");
  const historyScreen = document.getElementById("history-screen");
  const historyList = document.getElementById("history-list");
  const historyBackButton = document.getElementById("history-back-button");
  const historico = new HistoricoPontuacao();

  const renderizarHistorico = () => {
    const registros = historico.getRegistros().reverse();

    historyList.innerHTML = "";

    if (registros.length === 0) {
      const mensagem = document.createElement("p");
      mensagem.textContent = "Nenhuma partida registrada.";
      historyList.appendChild(mensagem);
      return;
    }

    registros.forEach((registro) => {
      const item = document.createElement("div");
      item.classList.add("history-item");

      const data = new Date(registro.data).toLocaleString("pt-BR");

      item.textContent = `${registro.pontos} pontos — ${data}`;

      historyList.appendChild(item);
    });
  };

  const iniciarJogo = () => {
    titleScreen.classList.add("hidden");
    healthBar.classList.remove("hidden");
    staminaBar.classList.remove("hidden");
    score.classList.remove("hidden");

    new Jogo(historico).iniciar();
  };

  startButton.addEventListener("click", iniciarJogo);
  historyButton.addEventListener("click", () => {
    renderizarHistorico();

    titleScreen.classList.add("hidden");
    historyScreen.classList.remove("hidden");
  });

  historyBackButton.addEventListener("click", () => {
    historyScreen.classList.add("hidden");
    titleScreen.classList.remove("hidden");
  });

  if (sessionStorage.getItem("reiniciar")) {
    sessionStorage.removeItem("reiniciar");
    iniciarJogo();
  }
});
