import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
        this.camera.position.set(10, 10, 20);
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

    criarMontanha() {
    const loader = new GLTFLoader();
        
        // https://poly.pizza/m/OQvi8PIZ40
        loader.load('./Rocks by Quaternius - OQvi8PIZ40.glb', (gltf) => {
        const montanha = gltf.scene;

        const montanha1 = montanha.clone()
        montanha1.position.set(0, 0, -25);
        montanha1.scale.setScalar(100);
        this.scene.add(montanha1);

        const montanha2 = montanha.clone()
        montanha2.position.set(-20, -10, 0);
        montanha2.scale.setScalar(200);
        this.scene.add(montanha2);

        const montanha3 = montanha.clone()
        montanha3.position.set(0, -5, 30);
        montanha3.scale.setScalar(150);
        this.scene.add(montanha3);

        const montanha4 = montanha.clone()
        montanha4.position.set(30, -2, -5);
        montanha4.rotation.y = -Math.PI ;
        montanha4.scale.setScalar(150);
        this.scene.add(montanha4);
    });
    }

    criarArvores(){
        const loader = new GLTFLoader();
        
        // https://poly.pizza/m/s6yZuyU2y5
        loader.load('./Tree by MaverickFX - s6yZuyU2y5.glb', (gltf) => {
        const arvore = gltf.scene;

        const arvore1 = arvore.clone()
        arvore1.position.set(-10, 2, -10);
        arvore1.scale.setScalar(3);
        this.scene.add(arvore1);

        const arvore2 = arvore.clone()
        arvore2.position.set(-8, 2, -13);
        arvore2.scale.setScalar(1);
        this.scene.add(arvore2);

        const arvore3 = arvore.clone()
        arvore3.position.set(-15, 2, -10);
        arvore3.scale.setScalar(2);
        this.scene.add(arvore3);

        const arvore4 = arvore.clone()
        arvore4.position.set(10, 2, -20);
        arvore4.scale.setScalar(3);
        this.scene.add(arvore4);

        const arvore5 = arvore.clone()
        arvore5.position.set(15, 2, -10);
        arvore5.scale.setScalar(3);
        this.scene.add(arvore5);
        })
    }

    renderizar() {
        this.criarTerreno();
        this.criarIluminacao();
        this.criarMontanha();
        this.criarArvores();
    }
}


// Inicialização das classes e loop de animação
// Personagem importado do MIXAMO Paladin W + Crouched Walking https://www.mixamo.com/#/
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