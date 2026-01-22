import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import SubmitBtn from '../components/common/SubmitBtn';
import { toast } from 'sonner';
import type { ListingImageInterface, NewListingInterface } from '../interfaces/interfaces';
import { formatError, parseError } from '../utils/errors';
import { validateImage, validateLength } from '../utils/validator';

interface ImageState extends Partial<ListingImageInterface> {
  file: File;
}

const ListingCreate = () => {
  const [newListing, setNewListing] = useState<NewListingInterface>({
    title: '',
    description: '',
    price: 0,
    quantity: 1,
  });
  const [preview, setPreview] = useState<ImageState[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const navigate = useNavigate();

  const handlePreviews = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files: File[] = Array.from(e.target.files);

      setPreview((prev) => {
        const hasMain = prev.some((img) => img.is_main);
        const newItems: ImageState[] = files.map((file, index) => ({
          id: crypto.randomUUID(),
          image: URL.createObjectURL(file),
          is_main: !hasMain && index === 0,
          file: file,
        }));
        return [...prev, ...newItems];
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    setNewListing((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (!newListing?.title) {
      toast.error('Listing title required');
      setLoading(false);
      return;
    }

    if (!validateLength(newListing.title, 2)) {
      toast.error('Listing title too short');
      setLoading(false);
      return;
    }

    if (Number.isNaN(Number(newListing.price))) {
      toast.error('Listing price required');
      setLoading(false);
      return;
    }

    if (newListing?.quantity <= 0) {
      toast.error('Minimun quantity is 1');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    Object.keys(newListing).forEach((key) => {
      const k = key as keyof NewListingInterface;
      formData.append(k, String(newListing[k]));
    });

    for (const [index, img] of preview.entries()) {
      if (img.file) {
        const { result, message } = validateImage(img.file);
        if (!result) {
          toast.error(`Error on ${index + 1} image: ${message}`);
          setLoading(false);
          return;
        }
        formData.append(`image_${img.id}`, img.file);
      }
    }

    const manifest = preview.map((img) => ({
      key: `image_${img.id}`,
      isMain: img.is_main,
    }));

    if (manifest.length > 0) formData.append('manifest', JSON.stringify(manifest));

    const promise = api.post('/listings/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    toast.promise(promise, {
      loading: 'Please wait...',
      success: (response) => {
        navigate(`/listings/${response.data.id}/`);
        return 'Listing created successfully';
      },
      error: (error) => {
        const { errors, message } = parseError(error);
        setErrors(errors);
        return message;
      },
    });

    promise.finally(() => {
      setLoading(false);
    });
  };

  const removeImage = (id: string) => {
    const image = preview.find((img) => img.id == id);
    if (!image) return;

    setPreview((prev) => {
      const filtered = prev.filter((img) => img.id != id);

      if (image?.is_main && filtered.length > 0) {
        return filtered.map((img, index) => (index === 0 ? { ...img, is_main: true } : img));
      }
      return filtered;
    });

    if (image.image) URL.revokeObjectURL(image.image);
  };

  const handleMain = (id: string | undefined) => {
    if (id) setPreview((prev) => prev.map((img) => ({ ...img, is_main: img.id === id })));
  };

  const handleQuantity = (subtract: boolean = false) => {
    let { quantity } = newListing || 1;
    const value = subtract ? quantity - 1 : quantity + 1;
    if (value < 1) return;
    setNewListing({ ...newListing, quantity: value });
  };

  useEffect(() => {
    return () => {
      preview.forEach((img) => {
        if (img.image) URL.revokeObjectURL(img.image);
      });
    };
  }, [preview]);

  useEffect(() => {
    document.title = `Create Listing | Marketplace`;
  }, []);

  if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-pulse text-gray-400 font-medium'>Loading...</div>
      </div>
    );

  return (
    <div className='max-w-2xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-gray-100'>
      <h2 className='text-3xl font-bold text-gray-900 mb-8'>Create a new Listing</h2>

      <form className='space-y-6' onSubmit={handleSubmit}>
        <div className='space-y-4'>
          <label className='block text-sm font-medium text-gray-700'>Images</label>
          <div className='flex flex-wrap gap-4'>
            <label className='w-30 h-30 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-all'>
              <span className='text-2xl text-gray-400'>+</span>
              <span className='text-xs text-gray-400'>Add Photo</span>
              <input
                type='file'
                multiple
                className='hidden'
                onChange={handlePreviews}
                accept='image/*'
              />
            </label>

            {preview.map((img, index) => (
              <div key={img.id} className='relative w-30 h-30'>
                <img
                  src={img.image}
                  onClick={() => handleMain(img.id)}
                  className='w-full h-full object-cover rounded-xl'
                  alt={`Preview ${index}`}
                />
                {img.is_main && (
                  <span className='absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] px-2 rounded-md'>
                    Main
                  </span>
                )}
                <button
                  type='button'
                  onClick={() => {
                    if (img.id) removeImage(img.id);
                  }}
                  className='absolute top-2 right-1 bg-red-600 text-white text-[10px] px-2 rounded-md'
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1 italic'>
            Listing Title
          </label>
          <input
            className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
            type='text'
            name='title'
            placeholder='Listing Title'
            value={newListing?.title}
            onChange={(e) => {
              handleChange(e);
            }}
          />
        </div>

        <div>
          <label className='block test-sm font-medium text-gray-700 mb-1 italic'>Description</label>
          <textarea
            className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-32'
            placeholder='Listing description'
            name='description'
            value={newListing?.description || ''}
            onChange={(e) => handleChange(e)}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1 italic'>
            Listing price
          </label>
          <input
            className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
            type='number'
            name='price'
            placeholder='Listing Price'
            value={newListing?.price === 0 ? '' : newListing.price}
            onChange={(e) => {
              handleChange(e);
            }}
          />
        </div>

        <div className='flex flex-col gap-2'>
          <label className='block text-sm font-medium text-gray-700 mb-1 italic'>Quantity</label>
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
              value={newListing?.quantity || 1}
              onChange={(e) => {
                handleChange(e);
              }}
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

        {Object.entries(errors).map(([field, messages]) => (
          <div
            key={field}
            className='mb-2 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg'
          >
            <span className='capitalize font-bold'>
              {field === 'detail' || field === 'non_field_errors'
                ? 'Error'
                : field.replace('_', ' ')}
              :
            </span>
            <span className='ml-1'>{formatError(messages).join(' ')}</span>
          </div>
        ))}

        <SubmitBtn text='Create Listing' loading={loading} />
      </form>
    </div>
  );
};

export default ListingCreate;
