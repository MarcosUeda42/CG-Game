export default class Pontuacao {
  constructor() {
    this.valor = 0;
  }

  adicionar(pontos) {
    if (pontos <= 0) return;

    this.valor += pontos;
    return this.valor;
  }

  resetar() {
    this.valor = 0;
  }

  getValor() {
    return this.valor;
  }
}
