'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, PartyPopper, Stars } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export default function WelcomeDialog({
  isOpen = true,
  onClose = () => {}
}: {
  isOpen?: boolean;
  onClose?: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md rounded-2xl border-none bg-brand-500 p-6 shadow-lg'>
        <DialogHeader className='gap-4 text-center sm:gap-6'>
          <div className='mx-auto flex items-center justify-center'>
            <div className='relative'>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
              >
                <div className='rounded-full bg-brand-500/20 p-3'>
                  <CheckCircle2 className='h-12 w-12 text-brand-600' strokeWidth={1.5} />
                </div>
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5, delay: 0.1 }}
                className='absolute -right-1 -top-1'
              >
                <Stars className='h-6 w-6 text-brand-500' fill='currentColor' />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5, delay: 0.2 }}
                className='absolute -left-2 bottom-0'
              >
                <PartyPopper className='h-8 w-8 text-brand-600' />
              </motion.div>
            </div>
          </div>
          <div className='space-y-2'>
            <DialogTitle className='font-heading text-2xl font-semibold tracking-tight text-primary-700'>
              Welcome Onboard!
            </DialogTitle>
            <DialogDescription className='text-base text-primary-600'>
              We&apos;re thrilled to have you join us. Let&apos;s get your account set up and
              running.
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className='mt-4 space-y-3 rounded-2xl bg-brand-200 p-4 text-sm'>
          <div className='flex items-start gap-3'>
            <div className='rounded-full bg-brand-500/20 p-1'>
              <CheckCircle2 className='h-4 w-4 text-brand-600' />
            </div>
            <div>
              <p className='font-medium text-primary-700'>Check Your Email</p>
              <p className='text-primary-600'>
                We&apos;ve sent you an email with instructions to set up your password
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <div className='rounded-full bg-brand-500/20 p-1'>
              <CheckCircle2 className='h-4 w-4 text-brand-600' />
            </div>
            <div>
              <p className='font-medium text-primary-700'>Play with your fleet</p>
              <p className='text-primary-600'>
                Define your zone, set your fleet, and start playing!
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className='mt-6'>
          <Button
            onClick={onClose}
            className='w-full rounded-full bg-brand-800 font-medium text-white-50 hover:bg-brand-700'
          >
            Got it, thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
