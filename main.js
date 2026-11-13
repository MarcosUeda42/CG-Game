import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Personagem from "./personagem.js";
import Camera from "./camera.js";
import Inimigo from "./inimigo.js";
import Controles from "./controles.js";
import Renderer from "./renderer.js";
import UI from "./ui.js";

// classe do cenario, terreno + iluminação
class Cenario {
  constructor(scene) {
    this.scene = scene;
    this.hitboxesParedes = [];
  }

  criarTerreno() {
    const textura = new THREE.TextureLoader().load("./texturas/Grass 11.png");
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
    textura.repeat.set(20, 20); // repete 20x em cada direção
    // define uma geometria plana e o material
    const geometria = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshStandardMaterial({
      //color: 0x008000,
      map: textura,
      side: THREE.DoubleSide,
    });

    const terreno = new THREE.Mesh(geometria, material);

    // Rotacionando para ficar horizontal
    terreno.rotation.x = -Math.PI / 2;
    this.scene.add(terreno);
  }

  criarIluminacao() {
    const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.05);
    this.scene.add(luzAmbiente);

    const lua = new THREE.DirectionalLight(0x9bbcff, 1);
    lua.position.set(150, 100, 100);
    this.scene.add(lua);
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
    loader.load("./objetos/Rocks by Quaternius - OQvi8PIZ40.glb", (gltf) => {
      const montanha = gltf.scene;

      // modelo, x, y, z, escala, rotação Y
      this.adicionarModelo(montanha, 0, 0, -45, 100);
      this.adicionarModelo(montanha, -30, -10, 0, 200);
      this.adicionarModelo(montanha, 0, -5, 50, 150);
      this.adicionarModelo(montanha, 50, -2, -5, 150, -Math.PI);

      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 50 - 25;
        const z = Math.random() * 50 - 25;
        const escala = 0.8 + Math.random() * 0.7;

        this.adicionarModelo(montanha, x, 0, z, escala);
      }
    });
  }

  criarArvores() {
    const loader = new GLTFLoader();
    const texLoader = new THREE.TextureLoader();

    const texFolhas = texLoader.load("./texturas/foliage.png");
    const texTronco = texLoader.load("./texturas/tree_bark.png");
    texFolhas.colorSpace = THREE.SRGBColorSpace;
    texTronco.colorSpace = THREE.SRGBColorSpace;

    // https://poly.pizza/m/s6yZuyU2y5
    loader.load("./objetos/Tree by MaverickFX - s6yZuyU2y5.glb", (gltf) => {
      const arvore = gltf.scene;

      arvore.traverse((obj) => {
        if (!obj.isMesh) return;
        if (obj.material.name === "TREE") {
          obj.material.color.set(0xffffff);
          obj.material.map = texFolhas;
          obj.material.needsUpdate = true;
        } else if (obj.material.name === "BRANCH") {
          obj.material.color.set(0xffffff);
          obj.material.map = texTronco;
          obj.material.needsUpdate = true;
        }

        obj.material.roughness = 1; // 1 = totalmente fosco
        obj.material.metalness = 0; // sem aparência metálica
        obj.material.roughnessMap = null;
        obj.material.metalnessMap = null;
        obj.material.needsUpdate = true;
      });

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
    loader.load(
      "./objetos/Wooden Torch by Quaternius - pNsfJzhXiD.glb",
      (gltf) => {
        const tocha = gltf.scene;

        this.adicionarTocha(tocha, -18, 0, 3, 0.75);
        this.adicionarTocha(tocha, -3, 0, -8, 0.75);
        this.adicionarTocha(tocha, -7, 0, 9, 0.75);
        this.adicionarTocha(tocha, 6, 0, -6, 0.75);
        this.adicionarTocha(tocha, 4, 0, 8, 0.75);
      },
    );
  }

  criarGrama() {
    const loader = new GLTFLoader();

    // https://poly.pizza/m/vUJjrRsFp4
    loader.load("./objetos/Grass by Quaternius - vUJjrRsFp4.glb", (gltf) => {
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
    const texLoader = new THREE.TextureLoader();

    const texPedra = texLoader.load("./texturas/stone.png");
    const texTronco = texLoader.load("./texturas/planks.png");
    const texPedraEscura = texLoader.load("./texturas/darkstone.jpg");
    texPedra.colorSpace = THREE.SRGBColorSpace;
    texPedra.wrapS = THREE.RepeatWrapping;
    texPedra.wrapT = THREE.RepeatWrapping;
    texPedra.repeat.set(8, 2);

    texTronco.colorSpace = THREE.SRGBColorSpace;
    texTronco.wrapS = THREE.RepeatWrapping;
    texTronco.wrapT = THREE.RepeatWrapping;
    texTronco.repeat.set(2, 2);

    const texPisoTronco = texTronco.clone();
    texPisoTronco.repeat.set(10, 1);

    texPedraEscura.colorSpace = THREE.SRGBColorSpace;
    texPedraEscura.wrapS = THREE.RepeatWrapping;
    texPedraEscura.wrapT = THREE.RepeatWrapping;
    texPedraEscura.repeat.set(8, 1);

    const geometria = new THREE.BoxGeometry(2, 0.5, 0.1);
    const material = new THREE.MeshStandardMaterial({ map: texPedra });
    const parede = new THREE.Mesh(geometria, material);

    const geometriaPilar = new THREE.BoxGeometry(0.2, 0.5, 0.12);
    const materialPilar = new THREE.MeshStandardMaterial({ map: texTronco });
    const pilar = new THREE.Mesh(geometriaPilar, materialPilar);

    pilar.position.set(-0.4, 0, 0);
    const pilar_2 = pilar.clone();
    pilar_2.position.set(0.4, 0, 0);

    const geometriaBase = new THREE.BoxGeometry(2.2, 0.1, 0.16);
    const materialBase = new THREE.MeshStandardMaterial({
      map: texPedraEscura,
    });
    const base = new THREE.Mesh(geometriaBase, materialBase);

    const baseSuperior = base.clone();

    baseSuperior.position.set(0, 0.25, 0);
    baseSuperior.scale.set(1, 0.4, 1);

    const geometriaAmeia = new THREE.BoxGeometry(0.03, 0.03, 0.03);

    const materialAmeia = new THREE.MeshStandardMaterial({ map: texPedra });

    for (let x = -0.9; x <= 0.9; x += 0.2) {
      const ameia = new THREE.Mesh(geometriaAmeia, materialAmeia);

      const ameiaOposta = ameia.clone();
      ameia.position.set(x, 0.29, 0.07);
      ameiaOposta.position.set(x, 0.29, -0.07);
      parede.add(ameia);
      parede.add(ameiaOposta);
    }

    const baseAmeia = baseSuperior.clone();
    const materialAmeiaBase = new THREE.MeshStandardMaterial({
      map: texPisoTronco,
    });
    baseAmeia.position.set(0, 0.27, 0);
    baseAmeia.scale.set(1, 0.005, 0.8);
    baseAmeia.material = materialAmeiaBase;

    parede.add(baseAmeia);
    parede.add(baseSuperior);
    parede.add(base);
    parede.add(pilar);
    parede.add(pilar_2);

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

      const helper = new THREE.Box3Helper(hitbox, 0x00ff00);
      this.scene.add(helper);
    });
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
    this.controles = new Controles(this.renderer.getDOMElement());

    this.ui = new UI();
    // inicializa o personagem
    this.personagem = new Personagem(
      "./personagem/model.glb",
      this.scene,
      this.controles,
      this.cenario,
      this.ui,
    );

    this.inimigo1 = new Inimigo(
      "./inimigo/model.glb",
      this.scene,
      1,
      1.2,
      5,
      Math.PI,
    ); // rotação em 180
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
    if (this.controles.teclas["KeyQ"])
      this.camera.orbitarEsquerda(this.personagem.getPosition());
    else if (this.controles.teclas["KeyE"])
      this.camera.orbitarDireita(this.personagem.getPosition());

    if (this.controles.teclas["KeyC"])
      this.camera.modo = (this.camera.modo + 1) % 2;
    this.controles.teclas["KeyC"] = false;

    this.personagem.atualizar();
    this.personagem.verificarAcerto(this.inimigo1, this.scene);
    // animação do inimigo
    this.inimigo1.atualizar(this.personagem.getPosition());

    this.camera.atualizarPosicao(this.personagem.getPosition());

    this.renderer.draw(this.scene, this.camera.camera);

    this.ui.updateSpriteHealth(50, 100);
  };
}

const jogo = new Jogo();
jogo.iniciar();
