import { ReactNode } from 'react';
import { Header } from './Header';
import './main-layout.css';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="layout">
            <Header />
            <main className="main-content">
                {children}
            </main>
            <footer className="footer">
                <p>© 2026 Mi App. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}

export default MainLayout;
