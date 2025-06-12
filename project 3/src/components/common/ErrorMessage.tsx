import { XCircle } from 'lucide-react';

type ErrorMessageProps = {
  message: string;
};

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
      <div className="flex items-center">
        <XCircle className="h-5 w-5 mr-2" />
        <span>{message}</span>
      </div>
    </div>
  );
}