// Configurações centralizadas de balanceamento do jogo.
// Alterar valores aqui deve permitir rebalancear o gameplay
// sem modificar a lógica das classes.

export const PLAYER_CONFIG = {
  healthMax: 100,

  movimento: {
    velocidadeBase: 3,
    multiplicadorCorrida: 1.5,
  },

  ataque: {
    velocidadeBase: 1,
    multiplicadorPreparacao: 2.6,
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
    custoBloqueio: 10,

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
    distanciaMinima: 2,
  },

  ataque: {
    cooldown: 4.0,
    atrasoInicialAleatorioMax: 2,
    distanciaDisparo: 15,
  },

  knockback: {
    forca: 6,
    atrito: 8,
  },

  recompensa: 100,
};

export const SPAWN_CONFIG = {
  intervalo: 5,
  limiteInimigos: 5,
  areaMetade: 25,
};

export const PROJECTILE_CONFIG = {
  velocidade: 7,
  tempoVida: 4,
  dano: 10,
  raio: 0.2,
  hitbox: 0.4,
};

export const POWERUP_CONFIG = {
  chanceDrop: 0.2,

  // Probabilidade condicional considerando que ocorreu um drop.
  chanceHealth: 0.4,

  health: {
    cura: 20,
  },

  strength: {
    multiplicador: 2,
    duracao: 20,
  },
};

export const CAMERA_CONFIG = {
  sensibilidadeMouse: 0.0015,
  zoomMinimo: 0.5,
  zoomMaximo: 1.3,
  sensibilidadeZoom: 0.001,
};
