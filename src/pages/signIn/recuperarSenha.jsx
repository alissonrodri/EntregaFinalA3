import { useState } from 'react';
import axios from 'axios';
import './login.css'

const RecuperarSenha = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email) {
            setMessage('Por favor, digite seu e-mail.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setMessage('Buscando usuário...');

        try {
            // Integração com a API
            await axios.post('http://localhost:3000/api/v1/auth/login', { email });
            
            setStatus('success');
        } catch (err) {
            console.error(err);
            setStatus('error');
            setMessage('Não foi possível processar a solicitação. Tente novamente.');
        }
    };

    return (
        <div className="signin-container">
            {status === 'success' ? (
                <div className="signin-form">
                    <h2>Sucesso! <span className="logo-text">Cheque seu E-mail</span></h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá as instruções em instantes.
                    </p>
                    <div className="signin-footer">
                        <a href="/login">Voltar ao Início</a>
                    </div>
                </div>
            ) : (
                <form className="signin-form" onSubmit={handleSubmit}>
                    <h2>Recuperar <span className="logo-text">Senha</span></h2>
                    <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Insira seu e-mail para receber as instruções de redefinição.
                    </p>

                    {message && <p style={{ color: status === 'error' ? 'red' : 'white', textAlign: 'center' }}>{message}</p>}
                    
                    <div className="form-group">
                        <label htmlFor="recovery-email">E-mail cadastrado</label>
                        <input 
                            type="email" 
                            id="recovery-email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com" 
                            disabled={status === 'loading'}
                        />
                    </div>

                    <button type="submit" className="btn-signin" disabled={status === 'loading'}>
                        {status === 'loading' ? 'Enviando...' : 'Enviar link'}
                    </button>

                    <div className="signin-footer">
                        <a href="/login">Voltar para o login</a>
                    </div>
                </form>
            )}
        </div>
    );
};

export default RecuperarSenha;