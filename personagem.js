import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBB } from "three/addons/math/OBB.js";
import { PLAYER_CONFIG } from "./config.js";

const DURACAO_DANO_FALLBACK = 0.5; // segundos, usado se não existir a animação "Damage"
const DURACAO_TRANSICAO_ATAQUE = 0.05; // duração da pré-animação de ataque

export default class Personagem {
  constructor(
    url,
    scene,
    controles,
    cenario,
    health = PLAYER_CONFIG.healthMax,
  ) {
    this.personagem = null;
    this.url = url;
    this.controles = controles;
    this.cenario = cenario;
    this.loader = new GLTFLoader();
    this.mixer = null;
    this.scene = scene;
    this.actions = {};
    this.health = health;
    this.healthMax = health;
    this.currentAction = null;
    this.clock = new THREE.Clock();
    this.velocidade = PLAYER_CONFIG.movimento.velocidadeBase;
    this.multiplicadorVelocidadeMovimento = 1;
    this.velocidadeAtaque = PLAYER_CONFIG.ataque.velocidadeBase;
    this.multiplicadorPreparacaoAtaque =
      PLAYER_CONFIG.ataque.multiplicadorPreparacao;

    this.damageMode = false;
    this.morto = false;
    this.tempoDano = 0;
    this.knockbackVel = new THREE.Vector3();
    this.forcaKnockback = PLAYER_CONFIG.knockback.forca;
    this.atritoKnockback = PLAYER_CONFIG.knockback.atrito;
    this.aoMudarVida = null;
    this.multiplicadorDano = 1;
    this.tempoBuffForca = 0;
    this.duracaoBuffForca = 0;

    this.stamina = PLAYER_CONFIG.stamina.maxima;
    this.staminaMax = PLAYER_CONFIG.stamina.maxima;
    this.exausto = false;
    this.tempoRegenStamina = 0;
    this.aoMudarStamina = null;

    this.defendendo = false;
    this.defesaAtiva = false;
    this.tempoDefesa = 0;
    this.aoBloquear = null;
    this.hitboxDefesa = new OBB(
      new THREE.Vector3(),
      new THREE.Vector3(0, 0, 0),
      new THREE.Matrix3(),
    );
    this.matrizRotacaoDefesa = new THREE.Matrix4();
    this.rotacaoDefesa = new THREE.Matrix3();
    this.hitboxDefesaHelper = null;

    this.meleeStates = [
      {
        //Ataque 1
        inicio: 0.0,
        fim: 1.3,
        hitInicio: 0.9,
        hitFim: 1.1,
        dano: 40,
        velocidade: 1,
        hitbox: {
          tamanho: new THREE.Vector3(1.4, 1.6, 1.6),
          distancia: 1.4,
          altura: 0.9,
          lateral: 0,
        },
      },
      {
        //Ataque 2
        inicio: 1.3,
        fim: 2.5,
        hitInicio: 0.7,
        hitFim: 1,
        dano: 40,
        velocidade: 1.5,
        hitbox: {
          tamanho: new THREE.Vector3(2.0, 1.6, 1.6),
          distancia: 1.4,
          altura: 0.9,
          lateral: 0,
        },
      },
      {
        //Ataque 3
        inicio: 2.5,
        fim: 3.5,
        hitInicio: 0.5,
        hitFim: 0.7,
        dano: 60,
        velocidade: 0.7,
        hitbox: {
          tamanho: new THREE.Vector3(1.6, 1.8, 2.0),
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
    this.alvosAtingidos = new Set();

    this.direcoes = {
      KeyW: new THREE.Vector3(0, 0, -1),
      KeyS: new THREE.Vector3(0, 0, 1),
      KeyA: new THREE.Vector3(-1, 0, 0),
      KeyD: new THREE.Vector3(1, 0, 0),
    };
    this.proximoSolicitado = false;

    this._tmpPosicaoAnterior = new THREE.Vector3();
    this._tmpFrenteCamera = new THREE.Vector3();
    this._tmpDireitaCamera = new THREE.Vector3();
    this._tmpDirecaoMovimento = new THREE.Vector3();
    this._tmpCentroDefesa = new THREE.Vector3();
    this._tmpTamanhoDefesa = new THREE.Vector3();
    this._tmpUp = new THREE.Vector3(0, 1, 0);
    this._tmpCentroHitbox = new THREE.Vector3();
    this._tmpMetadeHitbox = new THREE.Vector3();
    this._tmpCentroAtaque = new THREE.Vector3();
    this._tmpTamanhoAtaque = new THREE.Vector3();
    this._tmpPosicaoDanoAnterior = new THREE.Vector3();

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
      this.personagem.position.set(0, 0.85, 0.01);

      this.pivot.position.set(1, 0, 1);
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

      this.hitboxDefesaHelper = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({
          color: 0x00aaff,
          wireframe: true,
          depthTest: false,
        }),
      );

      this.hitboxDefesaHelper.visible = false;
      this.hitboxDefesaHelper.renderOrder = 1000;
      this.scene.add(this.hitboxDefesaHelper);

      this.mixer = new THREE.AnimationMixer(this.personagem);
      gltf.animations.forEach((clip) => {
        this.actions[clip.name] = this.mixer.clipAction(clip);
      });

      this.actions["Attack"].setLoop(THREE.LoopOnce);
      this.actions["Attack"].clampWhenFinished = true;

      // dano e morte tocam uma vez e ficam no último frame
      const acaoDano = this.actions["Damage"];
      if (acaoDano) {
        acaoDano.setLoop(THREE.LoopOnce, 1);
        acaoDano.clampWhenFinished = true;
      }

      const acaoMorte = this.actions["Death"];
      if (acaoMorte) {
        acaoMorte.setLoop(THREE.LoopOnce, 1);
        acaoMorte.clampWhenFinished = true;
      }

      const acaoDefesa = this.actions["Defense"];
      if (acaoDefesa) {
        acaoDefesa.setLoop(THREE.LoopOnce, 1);
        acaoDefesa.clampWhenFinished = true;
      }

      // quando a animação de dano termina, sai do damageMode
      this.mixer.addEventListener("finished", (e) => {
        if (e.action === this.actions["Damage"]) this.terminarDano();
      });
    });
  }
  dano(valor, origem = null) {
    if (this.morto || this.damageMode || !this.personagem) return false;

    this.defendendo = false;
    this.tempoDefesa = 0;
    this.esconderHitboxDefesa();

    this.health = Math.max(0, this.health - valor);
    if (this.aoMudarVida) this.aoMudarVida(this.health);

    this.resetarAtaque();
    this.atualizarHitboxAtaque();

    if (this.health <= 0) {
      this.iniciarMorte();
      return true;
    }

    this.damageMode = true;

    this.knockbackVel.set(0, 0, 0);
    if (origem) {
      this.knockbackVel.subVectors(this.pivot.position, origem).setY(0);

      if (this.knockbackVel.lengthSq() > 0.0001)
        this.knockbackVel.normalize().multiplyScalar(this.forcaKnockback);
      else this.knockbackVel.set(0, 0, 0);
    }

    if (this.actions["Damage"]) this.mudarAnimacao("Damage");
    else {
      this.tempoDano = DURACAO_DANO_FALLBACK;
      this.mudarAnimacao("Idle"); // evita continuar tocando o ataque durante o stun
    }

    return true;
  }
  aplicarBuffForca(multiplicador, duracao) {
    this.multiplicadorDano = multiplicador;
    this.tempoBuffForca = duracao;
    this.duracaoBuffForca = duracao;
  }
  atualizarBuffs(delta) {
    if (this.tempoBuffForca <= 0) return;

    this.tempoBuffForca -= delta;
    if (this.tempoBuffForca <= 0) {
      this.tempoBuffForca = 0;
      this.duracaoBuffForca = 0;
      this.multiplicadorDano = 1;
    }
  }
  getTempoBuffForca() {
    return this.tempoBuffForca;
  }
  getDuracaoBuffForca() {
    return this.duracaoBuffForca;
  }
  getMultiplicadorDano() {
    return this.multiplicadorDano;
  }
  iniciarMorte() {
    this.tempoBuffForca = 0;
    this.duracaoBuffForca = 0;
    this.multiplicadorDano = 1;
    this.morto = true;
    this.damageMode = false;
    this.knockbackVel.set(0, 0, 0);
    this.esconderHitboxDefesa();
    this.defendendo = false;

    if (this.actions["Death"]) this.mudarAnimacao("Death");
    else this.mudarAnimacao("Idle");
  }
  terminarDano() {
    this.damageMode = false;
    this.knockbackVel.set(0, 0, 0);
    this.mudarAnimacao("Idle");
  }
  atualizarDano(delta) {
    const anterior = this._tmpPosicaoDanoAnterior.copy(this.pivot.position);

    this.pivot.position.addScaledVector(this.knockbackVel, delta);
    this.knockbackVel.multiplyScalar(Math.exp(-this.atritoKnockback * delta));

    // não deixa o empurrão atravessar as paredes
    this.atualizarHitbox();
    for (const parede of this.cenario.hitboxesParedes) {
      if (this.hitbox.intersectsBox(parede)) {
        this.pivot.position.copy(anterior);
        this.pivot.updateMatrixWorld(true);
        this.knockbackVel.set(0, 0, 0);
        this.atualizarHitbox();
        break;
      }
    }

    if (!this.actions["Damage"]) {
      this.tempoDano -= delta;
      if (this.tempoDano <= 0) this.terminarDano();
    }
  }
  ataque(delta) {
    if (this.tempoRecarga > 0) this.tempoRecarga -= delta;

    if (this.passoMelee === -1) {
      if (
        this.controles.getMouseState() &&
        this.tempoRecarga <= 0 &&
        !this.defendendo
      )
        this.iniciarAtaque(0);
      return;
    }

    const passo = this.meleeStates[this.passoMelee];
    const multiplicadorGolpe = passo.velocidade ?? 1;
    const duracao = passo.fim - passo.inicio;
    const acao = this.actions["Attack"];

    if (acao) {
      this.tempoAtaque = Math.max(0, acao.time - passo.inicio);

      const preparandoAtaque =
        this.passoMelee === 0 && this.tempoAtaque < passo.hitInicio;

      const velocidadeGolpe = this.velocidadeAtaque * multiplicadorGolpe;

      const velocidadeAtual = preparandoAtaque
        ? velocidadeGolpe * this.multiplicadorPreparacaoAtaque
        : velocidadeGolpe;

      acao.setEffectiveTimeScale(velocidadeAtual);
    } else this.tempoAtaque += delta * this.velocidadeAtaque;

    if (this.controles.getMouseState() && this.tempoAtaque >= passo.hitInicio) {
      this.proximoSolicitado = true;
    }

    if (this.tempoAtaque >= duracao) {
      const temProximo = this.passoMelee + 1 < this.meleeStates.length;

      if (this.proximoSolicitado && temProximo)
        this.iniciarAtaque(this.passoMelee + 1);
      else this.resetarAtaque();
    }
  }
  atualizarDefesa(delta) {
    this.defendendo = this.controles.getRightMouseState();

    if (!this.defendendo) {
      this.tempoDefesa = 0;
      this.esconderHitboxDefesa();
      return;
    }

    this.tempoDefesa += delta;
    this.defesaAtiva = this.tempoDefesa >= PLAYER_CONFIG.defesa.atraso;
    this.atualizarHitboxDefesa();
  }
  atualizarHitboxDefesa() {
    const ang = this.pivot.rotation.y;
    const sen = Math.sin(ang);
    const cos = Math.cos(ang);

    const tamanho = this._tmpTamanhoDefesa.set(
      PLAYER_CONFIG.defesa.hitbox.largura,
      PLAYER_CONFIG.defesa.hitbox.altura,
      PLAYER_CONFIG.defesa.hitbox.profundidade,
    );

    const centro = this._tmpCentroDefesa.copy(this.pivot.position);
    centro.x += sen * PLAYER_CONFIG.defesa.hitbox.distancia;
    centro.z += cos * PLAYER_CONFIG.defesa.hitbox.distancia;
    centro.y += PLAYER_CONFIG.defesa.hitbox.alturaCentro;

    this.matrizRotacaoDefesa.makeRotationY(ang);
    this.rotacaoDefesa.setFromMatrix4(this.matrizRotacaoDefesa);

    this.hitboxDefesa.center.copy(centro);
    this.hitboxDefesa.halfSize.copy(tamanho).multiplyScalar(0.5);
    this.hitboxDefesa.rotation.copy(this.rotacaoDefesa);

    if (this.hitboxDefesaHelper) {
      this.hitboxDefesaHelper.visible = this.debugHitbox;
      this.hitboxDefesaHelper.position.copy(centro);
      this.hitboxDefesaHelper.scale.copy(tamanho);
      this.hitboxDefesaHelper.rotation.set(0, ang, 0);

      this.hitboxDefesaHelper.material.color.setHex(
        this.defesaAtiva ? 0x00aaff : 0x888888,
      );
    }
  }
  esconderHitboxDefesa() {
    this.defesaAtiva = false;
    this.hitboxDefesa.halfSize.set(0, 0, 0);

    if (this.hitboxDefesaHelper) {
      this.hitboxDefesaHelper.visible = false;
    }
  }
  bloquear(hitboxAtacante) {
    if (this.morto || !this.defesaAtiva) return false;
    if (!this.hitboxDefesa.intersectsBox3(hitboxAtacante)) return false;

    if (this.stamina < PLAYER_CONFIG.defesa.custoBloqueio) return false;

    this.stamina -= PLAYER_CONFIG.defesa.custoBloqueio;
    this.tempoRegenStamina = PLAYER_CONFIG.stamina.atrasoRegeneracao;

    if (this.stamina <= 0) {
      this.stamina = 0;
      this.exausto = true;
    }

    if (this.aoBloquear) this.aoBloquear(hitboxAtacante);

    return true;
  }
  atualizarHitbox() {
    const centro = this._tmpCentroHitbox
      .copy(this.pivot.position)
      .add(this.offsetHitbox);

    const metade = this._tmpMetadeHitbox
      .copy(this.tamanhoHitbox)
      .multiplyScalar(0.5);

    this.hitbox.min.copy(centro).sub(metade);
    this.hitbox.max.copy(centro).add(metade);
  }
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

