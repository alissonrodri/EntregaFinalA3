import "./PoliticaPrivacidade.css";

function PoliticaPrivacidade() {
  return (
    <div className="privacidade-page">
      <h1>Política de Privacidade</h1>

      <section className="privacidade-card">
        <h2>1. Coleta de Dados</h2>
        <p>
          A CLT Gaming coleta informações necessárias para o funcionamento da
          plataforma, como nome, e-mail e histórico de compras.
        </p>
      </section>

      <section className="privacidade-card">
        <h2>2. Uso das Informações</h2>
        <p>
          Os dados coletados são utilizados para autenticação, processamento de
          compras e melhoria da experiência do usuário.
        </p>
      </section>

      <section className="privacidade-card">
        <h2>3. Segurança</h2>
        <p>
          Adotamos medidas de segurança para proteger as informações dos usuários
          contra acessos não autorizados e uso indevido.
        </p>
      </section>

      <section className="privacidade-card">
        <h2>4. Compartilhamento de Dados</h2>
        <p>
          Os dados não são vendidos a terceiros e somente poderão ser
          compartilhados quando necessário para a prestação dos serviços.
        </p>
      </section>

      <section className="privacidade-card">
        <h2>5. Direitos do Usuário</h2>
        <p>
          O usuário pode solicitar atualização, correção ou exclusão de seus
          dados pessoais conforme a legislação aplicável.
        </p>
      </section>
    </div>
  );
}

export default PoliticaPrivacidade;