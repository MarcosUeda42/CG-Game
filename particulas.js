import * as THREE from "three";

function criarTexturaCirculo() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export default class Particulas {
  constructor(scene, max = 150, cor = 0xff7a1a, tamanho = 0.18) {
    this.scene = scene;
    this.max = max;
    this.cor = new THREE.Color(cor);
    this._tmpDirecao = new THREE.Vector3();
    this.proximo = 0;
    this.ativos = 0;

    this.posicoes = new Float32Array(max * 3);
    this.cores = new Float32Array(max * 3);
    this.velocidades = new Float32Array(max * 3);
    this.vida = new Float32Array(max);
    this.vidaMax = new Float32Array(max).fill(1);

    this.geometria = new THREE.BufferGeometry();
    this.geometria.setAttribute(
      "position",
      new THREE.BufferAttribute(this.posicoes, 3),
    );
    this.geometria.setAttribute(
      "color",
      new THREE.BufferAttribute(this.cores, 3),
    );

    this.textura = criarTexturaCirculo();
    this.textura.generateMipmaps = false;
    this.textura.minFilter = THREE.LinearFilter;
    this.textura.magFilter = THREE.LinearFilter;
    this.material = new THREE.PointsMaterial({
      size: tamanho,
      map: this.textura,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // preto = invisível, então fade = escurecer
    });

    this.pontos = new THREE.Points(this.geometria, this.material);
    this.pontos.frustumCulled = false; // as posições mudam, a esfera de culling ficaria velha
    this.scene.add(this.pontos);
  }

  _spawn(px, py, pz, vx, vy, vz, vida) {
    const i = this.proximo;
    if (this.vida[i] <= 0) {
      this.ativos++;
    }
    this.proximo = (this.proximo + 1) % this.max; // pool circular: reaproveita a mais antiga

    this.posicoes.set([px, py, pz], i * 3);
    this.velocidades.set([vx, vy, vz], i * 3);
    this.vida[i] = vida;
    this.vidaMax[i] = vida;
  }

  explosao(centro, quantidade = 25, velocidade = 2.5, vida = 0.5) {
    for (let n = 0; n < quantidade; n++) {
      const d = this._tmpDirecao
        .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(velocidade * (0.4 + Math.random() * 0.6));

      this._spawn(centro.x, centro.y, centro.z, d.x, d.y, d.z, vida);
    }
  }

  convergir(centro, quantidade = 2, raio = 0.5, vida = 0.25) {
    for (let n = 0; n < quantidade; n++) {
      const d = this._tmpDirecao
        .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize();

      const v = (raio / vida) * -1;
      this._spawn(
        centro.x + d.x * raio,
        centro.y + d.y * raio,
        centro.z + d.z * raio,
        d.x * v,
        d.y * v,
        d.z * v,
        vida,
      );
    }
  }

  atualizar(delta) {
    if (this.ativos === 0) return;

    let alterado = false;

    for (let i = 0; i < this.max; i++) {
      if (this.vida[i] <= 0) continue;

      alterado = true;
      this.vida[i] -= delta;
      const i3 = i * 3;

      if (this.vida[i] <= 0) {
        this.vida[i] = 0;
        this.ativos = Math.max(0, this.ativos - 1);

        this.cores[i3] = 0;
        this.cores[i3 + 1] = 0;
        this.cores[i3 + 2] = 0;

        continue;
      }

      this.posicoes[i3] += this.velocidades[i3] * delta;
      this.posicoes[i3 + 1] += this.velocidades[i3 + 1] * delta;
      this.posicoes[i3 + 2] += this.velocidades[i3 + 2] * delta;

      const f = this.vida[i] / this.vidaMax[i];
      this.cores[i3] = this.cor.r * f;
      this.cores[i3 + 1] = this.cor.g * f;
      this.cores[i3 + 2] = this.cor.b * f;
    }

    if (alterado) {
      this.geometria.attributes.position.needsUpdate = true;
      this.geometria.attributes.color.needsUpdate = true;
    }
  }

  dispose() {
    this.scene.remove(this.pontos);
    this.geometria.dispose();
    this.material.dispose();
    this.textura.dispose();
  }
}
