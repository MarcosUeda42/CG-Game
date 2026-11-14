export default class Controles {
  constructor(canvas = null) {
    this.teclas = {};
    this.mousePressionado = false;
    this.scrollPressionado = false;

    window.focus();

    window.addEventListener("pointerdown", () => window.focus());

    window.addEventListener("keydown", (e) => {
      this.teclas[e.code] = true;
    });
    window.addEventListener("keyup", (e) => {
      this.teclas[e.code] = false;
    });
    window.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.mousePressionado = true;
      else if (e.button === 1) this.scrollPressionado = true;
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mousePressionado = false;
      else if (e.button === 1) this.scrollPressionado = false;
    });

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

  getScrollState() {
    return this.scrollPressionado;
  }

  getKeyStatus(key) {
    return this.teclas[key];
  }
}
