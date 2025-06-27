import { useState } from 'react';

import type React from 'react';

import { Check, Copy, Download, Loader2, Upload } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface RunPodResponse {
  id: string;
  status: string;
  output?: {
    images?: string[];
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
}

export function ComfyUIGenerator() {
  const [workflow, setWorkflow] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<RunPodResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validateJSON = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

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

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Parse the workflow to ensure it's valid JSON
      const parsedWorkflow = JSON.parse(workflow);

      // Simulate RunPod API call
      // In a real implementation, you would replace this with your actual RunPod endpoint
      const runpodResponse = await fetch('/api/runpod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow: parsedWorkflow
        })
      });

      if (!runpodResponse.ok) {
        throw new Error(`HTTP error! status: ${runpodResponse.status}`);
      }

      const data: any = await runpodResponse.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadImage = (base64Image: string, filename = 'comfyui-generated-image.png') => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64Image}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <div className='space-y-2 text-center'>
          <h1 className='text-4xl font-bold text-slate-900'>ComfyUI Image Generator</h1>
          <p className='text-slate-600'>
            Send your ComfyUI workflow to RunPod and generate amazing images
          </p>
        </div>

        <div className='grid gap-6 lg:grid-cols-2'>
          {/* Input Section */}
          <Card>
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

                <Button type='submit' disabled={isLoading || !workflow.trim()} className='w-full'>
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Processing Workflow...
                    </>
                  ) : (
                    <>
                      <Upload className='mr-2 h-4 w-4' />
                      Generate Image
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Output Section */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Output</CardTitle>
              <CardDescription>Your generated images and metadata will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className='flex items-center justify-center py-12'>
                  <div className='space-y-4 text-center'>
                    <Loader2 className='mx-auto h-8 w-8 animate-spin text-blue-500' />
                    <p className='text-slate-600'>Generating your image...</p>
                  </div>
                </div>
              )}

              {response && response.output?.images && (
                <div className='space-y-6'>
                  {/* Status Badge */}
                  <div className='flex items-center gap-2'>
                    <Badge variant={response.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {response.status}
                    </Badge>
                    <span className='text-sm text-slate-600'>ID: {response.id}</span>
                  </div>

                  {/* Generated Images */}
                  <div className='space-y-4'>
                    {response.output.images.map((base64Image, index) => (
                      <div key={index} className='space-y-3'>
                        <div className='group relative'>
                          <img
                            src={`data:image/png;base64,${base64Image}`}
                            alt={`Generated image ${index + 1}`}
                            width={512}
                            height={512}
                            className='h-auto w-full rounded-lg shadow-lg'
                            crossOrigin='anonymous'
                          />
                          <div className='absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100'>
                            <div className='flex gap-2'>
                              <Button
                                size='sm'
                                variant='secondary'
                                onClick={() => copyToClipboard(base64Image)}
                              >
                                {copied ? (
                                  <Check className='h-4 w-4' />
                                ) : (
                                  <Copy className='h-4 w-4' />
                                )}
                              </Button>
                              <Button
                                size='sm'
                                variant='secondary'
                                onClick={() => downloadImage(base64Image, `image-${index + 1}.png`)}
                              >
                                <Download className='h-4 w-4' />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Metadata */}
                  {response.output.metadata && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>Generation Metadata</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='grid grid-cols-2 gap-4 text-sm'>
                          <div>
                            <span className='font-medium'>Dimensions:</span>
                            <p className='text-slate-600'>
                              {response.output.metadata.width} × {response.output.metadata.height}
                            </p>
                          </div>
                          <div>
                            <span className='font-medium'>Seed:</span>
                            <p className='text-slate-600'>{response.output.metadata.seed}</p>
                          </div>
                          <div>
                            <span className='font-medium'>Steps:</span>
                            <p className='text-slate-600'>{response.output.metadata.steps}</p>
                          </div>
                          <div>
                            <span className='font-medium'>CFG Scale:</span>
                            <p className='text-slate-600'>{response.output.metadata.cfg_scale}</p>
                          </div>
                          <div>
                            <span className='font-medium'>Sampler:</span>
                            <p className='text-slate-600'>
                              {response.output.metadata.sampler_name}
                            </p>
                          </div>
                          <div>
                            <span className='font-medium'>Scheduler:</span>
                            <p className='text-slate-600'>{response.output.metadata.scheduler}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {response && response.error && (
                <Alert variant='destructive'>
                  <AlertDescription>{response.error}</AlertDescription>
                </Alert>
              )}

              {!isLoading && !response && (
                <div className='py-12 text-center text-slate-500'>
                  <Upload className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  <p>Submit a workflow to see generated images here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
