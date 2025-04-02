
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Check } from 'lucide-react';
import { Application } from '@/types/applications';

interface ApplicationCredentialsProps {
  application: Application;
}

const ApplicationCredentials: React.FC<ApplicationCredentialsProps> = ({ application }) => {
  const [activeLanguage, setActiveLanguage] = useState<string>('JavaScript');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const CODE_EXAMPLES: Record<string, string> = {
    JavaScript: `
regzauthapp = api(
  name = "${application.name}",
  ownerid = "${application.owner_id}",
  version = "${application.version}",
  hash_to_check = getchecksum()
)`,
    Python: `
regzauthapp = api(
  name = "${application.name}",
  ownerid = "${application.owner_id}",
  version = "${application.version}",
  hash_to_check = getchecksum()
)`,
    CSharp: `
RegzAuthApp = new api(
  name: "${application.name}",
  ownerid: "${application.owner_id}",
  version: "${application.version}",
  hash_to_check: getchecksum()
);`,
    PHP: `
$RegzAuthApp = new api(
  name: "${application.name}",
  ownerid: "${application.owner_id}",
  version: "${application.version}",
  hash_to_check: getchecksum()
);`,
    Java: `
RegzAuthApp regzauthapp = new api(
  "${application.name}",
  "${application.owner_id}",
  "${application.version}",
  getchecksum()
);`,
    Ruby: `
regzauthapp = Api.new(
  name: "${application.name}",
  ownerid: "${application.owner_id}",
  version: "${application.version}",
  hash_to_check: getchecksum()
)`,
    Go: `
regzauthapp := api.New(
  "${application.name}",
  "${application.owner_id}",
  "${application.version}",
  getchecksum(),
)`,
  };

  const copyCredentials = () => {
    const code = CODE_EXAMPLES[activeLanguage];
      
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Application credentials have been copied",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const languages = Object.keys(CODE_EXAMPLES);

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold mb-2 text-white">Application Credentials</h3>
          <p className="text-gray-400">Simply replace the placeholder code in examples with these credentials</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {languages.map(language => (
            <Button
              key={language}
              variant={activeLanguage === language ? "default" : "outline"}
              className={`${
                activeLanguage === language 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
              }`}
              onClick={() => setActiveLanguage(language)}
            >
              {language}
            </Button>
          ))}
        </div>
        
        <div className="relative">
          <pre className="bg-black p-4 rounded-md text-green-400 overflow-x-auto">
            <code>
              {CODE_EXAMPLES[activeLanguage] || `// Example for ${activeLanguage} not available yet`}
            </code>
          </pre>
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-gray-300"
            onClick={copyCredentials}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="mt-6 bg-gray-800 p-4 rounded-md">
          <h4 className="text-lg font-semibold text-white mb-2">Application Details</h4>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
            <dt className="text-gray-400">Name:</dt>
            <dd className="text-white">{application.name}</dd>
            
            <dt className="text-gray-400">Owner ID:</dt>
            <dd className="text-white">{application.owner_id}</dd>
            
            <dt className="text-gray-400">Version:</dt>
            <dd className="text-white">{application.version}</dd>
            
            <dt className="text-gray-400">Secret:</dt>
            <dd className="text-white font-mono text-xs break-all">
              {application.app_secret}
            </dd>
            
            <dt className="text-gray-400">Status:</dt>
            <dd className="text-white">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                application.is_active ? 'bg-green-600 text-green-100' : 'bg-gray-700 text-gray-200'
              }`}>
                {application.is_active ? 'Active' : 'Paused'}
              </span>
            </dd>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationCredentials;
