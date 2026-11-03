import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import * as THREE from 'three';

export default class Inimigo {
    constructor(url, scene, x, y, z, rotacaoY) {
        this.inimigo = null;
        this.url = url;
        this.loader = new FBXLoader();
        this.mixer = null;
        this.scene = scene;
        this.clock = new THREE.Clock();

        this.posX = x;
        this.posY = y;
        this.posZ = z;
        this.rotacaoY = rotacaoY;
    }
    
    carregar() {
        this.loader.load(this.url,
            (inimigo) => {
                this.inimigo = inimigo;
                inimigo.scale.setScalar(0.01);
                inimigo.position.set(this.posX, this.posY, this.posZ);
                inimigo.rotation.y = this.rotacaoY;
                this.scene.add(inimigo);

                this.mixer = new THREE.AnimationMixer(inimigo);
                const animacao = inimigo.animations[0];

                if (animacao) {
                    this.mixer.clipAction(animacao).play();
                }
            },
            () => {
                console.log("Carregando inimigo");
            },
            (erro) => {
                console.error('Erro ao carregar inimigo:', erro);
            }
        );
    }

    atualizar() {
        if (this.mixer) {
            this.mixer.update(this.clock.getDelta());
        }
    }
}