import { useEffect, useState } from 'react';
import type { LocationInterface, UserInterface } from '../../interfaces/interfaces';
import api from '../../services/api';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import LocationInput from '../location/LocationInput';
import { validateImage, validateLength } from '../../utils/validator';

const PublicProfileEdit = () => {
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const { user, fetchMe } = useAuth();
  const [userNewData, setUserNewData] = useState(user);

  const handleLocation = (locationData: LocationInterface) => {
    updateUser(locationData);
  };

  const updateUser = (updates: Partial<UserInterface>) => {
    setUserNewData((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateUser({ [name]: value });
  };

  const handleImagePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNewData) return;
    setLoading(true);
    setErrors({});

    const delta = new FormData();

    Object.keys(userNewData).forEach((key) => {
      const k = key as keyof UserInterface;
      if (user && userNewData[k] !== user[k]) {
        delta.append(k, String(userNewData[k]));
      }
    });

    if (!validateLength(userNewData.username, 2)) {
      toast.error('Username too short.');
      setLoading(false);
      return;
    }

    if (profilePicture && profilePicture instanceof File) {
      const { result, message } = validateImage(profilePicture);
      if (!result) {
        toast.error(message);
        setLoading(false);
        return;
      }
      delta.append('profile_picture', profilePicture);
    }

    if (
      !userNewData?.location ||
      !userNewData?.city ||
      !userNewData?.latitude ||
      !userNewData?.longitude
    ) {
      toast.error('Please select a valid address');
      setLoading(false);
      return;
    }

    if (delta.entries().next().done) {
      toast.info('No changes detected.');
      setLoading(false);
      return;
    }

    const promise = api.patch('/users/me/', delta);

    toast.promise(promise, {
      loading: 'Saving changes...',
      success: async () => {
        await fetchMe();
        return 'Profile updated';
      },
      error: (error) => {
        if (error.response.data) setErrors(error.response.data);
        return 'Failed to update profile';
      },
    });

    promise.finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) {
      if (user?.profile_picture) {
        setPreviewUrl(user.profile_picture);
      }
      setUserNewData(user);
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  return (
    <form className='space-y-6' onSubmit={handleSubmit}>
      {/* Photo Section */}
      <div className='flex items-center space-x-6 pb-6 border-bottom border-gray-100'>
        <div className='h-24 w-24 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white shadow-sm'>
          {previewUrl ? (
            <img src={previewUrl} alt={user?.username} className='h-full w-full object-cover' />
          ) : (
            <div className='w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400 transition-all'>
              {user?.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <label className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm'>
          Change Picture
          <input type='file' className='hidden' accept='image/*' onChange={handleImagePreview} />
        </label>
      </div>

      {/* Form Fields Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='flex flex-col space-y-2'>
          <label className='text-sm font-semibold text-gray-700'>Username</label>
          <input
            type='text'
            name='username'
            className='border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition'
            placeholder={user?.username}
            value={userNewData?.username}
            onChange={(e) => {
              handleChange(e);
            }}
          />
        </div>
      </div>

      <div>
        <label className='text-sm font-semibold text-gray-700'>Location</label>
        <LocationInput selectedLocation={handleLocation} initialValue={userNewData?.location} />
      </div>

      {Object.keys(errors).length > 0 && (
        <div className='mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg'>
          <p className='font-bold mb-1'>Please correct the following errors:</p>
          <ul className='list-disc list-inside'>
            {Object.entries(errors).map(([field, messages]) => (
              <li key={field}>
                <span className='capitalize font-medium'>{field.replace('_', ' ')}</span>:{' '}
                {messages.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className='flex items-center justify-end space-x-4 pt-6 border-t border-gray-100'>
        <button
          type='submit'
          disabled={loading}
          className={`px-6 py-2.5 text-white rounded-lg text-sm font-semibold shadow-md transition transform active:scale-95 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default PublicProfileEdit;
