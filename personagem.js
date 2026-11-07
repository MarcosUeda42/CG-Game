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
    this.atacando = false;
    this.meleeStates = [
      {
        inicio: 0.0,
        fim: 0.8,
        hitInicio: 0.2,
        hitFim: 0.35, 
        dano: 8,
        alcance: 1.5,
        angulo: 90,
        janelaFim: 0.4,
      },
      {
        inicio: 0.8,
        fim: 1.4,
        hitInicio: 0.85,
        hitFim: 1.0,
        dano: 10,
        alcance: 1.5,
        angulo: 90,
        janelaFim: 0.4,
      },
      {
        inicio: 1.4,
        fim: 3.5,
        hitInicio: 0.85,
        hitFim: 1.0,
        dano: 10,
        alcance: 1.5,
        angulo: 90,
        janelaFim: 0.4,
      },
    ];
    this.tempoRecarga = 0;
    this.passoMelee = -1;    
    this.velocidadeGiro = 10;
    this.hitbox = new THREE.Box3();
    this.direcoes = {
      KeyW: new THREE.Vector3(0, 0, -1),
      KeyS: new THREE.Vector3(0, 0, 1),
      KeyA: new THREE.Vector3(-1, 0, 0),
      KeyD: new THREE.Vector3(1, 0, 0),
    };
    this.ataqueAnterior = false;
    this.proximoSolicitado = false;
    this.golpeFinalizado = false;

    this.resetarAtaque();
  }
  tratarAtaque(apertouAgora, delta) {
    if (this.tempoRecarga > 0) this.tempoRecarga -= delta;

    if (this.passoMelee === -1) {
      if (apertouAgora && this.tempoRecarga <= 0) this.iniciarAtaque(0);
      return;
    }

    const passo = this.meleeStates[this.passoMelee];
    const duracao = passo.fim - passo.inicio;
    this.tempoAtaque += delta;

    const tClip = passo.inicio + this.tempoAtaque;

    if (apertouAgora && tClip >= passo.hitInicio) this.proximoSolicitado = true;

    if (this.tempoAtaque >= duracao) {
      if (!this.golpeFinalizado) {
        this.golpeFinalizado = true;
        this.finalizarGolpe(passo);
      }

      const temProximo = this.passoMelee + 1 < this.meleeStates.length;

      if (this.proximoSolicitado && temProximo) {
        this.iniciarAtaque(this.passoMelee + 1);
      } else if (apertouAgora && temProximo) {
        this.iniciarAtaque(this.passoMelee + 1);
      } else if (this.tempoAtaque >= duracao + passo.janelaFim) {
        this.resetarAtaque();
      }
    }
  }
  finalizarGolpe(passo) {
    const acao = this.actions[this.animacaoAtaque];
    if (!acao) return;

    acao.time = passo.fim;
    acao.paused = true;
    this.mixer.update(0);

    const antes = this.personagem.position.clone();
    this.acompanharQuadril(true);

    if (this.colide()) {
      this.personagem.position.copy(antes);
      this.personagem.updateMatrixWorld(true);
    }
  }
  iniciarAtaque(indice) {
    const passo = this.meleeStates[indice];
    const acao = this.actions["Attack"];

    this.passoMelee = indice;
    this.tempoAtaque = 0;
    
    this.proximoSolicitado = false;
    this.golpeFinalizado = false;
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
      acao.setEffectiveWeight(1);
      acao.play();
      if (this.currentAction) this.currentAction.crossFadeTo(acao, 0.1, true);
      this.currentAction = acao;
    }
  }
  resetarAtaque() {
    this.passoMelee = -1;
    this.tempoAtaque = 0;
    this.proximoSolicitado = false;
    this.tempoRecarga = 0.2; // pequena pausa antes de reiniciar
  }
  carregar() {
    this.loader.load(
      this.url,
      (gltf) => {
        this.personagem = gltf.scene;
        this.personagem.scale.setScalar(0.01); // ajuste se necessário (ex.: 0.01 para FBX)
        this.personagem.position.set(1, 1, 1);
        this.scene.add(this.personagem);
        
        this.quadril = this.personagem.getObjectByName("mixamorigHips");
        this.quadrilRepouso = this.quadril.position.clone();
        this._offX = null; // deslocamento do frame anterior
        this._offZ = null;
        this._wA = new THREE.Vector3();
        this._wR = new THREE.Vector3();
        
        this.hitbox = new THREE.Box3();
        this.personagem.updateMatrixWorld(true);

        this.helper = new THREE.Box3Helper(this.hitbox, 0xff0000);
        this.scene.add(this.helper);

        this.mixer = new THREE.AnimationMixer(this.personagem);
        gltf.animations.forEach((clip) => {
          this.actions[clip.name] = this.mixer.clipAction(clip);
        });

        this.actions["Attack"].setLoop(THREE.LoopRepeat);

        if (this.actions["Idle"]) {
          this.currentAction = this.actions["Idle"];
          this.currentAction.play();
        }
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
  acompanharQuadril(aplicar) {
    const q = this.quadril;
    if (!q) return;

    // posição do quadril como a animação deixou
    this.personagem.updateMatrixWorld(true);
    q.getWorldPosition(this._wA);

    // posição do quadril se estivesse no repouso (X/Z)
    q.position.x = this.quadrilRepouso.x;
    q.position.z = this.quadrilRepouso.z;
    q.updateMatrixWorld(true);
    q.getWorldPosition(this._wR);

    // deslocamento do quadril em relação ao centro, no mundo
    const offX = this._wA.x - this._wR.x;
    const offZ = this._wA.z - this._wR.z;

    // move o personagem só pela VARIAÇÃO desde o frame anterior
    if (aplicar && this._offX !== null) {
      this.personagem.position.x += offX - this._offX;
      this.personagem.position.z += offZ - this._offZ;
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
  atualizar() {
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);
    
    if (!this.personagem) return;
    
    this.acompanharQuadril(this.passoMelee !== -1);

    const apertando = this.controles.getMouseState();
    const apertouAgora = apertando && !this.ataqueAnterior;
    this.ataqueAnterior = apertando;

    this.tratarAtaque(apertouAgora, delta);

    if (this.passoMelee !== -1) return;
    const posicaoAnterior = this.personagem.position.clone();

    const direcao = new THREE.Vector3();
    for (const tecla in this.direcoes)
      if (this.controles.teclas[tecla]) direcao.add(this.direcoes[tecla]);
    
    if (direcao.lengthSq() > 0) {
      const passo = this.velocidade * delta;
      direcao.normalize();
      this.personagem.position.addScaledVector(direcao, passo);
      const alvo = Math.atan2(direcao.x, direcao.z);
      
      let diferenca = alvo - this.personagem.rotation.y;
      diferenca = Math.atan2(Math.sin(diferenca), Math.cos(diferenca));
      
      const fator = 1 - Math.exp(-this.velocidadeGiro * delta);
      this.personagem.rotation.y += diferenca * fator;
      
      this.mudarAnimacao("Walk");
    } else this.mudarAnimacao("Idle");
    this.hitbox = this.hitbox.setFromObject(this.personagem);

    for (const parede of this.cenario.hitboxesParedes) {
      if (this.hitbox.intersectsBox(parede)) {
        this.personagem.position.copy(posicaoAnterior);
        this.personagem.updateMatrixWorld(true);
        this.hitbox.setFromObject(this.personagem);
        break;
      }
    }
  }
  
  position(){
    if (this.personagem) return this.personagem.position;
    return new THREE.Vector3(0, 0, 0);
  }
}
