import { useState } from "react";
import "./FAQ.css";

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const perguntas = [
    {
      pergunta: "Como comprar um jogo?",
      resposta:
        "Escolha o jogo desejado, adicione ao carrinho e finalize a compra pelo checkout."
    },
    {
      pergunta: "Onde encontro meus jogos após a compra?",
      resposta:
        "Todos os jogos adquiridos ficam disponíveis na sua Biblioteca."
    },
    {
      pergunta: "Quais formas de pagamento são aceitas?",
      resposta:
        "Aceitamos PIX, cartão de crédito e demais métodos disponíveis na plataforma."
    },
    {
      pergunta: "Posso solicitar reembolso?",
      resposta:
        "Sim. Consulte nossa política de reembolso para verificar os critérios e prazos."
    },
    {
      pergunta: "Preciso criar uma conta para comprar?",
      resposta:
        "Sim. É necessário possuir uma conta para comprar e acessar seus jogos."
    }
  ];

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <main className="faq-content">
        <h1>Perguntas Frequentes</h1>

        <p>
          Tire suas dúvidas sobre compras, pagamentos e utilização da plataforma.
        </p>

        {perguntas.map((item, index) => (
          <div className="faq-card" key={index}>
            <button
              className="faq-question"
              onClick={() => toggleAccordion(index)}
            >
              <span>{item.pergunta}</span>
              <span>{openIndex === index ? "−" : "+"}</span>
            </button>

            {openIndex === index && (
              <div className="faq-answer">
                {item.resposta}
              </div>
            )}
          </div>
        ))}
      </main>

    </div>
  );
}

export default FAQ;