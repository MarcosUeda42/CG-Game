import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class Inimigo {
  constructor(url, scene, x, y, z, rotacaoY) {
    this.inimigo = null;
    this.url = url;
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
  }
  mudarAnimacao(nome, duracao = 0.1) {
    const nextAction = this.actions[nome];
    if (!nextAction || nextAction === this.currentAction) return;

    nextAction.reset();
    nextAction.enabled = true;
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);
    nextAction.play();

    if (this.currentAction) this.currentAction.crossFadeTo(nextAction, duracao, true);
    this.currentAction = nextAction;
  }
  carregar() {
    this.loader.load(
      this.url,
      (gltf) => {
        this.inimigo = gltf.scene;
        this.inimigo.scale.setScalar(0.01);
        this.inimigo.position.set(this.posX, this.posY, this.posZ);

        this.scene.add(this.inimigo);

        this.hitbox = new THREE.Box3();

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
      },
      () => {
        console.log("Carregando inimigo");
      },
      (erro) => {
        console.error("Erro ao carregar inimigo:", erro);
      },
    );
  }
  atualizar(target) {
    const delta = this.clock.getDelta();

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
    const centro = this.inimigo.position.clone();
    centro.add(this.offsetHitbox);

    const metade = this.tamanhoHitbox.clone().multiplyScalar(0.5);

    this.hitbox.min.copy(centro).sub(metade);
    this.hitbox.max.copy(centro).add(metade);
  }
}
