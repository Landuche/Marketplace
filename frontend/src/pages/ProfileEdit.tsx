import { useEffect, useState } from 'react';
import PublicProfileEdit from '../components/profile/PublicProfileEdit';
import SecurityProfileEdit from '../components/profile/SecurityProfileEdit';
import DeleteAccount from '../components/profile/DeleteAccount';

const ProfileEdit = () => {
  const [tab, setTab] = useState<'profile' | 'security' | 'delete'>('profile');

  useEffect(() => {
    document.title = `Edit Profile | Marketplace`;
  }, []);

  return (
    <div className='max-w-[1600px] mx-auto px-4 sm:px-8 py-12'>
      <div className=''>
        {/* Header Section */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Account Settings</h1>
          <p className='text-gray-600'>Manage your public profile and seller information.</p>
        </div>
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
          <div className='flex flex-col md:flex-row'>
            {/* Left Sidebar */}
            <div className='w-full md:w-64 bg-gray-50 border-r border-gray-200 p-6'>
              <nav className='space-y-2'>
                <button
                  className={`w-full text-left px-4 py-2 rounded-md font-medium ${tab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setTab('profile')}
                >
                  Public Info
                </button>
                <button
                  className={`w-full text-left px-4 py-2 rounded-md font-medium ${tab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setTab('security')}
                >
                  Password and Security
                </button>
                <button
                  className={`w-full text-left px-4 py-2 rounded-md font-medium ${tab === 'delete' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  onClick={() => setTab('delete')}
                >
                  Delete Account
                </button>
              </nav>
            </div>
            {/* Forms Area */}
            <div className='flex-1 p-8'>
              {tab === 'profile' && <PublicProfileEdit key='profile-tab' />}
              {tab === 'security' && <SecurityProfileEdit key='security-tab' />}
              {tab === 'delete' && <DeleteAccount key='delete-account-tab' />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
