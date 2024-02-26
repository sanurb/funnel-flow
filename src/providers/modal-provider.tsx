"use client";

import { Agency, User } from "@prisma/client";
import { FC, ReactNode, createContext, useContext, useState } from "react";

interface ModalProviderProps {
    children: React.ReactNode;
  }
  
  type ModalData = {
    user?: User;
    agency?: Agency;
  };
  
  type ModalContextType = {
    data: ModalData;
    isOpen: boolean;
    setOpen: (modal: ReactNode, fetchData?: () => Promise<ModalData>) => Promise<void>;
    setClose: () => void;
  };
  
  const ModalContext = createContext<ModalContextType | undefined>(undefined);
  
  const ModalProvider: FC<ModalProviderProps> = ({ children }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [data, setData] = useState<ModalData>({});
    const [ModalComponent, setModalComponent] = useState<ReactNode>(null);
  
    const setOpen = async (modal: ReactNode, fetchData?: () => Promise<ModalData>) => {
      if (fetchData) {
        try {
          const fetchedData = await fetchData();
          setData(fetchedData);
        } catch (error) {
          console.error("Error fetching modal data:", error);
        }
      }
      setModalComponent(modal);
      setIsOpen(true);
    };
  
    const setClose = () => {
      setIsOpen(false);
      setData({});
      setModalComponent(null);
    };
  
    return (
      <ModalContext.Provider value={{ data, isOpen, setOpen, setClose }}>
        {children}
        {isOpen && ModalComponent}
      </ModalContext.Provider>
    );
  };
  
  export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
      throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
  };
  
  export default ModalProvider;