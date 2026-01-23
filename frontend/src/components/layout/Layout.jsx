import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import CartSidebar from '../cart/CartSidebar'
import SearchModal from '../common/SearchModal'
import MobileMenu from './MobileMenu'
import { useUIStore } from '../../stores/uiStore'

const Layout = () => {
  const { isCartOpen, isSearchOpen, isMobileMenuOpen } = useUIStore()

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      <Footer />
      
      {/* Overlays */}
      {isCartOpen && <CartSidebar />}
      {isSearchOpen && <SearchModal />}
      {isMobileMenuOpen && <MobileMenu />}
    </div>
  )
}

export default Layout
