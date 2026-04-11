import React, { createContext, useContext } from 'react';
import { useUserInfo } from '@cms/sdk';

interface UserContextValue {
  userInfo: any | null | undefined;
  userId: string | undefined;
  isLoggedIn: boolean;
  isLoading: boolean;
}

const UserContext = createContext<UserContextValue>({
  userInfo: undefined,
  userId: undefined,
  isLoggedIn: false,
  isLoading: true,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: userInfo, isLoading } = useUserInfo();

  const value: UserContextValue = {
    userInfo: userInfo ?? null,
    userId: userInfo?.id,
    isLoggedIn: !!userInfo,
    isLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