    const ang = this.pivot.rotation.y;
    const sen = Math.sin(ang);
    const cos = Math.cos(ang);

    const cfg = passo.hitbox ?? {};
    const tamanhoAtaque = cfg.tamanho ?? this.tamanhoHitboxAtaque;
    const distancia = cfg.distancia ?? this.distanciaAtaque;
    const altura = cfg.altura ?? this.alturaAtaque;
    const lateral = cfg.lateral ?? 0;

    const centro = this._tmpCentroAtaque.copy(this.pivot.position);
    centro.x += sen * distancia + cos * lateral;
    centro.z += cos * distancia - sen * lateral;
    centro.y += altura;

    const { x: larg, y: alt, z: prof } = tamanhoAtaque;
    const tamanho = this._tmpTamanhoAtaque.set(
      Math.abs(cos) * larg + Math.abs(sen) * prof,
      alt,
      Math.abs(sen) * larg + Math.abs(cos) * prof,
    );

    this.hitboxAtaque.setFromCenterAndSize(centro, tamanho);

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
    this.alvosAtingidos.clear();
    const passo = this.meleeStates[indice];
    const acao = this.actions["Attack"];
    if (acao) {
      acao.setEffectiveTimeScale(this.velocidadeAtaque);
    }

    this.passoMelee = indice;
    this.tempoAtaque = 0;

