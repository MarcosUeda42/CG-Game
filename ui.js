import * as THREE from "three";

export default class UI {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 256;
    this.canvas.height = 32;

    const texture = new THREE.CanvasTexture(this.canvas);
    this.spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    this.healthSprite = new THREE.Sprite(this.spriteMaterial);
    this.healthSprite.scale.set(1.5, 0.2, 1);
    this.healthSprite.position.set(0, 2.2, 0);
  }
  updateSpriteHealth(currentHealth, maxHealth) {
    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background
    ctx.fillStyle = "#333333";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw health fill
    const ratio = Math.max(0, currentHealth / maxHealth);
    ctx.fillStyle = ratio > 0.5 ? "#00ff00" : "#ff0000";
    ctx.fillRect(0, 0, this.canvas.width * ratio, this.canvas.height);

    this.spriteMaterial.map.needsUpdate = true;
  }
  getSprite() {
    return this.healthSprite;
  }
}
