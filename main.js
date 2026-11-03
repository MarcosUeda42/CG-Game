import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Personagem from "./personagem.js";
import Inimigo from "./inimigo.js";

class Controles {
  constructor() {
    this.teclas = {};
    window.addEventListener("keydown", (e) => (this.teclas[e.code] = true));
    window.addEventListener("keyup", (e) => (this.teclas[e.code] = false));
  }
}

// classe do Renderizador (WebGL)
class Renderer {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }

  //
  draw(scene, camera) {
    this.renderer.render(scene, camera);
  }
}

// classe da camera define perspectiva e posição
class Camera {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
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
class Cenario {
  constructor(scene) {
    this.scene = scene;
  }

  criarTerreno() {
    // define uma geometria plana e o material
    const geometria = new THREE.PlaneGeometry(50, 50);
    const material = new THREE.MeshStandardMaterial({
      color: 0x008000,
      side: THREE.DoubleSide,
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

  adicionarModelo(modelo, x, y, z, escala, rotacaoY = 0) {
    const clone = modelo.clone();

    clone.position.set(x, y, z);
    clone.scale.setScalar(escala);
    clone.rotation.y = rotacaoY;

    this.scene.add(clone);
  }

  criarMontanha() {
    const loader = new GLTFLoader();

    // https://poly.pizza/m/OQvi8PIZ40
    loader.load("./Rocks by Quaternius - OQvi8PIZ40.glb", (gltf) => {
      const montanha = gltf.scene;

      // modelo, x, y, z, escala, rotação Y
      this.adicionarModelo(montanha, 0, 0, -25, 100);
      this.adicionarModelo(montanha, -20, -10, 0, 200);
      this.adicionarModelo(montanha, 0, -5, 30, 150);
      this.adicionarModelo(montanha, 30, -2, -5, 150, -Math.PI);
    });
  }

  criarArvores() {
    const loader = new GLTFLoader();

    // https://poly.pizza/m/s6yZuyU2y5
    loader.load("./Tree by MaverickFX - s6yZuyU2y5.glb", (gltf) => {
      const arvore = gltf.scene;

      //modelo, x, y, z, escala
      this.adicionarModelo(arvore, -10, 2, -10, 3);
      this.adicionarModelo(arvore, -8, 2, -13, 1);
      this.adicionarModelo(arvore, -15, 2, -10, 2);
      this.adicionarModelo(arvore, 10, 2, -20, 3);
      this.adicionarModelo(arvore, 15, 2, -10, 3);
      this.adicionarModelo(arvore, 15, 2, -15, 2);
      this.adicionarModelo(arvore, -5, 0, -2, 1);
      this.adicionarModelo(arvore, -5, 0, -2, 1);
      this.adicionarModelo(arvore, 9, 0, 5, 1);
      this.adicionarModelo(arvore, 10, 0, 10, 2);
      this.adicionarModelo(arvore, -10, 2, 10, 3);
      this.adicionarModelo(arvore, -14, 2, 5, 2.5);
    });
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
    this.scene.background = new THREE.Color("skyblue");

    // inicializa a camera e renderizador
    this.camera = new Camera();
    this.renderer = new Renderer();

    // inicializa o cenario
    this.cenario = new Cenario(this.scene);

    // inicializa os controles
    this.controles = new Controles();

    // inicializa o personagem
    this.personagem = new Personagem(
      "./personagem/model.glb",
      this.scene,
      this.controles,
    );

    this.inimigo1 = new Inimigo("./inimigo.fbx", this.scene, 0, 0, 5, Math.PI); // rotação em 180
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
    /*
        if (this.controles.teclas['ArrowLeft']) {
            this.camera.orbitarEsquerda();
        }
        else if (this.controles.teclas['ArrowRight']) {
            this.camera.orbitarDireita();
        }
        */

    this.personagem.atualizar();

    // animação do inimigo
    this.inimigo1.atualizar();

    const position = this.personagem.position();
    this.camera.camera.lookAt(position.x, position.y, position.z);

    this.renderer.draw(this.scene, this.camera.camera);
  };
}

const jogo = new Jogo();
jogo.iniciar();
