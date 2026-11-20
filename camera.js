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
    this.altura = [23, 3.5];
    this.alturaAlvo = [0, 1];

    this.anguloVertical = [
      Math.atan2(this.altura[0] - this.alturaAlvo[0], this.raio[0]),
      Math.atan2(this.altura[1] - this.alturaAlvo[1], this.raio[1]),
    ];

    this.anguloVerticalMinimo = THREE.MathUtils.degToRad(5);
    this.anguloVerticalMaximo = THREE.MathUtils.degToRad(75);

    this.sensibilidadeMouse = 0.0015;
    this.zoom = [1, 1];
    this.zoomMinimo = 0.5;
    this.zoomMaximo = 1.3;
    this.sensibilidadeZoom = 0.001;

    this.modo = 1;
  }

  atualizarPosicao(pos) {
    const fatorZoom = this.zoom[this.modo];

    const raioBase = this.raio[this.modo];
    const alturaRelativaBase =
      this.altura[this.modo] - this.alturaAlvo[this.modo];

    const distanciaBase =
      Math.sqrt(raioBase * raioBase + alturaRelativaBase * alturaRelativaBase) *
      fatorZoom;

    const anguloVertical = this.anguloVertical[this.modo];

    const distanciaHorizontal = Math.cos(anguloVertical) * distanciaBase;

    const alturaRelativa = Math.sin(anguloVertical) * distanciaBase;

    const alvoY = pos.y + this.alturaAlvo[this.modo];

    this.camera.position.x =
      pos.x + distanciaHorizontal * Math.sin(this.angulo);

    this.camera.position.z =
      pos.z + distanciaHorizontal * Math.cos(this.angulo);

    this.camera.position.y = alvoY + alturaRelativa;

    this.camera.lookAt(pos.x, alvoY, pos.z);
  }

  moverComMouse(deltaX, deltaY) {
    this.angulo -= deltaX * this.sensibilidadeMouse;

    this.anguloVertical[this.modo] += deltaY * this.sensibilidadeMouse;

    this.anguloVertical[this.modo] = THREE.MathUtils.clamp(
      this.anguloVertical[this.modo],
      this.anguloVerticalMinimo,
      this.anguloVerticalMaximo,
    );
  }

  ajustarZoom(delta) {
    this.zoom[this.modo] += delta * this.sensibilidadeZoom;

    this.zoom[this.modo] = THREE.MathUtils.clamp(
      this.zoom[this.modo],
      this.zoomMinimo,
      this.zoomMaximo,
    );
  }

  orbitarEsquerda(pos, velocidade = 0.03) {
    this.angulo -= velocidade;
    this.atualizarPosicao(pos);
  }
  orbitarDireita(pos, velocidade = 0.03) {
    this.angulo += velocidade;
    this.atualizarPosicao(pos);
  }
}
