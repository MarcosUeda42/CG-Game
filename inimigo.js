import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ESCALA_MODELO = 0.01;

export default class Inimigo {
  constructor(url, scene, x, y, z, rotacaoY) {
    this.url = url;
    this.inimigo = null;
    this.loader = new GLTFLoader();
    this.mixer = null;
    this.scene = scene;
    this.clock = new THREE.Clock();
    this.currentAction = null;
    this.posX = x;
    this.posY = y;
    this.posZ = z;
    this.rotacaoY = rotacaoY;
    this.velocidade = 1.5;
    this.distanciaMinima = 2;

    this.hitbox = new THREE.Box3();
    this.offsetHitbox = new THREE.Vector3(0, 0, 0);
    this.tamanhoHitbox = new THREE.Vector3(0.6, 1.8, 0.6);

    this.actions = {};

    // vida
    this.health = 100;
    this.healthMax = 100;
    this.removido = false;

    // barra de vida: cada inimigo tem o próprio canvas e textura
    this.canvas = document.createElement("canvas");
    this.canvas.width = 256;
    this.canvas.height = 32;
    this.ctx = this.canvas.getContext("2d");

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;

    this.spriteMaterial = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      depthTest: false, // sempre visível, mesmo dentro do modelo
    });
    this.healthSprite = new THREE.Sprite(this.spriteMaterial);
    this.healthSprite.renderOrder = 999;

    // a sprite será filha do modelo (escala 0.01), então compensamos a escala
    // tamanho no mundo: 1.5 x 0.19 | altura no mundo: 2.0
    this.healthSprite.scale.set(1.5 / ESCALA_MODELO, 0.19 / ESCALA_MODELO, 1);
    this.healthSprite.position.set(0, 1.0 / ESCALA_MODELO, 0); // ajuste a altura aqui

    this.desenharBarra();
  }

  desenharBarra() {
    const { ctx, canvas } = this;
    const ratio = Math.max(0, this.health) / this.healthMax;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // fundo
    ctx.fillStyle = "#333333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // preenchimento
    ctx.fillStyle =
      ratio > 0.5 ? "#00ff00" : ratio > 0.25 ? "#fb8c00" : "#ff0000";
    ctx.fillRect(0, 0, canvas.width * ratio, canvas.height);

    // borda
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    this.texture.needsUpdate = true; // envia o novo desenho para a GPU
  }

  dano(valor) {
    if (this.health <= 0) return;
    this.health = Math.max(0, this.health - valor);
    this.desenharBarra();
  }

  mudarAnimacao(nome, duracao = 0.1) {
    const nextAction = this.actions[nome];
    if (!nextAction || nextAction === this.currentAction) return;

    nextAction.reset();
    nextAction.enabled = true;
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);
    nextAction.play();

    if (this.currentAction)
      this.currentAction.crossFadeTo(nextAction, duracao, true);
    this.currentAction = nextAction;
  }

  carregar() {
    this.loader.load(this.url, (gltf) => {
      this.inimigo = gltf.scene;
      this.inimigo.scale.setScalar(ESCALA_MODELO);
      this.inimigo.position.set(this.posX, this.posY, this.posZ);
      this.inimigo.add(this.healthSprite);

      this.scene.add(this.inimigo);

      this.helper = new THREE.Box3Helper(this.hitbox, 0xff0000);
      this.scene.add(this.helper);

      this.mixer = new THREE.AnimationMixer(this.inimigo);
      gltf.animations.forEach((clip) => {
        this.actions[clip.name] = this.mixer.clipAction(clip);
      });

      if (this.actions["Idle"]) {
        this.currentAction = this.actions["Idle"];
        this.currentAction.play();
      }
    });
  }

  remover() {
    if (this.removido) return;
    this.removido = true;

    if (this.inimigo) this.scene.remove(this.inimigo); // a sprite sai junto
    if (this.helper) this.scene.remove(this.helper);
    this.hitbox.makeEmpty();

    // libera memória da GPU
    this.texture.dispose();
    this.spriteMaterial.dispose();
  }

  atualizar(target) {
    const delta = this.clock.getDelta();

    if (this.health <= 0) {
      this.remover();
      return;
    }

    if (this.mixer) this.mixer.update(delta);
    if (!this.inimigo || !target) return;

    const direcao = new THREE.Vector3();
    direcao.subVectors(target, this.inimigo.position);
    direcao.y = 0;

    const distancia = direcao.length();

    if (distancia > this.distanciaMinima) {
      direcao.normalize();

      this.inimigo.position.addScaledVector(direcao, this.velocidade * delta);

      const alvo = Math.atan2(direcao.x, direcao.z);
      let diferenca = alvo - this.inimigo.rotation.y;
      diferenca = Math.atan2(Math.sin(diferenca), Math.cos(diferenca));
      this.inimigo.rotation.y += diferenca * 8 * delta;

      this.mudarAnimacao("Run");
    } else this.mudarAnimacao("Idle");

    this.atualizarHitbox();
  }

  atualizarHitbox() {
    if (this.health <= 0 || !this.inimigo) return;

    const centro = this.inimigo.position.clone();
    centro.add(this.offsetHitbox);

    const metade = this.tamanhoHitbox.clone().multiplyScalar(0.5);

    this.hitbox.min.copy(centro).sub(metade);
    this.hitbox.max.copy(centro).add(metade);
  }

  isDead() {
    return this.health <= 0;
  }
}