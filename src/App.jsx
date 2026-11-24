import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import { StoreProvider } from './context/StoreContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Toast from './components/Toast';
import Home from './pages/Home';
import Listing from './pages/Listing';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Contact from './pages/Contact';
import Account from './pages/Account';
import Wishlist from './pages/Wishlist';
import './styles.css';
import './header-responsive.css';
import './features.css';
import './gallery.css';
import './dashboards.css';

function AppLayout() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/women" element={<Listing type="women" />} />
        <Route path="/men" element={<Listing type="men" />} />
        <Route path="/kids" element={<Listing type="kids" />} />
        <Route path="/category/:dept" element={<Listing type="category" />} />
        <Route path="/category/:dept/:sub" element={<Listing type="category" />} />
        <Route path="/new-arrivals" element={<Listing type="new-arrivals" />} />
        <Route path="/collection" element={<Listing type="collection" />} />
        <Route path="/sale" element={<Listing type="sale" />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/account" element={<Account />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="*" element={<main className="empty-state"><h2>Page not found</h2><Link to="/">Back home</Link></main>} />
      </Routes>
      <Footer />
      <Toast />
    </>
  );
}

export default function App() {
  return <AuthProvider><StoreProvider><BrowserRouter><AppLayout /></BrowserRouter></StoreProvider></AuthProvider>;
}
