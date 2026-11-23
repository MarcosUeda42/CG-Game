export default class UI {
  constructor(personagem) {
    this.personagem = personagem;
    this.healthFill = document.getElementById("health-fill");
    this.scoreElement = document.getElementById("score");
    this.mainHealth = this.personagem.getHealthMax();
    this.staminaFill = document.getElementById("stamina-fill");
    this.staminaBar = document.getElementById("stamina-bar");
    this.buffForca = document.getElementById("buff-forca");
    this.buffForcaTexto = document.getElementById("buff-forca-texto");
    this.buffForcaFill = document.getElementById("buff-forca-fill");

    this.updatePlayerHealth();
  }
  updateBuffForca() {
    const restante = this.personagem.getTempoBuffForca();
    const ativo = restante > 0;

    this.buffForca.classList.toggle("hidden", !ativo);
    if (!ativo) return;

    const total = this.personagem.getDuracaoBuffForca();
    const pct = total > 0 ? (restante / total) * 100 : 100;
    const mult = this.personagem.getMultiplicadorDano();

    this.buffForcaFill.style.width = pct + "%";
    this.buffForcaTexto.textContent = `x${mult} · ${Math.ceil(restante)}s`;
    this.buffForca.classList.toggle("acabando", restante <= 3);
  }
  updatePlayerStamina() {
    const pct =
      (this.personagem.getStamina() / this.personagem.getStaminaMax()) * 100;
    this.staminaFill.style.width = pct + "%";
    this.staminaBar.classList.toggle(
      "exhausted",
      this.personagem.isExhausted(),
    );
  }
  updatePlayerHealth() {
    const value = this.personagem.getHealth();
    const maxHealth = this.personagem.getHealthMax();

    this.mainHealth = Math.max(0, Math.min(maxHealth, value));
    const pct = maxHealth > 0 ? (this.mainHealth / maxHealth) * 100 : 0;

    if (!this.healthFill) return;

    this.healthFill.style.width = pct + "%";
    this.healthFill.style.background =
      pct > 50 ? "#00ff00" : pct > 25 ? "#fb8c00" : "#ff0000";
  }
  updateScore(valor) {
    if (!this.scoreElement) return;

    this.scoreElement.textContent = `Pontos: ${valor}`;
  }
}
