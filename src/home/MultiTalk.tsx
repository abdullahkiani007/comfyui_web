import { useCallback, useEffect, useState } from 'react';

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Image,
  Loader2,
  Music,
  Sparkles,
  Upload,
  X
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { uploadFileToS3, UploadProgress } from '@/services/s3Upload.service';

import BASE_WORKFLOW from '../workflows/ultra_real_workflow.json';

interface MultiTalkFormData {
  prompt: string;
  imageUrl: string;
  steps: number;
  audioUrl: string;
  mode: 'clip' | 'streaming' | 'clip';
  imageFile: File | null;
  audioFile: File | null;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface JobStatus {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  delayTime?: number;
  executionTime?: number;
  workerId?: string;
  output?: {
    output_video_url?: string;
    images?: Array<{
      data: string;
      file_type: string;
      format: string;
    }>;
    status?: string;
    metadata?: {
      width: number;
      height: number;
      seed: number;
      steps: number;
      cfg_scale: number;
      sampler_name: string;
      scheduler: string;
    };
  };
  error?: string;
  createdAt: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
}

export function Multitalk() {
  const [formData, setFormData] = useState<MultiTalkFormData>({
    prompt: '',
    imageUrl: '',
    steps: 20,
    audioUrl: '',
    mode: 'clip',
    imageFile: null,
    audioFile: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [imageUpload, setImageUpload] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null
  });
  const [audioUpload, setAudioUpload] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null
  });

  const stepOptions = [10, 20, 30, 40, 50, 60];

  // Update current time every second for live duration updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const pollJobStatus = useCallback(async (jobId: string, mode: 'pro' | 'standard') => {
    try {
      const serverId = import.meta.env.VITE_MULTI_TALK_H100;
      const response = await fetch(`https://api.runpod.ai/v2/${serverId}/status/${jobId}`, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_RUNPOD_API_KEY}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch job status: ${response.status}`);
      }
      const jobStatus: any = await response.json();

      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                ...jobStatus,
                processingStartedAt:
                  job.status === 'IN_QUEUE' &&
                  jobStatus.status === 'IN_PROGRESS' &&
                  !job.processingStartedAt
                    ? new Date()
                    : job.processingStartedAt,
                completedAt:
                  (jobStatus.status === 'COMPLETED' || jobStatus.status === 'FAILED') &&
                  !job.completedAt
                    ? new Date()
                    : job.completedAt
              }
            : job
        )
      );

      return jobStatus.status;
    } catch (err) {
      console.error(`Error polling job ${jobId}:`, err);
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: 'FAILED',
                error: 'Failed to poll job status',
                completedAt: new Date()
              }
            : job
        )
      );
      return 'FAILED';
    }
  }, []);

  const startPolling = useCallback(
    (jobId: string, mode: 'pro' | 'standard') => {
      // Simulate IN_QUEUE for 20 seconds
      const queueTimeout = setTimeout(() => {
        const pollInterval = setInterval(async () => {
          const status = await pollJobStatus(jobId, mode);
          if (status === 'COMPLETED' || status === 'FAILED') {
            clearInterval(pollInterval);
          }
        }, 10000); // Poll every 10 seconds after initial 20s
        return () => clearInterval(pollInterval);
      }, 20000); // 20 seconds delay

      return () => clearTimeout(queueTimeout);
    },
    [pollJobStatus]
  );

  const handleSubmit = async (e: React.FormEvent, mode: 'pro' | 'standard') => {
    e.preventDefault();

    if (!formData.prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!formData.imageUrl.trim()) {
      setError('Please upload an image or enter an image URL');
      return;
    }

    if (!formData.audioUrl.trim()) {
      setError('Please upload an audio file or enter an audio URL');
      return;
    }

    // Check if uploads are still in progress
    if (imageUpload.isUploading || audioUpload.isUploading) {
      setError('Please wait for file uploads to complete');
      return;
    }

    // Check for upload errors
    if (imageUpload.error || audioUpload.error) {
      setError('Please resolve upload errors before submitting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create the API payload in the specified format
      const payload = {
        input: {
          prompt: formData.prompt,
          cond_image: formData.imageUrl,
          steps: formData.steps,
          mode: formData.mode || 'clip',
          num_gpus: 2,
          cond_audio: {
            person1: formData.audioUrl
          }
        },
        id: `multitalk-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      };

      const serverId = import.meta.env.VITE_MULTI_TALK_H100;

      const response = await fetch(`https://api.runpod.ai/v2/${serverId}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_RUNPOD_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();

      const newJob: JobStatus = {
        id: data.id,
        status: 'IN_QUEUE',
        createdAt: new Date()
      };

      setJobs((prevJobs) => [newJob, ...prevJobs]);
      startPolling(data.id, mode);

      // Reset form
      // setFormData({
      //   prompt: '',
      //   imageUrl: '',
      //   steps: 20,
      //   audioUrl: '',
      //   imageFile: null,
      //   audioFile: null
      // });
      // setImageUpload({ isUploading: false, progress: 0, error: null });
      // setAudioUpload({ isUploading: false, progress: 0, error: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string, jobId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(jobId);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadImage = (base64Image: string, jobId: string, imageIndex = 0, fileType = 'png') => {
    const link = document.createElement('a');
    link.href = `data:image/${fileType};base64,${base64Image}`;
    link.download = `ultra-realism-${jobId.slice(0, 8)}-${imageIndex + 1}.${fileType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadVideo = (videoUrl: string, jobId: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `multitalk-${jobId.slice(0, 8)}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeJob = (jobId: string) => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageUpload((prev) => ({ ...prev, error: 'Please select a valid image file' }));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setImageUpload((prev) => ({ ...prev, error: 'Image file size must be less than 10MB' }));
      return;
    }

    setFormData((prev) => ({ ...prev, imageFile: file, imageUrl: '' }));
    setImageUpload({ isUploading: true, progress: 0, error: null });

    try {
      const result = await uploadFileToS3(file, 'multitalk/images', (progress) => {
        setImageUpload((prev) => ({ ...prev, progress: progress.percentage }));
      });

      setFormData((prev) => ({ ...prev, imageUrl: result.url }));
      setImageUpload({ isUploading: false, progress: 100, error: null });
    } catch (error) {
      console.error('Image upload failed:', error);
      setImageUpload({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
      setFormData((prev) => ({ ...prev, imageFile: null }));
    }
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setAudioUpload((prev) => ({ ...prev, error: 'Please select a valid audio file' }));
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setAudioUpload((prev) => ({ ...prev, error: 'Audio file size must be less than 50MB' }));
      return;
    }

    setFormData((prev) => ({ ...prev, audioFile: file, audioUrl: '' }));
    setAudioUpload({ isUploading: true, progress: 0, error: null });

    try {
      const result = await uploadFileToS3(file, 'multitalk/audio', (progress) => {
        setAudioUpload((prev) => ({ ...prev, progress: progress.percentage }));
      });

      setFormData((prev) => ({ ...prev, audioUrl: result.url }));
      setAudioUpload({ isUploading: false, progress: 100, error: null });
    } catch (error) {
      console.error('Audio upload failed:', error);
      setAudioUpload({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
      setFormData((prev) => ({ ...prev, audioFile: null }));
    }
  };

  const getStatusIcon = (status: JobStatus['status']) => {
    switch (status) {
      case 'IN_QUEUE':
        return <Clock className='h-4 w-4' />;
      case 'IN_PROGRESS':
        return <Loader2 className='h-4 w-4 animate-spin' />;
      case 'COMPLETED':
        return <CheckCircle2 className='h-4 w-4' />;
      case 'FAILED':
        return <AlertCircle className='h-4 w-4' />;
    }
  };

  const getStatusColor = (status: JobStatus['status']) => {
    switch (status) {
      case 'IN_QUEUE':
        return 'secondary';
      case 'IN_PROGRESS':
        return 'default';
      case 'COMPLETED':
        return 'default';
      case 'FAILED':
        return 'destructive';
    }
  };

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date(currentTime);
    const duration = Math.floor((endTime.getTime() - start.getTime()) / 1000);
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const getTimerStartTime = (job: JobStatus) => {
    // Use processingStartedAt if available (for IN_PROGRESS, COMPLETED, FAILED)
    // Otherwise use createdAt (fallback)
    return job.processingStartedAt || job.createdAt;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4'>
      <div className='mx-auto max-w-7xl space-y-6'>
        <div className='space-y-2 text-center'>
          <h1 className='text-4xl font-bold text-slate-900'>MultiTalk Generator</h1>
          <p className='text-slate-600'>Generate talking avatars with audio and image inputs</p>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          <Card className='lg:col-span-1'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Sparkles className='h-5 w-5' />
                Input Parameters
              </CardTitle>
              <CardDescription>Configure your talking avatar generation</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <form className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='prompt'>Prompt</Label>
                  <Textarea
                    id='prompt'
                    placeholder='A man speaking looking at the camera'
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    className='min-h-[80px] text-sm'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='imageInput' className='flex items-center gap-2'>
                    <Image className='h-4 w-4' />
                    Reference Image
                  </Label>

                  {/* Image Upload Option */}
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <input
                        id='imageFile'
                        type='file'
                        accept='image/*'
                        onChange={handleImageFileChange}
                        className='hidden'
                        disabled={imageUpload.isUploading}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => document.getElementById('imageFile')?.click()}
                        disabled={imageUpload.isUploading}
                        className='flex items-center gap-2'
                      >
                        <Upload className='h-4 w-4' />
                        {imageUpload.isUploading ? 'Uploading...' : 'Upload Image'}
                      </Button>
                      {formData.imageFile && (
                        <span className='text-xs text-slate-600'>{formData.imageFile.name}</span>
                      )}
                    </div>

                    {imageUpload.isUploading && (
                      <div className='space-y-1'>
                        <Progress value={imageUpload.progress} className='h-2' />
                        <p className='text-xs text-slate-500'>{imageUpload.progress}% uploaded</p>
                      </div>
                    )}

                    {imageUpload.error && (
                      <Alert variant='destructive'>
                        <AlertDescription className='text-xs'>{imageUpload.error}</AlertDescription>
                      </Alert>
                    )}

                    <div className='text-center text-xs text-slate-500'>or</div>

                    {/* URL Input Option */}
                    <Input
                      id='imageUrl'
                      type='url'
                      placeholder='https://example.com/image.png'
                      value={formData.imageUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, imageUrl: e.target.value, imageFile: null })
                      }
                      className='text-sm'
                      disabled={imageUpload.isUploading || !!formData.imageFile}
                    />
                  </div>

                  {/* Image Preview */}
                  {formData.imageUrl && (
                    <div className='mt-2'>
                      <img
                        src={formData.imageUrl}
                        alt='Preview'
                        className='h-20 w-20 rounded object-cover'
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='steps'>Number of Steps</Label>
                  <Select
                    value={formData.steps.toString()}
                    onValueChange={(value) => setFormData({ ...formData, steps: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-white-50'>
                      {stepOptions.map((step) => (
                        <SelectItem
                          key={step}
                          value={step.toString()}
                          className='hover:bg-gray-100'
                        >
                          {step} steps
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='steps'>Mode</Label>
                  <Select
                    value={formData.mode}
                    onValueChange={(value) =>
                      setFormData({ ...formData, mode: value as 'clip' | 'streaming' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='bg-white-50'>
                      {['clip', 'streaming'].map((step) => (
                        <SelectItem
                          key={step}
                          value={step.toString()}
                          className='hover:bg-gray-100'
                        >
                          {step}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='audioInput' className='flex items-center gap-2'>
                    <Music className='h-4 w-4' />
                    Reference Audio
                  </Label>

                  {/* Audio Upload Option */}
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <input
                        id='audioFile'
                        type='file'
                        accept='audio/*'
                        onChange={handleAudioFileChange}
                        className='hidden'
                        disabled={audioUpload.isUploading}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => document.getElementById('audioFile')?.click()}
                        disabled={audioUpload.isUploading}
                        className='flex items-center gap-2'
                      >
                        <Upload className='h-4 w-4' />
                        {audioUpload.isUploading ? 'Uploading...' : 'Upload Audio'}
                      </Button>
                      {formData.audioFile && (
                        <span className='text-xs text-slate-600'>{formData.audioFile.name}</span>
                      )}
                    </div>

                    {audioUpload.isUploading && (
                      <div className='space-y-1'>
                        <Progress value={audioUpload.progress} className='h-2' />
                        <p className='text-xs text-slate-500'>{audioUpload.progress}% uploaded</p>
                      </div>
                    )}

                    {audioUpload.error && (
                      <Alert variant='destructive'>
                        <AlertDescription className='text-xs'>{audioUpload.error}</AlertDescription>
                      </Alert>
                    )}

                    <div className='text-center text-xs text-slate-500'>or</div>

                    {/* URL Input Option */}
                    <Input
                      id='audioUrl'
                      type='url'
                      placeholder='https://example.com/audio.wav'
                      value={formData.audioUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, audioUrl: e.target.value, audioFile: null })
                      }
                      className='text-sm'
                      disabled={audioUpload.isUploading || !!formData.audioFile}
                    />
                  </div>

                  {/* Audio Preview */}
                  {formData.audioUrl && (
                    <div className='mt-2'>
                      <audio controls className='h-8 w-full'>
                        <source src={formData.audioUrl} />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant='destructive'>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className='flex gap-4'>
                  {/* <Button
                    type='submit'
                    disabled={
                      isSubmitting ||
                      imageUpload.isUploading ||
                      audioUpload.isUploading ||
                      !formData.prompt.trim() ||
                      !formData.imageUrl.trim() ||
                      !formData.audioUrl.trim()
                    }
                    className='w-full bg-indigo-600 hover:bg-indigo-700'
                    onClick={(e) => handleSubmit(e, 'pro')}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className='mr-2 h-4 w-4' />
                        Generate (Pro)
                      </>
                    )}
                  </Button> */}
                  <Button
                    type='submit'
                    disabled={
                      isSubmitting ||
                      imageUpload.isUploading ||
                      audioUpload.isUploading ||
                      !formData.prompt.trim() ||
                      !formData.imageUrl.trim() ||
                      !formData.audioUrl.trim()
                    }
                    className='w-full bg-teal-600 hover:bg-teal-700'
                    onClick={(e) => handleSubmit(e, 'standard')}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className='mr-2 h-4 w-4' />
                        Generate (Standard)
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span>Job Queue ({jobs.length})</span>
                {jobs.length > 0 && (
                  <Button variant='outline' size='sm' onClick={() => setJobs([])}>
                    Clear All
                  </Button>
                )}
              </CardTitle>
              <CardDescription>Track your generation jobs and view results</CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className='py-12 text-center text-slate-500'>
                  <Sparkles className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  <p>No jobs in queue. Configure parameters and submit to get started.</p>
                </div>
              ) : (
                <ScrollArea className='h-[600px] pr-4'>
                  <div className='space-y-4'>
                    {jobs.map((job, index) => (
                      <Card key={job.id} className='relative'>
                        <CardHeader className='pb-3'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <Badge
                                variant={getStatusColor(job.status)}
                                className='flex items-center gap-1'
                              >
                                {getStatusIcon(job.status)}
                                {job.status.replace('_', ' ')}
                              </Badge>
                              <span className='text-sm text-slate-600'>
                                ID: {job.id.slice(0, 8)}...
                              </span>
                            </div>
                            <div className='flex items-center gap-2'>
                              {job.status !== 'IN_QUEUE' && (
                                <span className='text-xs text-slate-500'>
                                  {formatDuration(getTimerStartTime(job), job.completedAt)}
                                </span>
                              )}
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => removeJob(job.id)}
                                className='h-6 w-6 p-0'
                              >
                                <X className='h-3 w-3' />
                              </Button>
                            </div>
                          </div>

                          {job.status === 'IN_PROGRESS' && job.delayTime && (
                            <div className='space-y-2'>
                              <div className='flex justify-between text-xs text-slate-600'>
                                <span>Processing...</span>
                                <span>Worker: {job.workerId?.slice(0, 8)}</span>
                              </div>
                              <Progress value={75} className='h-1' />
                            </div>
                          )}
                        </CardHeader>

                        {job.status === 'COMPLETED' && job.output && (
                          <CardContent className='pt-0'>
                            <div className='space-y-4'>
                              {/* Video Output */}
                              {job.output.output_video_url && (
                                <div className='space-y-2'>
                                  <h4 className='text-sm font-medium'>Generated Video</h4>
                                  <div className='group relative'>
                                    <video
                                      controls
                                      className='w-full rounded-lg shadow-sm'
                                      style={{ maxHeight: '400px' }}
                                    >
                                      <source src={job.output.output_video_url} type='video/mp4' />
                                      Your browser does not support the video tag.
                                    </video>
                                    <div className='absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100'>
                                      <div className='flex gap-1'>
                                        <Button
                                          size='sm'
                                          variant='secondary'
                                          onClick={() =>
                                            copyToClipboard(
                                              job.output?.output_video_url || '',
                                              job.id
                                            )
                                          }
                                          className='h-8 w-8 p-0'
                                        >
                                          {copied === job.id ? (
                                            <Check className='h-3 w-3' />
                                          ) : (
                                            <Copy className='h-3 w-3' />
                                          )}
                                        </Button>
                                        <Button
                                          size='sm'
                                          variant='secondary'
                                          onClick={() =>
                                            downloadVideo(
                                              job.output?.output_video_url || '',
                                              job.id
                                            )
                                          }
                                          className='h-8 w-8 p-0'
                                        >
                                          <Download className='h-3 w-3' />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Image Output (fallback for other workflows) */}
                              {job.output.images && (
                                <div className='grid grid-cols-1 gap-4'>
                                  {job.output.images.map((imageObj, imageIndex) => (
                                    <div key={imageIndex} className='space-y-2'>
                                      <div className='group relative'>
                                        <img
                                          src={`data:image/${imageObj.file_type};base64,${imageObj.data}`}
                                          alt={`Generated image ${imageIndex + 1}`}
                                          className='rounded-lg shadow-sm'
                                          crossOrigin='anonymous'
                                          width={512}
                                          height={512}
                                          style={{ width: 512, height: 512, objectFit: 'cover' }}
                                        />
                                        <div className='absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100'>
                                          <div className='flex gap-1'>
                                            <Button
                                              size='sm'
                                              variant='secondary'
                                              onClick={() => copyToClipboard(imageObj.data, job.id)}
                                              className='h-8 w-8 p-0'
                                            >
                                              {copied === job.id ? (
                                                <Check className='h-3 w-3' />
                                              ) : (
                                                <Copy className='h-3 w-3' />
                                              )}
                                            </Button>
                                            <Button
                                              size='sm'
                                              variant='secondary'
                                              onClick={() =>
                                                downloadImage(
                                                  imageObj.data,
                                                  job.id,
                                                  imageIndex,
                                                  imageObj.file_type
                                                )
                                              }
                                              className='h-8 w-8 p-0'
                                            >
                                              <Download className='h-3 w-3' />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Generation Details */}
                              <div className='rounded-lg bg-slate-50 p-3'>
                                <h4 className='mb-2 text-sm font-medium'>Generation Details</h4>
                                <div className='grid grid-cols-2 gap-2 text-xs'>
                                  <div>
                                    <span className='text-slate-500'>Execution Time:</span>
                                    <p>
                                      {job.executionTime
                                        ? `${(job.executionTime / 1000).toFixed(1)}s`
                                        : 'N/A'}
                                    </p>
                                  </div>
                                  <div>
                                    <span className='text-slate-500'>Queue Time:</span>
                                    <p>
                                      {job.delayTime
                                        ? `${(job.delayTime / 1000).toFixed(1)}s`
                                        : 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                {job.workerId && (
                                  <div className='mt-2 text-xs'>
                                    <span className='text-slate-500'>Worker ID:</span>
                                    <p>{job.workerId}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        )}

                        {job.status === 'FAILED' && (
                          <CardContent className='pt-0'>
                            <Alert variant='destructive'>
                              <AlertCircle className='h-4 w-4' />
                              <AlertDescription>
                                {job.error || 'Job failed to complete'}
                              </AlertDescription>
                            </Alert>
                          </CardContent>
                        )}

                        {index < jobs.length - 1 && <Separator className='mt-4' />}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
