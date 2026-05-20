import Banner from '../../components/bannerHomePage';
import SearchInClass from '../../components/SearchInClass'; 
import Footer from '../../components/Footer'; 
import './index.css';

function Home() {
  return (
    <div className="homepage">
      <Banner />
      <SearchInClass />
      <Footer />
    </div>
  );
}

export default Home;