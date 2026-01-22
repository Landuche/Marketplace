import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { ListingInterface, UserInterface } from '../interfaces/interfaces';
import ListingCard from '../components/listings/ListingCard';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { username } = useParams<string>();
  const [profile, setProfile] = useState<UserInterface | null>(null);
  const [listings, setListings] = useState<ListingInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const { user } = useAuth();
  const isOwnProfile = profile?.id === user?.id;

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileResponse, listingResponse] = await Promise.all([
        api.get(`/users/${username}/`),
        api.get(`/listings/?seller__username=${username}&profile=true`),
      ]);
      setProfile(profileResponse.data);
      setListings(listingResponse.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('User not found.');
      } else {
        setError('Error loading profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    document.title = `${username} Profile | Marketplace`;
  }, [username]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-pulse text-gray-400 font-medium'>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4'>
        <h1 className='text-4xl font-bold text-gray-900 mb-8'>{error || 'User not found'}</h1>
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
    <div className='max-w-[1600px] mx-auto px-4 sm:px-8 py-4'>
      {/* Header */}
      <div className='bg-gray-50 border-b'>
        <div className='mx-auto py-5'>
          <div className='flex flex-col md:flex-row items-center md:items-start gap-8'>
            {/* Profile Picture */}
            <div className='relative'>
              <div className='w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-200'>
                {profile?.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt={profile.username}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400'>
                    {profile?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className='flex-1 text-center md:text-left space-y-4'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>{profile?.username}</h1>
                <p className='text-gray-500 text-sm mt-1'>
                  Member since {new Date(profile?.created_at || '').toLocaleDateString()}
                </p>
              </div>

              {/* Stats */}
              <div className='flex justify-center md:justify-start gap-8 border-t border-gray-100 pt-4'>
                <div>
                  <span className='block font-bold text-gray-900'>{listings.length}</span>
                  <span className='text-xs text-gray-500 uppercase tracking-wider'>Listings</span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className='w-full md:w-auto'>
              {isOwnProfile && (
                <Link
                  to='/settings/profile'
                  className='block w-full text-center px-8 py-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm'
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LISTINGS GRID SECTION */}
      <div className='max-w-[1600px] mx-auto px-4 sm:px-8 py-12'>
        <h2 className='text-xl font-bold text-gray-900 mb-6'>
          {isOwnProfile ? 'Your listings' : `Listings from ${profile?.username}`}
        </h2>

        {listings.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6'>
            {listings.map((listing: ListingInterface) => (
              <div key={listing.id} className='relative'>
                <ListingCard key={listing.id} listing={listing} />
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className='text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200'>
            <p className='text-gray-500'>No listings found for this user.</p>
            {isOwnProfile && (
              <Link
                to='/create-listing'
                className='text-blue-600 font-medium mt-2 inline-block hover:underline'
              >
                Create your first listing now
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
