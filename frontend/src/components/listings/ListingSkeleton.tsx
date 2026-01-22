const ListingSkeleton = () => (
  <div className='animate-pulse bg-white rounded-2xl border border-gray-200 overflow-hidden'>
    <div className='aspect-[4/3] bg-gray-200' />
    <div className='p-4 space-y-3'>
      <div className='h-4 bg-gray-200 rounded w-3/4' />
      <div className='h-3 bg-gray-100 rounded w-1/2' />
      <div className='flex justify-between items-center pt-4'>
        <div className='h-6 bg-gray-200 rounded w-1/4' />
        <div className='h-8 bg-gray-100 rounded w-1/4' />
      </div>
    </div>
  </div>
);

export default ListingSkeleton;
