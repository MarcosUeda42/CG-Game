import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Projetil from "./projetil.js";
import Particulas from "./particulas.js";

const ESCALA_MODELO = 0.0085;
const DURACAO_DANO_FALLBACK = 0.6;

export default class Inimigo {
  constructor(
    url,
    scene,
    x,
    y,
    z,
    rotacaoY,
    valorPontos = 100,
    aoMorrer = null,
  ) {
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
    this.velocidade = 2.5;
    this.distanciaMinima = 2;

    this.damageMode = false;
    this.attackMode = false;
    this.tempoDano = 0;

    this.knockbackVel = new THREE.Vector3();
    this.forcaKnockback = 6;
    this.atritoKnockback = 8;

    this.cooldownAtaque = 6.0;
    this.tempoDesdeUltimoAtaque = Math.random() * 2.0;
    this.distanciaDisparo = 15;

    this.hitbox = new THREE.Box3();
    this.offsetHitbox = new THREE.Vector3(0, 0, 0);
    this.tamanhoHitbox = new THREE.Vector3(0.6, 1.8, 0.6);

    this.actions = {};

    this.health = 100;
    this.healthMax = 100;
    this.removido = false;

    this.valorPontos = valorPontos;
    this.aoMorrer = aoMorrer;
    this.morteContabilizada = false;

    this.canvas = document.createElement("canvas");
    this.canvas.width = 256;
    this.canvas.height = 32;
    this.ctx = this.canvas.getContext("2d");

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;

    this.spriteMaterial = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      depthTest: false,
    });
    this.healthSprite = new THREE.Sprite(this.spriteMaterial);
    this.healthSprite.renderOrder = 999;

    this.healthSprite.scale.set(1.5 / ESCALA_MODELO, 0.19 / ESCALA_MODELO, 1);
    this.healthSprite.position.set(0, 1.0 / ESCALA_MODELO, 0); // ajuste a altura aqui

    this.particulas = new Particulas(scene);
    this.carregandoMagia = false;
    this.mao = null;
    this._posMao = new THREE.Vector3();
    this.offsetMao = new THREE.Vector3(0, 0, 15);

    this.desenharBarra();
  }
  desenharBarra() {
    const { ctx, canvas } = this;
    const ratio = Math.max(0, this.health) / this.healthMax;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // fundo
    ctx.fillStyle = "#33333357";
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
  dano(valor, origem = null) {
    if (this.health <= 0 || this.damageMode) return false;

    this.health = Math.max(0, this.health - valor);
    this.desenharBarra();

    if (this.health <= 0) {
      this.registrarMorte();
      return true;
    }

    this.damageMode = true;
    this.carregandoMagia = false;

    if (origem && this.inimigo) {
      this.knockbackVel.subVectors(this.inimigo.position, origem).setY(0);

      if (this.knockbackVel.lengthSq() > 0.0001)
        this.knockbackVel.normalize().multiplyScalar(this.forcaKnockback);
      else this.knockbackVel.set(0, 0, 0);
    }

    if (this.actions["Damage"]) this.mudarAnimacao("Damage");
    else this.tempoDano = DURACAO_DANO_FALLBACK;
    return true;
  }
  registrarMorte() {
    if (this.morteContabilizada) return;

    this.morteContabilizada = true;

    if (typeof this.aoMorrer === "function") {
      this.aoMorrer(this.valorPontos, this);
    }
  }
  terminarDano() {
    this.damageMode = false;
    this.knockbackVel.set(0, 0, 0);
    this.mudarAnimacao("Idle");
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
      if (this.removido) return;

      this.inimigo = gltf.scene;
      this.inimigo.scale.setScalar(ESCALA_MODELO);
      this.inimigo.position.set(this.posX, this.posY, this.posZ);
      this.inimigo.add(this.healthSprite);

      this.scene.add(this.inimigo);

      this.mao = this.inimigo.getObjectByName("mixamorigRightHand");

      this.helper = new THREE.Box3Helper(this.hitbox, 0xff0000);
      this.scene.add(this.helper);

      this.mixer = new THREE.AnimationMixer(this.inimigo);
      gltf.animations.forEach((clip) => {
        this.actions[clip.name] = this.mixer.clipAction(clip);
      });

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

      const acaoDisparo = this.actions["MagicAttack"];
      if (acaoDisparo) {
        acaoDisparo.setLoop(THREE.LoopOnce, 1);
        acaoDisparo.clampWhenFinished = true;
      }

      // quando a animação de dano termina, sai do damageMode
      this.mixer.addEventListener("finished", (e) => {
        if (e.action === this.actions["Damage"]) this.terminarDano();
        else if (e.action === this.actions["Death"]) this.remover();
        else if (e.action === this.actions["MagicAttack"])
          this.terminarDisparo();
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
    this.carregandoMagia = false;
    this.attackMode = false;

    if (this.inimigo) {
      this.scene.remove(this.inimigo); // a sprite sai junto
      this.inimigo.traverse((obj) => {
        if (!obj.isMesh) return;
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m.dispose());
      });
    }
    if (this.helper) this.scene.remove(this.helper);
    this.hitbox.makeEmpty();

    if (this.particulas) {
      this.particulas.dispose();
      this.particulas = null;
    }

    this.texture.dispose();
    this.spriteMaterial.dispose();
  }
  atualizar(target, delta, listaProjeteis) {
    if (this.mixer) this.mixer.update(delta);
    
    if (this.particulas) {
      this.particulas.atualizar(delta);

      if (this.carregandoMagia && this.inimigo) {
        this.particulas.convergir(this.getPosicaoMao(), 2, 0.5, 0.25);
      }
    }


    if (this.health <= 0) {
      this.spriteMaterial.visible = false;
      this.mudarAnimacao("Death");
      return;
    }

    if (!this.inimigo || !target) return;

    if (this.damageMode) {
      if (!this.actions["Damage"]) {
        this.tempoDano -= delta;
        if (this.tempoDano <= 0) this.terminarDano();
      }
      this.inimigo.position.addScaledVector(this.knockbackVel, delta);
      this.knockbackVel.multiplyScalar(Math.exp(-this.atritoKnockback * delta));

      this.atualizarHitbox();
      return;
    }

    if (this.attackMode) return;

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

    this.tempoDesdeUltimoAtaque += delta;
    const dist = this.inimigo.position.distanceTo(target);
    if (
      dist <= this.distanciaDisparo &&
      this.tempoDesdeUltimoAtaque >= this.cooldownAtaque
    ) {
      if (this.estaNaFrente(target)) {
        this.dispararBolaDeFogo(target, listaProjeteis);
        this.tempoDesdeUltimoAtaque = 0;
      } else this.girarParaAlvo(target, delta);
    }

    this.atualizarHitbox();
  }
  estaNaFrente(alvoPos, anguloMaxGraus = 60) {
    const frente = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(this.inimigo.quaternion)
      .setY(0)
      .normalize();

    const paraAlvo = new THREE.Vector3()
      .subVectors(alvoPos, this.inimigo.position)
      .setY(0)
      .normalize();

    const limite = Math.cos(THREE.MathUtils.degToRad(anguloMaxGraus));
    return frente.dot(paraAlvo) >= limite;
  }
  atualizarHitbox() {
    if (this.health <= 0 || !this.inimigo) return;

    const centro = this.inimigo.position.clone();
    centro.add(this.offsetHitbox);

    const metade = this.tamanhoHitbox.clone().multiplyScalar(0.5);

    this.hitbox.min.copy(centro).sub(metade);
    this.hitbox.max.copy(centro).add(metade);
  }
  terminarDisparo() {
    this.attackMode = false;
    this.mudarAnimacao("Idle");
  }
  girarParaAlvo(alvoPos, delta, velocidade = 6) {
    const direcao = new THREE.Vector3()
      .subVectors(alvoPos, this.inimigo.position)
      .setY(0);
    if (direcao.lengthSq() < 0.0001) return;

    const anguloAlvo = Math.atan2(direcao.x, direcao.z);
    const quatAlvo = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      anguloAlvo,
    );

    this.inimigo.quaternion.slerp(quatAlvo, Math.min(1, velocidade * delta));
  }
  dispararBolaDeFogo(alvoPos, listaProjeteis) {
    const ATRASO_MS = 300;

    this.attackMode = true;
    this.carregandoMagia = true;
    this.mudarAnimacao("MagicAttack");

    const alvoTravado = alvoPos.clone();
    setTimeout(() => {
      this.carregandoMagia = false;

      if (!this.attackMode || this.damageMode || this.health <= 0) return;

      const origem = this.getPosicaoMao(new THREE.Vector3());

      const alvo = alvoTravado.setY(origem.y);
      const direcao = new THREE.Vector3().subVectors(alvo, origem);
      if (direcao.lengthSq() < 0.0001) return;

      const anguloDesvio = (Math.random() - 0.5) * Math.PI * 0.1;
      direcao
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), anguloDesvio)
        .normalize();

      this.particulas.explosao(origem, 25, 2.5, 0.5);
      listaProjeteis.push(new Projetil(this.scene, origem, direcao));
    }, ATRASO_MS);
  }
  isDead() {
    return this.health <= 0;
  }
  getPosicaoMao(destino = this._posMao) {
    if (this.mao) {
      // converte o offset local do osso para o mundo (acompanha a rotação da mão)
      destino.copy(this.offsetMao);
      this.mao.localToWorld(destino);
    } else {
      destino.copy(this.inimigo.position).setY(1);
    }
    return destino;
  }
}
