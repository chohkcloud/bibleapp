import React, { ReactNode } from 'react';
import { ThemeProvider } from '../theme';

interface Props {
  children: ReactNode;
}

export function AppProviders({ children }: Props) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
