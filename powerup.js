import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

class PowerUp {
  constructor(
    scene,
    scalar,
    posicao = new THREE.Vector3(0, 0, 0),
    caminhoModelo = "./objetos/red_potion.glb",
    aoColetar = null,
  ) {
    this.scene = scene;
    this.aoColetar = aoColetar;
    this.modelo = null;
    this.velocidadeGiro = 2;
    this.amplitudeFlutuacao = 0.1;
    this.velocidadeFlutuacao = 2;
    this.tempo = 0;
    this.alturaBase = posicao.y;

    this.hitbox = new THREE.Box3();
    this.tamanhoHitbox = new THREE.Vector3(0.8, 0.8, 0.8);
    this.coletado = false;

    this.pivot = new THREE.Group();
    this.pivot.position.copy(posicao);
    this.scene.add(this.pivot);

    new GLTFLoader().load(caminhoModelo, (gltf) => {
      this.modelo = gltf.scene;

      const caixa = new THREE.Box3().setFromObject(this.modelo);
      const centro = caixa.getCenter(new THREE.Vector3());
      this.modelo.scale.setScalar(scalar);
      this.modelo.position.sub(centro);

      this.pivot.add(this.modelo);
    });
  }
  aplicarEfeito(personagem) {}
  atualizar(delta) {
    if (!this.modelo) return;

    this.tempo += delta;
    this.pivot.rotation.y += this.velocidadeGiro * delta;
    this.pivot.position.y =
      this.alturaBase +
      Math.sin(this.tempo * this.velocidadeFlutuacao) * this.amplitudeFlutuacao;
  }
  atualizarHitbox() {
    this.hitbox.setFromCenterAndSize(this.pivot.position, this.tamanhoHitbox);
  }
  verificarColeta(personagem) {
    if (this.coletado || !this.modelo) return false;

    this.atualizarHitbox();
    if (!this.hitbox.intersectsBox(personagem.hitbox)) return false;

    this.coletado = true;
    this.aplicarEfeito(personagem);
    if (this.aoColetar) this.aoColetar(personagem, this);
    this.remover();
    return true;
  }
  remover() {
    this.scene.remove(this.pivot);
  }
}

export class HealthPowerUp extends PowerUp {
  constructor(scene, posicao, cura = 30, aoColetar = null) {
    super(scene, 0.25, posicao, "./objetos/red_potion.glb", aoColetar);
    this.cura = cura;
  }

  aplicarEfeito(personagem) {
    personagem.curar(this.cura);
  }
}

export class StrengthPowerUp extends PowerUp {
  constructor(
    scene,
    posicao,
    multiplicador = 1.5,
    duracao = 10,
    aoColetar = null,
  ) {
    super(scene, 0.25, posicao, "./objetos/mana_potion.glb", aoColetar);
    this.multiplicador = multiplicador;
    this.duracao = duracao;
  }

  aplicarEfeito(personagem) {
    personagem.aplicarBuffForca(this.multiplicador, this.duracao);
  }
}
