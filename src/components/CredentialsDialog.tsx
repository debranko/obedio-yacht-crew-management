/**
 * Credentials Dialog
 * Shows generated username and password for new crew member
 * IMPORTANT: Credentials are only shown once!
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Copy, Check, AlertTriangle, Key, User } from 'lucide-react';
import { toast } from 'sonner';

interface CredentialsDialogProps {
  open: boolean;
  onClose: () => void;
  credentials: {
    username: string;
    password: string;
    crewMemberName: string;
  };
}

export function CredentialsDialog({ open, onClose, credentials }: CredentialsDialogProps) {
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const copyToClipboard = async (text: string, type: 'username' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'username') {
        setCopiedUsername(true);
        setTimeout(() => setCopiedUsername(false), 2000);
      } else {
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      }
      
      toast.success(`${type === 'username' ? 'Username' : 'Password'} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Account Created Successfully
          </DialogTitle>
          <DialogDescription>
            Login credentials for <span className="font-semibold">{credentials.crewMemberName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <strong>Important:</strong> Save these credentials now! They will not be shown again.
            </AlertDescription>
          </Alert>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Username
            </Label>
            <div className="flex gap-2">
              <Input
                id="username"
                value={credentials.username}
                readOnly
                className="font-mono"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(credentials.username, 'username')}
              >
                {copiedUsername ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Temporary Password
            </Label>
            <div className="flex gap-2">
              <Input
                id="password"
                value={credentials.password}
                readOnly
                className="font-mono"
                type="text"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(credentials.password, 'password')}
              >
                {copiedPassword ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The crew member should change this password after first login.
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">Next Steps:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Copy and save these credentials securely</li>
              <li>Share them with <strong>{credentials.crewMemberName}</strong> privately</li>
              <li>They can login at the Obedio login page</li>
              <li>Recommend changing password after first login</li>
            </ol>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            I've Saved the Credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
