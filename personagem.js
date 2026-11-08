import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class Personagem {
  constructor(url, scene, controles, cenario) {
    this.personagem = null;
    this.url = url;
    this.controles = controles;
    this.cenario = cenario;
    this.loader = new GLTFLoader();
    this.mixer = null;
    this.scene = scene;
    this.actions = {};
    this.currentAction = null;
    this.clock = new THREE.Clock();
    this.velocidade = 3;
    this.meleeStates = [
      {
        inicio: 0.0,
        fim: 1.2,
        hitInicio: 0.2,
        hitFim: 0.35, 
        dano: 8,
      },
      {
        inicio: 1.4,
        fim: 2.3,
        hitInicio: 0.85,
        hitFim: 1.0,
        dano: 10,
      },
      {
        inicio: 2.5,
        fim: 3.5,
        hitInicio: 0.85,
        hitFim: 1.0,
        dano: 10,
      },
    ];
    this.tempoRecarga = 0;
    this.passoMelee = -1;    
    this.velocidadeGiro = 10;

    this.hitbox = new THREE.Box3();
    this.hitboxHelper = null;

    this.tamanhoHitbox = new THREE.Vector3(0.6, 1.8, 0.6);
    this.offsetHitbox = new THREE.Vector3(0, 0.9, 0);

    this.direcoes = {
      KeyW: new THREE.Vector3(0, 0, -1),
      KeyS: new THREE.Vector3(0, 0, 1),
      KeyA: new THREE.Vector3(-1, 0, 0),
      KeyD: new THREE.Vector3(1, 0, 0),
    };
    this.proximoSolicitado = false;
    this.resetarAtaque();
  }
  carregar() {
    this.loader.load(
      this.url,
      (gltf) => {
        this.pivot = new THREE.Group();
        this.scene.add(this.pivot);

        this.personagem = gltf.scene;
        this.personagem.scale.setScalar(0.01);

        this.pivot.position.set(1, 1, 1);
        this.personagem.position.set(0, 1, -1)
        this.pivot.add(this.personagem);
        
        this.quadril = this.personagem.getObjectByName("mixamorigHips");
        this.quadrilRepouso = this.quadril.position.clone();
        this._offX = null;
        this._offZ = null;
        this._wA = new THREE.Vector3();
        this._wR = new THREE.Vector3();

        const helper = new THREE.AxesHelper(2);
        this.pivot.add(helper);        

        this.hitboxHelper = new THREE.Box3Helper(this.hitbox, 0xff0000);
        this.scene.add(this.hitboxHelper);

        this.mixer = new THREE.AnimationMixer(this.personagem);
        gltf.animations.forEach((clip) => {
          this.actions[clip.name] = this.mixer.clipAction(clip);
        });

        this.actions["Attack"].setLoop(THREE.LoopOnce);
        this.actions["Attack"].clampWhenFinished = true;
      },
      (progresso) => {
        if (progresso.total) {
          console.log(
            `Carregando: ${((progresso.loaded / progresso.total) * 100).toFixed(0)}%`,
          );
        }
      },
      (erro) => {
        console.error("Erro ao carregar personagem:", erro);
      },
    );
  }
  ataque(delta) {
    if (this.tempoRecarga > 0) this.tempoRecarga -= delta;

    if (this.passoMelee === -1) {
      if (this.controles.getMouseState() && this.tempoRecarga <= 0) this.iniciarAtaque(0);
      return;
    }

    const passo = this.meleeStates[this.passoMelee];
    const duracao = passo.fim - passo.inicio;
    this.tempoAtaque += delta;

    const tClip = passo.inicio + this.tempoAtaque;

    if (this.controles.getMouseState() && tClip >= passo.hitInicio) this.proximoSolicitado = true;

    if (this.tempoAtaque >= duracao) {
      const temProximo = this.passoMelee + 1 < this.meleeStates.length;

      if (this.proximoSolicitado && temProximo)
        this.iniciarAtaque(this.passoMelee + 1);
      else if (this.tempoAtaque >= duracao)
        this.resetarAtaque();
    }
  }
  iniciarAtaque(indice) {
    const passo = this.meleeStates[indice];
    const acao = this.actions["Attack"];

    this.passoMelee = indice;
    this.tempoAtaque = 0;
    
    this.proximoSolicitado = false;
    this._offX = null;
    this._offZ = null;

    if (!acao) return;

    if (this.currentAction === acao) {
      acao.paused = false;
      acao.time = passo.inicio;
    } else {
      acao.reset();
      acao.time = passo.inicio;
      acao.enabled = true;
      acao.play();
      if (this.currentAction) 
        this.currentAction.crossFadeTo(acao, 0.3, true);
      this.currentAction = acao;
    }
  }
  resetarAtaque() {
    this.passoMelee = -1;
    this.tempoAtaque = 0;
    this.proximoSolicitado = false;
    this.tempoRecarga = 0.2; // pequena pausa antes de reiniciar
  }
  acompanharQuadril(aplicar) {
    const q = this.quadril;
    if (!q) return;

    this.personagem.updateMatrixWorld(true);
    q.getWorldPosition(this._wA);

    q.position.x = this.quadrilRepouso.x;
    q.position.z = this.quadrilRepouso.z;
    q.updateMatrixWorld(true);
    q.getWorldPosition(this._wR);

    const offX = this._wA.x - this._wR.x;
    const offZ = this._wA.z - this._wR.z;

    if (aplicar && this._offX !== null) {
      this.pivot.position.x += offX - this._offX;
      this.pivot.position.z += offZ - this._offZ;
      this.personagem.updateMatrixWorld(true);
    }

    this._offX = offX;
    this._offZ = offZ;
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
  atualizarHitbox() {
    const centro = this.pivot.position.clone();
    centro.add(this.offsetHitbox);

    const metade = this.tamanhoHitbox.clone().multiplyScalar(0.5);

    this.hitbox.min.copy(centro).sub(metade);
    this.hitbox.max.copy(centro).add(metade);
  }
  atualizar() {
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);
    
    if (!this.personagem) return;
    
    this.atualizarHitbox();
    this.acompanharQuadril(this.passoMelee !== -1);

    this.ataque(delta);

    if (this.passoMelee !== -1) return;

    const direcao = new THREE.Vector3();
    for (const tecla in this.direcoes)
      if (this.controles.teclas[tecla]) direcao.add(this.direcoes[tecla]);
    
    if (direcao.lengthSq() > 0) {
      const passo = this.velocidade * delta;
      direcao.normalize();
      this.pivot.position.addScaledVector(direcao, passo);
      const alvo = Math.atan2(direcao.x, direcao.z);
      
      let diferenca = alvo - this.pivot.rotation.y;
      diferenca = Math.atan2(Math.sin(diferenca), Math.cos(diferenca));

      const fator = 1 - Math.exp(-this.velocidadeGiro * delta);
      this.pivot.rotation.y += diferenca * fator;
      
      this.mudarAnimacao("Walk");
    } else this.mudarAnimacao("Idle");
  }
  colision() {
    for (const parede of this.cenario.hitboxesParedes) {
      if (this.hitbox.intersectsBox(parede)) {
        this.pivot.position.copy(posicaoAnterior);
        this.pivot.updateMatrixWorld(true);
        this.atualizarHitbox();
        console.log("bateu")
        break;
      }
    }
  }
  getPosition(){
    if (this.personagem) return this.pivot.position;
    return new THREE.Vector3(0, 0, 0);
  }
}
