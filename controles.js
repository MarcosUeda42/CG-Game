export default class Controles {
  constructor(canvas = null) {
    this.teclas = {};
    this.mousePressionado = false;
    this.deltaRoda = 0;
    this.movimentoMouseX = 0;
    this.movimentoMouseY = 0;
    this.canvas = canvas;

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
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mousePressionado = false;
    });
    window.addEventListener("wheel", (e) => {
      this.deltaRoda += e.deltaY;
    });

    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== this.canvas) return;

      this.movimentoMouseX += e.movementX;
      this.movimentoMouseY += e.movementY;
    });

    window.addEventListener("blur", () => {
      this.teclas = {};
      this.mousePressionado = false;
    });

    if (canvas) {
      canvas.tabIndex = 0;
      canvas.style.outline = "none";
      canvas.focus();
      canvas.addEventListener("click", () => {
        if (document.pointerLockElement !== canvas) {
          this.capturarMouse();
        }
      });
    }
  }

  getMouseState() {
    return this.mousePressionado;
  }

  consumirDeltaRoda() {
    const delta = this.deltaRoda;
    this.deltaRoda = 0;
    return delta;
  }
  getKeyStatus(key) {
    return this.teclas[key];
  }
  consumirMovimentoMouse() {
    const movimento = {
      x: this.movimentoMouseX,
      y: this.movimentoMouseY,
    };

    this.movimentoMouseX = 0;
    this.movimentoMouseY = 0;

    return movimento;
  }

  capturarMouse() {
    if (this.canvas && document.pointerLockElement !== this.canvas) {
      this.canvas.requestPointerLock();
    }
  }

  liberarMouse() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }
}
