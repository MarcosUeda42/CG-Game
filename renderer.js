import * as THREE from "three";

// classe do Renderizador (WebGL)
export default class Renderer {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }
  draw(scene, camera) {
    this.renderer.render(scene, camera);
  }
  getDOMElement() {
    return this.renderer.domElement;
  }
}
