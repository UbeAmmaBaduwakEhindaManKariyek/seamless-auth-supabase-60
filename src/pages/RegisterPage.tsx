
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRequiredFields, setShowRequiredFields] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateInputs = () => {
    if (!email || !username || !password || !confirmPassword || !supabaseUrl || !supabaseKey) {
      setRegistrationError('All fields are required');
      return false;
    }
    
    // Basic URL validation
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      setRegistrationError('Invalid Supabase URL format. It should be like https://your-project.supabase.co');
      return false;
    }
    
    // Basic key validation (should be non-empty and reasonably long)
    if (supabaseKey.length < 20) {
      setRegistrationError('Invalid Supabase API key format');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError('');
    
    if (!validatePassword()) return;
    if (!validateInputs()) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("Attempting to register with:", { email, username, password, supabaseUrl, supabaseKey });
      
      // First check if the user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('web_login_regz')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking for existing user:", checkError);
        setRegistrationError('An error occurred while checking for existing username');
        return;
      }
      
      if (existingUser) {
        setRegistrationError('Username already exists. Please choose another one.');
        return;
      }
      
      // Attempt to create the table if it doesn't exist
      try {
        const { error: tableCheckError } = await supabase
          .from('web_login_regz')
          .select('count', { count: 'exact', head: true });
        
        if (tableCheckError) {
          console.log("web_login_regz table might not exist, attempting to create it");
          
          const { error: createTableError } = await supabase.rpc('execute_sql', {
            sql_query: `
              CREATE TABLE IF NOT EXISTS web_login_regz (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                email TEXT NOT NULL,
                password TEXT NOT NULL,
                subscription_type TEXT NOT NULL,
                supabase_url TEXT,
                supabase_api_key TEXT,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
              )
            `
          });
          
          if (createTableError) {
            console.error("Failed to create web_login_regz table:", createTableError);
            setRegistrationError("Failed to create necessary database tables. Please contact support.");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking/creating web_login_regz table:", error);
      }
      
      // Insert the new user
      const { error: insertError } = await supabase
        .from('web_login_regz')
        .insert({
          username: username,
          email: email,
          password: password,
          subscription_type: 'user',
          supabase_url: supabaseUrl,
          supabase_api_key: supabaseKey
        });
      
      if (insertError) {
        console.error("Error inserting new user:", insertError);
        setRegistrationError(`Failed to create user account: ${insertError.message}`);
        return;
      }
      
      toast({
        title: "Registration successful",
        description: "Your account has been created successfully",
      });
      
      // Call the register function from AuthContext
      const success = await register({ 
        email, 
        username, 
        password,
        supabaseUrl,
        supabaseKey 
      });
      
      if (success) {
        navigate('/');
      } else {
        setRegistrationError('Registration successful but failed to log in automatically');
      }
    } catch (error) {
      console.error("Registration error:", error);
      setRegistrationError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212]">
      <Card className="w-[450px] max-w-[90%] bg-[#101010] border-[#2a2a2a]">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-white">Create an account</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {registrationError && (
              <Alert className="bg-red-900 border-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {registrationError}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-300">
                Username
              </label>
              <Input
                id="username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
              />
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="supabaseUrl" className="text-sm font-medium text-gray-300">
                Supabase URL
              </label>
              <Input
                id="supabaseUrl"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
              />
              <p className="text-xs text-gray-400">
                Example: https://tevmesjpsrsiuwswgzfb.supabase.co
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="supabaseKey" className="text-sm font-medium text-gray-300">
                Supabase API Key
              </label>
              <Input
                id="supabaseKey"
                placeholder="Your Supabase API Key"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                required
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
              />
              <p className="text-xs text-gray-400">
                Use the anon/public key from your Supabase project settings
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Register'}
            </Button>
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-500 hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
