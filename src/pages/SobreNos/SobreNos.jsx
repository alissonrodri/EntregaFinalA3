import "./SobreNos.css";

function SobreNos() {
  return (
    <div className="sobre-page">

      <section className="sobre-hero">
        <h1>Sobre a CLT Gaming</h1>
        <p>
          Sua loja definitiva para aquela boa jogatina após um dia cansativo.
        </p>
      </section>

      <section className="sobre-card">
        <h2>Nossa História</h2>
        <p>
          A CLT Gaming foi criada com o objetivo de oferecer uma plataforma
          moderna, segura e intuitiva para a compra de jogos digitais.
          Buscamos reunir os melhores títulos do mercado em um único lugar,
          proporcionando praticidade e uma excelente experiência aos jogadores.
        </p>
      </section>

      <section className="sobre-grid">

        <div className="sobre-item">
          <h2>🎯 Missão</h2>
          <p>
            Conectar jogadores aos melhores jogos digitais de forma simples,
            segura e acessível.
          </p>
        </div>

        <div className="sobre-item">
          <h2>🚀 Visão</h2>
          <p>
            Tornar-se uma das principais plataformas de venda de jogos digitais
            do mercado.
          </p>
        </div>

        <div className="sobre-item">
          <h2>💎 Valores</h2>
          <p>
            Transparência, inovação, segurança e compromisso com a satisfação
            dos usuários.
          </p>
        </div>

      </section>

    </div>
  );
}

export default SobreNos;