import type { ComponentPropsWithoutRef, ComponentType } from 'react';

type NativeSvgProps = Omit<
  ComponentPropsWithoutRef<'svg'>,
  'children' | 'height' | 'viewBox' | 'width'
>;

export interface IconProps extends NativeSvgProps {
  size?: number | string;
  title?: string;
}

export type IconComponent = ComponentType<IconProps>;
