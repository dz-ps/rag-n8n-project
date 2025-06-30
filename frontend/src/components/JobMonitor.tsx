import React from 'react';
import { CheckCircle, XCircle, Loader, Clock } from 'lucide-react';
import { Job } from '../types';

interface JobMonitorProps {
  jobs: Job[];
}

export const JobMonitor: React.FC<JobMonitorProps> = ({ jobs }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-200';
      case 'error':
        return 'bg-red-100 border-red-200';
      case 'processing':
        return 'bg-blue-100 border-blue-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div
          key={job.id}
          className={`border rounded-lg p-4 ${getStatusColor(job.status)}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(job.status)}
              <div>
                <h4 className="font-medium text-gray-900">{job.filename}</h4>
                <p className="text-sm text-gray-600">
                  Status: {job.status === 'processing' ? 'Processando' : 
                          job.status === 'completed' ? 'Concluído' : 'Erro'}
                </p>
                {job.error && (
                  <p className="text-sm text-red-600">Erro: {job.error}</p>
                )}
                {job.chunk_count && (
                  <p className="text-sm text-gray-600">
                    {job.chunk_count} chunks processados
                  </p>
                )}
              </div>
            </div>
            
            {job.status === 'processing' && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {job.progress}%
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
