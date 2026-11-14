const maxHealth = 100;

export default class UI {
  constructor(player) {
    this.player = player;
    this.healthFill = document.getElementById("health-fill");
    this.mainHealth = maxHealth;

    this.updatePlayerHealth();
  }

  updatePlayerHealth() {
    const value = this.player.getHealth();
    this.mainHealth = Math.max(0, Math.min(maxHealth, value));
    const pct = (this.mainHealth / maxHealth) * 100;

    if (!this.healthFill) return;

    this.healthFill.style.width = pct + "%";
    this.healthFill.style.background =
      pct > 50 ? "#00ff00" : pct > 25 ? "#fb8c00" : "#ff0000";
  }
}
