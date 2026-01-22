export const getStatusStyles = (status: string) => {
  switch (status) {
    case 'A':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'; // Authorized/Paid
    case 'P':
      return 'bg-amber-100 text-amber-700 border-amber-200'; // Pending
    case 'AS':
      return 'bg-amber-100 text-amber-700 border-amber-200'; // Awaiting shipment
    case 'AP':
      return 'bg-amber-100 text-amber-700 border-amber-200'; // Awaiting payment
    case 'C':
      return 'bg-red-100 text-red-700 border-red-200'; // Cancelled
    case 'S':
      return 'bg-blue-100 text-blue-700 border-blue-200'; // Shipped
    case 'IT':
      return 'bg-blue-100 text-blue-700 border-blue-200'; // In transit
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};
