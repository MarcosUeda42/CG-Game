import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// classe do cenario, terreno + iluminação
export default class Cenario {
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
    loader.load("./objetos/rocks.glb", (gltf) => {
      const montanha = gltf.scene;

      // modelo, x, y, z, escala, rotação Y
      this.adicionarModelo(montanha, -150, 0, -45, 300);
      this.adicionarModelo(montanha, -130, -10, 0, 300);
      this.adicionarModelo(montanha, 150, -5, 50, 350);
      this.adicionarModelo(montanha, 150, -2, -5, 350, -Math.PI);

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
    loader.load("./objetos/tree.glb", (gltf) => {
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

      // Lista de árvores: [x, y, z, escala]
      const arvoresConfig = [
        [-20, 2, -18, 3],
        [-20, 2, -6, 2],
        [-20, 2, 6, 3],
        [-20, 2, 18, 2],
        [20, 2, -18, 3],
        [20, 2, -6, 2],
        [20, 2, 6, 3],
        [20, 2, 18, 2],
        [-13, 0, -20, 1],
        [0, 0, -20, 2],
        [13, 0, -20, 2],
        [-13, 0, 20, 2.5],
        [0, 0, 20, 2],
        [13, 0, 20, 1],
        [8, 4, 8, 5],
        [-10, 4, -5, 5],
      ];

      arvoresConfig.forEach(([x, y, z, escala]) => {
        this.adicionarModelo(arvore, x, y, z, escala);

        const raioTronco = 0.14 * escala;
        const alturaTronco = 3;
        const hitbox = new THREE.Box3(
          new THREE.Vector3(x - raioTronco, 0, z - raioTronco),
          new THREE.Vector3(x + raioTronco, alturaTronco, z + raioTronco),
        );

        this.hitboxesParedes.push(hitbox);

        const helper = new THREE.Box3Helper(hitbox, 0x00ff00);
        this.scene.add(helper);
      });
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
    loader.load("./objetos/torch.glb", (gltf) => {
      const tocha = gltf.scene;

      this.adicionarTocha(tocha, -13, 0, -9, 0.75);
      this.adicionarTocha(tocha, 9, 0, -14, 0.75);
      this.adicionarTocha(tocha, -7, 0, 13, 0.75);
      this.adicionarTocha(tocha, 14, 0, 5, 0.75);
      this.adicionarTocha(tocha, 2, 0, -1, 0.75);
    });
  }

  criarGrama() {
    const loader = new GLTFLoader();

    // https://poly.pizza/m/vUJjrRsFp4
    loader.load("./objetos/grass.glb", (gltf) => {
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
    const texPisoTronco = texLoader.load("./texturas/planks.png");
    const texPedraEscura = texLoader.load("./texturas/darkstone.jpg");
    texPedra.colorSpace = THREE.SRGBColorSpace;
    texPedra.wrapS = THREE.RepeatWrapping;
    texPedra.wrapT = THREE.RepeatWrapping;
    texPedra.repeat.set(8, 2);

    texTronco.colorSpace = THREE.SRGBColorSpace;
    texTronco.wrapS = THREE.RepeatWrapping;
    texTronco.wrapT = THREE.RepeatWrapping;
    texTronco.repeat.set(2, 2);

    texPisoTronco.colorSpace = THREE.SRGBColorSpace;
    texPisoTronco.wrapS = THREE.RepeatWrapping;
    texPisoTronco.wrapT = THREE.RepeatWrapping;
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
      ameia.position.set(x, 0.28, 0.07);
      ameiaOposta.position.set(x, 0.28, -0.07);
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
