import { createContext, ReactNode, useContext, useState } from 'react';
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

  const addProduct = async (productId: number) => {
    try {
      //instância de cart
      const newCart = [...cart];
      //Verificar se o produto existe no carrinho
      const productExists = newCart.find(product => product.id === productId);
      
      if(productExists) {
        //Verificar se tem estoque
        const stock = await api.get(`/stock/${productId}`);
        const { data } = stock;
        
        if(data.amount < productExists.amount + 1) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }

        productExists.amount += 1;
      }else {
        const response = await api.get(`/products/${productId}`);
        
        const newProduct = {
          ...response.data,
          amount: 1
        };
        newCart.push(newProduct)
      }

      setCart(newCart)
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch(e) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];

      const productsExistsIndex = newCart.findIndex((product) => product.id === productId);

      if(productsExistsIndex === -1) {
        toast.error('Erro na remoção do produto');
        return;
      }

      newCart.splice(productsExistsIndex, 1);

      setCart(newCart)
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      
      const newCart = [...cart];

      const productExists = newCart.find((product) => product.id === productId);

      if(!productExists) {
        throw Error();
      }

      if(amount <= 0) {
        return;
      }

      const stock = await api.get(`/stock/${productId}`);
      const { data } = stock;

      if(data.amount < amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      productExists.amount = amount;
      
      setCart(newCart)
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
