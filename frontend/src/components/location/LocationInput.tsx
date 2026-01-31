import { useEffect, useRef } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { toast } from 'sonner';
import type { LocationInterface } from '../../interfaces/interfaces';

interface InputProps {
  selectedLocation: (location: LocationInterface) => void;
  initialValue?: string;
}

const HandleInput = ({ selectedLocation, initialValue }: InputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!inputRef.current || !places) return;

    if (initialValue) {
      inputRef.current.value = initialValue;
    }

    const options = {
      types: ['address'],
      fields: ['geometry', 'name', 'formatted_address', 'address_components'],
    };

    const autocomplete = new places.Autocomplete(inputRef.current, options);

    autocomplete.addListener('place_changed', () => {
      const location: google.maps.places.PlaceResult = autocomplete.getPlace();
      const components = location.address_components as google.maps.GeocoderAddressComponent[];

      if (!components) return;

      if (!location.formatted_address || !components || !location.geometry?.location) {
        toast.error('Please select a valid address');
        return;
      }

      const number = components.some((n) => n.types.includes('street_number'));

      if (!number) {
        toast.error('Please include your address number');
        return;
      }

      const city = components.find(
        (c) => c.types.includes('locality') || c.types.includes('administrative_area_level_2')
      );

      if (!city) {
        toast.error('Please select a valid address');
        return;
      }

      selectedLocation({
        location: location.formatted_address,
        city: city ? city.long_name : '',
        latitude: Number(location.geometry?.location.lat().toFixed(6)) ?? 0,
        longitude: Number(location.geometry?.location.lng().toFixed(6)) ?? 0,
      });
    });
  }, [places, selectedLocation]);

  return (
    <input
      id='maps-location'
      name='maps-location'
      ref={inputRef}
      className='w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all'
      placeholder='Select your location...'
    />
  );
};

const LocationInput = ({ selectedLocation, initialValue }: InputProps) => (
  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}>
    <HandleInput selectedLocation={selectedLocation} initialValue={initialValue} />
  </APIProvider>
);

export default LocationInput;