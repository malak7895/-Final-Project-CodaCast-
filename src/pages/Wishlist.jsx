import usePageTitle from '../utils/usePageTitle';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductGrid, SectionHeading } from '../components/ProductCard';

export default function Wishlist() {
  usePageTitle('Wishlist');
  const { wishlist, products } = useStore();
  const items = products.filter(p => wishlist.includes(p.id));

  return (
    <main className="listing-wrap">
      <SectionHeading
        eyebrow="SAVED FOR LATER"
        title="Your wishlist"
        desc="Pieces you've saved. They stay here on this device."
      />
      {items.length ? (
        <ProductGrid items={items} />
      ) : (
        <div className="empty-state">
          <Heart size={32} />
          <h3>Nothing saved yet</h3>
          <p>Tap the heart on any piece to keep it here.</p>
          <Link className="btn btn-dark" to="/collection">Explore the collection</Link>
        </div>
      )}
    </main>
  );
}
