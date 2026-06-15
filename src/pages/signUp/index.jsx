import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import "./index.css";

function SignUp() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [verSenha, setVerSenha] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  // ─── Manipulador de inputs ──────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Bloqueia espaços no nickname em tempo real
    if (name === "nickname" && /\s/.test(value)) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ─── Validações em tempo real ───────────────────────────────────
  const errors = {};

  const nicknameOk = formData.nickname.trim().length >= 3;
  if (formData.nickname.length > 0 && !nicknameOk) {
    errors.nickname = "Mínimo de 3 caracteres.";
  }
  if (formData.nickname.length > 0 && /\s/.test(formData.nickname)) {
    errors.nickname = "Não pode conter espaços.";
  }

  const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const emailOk = isEmailValid(formData.email);
  if (formData.email.length > 0 && !emailOk) {
    errors.email = "E-mail inválido.";
  }

  const passLengthOk = formData.senha.length >= 8;
  if (formData.senha.length > 0 && !passLengthOk) {
    errors.senha = "Mínimo de 8 caracteres.";
  }

  const passwordsMatch =
    formData.senha === formData.confirmarSenha &&
    formData.confirmarSenha !== "";
  if (formData.confirmarSenha.length > 0 && !passwordsMatch) {
    errors.confirmarSenha = "As senhas não coincidem.";
  }

  const allFieldsFilled = Object.values(formData).every(
    (val) => val.trim() !== "",
  );
  const isFormValid =
    nicknameOk && emailOk && passLengthOk && passwordsMatch && allFieldsFilled;

  // ─── Envio ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setApiError(null);

    try {
      await api.post("/auth/register", {
        nome: formData.nickname,
        email: formData.email,
        senha: formData.senha,
      });

      navigate("/signin");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Erro ao realizar o cadastro. Tente novamente.";
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>
            Criar <span>Conta</span>
          </h2>
          <p>Preencha os dados abaixo para começar</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {apiError && <div className="signup-api-error">{apiError}</div>}

          {/* Nickname */}
          <div className="form-field">
            <label htmlFor="nickname">Nome de usuário</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              className={errors.nickname ? "input-error" : ""}
              value={formData.nickname}
              onChange={handleChange}
              placeholder="seu_usuario"
              required
            />
            {errors.nickname && (
              <small className="error-message">{errors.nickname}</small>
            )}
          </div>

          {/* Email */}
          <div className="form-field">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              className={errors.email ? "input-error" : ""}
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
            />
            {errors.email && (
              <small className="error-message">{errors.email}</small>
            )}
          </div>

          {/* Senha + Confirmar lado a lado */}
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="senha">Senha</label>
              <div className="signup-senha-wrap">
                <input
                  type={verSenha ? "text" : "password"}
                  id="senha"
                  name="senha"
                  className={errors.senha ? "input-error" : ""}
                  value={formData.senha}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <button
                  type="button"
                  className="signup-olho-btn"
                  onClick={() => setVerSenha(!verSenha)}
                >
                  <i
                    className={`fa-solid ${verSenha ? "fa-eye-slash" : "fa-eye"}`}
                  ></i>
                </button>
              </div>
              {errors.senha && (
                <small className="error-message">{errors.senha}</small>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="confirmarSenha">Confirmar senha</label>
              <div className="signup-senha-wrap">
                <input
                  type={verConfirmar ? "text" : "password"}
                  id="confirmarSenha"
                  name="confirmarSenha"
                  className={errors.confirmarSenha ? "input-error" : ""}
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  placeholder="Repita a senha"
                  required
                />
                <button
                  type="button"
                  className="signup-olho-btn"
                  onClick={() => setVerConfirmar(!verConfirmar)}
                >
                  <i
                    className={`fa-solid ${verConfirmar ? "fa-eye-slash" : "fa-eye"}`}
                  ></i>
                </button>
              </div>
              {errors.confirmarSenha && (
                <small className="error-message">{errors.confirmarSenha}</small>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? "Processando..." : "Finalizar Cadastro"}
          </button>

          <p className="signup-login-link">
            Já tem uma conta? <Link to="/signin">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignUp;
