export interface UserInterface extends LocationInterface {
  id: string;
  username: string;
  created_at: string;
  email?: string;
  profile_picture?: string;
}

export interface LocationInterface {
  city: string;
  location: string;
  latitude: number;
  longitude: number;
}

export interface ListingImageInterface {
  id: string;
  image: string;
  is_main: boolean;
}

export type ListingInterface = {
  id: string;
  title: string;
  price: number;
  description?: string;
  images: ListingImageInterface[];
  created_at: string;
  seller: UserInterface;
  is_active?: boolean;
  quantity: number;
  status: 'IS' | 'OOS' | 'D';
  status_display: string;
  available_stock: number;
  main_image: string;
};

export interface OrderItemInterface {
  id: number;
  quantity: number;
  listing_id: string;
  listing_price: string;
  listing_image: string;
  listing_title: string;
  seller_username: string;
  seller_id: string;
  listing_is_active: boolean;
  status: string;
  status_display: string;
  tracking_code?: string;
}

export interface OrderInterface {
  id: string;
  items: OrderItemInterface[];
  total_price: string;
  status: string;
  status_display: string;
  created_at: string;
  client_secret: string;
  buyer_address: string;
  buyer_email: string;
  user_role: string;
  seller_username: string;
  seller_id: string;
}

export interface ValidationInterface {
  result: boolean;
  message?: string;
}

export type NewListingInterface = Pick<
  ListingInterface,
  'title' | 'price' | 'description' | 'quantity'
>;
