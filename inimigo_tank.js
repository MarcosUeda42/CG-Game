import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { TANK_CONFIG } from "./config.js";

const DURACAO_DANO_FALLBACK = 0.6;
const loaderModeloTank = new GLTFLoader();
const cacheModelosTank = new Map();

function normalizarAnimacoes(animacoes) {
  return animacoes.map((clipOriginal) => {
    const clip = clipOriginal.clone();

    const temposIniciais = clip.tracks
      .filter((track) => track.times.length > 0)
      .map((track) => track.times[0]);

    const inicio = temposIniciais.length > 0 ? Math.min(...temposIniciais) : 0;

    if (inicio !== 0) {
      for (const track of clip.tracks) {
        for (let i = 0; i < track.times.length; i++) {
          track.times[i] -= inicio;
        }
      }
    }

    clip.resetDuration();
    return clip;
  });
}

function carregarModeloTank(url) {
  if (!cacheModelosTank.has(url)) {
    const promessa = new Promise((resolve, reject) => {
      loaderModeloTank.load(
        url,
        (gltf) => {
          resolve({
            scene: gltf.scene,
            animations: normalizarAnimacoes(gltf.animations),
          });
        },
        undefined,
        reject,
      );
    });

    cacheModelosTank.set(url, promessa);
  }

  return cacheModelosTank.get(url);
}

export default class InimigoTank {
  static preload(url) {
    return carregarModeloTank(url);
  }

  constructor(
    url,
    scene,
    x,
    y,
    z,
    rotacaoY,
    valorPontos = TANK_CONFIG.recompensa,
    aoMorrer = null,
    aoAtacar = null,
    aoDesativar = null,
  ) {
    this.tipo = "tank";
    this.url = url;
    this.inimigo = null;
    this.pivot = new THREE.Group();
    this.ativo = false;
    this.mixer = null;
    this.scene = scene;
    this.currentAction = null;
    this.posX = x;
    this.posY = y;
    this.posZ = z;
    this.rotacaoY = rotacaoY;
    this.offsetVerticalModelo = 0;

    this.actions = {};
    this.damageMode = false;
    this.attackMode = false;
    this.ataqueResolvido = false;
    this.tempoDano = 0;
    this.tempoRecuperacaoAposDano = 0;
    this.direcaoAtaque = new THREE.Vector3(0, 0, 1);
    this.anguloAtaque = 0;
    this.tempoDesdeUltimoAtaque = Math.random() * TANK_CONFIG.ataque.cooldown;

    this.knockbackVel = new THREE.Vector3();
    this.forcaKnockback = TANK_CONFIG.knockback.forca;
    this.atritoKnockback = TANK_CONFIG.knockback.atrito;

    this.hitbox = new THREE.Box3();
    this.hitboxAtaque = new THREE.Box3();

    this.health = TANK_CONFIG.healthMax;
    this.healthMax = TANK_CONFIG.healthMax;
    this.removido = false;

    this.valorPontos = valorPontos;
    this.aoMorrer = aoMorrer;
    this.aoAtacar = aoAtacar;
    this.aoDesativar = aoDesativar;
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
    this.healthSprite.scale.set(1.8, 0.22, 1);

    this.desenharBarra();
  }

  desenharBarra() {
    const { ctx, canvas } = this;
    const ratio = Math.max(0, this.health) / this.healthMax;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#33333357";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle =
      ratio > 0.5 ? "#00ff00" : ratio > 0.25 ? "#fb8c00" : "#ff0000";
    ctx.fillRect(0, 0, canvas.width * ratio, canvas.height);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    this.texture.needsUpdate = true;
  }

