export default class HistoricoPontuacao {
  constructor(storage = sessionStorage) {
    this.storage = storage;
    this.chave = "historicoPontuacoes";
    this.registros = this.carregar();
  }

  carregar() {
    const dados = this.storage.getItem(this.chave);

    if (!dados) return [];

    try {
      const registros = JSON.parse(dados);

      if (Array.isArray(registros)) {
        return registros;
      }

      return [];
    } catch {
      return [];
    }
  }

  salvar() {
    this.storage.setItem(this.chave, JSON.stringify(this.registros));
  }

  registrar(pontos) {
    if (!Number.isFinite(pontos) || pontos < 0) return;

    const registro = {
      pontos: pontos,
      data: new Date().toISOString(),
    };

    this.registros.push(registro);
    this.salvar();

    return registro;
  }

  getRegistros() {
    return [...this.registros];
  }

  limpar() {
    this.registros = [];
    this.salvar();
  }
}