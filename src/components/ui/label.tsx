import * as React from 'react';

import type { VariantProps } from 'class-variance-authority';

import * as LabelPrimitive from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';
import * as PropTypes from 'prop-types';

import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...properties }, reference) => (
  <LabelPrimitive.Root ref={reference} className={cn(labelVariants(), className)} {...properties} />
));

Label.displayName = LabelPrimitive.Root.displayName;

// Add prop types validation
Label.propTypes = {
  className: PropTypes.string
};

export { Label };
