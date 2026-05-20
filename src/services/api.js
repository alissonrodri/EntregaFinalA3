import axios from 'axios';

const api = axios.create({
  // URL base extraída das variáveis do arquivo Postman
  baseURL: 'http://localhost:3003/api/v1', 
});

// Adição de token no localstorage do navegador caso necessite na req
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@CLTGaming:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;