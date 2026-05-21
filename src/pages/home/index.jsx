import Banner from '../../components/bannerHomePage';
import SearchInClass from '../../components/SearchInClass'; 
import './index.css';

function Home() {
  return (
    <div className="homepage">
      <Banner />
      <SearchInClass />
    </div>
  );
}

export default Home;