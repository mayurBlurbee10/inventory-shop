import { FileIcon } from "lucide-react";

const EmptyState = ({checkLoading}) => (
  <div className="flex flex-col w-full items-center justify-center py-12 text-gray-500">
    <FileIcon size={48} className="mb-4 opacity-50" />
    {
      checkLoading ? (<p>Fetching files and folders </p>) : (<p>No files or folders found</p>)
    }
    
  </div>
);

export default EmptyState;
