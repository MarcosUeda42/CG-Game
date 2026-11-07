import * as THREE from "three";

// classe da camera define perspectiva e posição
export default class Camera {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.angulo = 0;
    this.raio = [14, 10];
    this.altura = [30, 4];

    this.modo = 0;
    //this.atualizarPosicao();
  }

  atualizarPosicao(pos) {
    const r = this.raio[this.modo];
    const a = this.altura[this.modo];

    this.camera.position.x = pos.x + r * Math.sin(this.angulo);
    this.camera.position.z = pos.z + r * Math.cos(this.angulo);
    this.camera.position.y = pos.y + a;

    // camera olha para o personagem
    this.camera.lookAt(pos.x, pos.y, pos.z);
  }

  orbitarEsquerda(velocidade = 0.03) {
    this.angulo -= velocidade;
    this.atualizarPosicao();
  }

  orbitarDireita(velocidade = 0.03) {
    this.angulo += velocidade;
    this.atualizarPosicao();
  }
}