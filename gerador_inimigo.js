import * as THREE from "three";
import Inimigo from "./inimigo.js";

export default class GeradorInimigo{
    constructor(scene){
        this.scene = scene;
        this.inimigos = [];
        this.tempoTotal = 0;
        this.intervalo = 5.0;
        this.tempoUltimoInimigo = 0;
        this.limite = 5;
    }

    atualizar(delta, posJogador, listaProjeteis){
        this.tempoTotal += delta;
        this.tempoUltimoInimigo += delta;

        if(this.tempoUltimoInimigo >= this.intervalo &&
           this.limite > this.inimigos.length){
            this.gerarInimigo(posJogador);
            this.tempoUltimoInimigo = 0;
           }
        
        for (let i = 0; i < this.inimigos.length ; i++){
            const inimigo = this.inimigos[i];

            if(!inimigo.ativo){
                inimigo.remover();
                this.inimigos.splice(i,1);
                continue
            }
            inimigo.atualizar(posJogador, delta, listaProjeteis);
        }
    }
    
    gerarInimigo(){
        const x = Math.random() * 50 - 25;
        const z = Math.random() * 50 - 25;

        const novoInimigo = new Inimigo("./inimigo/model.glb", this.scene, x, 1.2, z, 0);
        
        novoInimigo.carregar();
        this.inimigos.push(novoInimigo);
    }
    
}