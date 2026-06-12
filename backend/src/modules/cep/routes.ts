import { Router } from "express";
import { asyncHandler, BadRequest } from "../../lib/errors";
import { isValidCEP } from "../shipping/service";

export const cepRouter = Router();

/** Busca de endereço por CEP (mock). Trocar por ViaCEP em produção. */
const CITIES: Record<string, { city: string; state: string }> = {
  "0": { city: "São Paulo", state: "SP" },
  "1": { city: "Campinas", state: "SP" },
  "2": { city: "Rio de Janeiro", state: "RJ" },
  "3": { city: "Belo Horizonte", state: "MG" },
  "4": { city: "Salvador", state: "BA" },
  "5": { city: "Recife", state: "PE" },
  "6": { city: "Fortaleza", state: "CE" },
  "7": { city: "Brasília", state: "DF" },
  "8": { city: "Curitiba", state: "PR" },
  "9": { city: "Porto Alegre", state: "RS" },
};
const STREETS = [
  "Rua das Acácias",
  "Av. dos Trabalhadores",
  "Rua Sete de Setembro",
  "Av. Brasil",
  "Rua Quinze de Novembro",
  "Travessa do Comércio",
];

cepRouter.get(
  "/:cep",
  asyncHandler(async (req, res) => {
    const cep = req.params.cep;
    if (!isValidCEP(cep)) throw BadRequest("CEP inválido. Informe 8 dígitos.");
    const digits = cep.replace(/\D/g, "");
    const loc = CITIES[digits[0]] ?? CITIES["1"];
    res.json({
      cep,
      street: STREETS[Number(digits[5]) % STREETS.length],
      district: "Centro",
      city: loc.city,
      state: loc.state,
    });
  }),
);
