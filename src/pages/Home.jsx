import usePageTitle from '../utils/usePageTitle';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductGrid, SectionHeading } from '../components/ProductCard';

const SHOP_BY_CAT = [
  { label: 'Blazers',     to: '/women?sub=Clothing',    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80' },
  { label: 'Dresses',     to: '/women?sub=Dresses',     img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80' },
  { label: 'Suits',       to: '/men?sub=Clothing',      img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80' },
  { label: 'Jeans',       to: '/women?sub=Jeans',       img: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&q=80' },
  { label: 'Jackets',     to: '/men?sub=Jackets',       img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80' },
  { label: 'Accessories', to: '/women?sub=Accessories', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80' },
];

export default function Home() {
  usePageTitle('');
  const { products } = useStore();
  const featured = products.filter(p => p.category === 'New Arrivals').slice(0, 4);

  // Best Sellers: badge match first, then top 4 Women + top 4 Men (up to 8 total)
  const badgeBestSellers = products.filter(p => p.badge === 'Best Seller');
  const bestSellers = badgeBestSellers.length >= 4
    ? badgeBestSellers.slice(0, 8)
    : [
        ...products.filter(p => p.category === 'Women').slice(0, 4),
        ...products.filter(p => p.category === 'Men').slice(0, 4),
      ].slice(0, 8);

  return (
    <>
      <section className="hero">
        <div className="hero-image"></div>
        <div className="hero-content">
          <span className="eyebrow light">THE NEW SEASON · 2026</span>
          <h1>Style is a way<br />to <em>say who you are.</em></h1>
          <p>Discover timeless fashion with elegant designs for women and men.</p>
          <Link className="btn btn-light" to="/new-arrivals">Explore the collection <ArrowRight size={17} /></Link>
        </div>
        <div className="hero-note">A NEW PERSPECTIVE ON EVERYDAY LUXURY</div>
      </section>

      <section className="intro-strip">
        <span>CONSIDERED DESIGN</span><i>✳</i>
        <span>TIMELESS SILHOUETTES</span><i>✳</i>
        <span>MADE TO BE YOURS</span>
      </section>

      <section className="section-wrap">
        <SectionHeading
          eyebrow="JUST LANDED"
          title="The latest edit"
          desc="Fresh perspectives, timeless essentials. Meet your new favorites."
        />
        <ProductGrid items={featured} />
        <div className="center-action">
          <Link className="btn btn-outline" to="/new-arrivals">
            View all new arrivals <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="section-wrap">
        <SectionHeading
          eyebrow="EXPLORE"
          title="Shop by category"
          desc="Find exactly what you're looking for."
        />
        <div className="shop-by-cat-grid">
          {SHOP_BY_CAT.map(({ label, to, img }) => (
            <Link key={label} to={to} className="shop-by-cat-card">
              <img src={img} alt={label} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="category-feature">
        <Link to="/women" className="category-tile women-tile">
          <span>THE WOMEN'S EDIT</span>
          <h2>Effortless<br /><em>elegance.</em></h2>
          <b>Discover women <ArrowRight size={16} /></b>
        </Link>
        <Link to="/men" className="category-tile men-tile">
          <span>THE MEN'S EDIT</span>
          <h2>Modern<br /><em>character.</em></h2>
          <b>Discover men <ArrowRight size={16} /></b>
        </Link>
      </section>

      {/* Kids department tile */}
      <section className="dept-kids">
        <Link to="/kids" className="category-tile kids-tile">
          <span>THE KIDS' EDIT</span>
          <h2>Little ones,<br/><em>big style.</em></h2>
          <b>Discover kids <ArrowRight size={16}/></b>
        </Link>
      </section>

      <section className="manifesto">
        <span className="eyebrow">THE VELORA POINT OF VIEW</span>
        <p>Less, but <em>better.</em><br />Pieces that feel like <em>you.</em></p>
        <Link to="/collection" className="underlink">Discover our collection <ArrowRight size={16} /></Link>
      </section>

      {/* Best Sellers */}
      <section className="section-wrap">
        <SectionHeading
          eyebrow="COMMUNITY FAVORITES"
          title="Best sellers"
          desc="The pieces our customers keep coming back for."
        />
        <ProductGrid items={bestSellers} />
      </section>

      <section className="section-wrap sale-callout">
        <div>
          <span className="eyebrow">A LITTLE SOMETHING SPECIAL</span>
          <h2>Good style.<br /><em>Better prices.</em></h2>
          <p>Explore selected pieces at exceptional prices.</p>
          <Link className="btn btn-dark" to="/sale">Shop the sale <ArrowRight size={16} /></Link>
        </div>
        <div className="sale-callout-image"></div>
      </section>
    </>
  );
}
