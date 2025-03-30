
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface WebhookConfig {
  type: string;
  url: string;
  enabled: boolean;
}

const WebhooksPage: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    { type: 'login_logs', url: '', enabled: false },
    { type: 'login_details', url: '', enabled: false },
    { type: 'application_open', url: '', enabled: false }
  ]);
  
  const { toast } = useToast();
  
  const handleUrlChange = (index: number, url: string) => {
    const updatedWebhooks = [...webhooks];
    updatedWebhooks[index].url = url;
    setWebhooks(updatedWebhooks);
  };
  
  const handleEnabledChange = (index: number, enabled: boolean) => {
    const updatedWebhooks = [...webhooks];
    updatedWebhooks[index].enabled = enabled;
    setWebhooks(updatedWebhooks);
  };
  
  const handleSaveWebhook = (index: number) => {
    const webhook = webhooks[index];
    
    if (!webhook.url && webhook.enabled) {
      toast({
        title: "Invalid Webhook Configuration",
        description: "Please provide a valid Discord webhook URL",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Webhook Saved",
      description: `${webhook.type.replace('_', ' ')} webhook has been ${webhook.enabled ? 'enabled' : 'disabled'}`
    });
  };
  
  const getWebhookName = (type: string): string => {
    switch (type) {
      case 'login_logs':
        return 'Login Logs';
      case 'login_details':
        return 'Login Details';
      case 'application_open':
        return 'Application Open';
      default:
        return type;
    }
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Webhooks</h1>
        <p className="text-gray-400">Configure Discord webhook notifications</p>
      </div>
      
      <div className="space-y-6">
        {webhooks.map((webhook, index) => (
          <Card key={webhook.type} className="bg-[#101010] border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">{getWebhookName(webhook.type)}</CardTitle>
              <CardDescription className="text-gray-400">
                Send {getWebhookName(webhook.type).toLowerCase()} to a Discord channel via webhook
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor={`webhook-${webhook.type}`} className="text-sm font-medium text-gray-300">Discord Webhook URL</label>
                <Input 
                  id={`webhook-${webhook.type}`} 
                  placeholder="https://discord.com/api/webhooks/..." 
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  value={webhook.url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  This webhook will be triggered when a {webhook.type.replace('_', ' ')} event occurs.
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id={`webhook-enabled-${webhook.type}`}
                  checked={webhook.enabled}
                  onCheckedChange={(checked) => handleEnabledChange(index, checked)}
                />
                <Label htmlFor={`webhook-enabled-${webhook.type}`} className="text-gray-300">
                  Enable {getWebhookName(webhook.type)} notifications
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleSaveWebhook(index)} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Save {getWebhookName(webhook.type)} Webhook
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WebhooksPage;
