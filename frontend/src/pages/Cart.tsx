import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { ListingInterface } from '../interfaces/interfaces';
import { toast } from 'sonner';
import { formatError, parseError } from '../utils/errors';

interface CartInterface {
  id: number;
  listing: ListingInterface;
  quantity: number | string;
  added_at: string;
  total_price: string;
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartInterface[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const debounceMap = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const navigate = useNavigate();

  const handleConfirmOrder = async () => {
    try {
      const response = await api.post('/order/');
      navigate(`/checkout/${response.data.id}`);
    } catch (error) {
      const { errors, message } = parseError(error);
      setErrors(errors);
      return message;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, cartItemId: number) => {
    const value = e.target.value;

    if (value === '') {
      setCartItems((prev) =>
        prev ? prev.map((i) => (i.id === cartItemId ? { ...i, quantity: '' } : i)) : null
      );
      return;
    }

    const newQuantity = parseInt(value, 10);

    if (isNaN(newQuantity)) return;

    setCartItems((prev) => {
      if (!prev) return null;
      const item = prev.find((i) => i.id === cartItemId);
      if (!item) return prev;

      if (newQuantity < 0) {
        return prev;
      }

      if (newQuantity > item.listing.available_stock) {
        toast.error(`Insufficient stock`);
        return prev;
      }

      updateQuantity(cartItemId, newQuantity);

      return prev.map((i) => (i.id === cartItemId ? { ...i, quantity: newQuantity } : i));
    });
  };

  const handleQuantity = (cartItemId: number, subtract: boolean = false) => {
    setCartItems((prev: CartInterface[] | null): CartInterface[] | null => {
      if (!prev) return null;

      const item = prev.find((i) => i.id == cartItemId);
      if (!item) return prev;

      const newQuantity = subtract ? Number(item.quantity) - 1 : Number(item.quantity) + 1;

      if (newQuantity <= 0) {
        if (debounceMap.current[cartItemId]) {
          clearTimeout(debounceMap.current[cartItemId]);
          delete debounceMap.current[cartItemId];
        }

        removeFromCart(cartItemId);
        return prev.filter((i) => i.id != cartItemId);
      }

      if (newQuantity > item.listing.available_stock) {
        toast.error('Insufficient stock');
        return prev;
      }

      updateQuantity(cartItemId, newQuantity);
      return prev.map((i) => (i.id == cartItemId ? { ...i, quantity: newQuantity } : i));
    });
  };

  const removeFromCart = async (cartItemId: number) => {
    try {
      await api.delete(`/cart-item/${cartItemId}/`);
      delete debounceMap.current[cartItemId];
    } catch (error) {
      console.error(error);
    }
  };

  const updateQuantity = (cartItemId: number, newQuantity: number) => {
    if (debounceMap.current[cartItemId]) {
      clearTimeout(debounceMap.current[cartItemId]);
    }

    debounceMap.current[cartItemId] = setTimeout(async () => {
      try {
        await api.patch(`/cart-item/${cartItemId}/`, { quantity: newQuantity });
        delete debounceMap.current[cartItemId];
      } catch (error) {
        console.error(error);
      }
    }, 500);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  useEffect(() => {
    document.title = 'Cart | Marketplace';
    const fetchCart = async () => {
      setLoading(true);
      try {
        const response = await api.get('/cart/');
        setCartItems(response.data.items);
      } catch (error) {
        const { errors, message } = parseError(error);
        setErrors(errors);
        return message;
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const totalValue = useMemo(() => {
    if (!cartItems) return '$0.00';
    const total = cartItems.reduce(
      (acc, item) => acc + Number(item.quantity) * item.listing.price,
      0
    );
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);
  }, [cartItems]);

  if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-pulse text-gray-400 font-medium'>Loading...</div>
      </div>
    );

  if (!cartItems || cartItems?.length <= 0)
    return (
      <div className='col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 mt-12'>
        <p className='text-gray-400'>Cart Empty.</p>
      </div>
    );

  return (
    <div className='max-w-[1600px] mx-auto px-4 sm:px-8 py-12'>
      <h1 className='text-3xl font-bold mb-8'>Review your Order</h1>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
        {/* Left: Listing Summary */}
        <div className='md:col-span-2 space-y-6'>
          {cartItems.map((item) => (
            <div
              key={item.id}
              className='flex gap-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm'
            >
              <img
                src={
                  item.listing?.images.find((i) => i.is_main)?.image ||
                  'https://placehold.co/600x400/e2e8f0/475569?text=No+Image+Available'
                }
                className='w-32 h-32 object-cover rounded-xl'
              />
              <div className='flex-1'>
                <h3 className='text-xl font-bold'>{item.listing.title}</h3>
                <p className='text-gray-500'>Seller: {item.listing.seller.username}</p>
                <p className='text-2xl font-black mt-2'>{formatPrice(item.listing.price)}</p>
              </div>
              <div className='flex flex-col items-center mt-4'>
                <label className='block text-sm font-medium text-gray-700 mb-1 italic'>
                  Quantity
                </label>
                <div className='relative flex items-center max-w-[150px]'>
                  <button
                    type='button'
                    onClick={() => handleQuantity(item.id, true)}
                    className='absolute left-1 bg-white hover:bg-gray-100 text-gray-600 h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center transition-colors'
                  >
                    −
                  </button>
                  <input
                    type='number'
                    value={item.quantity}
                    onChange={(e) => handleChange(e, item.id)}
                    name='quantity'
                    className='w-full text-center bg-gray-50 border border-gray-200 py-3 rounded-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                  />
                  <button
                    type='button'
                    onClick={() => handleQuantity(item.id)}
                    className='absolute right-1 bg-white hover:bg-gray-100 text-gray-600 h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center transition-colors'
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Summary Box */}
        <div className='bg-gray-50 p-6 rounded-2xl border border-gray-200 h-full'>
          <h3 className='text-lg font-bold mb-4'>Order Summary</h3>

          {cartItems?.map((item) => (
            <div key={item.id} className='flex justify-between mb-2'>
              <span>{item.listing.title}</span>
              <span>
                {formatPrice(item.listing.price)} <span className='text-sm'>x {item.quantity}</span>
              </span>
            </div>
          ))}
          <div className='flex justify-between mb-6 font-bold text-xl border-t pt-4'>
            <span>Total</span>
            <span>{totalValue}</span>
          </div>
          <button
            type='button'
            onClick={handleConfirmOrder}
            className='flex items-center justify-center text-center w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200'
          >
            Confirm and Pay
          </button>
          <p className='text-xs text-gray-400 mt-4 text-center'>
            By clicking confirm, you agree to contact the seller for payment and delivery.
          </p>
        </div>
      </div>
      {Object.entries(errors).map(([field, messages]) => (
        <div
          key={field}
          className='mb-2 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg'
        >
          <span className='capitalize font-bold'>
            {field === 'detail' || field === 'non_field_errors' ? 'Error' : field.replace('_', ' ')}
            :
          </span>
          <span className='ml-1'>{formatError(messages).join(' ')}</span>
        </div>
      ))}
    </div>
  );
};

export default Cart;
