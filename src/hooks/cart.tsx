import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem('products');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productExist = products.find(prod => product.id === prod.id);
      const cart = productExist
        ? [...products, { ...product, quantity: 1 }]
        : products.map(prod =>
            prod.id === product.id
              ? { ...prod, quantity: prod.quantity + 1 }
              : prod,
          );
      setProducts(cart);
      await AsyncStorage.setItem('products', JSON.stringify(cart));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const cart = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );
      setProducts(cart);
      await AsyncStorage.setItem('products', JSON.stringify(cart));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const cart = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );

      setProducts(cart.filter(product => product.quantity > 0));
      await AsyncStorage.setItem(
        'products',
        JSON.stringify(cart.filter(product => product.quantity > 0)),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
