import { useState } from 'react';

import { jobTypes } from '@/constants/constants';

export const useJob = () => {
  const [jobs, setJobs] = useState<any[]>([]);

  const pollJobStatus = async (jobId: string, serverId: string) => {
    try {
      // const response = await fetch(`https://api.runpod.ai/v2/1ogep048h90n35/status/${jobId}`, {
      const response = await fetch(`https://api.runpod.ai/v2/${serverId}/status/${jobId}`, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_RUNPOD_API_KEY}`
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch job status: ${response.status}`);
      }
      const jobStatus: any = await response.json();

      setJobs((prevJobs: any) =>
        prevJobs.map((job: any) =>
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
      setJobs((prevJobs: any) =>
        prevJobs.map((job: any) =>
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
    }
    return 'FAILED';
  };

  const addJob = (newJob: any) => {
    if (newJob.id) {
      setJobs((prevJobs: any) => [newJob, ...prevJobs]);
    }
  };
  const removeJob = (jobId: string) => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
  };

  const clearJobs = (jobType: jobTypes) => {
    setJobs((prevJobs) => prevJobs.filter((job) => job.type !== jobType));
  };

  const handleSubmit = async (workflow: any) => {
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
      const newJob = {
        id: data.id,
        status: data.status,
        jobType: jobTypes.upscaler,
        createdAt: new Date()
      };

      addJob(newJob);

      return {
        success: true,
        jobId: newJob.id,
        message: 'Workflow submitted successfully'
      };
    } catch (err) {
      return err instanceof Error ? err.message : 'Failed to submit workflow';
    } finally {
    }
  };

  return [pollJobStatus, jobs, addJob, removeJob, clearJobs] as const;
};
