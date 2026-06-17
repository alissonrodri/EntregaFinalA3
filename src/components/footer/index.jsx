import './index.css';
import { Link } from "react-router-dom";


function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">

        <div className="footer-brand">
          <h2 className="footer-logo">CLT <span>Gaming</span></h2>
          <p className="footer-description">
            Sua loja definitiva para aquela boa jogatina após um dia cansativo.
          </p>
        </div>

        <div className="footer-links">
          <h3>Institucional</h3>
          <ul>      
            <li><Link to="/sobre">Sobre nós</Link></li>
            <li><Link to="/termos">Termos de Serviço</Link></li>
            <li><Link to="/privacidade">Política de Privacidade</Link></li>
            <li><Link to="/reembolso">Política de Reembolso</Link></li>
            <li><Link to="/faq">Perguntas Frequentes</Link></li>

          </ul>
        </div>
       </div>

       
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} CLT Gaming. Todos os direitos reservados.</p>
        <div className="footer-socials">
          <span className="social-icon">X</span>
          <span className="social-icon">IG</span>
          <span className="social-icon">DC</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;