import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class Personagem {
  constructor(url, scene, controles, cenario, health = 100) {
    this.personagem = null;
    this.url = url;
    this.controles = controles;
    this.cenario = cenario;
    this.loader = new GLTFLoader();
    this.mixer = null;
    this.scene = scene;
    this.actions = {};
    this.health = health;
    this.currentAction = null;
    this.clock = new THREE.Clock();
    this.velocidade = 3;
    this.meleeStates = [
      {
        inicio: 0.0,
        fim: 1.2,
        hitInicio: 0.7,
        hitFim: 1,
        dano: 8,
        hitbox: {
          tamanho: new THREE.Vector3(1.4, 1.6, 1.6),
          distancia: 1.4,
          altura: 0.9,
          lateral: 0,
        },
      },
      {
        inicio: 1.4,
        fim: 2.3,
        hitInicio: 0.7,
        hitFim: 1,
        dano: 10,
        hitbox: {
          tamanho: new THREE.Vector3(2.0, 1.6, 1.6), // golpe mais largo
          distancia: 1.4,
          altura: 0.9,
          lateral: 0,
        },
      },
      {
        inicio: 2.5,
        fim: 3.5,
        hitInicio: 0.5,
        hitFim: 0.7,
        dano: 10,
        hitbox: {
          tamanho: new THREE.Vector3(1.6, 1.8, 2.0), // golpe final, mais longo
          distancia: 1.6,
          altura: 0.9,
          lateral: 0,
        },
      },
    ];
    this.tempoRecarga = 0;
    this.passoMelee = -1;
    this.velocidadeGiro = 10;

    this.hitbox = new THREE.Box3();
    this.hitboxHelper = null;
    this.tamanhoHitbox = new THREE.Vector3(0.6, 1.8, 0.6);
    this.offsetHitbox = new THREE.Vector3(0, 0.9, 0);

    this.hitboxAtaque = new THREE.Box3();
    this.hitboxAtaque.makeEmpty();
    this.hitboxAtaqueHelper = null;
    this.tamanhoHitboxAtaque = new THREE.Vector3(1.4, 1.6, 1.6);
    this.distanciaAtaque = 1.4;
    this.alturaAtaque = 0.9;
    this.ataqueAtivo = false;
    this.acertou = false;
    this.debugHitbox = true;

    this.direcoes = {
      KeyW: new THREE.Vector3(0, 0, -1),
      KeyS: new THREE.Vector3(0, 0, 1),
      KeyA: new THREE.Vector3(-1, 0, 0),
      KeyD: new THREE.Vector3(1, 0, 0),
    };
    this.proximoSolicitado = false;

    this.correndo = false;
    this.fatorCorrida = 1;

    this.resetarAtaque();
  }
  carregar() {
    this.loader.load(this.url, (gltf) => {
      this.pivot = new THREE.Group();
      this.scene.add(this.pivot);

      this.personagem = gltf.scene;
      this.personagem.scale.setScalar(0.01);
      this.personagem.position.set(0, 1, 0.01);

      this.pivot.position.set(1, 0.3, 1);
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

      this.hitboxAtaqueHelper = new THREE.Box3Helper(
        this.hitboxAtaque,
        0xffff00,
      );
      this.hitboxAtaqueHelper.visible = false;
      this.scene.add(this.hitboxAtaqueHelper);

      this.mixer = new THREE.AnimationMixer(this.personagem);
      gltf.animations.forEach((clip) => {
        this.actions[clip.name] = this.mixer.clipAction(clip);
      });

      this.actions["Attack"].setLoop(THREE.LoopOnce);
      this.actions["Attack"].clampWhenFinished = true;
    });
  }
  ataque(delta) {
    if (this.tempoRecarga > 0) this.tempoRecarga -= delta;

    if (this.passoMelee === -1) {
      if (this.controles.getMouseState() && this.tempoRecarga <= 0)
        this.iniciarAtaque(0);
      return;
    }

    const passo = this.meleeStates[this.passoMelee];
    const duracao = passo.fim - passo.inicio;
    this.tempoAtaque += delta;

    if (this.controles.getMouseState() && this.tempoAtaque >= passo.hitInicio)
      this.proximoSolicitado = true;

    if (this.tempoAtaque >= duracao) {
      const temProximo = this.passoMelee + 1 < this.meleeStates.length;

      if (this.proximoSolicitado && temProximo)
        this.iniciarAtaque(this.passoMelee + 1);
      else if (this.tempoAtaque >= duracao) this.resetarAtaque();
    }
  }
  atualizarHitbox() {
    const centro = this.pivot.position.clone();
    centro.add(this.offsetHitbox);

    const metade = this.tamanhoHitbox.clone().multiplyScalar(0.5);

    this.hitbox.min.copy(centro).sub(metade);
    this.hitbox.max.copy(centro).add(metade);
  }
  // Cria a hitbox de ataque na frente do personagem durante a janela de acerto
  // e a esvazia fora dela.
  atualizarHitboxAtaque() {
    this.ataqueAtivo = false;

    if (this.passoMelee === -1) {
      this.hitboxAtaque.makeEmpty();
      if (this.hitboxAtaqueHelper) this.hitboxAtaqueHelper.visible = false;
      return;
    }

    const passo = this.meleeStates[this.passoMelee];

    // hitInicio/hitFim são em segundos desde o início do golpe (tempoAtaque)
    this.ataqueAtivo =
      this.tempoAtaque >= passo.hitInicio && this.tempoAtaque <= passo.hitFim;

    // direção para onde o personagem está virado (mesma convenção do atan2 do movimento)
    const ang = this.pivot.rotation.y;
    const sen = Math.sin(ang);
    const cos = Math.cos(ang);

    // configuração do estado atual; se faltar algum campo, usa o padrão do construtor
    const cfg = passo.hitbox ?? {};
    const tamanhoAtaque = cfg.tamanho ?? this.tamanhoHitboxAtaque;
    const distancia = cfg.distancia ?? this.distanciaAtaque;
    const altura = cfg.altura ?? this.alturaAtaque;
    const lateral = cfg.lateral ?? 0;

    // frente = (sen, 0, cos) | direita local = (cos, 0, -sen)
    const centro = this.pivot.position.clone();
    centro.x += sen * distancia + cos * lateral;
    centro.z += cos * distancia - sen * lateral;
    centro.y += altura;

    // Box3 é alinhada aos eixos, então usamos a caixa que envolve o retângulo girado
    const { x: larg, y: alt, z: prof } = tamanhoAtaque;
    const tamanho = new THREE.Vector3(
      Math.abs(cos) * larg + Math.abs(sen) * prof,
      alt,
      Math.abs(sen) * larg + Math.abs(cos) * prof,
    );

    this.hitboxAtaque.setFromCenterAndSize(centro, tamanho);

    // fora da janela de acerto a caixa não existe (a não ser no modo debug)
    if (!this.ataqueAtivo && !this.debugHitbox) {
      this.hitboxAtaque.makeEmpty();
      if (this.hitboxAtaqueHelper) this.hitboxAtaqueHelper.visible = false;
      return;
    }

    if (this.hitboxAtaqueHelper) {
      this.hitboxAtaqueHelper.visible = true;
      // amarelo = ativa (pode acertar) | cinza = só mostrando a posição
      this.hitboxAtaqueHelper.material.color.setHex(
        this.ataqueAtivo ? 0xffff00 : 0x888888,
      );
    }
  }
  iniciarAtaque(indice) {
    const passo = this.meleeStates[indice];
    const acao = this.actions["Attack"];

    this.passoMelee = indice;
    this.tempoAtaque = 0;

    this.proximoSolicitado = false;
    this.acertou = false; // novo golpe, pode acertar de novo
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
      if (this.currentAction) this.currentAction.crossFadeTo(acao, 0.3, true);
      this.currentAction = acao;
    }
  }
  resetarAtaque() {
    this.passoMelee = -1;
    this.tempoAtaque = 0;
    this.proximoSolicitado = false;
    this.acertou = false;
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

    if (this.currentAction)
      this.currentAction.crossFadeTo(nextAction, duracao, true);
    this.currentAction = nextAction;
  }
  atualizar() {
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);

    if (!this.personagem) return;
    this.correndo = this.controles.getScrollState();

    const posicaoAnterior = new THREE.Vector3(
      this.pivot.position.x * 0.999,
      this.pivot.position.y,
      this.pivot.position.z * 0.999,
    );

    this.atualizarHitbox();
    this.acompanharQuadril(this.passoMelee !== -1);

    this.ataque(delta);
    this.atualizarHitboxAtaque();

    if (this.passoMelee !== -1) return;

    const direcao = new THREE.Vector3();
    for (const tecla in this.direcoes)
      if (this.controles.teclas[tecla]) direcao.add(this.direcoes[tecla]);

    if (direcao.lengthSq() > 0) {
      if (this.correndo) this.fatorCorrida = 1.5;
      else this.fatorCorrida = 1;

      const passo = this.velocidade * this.fatorCorrida * delta;
      direcao.normalize();
      this.pivot.position.addScaledVector(direcao, passo);
      const alvo = Math.atan2(direcao.x, direcao.z);

      let diferenca = alvo - this.pivot.rotation.y;
      diferenca = Math.atan2(Math.sin(diferenca), Math.cos(diferenca));

      const fator = 1 - Math.exp(-this.velocidadeGiro * delta);
      this.pivot.rotation.y += diferenca * fator;

      this.mudarAnimacao(this.correndo ? "Run" : "Walk");
    } else this.mudarAnimacao("Idle");

    for (const parede of this.cenario.hitboxesParedes) {
      if (this.hitbox.intersectsBox(parede)) {
        this.pivot.position.copy(posicaoAnterior);
        this.pivot.updateMatrixWorld(true);
        break;
      }
    }
  }
  getPosition() {
    if (this.personagem) return this.pivot.position;
    return new THREE.Vector3(0, 0, 0);
  }
  getHealth() {
    return this.health;
  }
  verificarAcerto(oponente) {
    // só acerta com a hitbox de ataque ativa, e uma vez por golpe
    if (!this.ataqueAtivo || this.acertou) return;

    if (this.hitboxAtaque.intersectsBox(oponente.hitbox)) {
      const passo = this.meleeStates[this.passoMelee];
      oponente.dano(passo.dano, this.pivot.position);
      this.acertou = true;
    }
  }
}