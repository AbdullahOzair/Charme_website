// frontend/src/router/routes.jsx
import { Route } from 'react-router-dom';

import Home from '../pages/Home';
import Shop from '../pages/Shop';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Orders from '../pages/Orders';
import Configurator from '../pages/Configurator';
import SavedDesigns from '../pages/SavedDesigns';

export const publicRoutes = [
  { path: '/', element: <Home /> },
  { path: '/shop', element: <Shop /> },
  { path: '/product/:slug', element: <ProductDetail /> },
  { path: '/about', element: <About /> },
  { path: '/contact', element: <Contact /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/cart', element: <Cart /> },
  { path: '/configurator', element: <Configurator /> },
];

export const protectedRoutes = [
  { path: '/checkout', element: <Checkout /> },
  { path: '/orders', element: <Orders /> },
  { path: '/saved-designs', element: <SavedDesigns /> },
];

export const configuratorRoute = (
  <Route path="/configurator" element={<Configurator />} />
);
