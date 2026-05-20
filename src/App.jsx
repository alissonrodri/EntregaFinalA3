import { BrowserRouter, Routes, Route, useLocation} from 'react-router-dom';
import Navbar from "./components/navbar"
import Home from "./pages/home"
import SignIn from './pages/signIn';
import SignUp from './pages/signUp';


function AppRoutes(){
  const location = useLocation();

  const rotasSemNavbar = ['/signin', '/signup'];

  const rotasComNavbar = !rotasSemNavbar.includes(location.pathname);

  return(
    <>
      {/* A Navbar só será renderizada se a rota atual não for login ou cadastro */}
      {rotasComNavbar && <Navbar />}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Routes>
      </main>
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
