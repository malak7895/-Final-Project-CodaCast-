import { useState } from 'react';
import { ArrowRight, Mail, ShieldCheck, Truck, RefreshCw, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SOCIAL_CHANNELS } from '../utils/socialConfig';

function InstagramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function PinterestIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="9" x2="8" y2="21" />
      <path d="M8 12a4.5 4.5 0 0 1 8.5-1.5c.5 1.5 0 4-1.5 5.5s-3 1-3.5 0c-.5-1 .5-2 0-3s-2-.5-2.5 1" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState(null);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterStatus({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    setNewsletterStatus({
      type: 'success',
      message: 'Thank you for subscribing to The VELORA Edit. Welcome to our private circle.',
    });
    setNewsletterEmail('');
    setTimeout(() => setNewsletterStatus(null), 5000);
  };

  const socialIconMap = {
    instagram: InstagramIcon,
    facebook: FacebookIcon,
    tiktok: TikTokIcon,
    pinterest: PinterestIcon,
  };

  return (
    <footer className="site-footer" role="contentinfo">
      {/* Brand Value Pillars */}
      <div className="footer-pillars-strip">
        <div className="pillars-container">
          <div className="pillar-item">
            <Truck size={17} className="pillar-icon" />
            <div className="pillar-text">
              <strong>White Glove Delivery</strong>
              <span>Complimentary express delivery on qualifying orders</span>
            </div>
          </div>
          <div className="pillar-item">
            <RefreshCw size={17} className="pillar-icon" />
            <div className="pillar-text">
              <strong>Seamless Atelier Returns</strong>
              <span>14-day considered exchange and return privilege</span>
            </div>
          </div>
          <div className="pillar-item">
            <ShieldCheck size={17} className="pillar-icon" />
            <div className="pillar-text">
              <strong>Certified Origin & Quality</strong>
              <span>Fine European silks, virgin wool, and pure Egyptian cotton</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Columns */}
      <div className="footer-main-grid">
        <div className="footer-container">
          {/* Column 1: Brand Info & Socials */}
          <div className="footer-col brand-col">
            <Link to="/" className="footer-brandmark">
              VELORA<span>.</span>
              <small>THE ART OF DRESSING</small>
            </Link>
            <p className="footer-about">
              Dedicated to the quiet art of considered dressing. Thoughtfully designed silhouetted garments crafted with precision, purity of line, and uncompromised materiality.
            </p>

            <div className="footer-social-section">
              <span className="social-label">FOLLOW THE ATELIER</span>
              <div className="social-icon-row">
                {SOCIAL_CHANNELS.map(channel => {
                  const Icon = socialIconMap[channel.id] || Mail;
                  return (
                    <a
                      key={channel.id}
                      href={channel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-circle-btn"
                      aria-label={`Follow VELORA on ${channel.name}`}
                      title={`${channel.name} (${channel.handle})`}
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
                <a
                  href="mailto:concierge@velora-couture.com"
                  className="social-circle-btn"
                  aria-label="Email VELORA Concierge"
                  title="Email Concierge"
                >
                  <Mail size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Shop Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Collections</h4>
            <ul className="footer-links">
              <li><Link to="/women">Women's Ready-To-Wear</Link></li>
              <li><Link to="/men">Men's Tailoring & Casual</Link></li>
              <li><Link to="/kids">Kids & Petite Edit</Link></li>
              <li><Link to="/new-arrivals">New Arrivals</Link></li>
              <li><Link to="/collection">The Seasonal Collection</Link></li>
              <li><Link to="/sale">Private Archive Sale</Link></li>
            </ul>
          </div>

          {/* Column 3: Customer Service Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Client Services</h4>
            <ul className="footer-links">
              <li><Link to="/contact">Contact & Concierge</Link></li>
              <li><Link to="/contact">Shipping & Delivery Information</Link></li>
              <li><Link to="/contact">Returns & Exchanges Policy</Link></li>
              <li><Link to="/contact">Frequently Asked Questions</Link></li>
              <li><Link to="/account">My Account & Order Tracking</Link></li>
              <li><Link to="/admin" style={{ color: 'var(--accent)', fontWeight: 600 }}>لوحة الإدارة (Admin Dashboard)</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="footer-col newsletter-col">
            <h4 className="footer-heading">The VELORA Gazette</h4>
            <p className="newsletter-desc">
              Subscribe to receive seasonal invitations, private previews, and reflections on considered modern wardrobe curation.
            </p>

            <form onSubmit={handleSubscribe} className="footer-newsletter-form">
              <div className="newsletter-input-wrap">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  aria-label="Email address for newsletter"
                  required
                  className="newsletter-field"
                />
                <button type="submit" className="newsletter-btn" aria-label="Subscribe">
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>

            {newsletterStatus && (
              <div className={`newsletter-status-pill ${newsletterStatus.type}`} role="status">
                {newsletterStatus.message}
              </div>
            )}

            <div className="newsletter-footnote">
              By subscribing, you agree to our Privacy Terms. You may withdraw consent at any time.
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-inner">
          <div className="copyright-line">
            <span>© 2026 VELORA Atelier. All rights reserved.</span>
            <span className="location-tag">Designed with intention · Cairo, Egypt</span>
          </div>

          <div className="payment-security-strip">
            <span className="payment-label">VERIFIED ATELIER TRANSACTIONS</span>
            <div className="payment-methods">
              <span className="payment-pill">VISA</span>
              <span className="payment-pill">MASTERCARD</span>
              <span className="payment-pill">APPLE PAY</span>
              <span className="payment-pill">INSTAPAY</span>
              <span className="payment-pill">CASH ON DELIVERY</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
