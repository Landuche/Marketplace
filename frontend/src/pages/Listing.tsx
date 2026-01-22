import { useEffect, useMemo, useState } from 'react';
import type { ListingInterface } from '../interfaces/interfaces';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Listing = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingInterface | null>(null);
  const [quantity, setQuantity] = useState<string | number>('1');
  const [activeImage, setActiveImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwner = listing?.seller.id === user?.id;
  const inStock = (listing?.available_stock ?? 0) > 0;

  const formattedPrice = useMemo(() => {
    if (!listing) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(listing.price);
  }, [listing]);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/listings/${id}/`);
        const data = response.data;
        setListing(data);

        const mainImg = data.images.find((img: any) => img.is_main) || data.images[0];
        setActiveImage(
          mainImg?.image || 'https://placehold.co/600x400/e2e8f0/475569?text=No+Image+Available'
        );

        document.title = `${data.title} | Marketplace`;
      } catch (err) {
        setError('Listing not found');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchListing();
  }, [id]);

  const addToCart = async () => {
    if (!id || !listing) return;
    if (Number(quantity) > listing.available_stock) {
      toast.error('Insufficient stock');
      return;
    }

    try {
      await api.post('/cart-item/', {
        listing_id: id,
        quantity: Number(quantity),
      });
      navigate('/cart/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail;

      if (errorMessage == 'Insufficient stock.') {
        toast.info('Item already on the cart');
      } else {
        toast.error('Please try again');
      }
    }
  };

  const handleQuantity = (subtract: boolean = false) => {
    if (!listing) return;
    const current = Number(quantity);
    const next = subtract ? current - 1 : current + 1;
    if (next >= 1 && next <= listing.available_stock) {
      setQuantity(String(next));
    }
  };

  if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-pulse text-gray-400 font-medium'>Loading...</div>
      </div>
    );

  if (error || !listing) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4'>
        <h1 className='text-4xl font-bold text-gray-900 mb-8'>{error || 'Listing not found'}</h1>
        <Link
          to='/'
          className='px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all'
        >
          Back to Home
        </Link>
      </div>
    );
  }
  return (
    <div className='max-w-[1600px] mx-auto px-4 sm:px-8 py-12'>
      <nav className='text-sm text-gray-500 mb-6'>
        <Link to='/' className='hover:text-blue-600'>
          Home
        </Link>{' '}
        / <span>{listing.title}</span>
      </nav>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
        <div className='space-y-4'>
          <div className='relative w-full max-h-[70vh] overflow-hidden rounded-2xl bg-gray-100 shadow-sm border flex items-center justify-center'>
            {/* Blurred background layer */}
            <img
              src={activeImage}
              className='absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110'
              aria-hidden='true'
            />
            {/* Main image layer */}
            <img
              src={activeImage}
              alt={listing.title}
              className='relative max-w-full max-h-[70vh] w-auto h-auto object-contain z-10'
            />
          </div>

          <div className='flex gap-4 overflow-x-auto pb-2'>
            {listing.images.length > 1 &&
              listing.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.image)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all 
                                    ${activeImage === img.image ? 'border-blue-600 scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img.image} className='w-full h-full object-cover' alt='thumbnail' />
                </button>
              ))}
          </div>
        </div>

        <div className='flex flex-col'>
          <h1 className='text-3xl font-bold text-gray-900'>
            {listing.title}{' '}
            {!listing.is_active && <span className='text-red-500 text-sm'>inactive</span>}
          </h1>
          <p className='text-gray-500 mt-2 text-sm'>
            Posted on {new Date(listing.created_at).toLocaleDateString()}
          </p>
          <p className='text-gray-500 text-sm'>At {listing.seller.city}</p>
          {listing.status === 'OOS' ? (
            <p className='text-[11px] text-red-500 font-medium line-clamp-1'>
              {listing.status_display}
            </p>
          ) : listing.available_stock <= 10 ? (
            <p className='text-[11px] text-orange-500 font-medium line-clamp-1'>
              Only {listing.available_stock} left!
            </p>
          ) : (
            <p className='text-[11px] text-gray-400 line-clamp-1'>{listing.status_display}</p>
          )}
          <div className='mt-6 py-4 border-y border-gray-100'>
            <span className='text-4xl font-bold text-black-600'>{formattedPrice}</span>
          </div>

          {listing.description && (
            <div className='mt-8'>
              <h3 className='text-lg font-semibold text-gray-900'>Description</h3>
              <p className='mt-4 text-gray-600 leading-relaxed whitespace-pre-line'>
                {listing.description}
              </p>
            </div>
          )}

          <div className='mt-2 pt-8'>
            <div className='p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold overflow-hidden'>
                  {listing.seller.profile_picture ? (
                    <img src={listing.seller.profile_picture} alt='seller' />
                  ) : (
                    listing.seller.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Seller</p>
                  <p className='font-semibold text-gray-900'>{listing.seller.username}</p>
                </div>
              </div>
              <Link
                to={`/profile/${listing.seller.username}`}
                className='bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors'
              >
                View Profile
              </Link>
            </div>

            {listing.available_stock > 1 && !isOwner && (
              <div className='flex flex-col items-center'>
                <label className='block text-sm font-medium text-gray-700 mb-1 italic'>
                  Quantity
                </label>
                <div className='relative flex items-center max-w-[150px]'>
                  <button
                    type='button'
                    onClick={() => handleQuantity(true)}
                    className='absolute left-1 bg-white hover:bg-gray-100 text-gray-600 h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center transition-colors'
                  >
                    −
                  </button>
                  <input
                    type='number'
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    name='quantity'
                    className='w-full text-center bg-gray-50 border border-gray-200 py-3 rounded-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                  />
                  <button
                    type='button'
                    onClick={() => handleQuantity()}
                    className='absolute right-1 bg-white hover:bg-gray-100 text-gray-600 h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center transition-colors'
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {isOwner ? (
              <Link
                to={`/listing/${id}/edit`}
                className='flex items-center justify-center text-center w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200'
              >
                Edit Listing
              </Link>
            ) : inStock ? (
              <button
                type='button'
                onClick={addToCart}
                className='flex items-center justify-center text-center w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200'
              >
                Add to Cart
              </button>
            ) : (
              <button
                disabled
                className='flex items-center justify-center w-full mt-6 bg-gray-300 text-gray-500 py-4 rounded-xl font-bold text-lg cursor-not-allowed'
              >
                Sold Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Listing;
