import { useState } from 'react';
import type { OrderItemInterface } from '../../interfaces/interfaces';

const TrackingForm = ({
  items,
  onConfirm,
}: {
  items: OrderItemInterface[];
  onConfirm: (code: string, ids: number[]) => Promise<void>;
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>(items.map((i) => i.id));
  const [code, setCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const toggleItem = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0 || !code.trim() || loading) return;

    setLoading(true);
    try {
      await onConfirm(code, selectedIds);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='bg-gray-50 p-3 rounded-xl border space-y-2'>
        <p className='text-xs font-bold text-gray-500 uppercase px-1'>Items in this package:</p>
        {items.map((item) => (
          <label
            key={item.id}
            className='flex items-center gap-3 p-2 bg-white border rounded-lg cursor-pointer hover:border-blue-300 transition-all'
          >
            <input
              type='checkbox'
              checked={selectedIds.includes(item.id)}
              onChange={() => toggleItem(item.id)}
              className='w-4 h-4 rounded text-blue-600 focus:ring-blue-500'
            />
            <span className='text-sm font-medium flex-1'>{item.listing_title}</span>
            <span className='text-xs text-gray-400'>Qty: {item.quantity}</span>
          </label>
        ))}
      </div>

      <div>
        <label className='block text-xs font-bold text-gray-500 uppercase mb-1 px-1'>
          Tracking Number
        </label>
        <input
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className='w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100'
          placeholder='Enter code for selected items...'
          disabled={loading}
        />
      </div>

      <button
        type='submit'
        disabled={selectedIds.length === 0 || !code.trim() || loading}
        className='w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed shadow-lg shadow-blue-100 transition-all flex justify-center items-center gap-2'
      >
        {loading ? (
          <>
            <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></span>
            Updating...
          </>
        ) : (
          `Confirm Shipment (${selectedIds.length} items)`
        )}
      </button>
    </form>
  );
};

export default TrackingForm;
