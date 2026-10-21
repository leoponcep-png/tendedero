import { numero, texto } from "../estado/utilidades";
import type { EfectoCuerda } from ".";

export const efectosCuerda: Record<string, EfectoCuerda> = {
  // Tejadillo: la lluvia y lo que moja no llega a sus prendas.
  tejadillo: { tipo: "cuerda", protegeDe: ["moja"] },

  // Resistente: sus prendas no se caen ni se las mueve un rival.
  resistente: { tipo: "cuerda", protegeDe: ["tira", "mueve"] },

  // parametros.humedad: cuánto pierden sus prendas en cada secado.
  "secado-rapido": { tipo: "cuerda", secado: (params) => numero(params, "humedad", 2) },

  // parametros.bonus: puntos extra (o menos, si es negativo) al secarse aquí.
  // parametros.color / parametros.tipo (opcionales): solo para prendas de ese color o tipo.
  "modificador-puntuacion": {
    tipo: "cuerda",
    puntosAlSecar(p, prenda, params, base) {
      const { color, tipo } = p.prendas[prenda];
      const colorPedido = texto(params, "color");
      const tipoPedido = texto(params, "tipo");
      if ((colorPedido && colorPedido !== color) || (tipoPedido && tipoPedido !== tipo)) return base;
      return base + numero(params, "bonus", 1);
    },
  },
};
