import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const [searchParam, setSearchParam] = useState<string>('');
  const location = useLocation();

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
  };

  const search = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      navigate(`/?search=${encodeURIComponent(searchParam)}`);
    }
  };

  useEffect(() => {
    if (location.pathname !== '/') {
      setSearchParam('');
    } else {
      setSearchParam(searchParams.get('search') || '');
    }
  }, [location.pathname]);

  return (
    <nav className='bg-gray-200 border-b border-gray-100 sticky top-0 z-40'>
      <div className='max-w-[1600px] mx-auto px-4 sm:px-8 py-4'>
        <div className='flex justify-between items-center h-16'>
          {/* LOGO */}
          <h1
            onClick={() => {
              navigate('/');
              setIsMenuOpen(false);
              setSearchParam('');
            }}
            className='text-2xl font-black text-blue-600 cursor-pointer tracking-tighter'
          >
            Marketplace
          </h1>

          {/* SEARCH BAR */}
          <div className='hidden flex-1 mx-12 md:flex items-center relative max-w-2xl'>
            <div className='absolute left-4 text-xl text-gray-400 rotate-315'>&#9906;</div>
            <input
              type='text'
              placeholder='Search...'
              className='w-full bg-white border border-gray-300 py-3 pl-12 pr-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm shadow-sm'
              onChange={(e) => setSearchParam(e.target.value)}
              value={searchParam}
              onKeyDown={(e) => search(e)}
            />
          </div>

          {/* DESKTOP MENU */}
          <div className='hidden md:flex items-center space-x-6'>
            {user ? (
              <>
                <NavLink
                  to={`/profile/${user.username}`}
                  className={({ isActive }) =>
                    `rounded-xl font-bold transition-all ${isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:text-blue-600'}`
                  }
                >
                  My Profile
                </NavLink>
                <NavLink
                  to={'/cart'}
                  className={({ isActive }) =>
                    `rounded-xl font-bold transition-all ${isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:text-blue-600'}`
                  }
                >
                  Cart
                </NavLink>
                <NavLink
                  to={'/orders'}
                  className={({ isActive }) =>
                    `rounded-xl font-bold transition-all ${isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:text-blue-600'}`
                  }
                >
                  Orders
                </NavLink>
                <NavLink
                  to={'/create-listing'}
                  className={({ isActive }) =>
                    `rounded-xl font-bold transition-all ${isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:text-blue-600'}`
                  }
                >
                  Sell Item
                </NavLink>
                <button
                  onClick={logout}
                  className='text-sm font-bold text-red-500 hover:text-red-700 transition-all'
                >
                  Logout
                </button>
              </>
            ) : (
              <div className='flex items-center space-x-8'>
                <NavLink
                  to='/login'
                  className={({ isActive }) =>
                    `rounded-xl font-bold transition-all ${isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:text-blue-600'}`
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to='/register'
                  className={({ isActive }) =>
                    `rounded-xl font-bold transition-all ${isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:text-blue-600'}`
                  }
                >
                  Register
                </NavLink>
              </div>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <div className='md:hidden flex items-center'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='p-2 text-gray-600 focus:outline-none'
            >
              <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                {isMenuOpen ? (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                ) : (
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMenuOpen && (
        <div className='md:hidden bg-white border-t border-gray-50 px-4 py-6 space-y-4 shadow-xl'>
          {user ? (
            <>
              <NavLink
                to={`/profile/${user.username}`}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left font-bold text-lg ${isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:text-blue-600'}`
                }
              >
                My Profile
              </NavLink>
              <NavLink
                to={'/cart'}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left font-bold text-lg ${isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:text-blue-600'}`
                }
              >
                Cart
              </NavLink>
              <NavLink
                to={'/orders'}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left font-bold text-lg ${isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:text-blue-600'}`
                }
              >
                Orders
              </NavLink>
              <NavLink
                to={'/create-listing'}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left font-bold text-lg ${isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:text-blue-600'}`
                }
              >
                Sell Item
              </NavLink>
              <button
                onClick={handleLogout}
                className='block w-full text-left font-bold text-red-500 text-lg'
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to={'/login'}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left font-bold text-lg ${isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:text-blue-600'}`
                }
              >
                Login
              </NavLink>
              <NavLink
                to={'/register'}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block w-full text-left font-bold text-lg ${isActive ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:text-blue-600'}`
                }
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
