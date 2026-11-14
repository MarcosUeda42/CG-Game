const maxHealth = 100;

export default class UI {
  constructor(player) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 256;
    this.canvas.height = 32;

    this.actions = {};
    this.healthFill = document.getElementById('health-fill');

    this.player = player;
    this.setHealth(this.player.getHealth());
  }

  updateSpriteHealth(currentHealth) {
    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = "#333333";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const ratio = Math.max(0, currentHealth / maxHealth);
    ctx.fillStyle = ratio > 0.5 ? "#00ff00" : "#ff0000";
    ctx.fillRect(0, 0, this.canvas.width * ratio, this.canvas.height);
  }

  setHealth(value) {
    this.mainHealth = Math.max(0, Math.min(maxHealth, value));
    const pct = (this.player.getHealth() / maxHealth) * 100;
    this.healthFill.style.width = pct + '%';

    this.healthFill.style.background =
      pct > 50 ? '#00ff00' : pct > 25 ? '#fb8c00' : '#ff0000';
  }
  
  getCanvas() {
    return this.canvas;
  }
}
