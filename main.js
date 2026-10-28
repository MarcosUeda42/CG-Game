import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// classe do Renderizador (WebGL)
class Renderer{
    constructor(){
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);
    }

    //
    draw(scene, camera){
        this.renderer.render(scene, camera)
    }
    
}

// classe da camera define perspectiva e posição
class Camera{
    constructor(){
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(10, 10, 10);
        this.camera.lookAt(0, 0, 0);
    }

    setPosition(x,y,z){
        this.camera.position.set(x,y,z);
    }

    setLook(x,y,z){
        this.camera.lookAt(x,y,z);
    }
}


// classe do cenario, terreno + iluminação
class Cenario{
    constructor(scene){
        this.scene = scene;
    }

    criarTerreno(){

        // define uma geometria plana e o material
        const geometria = new THREE.PlaneGeometry(50,50);
        const material = new THREE.MeshStandardMaterial({
            color: 0x008000,
            side: THREE.DoubleSide
        });

        const terreno = new THREE.Mesh(geometria, material);
        
        // Rotacionando para ficar horizontal
        terreno.rotation.x = -Math.PI / 2;
        this.scene.add(terreno);
    }

    criarIluminacao() {
        const luzAmbiente = new THREE.AmbientLight(0xffffff, 1);

        this.scene.add(luzAmbiente);
    }

    renderizar() {
        this.criarTerreno();
        this.criarIluminacao();
    }
}


// Inicialização das classes e loop de animação
class Jogo {
    constructor() {
        // inicializa a cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('skyblue');

        // inicializa a camera e renderizador
        this.camera = new Camera();
        this.renderer = new Renderer();

        // inicializa o cenario
        this.cenario = new Cenario(this.scene);

        // inicializa o personagem
        this.personagem = new Personagem("./personagem.fbx", this.scene);
    }
    
    iniciar() {
        this.cenario.renderizar();
        this.personagem.carregar();
        this.animar();
    }

    animar = () => {
        requestAnimationFrame(this.animar);

        // animação do personagem
        this.personagem.atualizar();

        this.renderer.draw(this.scene,this.camera.camera);
    };
}

// Carrega o modelo FBX (Mixamo)
class Personagem {
    constructor(url, scene){
        this.personagem = null;
        this.url = url
        this.loader = new FBXLoader()
        this.mixer = null;
        this.scene = scene;
        // clock para medir o tempo entre atualização da animação
        this.clock = new THREE.Clock();
    }

    carregar(){
        this.loader.load(this.url,
        
            (personagem) => {
                this.personagem = personagem;
                personagem.scale.setScalar(0.01);
                personagem.position.set(0, 0, 0);
                this.scene.add(personagem);

                this.mixer = new THREE.AnimationMixer(personagem);
                const animacao = personagem.animations[0] 
                        
                if (animacao) {
                    this.mixer.clipAction(animacao).play();
                }

            },
            () => {
                console.log("Carregando");
            },
            (erro) => {
                console.error('Erro ao carregar personagem:', erro);
            }
        )
    }

    // atualiza com base no clock
    atualizar() {
        if (this.mixer) {
            this.mixer.update(this.clock.getDelta());
        }
    }
}

const jogo = new Jogo();
jogo.iniciar();