import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./index.css";

const SignIn = () => {
    // Estados para controlar formulário, erro e carregamento
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Validação simples de preenchimento
        if (!email || !password) {
            setError('Por favor, preencha todos os campos.');
            setIsLoading(false);
            return;
        }

        try {
            // Integração com API utilizando Axios
            const response = await axios.post('https://localhost:3000/api/v1/auth/login', {
                email,
                password
            });

            // Se o login for bem-sucedido
            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                navigate('/home'); 
            }
        } catch (err) {
            // Tratamento de erro específico do Axios
            if (err.response) {
                // Erro retornado pelo servidor (ex: 401, 404)
                setError(err.response.data.message || 'E-mail ou senha incorretos.');
            } else {
                // Erro de rede ou outro problema
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

                <div className="form-group">
                    <label htmlFor="password">Senha</label>
                    <input 
                        type="password" 
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha" 
                        disabled={isLoading}
                    />
                    <a href="/recuperar-senha" className="forgot-link">Esqueci minha senha</a>
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

export default SignIn;