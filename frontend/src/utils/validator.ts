import type { ValidationInterface } from '../interfaces/interfaces';

export const validateImage = (image: File): ValidationInterface => {
  const MAX_SIZE = 5;
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  if (image.size > MAX_SIZE * 1024 * 1024) {
    return { result: false, message: `Image exceeds max size (${MAX_SIZE}MB).` };
  }

  if (!ALLOWED_TYPES.includes(image.type)) {
    return { result: false, message: 'Unsupported format.' };
  }

  return { result: true };
};

export const validateLength = (str: string, value: number): boolean => {
  return str.length > value ? true : false;
};
