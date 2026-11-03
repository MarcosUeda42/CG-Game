import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default class Personagem {
  constructor(url, scene, controles) {
    this.personagem = null;
    this.url = url;
    this.controles = controles;
    this.loader = new GLTFLoader();
    this.mixer = null;
    this.scene = scene;
    this.actions = {};
    this.currentAction = null;
    this.clock = new THREE.Clock();
    this.velocidade = 3;
    this.velocidadeGiro = 10;
    this.hitbox = new THREE.Box3();
    this.direcoes = {
      KeyW: new THREE.Vector3(0, 0, -1),
      KeyS: new THREE.Vector3(0, 0, 1),
      KeyA: new THREE.Vector3(-1, 0, 0),
      KeyD: new THREE.Vector3(1, 0, 0),
    };
  }

  carregar() {
    this.loader.load(
      this.url,
      (gltf) => {
        this.personagem = gltf.scene;
        this.personagem.scale.setScalar(0.01); // ajuste se necessário (ex.: 0.01 para FBX)
        this.personagem.position.set(1, 1, 1);
        this.scene.add(this.personagem);
        
        this.hitbox = new THREE.Box3();
        this.personagem.updateMatrixWorld(true);

        this.helper = new THREE.Box3Helper(this.hitbox, 0xff0000);
        this.scene.add(this.helper);

        this.mixer = new THREE.AnimationMixer(this.personagem);

        gltf.animations.forEach((clip) => {
          this.actions[clip.name] = this.mixer.clipAction(clip);
        });

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
      
      // tirei do cláudio
      const fator = 1 - Math.exp(-this.velocidadeGiro * delta);
      this.personagem.rotation.y += diferenca * fator;
      
      this.mudarAnimacao("Walk");
    } else this.mudarAnimacao("Idle");
    this.hitbox = this.hitbox.setFromObject(this.personagem);
  }
  
  position(){
    if (this.personagem) return this.personagem.position;
    return new THREE.Vector3(0, 0, 0);
  }
}
