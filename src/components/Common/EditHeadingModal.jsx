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

const EditHeadingModal = ({ isOpen, onClose, data }) => {
  const [isLoading, setIsLoading] = useState(false);
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
      title: data?.title || '',
      value: data?.value || '',
      type: 'Text',
      portalId: params.portalid,
      fontSize: '20px',
    },
  });

  // Populate form values when modal opens or data changes
  useEffect(() => {
    if (data) {
      reset({
        title: data?.title || '',
        value: data?.value || '',
        type: 'Text',
        portalId: params.portalid,
        fontSize: '20px',
      });
    }
  }, [data, reset]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {

      if (!data.title || !data.value || data.value === "<p></p>") {
        toast.error("description is required field.");
        return;
      }
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
        <div className="fixed inset-0 min-h-screen text-gray-700 bg-black/30 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg w-[90%] max-w-[1000px] flex flex-col relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-600 hover:bg-gray-100 p-1 rounded-full"
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
                <label className="text-xl font-semibold mb-1">
                  Description
                </label>
                <Controller
                  name="value"
                  control={control}
                  render={({ field }) => (
                    <TextEditor
                      from={data?.title || "Heading"}
                      content={field.value || ""}
                      onChange={(value) => setValue("value", value)}
                    />
                  )}
                />
              </div>
              <div className="w-full flex items-center justify-end mr-12 gap-2">
                <Button
                  type="Secondary"
                  label="Cancel"
                  disabled={isLoading}
                  onClick={onClose}
                />
                <Button
                  buttonType="submit"
                  type="Primary"
                  label={data?.value ? "Save" : "Add"}
                  isLoading={isLoading}
                  disabled={isLoading}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EditHeadingModal;
