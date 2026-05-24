import { BrowserRouter, Routes, Route, useLocation} from 'react-router-dom';
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import Home from "./pages/home";
import SignIn from './pages/signIn';
import SignUp from './pages/signUp';
import SearchPage from './pages/search';
import GamePage from './pages/gamepage';
import CategoriesPage from './pages/categories';
import CartPage from './pages/cart'


function AppRoutes(){
  const location = useLocation();

  const rotasSemNavbar = ['/signin', '/signup'];
  const rotasSemFooter = ['/signin', '/signup'];

  const rotasComNavbar = !rotasSemNavbar.includes(location.pathname);
  const rotasComFooter = !rotasSemFooter.includes(location.pathname);

  return(
    <>
      {/* A Navbar só será renderizada se a rota atual não for login ou cadastro */}
      {rotasComNavbar && <Navbar />}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/game/:id" element={<GamePage />} />
          <Route path="/categorias" element={<CategoriesPage />} />
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </main>

      {rotasComFooter && <Footer />}


    </>
  );
}

function App() {
 
  return (
    <BrowserRouter>
    <AppRoutes/>
    </BrowserRouter>
  )
   
}

export default App
