
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ExampleDownloads: React.FC = () => {
  const { toast } = useToast();
  
  const handleDownload = (language: string) => {
    toast({
      title: `${language} Example Downloaded`,
      description: `The ${language} example has been downloaded successfully.`,
    });
  };
  
  return (
    <Card className="bg-[#101010] border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Download Example Code</CardTitle>
        <CardDescription className="text-gray-400">
          Download code examples for various programming languages
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['Python', 'C#', 'C++', 'React', 'PHP'].map((language) => (
          <Button 
            key={language} 
            variant="outline" 
            className="bg-[#1a1a1a] border-gray-700 text-white hover:bg-blue-900 py-6"
            onClick={() => handleDownload(language)}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <Code className="w-6 h-6" />
              <div className="flex items-center">
                <span>{language}</span>
                <FileDown className="ml-2 w-4 h-4" />
              </div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default ExampleDownloads;
