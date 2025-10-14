import * as React from 'react';

declare module 'react-konva' {
  interface StageProps {
    children?: React.ReactNode;
  }
  interface LayerProps {
    children?: React.ReactNode;
  }
}
