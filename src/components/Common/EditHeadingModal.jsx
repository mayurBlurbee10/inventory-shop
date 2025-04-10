import React, { useEffect, useState } from 'react';
import Button from './Elements/Button';
import { Controller, useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import TextEditor from '../Plugins/RTE/TextEditor';
import { X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { fetchWrapper } from '@/app/lib/fetchWrapper';
import { setContent } from '@/store/services/contentService';
import { toast } from 'react-toastify';

const EditHeadingModal = ({ isOpen, onClose, from }) => {
  const { data: content } = useSelector((state) => state.content);
  const [isLoading, setIsLoading] = useState(false);
  const [description, setDescription] = useState(false);
  const params = useParams();
    const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: from || '',
      value: '',
      type: 'text',
      portalId: params.portalid,
      fontSize: '20px',
    },
  });

  // Filter description from state based on title
  const filterValue = (title) => {
    if (!content) return '';
    const contentItem = content.portalContent.find(item => item.title === title);
    const value = contentItem ? contentItem.value : null;

    if (!value) {
      const defaultItem = content.defaultContent.find(item => item.title === title);
      return defaultItem ? defaultItem.value : '';
    }

    return value;
  };

  // Populate form values when modal opens or data changes
  useEffect(() => {
    if (from) {
      const desc = filterValue(from);
      setDescription(desc);
      reset({
        title: from,
        value: desc,
        type: 'text',
        portalId: params.portalid,
        fontSize: '20px',
      });
    }
  }, [from, content, reset]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      console.log('Submitted Data:', data);
      setIsLoading(true);
      const response = await fetchWrapper(
        "/api/contentManagement",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
        "update-heading"
      );
  
      if (!response.ok) throw new Error("Failed to update portal theme");
  
      console.log("Response:", response);
      dispatch(setContent(params.portalid));
      setIsLoading(false);
      onClose()
      toast.success("Heading updated successfully");
    } catch (error) {
      console.error("Submission Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 min-h-screen text-gray-700 bg-black/10 bg-opacity-80 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg w-[90%] max-w-[1000px] flex flex-col relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col justify-center items-center p-5 space-y-4"
            >
              <div className="flex flex-col w-full">
                <label className="text-xl font-semibold mb-1">Title</label>
                <div className="px-4">
                  <input
                    type="text"
                    {...register("title")}
                    readOnly
                    className="w-full px-4 py-3 border rounded-lg outline-none text-text"
                  />
                </div>
              </div>

              <div className="flex flex-col w-full max-h-[500px]">
                <label className="text-xl font-semibold mb-1">Description</label>
                <Controller
                  name="value"
                  control={control}
                  render={({ field }) => (
                    <TextEditor
                      description={description}
                      from={from}
                      content={description ? description : field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="w-full flex items-center justify-end mr-12 gap-2">
                <Button type="Secondary" label="Cancel" disabled={isLoading} onClick={onClose}/>
                <Button buttonType="submit" type="Primary" label="Update" isLoading={isLoading} disabled={isLoading}/>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EditHeadingModal;
