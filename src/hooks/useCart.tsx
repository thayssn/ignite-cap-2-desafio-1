import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  // useEffect(() => {
  //   localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
  // }, [cart])

  const addProduct = async (productId: number) => {
    try {

      const productInCart = cart.find( ({id}) => id === productId);

      if(productInCart)
        return updateProductAmount({ productId: productInCart.id, amount: productInCart.amount + 1})

      const { data: product } = await api.get(`/products/${productId}`);
      
      if(!product) throw new Error;
      
      product.amount = 1;
      
      const updatedCart = [...cart, product]

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch(err) {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {

      if(!cart.find( ({id}) => id === productId)) throw new Error;
        
      const updatedCart = cart.filter( product => product.id !== productId );

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(!cart.find( ({id}) => id === productId)) throw new Error('Erro na alteração de quantidade do produto');
      
      if(amount <= 0) throw new Error('Erro ao atualizar quantidade');

      const { data: stock } = await api.get(`/stock/${productId}`)
      
      if(!stock) throw new Error('Produto não existe');
      
      if(amount > stock.amount ) throw new Error('Quantidade solicitada fora de estoque');
  
      const updatedCart = cart.map(product => product.id === productId ? {...product, amount} : product);
  
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch(err) {
      toast.error(err.message)
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
