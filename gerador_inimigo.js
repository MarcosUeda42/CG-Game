import Inimigo from "./inimigo.js";
import Particulas from "./particulas.js";
import { ENEMY_CONFIG, SPAWN_CONFIG } from "./config.js";

export default class GeradorInimigo {
  constructor(scene, aoInimigoMorrer = null) {
    this.scene = scene;
    this.aoInimigoMorrer = aoInimigoMorrer;
    this.inimigos = [];
    this.tempoTotal = 0;
    this.intervalo = SPAWN_CONFIG.intervalo;
    this.tempoUltimoInimigo = 0;
    this.limite = SPAWN_CONFIG.limiteInimigos;
    this.ativo = true;
    this.particulas = new Particulas(scene, 600);
    Inimigo.preload("./inimigo/model.glb").catch((erro) => {
      console.error("Erro ao pré-carregar inimigo:", erro);
    });
  }
  atualizar(delta, posJogador, listaProjeteis) {
    if (!this.ativo) return;

    if (this.particulas) {
      this.particulas.atualizar(delta);
    }

    this.tempoTotal += delta;
    this.tempoUltimoInimigo += delta;

    if (
      this.tempoUltimoInimigo >= this.intervalo &&
      this.limite > this.inimigos.length
    ) {
      this.gerarInimigo(posJogador);
      this.tempoUltimoInimigo = 0;
    }

    // recomendação do cláudio fazer de trás para frente
    for (let i = this.inimigos.length - 1; i >= 0; i--) {
      const inimigo = this.inimigos[i];

      if (inimigo.removido) {
        this.inimigos.splice(i, 1);
        continue;
      }
      inimigo.atualizar(posJogador, delta, listaProjeteis);
    }
  }
  gerarInimigo() {
    const x =
      Math.random() * (SPAWN_CONFIG.areaMetade * 2) -
      SPAWN_CONFIG.areaMetade;
    const z =
      Math.random() * (SPAWN_CONFIG.areaMetade * 2) -
      SPAWN_CONFIG.areaMetade;

    const novoInimigo = new Inimigo(
      "./inimigo/model.glb",
      this.scene,
      x,
      0.85,
      z,
      0,
      ENEMY_CONFIG.recompensa,
      this.aoInimigoMorrer,
      this.particulas,
    );

    novoInimigo.carregar();
    this.inimigos.push(novoInimigo);
  }
  removerTodos() {
    this.ativo = false;

    for (const inimigo of this.inimigos) inimigo.remover();

    this.inimigos.length = 0;

    if (this.particulas) {
      this.particulas.dispose();
      this.particulas = null;
    }
  }
}