  carregar() {
    return carregarModeloTank(this.url)
      .then((dados) => {
        if (this.removido) return;

        this.inimigo = SkeletonUtils.clone(dados.scene);
        this.inimigo.scale.setScalar(TANK_CONFIG.modelo.escala);
        this.inimigo.position.set(0, 0, 0);
        this.inimigo.rotation.set(0, 0, 0);

        this.pivot.position.set(this.posX, this.posY, this.posZ);
        this.pivot.rotation.set(0, this.rotacaoY, 0);
        this.pivot.add(this.inimigo);

        this.scene.add(this.pivot);
        this.scene.add(this.healthSprite);
        this.pivot.updateMatrixWorld(true);

        const caixa = new THREE.Box3().setFromObject(this.inimigo);

        this.offsetVerticalModelo = this.pivot.position.y - caixa.min.y;

        this.inimigo.position.y += this.offsetVerticalModelo;
        this.pivot.updateMatrixWorld(true);

        this.helper = new THREE.Box3Helper(this.hitbox, 0xff0000);
        this.hitboxAtaqueHelper = new THREE.Box3Helper(
          this.hitboxAtaque,
          0x00ffff,
        );
        this.hitboxAtaqueHelper.visible = false;
        this.scene.add(this.helper);
        this.scene.add(this.hitboxAtaqueHelper);

        this.mixer = new THREE.AnimationMixer(this.inimigo);
        dados.animations.forEach((clip) => {
          this.actions[clip.name] = this.mixer.clipAction(clip);
        });

        const acaoAtaque = this.actions[TANK_CONFIG.animacoes.attack];
        if (acaoAtaque) {
          acaoAtaque.setLoop(THREE.LoopOnce, 1);
          acaoAtaque.clampWhenFinished = true;
        }

        const acaoDano = this.actions[TANK_CONFIG.animacoes.damage];
        if (acaoDano) {
          acaoDano.setLoop(THREE.LoopOnce, 1);
          acaoDano.clampWhenFinished = true;
        }

        const acaoMorte = this.actions[TANK_CONFIG.animacoes.death];
        if (acaoMorte) {
          acaoMorte.setLoop(THREE.LoopOnce, 1);
          acaoMorte.clampWhenFinished = true;
        }

        this.mixer.addEventListener("finished", (e) => {
          if (e.action === this.actions[TANK_CONFIG.animacoes.attack])
            this.terminarAtaque();
          else if (e.action === this.actions[TANK_CONFIG.animacoes.damage])
            this.terminarDano();
          else if (e.action === this.actions[TANK_CONFIG.animacoes.death]) {
            this.desativar();
            if (typeof this.aoDesativar === "function") {
              this.aoDesativar(this);
            }
          }
        });

        this.desativar();
      })
      .catch((erro) => {
        console.error("Erro ao carregar modelo do Tank:", erro);
      });
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

  atualizar(target, delta) {
    if (!this.ativo) return;
    if (this.mixer) this.mixer.update(delta);
    if (!this.inimigo) return;

    if (this.health <= 0) {
      this.spriteMaterial.visible = false;
      this.esconderHitboxAtaque();
      this.mudarAnimacao(TANK_CONFIG.animacoes.death);
      this.atualizarHitbox();
      this.atualizarBarraVida();
      return;
    }

    if (!target) return;

    if (this.damageMode) {
      if (!this.actions[TANK_CONFIG.animacoes.damage]) {
        this.tempoDano -= delta;
        if (this.tempoDano <= 0) this.terminarDano();
      }

      this.pivot.position.addScaledVector(this.knockbackVel, delta);
      this.knockbackVel.multiplyScalar(Math.exp(-this.atritoKnockback * delta));
      this.atualizarHitbox();
      this.atualizarBarraVida();
      return;
    }

    if (this.tempoRecuperacaoAposDano > 0) {
      this.tempoRecuperacaoAposDano = Math.max(
        0,
        this.tempoRecuperacaoAposDano - delta,
      );
    }

    if (this.attackMode) {
      this.atualizarHitboxAtaque();
      this.verificarAtaque();
      this.atualizarHitbox();
      this.atualizarBarraVida();
      return;
    }

    const direcao = new THREE.Vector3()
      .subVectors(target, this.pivot.position)
      .setY(0);
    const distancia = direcao.length();
    const alcanceInicioAtaque =
      TANK_CONFIG.ataque.hitbox.distancia +
      TANK_CONFIG.ataque.hitbox.profundidade * 0.5 -
      TANK_CONFIG.ataque.margemInicioAtaque;

    this.tempoDesdeUltimoAtaque += delta;

    if (distancia > alcanceInicioAtaque) {
      direcao.normalize();

      const anguloAlvo = Math.atan2(direcao.x, direcao.z);

      let diferencaAngular = anguloAlvo - this.pivot.rotation.y;

      diferencaAngular = Math.atan2(
        Math.sin(diferencaAngular),
        Math.cos(diferencaAngular),
      );

      const fatorGiro = 1 - Math.exp(-8 * delta);

      this.pivot.rotation.y += diferencaAngular * fatorGiro;

      const anguloMinimoParaAndar = THREE.MathUtils.degToRad(20);

      if (Math.abs(diferencaAngular) <= anguloMinimoParaAndar) {
        this.pivot.position.addScaledVector(
          direcao,
          TANK_CONFIG.movimento.velocidade * delta,
        );

        this.mudarAnimacao(TANK_CONFIG.animacoes.walk);
      } else {
        this.mudarAnimacao(TANK_CONFIG.animacoes.idle);
      }
    } else {
      this.girarParaAlvo(target, delta);

      if (
        this.tempoDesdeUltimoAtaque >= TANK_CONFIG.ataque.cooldown &&
        this.tempoRecuperacaoAposDano <= 0 &&
        this.estaNaFrente(target, 40)
      ) {
        this.iniciarAtaque(target);
      } else {
        this.mudarAnimacao(TANK_CONFIG.animacoes.idle);
      }
    }

    this.atualizarHitbox();
    this.atualizarBarraVida();
  }

  estaNaFrente(alvoPos, anguloMaxGraus = 40) {
    const direcao = new THREE.Vector3().subVectors(
      alvoPos,
      this.pivot.position,
    );

    direcao.y = 0;

    if (direcao.lengthSq() < 0.0001) {
      return true;
    }

    direcao.normalize();

    const anguloAlvo = Math.atan2(direcao.x, direcao.z);

    let diferenca = anguloAlvo - this.pivot.rotation.y;

    diferenca = Math.atan2(Math.sin(diferenca), Math.cos(diferenca));

    return Math.abs(diferenca) <= THREE.MathUtils.degToRad(anguloMaxGraus);
  }

  girarParaAlvo(alvoPos, delta, velocidade = 6) {
    const direcao = new THREE.Vector3()
      .subVectors(alvoPos, this.pivot.position)
      .setY(0);
    if (direcao.lengthSq() < 0.0001) return;

    const anguloAlvo = Math.atan2(direcao.x, direcao.z);

    let diferenca = anguloAlvo - this.pivot.rotation.y;
    diferenca = Math.atan2(Math.sin(diferenca), Math.cos(diferenca));

    const fator = 1 - Math.exp(-velocidade * delta);
    this.pivot.rotation.y += diferenca * fator;
  }

  iniciarAtaque(target) {
    this.direcaoAtaque.subVectors(target, this.pivot.position).setY(0);

    if (this.direcaoAtaque.lengthSq() < 0.0001) return;

    this.direcaoAtaque.normalize();
    this.anguloAtaque = Math.atan2(this.direcaoAtaque.x, this.direcaoAtaque.z);

    this.attackMode = true;
    this.ataqueResolvido = false;
    this.mudarAnimacao(TANK_CONFIG.animacoes.attack);
  }

  atualizarHitboxAtaque() {
    if (!this.inimigo) return;

    const acaoAtaque = this.actions[TANK_CONFIG.animacoes.attack];
    const tempoAtaque = acaoAtaque?.time ?? 0;
    const ativa =
      tempoAtaque >= TANK_CONFIG.ataque.hitInicio &&
      tempoAtaque <= TANK_CONFIG.ataque.hitFim;

    if (!ativa) {
      this.esconderHitboxAtaque();
      return;
    }

    const cfg = TANK_CONFIG.ataque.hitbox;

    const centro = new THREE.Vector3(
      this.pivot.position.x,
      this.getYBase() + cfg.alturaCentro,
      this.pivot.position.z,
    );

    centro.x += this.direcaoAtaque.x * cfg.distancia;
    centro.z += this.direcaoAtaque.z * cfg.distancia;

    const sen = Math.sin(this.anguloAtaque);
    const cos = Math.cos(this.anguloAtaque);

    const tamanho = new THREE.Vector3(
      Math.abs(cos) * cfg.largura + Math.abs(sen) * cfg.profundidade,
      cfg.altura,
      Math.abs(sen) * cfg.largura + Math.abs(cos) * cfg.profundidade,
    );

    this.hitboxAtaque.setFromCenterAndSize(centro, tamanho);
    if (this.hitboxAtaqueHelper) this.hitboxAtaqueHelper.visible = true;
  }

  verificarAtaque() {
    if (this.ataqueResolvido) return;

    const acaoAtaque = this.actions[TANK_CONFIG.animacoes.attack];
    const tempoAtaque = acaoAtaque?.time ?? 0;
    if (
      tempoAtaque < TANK_CONFIG.ataque.hitInicio ||
      tempoAtaque > TANK_CONFIG.ataque.hitFim
    ) {
      return;
    }

    if (typeof this.aoAtacar === "function") {
      const acertou = this.aoAtacar(
        this.hitboxAtaque,
        this.getPosition(),
        TANK_CONFIG.ataque.dano,
      );

      if (acertou) {
        this.ataqueResolvido = true;
      }
    }
  }

  esconderHitboxAtaque() {
    this.hitboxAtaque.makeEmpty();
    if (this.hitboxAtaqueHelper) this.hitboxAtaqueHelper.visible = false;
  }

  terminarAtaque() {
    this.attackMode = false;
    this.ataqueResolvido = false;
    this.tempoDesdeUltimoAtaque = 0;
    this.esconderHitboxAtaque();
    this.mudarAnimacao(TANK_CONFIG.animacoes.idle);
  }

  dano(valor, origem = null) {
    if (!this.ativo || this.health <= 0 || this.removido) {
      return false;
    }

    this.health = Math.max(0, this.health - valor);
    this.desenharBarra();

    this.attackMode = false;
    this.ataqueResolvido = false;
    this.esconderHitboxAtaque();

    if (this.health <= 0) {
      this.damageMode = false;
      this.registrarMorte();
      this.mudarAnimacao(TANK_CONFIG.animacoes.death);
      return true;
    }

    this.damageMode = true;

    if (origem && this.pivot) {
      this.knockbackVel.subVectors(this.pivot.position, origem).setY(0);
      if (this.knockbackVel.lengthSq() > 0.0001)
        this.knockbackVel.normalize().multiplyScalar(this.forcaKnockback);
      else this.knockbackVel.set(0, 0, 0);
    }

    if (this.actions[TANK_CONFIG.animacoes.damage]) {
      this.mudarAnimacao(TANK_CONFIG.animacoes.damage);
      const acaoDano = this.actions[TANK_CONFIG.animacoes.damage];
      if (acaoDano) {
        acaoDano.setEffectiveTimeScale(TANK_CONFIG.animacoes.velocidadeDamage);
      }
    } else this.tempoDano = DURACAO_DANO_FALLBACK;

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
    this.tempoRecuperacaoAposDano = TANK_CONFIG.ataque.recuperacaoAposDano;
    this.mudarAnimacao(TANK_CONFIG.animacoes.idle);
  }

  atualizarHitbox() {
    if (!this.inimigo) return;

    const cfg = TANK_CONFIG.hitboxCorpo;

    const centro = new THREE.Vector3(
      this.pivot.position.x,
      this.getYBase() + cfg.alturaCentro,
      this.pivot.position.z,
    );

    const tamanho = new THREE.Vector3(
      cfg.largura,
      cfg.altura,
      cfg.profundidade,
    );

    this.hitbox.setFromCenterAndSize(centro, tamanho);
  }

  atualizarBarraVida() {
    if (!this.healthSprite || !this.inimigo) return;

    const caixa = this.hitbox;

    if (caixa.isEmpty()) return;

    const centroX = (caixa.min.x + caixa.max.x) * 0.5;
    const centroZ = (caixa.min.z + caixa.max.z) * 0.5;

    this.healthSprite.position.set(centroX, caixa.max.y + 0.25, centroZ);
  }

  ativar(x, y, z) {
    this.ativo = true;
    this.removido = false;
    this.health = TANK_CONFIG.healthMax;
    this.healthMax = TANK_CONFIG.healthMax;

    this.damageMode = false;
    this.attackMode = false;
    this.ataqueResolvido = false;
    this.tempoDesdeUltimoAtaque = 0;
    this.tempoRecuperacaoAposDano = 0;
    this.tempoDano = 0;

    this.knockbackVel.set(0, 0, 0);
    this.direcaoAtaque.set(0, 0, 1);
    this.anguloAtaque = 0;
    this.morteContabilizada = false;

    this.hitbox.makeEmpty();
    this.hitboxAtaque.makeEmpty();

    this.pivot.position.set(x, y, z);
    this.pivot.rotation.set(0, 0, 0);
    this.pivot.visible = true;
    this.healthSprite.visible = true;

    if (this.spriteMaterial) {
      this.spriteMaterial.visible = true;
    }
    if (this.helper) {
      this.helper.visible = true;
    }
    if (this.hitboxAtaqueHelper) {
      this.hitboxAtaqueHelper.visible = false;
    }

    this.desenharBarra();

    if (this.mixer) {
      this.mixer.stopAllAction();
    }

    if (this.actions[TANK_CONFIG.animacoes.idle]) {
      this.currentAction = this.actions[TANK_CONFIG.animacoes.idle];
      this.currentAction.reset();
      this.currentAction.play();
    }

    this.atualizarHitbox();
    this.atualizarBarraVida();
  }

  desativar() {
    this.ativo = false;
    this.attackMode = false;
    this.damageMode = false;
    this.knockbackVel.set(0, 0, 0);

    this.hitbox.makeEmpty();
    this.hitboxAtaque.makeEmpty();

    if (this.pivot) {
      this.pivot.visible = false;
    }
    if (this.healthSprite) {
      this.healthSprite.visible = false;
    }
    if (this.helper) {
      this.helper.visible = false;
    }
    if (this.hitboxAtaqueHelper) {
      this.hitboxAtaqueHelper.visible = false;
    }
  }

  remover() {
    if (this.removido) return;
    this.removido = true;
    this.ativo = false;
    this.attackMode = false;
    this.damageMode = false;
    this.esconderHitboxAtaque();

    if (this.mixer && this.inimigo) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.inimigo);
    }

    if (this.pivot) {
      this.scene.remove(this.pivot);
    }
    this.inimigo = null;

    if (this.helper) this.scene.remove(this.helper);
    if (this.hitboxAtaqueHelper) this.scene.remove(this.hitboxAtaqueHelper);
    if (this.healthSprite) {
      this.scene.remove(this.healthSprite);
    }
    this.hitbox.makeEmpty();

    this.texture.dispose();
    this.spriteMaterial.dispose();
  }

  getPosition() {
    return this.pivot.position.clone();
  }

  getYBase() {
    if (!this.pivot) return this.posY;

    return this.pivot.position.y;
  }

  isDead() {
    return this.health <= 0;
  }
}
