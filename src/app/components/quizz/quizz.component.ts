import { Component, OnInit } from '@angular/core';
import { Quiz, Pergunta, ResultadoQuiz } from '../../models/quiz.models';
import { QuizService } from '../../services/quiz.service';

type ProgressoQuiz = {
  indicePergunta: number;
  respostasPorPergunta: Record<string, string>;
  pontuacaoPorPerfil: Record<string, number>;
  finalizado: boolean;
};

@Component({
  selector: 'app-quizz',
  templateUrl: './quizz.component.html',
  styleUrls: ['./quizz.component.css']
})
export class QuizzComponent implements OnInit {

  titulo: string = '';
  quiz?: Quiz;

  perguntas: Pergunta[] = [];
  perguntaAtual?: Pergunta;

  indicePergunta: number = 0;
  totalPerguntas: number = 0;

  finalizado: boolean = false;
  carregando: boolean = true;

  respostasPorPergunta: Record<string, string> = {};
  pontuacaoPorPerfil: Record<string, number> = {};

  textoResultado: string = '';

  private chaveStorage: string = 'buzzfeed_quiz_progresso';

  constructor(private quizService: QuizService) {}

  ngOnInit(): void {
    this.quizService.buscarQuiz().subscribe({
      next: (quiz) => {
        this.quiz = quiz;
        this.titulo = quiz.titulo;
        this.perguntas = quiz.perguntas || [];
        this.totalPerguntas = this.perguntas.length;

        this.carregarProgresso();

        if (!this.perguntas.length) {
          this.carregando = false;
          return;
        }

        if (this.finalizado) {
          this.montarResultado();
        } else {
          this.perguntaAtual = this.perguntas[this.indicePergunta];
        }

        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });
  }

  escolherAlternativa(perguntaId: string, alternativaId: string): void {
    if (this.finalizado || !this.perguntaAtual) return;

    this.respostasPorPergunta[perguntaId] = alternativaId;

    const alternativa = this.perguntaAtual.alternativas.find(a => a.id === alternativaId);
    if (alternativa) {
      Object.keys(alternativa.perfisPontuacao || {}).forEach(perfil => {
        const pontos = alternativa.perfisPontuacao[perfil] || 0;
        this.pontuacaoPorPerfil[perfil] = (this.pontuacaoPorPerfil[perfil] || 0) + pontos;
      });
    }

    this.avancar();
  }

  reiniciarQuiz(): void {
    this.indicePergunta = 0;
    this.finalizado = false;
    this.respostasPorPergunta = {};
    this.pontuacaoPorPerfil = {};
    this.textoResultado = '';
    this.removerProgresso();

    if (this.perguntas.length) {
      this.perguntaAtual = this.perguntas[this.indicePergunta];
    }
  }

  get progressoPorcentagem(): number {
    if (!this.totalPerguntas) return 0;
    return Math.round((this.indicePergunta / this.totalPerguntas) * 100);
  }

  private avancar(): void {
    const proximoIndice = this.indicePergunta + 1;

    if (proximoIndice < this.totalPerguntas) {
      this.indicePergunta = proximoIndice;
      this.perguntaAtual = this.perguntas[this.indicePergunta];
      this.salvarProgresso();
      return;
    }

    this.finalizado = true;
    this.perguntaAtual = undefined;
    this.montarResultado();
    this.salvarProgresso();
  }

  private montarResultado(): void {
    const perfisOrdenados = Object.entries(this.pontuacaoPorPerfil)
      .sort((a, b) => b[1] - a[1]);

    if (!perfisOrdenados.length || !this.quiz) {
      this.textoResultado = '';
      return;
    }

    const maiorPontuacao = perfisOrdenados[0][1];
    const perfisVencedores = perfisOrdenados
      .filter(([_, pontos]) => pontos === maiorPontuacao)
      .map(([perfil]) => perfil);

    const resultados = this.quiz.resultados || [];
    const textos = perfisVencedores
      .map(perfil => resultados.find(r => r.perfil === perfil))
      .filter((r): r is ResultadoQuiz => !!r)
      .map(r => `${r.titulo} - ${r.descricao}`);

    this.textoResultado = textos.join(' | ');
  }

  private carregarProgresso(): void {
    try {
      const bruto = localStorage.getItem(this.chaveStorage);
      if (!bruto) return;

      const salvo = JSON.parse(bruto) as ProgressoQuiz;

      this.indicePergunta = typeof salvo.indicePergunta === 'number' ? salvo.indicePergunta : 0;
      this.respostasPorPergunta = salvo.respostasPorPergunta || {};
      this.pontuacaoPorPerfil = salvo.pontuacaoPorPerfil || {};
      this.finalizado = !!salvo.finalizado;

      if (this.indicePergunta < 0) this.indicePergunta = 0;
      if (this.indicePergunta >= this.totalPerguntas) this.indicePergunta = this.totalPerguntas ? this.totalPerguntas - 1 : 0;
    } catch {
      this.removerProgresso();
    }
  }

  private salvarProgresso(): void {
    const progresso: ProgressoQuiz = {
      indicePergunta: this.indicePergunta,
      respostasPorPergunta: this.respostasPorPergunta,
      pontuacaoPorPerfil: this.pontuacaoPorPerfil,
      finalizado: this.finalizado
    };
    localStorage.setItem(this.chaveStorage, JSON.stringify(progresso));
  }

  private removerProgresso(): void {
    localStorage.removeItem(this.chaveStorage);
  }
}
