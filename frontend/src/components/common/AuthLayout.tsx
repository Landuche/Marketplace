interface AuthLayoutInterface {
  children: React.ReactNode;
  title: string;
}

const AuthLayout = ({ children, title }: AuthLayoutInterface) => (
  <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans'>
    <div className='bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100'>
      <div className='text-center mb-8'>
        <h2 className='text-3xl font-extrabold text-gray-900'>{title}</h2>
      </div>
      {children}
    </div>
  </div>
);

export default AuthLayout;
