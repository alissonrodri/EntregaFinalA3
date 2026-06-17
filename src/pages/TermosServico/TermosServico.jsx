import "./TermosServico.css";

function TermosServico() {
  return (
    <div className="termos-page">
      <h1>Termos de Serviço</h1>

      <section className="termos-card">
        <h2>1. Aceitação dos Termos</h2>
        <p>
          Ao utilizar a plataforma CLT Gaming, o usuário concorda com os
          presentes Termos de Serviço e com todas as políticas aplicáveis.
        </p>
      </section>

      <section className="termos-card">
        <h2>2. Conta do Usuário</h2>
        <p>
          O usuário é responsável por manter a confidencialidade de suas
          credenciais de acesso e pelas atividades realizadas em sua conta.
        </p>
      </section>

      <section className="termos-card">
        <h2>3. Compras e Pagamentos</h2>
        <p>
          Todas as compras realizadas na plataforma estão sujeitas à
          confirmação do pagamento e às políticas vigentes da CLT Gaming.
        </p>
      </section>

      <section className="termos-card">
        <h2>4. Uso da Plataforma</h2>
        <p>
          É proibida a utilização da plataforma para fins ilegais, fraudulentos
          ou que possam prejudicar outros usuários ou o funcionamento do sistema.
        </p>
      </section>

      <section className="termos-card">
        <h2>5. Alterações nos Termos</h2>
        <p>
          A CLT Gaming poderá atualizar estes termos a qualquer momento,
          sendo recomendada a consulta periódica desta página.
        </p>
      </section>
    </div>
  );
}

export default TermosServico;