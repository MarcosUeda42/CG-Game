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
    this.angulo = 0;
    this.raio = [14, 10];
    this.altura = [30, 4];

    this.modo = 0;
    //this.atualizarPosicao();
  }

  atualizarPosicao(pos) {
    const r = this.raio[this.modo];
    const a = this.altura[this.modo];

    this.camera.position.x = pos.x + r * Math.sin(this.angulo);
    this.camera.position.z = pos.z + r * Math.cos(this.angulo);
    this.camera.position.y = pos.y + a;

    // camera olha para o personagem
    this.camera.lookAt(pos.x, pos.y, pos.z);
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
    this.hitboxesParedes = [];
  }

  criarTerreno() {
    // define uma geometria plana e o material
    const geometria = new THREE.PlaneGeometry(100, 100);
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
    const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.1);

    this.scene.add(luzAmbiente);
  }

  adicionarModelo(modelo, x, y, z, escala, rotacaoY = 0) {
    const clone = modelo.clone();

    clone.position.set(x, y, z);
    clone.scale.setScalar(escala);
    clone.rotation.y = rotacaoY;

    this.scene.add(clone);

    return clone;
  }

  criarMontanha() {
    const loader = new GLTFLoader();

    // https://poly.pizza/m/OQvi8PIZ40
    loader.load("./Rocks by Quaternius - OQvi8PIZ40.glb", (gltf) => {
      const montanha = gltf.scene;

      // modelo, x, y, z, escala, rotação Y
      this.adicionarModelo(montanha, 0, 0, -45, 100);
      this.adicionarModelo(montanha, -30, -10, 0, 200);
      this.adicionarModelo(montanha, 0, -5, 50, 150);
      this.adicionarModelo(montanha, 50, -2, -5, 150, -Math.PI);
    });
  }

  criarArvores() {
    const loader = new GLTFLoader();

    // https://poly.pizza/m/s6yZuyU2y5
    loader.load("./Tree by MaverickFX - s6yZuyU2y5.glb", (gltf) => {
      const arvore = gltf.scene;

      //modelo, x, y, z, escala
      this.adicionarModelo(arvore, -10, 2, -10, 3);
      this.adicionarModelo(arvore, -8, 1, -13, 1);
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

  adicionarTocha(tocha, x, y, z) {
    this.adicionarModelo(tocha, x, y, z, 0.75);

    const luzTocha = new THREE.PointLight(0xff6600, 30);
    luzTocha.position.set(x, y + 2.5, z);

    this.scene.add(luzTocha);
  }

  criarTochas() {
    const loader = new GLTFLoader();

    // https://poly.pizza/m/pNsfJzhXiD
    loader.load("./Wooden Torch by Quaternius - pNsfJzhXiD.glb", (gltf) => {
      const tocha = gltf.scene;

      this.adicionarTocha(tocha, -18, 0, 3, 0.75);
      this.adicionarTocha(tocha, -3, 0, -8, 0.75);
      this.adicionarTocha(tocha, -7, 0, 9, 0.75);
      this.adicionarTocha(tocha, 6, 0, -6, 0.75);
      this.adicionarTocha(tocha, 4, 0, 8, 0.75);
    });
  }

  criarGrama() {
    const loader = new GLTFLoader();

    // https://poly.pizza/m/vUJjrRsFp4
    loader.load("./Grass by Quaternius - vUJjrRsFp4.glb", (gltf) => {
      const grama = gltf.scene;

      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 50 - 25;
        const z = Math.random() * 50 - 25;
        const escala = 0.8 + Math.random() * 0.7;

        this.adicionarModelo(grama, x, 0, z, escala);
      }
    });
  }

  criarParede() {
    const loader = new GLTFLoader();

    // https://poly.pizza/m/5d80r2XX3O
    loader.load(
      "./Wall Towers Door Seco by Quaternius - 5d80r2XX3O.glb",
      (gltf) => {
        const parede = gltf.scene;

        const paredes = [
          this.adicionarModelo(parede, 0, 0, -25, 25),
          this.adicionarModelo(parede, 0, 0, 25, 25),
          this.adicionarModelo(parede, 25, 0, 0, 25, -Math.PI / 2),
          this.adicionarModelo(parede, -25, 0, 0, 25, -Math.PI / 2),
        ];

        paredes.forEach((obj) => {
          obj.updateMatrixWorld(true);

          const hitbox = new THREE.Box3().setFromObject(obj);

          this.hitboxesParedes.push(hitbox);
          console.log("Hitbox:", hitbox);
          const helper = new THREE.Box3Helper(hitbox, 0x00ff00);
          this.scene.add(helper);
        });
      },
    );
  }

  renderizar() {
    this.criarTerreno();
    this.criarIluminacao();
    this.criarMontanha();
    this.criarArvores();
    this.criarTochas();
    this.criarGrama();
    this.criarParede();
  }
}

// Inicialização das classes e loop de animação
// Personagem importado do MIXAMO Paladin W + Crouched Walking https://www.mixamo.com/#/
// Inimigo Maynard + Magic Attack 01 (não é mais usado)
class Jogo {
  constructor() {
    // inicializa a cena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("midnightblue");

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
      this.cenario
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

    if (this.controles.teclas["KeyQ"]) {
      this.camera.orbitarEsquerda();
    } else if (this.controles.teclas["KeyE"]) {
      this.camera.orbitarDireita();
    }

    if (this.controles.teclas["KeyC"]) {
      this.camera.modo = (this.camera.modo + 1) % 2;
      this.controles.teclas["KeyC"] = false;
    }

    this.personagem.atualizar();

    // animação do inimigo
    this.inimigo1.atualizar(this.personagem.personagem);

    const position = this.personagem.position();

    this.camera.atualizarPosicao(position);

    this.renderer.draw(this.scene, this.camera.camera);
  };
}

const jogo = new Jogo();
jogo.iniciar();
