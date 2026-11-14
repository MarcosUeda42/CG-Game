const maxHealth = 100;

// HUD do jogador (barra HTML #health-fill).
// A barra de vida dos inimigos agora é desenhada pela própria classe Inimigo.
export default class UI {
  constructor(player) {
    this.player = player;
    this.healthFill = document.getElementById("health-fill");
    this.mainHealth = maxHealth;

    this.setHealth(this.player.getHealth());
  }

  // Sem argumento, lê a vida atual do jogador.
  setHealth(value = this.player.getHealth()) {
    this.mainHealth = Math.max(0, Math.min(maxHealth, value));
    const pct = (this.mainHealth / maxHealth) * 100;

    if (!this.healthFill) return;

    this.healthFill.style.width = pct + "%";
    this.healthFill.style.background =
      pct > 50 ? "#00ff00" : pct > 25 ? "#fb8c00" : "#ff0000";
  }
}
