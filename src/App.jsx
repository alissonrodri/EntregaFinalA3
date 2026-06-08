import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Home from "./pages/home";
import SignIn from './pages/signIn';
import SignUp from './pages/signUp';
import RecuperarSenha from './pages/signIn/recuperarSenha';
import SearchPage from './pages/search';
import GamePage from './pages/gamepage';
import CategoriesPage from './pages/categories';
import CartPage from './pages/cart';
import Wishlist from './pages/wishlist';
import Library from './pages/library';
import Checkout from './pages/checkout';
import History from './pages/history';

function AppRoutes() {
  const location = useLocation();

  // Adicionado '/recuperar-senha' aqui para esconder Navbar/Footer
  const rotasSemLayout = ['/signin', '/signup', '/recuperar-senha'];

  const rotasComNavbar = !rotasSemLayout.includes(location.pathname);
  const rotasComFooter = !rotasSemLayout.includes(location.pathname);

  return (
    <>
      {rotasComNavbar && <Navbar />}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} /> {/* Nova Rota */}
          <Route path="/search" element={<SearchPage />} />
          <Route path="/game/:id" element={<GamePage />} />
          <Route path="/categorias" element={<CategoriesPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/library" element={<Library />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>

      {rotasComFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;