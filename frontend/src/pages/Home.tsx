import { useEffect, useState } from 'react';
import api from '../services/api';
import ListingCard from '../components/listings/ListingCard';
import type { ListingInterface } from '../interfaces/interfaces';
import ListingSkeleton from '../components/listings/ListingSkeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Home = () => {
  const [listings, setListings] = useState<ListingInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const navigate = useNavigate();

  const fetchListings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/listings/', {
        params: { search: searchParam },
      });
      setListings(response.data);
    } catch (error) {
      setError('Error loading posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    document.title = searchParam == '' ? 'Marketplace' : 'Search | Marketplace';
  }, [searchParam]);

  if (error) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4'>
        <h1 className='text-4xl font-bold text-gray-900 mb-8'>{error}</h1>
        <button
          type='button'
          className='px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all'
          onClick={() => navigate('/')}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <main className='max-w-[1600px] mx-auto px-4 sm:px-8 py-12'>
      <header className='mb-12'>
        <h2 className='text-4xl font-extrabold text-gray-900 tracking-tight'>
          <span>Listings</span>
        </h2>
      </header>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6'>
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => <ListingSkeleton key={i} />)
        ) : listings.length > 0 ? (
          listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
        ) : (
          <div className='col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200'>
            <p className='text-gray-400'>No listings found.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Home;
