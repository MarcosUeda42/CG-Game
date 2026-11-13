export default class Controles {
  constructor(canvas = null) {
    this.teclas = {};
    this.mousePressionado = false;

    window.focus();

    window.addEventListener("pointerdown", () => window.focus());

    window.addEventListener("keydown", (e) => {
      this.teclas[e.code] = true;
    });
    window.addEventListener("keyup", (e) => {
      this.teclas[e.code] = false;
    });
    window.addEventListener("mousedown", () => (this.mousePressionado = true));
    window.addEventListener("mouseup", () => (this.mousePressionado = false));

    window.addEventListener("blur", () => {
      this.teclas = {};
      this.mousePressionado = false;
    });

    if (canvas) {
      canvas.tabIndex = 0;
      canvas.style.outline = "none";
      canvas.focus();
    }
  }

  getMouseState() {
    return this.mousePressionado;
  }

  getKeyStatus(key) {
    return this.teclas[key];
  }
}
