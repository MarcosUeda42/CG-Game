// projetil.js
import * as THREE from "three";
import { PROJECTILE_CONFIG } from "./config.js";

const GEOMETRIA_PROJETIL = new THREE.SphereGeometry(
  PROJECTILE_CONFIG.raio,
  8,
  8,
);

const MATERIAL_PROJETIL = new THREE.MeshBasicMaterial({
  color: 0xff4500,
});

export default class Projetil {
  constructor(
    scene,
    posOrigem,
    dirDisparo,
    velocidade = PROJECTILE_CONFIG.velocidade,
    alcanceMaxTempo = PROJECTILE_CONFIG.tempoVida,
  ) {
    this.scene = scene;
    this.velocidade = velocidade;
    this.tempoVida = alcanceMaxTempo;
    this.tempoDecorrido = 0;
    this.ativo = true;

    this.direcao = dirDisparo.clone().normalize();

    this.mesh = new THREE.Mesh(GEOMETRIA_PROJETIL, MATERIAL_PROJETIL);
    this.mesh.position.copy(posOrigem);
    this.scene.add(this.mesh);

    this.hitbox = new THREE.Box3();
    this.tamanhoHitbox = new THREE.Vector3(
      PROJECTILE_CONFIG.hitbox,
      PROJECTILE_CONFIG.hitbox,
      PROJECTILE_CONFIG.hitbox,
    );
    this.atualizarHitbox();
  }

  atualizar(delta) {
    if (!this.ativo) return;

    this.tempoDecorrido += delta;
    if (this.tempoDecorrido >= this.tempoVida) {
      this.destruir();
      return;
    }

    this.mesh.position.addScaledVector(this.direcao, this.velocidade * delta);
    this.atualizarHitbox();
  }

  atualizarHitbox() {
    const centro = this.mesh.position;
    const metade = this.tamanhoHitbox.clone().multiplyScalar(0.5);
    this.hitbox.min.copy(centro).sub(metade);
    this.hitbox.max.copy(centro).add(metade);
  }

  destruir() {
    if (!this.ativo) return;

    this.ativo = false;

    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh = null;
    }
  }
}
