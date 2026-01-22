export const formatError = (error: any): string[] => {
  if (typeof error === 'string') {
    return [error];
  }

  if (Array.isArray(error)) {
    return error.flatMap((e) => formatError(e));
  }

  if (typeof error === 'object' && error !== null) {
    return Object.values(error).flatMap((e) => formatError(e));
  }

  return [String(error)];
};

export const parseError = (error: any) => {
  const status = error.response?.status;
  const data = error.response?.data;

  if (status == 400 && data) {
    return {
      errors: data,
      message: 'Validation error.',
    };
  }

  return {
    errors: { server: 'Something went wrong.' },
    message: 'Server error.',
  };
};
