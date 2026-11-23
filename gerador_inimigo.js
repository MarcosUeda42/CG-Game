import Inimigo from "./inimigo.js";
import InimigoTank from "./inimigo_tank.js";
import Particulas from "./particulas.js";
import { ENEMY_CONFIG, TANK_CONFIG, SPAWN_CONFIG } from "./config.js";

export default class GeradorInimigo {
  constructor(scene, aoInimigoMorrer = null, aoTankAtacar = null) {
    this.scene = scene;
    this.aoInimigoMorrer = aoInimigoMorrer;
    this.aoTankAtacar = aoTankAtacar;
    this.inimigos = [];
    this.poolTanks = [];
    this.poolTanksPronta = false;
    this.tempoTotal = 0;
    this.tempoUltimoMago = 0;
    this.tempoUltimoTank = 0;
    this.intervaloMago = SPAWN_CONFIG.mago.intervaloInicial;
    this.intervaloTank = SPAWN_CONFIG.tank.intervaloInicial;
    this.limiteTotalAtual = SPAWN_CONFIG.limiteTotal.inicial;
    this.tempoDesdeAumentoLimite = 0;
    this.ativo = true;
    this.particulas = new Particulas(scene, 600);
    Inimigo.preload("./inimigo/model.glb").catch((erro) => {
      console.error("Erro ao pré-carregar inimigo:", erro);
    });
    InimigoTank.preload("./tank/model_fixed.glb")
      .then(() => this.prepararPoolTanks())
      .catch((erro) => {
        console.error("Erro ao pré-carregar Tank:", erro);
      });
  }
  prepararPoolTanks() {
    const quantidade = SPAWN_CONFIG.tank.limiteSimultaneo;
    const promessas = [];

    for (let i = 0; i < quantidade; i++) {
      const tank = new InimigoTank(
        "./tank/model_fixed.glb",
        this.scene,
        0,
        0,
        0,
        0,
        TANK_CONFIG.recompensa,
        this.aoInimigoMorrer,
        this.aoTankAtacar,
        (tankDesativado) => {
          const indice = this.inimigos.indexOf(tankDesativado);
          if (indice !== -1) {
            this.inimigos.splice(indice, 1);
          }

          if (!this.poolTanks.includes(tankDesativado)) {
            this.poolTanks.push(tankDesativado);
          }
        },
      );

      promessas.push(tank.carregar());
      this.poolTanks.push(tank);
    }

    Promise.all(promessas)
      .then(() => {
        this.poolTanksPronta = true;
      })
      .catch((erro) => {
        console.error("Erro ao preparar pool de Tanks:", erro);
      });
  }
  atualizar(delta, posJogador, listaProjeteis) {
    if (!this.ativo) return;

    this.atualizarLimiteInimigos(delta);

    if (this.particulas) {
      this.particulas.atualizar(delta);
    }

    this.tempoTotal += delta;
    this.tempoUltimoMago += delta;
    this.tempoUltimoTank += delta;

    if (this.tempoUltimoTank >= this.intervaloTank) {
      if (
        this.podeGerarMaisInimigos() &&
        this.contarInimigosPorTipo("tank") < SPAWN_CONFIG.tank.limiteSimultaneo
      ) {
        this.gerarTank();
        this.tempoUltimoTank = 0;
      }
    }

    if (this.tempoUltimoMago >= this.intervaloMago) {
      if (
        this.podeGerarMaisInimigos() &&
        this.contarInimigosPorTipo("mago") < SPAWN_CONFIG.mago.limiteSimultaneo
      ) {
        this.gerarMago();
        this.tempoUltimoMago = 0;
      }
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
  atualizarLimiteInimigos(delta) {
    if (this.limiteTotalAtual >= SPAWN_CONFIG.limiteTotal.maximo) {
      return;
    }

    this.tempoDesdeAumentoLimite += delta;

    if (
      this.tempoDesdeAumentoLimite < SPAWN_CONFIG.limiteTotal.intervaloAumento
    ) {
      return;
    }

    this.tempoDesdeAumentoLimite = 0;

    this.limiteTotalAtual = Math.min(
      SPAWN_CONFIG.limiteTotal.maximo,
      this.limiteTotalAtual + SPAWN_CONFIG.limiteTotal.incremento,
    );

    console.log(`Limite de inimigos aumentado para ${this.limiteTotalAtual}`);
  }
  contarInimigosPorTipo(tipo) {
    return this.inimigos.filter(
      (inimigo) =>
        !inimigo.removido &&
        inimigo.tipo === tipo &&
        (tipo !== "tank" || inimigo.ativo),
    ).length;
  }
  podeGerarMaisInimigos() {
    const quantidadeAtiva = this.inimigos.filter(
      (inimigo) => !inimigo.removido,
    ).length;
    return quantidadeAtiva < this.limiteTotalAtual;
  }
  gerarPosicaoSpawn() {
    return {
      x:
        Math.random() * (SPAWN_CONFIG.areaMetade * 2) - SPAWN_CONFIG.areaMetade,

      z:
        Math.random() * (SPAWN_CONFIG.areaMetade * 2) - SPAWN_CONFIG.areaMetade,
    };
  }
  gerarMago() {
    if (!this.podeGerarMaisInimigos()) return;

    const posicao = this.gerarPosicaoSpawn();
    const novoInimigo = new Inimigo(
      "./inimigo/model.glb",
      this.scene,
      posicao.x,
      0.85,
      posicao.z,
      0,
      ENEMY_CONFIG.recompensa,
      this.aoInimigoMorrer,
      this.particulas,
    );

    novoInimigo.carregar();
    this.inimigos.push(novoInimigo);
  }
  gerarTank() {
    if (!this.poolTanksPronta || !this.podeGerarMaisInimigos()) {
      return;
    }

    const tank = this.poolTanks.pop();
    if (!tank) return;

    const posicao = this.gerarPosicaoSpawn();
    tank.ativar(posicao.x, 0, posicao.z);
    this.inimigos.push(tank);
  }
  setIntervaloMago(valor) {
    if (valor <= 0) return;
    this.intervaloMago = valor;
  }
  setIntervaloTank(valor) {
    if (valor <= 0) return;
    this.intervaloTank = valor;
  }
  removerTodos() {
    this.ativo = false;

    const tanksUnicos = new Set();

    for (const inimigo of this.inimigos) {
      if (inimigo.tipo === "tank") {
        tanksUnicos.add(inimigo);
      } else {
        inimigo.remover();
      }
    }

    for (const tank of this.poolTanks) {
      tanksUnicos.add(tank);
    }

    for (const tank of tanksUnicos) {
      tank.remover();
    }

    this.inimigos.length = 0;
    this.poolTanks.length = 0;

    if (this.particulas) {
      this.particulas.dispose();
      this.particulas = null;
    }
  }
}
