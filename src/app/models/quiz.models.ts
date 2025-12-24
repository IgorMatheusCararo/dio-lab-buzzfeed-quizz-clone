export interface Quiz {
  titulo: string;
  perguntas: Pergunta[];
  resultados: ResultadoQuiz[];
}

export interface Pergunta {
  id: string;
  texto: string;
  alternativas: Alternativa[];
}

export interface Alternativa {
  id: string;
  texto: string;
  perfisPontuacao: Record<string, number>;
}

export interface ResultadoQuiz {
  perfil: string;
  titulo: string;
  descricao: string;
}
