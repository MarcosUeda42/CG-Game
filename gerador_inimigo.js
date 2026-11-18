import Inimigo from "./inimigo.js";

export default class GeradorInimigo {
  constructor(scene, aoInimigoMorrer = null) {
    this.scene = scene;
    this.aoInimigoMorrer = aoInimigoMorrer;
    this.inimigos = [];
    this.tempoTotal = 0;
    this.intervalo = 5.0;
    this.tempoUltimoInimigo = 0;
    this.limite = 5;
    this.ativo = true;
  }

  atualizar(delta, posJogador, listaProjeteis) {
    if (!this.ativo) return;

    this.tempoTotal += delta;
    this.tempoUltimoInimigo += delta;

    if (
      this.tempoUltimoInimigo >= this.intervalo &&
      this.limite > this.inimigos.length
    ) {
      this.gerarInimigo(posJogador);
      this.tempoUltimoInimigo = 0;
    }

    for (let i = 0; i < this.inimigos.length; i++) {
      const inimigo = this.inimigos[i];

      if (inimigo.removido) {
        this.inimigos.splice(i, 1);
        continue;
      }
      inimigo.atualizar(posJogador, delta, listaProjeteis);
    }
  }

  removerTodos() {
    this.ativo = false;

    for (const inimigo of this.inimigos) {
      inimigo.removido = true; // cancela timeouts e o carregamento pendente

      if (typeof inimigo.destruir === "function") {
        inimigo.destruir();
        continue;
      }

      inimigo.inimigo?.removeFromParent();
      inimigo.inimigo?.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        mats.forEach((m) => m.dispose());
      });
      inimigo.hitboxHelper?.removeFromParent();
    }

    this.inimigos.length = 0;
  }

  gerarInimigo() {
    const x = Math.random() * 50 - 25;
    const z = Math.random() * 50 - 25;

    const novoInimigo = new Inimigo(
      "./inimigo/model.glb",
      this.scene,
      x,
      1.2,
      z,
      0,
      100,
      this.aoInimigoMorrer
    );

    novoInimigo.carregar();
    this.inimigos.push(novoInimigo);
  }
}