    this.proximoSolicitado = false;
    this.acertou = false; // novo golpe, pode acertar de novo
    this._offX = null;
    this._offZ = null;

    if (!acao) return;

    const velocidadeInicial =
      indice === 0
        ? this.velocidadeAtaque * this.multiplicadorPreparacaoAtaque
        : this.velocidadeAtaque;

    acao.setEffectiveTimeScale(velocidadeInicial);

    if (this.currentAction === acao) {
      acao.paused = false;
      acao.time = passo.inicio;
    } else {
      acao.reset();
      acao.time = passo.inicio;
      acao.enabled = true;
      acao.play();
      if (this.currentAction)
        this.currentAction.crossFadeTo(acao, DURACAO_TRANSICAO_ATAQUE, true);
      this.currentAction = acao;
    }
  }
  resetarAtaque() {
    this.alvosAtingidos.clear();
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
  atualizar(camera) {
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);

    if (!this.personagem) return;

    this.atualizarBuffs(delta);

    const apertandoShift =
      this.controles.getKeyStatus("ShiftLeft") ||
      this.controles.getKeyStatus("ShiftRight");
    this.correndo = false;

    const posicaoAnterior = this._tmpPosicaoAnterior.set(
      this.pivot.position.x * 0.999,
      this.pivot.position.y,
      this.pivot.position.z * 0.999,
    );

    this.atualizarHitbox();
    this.acompanharQuadril(this.passoMelee !== -1);

    if (this.morto) return;

    if (this.damageMode) {
      this.atualizarStamina(delta, false);
      this.atualizarDano(delta);
      return;
    }

    this.atualizarDefesa(delta);

    if (this.defendendo) {
      if (this.passoMelee !== -1) {
        this.resetarAtaque();
        this.atualizarHitboxAtaque();
      }

      this.atualizarStamina(delta, false);
      this.mudarAnimacao("Defense");
      return;
    }

    this.ataque(delta);
    this.atualizarHitboxAtaque();

    if (this.passoMelee !== -1) {
      this.atualizarStamina(delta, false);
      return;
    }

    const frenteCamera = this._tmpFrenteCamera;
    camera.camera.getWorldDirection(frenteCamera);
    frenteCamera.y = 0;
    frenteCamera.normalize();

    const direitaCamera = this._tmpDireitaCamera;
    direitaCamera.crossVectors(frenteCamera, this._tmpUp).normalize();

    const direcao = this._tmpDirecaoMovimento.set(0, 0, 0);
    if (this.controles.teclas["KeyW"]) direcao.add(frenteCamera);
    if (this.controles.teclas["KeyS"]) direcao.sub(frenteCamera);
    if (this.controles.teclas["KeyD"]) direcao.add(direitaCamera);
    if (this.controles.teclas["KeyA"]) direcao.sub(direitaCamera);

    if (direcao.lengthSq() > 0) {
      this.correndo = this.atualizarStamina(delta, apertandoShift);
      this.fatorCorrida = this.correndo
        ? PLAYER_CONFIG.movimento.multiplicadorCorrida
        : 1;

      const passo =
        this.velocidade *
        this.fatorCorrida *
        this.multiplicadorVelocidadeMovimento *
        delta;
      direcao.normalize();
      this.pivot.position.addScaledVector(direcao, passo);
      const alvo = Math.atan2(direcao.x, direcao.z);

      let diferenca = alvo - this.pivot.rotation.y;
      diferenca = Math.atan2(Math.sin(diferenca), Math.cos(diferenca));

      const fator = 1 - Math.exp(-this.velocidadeGiro * delta);
      this.pivot.rotation.y += diferenca * fator;

      this.mudarAnimacao(this.correndo ? "Run" : "Walk");
    } else {
      this.atualizarStamina(delta, false);
      this.mudarAnimacao("Idle");
    }

    for (const parede of this.cenario.hitboxesParedes) {
      if (this.hitbox.intersectsBox(parede)) {
        this.pivot.position.copy(posicaoAnterior);
        this.pivot.updateMatrixWorld(true);
        break;
      }
    }
  }
  curar(valor) {
    if (this.morto) return;

    this.health = Math.min(this.healthMax, this.health + valor);
    if (this.aoMudarVida) this.aoMudarVida(this.health);
  }
  getPosition() {
    if (this.personagem) return this.pivot.position;
    return new THREE.Vector3(0, 0, 0);
  }
  getHealth() {
    return this.health;
  }
  getHealthMax() {
    return this.healthMax;
  }
  aumentarVidaMaxima(valor) {
    if (valor <= 0) return;

    this.healthMax += valor;
    this.health = Math.min(this.healthMax, this.health + valor);

    if (this.aoMudarVida) {
      this.aoMudarVida(this.health);
    }
  }
  resetarStamina() {
    this.stamina = this.staminaMax;
    this.exausto = false;
    this.tempoRegenStamina = 0;
    if (this.aoMudarStamina)
      this.aoMudarStamina(this.stamina, this.staminaMax, false);
  }
  atualizarStamina(delta, querCorrer) {
    const podeCorrer = querCorrer && !this.exausto && this.stamina > 0;

    if (podeCorrer) {
      this.stamina -= PLAYER_CONFIG.stamina.gastoCorrida * delta;
      this.tempoRegenStamina = PLAYER_CONFIG.stamina.atrasoRegeneracao;

      if (this.stamina <= 0) {
        this.stamina = 0;
        this.exausto = true;
      }
    } else if (this.tempoRegenStamina > 0) {
      this.tempoRegenStamina -= delta;
    } else {
      this.stamina = Math.min(
        this.staminaMax,
        this.stamina + PLAYER_CONFIG.stamina.regeneracao * delta,
      );
    }

    if (
      this.exausto &&
      this.stamina >= PLAYER_CONFIG.stamina.recuperacaoMinima
    ) {
      this.exausto = false;
    }

    return podeCorrer;
  }
  getStamina() {
    return this.stamina;
  }
  getStaminaMax() {
    return this.staminaMax;
  }
  aumentarStaminaMaxima(valor) {
    if (valor <= 0) return;

    this.staminaMax += valor;
    this.stamina = Math.min(this.staminaMax, this.stamina + valor);

    if (this.aoMudarStamina) {
      this.aoMudarStamina(this.stamina, this.staminaMax, this.exausto);
    }
  }
  isExhausted() {
    return this.exausto;
  }
  verificarAcerto(inimigos) {
    if (!this.ataqueAtivo) return;

    const passo = this.meleeStates[this.passoMelee];
    const lista = Array.isArray(inimigos) ? inimigos : [inimigos];

    for (const inimigo of lista) {
      if (inimigo.isDead() || this.alvosAtingidos.has(inimigo)) continue;
      if (!this.hitboxAtaque.intersectsBox(inimigo.hitbox)) continue;

      if (
        inimigo.dano(passo.dano * this.multiplicadorDano, this.pivot.position)
      )
        this.alvosAtingidos.add(inimigo);
    }
  }
}
