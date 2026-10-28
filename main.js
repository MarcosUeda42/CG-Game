import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class Controles {
    constructor() {
        this.teclas = {};
        window.addEventListener('keydown', (e) => this.teclas[e.code] = true);
        window.addEventListener('keyup', (e) => this.teclas[e.code] = false);
    }
}

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
        this.angulo = Math.PI / 4;
        this.raio = 14.14;         
        this.altura = 10;

        this.atualizarPosicao();
    }

    atualizarPosicao() {
        this.camera.position.x = this.raio * Math.sin(this.angulo);
        this.camera.position.z = this.raio * Math.cos(this.angulo);
        this.camera.position.y = this.altura;
        
        // fixa camera no centro(talvez ajustar dps para seguir o personagem)
        this.camera.lookAt(0, 0, 0);
    }

    orbitarEsquerda(velocidade = 0.03) {
        this.angulo -= velocidade;
        this.atualizarPosicao();
    }

    orbitarDireita(velocidade = 0.03) {
        this.angulo += velocidade;
        this.atualizarPosicao();
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

        const luzPontual = new THREE.PointLight(0xffffff, 100);
        luzPontual.position.set(0, 5, 0);

        this.scene.add(luzPontual);
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

    adicionarArvore(modelo, x, y, z, escala) {
        const arvore = modelo.clone();

        arvore.position.set(x, y, z);
        arvore.scale.setScalar(escala);

        this.scene.add(arvore);
    }

    criarArvores(){
        const loader = new GLTFLoader();
        
        // https://poly.pizza/m/s6yZuyU2y5
        loader.load('./Tree by MaverickFX - s6yZuyU2y5.glb', (gltf) => {
        const arvore = gltf.scene;

            //modelo, x, y, z, escala
            this.adicionarArvore(arvore, -10, 2, -10, 3);
            this.adicionarArvore(arvore, -8, 2, -13, 1);
            this.adicionarArvore(arvore, -15, 2, -10, 2);
            this.adicionarArvore(arvore, 10, 2, -20, 3);
            this.adicionarArvore(arvore, 15, 2, -10, 3);
            this.adicionarArvore(arvore, 15, 2, -15, 2);
            this.adicionarArvore(arvore, -5, 0, -2, 1);
            this.adicionarArvore(arvore, -5, 0, -2, 1);
            this.adicionarArvore(arvore, 9, 0, 5, 1);
            this.adicionarArvore(arvore, 10, 0, 10, 2);
            this.adicionarArvore(arvore, -10, 2, 10, 3);
            this.adicionarArvore(arvore, -14, 2, 5, 2.5);
        
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
// Inimigo Maynard + Magic Attack 01
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

        this.inimigo1 = new Inimigo("./inimigo.fbx", this.scene, 0, 0, 5, Math.PI); // rotação em 180

        // inicializa os controles
        this.controles = new Controles();
    }
    
    iniciar() {
        this.cenario.renderizar();
        this.inimigo1.carregar();
        this.personagem.carregar();
        this.animar();
    }

    animar = () => {
        requestAnimationFrame(this.animar);

        // animação da câmera
        if (this.controles.teclas['ArrowLeft']) {
            this.camera.orbitarEsquerda();
        }
        if (this.controles.teclas['ArrowRight']) {
            this.camera.orbitarDireita();
        }

        // animação do personagem
        this.personagem.atualizar();

        // animação do inimigo
        this.inimigo1.atualizar();

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

    class Inimigo {
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

const jogo = new Jogo();
jogo.iniciar();