import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import "./index.css";

function SignIn() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        senha,
      });

      const { token } = response.data;

      if (token) {
        localStorage.setItem("token", token);
        navigate("/");
      }
    } catch (err) {
      console.error("Erro no login:", err);
      setError(
        err.response?.data?.message ||
          "E-mail ou senha incorretos. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <form onSubmit={handleLogin} className="signin-form">
        <h2>
          Entrar na <span className="logo-text">CLT Gaming</span>
        </h2>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="senha">Senha</label>

          <div className="password-input-wrapper">
            <input
              id="senha"
              type={passwordVisible ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setPasswordVisible(!passwordVisible)}
              title={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
              aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
            >
              {/* Substituição da imagem pelo ícone de fonte */}
              <span className="material-symbols-outlined password-icon">
                {passwordVisible ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>

          <Link to="/forgot-password" className="forgot-link">
            Esqueci minha senha
          </Link>
        </div>

        <button type="submit" className="btn-signin" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <Link to="/" className="continue-without-login">
          Continuar sem login
        </Link>

        <div className="signin-footer">
          Não tem uma conta? <Link to="/signup">Cadastre-se</Link>
        </div>
      </form>
    </div>
  );
}

export default SignIn;