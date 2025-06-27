'use client';

import { useCallback, useState } from 'react';

import type React from 'react';

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Loader2,
  Upload,
  X
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface JobStatus {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  delayTime?: number;
  executionTime?: number;
  workerId?: string;
  output?: {
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
  completedAt?: Date;
}

export function ComfyUIGenerator() {
  const [workflow, setWorkflow] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const validateJSON = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      // const response = await fetch(`https://api.runpod.ai/v2/1ogep048h90n35/status/${jobId}`, {
      const response = await fetch(
        `https://api.runpod.ai/v2/${import.meta.env.VITE_RUNPOD_SERVER_ID}/status/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_RUNPOD_API_KEY}`
          }
        }
      );
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
    (jobId: string) => {
      const pollInterval = setInterval(async () => {
        const status = await pollJobStatus(jobId);
        if (status === 'COMPLETED' || status === 'FAILED') {
          clearInterval(pollInterval);
        }
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(pollInterval);
    },
    [pollJobStatus]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workflow.trim()) {
      setError('Please enter a ComfyUI workflow JSON');
      return;
    }

    if (!validateJSON(workflow)) {
      setError('Invalid JSON format. Please check your workflow.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const input = JSON.parse(workflow);

      const response = await fetch(
        `https://api.runpod.ai/v2/${import.meta.env.VITE_RUNPOD_SERVER_ID}/run`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_RUNPOD_API_KEY}`
          },
          body: JSON.stringify(input)
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();

      // Add new job to the queue
      const newJob: JobStatus = {
        id: data.id,
        status: data.status,
        createdAt: new Date()
      };

      setJobs((prevJobs) => [newJob, ...prevJobs]);

      // Start polling for this job
      startPolling(data.id);

      // Clear the workflow input
      setWorkflow('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit workflow');
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
    link.download = `comfyui-${jobId.slice(0, 8)}-${imageIndex + 1}.${fileType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeJob = (jobId: string) => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
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
    const endTime = end || new Date();
    const duration = Math.floor((endTime.getTime() - start.getTime()) / 1000);
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4'>
      <div className='mx-auto max-w-7xl space-y-6'>
        <div className='space-y-2 text-center'>
          <h1 className='text-4xl font-bold text-slate-900'>ComfyUI Image Generator</h1>
          <p className='text-slate-600'>
            Send your ComfyUI workflow to RunPod and generate amazing images
          </p>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Input Section */}
          <Card className='lg:col-span-1'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Upload className='h-5 w-5' />
                Workflow Input
              </CardTitle>
              <CardDescription>Paste your ComfyUI workflow JSON below</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='workflow'>ComfyUI Workflow JSON</Label>
                  <Textarea
                    id='workflow'
                    placeholder='{"1": {"inputs": {"text": "a beautiful landscape"}, "class_type": "CLIPTextEncode"}, ...}'
                    value={workflow}
                    onChange={(e) => setWorkflow(e.target.value)}
                    className='min-h-[300px] font-mono text-sm'
                  />
                </div>

                {error && (
                  <Alert variant='destructive'>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type='submit'
                  disabled={isSubmitting || !workflow.trim()}
                  className='w-full'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className='mr-2 h-4 w-4' />
                      Add to Queue
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Job Queue Section */}
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
                  <Upload className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  <p>No jobs in queue. Submit a workflow to get started.</p>
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
                              <span className='text-xs text-slate-500'>
                                {formatDuration(job.createdAt, job.completedAt)}
                              </span>
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

                        {job.status === 'COMPLETED' && job.output?.images && (
                          <CardContent className='pt-0'>
                            <div className='space-y-4'>
                              {/* Generated Images */}
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

                              {/* Metadata */}
                              {job.output.metadata && (
                                <div className='rounded-lg bg-slate-50 p-3'>
                                  <h4 className='mb-2 text-sm font-medium'>Generation Details</h4>
                                  <div className='grid grid-cols-3 gap-2 text-xs'>
                                    <div>
                                      <span className='text-slate-500'>Size:</span>
                                      <p>
                                        {job.output.metadata.width}×{job.output.metadata.height}
                                      </p>
                                    </div>
                                    <div>
                                      <span className='text-slate-500'>Steps:</span>
                                      <p>{job.output.metadata.steps}</p>
                                    </div>
                                    <div>
                                      <span className='text-slate-500'>CFG:</span>
                                      <p>{job.output.metadata.cfg_scale}</p>
                                    </div>
                                  </div>
                                  <div className='mt-2 grid grid-cols-2 gap-2 text-xs'>
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
                                </div>
                              )}
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
