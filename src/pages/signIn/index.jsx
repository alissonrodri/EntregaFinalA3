import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./login.css";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Novo estado
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email || !password) {
            setError('Por favor, preencha todos os campos.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
                email,
                password
            });

            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                navigate('/home'); 
            }
        } catch (err) {
            if (err.response) {
                setError(err.response.data.message || 'E-mail ou senha incorretos.');
            } else {
                setError('Erro de conexão com o servidor. Tente novamente mais tarde.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="signin-container">
            <form className="signin-form" onSubmit={handleLogin}>
                <h2>Entrar na <span className="logo-text">CLT Gaming</span></h2>
                
                {error && <p className="error-message">{error}</p>}

                <div className="form-group">
                    <label htmlFor="email">E-mail</label>
                    <input 
                        type="email" 
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com" 
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                    <label htmlFor="password">Senha</label>
                    <input 
                        // O tipo muda dinamicamente
                        type={showPassword ? "text" : "password"} 
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha" 
                        disabled={isLoading}
                    />
                    {/* Botão para alternar visibilidade */}
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                            position: 'absolute',
                            right: '10px',
                            top: '35px',
                            background: 'none',
                            border: 'none',
                            color: '#007bff',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                        }}
                    >
                        {showPassword ? "Ocultar" : "Exibir"}
                    </button>
                    
                    <a href="/recuperar-senha" className="forgot-link" style={{ display: 'block', marginTop: '10px' }}>
                        Esqueci minha senha
                    </a>
                </div>

                <button type="submit" className="btn-signin" disabled={isLoading}>
                    {isLoading ? 'Entrando...' : 'Entrar'}
                </button>

                <div className="signin-footer">
                    <span>Não tem uma conta? <a href="/signUp">Cadastre-se</a></span>
                </div>
            </form>
        </div>
    );
};

export default Login;