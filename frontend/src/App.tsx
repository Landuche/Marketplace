import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { APIProvider } from '@vis.gl/react-google-maps';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ListingCreate from './pages/ListingCreate';
import Navbar from './components/layout/Navbar';
import Listing from './pages/Listing';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import { Toaster } from 'sonner';
import ListingEdit from './pages/ListingEdit';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Checkout from './pages/Checkout';
import OrderDetails from './pages/OrderDetails';

function App() {
  const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    if (loading)
      return <div className='h-screen flex items-center justify-center'>Authenticating...</div>;

    return user ? <Outlet /> : <Navigate to='/login' replace />;
  };

  const AuthRoute = () => {
    const { user, loading } = useAuth();
    if (loading)
      return <div className='h-screen flex items-center justify-center'>Authenticating...</div>;

    return user == null ? <Outlet /> : <Navigate to='/' replace />;
  };

  return (
    <div className='bg-gray-50 min-h-screen'>
      <BrowserRouter>
        <AuthProvider>
          <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}>
            <Navbar />
            <Toaster position='top-right' richColors />
            <Routes>
              {/* Public Routes */}
              <Route path='/' element={<Home />} />
              <Route path='/listings/:id' element={<Listing />} />
              <Route path='/profile/:username' element={<Profile />} />

              {/* Auth Routes */}
              <Route element={<AuthRoute />}>
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path='/order/:orderId' element={<OrderDetails />} />
                <Route path='/listing/:id/edit' element={<ListingEdit />} />
                <Route path='/orders/' element={<Orders />} />
                <Route path='/checkout/:orderId' element={<Checkout />} />
                <Route path='/cart' element={<Cart />} />
                <Route path='/create-listing' element={<ListingCreate />} />
                <Route path='/settings/profile' element={<ProfileEdit />} />
              </Route>
            </Routes>
          </APIProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
