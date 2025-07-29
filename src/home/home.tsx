import { ImagePlus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className='via-white flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4'>
      <div className='max-w-2xl space-y-10 text-center'>
        <div>
          <h1 className='mb-4 text-5xl font-bold text-slate-900'>AI Image Tools</h1>
          <p className='text-lg text-slate-600'>
            Select a tool to get started with AI-powered image generation.
          </p>
        </div>

        <div className='flex flex-col items-center justify-center gap-6 sm:flex-row'>
          <Button
            className='text-white flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-6 text-lg shadow-lg transition-transform hover:scale-105 hover:bg-blue-700'
            onClick={() => navigate('/upscale')}
          >
            <ImagePlus className='h-6 w-6' />
            Upscale Image
          </Button>

          <Button
            className='text-white flex items-center gap-2 rounded-2xl bg-purple-600 px-8 py-6 text-lg shadow-lg transition-transform hover:scale-105 hover:bg-purple-700'
            onClick={() => navigate('/ultra-realism')}
          >
            <Sparkles className='h-6 w-6' />
            Ultra Realism
          </Button>

          <Button
            className='text-white flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-6 text-lg shadow-lg transition-transform hover:scale-105 hover:bg-green-700'
            onClick={() => navigate('/multi-talk')}
          >
            <Sparkles className='h-6 w-6' />
            Multi Talk
          </Button>

          <Button
            className='text-white flex items-center gap-2 rounded-2xl bg-orange-600 px-8 py-6 text-lg shadow-lg transition-transform hover:scale-105 hover:bg-green-700'
            onClick={() => navigate('/hidream')}
          >
            <ImagePlus className='h-6 w-6' />
            HiDream
          </Button>

          <Button
            className='text-white flex items-center gap-2 rounded-2xl bg-red-600 px-8 py-6 text-lg shadow-lg transition-transform hover:scale-105 hover:bg-green-700'
            onClick={() => navigate('/wan22')}
          >
            <Sparkles className='h-6 w-6' />
            Wan2.2
          </Button>
        </div>
      </div>
    </div>
  );
}
