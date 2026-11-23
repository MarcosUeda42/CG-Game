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
      (hitboxAtaque, origem, dano) => {
        if (this.personagem.bloquear(hitboxAtaque)) {
          return true;
        }

        if (!hitboxAtaque.intersectsBox(this.personagem.hitbox)) {
          return false;
        }

        this.personagem.dano(dano, origem);

        return true;
      },
      (roundAtual, roundFinal) => {
        this.mostrarAvisoRound(roundAtual, roundFinal);
      },
    );

    this.tempoDebugEstado = 0;
    this.debugEstadoJogo = document.createElement("div");
    Object.assign(this.debugEstadoJogo.style, {
      position: "fixed",
      left: "15px",
      bottom: "15px",
      zIndex: "1000",
      padding: "10px 14px",
      background: "rgba(0, 0, 0, 0.65)",
      color: "white",
      fontFamily: "monospace",
      fontSize: "14px",
      lineHeight: "1.5",
      border: "1px solid rgba(255, 255, 255, 0.4)",
      borderRadius: "4px",
      pointerEvents: "none",
      userSelect: "none",
    });
    document.body.appendChild(this.debugEstadoJogo);

    this.avisoRound = document.createElement("div");
    Object.assign(this.avisoRound.style, {
      position: "fixed",
      left: "50%",
      top: "18%",
      transform: "translateX(-50%)",
      zIndex: "1000",
      pointerEvents: "none",
      userSelect: "none",
      display: "none",
      opacity: "0",
      transition: "opacity 0.5s ease",
      color: "#ffd700",
      fontFamily: "OptimusPrinceps",
      fontSize: "clamp(2rem, 5vw, 4rem)",
      letterSpacing: "0.12em",
      textAlign: "center",
      textShadow: "0 0 20px #000, 0 0 40px #600",
    });
    document.body.appendChild(this.avisoRound);
    this.avisoRoundTimer = null;
    this.avisoRoundFimTimer = null;

    this.mostrarAvisoRound(1, this.geradorInimigo.getRoundFinal());
    this.atualizarDebugEstadoJogo();

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
  formatarTempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = Math.floor(segundos % 60);

    return (
      String(minutos).padStart(2, "0") +
      ":" +
      String(segundosRestantes).padStart(2, "0")
    );
  }
  mostrarAvisoRound(round, roundFinal) {
    if (!this.avisoRound) return;

    if (this.avisoRoundTimer) {
      clearTimeout(this.avisoRoundTimer);
    }
    if (this.avisoRoundFimTimer) {
      clearTimeout(this.avisoRoundFimTimer);
    }

    this.avisoRound.textContent =
      round >= roundFinal ? "FINAL ROUND" : `Round ${round}`;

    this.avisoRound.style.display = "block";
    this.avisoRound.style.opacity = "1";

    this.avisoRoundTimer = setTimeout(() => {
      this.avisoRound.style.opacity = "0";
      this.avisoRoundFimTimer = setTimeout(() => {
        this.avisoRound.style.display = "none";
      }, 500);
    }, 1500);
  }
  atualizarDebugEstadoJogo() {
    if (!this.debugEstadoJogo || !this.geradorInimigo) {
      return;
    }

    const round = this.geradorInimigo.getRoundAtual();

    const roundFinal = this.geradorInimigo.getRoundFinal();

    const limite = this.geradorInimigo.getLimiteTotalAtual();

    const magos = this.geradorInimigo.getQuantidadeMagos();

    const tanks = this.geradorInimigo.getQuantidadeTanks();

    const tempoJogo = this.geradorInimigo.getTempoJogo();

    const tempoRound = this.geradorInimigo.getTempoRoundAtual();

    const textoRound = round >= roundFinal ? "FINAL" : round;

    this.debugEstadoJogo.innerHTML =
      `Round: ${textoRound}<br>` +
      `Tempo de Jogo: ${this.formatarTempo(tempoJogo)}<br>` +
      `Tempo do Round: ${this.formatarTempo(tempoRound)}<br>` +
      `Total Inimigos: ${limite}<br>` +
      `Qtd de Magos: ${magos}<br>` +
      `Qtd de Orcs: ${tanks}`;
  }
  tentarDroparPowerUp(inimigo) {
    if (!inimigo) return;

    const posicao = inimigo.getPosition();
    const roll = Math.random();

    if (roll < POWERUP_CONFIG.chanceHealth) {
      posicao.y = 1.7;

      this.powerups.push(
        new HealthPowerUp(this.scene, posicao, POWERUP_CONFIG.health.cura),
      );

      return;
    }

    if (roll < POWERUP_CONFIG.chanceHealth + POWERUP_CONFIG.chanceStrength) {
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

      this.tempoDebugEstado += delta;
      if (this.tempoDebugEstado >= 0.1) {
        this.tempoDebugEstado = 0;
        this.atualizarDebugEstadoJogo();
      }
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
