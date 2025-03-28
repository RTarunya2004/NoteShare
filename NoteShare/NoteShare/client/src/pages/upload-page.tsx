import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import FileUploader from "@/components/upload/FileUploader";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ALLOWED_FILE_TYPES } from "@shared/schema";

const uploadSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  pricing: z.enum(["free", "premium"]),
  coinPrice: z.number().min(1).optional(),
  previewPages: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  fileData: z.object({
    fileName: z.string(),
    fileSize: z.number(),
    fileType: z.string()
  }).optional()
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [fileData, setFileData] = useState<any>(null);
  
  const categories = [
    { value: "academic", label: "Academic" },
    { value: "technical", label: "Technical" },
    { value: "business", label: "Business" },
    { value: "creative", label: "Creative" },
    { value: "law", label: "Law & Politics" }
  ];
  
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      pricing: "free",
      tags: [],
    }
  });
  
  const watchPricing = form.watch("pricing");
  
  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormValues) => {
      const uploadData = {
        ...data,
        isPremium: data.pricing === "premium",
        tags,
        userId: user?.id
      };
      
      const res = await apiRequest("POST", "/api/notes", uploadData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Note uploaded successfully",
        description: "Your note has been uploaded and is now available."
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      // Redirect to home page
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };
  
  const handleFileUpload = (fileInfo: any) => {
    if (fileInfo) {
      // Set the file data in the form
      form.setValue("fileData", {
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
        fileType: fileInfo.type
      });
      setFileData(fileInfo);
    }
  };
  
  const onSubmit = (data: UploadFormValues) => {
    if (!fileData) {
      toast({
        title: "File required",
        description: "Please upload a file before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    const formData = {
      ...data,
      tags,
      fileData: {
        fileName: fileData.name,
        fileSize: fileData.size,
        fileType: fileData.type
      }
    };
    
    uploadMutation.mutate(formData);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Sidebar />
          
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Your Notes</h1>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Data Science Fundamentals" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Briefly describe your notes..." 
                            rows={3} 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pricing"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Pricing</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem value="free" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  Free
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <RadioGroupItem value="premium" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  Premium
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {watchPricing === "premium" && (
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <h3 className="font-medium text-gray-900">Premium Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="coinPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Coin Price</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={1} 
                                    placeholder="e.g., 15" 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    value={field.value}
                                  />
                                </FormControl>
                                <FormDescription>Recommended range: 5-50 coins</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="previewPages"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preview Pages</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={1}
                                    max={5}
                                    placeholder="e.g., 3" 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    value={field.value}
                                  />
                                </FormControl>
                                <FormDescription>Number of preview pages (1-5)</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md">
                      {tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeTag(tag)} 
                          />
                        </Badge>
                      ))}
                      <Input 
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        onBlur={addTag}
                        placeholder="Add a tag..."
                        className="flex-1 min-w-[100px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                      />
                    </div>
                    <FormDescription>Press Enter or comma to add a tag</FormDescription>
                  </FormItem>
                  
                  <FormItem>
                    <FormLabel>Upload File</FormLabel>
                    <FileUploader 
                      onFileUpload={handleFileUpload} 
                      allowedFileTypes={ALLOWED_FILE_TYPES}
                    />
                    <FormDescription>
                      Supported formats: PDF, DOCX, TXT, PPT, ZIP, CSV, XLSX, JSON, MD, LaTeX
                    </FormDescription>
                    {fileData && (
                      <div className="mt-2 text-sm text-gray-500">
                        Selected file: {fileData.name} ({(fileData.size / 1024).toFixed(1)} KB)
                      </div>
                    )}
                  </FormItem>
                  
                  <div className="flex justify-end space-x-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => navigate("/")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? (
                        <span className="flex items-center justify-center">
                          <i className="fas fa-spinner fa-spin mr-2"></i> Uploading...
                        </span>
                      ) : (
                        "Upload Notes"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
