import "./PoliticaReembolso.css";

function PoliticaReembolso() {
  return (
    <div className="reembolso-page">
      <h1>Política de Reembolso</h1>

      <section className="reembolso-card">
        <h2>1. Prazo para Solicitação</h2>
        <p>
          O usuário poderá solicitar o reembolso em até 7 dias após a compra,
          desde que o jogo não tenha sido utilizado de forma excessiva.
        </p>
      </section>

      <section className="reembolso-card">
        <h2>2. Condições para Reembolso</h2>
        <p>
          O pedido será analisado pela equipe da CLT Gaming e estará sujeito
          às condições previstas nesta política.
        </p>
      </section>

      <section className="reembolso-card">
        <h2>3. Forma de Estorno</h2>
        <p>
          Quando aprovado, o valor será devolvido utilizando o mesmo método
          de pagamento utilizado na compra.
        </p>
      </section>

      <section className="reembolso-card">
        <h2>4. Situações Não Elegíveis</h2>
        <p>
          Não serão elegíveis para reembolso compras realizadas de forma
          fraudulenta ou que violem os Termos de Serviço da plataforma.
        </p>
      </section>

      <section className="reembolso-card">
        <h2>5. Contato para Solicitação</h2>
        <p>
          Em caso de dúvidas, entre em contato com nossa equipe de suporte
          através dos canais oficiais da plataforma.
        </p>
      </section>
    </div>
  );
}

export default PoliticaReembolso;