import * as React from 'react';

import type { VariantProps } from 'class-variance-authority';

import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...properties }, reference) => (
  <ToastPrimitives.Viewport
    ref={reference}
    className={cn(
      'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
      className
    )}
    {...properties}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'destructive group border-destructive bg-destructive text-destructive-foreground',
        success: 'border-green-600 bg-green-600 text-white',
        info: 'border-blue-600 bg-blue-600 text-white',
        warning: 'border-yellow-600 bg-yellow-600 text-black',
        contact: 'border-primary-600 bg-primary-600 text-white-50'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

interface ToastProperties_
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>,
    VariantProps<typeof toastVariants> {
  className?: string;
}

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitives.Root>, ToastProperties_>(
  ({ className, variant, ...properties }, reference) => {
    return (
      <ToastPrimitives.Root
        ref={reference}
        className={cn(toastVariants({ variant }), className)}
        {...properties}
      />
    );
  }
);
Toast.displayName = ToastPrimitives.Root.displayName;

interface ToastActionProperties
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action> {
  className?: string;
}

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  ToastActionProperties
>(({ className, ...properties }, reference) => (
  <ToastPrimitives.Action
    ref={reference}
    className={cn(
      'ring-offset-background hover:bg-secondary focus:ring-ring group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...properties}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

interface ToastCloseProperties
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close> {
  className?: string;
}

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  ToastCloseProperties
>(({ className, ...properties }, reference) => (
  <ToastPrimitives.Close
    ref={reference}
    className={cn(
      'text-foreground/50 hover:text-foreground absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
      className
    )}
    toast-close=''
    {...properties}
  >
    <X className='h-4 w-4' />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

interface ToastTitleProperties
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title> {
  className?: string;
}

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  ToastTitleProperties
>(({ className, ...properties }, reference) => (
  <ToastPrimitives.Title
    ref={reference}
    className={cn('text-sm font-semibold', className)}
    {...properties}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

interface ToastDescriptionProperties
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description> {
  className?: string;
}

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  ToastDescriptionProperties
>(({ className, ...properties }, reference) => (
  <ToastPrimitives.Description
    ref={reference}
    className={cn('text-sm opacity-90', className)}
    {...properties}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProperties = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProperties as ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction
};
