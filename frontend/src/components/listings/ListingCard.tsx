import { useAuth } from '../../context/AuthContext';
import type { ListingInterface } from '../../interfaces/interfaces';
import { Link } from 'react-router-dom';

const ListingCard = ({ listing }: { listing: ListingInterface }) => {
  const displayImage =
    listing.images.find((img) => img.is_main)?.image ||
    'https://placehold.co/600x400/e2e8f0/475569?text=No+Image+Available';

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(listing.price);

  const { user } = useAuth();
  const isOwner = listing.seller.id == user?.id;

  return (
    <div className='bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all group flex flex-col h-full'>
      <div className='relative aspect-[4/3] bg-gray-100 overflow-hidden'>
        <img
          src={displayImage}
          alt={listing.title}
          className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
        />
        {!listing.is_active && (
          <span className='absolute top-1 left-1 bg-red-600 text-white text-[10px] px-2 rounded-md'>
            Inactive
          </span>
        )}
        {isOwner && (
          <span className='absolute top-1 right-1 bg-blue-600 text-white text-[10px] px-2 rounded-md'>
            Your Listing
          </span>
        )}
      </div>

      <div className='p-4 flex flex-col flex-1'>
        <div className='flex-1'>
          <h3 className='text-lg font-bold text-gray-900 line-clamp-1'>{listing.title}</h3>
          <p className='text-xs text-gray-500 italic mt-1'>Sold by {listing.seller.username}</p>
          <p className='text-[11px] text-gray-400 line-clamp-1'>{listing.seller.city}</p>
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
        </div>

        <div className='mt-4 flex justify-between items-center pt-3 border-t border-gray-50'>
          <span className='text-xl font-black text-gray-900'>{formattedPrice}</span>
          <Link
            className='bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition-colors'
            to={`/listings/${listing.id}/`}
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
