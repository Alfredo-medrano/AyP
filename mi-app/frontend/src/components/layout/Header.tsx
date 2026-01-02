import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useOffline } from '../../hooks/useOffline';
import logoImg from '../../assets/AyP.svg';
import './header.css';

interface NavItem {
    path: string;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { path: '/', label: 'Miembros', icon: '👥' },
    { path: '/ingresos', label: 'Ingresos', icon: '💰' },
    { path: '/gastos', label: 'Gastos', icon: '📋' },
    { path: '/reportes', label: 'Reportes', icon: '📊' },
    { path: '/perfil', label: 'Perfil', icon: '👤' },
];

export function Header() {
    const { isOffline } = useOffline();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <header className="header">
                <div className="header-container">
                    <Link to="/" className="header-logo">
                        <img src={logoImg} alt="Iglesia AyP" className="header-logo-img" />
                        <span className="header-logo-text">Iglesia AyP</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="header-nav">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="header-actions">
                        {isOffline && (
                            <span className="offline-indicator">Sin conexión</span>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
                            onClick={toggleMobileMenu}
                            aria-label="Menú"
                        >
                            <div className="hamburger">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Overlay */}
            <div
                className={`mobile-nav-overlay ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={closeMobileMenu}
            />

            {/* Mobile Navigation Menu */}
            <nav className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-nav-header">
                    <span className="mobile-nav-title">Menú</span>
                    <button
                        className="mobile-nav-close"
                        onClick={closeMobileMenu}
                        aria-label="Cerrar menú"
                    >
                        ✕
                    </button>
                </div>

                <div className="mobile-nav-links">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                            onClick={closeMobileMenu}
                        >
                            <span className="mobile-nav-link-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </div>
            </nav>
        </>
    );
}

export default Header;
