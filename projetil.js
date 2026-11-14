// projetil.js
import * as THREE from "three";

export default class Projetil {
  constructor(scene, posOrigem, dirDisparo, velocidade = 6, alcanceMaxTempo = 4.0) {
    this.scene = scene;
    this.velocidade = velocidade;
    this.tempoVida = alcanceMaxTempo;
    this.tempoDecorrido = 0;
    this.ativo = true;

    this.direcao = dirDisparo.clone().normalize();

    const geo = new THREE.SphereGeometry(0.2, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(posOrigem);
    this.scene.add(this.mesh);

    this.luz = new THREE.PointLight(0xff6600, 2, 6);
    this.mesh.add(this.luz);

    this.hitbox = new THREE.Box3();
    this.tamanhoHitbox = new THREE.Vector3(0.4, 0.4, 0.4);
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
    this.ativo = false;
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
    }
  }
}