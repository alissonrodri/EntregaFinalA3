import React, { useState } from 'react';
import axios from '../../services/api';
import '../../../src/index.css'
import '../signUp/index.css'

function SignUp() {
  // 1. Estado único para controlar os campos do formulário
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: ''
  });

  // Estados para gerenciar o feedback da API
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // 2. Manipulador de mudanças nos inputs com a máscara de caracteres 
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'fullName') {
      // Permite apenas letras e espaços 
      const sanitizedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 3. VALIDAÇÕES EM TEMPO REAL (Derived State)
  const errors = {};

  // Validação do Nome Completo
  const nameValue = formData.fullName.trim();
  const nameParts = nameValue.split(' ');
  const nameOk = nameParts.length >= 2 && nameValue.length > 3;
  if (formData.fullName.length > 0 && nameParts.length < 2) {
    errors.fullName = "Digite seu nome completo";
  }

  // Validação de Formato de E-mail
  const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const emailOk = isEmailValid(formData.email);
  if (formData.email.length > 0 && !emailOk) {
    errors.email = "E-mail inválido";
  }

  // Comparação de E-mails
  const emailsMatch = formData.email === formData.confirmEmail && formData.confirmEmail !== '';
  if (formData.confirmEmail.length > 0 && !emailsMatch) {
    errors.confirmEmail = "Os e-mails não coincidem";
  }

  // Mínimo de 8 caracteres na Senha
  const passLengthOk = formData.password.length >= 8;
  if (formData.password.length > 0 && !passLengthOk) {
    errors.password = "Mínimo de 8 caracteres";
  }

  // Comparação de Senhas
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';
  if (formData.confirmPassword.length > 0 && !passwordsMatch) {
    errors.confirmPassword = "As senhas não coincidem";
  }

  // Verifica se todos os campos obrigatórios possuem valores preenchidos
  const allFieldsFilled = Object.values(formData).every((val) => val.trim() !== '');

  // O formulário só será válido se passar em todas as regras (condição para habilitar o botão)
  const isFormValid = emailOk && emailsMatch && passLengthOk && passwordsMatch && nameOk && allFieldsFilled;

  // 4. ENVIO DOS DADOS PARA A API COM AXIOS
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setApiError(null);

    // Montagem do payload enviado ao backend
    // Ajuste as chaves ('nome', 'email', etc.) se a sua API esperar propriedades com nomes diferentes
    const payload = {
      nome: formData.fullName.trim(),
      nickname: formData.username,
      email: formData.email,
      senha: formData.password
    };

    try {
      const response = await axios.post('http://localhost:3000', payload);
      
      // O Axios realiza o parse do JSON automaticamente e injeta em .data
      const data = response.data;

      // Armazena a sessão localmente caso o backend retorne o token no cadastro
      if (data.token) {
        localStorage.setItem('token', JSON.stringify({
          token: data.token,
          name: payload.nome,
          loginTime: new Date().toISOString()
        }));
      }

      alert("Cadastro realizado com sucesso!");
      window.location.href = "home.html";

    } catch (error) {
      // Trata erros HTTP
      const errorMessage = error.response?.data?.message || 'Erro ao realizar o cadastro. Tente novamente.';
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <a href="home.html" className="navbar-logo">
            <img src="../assets/img/icon_clt.png" alt="Icone" />
            <span>CLT</span> Gaming
          </a>
        </div>
      </nav>

      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Criar <span>Conta</span></h2>
            <p>Preencha os dados abaixo para começar</p>
          </div>

          <form id="signUpForm" className="auth-form" onSubmit={handleSubmit}>
            {/* Mensagem de Erro Geral vinda da API */}
            {apiError && (
              <div className="error-message" style={{ textAlign: 'center', marginBottom: '15px', color: '#ff4d4d', fontWeight: 'bold' }}>
                {apiError}
              </div>
            )}

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="fullName">Nome</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="Ex: Chris Redfield"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
                {errors.fullName && <small className="error-message">{errors.fullName}</small>}
              </div>
              <div className="form-field">
                <label htmlFor="username">Nickname</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="email">E-mail</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={errors.email ? 'input-error' : ''}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <small className="error-message">{errors.email}</small>}
              </div>
              <div className="form-field">
                <label htmlFor="confirmEmail">Confirmar E-mail</label>
                <input
                  type="email"
                  id="confirmEmail"
                  name="confirmEmail"
                  className={errors.confirmEmail ? 'input-error' : ''}
                  value={formData.confirmEmail}
                  onChange={handleChange}
                  required
                />
                {errors.confirmEmail && <small className="error-message">{errors.confirmEmail}</small>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="password">Senha</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={errors.password ? 'input-error' : ''}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {errors.password && <small className="error-message">{errors.password}</small>}
              </div>
              <div className="form-field">
                <label htmlFor="confirmPassword">Confirmar Senha</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={errors.confirmPassword ? 'input-error' : ''}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {errors.confirmPassword && <small className="error-message">{errors.confirmPassword}</small>}
              </div>
            </div>

            <button
              type="submit"
              id="btnSubmit"
              className="btn-primary"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Processando...' : 'Finalizar Cadastro'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default SignUp;