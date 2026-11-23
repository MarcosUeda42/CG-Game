// Configurações centralizadas de balanceamento do jogo.
// Alterar valores aqui deve permitir rebalancear o gameplay
// sem modificar a lógica das classes.

export const PLAYER_CONFIG = {
  healthMax: 100,

  movimento: {
    velocidadeBase: 3,
    multiplicadorCorrida: 1.5,
    velocidadeGiro: 10,
  },

  ataque: {
    velocidadeBase: 1,
    multiplicadorPreparacao: 2.6,
    cooldownCombo: 0.2,
    duracaoDanoFallback: 0.5,
    duracaoTransicaoAtaque: 0.05,
    golpes: [
      {
        dano: 40,
        inicio: 0.0,
        fim: 1.3,
        hitInicio: 0.9,
        hitFim: 1.1,
        velocidade: 1,
        hitbox: {
          tamanho: [1.4, 1.6, 1.6],
          distancia: 1.4,
          altura: 0.9,
          lateral: 0,
        },
      },
      {
        dano: 40,
        inicio: 1.3,
        fim: 2.5,
        hitInicio: 0.7,
        hitFim: 1.0,
        velocidade: 1.5,
        hitbox: {
          tamanho: [2.0, 1.6, 1.6],
          distancia: 1.4,
          altura: 0.9,
          lateral: 0,
        },
      },
      {
        dano: 60,
        inicio: 2.5,
        fim: 3.5,
        hitInicio: 0.5,
        hitFim: 0.7,
        velocidade: 0.7,
        hitbox: {
          tamanho: [1.6, 1.8, 2.0],
          distancia: 1.6,
          altura: 0.9,
          lateral: 0,
        },
      },
    ],
  },

  stamina: {
    maxima: 100,
    gastoCorrida: 15,
    regeneracao: 20,
    atrasoRegeneracao: 1,
    recuperacaoMinima: 25,
  },

  defesa: {
    atraso: 0.1,
    custoBloqueio: 25,

    hitbox: {
      largura: 1,
      altura: 1.5,
      profundidade: 0.1,
      distancia: 0.7,
      alturaCentro: 0.9,
    },
  },

  knockback: {
    forca: 5,
    atrito: 8,
  },
};

export const ENEMY_CONFIG = {
  healthMax: 100,

  movimento: {
    velocidade: 2.5,
    distanciaMinima: 5,
    velocidadeGiro: 8,
    velocidadeGiroAtaque: 6,
  },

  ataque: {
    cooldown: 4.0,
    atrasoInicialAleatorioMax: 2,
    distanciaDisparo: 15,
    recuperacaoAposDano: 0.5,
    anguloMaximoDisparo: 60,
    duracaoDanoFallback: 0.6,
    atrasoProjecao: 300,
    desvioMaximo: 0.1,
  },

  knockback: {
    forca: 6,
    atrito: 8,
  },

  recompensa: 100,
};

export const TANK_CONFIG = {
  healthMax: 220,

  modelo: {
    escala: 0.8,
  },

  movimento: {
    velocidade: 1.6,
    velocidadeGiro: 8,
    velocidadeGiroAtaque: 6,
    anguloMaximoParaAndar: 20,
  },

  ataque: {
    dano: 20,
    cooldown: 1.2,
    recuperacaoAposDano: 0.2,
    margemInicioAtaque: 0.05,
    anguloMaximoParaAtacar: 40,
    duracaoDanoFallback: 0.6,

    hitInicio: 0.65,
    hitFim: 1.05,

    hitbox: {
      largura: 2.0,
      altura: 1.8,
      profundidade: 2.0,
      distancia: 1.25,
      alturaCentro: 1.0,
    },
  },

  hitboxCorpo: {
    largura: 1.2,
    altura: 2.1,
    profundidade: 1.2,
    alturaCentro: 1.05,
  },

  knockback: {
    forca: 2.5,
    atrito: 8,
  },

  recompensa: 200,

  animacoes: {
    idle: "ANM_IDLE",
    walk: "ANM_WALK",
    attack: "ANM_ORC_LIGHT_ATTACK",
    damage: "ANM_DAMAGED",
    death: "ANM_DEATH",

    velocidadeDamage: 2,
  },
};

export const SPAWN_CONFIG = {
  areaMetade: 25,

  limiteTotal: {
    inicial: 3,
    maximo: 10,
    intervaloAumento: 30,
    incremento: 1,
  },

  mago: {
    intervaloInicial: 8,
    limiteSimultaneo: 6,
  },

  tank: {
    intervaloInicial: 10,
    limiteSimultaneo: 4,
  },
};

export const PROJECTILE_CONFIG = {
  velocidade: 8,
  tempoVida: 4,
  dano: 10,
  raio: 0.2,
  hitbox: 0.4,
};

export const POWERUP_CONFIG = {
  chanceHealth: 0.1,
  chanceStrength: 0.1,

  health: {
    cura: 20,
  },

  strength: {
    multiplicador: 2,
    multiplicadorMaximo: 10,
    duracao: 20,
  },
};

export const CAMERA_CONFIG = {
  sensibilidadeMouse: 0.0015,
  zoomMinimo: 0.5,
  zoomMaximo: 1.3,
  sensibilidadeZoom: 0.001,
};
